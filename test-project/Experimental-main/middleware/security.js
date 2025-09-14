/**
 * 🔒 Security and Isolation System
 * Advanced security measures for 1M+ concurrent website embeddings
 */

const crypto = require('crypto');
const vm = require('vm');
const { URL } = require('url');

class SecurityManager {
    constructor(config = {}) {
        this.config = {
            maxExecutionTime: config.maxExecutionTime || 5000,
            maxMemoryUsage: config.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
            allowedDomains: config.allowedDomains || [],
            blockedDomains: config.blockedDomains || [
                'localhost',
                '127.0.0.1',
                '10.',
                '192.168.',
                '172.16.',
                '172.17.',
                '172.18.',
                '172.19.',
                '172.20.',
                '172.21.',
                '172.22.',
                '172.23.',
                '172.24.',
                '172.25.',
                '172.26.',
                '172.27.',
                '172.28.',
                '172.29.',
                '172.30.',
                '172.31.'
            ],
            blockedExtensions: config.blockedExtensions || [
                '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'
            ],
            maxUrlLength: config.maxUrlLength || 2048,
            enableSandboxing: config.enableSandboxing !== false,
            enableContentFiltering: config.enableContentFiltering !== false,
            enableRateLimiting: config.enableRateLimiting !== false,
            ...config
        };
        
        this.isolationContexts = new Map();
        this.securityAudits = new Map();
        this.threatDetector = new ThreatDetector(this.config);
        this.contentSanitizer = new ContentSanitizer(this.config);
        this.accessController = new AccessController(this.config);
    }
    
    async validateWebsiteUrl(url, options = {}) {
        const validation = {
            valid: false,
            url: null,
            issues: [],
            securityRisk: 'low',
            sanitized: false
        };
        
        try {
            // Basic URL validation
            if (!url || typeof url !== 'string') {
                validation.issues.push('Invalid URL format');
                return validation;
            }
            
            if (url.length > this.config.maxUrlLength) {
                validation.issues.push('URL exceeds maximum length');
                return validation;
            }
            
            // Parse and validate URL
            const parsedUrl = new URL(url);
            validation.url = parsedUrl;
            
            // Protocol validation
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                validation.issues.push('Only HTTP and HTTPS protocols are allowed');
                return validation;
            }
            
            // Domain validation
            const domainValidation = this._validateDomain(parsedUrl.hostname);
            if (!domainValidation.valid) {
                validation.issues.push(...domainValidation.issues);
                validation.securityRisk = domainValidation.risk;
                return validation;
            }
            
            // Path validation
            const pathValidation = this._validatePath(parsedUrl.pathname);
            if (!pathValidation.valid) {
                validation.issues.push(...pathValidation.issues);
                validation.securityRisk = Math.max(validation.securityRisk, pathValidation.risk);
            }
            
            // Query parameter validation
            const queryValidation = this._validateQueryParams(parsedUrl.searchParams);
            if (!queryValidation.valid) {
                validation.issues.push(...queryValidation.issues);
                validation.securityRisk = Math.max(validation.securityRisk, queryValidation.risk);
            }
            
            // Security scan
            const securityScan = await this.threatDetector.scanUrl(url);
            if (securityScan.threatLevel > 0) {
                validation.issues.push(...securityScan.threats);
                validation.securityRisk = securityScan.riskLevel;
            }
            
            validation.valid = validation.issues.length === 0;
            
            // Log security audit
            this._logSecurityAudit('url-validation', {
                url,
                valid: validation.valid,
                issues: validation.issues,
                securityRisk: validation.securityRisk,
                timestamp: Date.now()
            });
            
            return validation;
            
        } catch (error) {
            validation.issues.push(`URL parsing error: ${error.message}`);
            return validation;
        }
    }
    
    _validateDomain(hostname) {
        const validation = { valid: true, issues: [], risk: 'low' };
        
        // Check blocked domains
        for (const blocked of this.config.blockedDomains) {
            if (hostname.includes(blocked) || hostname.startsWith(blocked)) {
                validation.valid = false;
                validation.issues.push(`Domain '${hostname}' is blocked`);
                validation.risk = 'high';
                return validation;
            }
        }
        
        // Check allowed domains (if specified)
        if (this.config.allowedDomains.length > 0) {
            const isAllowed = this.config.allowedDomains.some(allowed => 
                hostname === allowed || hostname.endsWith('.' + allowed)
            );
            if (!isAllowed) {
                validation.valid = false;
                validation.issues.push(`Domain '${hostname}' is not in allowed list`);
                validation.risk = 'medium';
            }
        }
        
        // Check for suspicious patterns
        if (hostname.includes('..') || hostname.includes('--')) {
            validation.issues.push('Suspicious domain pattern detected');
            validation.risk = 'medium';
        }
        
        return validation;
    }
    
    _validatePath(pathname) {\n        const validation = { valid: true, issues: [], risk: 'low' };\n        \n        // Check for dangerous file extensions\n        for (const ext of this.config.blockedExtensions) {\n            if (pathname.toLowerCase().endsWith(ext)) {\n                validation.valid = false;\n                validation.issues.push(`File extension '${ext}' is not allowed`);\n                validation.risk = 'high';\n                return validation;\n            }\n        }\n        \n        // Check for path traversal\n        if (pathname.includes('../') || pathname.includes('..\\\\')) {\n            validation.valid = false;\n            validation.issues.push('Path traversal attempt detected');\n            validation.risk = 'high';\n        }\n        \n        // Check for suspicious patterns\n        const suspiciousPatterns = [\n            /\\/\\.\\.\\//,\n            /\\\\\\.\\.\\\\/, \n            /%2e%2e%2f/i,\n            /%c0%af/i,\n            /\\x00/\n        ];\n        \n        for (const pattern of suspiciousPatterns) {\n            if (pattern.test(pathname)) {\n                validation.issues.push('Suspicious path pattern detected');\n                validation.risk = 'high';\n            }\n        }\n        \n        return validation;\n    }\n    \n    _validateQueryParams(searchParams) {\n        const validation = { valid: true, issues: [], risk: 'low' };\n        \n        // Check for script injection in parameters\n        for (const [key, value] of searchParams) {\n            if (this._containsScriptInjection(value)) {\n                validation.issues.push(`Potential script injection in parameter '${key}'`);\n                validation.risk = 'high';\n            }\n            \n            if (this._containsSqlInjection(value)) {\n                validation.issues.push(`Potential SQL injection in parameter '${key}'`);\n                validation.risk = 'high';\n            }\n        }\n        \n        return validation;\n    }\n    \n    _containsScriptInjection(value) {\n        const scriptPatterns = [\n            /<script[^>]*>/i,\n            /javascript:/i,\n            /on\\w+\\s*=/i,\n            /eval\\(/i,\n            /document\\./i,\n            /window\\./i\n        ];\n        \n        return scriptPatterns.some(pattern => pattern.test(value));\n    }\n    \n    _containsSqlInjection(value) {\n        const sqlPatterns = [\n            /('|(\\\\')|(;)|(--|#)|(\\/\\*|\\*\\/))/i,\n            /(union|select|insert|update|delete|drop|create|alter)\\s/i,\n            /\\b(or|and)\\s+\\d+\\s*=\\s*\\d+/i\n        ];\n        \n        return sqlPatterns.some(pattern => pattern.test(value));\n    }\n    \n    async sanitizeWebsiteContent(content, websiteUrl, options = {}) {\n        return await this.contentSanitizer.sanitize(content, websiteUrl, options);\n    }\n    \n    createIsolationContext(websiteUrl, instanceId) {\n        const contextId = crypto.randomUUID();\n        \n        const context = {\n            id: contextId,\n            websiteUrl,\n            instanceId,\n            createdAt: Date.now(),\n            memoryUsage: 0,\n            cpuUsage: 0,\n            networkRequests: 0,\n            sandbox: null,\n            limits: {\n                maxMemory: this.config.maxMemoryUsage,\n                maxExecutionTime: this.config.maxExecutionTime,\n                maxNetworkRequests: 1000\n            }\n        };\n        \n        if (this.config.enableSandboxing) {\n            context.sandbox = this._createSandbox(context);\n        }\n        \n        this.isolationContexts.set(contextId, context);\n        \n        // Auto-cleanup after 1 hour\n        setTimeout(() => {\n            this.destroyIsolationContext(contextId);\n        }, 3600000);\n        \n        return contextId;\n    }\n    \n    _createSandbox(context) {\n        const sandbox = {\n            console: {\n                log: (...args) => {\n                    // Sandboxed logging\n                    console.log(`[SANDBOX:${context.id}]`, ...args);\n                }\n            },\n            setTimeout: (fn, delay) => {\n                if (delay > context.limits.maxExecutionTime) {\n                    throw new Error('Execution time limit exceeded');\n                }\n                return setTimeout(fn, Math.min(delay, context.limits.maxExecutionTime));\n            },\n            fetch: async (url, options) => {\n                context.networkRequests++;\n                if (context.networkRequests > context.limits.maxNetworkRequests) {\n                    throw new Error('Network request limit exceeded');\n                }\n                \n                // Validate URL before making request\n                const validation = await this.validateWebsiteUrl(url);\n                if (!validation.valid) {\n                    throw new Error(`Blocked URL: ${validation.issues.join(', ')}`);\n                }\n                \n                return fetch(url, options);\n            }\n        };\n        \n        return vm.createContext(sandbox);\n    }\n    \n    executeInSandbox(contextId, code, timeout = null) {\n        const context = this.isolationContexts.get(contextId);\n        if (!context || !context.sandbox) {\n            throw new Error('Invalid or unsandboxed context');\n        }\n        \n        const execTimeout = timeout || context.limits.maxExecutionTime;\n        \n        try {\n            return vm.runInContext(code, context.sandbox, {\n                timeout: execTimeout,\n                displayErrors: false\n            });\n        } catch (error) {\n            this._logSecurityAudit('sandbox-violation', {\n                contextId,\n                error: error.message,\n                code: code.substring(0, 100), // Log first 100 chars\n                timestamp: Date.now()\n            });\n            throw error;\n        }\n    }\n    \n    getContextStatus(contextId) {\n        const context = this.isolationContexts.get(contextId);\n        if (!context) {\n            return null;\n        }\n        \n        return {\n            id: context.id,\n            websiteUrl: context.websiteUrl,\n            instanceId: context.instanceId,\n            uptime: Date.now() - context.createdAt,\n            memoryUsage: context.memoryUsage,\n            cpuUsage: context.cpuUsage,\n            networkRequests: context.networkRequests,\n            limits: context.limits,\n            isSandboxed: !!context.sandbox\n        };\n    }\n    \n    destroyIsolationContext(contextId) {\n        const context = this.isolationContexts.get(contextId);\n        if (context) {\n            if (context.sandbox) {\n                // Clean up sandbox\n                try {\n                    vm.runInContext('Object.getOwnPropertyNames(this).forEach(key => delete this[key])', context.sandbox);\n                } catch (error) {\n                    // Ignore cleanup errors\n                }\n            }\n            \n            this.isolationContexts.delete(contextId);\n            \n            this._logSecurityAudit('context-destroyed', {\n                contextId,\n                uptime: Date.now() - context.createdAt,\n                finalMemoryUsage: context.memoryUsage,\n                totalNetworkRequests: context.networkRequests,\n                timestamp: Date.now()\n            });\n        }\n    }\n    \n    _logSecurityAudit(event, data) {\n        const auditId = crypto.randomUUID();\n        const audit = {\n            id: auditId,\n            event,\n            data,\n            timestamp: Date.now()\n        };\n        \n        this.securityAudits.set(auditId, audit);\n        \n        // Keep only last 10000 audits\n        if (this.securityAudits.size > 10000) {\n            const firstKey = this.securityAudits.keys().next().value;\n            this.securityAudits.delete(firstKey);\n        }\n        \n        // Emit security event for monitoring\n        if (data.securityRisk === 'high' || event.includes('violation')) {\n            console.warn(`🔒 Security Event: ${event}`, data);\n        }\n    }\n    \n    getSecurityReport() {\n        const totalAudits = this.securityAudits.size;\n        const recentAudits = Array.from(this.securityAudits.values())\n            .filter(audit => audit.timestamp > Date.now() - 3600000); // Last hour\n        \n        const eventCounts = recentAudits.reduce((counts, audit) => {\n            counts[audit.event] = (counts[audit.event] || 0) + 1;\n            return counts;\n        }, {});\n        \n        const highRiskEvents = recentAudits.filter(audit => \n            audit.data.securityRisk === 'high' || \n            audit.event.includes('violation')\n        );\n        \n        return {\n            timestamp: Date.now(),\n            totalAudits,\n            recentAudits: recentAudits.length,\n            eventCounts,\n            highRiskEvents: highRiskEvents.length,\n            activeContexts: this.isolationContexts.size,\n            systemStatus: {\n                sandboxingEnabled: this.config.enableSandboxing,\n                contentFilteringEnabled: this.config.enableContentFiltering,\n                rateLimitingEnabled: this.config.enableRateLimiting\n            }\n        };\n    }\n    \n    async shutdown() {\n        console.log('🔒 Shutting down Security Manager...');\n        \n        // Destroy all isolation contexts\n        for (const contextId of this.isolationContexts.keys()) {\n            this.destroyIsolationContext(contextId);\n        }\n        \n        await this.threatDetector.shutdown();\n        await this.contentSanitizer.shutdown();\n        await this.accessController.shutdown();\n        \n        console.log('✅ Security Manager shutdown complete');\n    }\n}\n\nclass ThreatDetector {\n    constructor(config) {\n        this.config = config;\n        this.knownThreats = new Set();\n        this.reputation = new Map();\n    }\n    \n    async scanUrl(url) {\n        // Simplified threat detection\n        const threats = [];\n        let threatLevel = 0;\n        let riskLevel = 'low';\n        \n        // Check against known threat patterns\n        const suspiciousPatterns = [\n            /malware/i,\n            /phishing/i,\n            /virus/i,\n            /trojan/i,\n            /ransomware/i\n        ];\n        \n        for (const pattern of suspiciousPatterns) {\n            if (pattern.test(url)) {\n                threats.push(`Suspicious pattern detected: ${pattern}`);\n                threatLevel += 0.3;\n            }\n        }\n        \n        // Check reputation\n        const domain = new URL(url).hostname;\n        if (this.reputation.has(domain)) {\n            const rep = this.reputation.get(domain);\n            if (rep.score < 0.3) {\n                threats.push('Domain has poor reputation');\n                threatLevel += 0.5;\n                riskLevel = 'high';\n            }\n        }\n        \n        return {\n            threats,\n            threatLevel,\n            riskLevel: threatLevel > 0.5 ? 'high' : threatLevel > 0.2 ? 'medium' : 'low'\n        };\n    }\n    \n    async shutdown() {\n        console.log('🛡️ Threat detector stopped');\n    }\n}\n\nclass ContentSanitizer {\n    constructor(config) {\n        this.config = config;\n    }\n    \n    async sanitize(content, websiteUrl, options = {}) {\n        if (!this.config.enableContentFiltering) {\n            return { content, sanitized: false, changes: [] };\n        }\n        \n        const changes = [];\n        let sanitizedContent = content;\n        \n        // Remove dangerous scripts\n        const scriptRegex = /<script[^>]*>.*?<\\/script>/gis;\n        const scriptMatches = content.match(scriptRegex);\n        if (scriptMatches) {\n            sanitizedContent = sanitizedContent.replace(scriptRegex, '');\n            changes.push(`Removed ${scriptMatches.length} script tags`);\n        }\n        \n        // Remove event handlers\n        const eventRegex = /\\son\\w+\\s*=\\s*[\"'][^\"']*[\"']/gi;\n        const eventMatches = content.match(eventRegex);\n        if (eventMatches) {\n            sanitizedContent = sanitizedContent.replace(eventRegex, '');\n            changes.push(`Removed ${eventMatches.length} event handlers`);\n        }\n        \n        // Remove iframes with suspicious sources\n        const iframeRegex = /<iframe[^>]+src=[\"'][^\"']*[\"'][^>]*>/gi;\n        sanitizedContent = sanitizedContent.replace(iframeRegex, (match) => {\n            if (/javascript:|data:|vbscript:/i.test(match)) {\n                changes.push('Removed suspicious iframe');\n                return '';\n            }\n            return match;\n        });\n        \n        return {\n            content: sanitizedContent,\n            sanitized: changes.length > 0,\n            changes\n        };\n    }\n    \n    async shutdown() {\n        console.log('🧹 Content sanitizer stopped');\n    }\n}\n\nclass AccessController {\n    constructor(config) {\n        this.config = config;\n        this.accessLog = new Map();\n    }\n    \n    checkAccess(userId, resource, action) {\n        // Simplified access control\n        const accessKey = `${userId}:${resource}:${action}`;\n        const now = Date.now();\n        \n        if (!this.accessLog.has(accessKey)) {\n            this.accessLog.set(accessKey, []);\n        }\n        \n        const log = this.accessLog.get(accessKey);\n        \n        // Clean old entries (last hour)\n        const recentEntries = log.filter(entry => entry > now - 3600000);\n        this.accessLog.set(accessKey, recentEntries);\n        \n        // Check rate limits\n        if (recentEntries.length > 1000) { // Max 1000 actions per hour\n            return {\n                allowed: false,\n                reason: 'Rate limit exceeded',\n                retryAfter: 3600000 - (now - recentEntries[0])\n            };\n        }\n        \n        // Log access\n        recentEntries.push(now);\n        \n        return {\n            allowed: true,\n            reason: 'Access granted'\n        };\n    }\n    \n    async shutdown() {\n        console.log('🔐 Access controller stopped');\n    }\n}\n\nmodule.exports = {\n    SecurityManager,\n    ThreatDetector,\n    ContentSanitizer,\n    AccessController\n};