const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
let compression;
try {
    compression = require('compression');
} catch (e) {
    console.warn('compression not installed, continuing without it');
    compression = () => (req, res, next) => next();
}

// Import enhanced embedder and automation features
const ProxyPoolManager = require('./middleware/proxy-pool-simple');
const ParallelEmbeddingEngine = require('./middleware/parallel-embedding-simple');
const GrandAutomationEngine = require('./middleware/grand-automation-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize parallel embedding system
const proxyPool = new ProxyPoolManager({
    maxProxies: 10000,
    timeout: 10000
});

const embeddingEngine = new ParallelEmbeddingEngine(proxyPool, {
    maxConcurrentEmbeddings: 10000,
    batchSize: 100
});

const automationEngine = new GrandAutomationEngine(embeddingEngine, {
    maxConcurrentAutomations: 100000,
    batchSize: 1000,
    realTimeThreshold: 100
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Compression for better performance
app.use(compression());

// Serve static files with cache control
app.use(
    express.static(path.join(__dirname, 'public'), {
        etag: true,
        lastModified: true,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
            // Long cache for images; moderate for CSS/JS
            if (/(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (/(\.css|\.js)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
            }
        }
    })
);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load blog posts
let posts = [];
try {
    const postsPath = path.join(__dirname, 'data', 'posts.json');
    if (fs.existsSync(postsPath)) {
        posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    }
} catch (e) {
    console.error('Failed to load posts:', e);
}

// Helper: default meta
const withMeta = (overrides = {}) => ({
    meta: {
        description: '42Web.io delivers modern web, mobile, and cloud solutions that help businesses grow.',
        canonical: '',
        ogImage: '/images/og-default.png',
        type: 'website',
        ...overrides
    }
});

// Initialize systems
async function initializeSystems() {
    try {
        await proxyPool.initialize();
        await embeddingEngine.start();
        await automationEngine.start();
        console.log('🚀 All systems initialized successfully');
    } catch (error) {
        console.error('Failed to initialize systems:', error);
    }
}

// Initialize systems on startup
initializeSystems();

// Enhanced API endpoints for massive scale embedding and automation

// Batch embedding endpoint - embed multiple websites in parallel
app.post('/api/embed/batch', async (req, res) => {
    try {
        const { urls, options = {} } = req.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ 
                error: 'URLs array is required',
                example: { urls: ['https://example.com', 'https://github.com'] }
            });
        }

        if (urls.length > 10000) {
            return res.status(400).json({ 
                error: 'Maximum 10,000 URLs per batch request' 
            });
        }

        console.log(`📦 Processing batch embedding for ${urls.length} URLs...`);
        
        const result = await embeddingEngine.embedBatch(urls, options);
        
        res.json({
            success: true,
            message: `Successfully processed batch of ${urls.length} websites`,
            batchId: result.batchId,
            summary: {
                total: result.total,
                completed: result.completed,
                failed: result.failed,
                processingTime: result.processingTime
            },
            results: result.results
        });
        
    } catch (error) {
        console.error('Batch embedding error:', error);
        res.status(500).json({ 
            error: 'Failed to process batch embedding',
            details: error.message 
        });
    }
});

// Single website embedding endpoint
app.post('/api/embed/single', async (req, res) => {
    try {
        const { url, options = {} } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'URL is required',
                example: { url: 'https://example.com' }
            });
        }

        console.log(`🌐 Processing single website embedding: ${url}`);
        
        const result = await embeddingEngine.embedWebsite(url, options);
        
        if (result.success) {
            res.json({
                success: true,
                embeddingId: result.embeddingId,
                content: result.content,
                processingTime: result.processingTime
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                embeddingId: result.embeddingId
            });
        }
        
    } catch (error) {
        console.error('Single embedding error:', error);
        res.status(500).json({ 
            error: 'Failed to process embedding',
            details: error.message 
        });
    }
});

// Get batch status
app.get('/api/embed/batch/:batchId/status', (req, res) => {
    try {
        const { batchId } = req.params;
        const batchStatus = embeddingEngine.getBatchStatus(batchId);
        
        if (!batchStatus) {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.json({
            batchId,
            status: batchStatus.status,
            progress: {
                total: batchStatus.total,
                completed: batchStatus.completed,
                failed: batchStatus.failed,
                percentage: Math.round((batchStatus.completed / batchStatus.total) * 100)
            },
            processingTime: batchStatus.processingTime,
            startTime: batchStatus.startTime
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system stats
app.get('/api/stats', (req, res) => {
    try {
        const embeddingStats = embeddingEngine.getStats();
        const proxyStats = proxyPool.getStats();
        
        res.json({
            timestamp: new Date().toISOString(),
            embedding: embeddingStats,
            proxy: proxyStats,
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create massive automation config for 1M+ websites
app.post('/api/automation/massive', async (req, res) => {
    try {
        const { baseUrl, count = 1000, options = {} } = req.body;
        
        if (!baseUrl) {
            return res.status(400).json({ 
                error: 'Base URL is required',
                example: { baseUrl: 'https://example.com', count: 1000000 }
            });
        }

        if (count > 1000000) {
            return res.status(400).json({ 
                error: 'Maximum 1,000,000 URLs per automation config' 
            });
        }

        console.log(`🎛️ Creating massive automation config for ${count} URLs from ${baseUrl}...`);
        
        const config = await embeddingEngine.createMassiveAutomationConfig(baseUrl, count, options);
        
        res.json({
            success: true,
            message: `Automation config created for ${count} websites`,
            config: config.config,
            preview: config.urls,
            totalGenerated: config.totalGenerated,
            estimatedProcessingTime: config.estimatedProcessingTime
        });
        
    } catch (error) {
        console.error('Massive automation config error:', error);
        res.status(500).json({ 
            error: 'Failed to create automation config',
            details: error.message 
        });
    }
});

// Create automation session
app.post('/api/automation/sessions', async (req, res) => {
    try {
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({ 
                error: 'Automation config is required',
                example: { 
                    config: { 
                        baseUrl: 'https://example.com', 
                        count: 1000, 
                        pattern: 'sequential' 
                    } 
                }
            });
        }

        console.log(`🤖 Creating automation session...`);
        
        const result = await automationEngine.createMassiveAutomationSession(config);
        
        res.json({
            success: true,
            message: 'Automation session created successfully',
            sessionId: result.sessionId,
            status: result.status,
            websiteCount: result.websiteCount,
            estimatedDuration: result.estimatedDuration
        });
        
    } catch (error) {
        console.error('Automation session creation error:', error);
        res.status(500).json({ 
            error: 'Failed to create automation session',
            details: error.message 
        });
    }
});

// Start automation session
app.post('/api/automation/sessions/:sessionId/start', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { options = {} } = req.body;
        
        console.log(`🚀 Starting automation session ${sessionId}...`);
        
        const result = await automationEngine.startAutomationSession(sessionId, options);
        
        res.json({
            success: true,
            message: 'Automation session started successfully',
            sessionId: result.sessionId,
            status: result.status
        });
        
    } catch (error) {
        console.error('Automation session start error:', error);
        res.status(500).json({ 
            error: 'Failed to start automation session',
            details: error.message 
        });
    }
});

// Execute real-time command across all websites
app.post('/api/automation/sessions/:sessionId/commands', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { command } = req.body;
        
        if (!command || !command.type) {
            return res.status(400).json({ 
                error: 'Command with type is required',
                example: { 
                    command: { 
                        type: 'click', 
                        selector: '#button' 
                    } 
                }
            });
        }

        console.log(`⚡ Executing real-time command ${command.type} across session ${sessionId}...`);
        
        const result = await automationEngine.executeRealTimeCommand(sessionId, command);
        
        res.json({
            success: true,
            message: `Command executed across all websites in session`,
            commandId: result.commandId,
            status: result.status,
            resultsCount: result.resultsCount,
            failedCount: result.failedCount,
            processingTime: result.processingTime
        });
        
    } catch (error) {
        console.error('Real-time command execution error:', error);
        res.status(500).json({ 
            error: 'Failed to execute real-time command',
            details: error.message 
        });
    }
});

// Get automation session status
app.get('/api/automation/sessions/:sessionId/status', (req, res) => {
    try {
        const { sessionId } = req.params;
        const status = automationEngine.getSessionStatus(sessionId);
        
        if (!status) {
            return res.status(404).json({ error: 'Automation session not found' });
        }
        
        res.json({
            success: true,
            sessionId,
            status: status.status,
            websiteCount: status.websiteCount,
            completedCount: status.completedCount,
            failedCount: status.failedCount,
            activeControls: status.activeControls,
            commandHistory: status.commandHistory,
            uptime: status.uptime
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get automation engine stats
app.get('/api/automation/stats', (req, res) => {
    try {
        const automationStats = automationEngine.getStats();
        
        res.json({
            timestamp: new Date().toISOString(),
            automation: automationStats
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: '42Web.io - Tech Solutions',
        currentPage: 'home',
        ...withMeta({
            description: 'Cutting-edge web, mobile, and cloud solutions. Partner with 42Web.io to build, scale, and ship fast.',
            canonical: req.protocol + '://' + req.get('host') + '/',
            ogTitle: '42Web.io - Tech Solutions',
            ogDescription: 'Cutting-edge web, mobile, and cloud solutions.',
        })
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About - 42Web.io',
        currentPage: 'about',
        ...withMeta({
            description: 'Learn about 42Web.io—our mission, values, and team building the future of tech.',
            canonical: req.protocol + '://' + req.get('host') + '/about'
        })
    });
});

app.get('/services', (req, res) => {
    res.render('services', {
        title: 'Services - 42Web.io',
        currentPage: 'services',
        ...withMeta({
            description: 'Web development, mobile apps, cloud solutions, UI/UX, security, and DevOps by 42Web.io.',
            canonical: req.protocol + '://' + req.get('host') + '/services'
        })
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        ...withMeta({
            description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
            canonical: req.protocol + '://' + req.get('host') + '/contact'
        })
    });
});

app.get('/embed', (req, res) => {
    res.render('embed-enhanced', {
        title: 'Advanced Website Embedder - 42Web.io',
        currentPage: 'embed',
        ...withMeta({
            description: 'Embed 1M+ websites with parallel processing and grand automation controls.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    });
});

// Proxy route for website embedding
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Validate URL
    try {
        new URL(targetUrl);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL provided' });
    }
    
    // Security check - prevent access to internal networks (allow localhost for testing)
    const url = new URL(targetUrl);
    const isTestingMode = process.env.NODE_ENV !== 'production';
    if (!isTestingMode && (url.hostname === 'localhost' || 
        url.hostname === '127.0.0.1' || 
        url.hostname.startsWith('192.168.') ||
        url.hostname.startsWith('10.') ||
        url.hostname.startsWith('172.'))) {
        return res.status(403).json({ error: 'Access to internal networks is not allowed' });
    }
    
    try {
        // Set headers to mimic a real browser
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000,
            maxRedirects: 5
        });
        
        // Get the base URL for relative links
        const baseUrl = new URL(targetUrl);
        const baseHref = `${baseUrl.protocol}//${baseUrl.host}`;
        
        // Parse and modify HTML
        const $ = cheerio.load(response.data);
        
        // Remove potentially problematic elements
        $('script').each(function() {
            const src = $(this).attr('src');
            // Only remove scripts that might interfere with embedding
            if (!src || src.includes('analytics') || src.includes('gtag') || src.includes('facebook') || src.includes('twitter')) {
                $(this).remove();
            }
        });
        
        // Fix relative URLs
        $('a').each(function() {
            const href = $(this).attr('href');
            if (href && href.startsWith('/')) {
                $(this).attr('href', baseHref + href);
            } else if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
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
        
        // Add base tag to help with relative URLs
        $('head').prepend(`<base href="${baseHref}/">`);
        
        // Add some basic styling to make it look embedded
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
        $('body').prepend('<div class="embedded-notice">📎 This website is being displayed through 42Web.io proxy</div>');
        
        // Set appropriate content type
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        
        // Send the modified HTML
        res.send($.html());
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        
        let errorMessage = 'Failed to load the website';
        if (error.code === 'ENOTFOUND') {
            errorMessage = 'Website not found or unreachable';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused by the website';
        } else if (error.response) {
            errorMessage = `Website returned ${error.response.status} error`;
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout - website took too long to respond';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
});

// Handle contact form submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // In a real app, you'd save this to a database or send an email
    console.log('Contact form submission:', { name, email, message });
    
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        success: 'Thank you for your message! We\'ll get back to you soon.',
        ...withMeta({
            description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
            canonical: req.protocol + '://' + req.get('host') + '/contact'
        })
    });
});

// Blog routes
app.get('/blog', (req, res) => {
    res.render('blog', {
        title: 'Blog - 42Web.io',
        currentPage: 'blog',
        posts,
        ...withMeta({
            description: 'Insights, tutorials, and updates from the 42Web.io team.',
            canonical: req.protocol + '://' + req.get('host') + '/blog'
        })
    });
});

app.get('/blog/:slug', (req, res) => {
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) {
        return res.status(404).render('404', { title: '404 - Page Not Found' });
    }
    res.render('blog-post', {
        title: `${post.title} - 42Web.io`,
        currentPage: 'blog',
        post,
        ...withMeta({
            description: post.excerpt || post.title,
            canonical: req.protocol + '://' + req.get('host') + '/blog/' + post.slug,
            ogTitle: post.title,
            ogDescription: post.excerpt || post.title,
            type: 'article'
        })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found',
        currentPage: '404',
        ...withMeta({
            description: 'Page not found'
        })
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error - Something went wrong',
        currentPage: 'error',
        ...withMeta({
            description: 'An error occurred'
        })
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
