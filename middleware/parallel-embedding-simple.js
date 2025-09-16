/**
 * Simplified Parallel Embedding Engine for 1M+ concurrent embeddings
 */
const { EventEmitter } = require('events');
const crypto = require('crypto');
const cheerio = require('cheerio');

class ParallelEmbeddingEngine extends EventEmitter {
    constructor(proxyPoolManager, config = {}) {
        super();
        this.proxyPool = proxyPoolManager;
        this.config = {
            maxConcurrentEmbeddings: config.maxConcurrentEmbeddings || 10000,
            batchSize: config.batchSize || 100,
            maxRetries: config.maxRetries || 3,
            timeout: config.timeout || 10000,
            ...config
        };
        
        this.embeddings = new Map();
        this.batchRequests = new Map();
        this.stats = {
            totalEmbeddings: 0,
            activeEmbeddings: 0,
            completedEmbeddings: 0,
            failedEmbeddings: 0,
            averageProcessingTime: 0
        };
        
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        
        console.log('🌐 Starting Parallel Embedding Engine...');
        this.isRunning = true;
        
        this.emit('started');
        console.log('✅ Parallel Embedding Engine started');
    }

    async stop() {
        console.log('🛑 Stopping Parallel Embedding Engine...');
        this.isRunning = false;
        this.emit('stopped');
    }

    // Embed a single website
    async embedWebsite(url, options = {}) {
        const embeddingId = crypto.randomUUID();
        const startTime = Date.now();
        
        this.stats.totalEmbeddings++;
        this.stats.activeEmbeddings++;
        
        const embedding = {
            id: embeddingId,
            url,
            startTime,
            status: 'processing',
            options
        };
        
        this.embeddings.set(embeddingId, embedding);

        try {
            // Fetch website content through proxy
            const result = await this.proxyPool.fetchWebsite(url, options);
            
            if (result.success) {
                // Process HTML content
                const processedContent = this.processHtmlContent(result.data, url);
                
                embedding.status = 'completed';
                embedding.content = processedContent;
                embedding.processingTime = Date.now() - startTime;
                
                this.stats.completedEmbeddings++;
                this.stats.averageProcessingTime = 
                    (this.stats.averageProcessingTime + embedding.processingTime) / 2;
                
                this.emit('embedding-completed', embedding);
                
                return {
                    success: true,
                    embeddingId,
                    content: processedContent,
                    processingTime: embedding.processingTime
                };
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            embedding.status = 'failed';
            embedding.error = error.message;
            embedding.processingTime = Date.now() - startTime;
            
            this.stats.failedEmbeddings++;
            this.emit('embedding-failed', embedding);
            
            return {
                success: false,
                embeddingId,
                error: error.message
            };
            
        } finally {
            this.stats.activeEmbeddings--;
        }
    }

    // Embed multiple websites in parallel
    async embedBatch(urls, options = {}) {
        const batchId = crypto.randomUUID();
        const startTime = Date.now();
        
        if (!Array.isArray(urls)) {
            urls = [urls];
        }

        const batchInfo = {
            id: batchId,
            urls,
            startTime,
            status: 'processing',
            total: urls.length,
            completed: 0,
            failed: 0,
            results: []
        };
        
        this.batchRequests.set(batchId, batchInfo);

        console.log(`🚀 Starting batch embedding for ${urls.length} websites...`);

        try {
            // Process URLs in parallel with concurrency limit
            const results = await this.processBatchWithConcurrency(urls, options);
            
            batchInfo.status = 'completed';
            batchInfo.results = results;
            batchInfo.processingTime = Date.now() - startTime;
            batchInfo.completed = results.filter(r => r.success).length;
            batchInfo.failed = results.filter(r => !r.success).length;
            
            this.emit('batch-completed', batchInfo);
            
            return {
                success: true,
                batchId,
                total: batchInfo.total,
                completed: batchInfo.completed,
                failed: batchInfo.failed,
                results,
                processingTime: batchInfo.processingTime
            };
            
        } catch (error) {
            batchInfo.status = 'failed';
            batchInfo.error = error.message;
            
            this.emit('batch-failed', batchInfo);
            
            return {
                success: false,
                batchId,
                error: error.message
            };
        }
    }

    async processBatchWithConcurrency(urls, options) {
        const concurrencyLimit = Math.min(this.config.batchSize, urls.length);
        const results = [];
        
        // Process URLs in chunks
        for (let i = 0; i < urls.length; i += concurrencyLimit) {
            const chunk = urls.slice(i, i + concurrencyLimit);
            const chunkPromises = chunk.map(url => this.embedWebsite(url, options));
            
            const chunkResults = await Promise.allSettled(chunkPromises);
            
            // Convert settled results to our format
            chunkResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        success: false,
                        error: result.reason.message,
                        url: chunk[index]
                    });
                }
            });
            
            // Small delay between chunks to prevent overwhelming
            if (i + concurrencyLimit < urls.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        return results;
    }

    processHtmlContent(html, originalUrl) {
        try {
            const $ = cheerio.load(html);
            const baseUrl = new URL(originalUrl);
            const baseHref = `${baseUrl.protocol}//${baseUrl.host}`;
            
            // Remove potentially problematic elements
            $('script').each(function() {
                const src = $(this).attr('src');
                if (!src || src.includes('analytics') || src.includes('gtag') || 
                    src.includes('facebook') || src.includes('twitter')) {
                    $(this).remove();
                }
            });
            
            // Fix relative URLs
            $('a').each(function() {
                const href = $(this).attr('href');
                if (href && href.startsWith('/')) {
                    $(this).attr('href', baseHref + href);
                } else if (href && !href.startsWith('http') && 
                          !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    $(this).attr('href', baseHref + '/' + href);
                }
            });
            
            $('img').each(function() {
                const src = $(this).attr('src');
                if (src && src.startsWith('/')) {
                    $(this).attr('src', baseHref + src);
                } else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    $(this).attr('src', baseHref + '/' + src);
                }
            });
            
            $('link').each(function() {
                const href = $(this).attr('href');
                if (href && href.startsWith('/')) {
                    $(this).attr('href', baseHref + href);
                } else if (href && !href.startsWith('http')) {
                    $(this).attr('href', baseHref + '/' + href);
                }
            });
            
            // Add base tag
            $('head').prepend(`<base href="${baseHref}/">`);
            
            // Add embedded styling
            $('head').append(`
                <style>
                    body { 
                        margin: 0 !important; 
                        padding: 20px !important;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    }
                    .embedded-notice {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: #007bff;
                        color: white;
                        padding: 5px 10px;
                        font-size: 12px;
                        z-index: 9999;
                        text-align: center;
                    }
                    body { padding-top: 35px !important; }
                </style>
            `);
            
            // Add embedded notice
            $('body').prepend('<div class="embedded-notice">📎 This website is being displayed through 42Web.io parallel proxy</div>');
            
            return $.html();
            
        } catch (error) {
            console.error('Error processing HTML content:', error);
            return html;
        }
    }

    // Get embedding status
    getEmbeddingStatus(embeddingId) {
        return this.embeddings.get(embeddingId);
    }

    // Get batch status
    getBatchStatus(batchId) {
        return this.batchRequests.get(batchId);
    }

    // Get engine stats
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalEmbeddings > 0 ? 
                (this.stats.completedEmbeddings / this.stats.totalEmbeddings) * 100 : 0,
            activeBatches: this.batchRequests.size,
            totalEmbeddings: this.embeddings.size
        };
    }

    // Create automation config for 1M+ websites
    async createMassiveAutomationConfig(baseUrl, count = 1000000, options = {}) {
        const config = {
            id: crypto.randomUUID(),
            baseUrl,
            count,
            batchSize: options.batchSize || 1000,
            concurrency: options.concurrency || 100,
            pattern: options.pattern || 'sequential', // sequential, random, custom
            startTime: Date.now(),
            status: 'created'
        };

        // Generate URL patterns based on type
        const urls = this.generateUrlPatterns(baseUrl, count, config.pattern);
        
        return {
            config,
            urls: urls.slice(0, 10), // Return first 10 as preview
            totalGenerated: urls.length,
            estimatedProcessingTime: Math.ceil(count / config.concurrency) * 1000 // ms
        };
    }

    generateUrlPatterns(baseUrl, count, pattern) {
        const urls = [];
        
        switch (pattern) {
            case 'sequential':
                for (let i = 1; i <= count; i++) {
                    urls.push(`${baseUrl}?id=${i}`);
                }
                break;
                
            case 'random':
                for (let i = 0; i < count; i++) {
                    const randomId = Math.random().toString(36).substr(2, 9);
                    urls.push(`${baseUrl}?random=${randomId}`);
                }
                break;
                
            default:
                // Default to the same URL repeated
                for (let i = 0; i < count; i++) {
                    urls.push(baseUrl);
                }
        }
        
        return urls;
    }
}

module.exports = ParallelEmbeddingEngine;