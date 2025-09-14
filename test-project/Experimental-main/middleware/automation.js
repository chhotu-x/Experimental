/**
 * 🤖 Automation Middleware for Enhanced Processing
 * Advanced middleware for automation task validation, security, and performance
 */

const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting for automation endpoints
const automationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 automation requests per windowMs
    message: {
        error: 'Too many automation requests',
        retryAfter: '15 minutes',
        maxRequests: 100
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded for automation endpoints',
            limit: 100,
            windowMs: 15 * 60 * 1000,
            retryAfter: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        });
    }
});

// Security validation for automation tasks
const validateAutomationTask = [
    body('type')
        .isIn(['click', 'fill', 'navigate', 'harvest', 'batch'])
        .withMessage('Invalid task type'),
    
    body('config')
        .isObject()
        .withMessage('Config must be an object'),
    
    body('config.selector')
        .optional()
        .isString()
        .isLength({ min: 1, max: 500 })
        .withMessage('Selector must be a string between 1-500 characters'),
    
    body('config.url')
        .optional()
        .isURL({ require_protocol: true, protocols: ['http', 'https'] })
        .withMessage('URL must be a valid HTTP/HTTPS URL'),
    
    body('parallel')
        .optional()
        .isBoolean()
        .withMessage('Parallel must be a boolean'),
    
    body('priority')
        .optional()
        .isInt({ min: 0, max: 10 })
        .withMessage('Priority must be an integer between 0-10'),
    
    // Custom validation for dangerous selectors
    body('config.selector').custom((value) => {
        if (value && /javascript:|data:|vbscript:/i.test(value)) {
            throw new Error('Potentially dangerous selector detected');
        }
        return true;
    }),
    
    // Validate URLs for security
    body('config.url').custom((value) => {
        if (value) {
            const url = new URL(value);
            
            // Block dangerous protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Only HTTP and HTTPS protocols are allowed');
            }
            
            // Block internal networks in production
            if (process.env.NODE_ENV === 'production') {
                if (url.hostname === 'localhost' || 
                    url.hostname === '127.0.0.1' || 
                    url.hostname.startsWith('192.168.') ||
                    url.hostname.startsWith('10.') ||
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url.hostname)) {
                    throw new Error('Access to internal networks is not allowed');
                }
            }
        }
        return true;
    })
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Authentication middleware for automation endpoints
const authenticateAutomation = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    // For demo purposes, allow requests with either API key or session ID
    if (!apiKey && !sessionId) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Provide either X-API-Key header or X-Session-ID header',
            documentation: '/api/docs/authentication'
        });
    }
    
    // Validate API key format (if provided)
    if (apiKey && !/^[a-zA-Z0-9_-]{32,}$/.test(apiKey)) {
        return res.status(401).json({
            error: 'Invalid API key format',
            message: 'API key must be at least 32 characters alphanumeric'
        });
    }
    
    // Add user context to request
    req.automationUser = {
        id: apiKey ? `api_${apiKey.slice(0, 8)}` : `session_${sessionId.slice(0, 8)}`,
        type: apiKey ? 'api' : 'session',
        permissions: ['read', 'write'] // For demo, grant all permissions
    };
    
    next();
};

// Performance monitoring middleware
const monitorAutomationPerformance = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    
    // Override res.json to capture response metrics
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        // Add performance headers
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        res.setHeader('X-Memory-Delta', `${(endMemory.heapUsed - startMemory.heapUsed) / 1024}KB`);
        res.setHeader('X-Processing-Node', process.pid);
        
        // Log performance metrics
        console.log(`[AUTOMATION] ${req.method} ${req.path} - ${duration.toFixed(2)}ms - ${res.statusCode}`);
        
        // Call original json method
        originalJson.call(this, data);
    };
    
    next();
};

// Security headers for automation endpoints
const automationSecurityHeaders = (req, res, next) => {
    // Automation-specific security headers
    res.setHeader('X-Automation-Version', '2.0');
    res.setHeader('X-Rate-Limit-Remaining', res.getHeader('X-RateLimit-Remaining') || 'unlimited');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none';");
    
    next();
};

// Task sanitization middleware
const sanitizeTaskConfig = (req, res, next) => {
    if (req.body && req.body.config) {
        const config = req.body.config;
        
        // Sanitize strings
        Object.keys(config).forEach(key => {
            if (typeof config[key] === 'string') {
                // Remove potentially dangerous characters
                config[key] = config[key]
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
                
                // Limit string length
                if (config[key].length > 1000) {
                    config[key] = config[key].substring(0, 1000);
                }
            }
        });
        
        // Add security context
        config._security = {
            sanitized: true,
            sanitizedAt: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };
    }
    
    next();
};

// Logging middleware for automation requests
const logAutomationRequest = (req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        user: req.automationUser?.id || 'anonymous',
        taskType: req.body?.type,
        parallel: req.body?.parallel,
        priority: req.body?.priority
    };
    
    console.log(`[AUTOMATION-LOG] ${JSON.stringify(logData)}`);
    next();
};

// Error handling middleware for automation endpoints
const handleAutomationErrors = (err, req, res, next) => {
    console.error(`[AUTOMATION-ERROR] ${err.message}`, {
        stack: err.stack,
        request: {
            method: req.method,
            path: req.path,
            body: req.body,
            user: req.automationUser?.id
        }
    });
    
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: 'Automation processing failed',
        message: isDevelopment ? err.message : 'Internal server error',
        code: err.code || 'AUTOMATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
        ...(isDevelopment && { stack: err.stack })
    });
};

// WebSocket support for real-time automation updates
const setupAutomationWebSocket = (server) => {
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ 
        server,
        path: '/automation/ws',
        verifyClient: (info) => {
            // Basic verification - in production, implement proper auth
            const origin = info.origin;
            return true; // Allow all origins for demo
        }
    });
    
    wss.on('connection', (ws, req) => {
        console.log('[AUTOMATION-WS] Client connected');
        
        // Send connection acknowledgment
        ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            timestamp: new Date().toISOString(),
            features: ['task-updates', 'real-time-metrics', 'system-status']
        }));
        
        // Handle client messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleWebSocketMessage(ws, data);
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid JSON message',
                    timestamp: new Date().toISOString()
                }));
            }
        });
        
        // Handle disconnection
        ws.on('close', () => {
            console.log('[AUTOMATION-WS] Client disconnected');
        });
        
        // Send periodic updates
        const updateInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'system-status',
                    data: getSystemStatus(),
                    timestamp: new Date().toISOString()
                }));
            } else {
                clearInterval(updateInterval);
            }
        }, 5000); // Update every 5 seconds
    });
    
    return wss;
};

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'subscribe':
            // Subscribe to specific task updates
            if (data.taskId) {
                ws.taskSubscriptions = ws.taskSubscriptions || new Set();
                ws.taskSubscriptions.add(data.taskId);
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    taskId: data.taskId,
                    timestamp: new Date().toISOString()
                }));
            }
            break;
            
        case 'unsubscribe':
            // Unsubscribe from task updates
            if (data.taskId && ws.taskSubscriptions) {
                ws.taskSubscriptions.delete(data.taskId);
                ws.send(JSON.stringify({
                    type: 'unsubscribed',
                    taskId: data.taskId,
                    timestamp: new Date().toISOString()
                }));
            }
            break;
            
        case 'ping':
            // Respond to ping with pong
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
            }));
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`,
                timestamp: new Date().toISOString()
            }));
    }
}

function getSystemStatus() {
    return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
    };
}

// Export middleware functions
module.exports = {
    automationRateLimit,
    validateAutomationTask,
    handleValidationErrors,
    authenticateAutomation,
    monitorAutomationPerformance,
    automationSecurityHeaders,
    sanitizeTaskConfig,
    logAutomationRequest,
    handleAutomationErrors,
    setupAutomationWebSocket
};