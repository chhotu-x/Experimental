// Performance middleware for better efficiency
const compression = require('compression');

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

// Memory-based cache for frequently accessed data
class MemoryCache {
    constructor(ttl = 300000) { // 5 minutes default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });
        
        // Clean up expired entries periodically
        if (this.cache.size % 100 === 0) {
            this.cleanup();
        }
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
    }
}

// Create cache instances
const pageCache = new MemoryCache(600000); // 10 minutes for pages
const proxyCache = new MemoryCache(300000); // 5 minutes for proxy requests

// Enhanced compression middleware
const compressionMiddleware = compression({
    level: 6, // Good balance between compression and speed
    threshold: 1024, // Only compress if larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
});

// Cache middleware for static content
const cacheMiddleware = (duration = 3600) => {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cached = pageCache.get(key);
        
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            return res.send(cached);
        }

        // Override res.send to cache the response
        const originalSend = res.send;
        res.send = function(body) {
            if (res.statusCode === 200) {
                pageCache.set(key, body);
            }
            res.setHeader('X-Cache', 'MISS');
            originalSend.call(this, body);
        };

        next();
    };
};

// Rate limiting for proxy endpoint
const proxyRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many proxy requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for contact form
const contactRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 contact form submissions per windowMs
    message: {
        error: 'Too many contact form submissions, please try again later.',
        retryAfter: '15 minutes'
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only add CSP for non-proxy routes
    if (!req.path.startsWith('/proxy')) {
        res.setHeader('Content-Security-Policy', 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' https://cdnjs.cloudflare.com; " +
            "connect-src 'self';"
        );
    }
    
    next();
};

// Response time tracking
const responseTimeMiddleware = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

module.exports = {
    MemoryCache,
    pageCache,
    proxyCache,
    compressionMiddleware,
    cacheMiddleware,
    proxyRateLimit,
    contactRateLimit,
    securityHeaders,
    responseTimeMiddleware
};
