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
        
        if (error.code === 'ENOTFOUND') {
            errorMessage = 'Website not found or unreachable';
            statusCode = 404;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused by the website';
            statusCode = 502;
        } else if (error.response) {
            statusCode = error.response.status;
            errorMessage = `Website returned ${error.response.status} error`;
            if (error.response.status === 403) {
                errorMessage = 'Access denied by the website';
            } else if (error.response.status === 404) {
                errorMessage = 'Page not found on the website';
            }
        } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Request timeout - website took too long to respond';
            statusCode = 504;
        } else if (error.code === 'EMSGSIZE') {
            errorMessage = 'Website content is too large to embed';
            statusCode = 413;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            code: error.code,
            url: targetUrl
        });
    }
});

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
