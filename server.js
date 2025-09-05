const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Handle contact form submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // In a real app, you'd save this to a database or send an email
    console.log('Contact form submission:', { name, email, message });
    
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        success: 'Thank you for your message! We\'ll get back to you soon.'
    });
});

// Demo page for embedding functionality
app.get('/demo', (req, res) => {
    res.render('demo', {
        title: 'Embedding Demo - 42Web.io',
        currentPage: 'demo',
        ...withMeta({
            description: 'See how to embed 42Web.io content into other websites using iframes.',
            canonical: req.protocol + '://' + req.get('host') + '/demo'
        })
    });
});

// Embed route for iframe embedding with Privacy Sandbox support
app.get('/embed', (req, res) => {
    const allowedParams = ['page', 'theme', 'height', 'width'];
    const page = req.query.page || 'home';
    const theme = req.query.theme || 'default';
    
    // Set Privacy Sandbox headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Permissions-Policy', 'storage-access=*, identity-credentials-get=*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    
    // Enable partitioned cookies (CHIPS) for supporting browsers
    res.setHeader('Set-Cookie', [
        `embed_session=${generateEmbedSessionId()}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=3600`,
        `embed_theme=${theme}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=86400`
    ]);
    
    // Determine which page to embed
    let embedContent = '';
    let pageTitle = '';
    
    switch(page) {
        case 'services':
            embedContent = 'services-embed';
            pageTitle = 'Services - 42Web.io';
            break;
        case 'about':
            embedContent = 'about-embed';
            pageTitle = 'About - 42Web.io';
            break;
        case 'contact':
            embedContent = 'contact-embed';
            pageTitle = 'Contact - 42Web.io';
            break;
        default:
            embedContent = 'home-embed';
            pageTitle = '42Web.io - Tech Solutions';
    }
    
    res.render('embed', {
        title: pageTitle,
        currentPage: page,
        embedContent: embedContent,
        theme: theme,
        ...withMeta({
            description: 'Privacy-preserving embeddable 42Web.io content for integration into other websites.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    });
});

// Helper function to generate embed session ID
function generateEmbedSessionId() {
    return 'embed_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

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

// FedCM configuration endpoint for Federated Credential Management
app.get('/.well-known/web-identity', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const fedCMConfig = {
        "provider_urls": [`${req.protocol}://${req.get('host')}/fedcm`],
        "accounts_endpoint": "/fedcm/accounts",
        "client_metadata_endpoint": "/fedcm/client-metadata",
        "id_assertion_endpoint": "/fedcm/assertion",
        "disconnect_endpoint": "/fedcm/disconnect",
        "login_url": `${req.protocol}://${req.get('host')}/login`,
        "branding": {
            "background_color": "#0d6efd",
            "color": "#ffffff",
            "icons": [
                {
                    "url": `${req.protocol}://${req.get('host')}/images/logo-192.png`,
                    "size": 192
                }
            ]
        }
    };
    
    res.json(fedCMConfig);
});

// FedCM endpoints for credential management
app.get('/fedcm/accounts', (req, res) => {
    // Return available accounts (in a real app, this would check authentication)
    res.json({
        "accounts": [
            {
                "id": "42web_user",
                "name": "42Web.io User",
                "email": "user@42web.io",
                "given_name": "User",
                "picture": `${req.protocol}://${req.get('host')}/images/default-avatar.png`,
                "approved_clients": ["42web-embed-client"]
            }
        ]
    });
});

app.get('/fedcm/client-metadata', (req, res) => {
    const clientId = req.query.client_id;
    
    if (clientId === '42web-embed-client') {
        res.json({
            "privacy_policy_url": `${req.protocol}://${req.get('host')}/privacy`,
            "terms_of_service_url": `${req.protocol}://${req.get('host')}/terms`
        });
    } else {
        res.status(404).json({ error: "Client not found" });
    }
});

app.post('/fedcm/assertion', express.json(), (req, res) => {
    const { client_id, account_id, disclosure_text_shown } = req.body;
    
    if (client_id === '42web-embed-client' && account_id === '42web_user') {
        // Generate a mock JWT token (in production, use proper JWT library)
        const token = Buffer.from(JSON.stringify({
            iss: req.protocol + '://' + req.get('host'),
            aud: client_id,
            sub: account_id,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        })).toString('base64');
        
        res.json({
            "token": `header.${token}.signature`
        });
    } else {
        res.status(400).json({ error: "Invalid request" });
    }
});

app.post('/fedcm/disconnect', express.json(), (req, res) => {
    const { client_id, account_id } = req.body;
    
    // Handle disconnection (in production, revoke tokens, update database)
    console.log(`FedCM: Disconnecting client ${client_id} for account ${account_id}`);
    
    res.status(200).send();
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found',
        currentPage: '',
        ...withMeta({
            description: 'Page not found on 42Web.io'
        })
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error - Something went wrong',
        currentPage: '',
        ...withMeta({
            description: 'An error occurred on 42Web.io'
        })
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
