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

const app = express();
const PORT = process.env.PORT || 3000;

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
    res.render('embed', {
        title: 'Website Embedder - 42Web.io',
        currentPage: 'embed',
        ...withMeta({
            description: 'Embed any website with full navigation capabilities.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    });
});

app.get('/automation', (req, res) => {
    res.render('automation', {
        title: 'Advanced Automation Engine - 42Web.io',
        currentPage: 'automation',
        ...withMeta({
            description: 'Advanced automation engine with AI-powered element detection, parallel processing, and real-time control systems.',
            canonical: req.protocol + '://' + req.get('host') + '/automation'
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
