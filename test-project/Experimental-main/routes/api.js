/**
 * 🌐 Advanced Proxy Embedder API Routes
 * REST API endpoints for controlling and monitoring the 1M+ proxy embedder system
 */

const express = require('express');
const router = express.Router();

// Import middleware
const {
    automationRateLimit,
    validateAutomationTask,
    handleValidationErrors,
    authenticateAutomation,
    monitorAutomationPerformance,
    automationSecurityHeaders
} = require('../middleware/automation');

/**
 * System Status and Health Endpoints
 */

// Get comprehensive system status
router.get('/system/status', authenticateAutomation, (req, res) => {
    try {
        const status = {
            timestamp: Date.now(),
            proxy: req.app.proxyPool ? req.app.proxyPool.getStatus() : { status: 'not-initialized' },
            embedding: req.app.embeddingEngine ? req.app.embeddingEngine.getSystemStatus() : { status: 'not-initialized' },
            monitoring: req.app.monitor ? req.app.monitor.getSnapshot() : { status: 'not-initialized' },
            automation: req.app.automationEngine ? req.app.automationEngine.getSystemStatus() : { status: 'not-initialized' },
            scaling: req.app.autoScaling ? req.app.autoScaling.getScalingStatus() : { status: 'not-initialized' }
        };
        
        res.json({
            success: true,
            data: status,
            meta: {
                responseTime: Date.now() - req.startTime,
                version: '1.0.0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system status',
            details: error.message
        });
    }
});

// Get system health check
router.get('/system/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version
    };
    
    // Check component health
    const components = {
        proxyPool: req.app.proxyPool?.isRunning || false,
        embeddingEngine: req.app.embeddingEngine?.isRunning || false,
        monitor: req.app.monitor?.isRunning || false,
        automationEngine: req.app.automationEngine?.isRunning || false,
        autoScaling: req.app.autoScaling?.isRunning || false
    };
    
    const unhealthyComponents = Object.entries(components)
        .filter(([, healthy]) => !healthy)
        .map(([name]) => name);
    
    if (unhealthyComponents.length > 0) {
        health.status = 'degraded';
        health.issues = unhealthyComponents;
    }
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
        success: true,
        data: health
    });
});

/**
 * Proxy Management Endpoints
 */

// Get proxy pool status
router.get('/proxy/status', authenticateAutomation, (req, res) => {
    try {
        const status = req.app.proxyPool.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get proxy status',
            details: error.message
        });
    }
});

// Get specific proxy instance status
router.get('/proxy/instances/:instanceId', authenticateAutomation, (req, res) => {
    try {
        const instanceId = req.params.instanceId;
        const instance = req.app.proxyPool.instances.get(instanceId);
        
        if (!instance) {
            return res.status(404).json({
                success: false,
                error: 'Proxy instance not found'
            });
        }
        
        res.json({
            success: true,
            data: instance.getStatus()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get proxy instance status',
            details: error.message
        });
    }
});

/**
 * Embedding Endpoints
 */

// Embed single website
router.post('/embed/single', 
    automationRateLimit,
    authenticateAutomation,
    automationSecurityHeaders,
    [
        require('express-validator').body('url')
            .isURL({ require_protocol: true, protocols: ['http', 'https'] })
            .withMessage('Valid URL is required'),
        require('express-validator').body('priority')
            .optional()
            .isInt({ min: 0, max: 4 })
            .withMessage('Priority must be between 0-4'),
        require('express-validator').body('timeout')
            .optional()
            .isInt({ min: 1000, max: 60000 })
            .withMessage('Timeout must be between 1000-60000ms')
    ],
    handleValidationErrors,
    monitorAutomationPerformance,
    async (req, res) => {
        try {
            const { url, priority = 2, timeout = 10000, ...options } = req.body;
            
            // Security validation
            const urlValidation = await req.app.securityManager.validateWebsiteUrl(url);
            if (!urlValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'URL security validation failed',
                    issues: urlValidation.issues,
                    securityRisk: urlValidation.securityRisk
                });
            }
            
            // Create isolation context
            const contextId = req.app.securityManager.createIsolationContext(url, 'single-embed');
            
            const result = await req.app.embeddingEngine.embedSingleWebsite(url, {
                priority,
                timeout,
                ...options,
                userId: req.automationUser.id,
                securityContext: contextId
            });
            
            res.json({
                success: true,
                data: {
                    embeddingId: result.id,
                    url,
                    status: result.status,
                    priority,
                    estimatedCompletion: result.estimatedCompletion,
                    securityContext: contextId
                },
                meta: {
                    responseTime: Date.now() - req.startTime,
                    instanceId: result.instanceId,
                    securityValidated: true
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to embed website',
                details: error.message
            });
        }
    }
);

// Embed multiple websites (batch)
router.post('/embed/batch',
    automationRateLimit,
    authenticateAutomation,
    automationSecurityHeaders,
    [
        require('express-validator').body('urls')
            .isArray({ min: 1, max: 1000 })
            .withMessage('URLs must be an array with 1-1000 items'),
        require('express-validator').body('urls.*')
            .isURL({ require_protocol: true, protocols: ['http', 'https'] })
            .withMessage('All URLs must be valid HTTP/HTTPS URLs'),
        require('express-validator').body('priority')
            .optional()
            .isInt({ min: 0, max: 4 })
            .withMessage('Priority must be between 0-4')
    ],
    handleValidationErrors,
    monitorAutomationPerformance,
    async (req, res) => {
        try {
            const { urls, priority = 2, ...options } = req.body;
            
            const result = await req.app.embeddingEngine.embedWebsites(urls, {
                priority,
                ...options,
                userId: req.automationUser.id
            });
            
            res.json({
                success: true,
                data: {
                    batchId: result.batchId,
                    totalEmbeddings: result.embeddings.length,
                    embeddings: result.embeddings,
                    estimatedProcessingTime: result.estimatedProcessingTime
                },
                meta: {
                    responseTime: Date.now() - req.startTime,
                    urlCount: urls.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to embed websites',
                details: error.message
            });
        }
    }
);

// Get embedding status
router.get('/embed/status/:embeddingId', authenticateAutomation, (req, res) => {
    try {
        const embeddingId = req.params.embeddingId;
        const status = req.app.embeddingEngine.getEmbeddingStatus(embeddingId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get embedding status',
            details: error.message
        });
    }
});

// Get batch status
router.get('/embed/batch/:batchId', authenticateAutomation, (req, res) => {
    try {
        const batchId = req.params.batchId;
        const status = req.app.embeddingEngine.getBatchStatus(batchId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get batch status',
            details: error.message
        });
    }
});

/**
 * Automation Task Endpoints
 */

// Create automation task
router.post('/automation/tasks',
    automationRateLimit,
    authenticateAutomation,
    automationSecurityHeaders,
    validateAutomationTask,
    handleValidationErrors,
    monitorAutomationPerformance,
    async (req, res) => {
        try {
            const { type, config, priority = 2, ...options } = req.body;
            
            const taskDefinition = {
                type,
                config,
                priority
            };
            
            const result = await req.app.automationEngine.createTask(taskDefinition, {
                ...options,
                userId: req.automationUser.id
            });
            
            res.json({
                success: true,
                data: result,
                meta: {
                    responseTime: Date.now() - req.startTime
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to create automation task',
                details: error.message
            });
        }
    }
);

// Create task from template
router.post('/automation/tasks/template/:templateName',
    automationRateLimit,
    authenticateAutomation,
    automationSecurityHeaders,
    handleValidationErrors,
    monitorAutomationPerformance,
    async (req, res) => {
        try {
            const templateName = req.params.templateName;
            const { config = {}, ...options } = req.body;
            
            const result = await req.app.automationEngine.createTaskFromTemplate(
                templateName,
                config,
                {
                    ...options,
                    userId: req.automationUser.id
                }
            );
            
            res.json({
                success: true,
                data: result,
                meta: {
                    responseTime: Date.now() - req.startTime,
                    template: templateName
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to create task from template',
                details: error.message
            });
        }
    }
);

// Get task status
router.get('/automation/tasks/:taskId', authenticateAutomation, (req, res) => {
    try {
        const taskId = req.params.taskId;
        const status = req.app.automationEngine.getTaskStatus(taskId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get task status',
            details: error.message
        });
    }
});

// Cancel task
router.delete('/automation/tasks/:taskId', authenticateAutomation, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        await req.app.automationEngine.cancelTask(taskId);
        
        res.json({
            success: true,
            message: 'Task cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to cancel task',
            details: error.message
        });
    }
});

// Pause task
router.post('/automation/tasks/:taskId/pause', authenticateAutomation, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        await req.app.automationEngine.pauseTask(taskId);
        
        res.json({
            success: true,
            message: 'Task paused successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to pause task',
            details: error.message
        });
    }
});

// Resume task
router.post('/automation/tasks/:taskId/resume', authenticateAutomation, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        await req.app.automationEngine.resumeTask(taskId);
        
        res.json({
            success: true,
            message: 'Task resumed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resume task',
            details: error.message
        });
    }
});

/**
 * Monitoring and Analytics Endpoints
 */

// Get real-time metrics
router.get('/monitoring/metrics', authenticateAutomation, (req, res) => {
    try {
        const metrics = req.app.monitor.getSnapshot();
        
        res.json({
            success: true,
            data: metrics,
            meta: {
                responseTime: Date.now() - req.startTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get metrics',
            details: error.message
        });
    }
});

// Get historical data
router.get('/monitoring/history', authenticateAutomation, (req, res) => {
    try {
        const { startTime, endTime, resolution = 'raw' } = req.query;
        
        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'startTime and endTime query parameters are required'
            });
        }
        
        const data = req.app.monitor.getHistoricalData(
            parseInt(startTime),
            parseInt(endTime),
            resolution
        );
        
        res.json({
            success: true,
            data: {
                dataPoints: data.length,
                resolution,
                timeRange: {
                    start: parseInt(startTime),
                    end: parseInt(endTime)
                },
                data
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get historical data',
            details: error.message
        });
    }
});

// Get alerts
router.get('/monitoring/alerts', authenticateAutomation, (req, res) => {
    try {
        const { severity, resolved = false } = req.query;
        const alerts = req.app.monitor.getAlerts(severity, resolved === 'true');
        
        res.json({
            success: true,
            data: {
                total: alerts.length,
                alerts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts',
            details: error.message
        });
    }
});

// Resolve alert
router.post('/monitoring/alerts/:alertId/resolve', authenticateAutomation, (req, res) => {
    try {
        const alertId = req.params.alertId;
        req.app.monitor.resolveAlert(alertId);
        
        res.json({
            success: true,
            message: 'Alert resolved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to resolve alert',
            details: error.message
        });
    }
});

// Export metrics
router.get('/monitoring/export', authenticateAutomation, async (req, res) => {
    try {
        const { format = 'json', timeRange = '1h' } = req.query;
        
        const data = await req.app.monitor.exportMetrics(format, timeRange);
        
        const filename = `metrics-${Date.now()}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
        
        res.send(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to export metrics',
            details: error.message
        });
    }
});

/**
 * Auto-Scaling Endpoints
 */

// Get scaling status
router.get('/scaling/status', authenticateAutomation, (req, res) => {
    try {
        const status = req.app.autoScaling.getScalingStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get scaling status',
            details: error.message
        });
    }
});

// Trigger manual scaling
router.post('/scaling/manual', 
    authenticateAutomation,
    [
        require('express-validator').body('action')
            .isIn(['scale-up', 'scale-down'])
            .withMessage('Action must be scale-up or scale-down'),
        require('express-validator').body('instances')
            .isInt({ min: 1, max: 100 })
            .withMessage('Instances must be between 1-100')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { action, instances, reason = 'Manual scaling' } = req.body;
            
            const decision = {
                action,
                instances,
                reason,
                confidence: 1.0,
                urgency: 'manual'
            };
            
            // Trigger manual scaling
            await req.app.autoScaling._executeScaleAction(decision);
            
            res.json({
                success: true,
                message: `Manual ${action} initiated`,
                data: {
                    action,
                    instances,
                    reason
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to execute manual scaling',
                details: error.message
            });
        }
    }
);

/**
 * Security Endpoints
 */

// Get security report
router.get('/security/report', authenticateAutomation, (req, res) => {
    try {
        const report = req.app.securityManager.getSecurityReport();
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security report',
            details: error.message
        });
    }
});

// Validate URL
router.post('/security/validate-url',
    authenticateAutomation,
    [
        require('express-validator').body('url')
            .isURL({ require_protocol: true, protocols: ['http', 'https'] })
            .withMessage('Valid URL is required')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { url } = req.body;
            const validation = await req.app.securityManager.validateWebsiteUrl(url);
            
            res.json({
                success: true,
                data: validation
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to validate URL',
                details: error.message
            });
        }
    }
);

// Get isolation context status
router.get('/security/context/:contextId', authenticateAutomation, (req, res) => {
    try {
        const contextId = req.params.contextId;
        const status = req.app.securityManager.getContextStatus(contextId);
        
        if (!status) {
            return res.status(404).json({
                success: false,
                error: 'Security context not found'
            });
        }
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get context status',
            details: error.message
        });
    }
});

/**
 * Performance and Statistics Endpoints
 */

// Get performance statistics
router.get('/stats/performance', authenticateAutomation, (req, res) => {
    try {
        const stats = {
            timestamp: Date.now(),
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            proxy: req.app.proxyPool ? {
                totalInstances: req.app.proxyPool.globalMetrics.totalInstances,
                activeInstances: req.app.proxyPool.globalMetrics.activeInstances,
                totalRequests: req.app.proxyPool.globalMetrics.totalRequests,
                avgResponseTime: req.app.proxyPool.globalMetrics.avgResponseTime
            } : null,
            embedding: req.app.embeddingEngine ? req.app.embeddingEngine.processingStats : null,
            automation: req.app.automationEngine ? req.app.automationEngine.metrics : null
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get performance statistics',
            details: error.message
        });
    }
});

// Get capacity information
router.get('/stats/capacity', authenticateAutomation, (req, res) => {
    try {
        const monitor = req.app.monitor.getSnapshot();
        
        const capacity = {
            current: {
                proxyInstances: monitor.proxy?.activeInstances || 0,
                activeEmbeddings: monitor.embedding?.activeEmbeddings || 0,
                queueDepth: monitor.embedding?.queueDepth || 0
            },
            limits: {
                maxProxyInstances: req.app.proxyPool?.config.maxInstances || 1000000,
                maxConcurrentEmbeddings: req.app.embeddingEngine?.config.maxConcurrentEmbeddings || 1000000,
                maxAutomationTasks: req.app.automationEngine?.config.maxConcurrentTasks || 100000
            },
            utilization: {
                proxy: monitor.proxy?.activeInstances / (req.app.proxyPool?.config.maxInstances || 1000000) * 100,
                embedding: monitor.embedding?.activeEmbeddings / (req.app.embeddingEngine?.config.maxConcurrentEmbeddings || 1000000) * 100,
                automation: (req.app.automationEngine?.metrics.activeTasks || 0) / (req.app.automationEngine?.config.maxConcurrentTasks || 100000) * 100
            }
        };
        
        res.json({
            success: true,
            data: capacity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get capacity information',
            details: error.message
        });
    }
});

/**
 * WebSocket endpoint for real-time updates
 */
router.get('/realtime/connect', (req, res) => {
    res.json({
        success: true,
        message: 'WebSocket endpoint available',
        endpoint: '/ws/realtime',
        documentation: {
            events: [
                'metrics-updated',
                'embedding-completed',
                'embedding-failed',
                'task-completed',
                'alert',
                'scaling-action'
            ],
            authentication: 'Send API key in connection query: ?apiKey=your-key'
        }
    });
});

/**
 * 🌐 MASSIVE SCALE EMBEDDING ENDPOINTS FOR 1M+ WEBSITES
 */

// Massive scale embedding endpoint
router.post('/embedding/massive-scale', 
    automationRateLimit,
    authenticateAutomation,
    [
        require('express-validator').body('websites')
            .isArray({ min: 1, max: 1000000 })
            .withMessage('Websites must be an array with 1-1,000,000 URLs'),
        require('express-validator').body('websites.*')
            .isURL({ require_protocol: true, protocols: ['http', 'https'] })
            .withMessage('Each website must be a valid HTTP/HTTPS URL'),
        require('express-validator').body('options.shardCount')
            .optional()
            .isInt({ min: 1, max: 10000 })
            .withMessage('Shard count must be between 1-10,000'),
        require('express-validator').body('options.priority')
            .optional()
            .isInt({ min: 0, max: 4 })
            .withMessage('Priority must be between 0-4')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { websites, options = {} } = req.body;
            
            console.log(`🚀 Massive scale embedding request: ${websites.length} websites`);
            
            // Validate system capacity
            if (websites.length > 1000000) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 1,000,000 websites supported per request',
                    limit: 1000000,
                    requested: websites.length
                });
            }
            
            // Security validation for massive scale
            const securityValidation = await req.app.securityManager.validateMassiveScale(websites, options);
            if (!securityValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Massive scale security validation failed',
                    issues: securityValidation.issues,
                    securityRisk: securityValidation.securityRisk
                });
            }
            
            // Start massive scale embedding
            const result = await req.app.embeddingEngine.embedMassiveScale(websites, {
                ...options,
                userId: req.automationUser.id,
                requestId: req.headers['x-request-id'] || crypto.randomUUID()
            });
            
            res.json({
                success: true,
                data: {
                    batchId: result.batchId,
                    totalWebsites: websites.length,
                    shardCount: result.results.length,
                    status: 'initiated',
                    estimatedCompletionTime: Math.ceil(websites.length / 1000) * 60, // seconds
                    monitoringUrl: `/api/embedding/massive-scale/${result.batchId}/status`
                },
                meta: {
                    responseTime: Date.now() - req.startTime,
                    requestId: req.headers['x-request-id'],
                    userId: req.automationUser.id
                }
            });
        } catch (error) {
            console.error('Massive scale embedding error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to initiate massive scale embedding',
                details: error.message
            });
        }
    }
);

// Get massive scale progress
router.get('/embedding/massive-scale/:batchId/status',
    authenticateAutomation,
    async (req, res) => {
        try {
            const { batchId } = req.params;
            const progress = req.app.embeddingEngine.getMassiveScaleProgress();
            
            // Filter progress for this specific batch
            const batchProgress = {
                batchId,
                ...progress,
                shards: progress.shards.filter(s => s.id.startsWith(batchId))
            };
            
            res.json({
                success: true,
                data: batchProgress,
                meta: {
                    responseTime: Date.now() - req.startTime,
                    lastUpdated: Date.now()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get massive scale progress',
                details: error.message
            });
        }
    }
);

/**
 * 🎮 REAL-TIME AUTOMATION CONTROL ENDPOINTS
 */

// Enable automation controls for session
router.post('/automation/enable/:sessionId',
    automationRateLimit,
    authenticateAutomation,
    [
        require('express-validator').body('automationRules')
            .optional()
            .isArray()
            .withMessage('Automation rules must be an array'),
        require('express-validator').body('embeddingIds')
            .isArray({ min: 1 })
            .withMessage('Embedding IDs must be a non-empty array')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { automationRules = [], embeddingIds } = req.body;
            
            // Initialize massive scale control
            const result = await req.app.embeddingEngine.enableAutomationControls(sessionId, automationRules);
            
            res.json({
                success: true,
                data: result,
                meta: {
                    responseTime: Date.now() - req.startTime,
                    sessionId,
                    embeddingCount: embeddingIds.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to enable automation controls',
                details: error.message
            });
        }
    }
);

// Execute real-time command
router.post('/automation/command/:sessionId',
    automationRateLimit,
    authenticateAutomation,
    [
        require('express-validator').body('command')
            .isObject()
            .withMessage('Command must be an object'),
        require('express-validator').body('command.type')
            .isIn(['click', 'fill', 'navigate', 'scroll', 'screenshot', 'custom'])
            .withMessage('Invalid command type'),
        require('express-validator').body('command.priority')
            .optional()
            .isInt({ min: 0, max: 4 })
            .withMessage('Priority must be between 0-4')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { command } = req.body;
            
            // Execute real-time command across all embeddings
            const result = await req.app.embeddingEngine.executeRealTimeCommand(sessionId, command);
            
            res.json({
                success: true,
                data: result,
                meta: {
                    responseTime: Date.now() - req.startTime,
                    sessionId,
                    commandId: result.id
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to execute real-time command',
                details: error.message
            });
        }
    }
);

/**
 * 👁️ LIVE VIEWING ENDPOINTS
 */

// Enable live viewing
router.post('/live-view/enable',
    authenticateAutomation,
    [
        require('express-validator').body('options.refreshRate')
            .optional()
            .isInt({ min: 1, max: 60 })
            .withMessage('Refresh rate must be between 1-60 FPS')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { options = {} } = req.body;
            
            const result = await req.app.embeddingEngine.enableLiveViewing(options);
            
            res.json({
                success: true,
                data: result,
                meta: {
                    responseTime: Date.now() - req.startTime
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to enable live viewing',
                details: error.message
            });
        }
    }
);

// Create live viewing session
router.post('/live-view/session',
    authenticateAutomation,
    [
        require('express-validator').body('embeddingIds')
            .isArray({ min: 1 })
            .withMessage('Embedding IDs must be a non-empty array'),
        require('express-validator').body('viewerOptions.quality')
            .optional()
            .isIn(['low', 'medium', 'high'])
            .withMessage('Quality must be low, medium, or high')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { embeddingIds, viewerOptions = {} } = req.body;
            
            const session = await req.app.embeddingEngine.createLiveViewingSession(embeddingIds, viewerOptions);
            
            res.json({
                success: true,
                data: session,
                meta: {
                    responseTime: Date.now() - req.startTime,
                    embeddingCount: embeddingIds.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to create live viewing session',
                details: error.message
            });
        }
    }
);

/**
 * 📊 SYSTEM STATUS AND MONITORING ENDPOINTS
 */

// Get massive scale system status
router.get('/system/massive-scale-status', authenticateAutomation, (req, res) => {
    try {
        const status = {
            timestamp: Date.now(),
            embeddingEngine: req.app.embeddingEngine ? req.app.embeddingEngine.getSystemStatus() : null,
            proxyPool: req.app.proxyPool ? req.app.proxyPool.getStatus() : null,
            automationEngine: req.app.automationEngine ? req.app.automationEngine.getMassiveScaleStatus() : null,
            systemHealth: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                cpu: process.cpuUsage()
            }
        };
        
        res.json({
            success: true,
            data: status,
            meta: {
                responseTime: Date.now() - req.startTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get massive scale status',
            details: error.message
        });
    }
});

// Get proxy countries status
router.get('/proxy/countries', authenticateAutomation, (req, res) => {
    try {
        const countries = req.app.proxyPool ? req.app.proxyPool.getCountriesStatus() : {};
        
        res.json({
            success: true,
            data: {
                supportedCountries: Object.keys(countries),
                countriesStatus: countries,
                totalProxies: Object.values(countries).reduce((sum, country) => sum + (country.activeProxies || 0), 0)
            },
            meta: {
                responseTime: Date.now() - req.startTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get proxy countries status',
            details: error.message
        });
    }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: Date.now(),
        path: req.path,
        method: req.method
    });
});

module.exports = router;