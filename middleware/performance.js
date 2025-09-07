// Performance middleware for better efficiency
const compression = require('compression');

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

// Enhanced memory cache with request deduplication
class MemoryCache {
    constructor(ttl = 300000) { // 5 minutes default TTL
        this.cache = new Map();
        this.ttl = ttl;
        this.pendingRequests = new Map(); // For request deduplication
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
    
    // Request deduplication for proxy requests
    async getOrFetch(key, fetchFunction) {
        // Check cache first
        const cached = this.get(key);
        if (cached) {
            return { data: cached, fromCache: true };
        }
        
        // Check if request is already pending
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }
        
        // Create new request
        const requestPromise = fetchFunction().then(data => {
            this.set(key, data);
            this.pendingRequests.delete(key);
            return { data, fromCache: false };
        }).catch(error => {
            this.pendingRequests.delete(key);
            throw error;
        });
        
        this.pendingRequests.set(key, requestPromise);
        return requestPromise;
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
        this.pendingRequests.clear();
    }
    
    // Memory usage optimization
    getStats() {
        return {
            cacheSize: this.cache.size,
            pendingRequests: this.pendingRequests.size,
            memoryUsage: process.memoryUsage()
        };
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

// Response time tracking with performance metrics
const responseTimeMiddleware = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Log performance metrics
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        
        // Track slow requests
        if (duration > 1000) {
            console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
        }
        
        // Memory usage monitoring
        if (Math.random() < 0.1) { // 10% sampling
            const memUsage = process.memoryUsage();
            if (memUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
                console.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
                
                // Trigger garbage collection if memory is high
                if (global.gc && memUsage.heapUsed > 200 * 1024 * 1024) {
                    global.gc();
                }
            }
        }
    });
    
    next();
};

// Memory management middleware
const memoryManagementMiddleware = (req, res, next) => {
    // Clean up caches periodically
    if (Math.random() < 0.01) { // 1% chance
        pageCache.cleanup();
        proxyCache.cleanup();
    }
    
    next();
};

// Request throttling for high-load scenarios
class RequestThrottler {
    constructor(maxConcurrent = 10) {
        this.maxConcurrent = maxConcurrent;
        this.current = 0;
        this.queue = [];
    }
    
    async throttle(fn) {
        return new Promise((resolve, reject) => {
            const execute = async () => {
                this.current++;
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.current--;
                    this.processQueue();
                }
            };
            
            if (this.current < this.maxConcurrent) {
                execute();
            } else {
                this.queue.push(execute);
            }
        });
    }
    
    processQueue() {
        if (this.queue.length > 0 && this.current < this.maxConcurrent) {
            const next = this.queue.shift();
            next();
        }
    }
}

const requestThrottler = new RequestThrottler(10);

module.exports = {
    MemoryCache,
    pageCache,
    proxyCache,
    compressionMiddleware,
    cacheMiddleware,
    proxyRateLimit,
    contactRateLimit,
    securityHeaders,
    responseTimeMiddleware,
    memoryManagementMiddleware,
    requestThrottler
};
