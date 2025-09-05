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

// Enhanced security and privacy configuration
const PRIVACY_SANDBOX_CONFIG = {
    enableCHIPS: true,
    enableStorageAccess: true,
    enableFedCM: true,
    enableAnalytics: true,
    maxCookieAge: 86400 * 30, // 30 days
    sessionCookieAge: 3600, // 1 hour
    allowedOrigins: [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https:\/\/.*\.42web\.io$/,
        /^https:\/\/42web\.io$/
    ]
};

// Rate limiting storage
const rateLimitStore = new Map();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enhanced compression with conditional compression
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        // Don't compress if the request is from an embed context that doesn't support it
        if (req.headers['x-embed-context'] === 'minimal') {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Enhanced static file serving with better caching and security headers
app.use(
    express.static(path.join(__dirname, 'public'), {
        etag: true,
        lastModified: true,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
            // Enhanced security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            
            // Privacy Sandbox headers for all static assets
            if (req?.headers?.referer && req.headers.referer !== req.headers.host) {
                res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            }
            
            // Optimized caching strategy
            if (/(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (/(\.css|\.js)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
            } else if (/privacy-sandbox\.js$/i.test(filePath)) {
                // Shorter cache for privacy sandbox JS to allow for updates
                res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
            }
        }
    })
);

// Enhanced middleware stack
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Privacy-preserving request logging middleware
app.use((req, res, next) => {
    const isEmbedded = req.headers['sec-fetch-dest'] === 'iframe' || 
                     req.query.embed === 'true' || 
                     req.path.includes('/embed');
    
    if (isEmbedded) {
        // Add privacy headers for embedded content
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        res.setHeader('Permissions-Policy', 'storage-access=*, identity-credentials-get=*, browsing-topics=*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        
        // Rate limiting for embedded requests
        if (!checkRateLimit(req)) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }
    }
    
    next();
});

// Enhanced rate limiting function
function checkRateLimit(req) {
    const clientId = req.ip + (req.headers['user-agent'] || '');
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;
    
    if (!rateLimitStore.has(clientId)) {
        rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
        return true;
    }
    
    const client = rateLimitStore.get(clientId);
    
    if (now > client.resetTime) {
        client.count = 1;
        client.resetTime = now + windowMs;
        return true;
    }
    
    if (client.count >= maxRequests) {
        return false;
    }
    
    client.count++;
    return true;
}

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

// Enhanced embed route with advanced Privacy Sandbox features
app.get('/embed', (req, res) => {
    const allowedParams = ['page', 'theme', 'height', 'width', 'mode'];
    const page = req.query.page || 'home';
    const theme = req.query.theme || 'default';
    const mode = req.query.mode || 'standard'; // standard, minimal, compact
    
    // Enhanced Privacy Sandbox headers with security improvements
    const privacyHeaders = {
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Permissions-Policy': 'storage-access=*, identity-credentials-get=*, browsing-topics=*, trust-token-redemption=*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Content-Security-Policy': `frame-ancestors 'self' https://*.42web.io; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`,
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    // Set enhanced privacy headers
    Object.entries(privacyHeaders).forEach(([name, value]) => {
        res.setHeader(name, value);
    });
    
    // Enhanced CHIPS cookies with better lifecycle management
    const sessionId = generateAdvancedEmbedSessionId();
    const cookies = [];
    
    if (PRIVACY_SANDBOX_CONFIG.enableCHIPS) {
        // Enhanced session cookie with metadata
        cookies.push(`embed_session=${sessionId}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${PRIVACY_SANDBOX_CONFIG.sessionCookieAge}; HttpOnly`);
        
        // Theme preference cookie
        cookies.push(`embed_theme=${theme}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${PRIVACY_SANDBOX_CONFIG.maxCookieAge}`);
        
        // Mode preference cookie
        cookies.push(`embed_mode=${mode}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${PRIVACY_SANDBOX_CONFIG.maxCookieAge}`);
        
        // Privacy preferences cookie
        const privacyPrefs = JSON.stringify({
            analytics: true,
            personalization: false,
            version: '2.0'
        });
        cookies.push(`embed_privacy=${encodeURIComponent(privacyPrefs)}; Path=/; Secure; SameSite=None; Partitioned; Max-Age=${PRIVACY_SANDBOX_CONFIG.maxCookieAge}`);
    }
    
    res.setHeader('Set-Cookie', cookies);
    
    // Enhanced page routing with validation
    const validPages = ['home', 'services', 'about', 'contact', 'demo'];
    const safePage = validPages.includes(page) ? page : 'home';
    
    let embedContent = '';
    let pageTitle = '';
    
    switch(safePage) {
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
        case 'demo':
            embedContent = 'demo-embed';
            pageTitle = 'Demo - 42Web.io';
            break;
        default:
            embedContent = 'home-embed';
            pageTitle = '42Web.io - Tech Solutions';
    }
    
    // Enhanced render context with privacy features
    const renderContext = {
        title: pageTitle,
        currentPage: safePage,
        embedContent: embedContent,
        theme: theme,
        mode: mode,
        sessionId: sessionId,
        privacyConfig: {
            enableAnalytics: PRIVACY_SANDBOX_CONFIG.enableAnalytics,
            enableCHIPS: PRIVACY_SANDBOX_CONFIG.enableCHIPS,
            enableStorageAccess: PRIVACY_SANDBOX_CONFIG.enableStorageAccess,
            enableFedCM: PRIVACY_SANDBOX_CONFIG.enableFedCM
        },
        embedOrigin: req.headers.referer || req.headers.origin || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        ...withMeta({
            description: 'Privacy-preserving embeddable 42Web.io content with enhanced Privacy Sandbox features.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    };
    
    res.render('embed', renderContext);
});

// Enhanced session ID generation with more entropy and metadata
function generateAdvancedEmbedSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12);
    const entropy = generateEntropy();
    const version = '2';
    
    return `embed_v${version}_${timestamp}_${random}_${entropy}`;
}

// Generate additional entropy for session IDs
function generateEntropy() {
    const factors = [
        Date.now() % 1000,
        Math.floor(Math.random() * 1000),
        process.pid % 1000
    ];
    
    return factors.reduce((acc, val) => acc + val, 0).toString(36);
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

// Enhanced FedCM configuration endpoint with better security and features
app.get('/.well-known/web-identity', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const enhancedFedCMConfig = {
        "provider_urls": [`${baseUrl}/fedcm`],
        "accounts_endpoint": "/fedcm/accounts",
        "client_metadata_endpoint": "/fedcm/client-metadata",
        "id_assertion_endpoint": "/fedcm/assertion",
        "disconnect_endpoint": "/fedcm/disconnect",
        "revocation_endpoint": "/fedcm/revoke",
        "login_url": `${baseUrl}/login`,
        "types": ["idtoken"],
        "request_params": {
            "client_id": {
                "required": true
            },
            "nonce": {
                "required": false
            },
            "scope": {
                "required": false,
                "default": "openid profile"
            }
        },
        "branding": {
            "background_color": "#0d6efd",
            "color": "#ffffff",
            "icons": [
                {
                    "url": `${baseUrl}/images/logo-192.png`,
                    "size": 192,
                    "type": "image/png"
                },
                {
                    "url": `${baseUrl}/images/logo-512.png`,
                    "size": 512,
                    "type": "image/png"
                }
            ],
            "name": "42Web.io Tech Solutions",
            "privacy_policy_url": `${baseUrl}/privacy`,
            "terms_of_service_url": `${baseUrl}/terms`
        },
        "supports": {
            "rp_context": true,
            "rp_mode": true,
            "iframe_mode": true
        }
    };
    
    res.json(enhancedFedCMConfig);
});

// Enhanced FedCM accounts endpoint with better user management
app.get('/fedcm/accounts', (req, res) => {
    // Enhanced origin validation
    const origin = req.headers.origin;
    const isAllowedOrigin = PRIVACY_SANDBOX_CONFIG.allowedOrigins.some(pattern => 
        pattern.test(origin || '')
    );
    
    if (!isAllowedOrigin && origin) {
        return res.status(403).json({ 
            error: "Origin not allowed",
            code: "invalid_origin" 
        });
    }
    
    // Mock user accounts with enhanced metadata (in production, fetch from database)
    const accounts = [
        {
            "id": "42web_user_1",
            "name": "Demo User",
            "email": "demo@42web.io",
            "given_name": "Demo",
            "family_name": "User",
            "picture": `${req.protocol}://${req.get('host')}/images/default-avatar.png`,
            "approved_clients": ["42web-embed-client"],
            "login_state": "SignIn",
            "terms_of_service_url": `${req.protocol}://${req.get('host')}/terms`,
            "privacy_policy_url": `${req.protocol}://${req.get('host')}/privacy`
        }
    ];
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ accounts });
});

// Enhanced client metadata endpoint with validation
app.get('/fedcm/client-metadata', (req, res) => {
    const clientId = req.query.client_id;
    
    // Validate client ID
    const validClients = {
        '42web-embed-client': {
            "privacy_policy_url": `${req.protocol}://${req.get('host')}/privacy`,
            "terms_of_service_url": `${req.protocol}://${req.get('host')}/terms`,
            "client_name": "42Web.io Embedded Widget",
            "logo_url": `${req.protocol}://${req.get('host')}/images/logo-192.png`,
            "client_uri": `${req.protocol}://${req.get('host')}`,
            "supported_features": [
                "iframe_mode",
                "auto_signin",
                "revocation"
            ]
        }
    };
    
    if (validClients[clientId]) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.json(validClients[clientId]);
    } else {
        res.status(404).json({ 
            error: "Client not found",
            code: "invalid_client_id" 
        });
    }
});

// Enhanced assertion endpoint with better token generation
app.post('/fedcm/assertion', express.json(), (req, res) => {
    const { client_id, account_id, nonce, disclosure_text_shown } = req.body;
    
    // Enhanced validation
    if (!client_id || !account_id) {
        return res.status(400).json({ 
            error: "Missing required parameters",
            code: "invalid_request" 
        });
    }
    
    if (client_id === '42web-embed-client' && account_id === '42web_user_1') {
        // Generate enhanced JWT-like token with proper structure
        const now = Math.floor(Date.now() / 1000);
        const header = {
            "alg": "RS256",
            "typ": "JWT",
            "kid": "42web-key-1"
        };
        
        const payload = {
            "iss": `${req.protocol}://${req.get('host')}`,
            "aud": client_id,
            "sub": account_id,
            "exp": now + 3600, // 1 hour
            "iat": now,
            "auth_time": now,
            "nonce": nonce,
            "email": "demo@42web.io",
            "email_verified": true,
            "name": "Demo User",
            "given_name": "Demo",
            "family_name": "User",
            "picture": `${req.protocol}://${req.get('host')}/images/default-avatar.png`,
            "disclosure_text_shown": disclosure_text_shown
        };
        
        // Simulate proper JWT encoding (in production, use proper JWT library with signing)
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = "mock_signature_" + Math.random().toString(36).substr(2, 12);
        
        const idToken = `${encodedHeader}.${encodedPayload}.${signature}`;
        
        res.json({
            "token": idToken,
            "token_type": "id_token"
        });
    } else {
        res.status(400).json({ 
            error: "Invalid client or account",
            code: "invalid_grant" 
        });
    }
});

// Enhanced disconnect endpoint with better cleanup
app.post('/fedcm/disconnect', express.json(), (req, res) => {
    const { client_id, account_id } = req.body;
    
    if (!client_id || !account_id) {
        return res.status(400).json({ 
            error: "Missing required parameters",
            code: "invalid_request" 
        });
    }
    
    // Log disconnection for audit (in production, update database)
    console.log(`FedCM: Enhanced disconnect - client: ${client_id}, account: ${account_id}, time: ${new Date().toISOString()}`);
    
    // In production: revoke tokens, update user preferences, log audit event
    
    res.status(200).json({
        "status": "disconnected",
        "timestamp": new Date().toISOString()
    });
});

// New revocation endpoint for enhanced token management
app.post('/fedcm/revoke', express.json(), (req, res) => {
    const { token, client_id } = req.body;
    
    if (!token || !client_id) {
        return res.status(400).json({ 
            error: "Missing required parameters",
            code: "invalid_request" 
        });
    }
    
    // In production: validate and revoke the token
    console.log(`FedCM: Token revocation requested - client: ${client_id}, time: ${new Date().toISOString()}`);
    
    res.status(200).json({
        "status": "revoked",
        "timestamp": new Date().toISOString()
    });
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
