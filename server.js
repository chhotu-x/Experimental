const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const helmet = require('helmet');

// Import performance middleware
const {
    pageCache,
    proxyCache,
    compressionMiddleware,
    cacheMiddleware,
    proxyRateLimit,
    contactRateLimit,
    securityHeaders,
    responseTimeMiddleware
} = require('./middleware/performance');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Performance and security middleware
app.use(responseTimeMiddleware);
app.use(compressionMiddleware);
app.use(helmet({
    contentSecurityPolicy: false, // We'll handle CSP manually for proxy routes
    crossOriginEmbedderPolicy: false // Allow embedding
}));
app.use(securityHeaders);

// Serve static files with enhanced cache control
app.use(
    express.static(path.join(__dirname, 'public'), {
        etag: true,
        lastModified: true,
        maxAge: '30d', // Increased cache duration
        setHeaders: (res, filePath) => {
            // Aggressive caching for images and fonts
            if (/(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp|\.ico|\.woff|\.woff2|\.ttf|\.eot)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (/(\.css|\.js)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for CSS/JS
            } else if (/(\.html|\.htm)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
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

// Routes with caching
app.get('/', cacheMiddleware(600), (req, res) => {
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

app.get('/about', cacheMiddleware(1800), (req, res) => {
    res.render('about', {
        title: 'About - 42Web.io',
        currentPage: 'about',
        ...withMeta({
            description: 'Learn about 42Web.io—our mission, values, and team building the future of tech.',
            canonical: req.protocol + '://' + req.get('host') + '/about'
        })
    });
});

app.get('/services', cacheMiddleware(1800), (req, res) => {
    res.render('services', {
        title: 'Services - 42Web.io',
        currentPage: 'services',
        ...withMeta({
            description: 'Web development, mobile apps, cloud solutions, UI/UX, security, and DevOps by 42Web.io.',
            canonical: req.protocol + '://' + req.get('host') + '/services'
        })
    });
});
app.get('/contact', cacheMiddleware(900), (req, res) => {
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        ...withMeta({
            description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
            canonical: req.protocol + '://' + req.get('host') + '/contact'
        })
    });
});

app.get('/embed', cacheMiddleware(600), (req, res) => {
    res.render('embed', {
        title: 'Website Embedder - 42Web.io',
        currentPage: 'embed',
        ...withMeta({
            description: 'Embed any website with full navigation capabilities and enhanced features.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    });
});

// Enhanced proxy route for website embedding with caching and rate limiting
app.get('/proxy', proxyRateLimit, async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Check cache first
    const cacheKey = `proxy:${targetUrl}`;
    const cached = proxyCache.get(cacheKey);
    if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(cached);
    }
    
    // Validate URL
    try {
        new URL(targetUrl);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL provided' });
    }
    
    // Enhanced security check
    const url = new URL(targetUrl);
    const isTestingMode = process.env.NODE_ENV !== 'production';
    
    // Block dangerous protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(403).json({ error: 'Only HTTP and HTTPS URLs are allowed' });
    }
    
    // Block internal networks (allow localhost for testing)
    if (!isTestingMode && (
        url.hostname === 'localhost' || 
        url.hostname === '127.0.0.1' || 
        url.hostname.startsWith('192.168.') ||
        url.hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url.hostname) ||
        url.hostname.endsWith('.local')
    )) {
        return res.status(403).json({ error: 'Access to internal networks is not allowed' });
    }
    
    try {
        // Enhanced headers to mimic a real browser
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            timeout: 15000, // Increased timeout
            maxRedirects: 10,
            maxContentLength: 50 * 1024 * 1024, // 50MB limit
        });
        
        // Get the base URL for relative links
        const baseUrl = new URL(targetUrl);
        const baseHref = `${baseUrl.protocol}//${baseUrl.host}`;
        
        // Parse and enhance HTML
        const $ = cheerio.load(response.data);
        
        // Remove potentially problematic elements and scripts
        $('script').each(function() {
            const src = $(this).attr('src');
            const content = $(this).html();
            
            // Remove tracking, analytics, and potentially harmful scripts
            if (src && (
                src.includes('analytics') || 
                src.includes('gtag') || 
                src.includes('facebook') || 
                src.includes('twitter') ||
                src.includes('googletagmanager') ||
                src.includes('doubleclick') ||
                src.includes('googlesyndication')
            )) {
                $(this).remove();
            } else if (content && (
                content.includes('gtag') ||
                content.includes('ga(') ||
                content.includes('_gaq') ||
                content.includes('fbq(')
            )) {
                $(this).remove();
            }
        });
        
        // Remove tracking iframes and objects
        $('iframe, object, embed').each(function() {
            const src = $(this).attr('src');
            if (src && (
                src.includes('google') ||
                src.includes('facebook') ||
                src.includes('twitter') ||
                src.includes('analytics')
            )) {
                $(this).remove();
            }
        });
        
        // Enhanced URL fixing
        $('a').each(function() {
            const href = $(this).attr('href');
            if (href) {
                if (href.startsWith('/')) {
                    $(this).attr('href', baseHref + href);
                } else if (href.startsWith('./')) {
                    $(this).attr('href', baseHref + '/' + href.substring(2));
                } else if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
                    $(this).attr('href', baseHref + '/' + href);
                }
                
                // Add target="_blank" for external links
                if (href.startsWith('http') && !href.includes(baseUrl.host)) {
                    $(this).attr('target', '_blank');
                    $(this).attr('rel', 'noopener noreferrer');
                }
            }
        });
        
        // Enhanced image URL fixing
        $('img').each(function() {
            const src = $(this).attr('src');
            if (src) {
                if (src.startsWith('/')) {
                    $(this).attr('src', baseHref + src);
                } else if (src.startsWith('./')) {
                    $(this).attr('src', baseHref + '/' + src.substring(2));
                } else if (!src.startsWith('http') && !src.startsWith('data:')) {
                    $(this).attr('src', baseHref + '/' + src);
                }
                
                // Add loading="lazy" for better performance
                $(this).attr('loading', 'lazy');
            }
        });
        
        // Fix CSS and other resource URLs
        $('link').each(function() {
            const href = $(this).attr('href');
            if (href) {
                if (href.startsWith('/')) {
                    $(this).attr('href', baseHref + href);
                } else if (href.startsWith('./')) {
                    $(this).attr('href', baseHref + '/' + href.substring(2));
                } else if (!href.startsWith('http')) {
                    $(this).attr('href', baseHref + '/' + href);
                }
            }
        });
        
        // Add base tag to help with relative URLs
        $('head').prepend(`<base href="${baseHref}/">`);
        
        // Enhanced styling and features
        $('head').append(`
            <style>
                /* Enhanced embedded styling */
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
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    padding: 8px 15px;
                    font-size: 13px;
                    z-index: 9999;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(0,123,255,0.3);
                    backdrop-filter: blur(10px);
                }
                
                .embedded-notice a {
                    color: #ffc107 !important;
                    text-decoration: none !important;
                    font-weight: 600;
                }
                
                .embedded-notice a:hover {
                    color: #fff3cd !important;
                }
                
                body { 
                    padding-top: 45px !important; 
                }
                
                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }
                
                /* Enhanced readability */
                body {
                    line-height: 1.6 !important;
                }
                
                /* Loading indicator for images */
                img {
                    transition: opacity 0.3s ease;
                }
                
                img[loading="lazy"] {
                    opacity: 0;
                }
                
                img[loading="lazy"].loaded {
                    opacity: 1;
                }
            </style>
            
            <script>
                // Enhanced functionality for embedded content
                document.addEventListener('DOMContentLoaded', function() {
                    // Handle lazy loaded images
                    const images = document.querySelectorAll('img[loading="lazy"]');
                    images.forEach(img => {
                        if (img.complete) {
                            img.classList.add('loaded');
                        } else {
                            img.addEventListener('load', () => {
                                img.classList.add('loaded');
                            });
                        }
                    });
                    
                    // Smooth scrolling for anchors
                    const anchorLinks = document.querySelectorAll('a[href^="#"]');
                    anchorLinks.forEach(link => {
                        link.addEventListener('click', function(e) {
                            const target = document.querySelector(this.getAttribute('href'));
                            if (target) {
                                e.preventDefault();
                                target.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    });
                    
                    // Print function
                    window.printEmbedded = function() {
                        window.print();
                    };
                    
                    // Copy URL function
                    window.copyEmbeddedUrl = function() {
                        navigator.clipboard.writeText('${targetUrl}').then(() => {
                            alert('URL copied to clipboard!');
                        });
                    };
                });
            </script>
        `);
        
        // Enhanced embedded notice with more features
        $('body').prepend(`
            <div class="embedded-notice">
                🌐 Embedded via <a href="/" target="_blank">42Web.io</a> 
                | <a href="${targetUrl}" target="_blank">Original Site</a>
                | <a href="javascript:copyEmbeddedUrl()">Copy URL</a>
                | <a href="javascript:printEmbedded()">Print</a>
            </div>
        `);
        
        const processedHtml = $.html();
        
        // Cache the processed content
        proxyCache.set(cacheKey, processedHtml);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Content-Source', 'proxy');
        
        // Send the enhanced HTML
        res.send(processedHtml);
        
    } catch (error) {
        console.error('Enhanced proxy error:', error.message);
        
        let errorMessage = 'Failed to load the website';
        let statusCode = 500;
        let suggestions = [];
        let userFriendlyCode = 'UNKNOWN_ERROR';
        
        if (error.code === 'ENOTFOUND') {
            // For DNS errors, provide a demo fallback for certain popular sites
            const fallbackContent = generateFallbackContent(targetUrl);
            if (fallbackContent) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('X-Cache', 'FALLBACK');
                res.setHeader('X-Content-Source', 'demo-fallback');
                return res.send(fallbackContent);
            }
            
            errorMessage = 'Website not found or DNS resolution failed';
            statusCode = 404;
            userFriendlyCode = 'DNS_ERROR';
            suggestions = [
                'This environment has DNS restrictions - external sites may not load',
                'Try the local demo pages (Homepage, About, Services) for full functionality',
                'Click "Demo Mode" below to see how the embedder works with sample content',
                'External websites require different network configuration'
            ];
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused by the website';
            statusCode = 502;
            userFriendlyCode = 'CONNECTION_REFUSED';
            suggestions = [
                'The website might be blocking proxy requests',
                'Server might be down or overloaded',
                'Try again in a few minutes',
                'Visit the original website to check if it\'s accessible'
            ];
        } else if (error.response) {
            statusCode = error.response.status;
            errorMessage = `Website returned ${error.response.status} error`;
            userFriendlyCode = `HTTP_${error.response.status}`;
            
            if (error.response.status === 403) {
                errorMessage = 'Access denied by the website';
                suggestions = [
                    'The website is blocking proxy access',
                    'Try a different website',
                    'Some sites block automated requests for security'
                ];
            } else if (error.response.status === 404) {
                errorMessage = 'Page not found on the website';
                suggestions = [
                    'Check if the URL path is correct',
                    'The page might have been moved or deleted',
                    'Try the website\'s homepage instead'
                ];
            } else if (error.response.status >= 500) {
                suggestions = [
                    'The website is experiencing server issues',
                    'Try again in a few minutes',
                    'Contact the website administrator if the issue persists'
                ];
            }
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timeout - website took too long to respond';
            statusCode = 504;
            userFriendlyCode = 'TIMEOUT';
            suggestions = [
                'The website is responding slowly',
                'Try again in a few moments',
                'Try a faster loading website',
                'Check your network connection'
            ];
        } else if (error.code === 'EMSGSIZE') {
            errorMessage = 'Website content is too large to embed';
            statusCode = 413;
            userFriendlyCode = 'CONTENT_TOO_LARGE';
            suggestions = [
                'The website has too much content to display',
                'Try a simpler website',
                'Visit the original site for full content'
            ];
        } else if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection was reset by the website';
            statusCode = 502;
            userFriendlyCode = 'CONNECTION_RESET';
            suggestions = [
                'The website terminated the connection',
                'The site might have anti-bot protection',
                'Try a different URL or website'
            ];
        }
        
        // Add general suggestions if none were provided
        if (suggestions.length === 0) {
            suggestions = [
                'Try a different website',
                'Check if the URL is correct',
                'Refresh the page and try again'
            ];
        }
        
        // Add environment-specific notice for demo/development
        if (process.env.NODE_ENV !== 'production') {
            suggestions.push('Note: This demo environment has network restrictions that may prevent loading some websites');
        }
        
        res.status(statusCode).json({ 
            error: errorMessage,
            code: userFriendlyCode,
            originalCode: error.code,
            suggestions: suggestions,
            url: targetUrl,
            timestamp: new Date().toISOString(),
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate fallback content for popular websites when DNS fails
function generateFallbackContent(targetUrl) {
    const url = new URL(targetUrl);
    const hostname = url.hostname.toLowerCase();
    
    // Define fallback content for popular sites
    const fallbacks = {
        'example.com': {
            title: 'Example Domain (Demo Mode)',
            content: `
                <div style="max-width: 800px; margin: 40px auto; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    <h1 style="color: #333; margin-bottom: 20px;">Example Domain - Demo Mode</h1>
                    <p style="font-size: 18px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                        This domain is for use in illustrative examples in documents. You may use this
                        domain in literature without prior coordination or asking for permission.
                    </p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 30px 0;">
                        <h2 style="margin: 0 0 15px 0;">🚀 Embedder Demo Mode</h2>
                        <p style="margin: 0; opacity: 0.9;">
                            This is a demonstration of how the website embedder works. In a real environment
                            with proper DNS access, this would show the actual example.com website.
                        </p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;">
                        <div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px;">
                            <h3 style="color: #333; margin-top: 0;">✨ Features</h3>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>Server-side content fetching</li>
                                <li>Smart URL rewriting</li>
                                <li>Enhanced navigation</li>
                                <li>Mobile responsive design</li>
                            </ul>
                        </div>
                        <div style="border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px;">
                            <h3 style="color: #333; margin-top: 0;">🛠️ How It Works</h3>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>Bypasses iframe restrictions</li>
                                <li>Filters malicious content</li>
                                <li>Preserves website functionality</li>
                                <li>Adds enhanced features</li>
                            </ul>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0;">
                        <strong>💡 Tip:</strong> Try the local demo pages (Homepage, About, Services) for full functionality,
                        or visit the original website directly for the real content.
                    </div>
                </div>
            `
        },
        'httpbin.org': {
            title: 'HTTPBin.org Testing APIs (Demo Mode)',
            content: `
                <div style="max-width: 1000px; margin: 20px auto; padding: 20px; font-family: 'Segoe UI', sans-serif;">
                    <header style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #2c3e50; font-size: 2.5em; margin-bottom: 10px;">HTTPBin.org</h1>
                        <p style="color: #7f8c8d; font-size: 1.2em;">HTTP Request & Response Service (Demo Mode)</p>
                    </header>
                    
                    <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
                        <h2 style="margin: 0 0 15px 0;">🧪 Demo Mode Active</h2>
                        <p style="margin: 0; opacity: 0.9;">
                            This is a demonstration of the website embedder. In a real environment,
                            this would show the actual HTTPBin.org testing interface.
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin: 30px 0;">
                        <div style="background: white; border: 1px solid #ecf0f1; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="color: #27ae60; margin-top: 0; display: flex; align-items: center;">
                                <span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 10px;">GET</span>
                                HTTP Methods
                            </h3>
                            <p style="color: #7f8c8d; line-height: 1.6;">
                                Testing different HTTP methods like GET, POST, PUT, DELETE with various response codes and headers.
                            </p>
                        </div>
                        
                        <div style="background: white; border: 1px solid #ecf0f1; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="color: #e74c3c; margin-top: 0; display: flex; align-items: center;">
                                <span style="background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 10px;">JSON</span>
                                Response Formats
                            </h3>
                            <p style="color: #7f8c8d; line-height: 1.6;">
                                Return data in various formats including JSON, XML, HTML, and plain text responses.
                            </p>
                        </div>
                        
                        <div style="background: white; border: 1px solid #ecf0f1; border-radius: 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="color: #9b59b6; margin-top: 0; display: flex; align-items: center;">
                                <span style="background: #9b59b6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 10px;">AUTH</span>
                                Authentication
                            </h3>
                            <p style="color: #7f8c8d; line-height: 1.6;">
                                Test various authentication methods including Basic Auth, Bearer tokens, and cookies.
                            </p>
                        </div>
                    </div>

                    <div style="background: #ecf0f1; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                        <h3 style="color: #2c3e50; margin-bottom: 20px;">📚 What HTTPBin Offers</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; text-align: left;">
                            <div style="background: white; padding: 15px; border-radius: 6px;">
                                <strong style="color: #27ae60;">Request Inspection</strong><br>
                                <small style="color: #7f8c8d;">View headers, IP, user agent</small>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 6px;">
                                <strong style="color: #3498db;">Response Control</strong><br>
                                <small style="color: #7f8c8d;">Custom status codes, delays</small>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 6px;">
                                <strong style="color: #e74c3c;">Data Formats</strong><br>
                                <small style="color: #7f8c8d;">JSON, XML, HTML responses</small>
                            </div>
                            <div style="background: white; padding: 15px; border-radius: 6px;">
                                <strong style="color: #f39c12;">API Testing</strong><br>
                                <small style="color: #7f8c8d;">Perfect for development</small>
                            </div>
                        </div>
                    </div>

                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <strong style="color: #856404;">💡 Note:</strong>
                        <span style="color: #856404;">
                            This demo shows how the embedder handles external websites. Visit the original site directly for the full API testing interface.
                        </span>
                    </div>
                </div>
            `
        },
        'github.com': {
            title: 'GitHub (Demo Mode)',
            content: `
                <div style="max-width: 1200px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                    <header style="background: #24292f; color: white; padding: 20px; margin: -20px -20px 30px -20px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center;">
                                <h1 style="margin: 0; font-size: 24px;">🐙 GitHub</h1>
                                <span style="background: #ff6b6b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 15px;">DEMO MODE</span>
                            </div>
                            <div style="font-size: 14px; opacity: 0.8;">
                                The world's leading software development platform
                            </div>
                        </div>
                    </header>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
                        <h2 style="margin: 0 0 15px 0; font-size: 2em;">🚀 Embedder Demo</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 1.1em;">
                            This demonstrates how GitHub would appear in the embedder. 
                            The actual site has millions of repositories and developers.
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin: 30px 0;">
                        <div>
                            <h3 style="color: #24292f; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px;">📁 Popular Repositories</h3>
                            <div style="space-y: 15px;">
                                ${[
                                    { name: 'microsoft/vscode', desc: 'Visual Studio Code editor', stars: '142k', lang: 'TypeScript' },
                                    { name: 'facebook/react', desc: 'A declarative JavaScript library', stars: '210k', lang: 'JavaScript' },
                                    { name: 'tensorflow/tensorflow', desc: 'Machine Learning framework', stars: '180k', lang: 'Python' },
                                    { name: 'torvalds/linux', desc: 'Linux kernel source tree', stars: '165k', lang: 'C' }
                                ].map(repo => `
                                    <div style="border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px; margin: 15px 0; background: white;">
                                        <div style="display: flex; justify-content: space-between; align-items: start;">
                                            <div>
                                                <h4 style="margin: 0 0 8px 0; color: #0969da;">${repo.name}</h4>
                                                <p style="margin: 0 0 12px 0; color: #656d76; line-height: 1.5;">${repo.desc}</p>
                                                <div style="display: flex; align-items: center; gap: 15px; font-size: 14px; color: #656d76;">
                                                    <span>⭐ ${repo.stars}</span>
                                                    <span style="display: flex; align-items: center;">
                                                        <span style="width: 12px; height: 12px; border-radius: 50%; background: #f1e05a; margin-right: 6px;"></span>
                                                        ${repo.lang}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div>
                            <h3 style="color: #24292f; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px;">🔥 Trending</h3>
                            <div style="background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 20px;">
                                <h4 style="margin: 0 0 15px 0; color: #24292f;">Today's Trending</h4>
                                <ul style="list-style: none; padding: 0; margin: 0;">
                                    <li style="padding: 8px 0; border-bottom: 1px solid #f6f8fa;">🔥 AI/ML Projects</li>
                                    <li style="padding: 8px 0; border-bottom: 1px solid #f6f8fa;">⚡ Web Frameworks</li>
                                    <li style="padding: 8px 0; border-bottom: 1px solid #f6f8fa;">🛠️ DevOps Tools</li>
                                    <li style="padding: 8px 0;">📱 Mobile Apps</li>
                                </ul>
                            </div>

                            <div style="background: #f6f8fa; border-radius: 8px; padding: 20px; margin-top: 20px;">
                                <h4 style="margin: 0 0 15px 0; color: #24292f;">📊 Platform Stats</h4>
                                <div style="font-size: 14px; line-height: 1.8; color: #656d76;">
                                    <div>👥 100M+ developers</div>
                                    <div>📦 330M+ repositories</div>
                                    <div>🏢 4M+ organizations</div>
                                    <div>🌍 Used in 200+ countries</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="background: #fff8e1; border: 1px solid #ffecb3; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                        <h4 style="color: #e65100; margin: 0 0 10px 0;">💡 Demo Mode Information</h4>
                        <p style="color: #ef6c00; margin: 0; line-height: 1.6;">
                            This is a simulated GitHub interface to demonstrate the website embedder. 
                            The real GitHub has live repositories, issues, pull requests, and collaboration features.
                        </p>
                    </div>
                </div>
            `
        }
    };
    
    // Check if we have a fallback for this hostname
    const fallback = fallbacks[hostname];
    if (!fallback) {
        return null;
    }
    
    // Generate complete HTML with enhanced styling and navigation
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <base href="${targetUrl}">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${fallback.title}</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    background: #f8f9fa;
                }
                
                .demo-notice {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                    color: white;
                    padding: 10px 20px;
                    font-size: 14px;
                    z-index: 9999;
                    text-align: center;
                    box-shadow: 0 2px 10px rgba(255,107,107,0.3);
                }
                
                .demo-notice a {
                    color: #fff3cd !important;
                    text-decoration: none !important;
                    font-weight: 600;
                }
                
                body { 
                    padding-top: 60px; 
                }
                
                html {
                    scroll-behavior: smooth;
                }
            </style>
        </head>
        <body>
            <div class="demo-notice">
                🎭 DEMO MODE: Simulated content via <a href="/" target="_blank">42Web.io Embedder</a> 
                | <a href="${targetUrl}" target="_blank">Visit Real Site</a>
                | <a href="javascript:window.parent.postMessage('close-embed', '*')">Close Embed</a>
            </div>
            
            ${fallback.content}
            
            <script>
                // Enhanced demo functionality
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('Demo content loaded for ${hostname}');
                    
                    // Smooth scrolling for any anchor links
                    const anchorLinks = document.querySelectorAll('a[href^="#"]');
                    anchorLinks.forEach(link => {
                        link.addEventListener('click', function(e) {
                            const target = document.querySelector(this.getAttribute('href'));
                            if (target) {
                                e.preventDefault();
                                target.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    });
                    
                    // Add interactive elements
                    const buttons = document.querySelectorAll('button, .btn');
                    buttons.forEach(btn => {
                        btn.addEventListener('click', function() {
                            this.style.transform = 'scale(0.98)';
                            setTimeout(() => {
                                this.style.transform = 'scale(1)';
                            }, 150);
                        });
                    });
                });
            </script>
        </body>
        </html>
    `;
}

// Enhanced contact form submission with rate limiting and validation
app.post('/contact', contactRateLimit, (req, res) => {
    const { name, email, message } = req.body;
    
    // Server-side validation
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please provide a valid email address');
    }
    
    if (!message || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }
    
    if (errors.length > 0) {
        return res.render('contact', {
            title: 'Contact - 42Web.io',
            currentPage: 'contact',
            errors,
            formData: { name, email, message },
            ...withMeta({
                description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
                canonical: req.protocol + '://' + req.get('host') + '/contact'
            })
        });
    }
    
    // In a real app, you'd save this to a database or send an email
    console.log('Contact form submission:', { 
        name: name.trim(), 
        email: email.trim(), 
        message: message.trim(),
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        success: 'Thank you for your message! We\'ll get back to you within 24 hours.',
        ...withMeta({
            description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
            canonical: req.protocol + '://' + req.get('host') + '/contact'
        })
    });
});

// Blog routes with caching
app.get('/blog', cacheMiddleware(900), (req, res) => {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedPosts = posts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(posts.length / limit);
    
    res.render('blog', {
        title: 'Blog - 42Web.io',
        currentPage: 'blog',
        posts: paginatedPosts,
        pagination: {
            current: page,
            total: totalPages,
            hasNext: endIndex < posts.length,
            hasPrev: startIndex > 0,
            nextPage: page + 1,
            prevPage: page - 1
        },
        ...withMeta({
            description: 'Insights, tutorials, and updates from the 42Web.io team.',
            canonical: req.protocol + '://' + req.get('host') + '/blog'
        })
    });
});

app.get('/blog/:slug', cacheMiddleware(3600), (req, res) => {
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) {
        return res.status(404).render('404', { 
            title: '404 - Blog Post Not Found',
            currentPage: 'blog'
        });
    }
    
    // Get related posts (same tags)
    const relatedPosts = posts
        .filter(p => p.slug !== post.slug && p.tags.some(tag => post.tags.includes(tag)))
        .slice(0, 3);
    
    res.render('blog-post', {
        title: `${post.title} - 42Web.io`,
        currentPage: 'blog',
        post,
        relatedPosts,
        ...withMeta({
            description: post.excerpt || post.title,
            canonical: req.protocol + '://' + req.get('host') + '/blog/' + post.slug,
            ogTitle: post.title,
            ogDescription: post.excerpt || post.title,
            ogImage: post.image ? req.protocol + '://' + req.get('host') + post.image : undefined,
            type: 'article'
        })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error - Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
