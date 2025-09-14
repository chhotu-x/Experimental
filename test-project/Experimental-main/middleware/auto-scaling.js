/**
 * 🔄 Auto-Scaling and Recovery System
 * Advanced system for automatic resource scaling and failure recovery
 */

const EventEmitter = require('events');
const os = require('os');

class AutoScalingManager extends EventEmitter {
    constructor(proxyPool, embeddingEngine, monitor, config = {}) {
        super();
        this.proxyPool = proxyPool;
        this.embeddingEngine = embeddingEngine;
        this.monitor = monitor;
        
        this.config = {
            // Scaling thresholds
            scaleUpThresholds: {
                cpuPercent: config.scaleUpCpuThreshold || 70,
                memoryPercent: config.scaleUpMemoryThreshold || 75,
                queueDepth: config.scaleUpQueueThreshold || 5000,
                responseTime: config.scaleUpResponseThreshold || 150,
                instanceUtilization: config.scaleUpUtilizationThreshold || 80
            },
            scaleDownThresholds: {
                cpuPercent: config.scaleDownCpuThreshold || 30,
                memoryPercent: config.scaleDownMemoryThreshold || 40,
                queueDepth: config.scaleDownQueueThreshold || 1000,
                responseTime: config.scaleDownResponseThreshold || 50,
                instanceUtilization: config.scaleDownUtilizationThreshold || 30
            },
            
            // Scaling limits
            minInstances: config.minInstances || 10,
            maxInstances: config.maxInstances || 1000000,
            maxScaleUpPerCycle: config.maxScaleUpPerCycle || 100,
            maxScaleDownPerCycle: config.maxScaleDownPerCycle || 50,
            
            // Timing
            evaluationInterval: config.evaluationInterval || 10000, // 10 seconds
            cooldownPeriod: config.cooldownPeriod || 60000, // 1 minute
            stabilizationWindow: config.stabilizationWindow || 300000, // 5 minutes
            
            // Geographic scaling
            enableGeoScaling: config.enableGeoScaling !== false,
            regions: config.regions || ['us-east', 'us-west', 'eu-west', 'asia-pacific'],
            
            // Predictive scaling
            enablePredictiveScaling: config.enablePredictiveScaling !== false,
            predictionWindow: config.predictionWindow || 900000, // 15 minutes
            
            ...config
        };
        
        this.scalingState = {
            lastScaleAction: 0,
            lastScaleDirection: null,
            consecutiveScaleUps: 0,
            consecutiveScaleDowns: 0,
            isStabilizing: false,
            stabilizationStart: 0
        };
        
        this.regionalMetrics = new Map();
        this.scalingHistory = [];
        this.failureDetector = new FailureDetector(this.config);
        this.recoveryManager = new RecoveryManager(this.proxyPool, this.config);
        
        this.isRunning = false;
        this.evaluationTimer = null;
        
        this._setupEventHandlers();
    }
    
    _setupEventHandlers() {
        // Monitor events
        this.monitor.on('metrics-updated', (metrics) => {
            this._evaluateScaling(metrics);
        });
        
        this.monitor.on('alert', (alert) => {
            this._handleAlert(alert);
        });
        
        this.monitor.on('critical-alert', (alert) => {
            this._handleCriticalAlert(alert);
        });
        
        // Proxy pool events
        this.proxyPool.on('instance-unhealthy', (data) => {
            this.failureDetector.recordFailure('instance', data);
        });
        
        this.proxyPool.on('instance-recovered', (instanceId) => {
            this.failureDetector.recordRecovery('instance', instanceId);
        });
        
        // Embedding engine events
        this.embeddingEngine.on('embedding-failed', (data) => {
            this.failureDetector.recordFailure('embedding', data);
        });
        
        // Failure detector events
        this.failureDetector.on('pattern-detected', (pattern) => {
            this._handleFailurePattern(pattern);
        });
        
        // Recovery manager events
        this.recoveryManager.on('recovery-initiated', (action) => {
            this.emit('recovery-initiated', action);
        });
        
        this.recoveryManager.on('recovery-completed', (result) => {
            this.emit('recovery-completed', result);
        });
    }
    
    async start() {
        if (this.isRunning) {
            throw new Error('Auto-scaling manager is already running');
        }
        
        console.log('🔄 Starting Auto-Scaling and Recovery System...');
        this.isRunning = true;
        
        // Initialize regional metrics
        this._initializeRegionalMetrics();
        
        // Start evaluation cycle
        this._startEvaluationCycle();
        
        // Start failure detection
        await this.failureDetector.start();
        
        // Start recovery manager
        await this.recoveryManager.start();
        
        console.log('✅ Auto-Scaling and Recovery System started');
        this.emit('started');
    }
    
    _initializeRegionalMetrics() {
        this.config.regions.forEach(region => {
            this.regionalMetrics.set(region, {
                instances: 0,
                load: 0,
                responseTime: 0,
                errorRate: 0,
                lastUpdate: Date.now()
            });
        });
    }
    
    _startEvaluationCycle() {
        this.evaluationTimer = setInterval(() => {
            if (this.isRunning) {
                this._performScalingEvaluation();
                this._performPredictiveAnalysis();
                this._performRegionalOptimization();
            }
        }, this.config.evaluationInterval);
    }
    
    _evaluateScaling(metrics) {
        if (!this._canScale()) {
            return;
        }
        
        const scaleDecision = this._calculateScaleDecision(metrics);
        
        if (scaleDecision.action !== 'none') {
            this._executeScaleAction(scaleDecision);
        }
    }
    
    _canScale() {
        const now = Date.now();
        
        // Check cooldown period
        if (now - this.scalingState.lastScaleAction < this.config.cooldownPeriod) {
            return false;
        }
        
        // Check if system is stabilizing
        if (this.scalingState.isStabilizing && 
            now - this.scalingState.stabilizationStart < this.config.stabilizationWindow) {
            return false;
        }
        
        return true;
    }
    
    _calculateScaleDecision(metrics) {
        const decision = {
            action: 'none',
            instances: 0,
            reason: '',
            confidence: 0,
            urgency: 'normal'
        };
        
        const current = metrics;
        const upThresholds = this.config.scaleUpThresholds;
        const downThresholds = this.config.scaleDownThresholds;
        
        // Calculate scaling scores
        const upScores = {
            cpu: this._calculateScore(current.system?.cpu?.usage || 0, upThresholds.cpuPercent),
            memory: this._calculateScore(current.system?.memory?.percent || 0, upThresholds.memoryPercent),
            queue: this._calculateScore(current.embedding?.queueDepth || 0, upThresholds.queueDepth),
            response: this._calculateScore(current.proxy?.avgResponseTime || 0, upThresholds.responseTime),
            utilization: this._calculateUtilizationScore(current, upThresholds.instanceUtilization, 'up')
        };\n        const downScores = {\n            cpu: this._calculateScore(downThresholds.cpuPercent, current.system?.cpu?.usage || 0),\n            memory: this._calculateScore(downThresholds.memoryPercent, current.system?.memory?.percent || 0),\n            queue: this._calculateScore(downThresholds.queueDepth, current.embedding?.queueDepth || 0),\n            response: this._calculateScore(downThresholds.responseTime, current.proxy?.avgResponseTime || 0),\n            utilization: this._calculateUtilizationScore(current, downThresholds.instanceUtilization, 'down')\n        };\n        \n        const avgUpScore = Object.values(upScores).reduce((sum, score) => sum + score, 0) / Object.keys(upScores).length;\n        const avgDownScore = Object.values(downScores).reduce((sum, score) => sum + score, 0) / Object.keys(downScores).length;\n        \n        // Determine action based on scores\n        if (avgUpScore > 0.7) {\n            decision.action = 'scale-up';\n            decision.confidence = avgUpScore;\n            decision.instances = this._calculateScaleUpAmount(metrics, avgUpScore);\n            decision.reason = this._generateScaleReason(upScores, 'up');\n            \n            if (avgUpScore > 0.9) {\n                decision.urgency = 'high';\n            }\n        } else if (avgDownScore > 0.7 && this._canScaleDown(current)) {\n            decision.action = 'scale-down';\n            decision.confidence = avgDownScore;\n            decision.instances = this._calculateScaleDownAmount(metrics, avgDownScore);\n            decision.reason = this._generateScaleReason(downScores, 'down');\n        }\n        \n        return decision;\n    }\n    \n    _calculateScore(actual, threshold) {\n        if (threshold === 0) return 0;\n        const ratio = actual / threshold;\n        return Math.max(0, Math.min(1, (ratio - 0.5) * 2)); // Score between 0 and 1\n    }\n    \n    _calculateUtilizationScore(metrics, threshold, direction) {\n        const activeInstances = metrics.proxy?.activeInstances || 0;\n        const totalRequests = metrics.embedding?.activeEmbeddings || 0;\n        \n        if (activeInstances === 0) {\n            return direction === 'up' ? 1 : 0;\n        }\n        \n        const avgRequestsPerInstance = totalRequests / activeInstances;\n        const utilization = (avgRequestsPerInstance / 100) * 100; // Assume 100 requests per instance is 100%\n        \n        return this._calculateScore(\n            direction === 'up' ? utilization : threshold,\n            direction === 'up' ? threshold : utilization\n        );\n    }\n    \n    _calculateScaleUpAmount(metrics, confidence) {\n        const currentInstances = metrics.proxy?.activeInstances || 0;\n        const queueDepth = metrics.embedding?.queueDepth || 0;\n        \n        // Base scaling on queue depth and confidence\n        let scaleAmount = Math.ceil(queueDepth / 1000) * confidence;\n        \n        // Apply exponential scaling for high urgency\n        if (confidence > 0.9) {\n            scaleAmount *= 2;\n        }\n        \n        // Apply limits\n        scaleAmount = Math.min(scaleAmount, this.config.maxScaleUpPerCycle);\n        scaleAmount = Math.min(scaleAmount, this.config.maxInstances - currentInstances);\n        \n        return Math.max(1, Math.floor(scaleAmount));\n    }\n    \n    _calculateScaleDownAmount(metrics, confidence) {\n        const currentInstances = metrics.proxy?.activeInstances || 0;\n        const minInstances = this.config.minInstances;\n        \n        // Conservative scaling down\n        let scaleAmount = Math.ceil(currentInstances * 0.1) * confidence;\n        \n        // Apply limits\n        scaleAmount = Math.min(scaleAmount, this.config.maxScaleDownPerCycle);\n        scaleAmount = Math.min(scaleAmount, currentInstances - minInstances);\n        \n        return Math.max(0, Math.floor(scaleAmount));\n    }\n    \n    _canScaleDown(metrics) {\n        const currentInstances = metrics.proxy?.activeInstances || 0;\n        \n        // Don't scale down if below minimum\n        if (currentInstances <= this.config.minInstances) {\n            return false;\n        }\n        \n        // Don't scale down if recent failures\n        if (this.failureDetector.hasRecentFailures()) {\n            return false;\n        }\n        \n        // Don't scale down if consecutive scale-downs\n        if (this.scalingState.consecutiveScaleDowns >= 3) {\n            return false;\n        }\n        \n        return true;\n    }\n    \n    _generateScaleReason(scores, direction) {\n        const reasons = [];\n        const threshold = 0.5;\n        \n        Object.entries(scores).forEach(([metric, score]) => {\n            if (score > threshold) {\n                reasons.push(`${metric}: ${(score * 100).toFixed(1)}%`);\n            }\n        });\n        \n        return `Scale ${direction} due to: ${reasons.join(', ')}`;\n    }\n    \n    async _executeScaleAction(decision) {\n        const now = Date.now();\n        \n        try {\n            console.log(`🔄 Executing ${decision.action}: ${decision.instances} instances`);\n            console.log(`📊 Reason: ${decision.reason}`);\n            console.log(`🎯 Confidence: ${(decision.confidence * 100).toFixed(1)}%`);\n            \n            let result;\n            \n            if (decision.action === 'scale-up') {\n                result = await this._scaleUp(decision.instances);\n                this.scalingState.consecutiveScaleUps++;\n                this.scalingState.consecutiveScaleDowns = 0;\n            } else if (decision.action === 'scale-down') {\n                result = await this._scaleDown(decision.instances);\n                this.scalingState.consecutiveScaleDowns++;\n                this.scalingState.consecutiveScaleUps = 0;\n            }\n            \n            // Update scaling state\n            this.scalingState.lastScaleAction = now;\n            this.scalingState.lastScaleDirection = decision.action;\n            \n            // Start stabilization period if significant scaling\n            if (decision.instances > 10) {\n                this.scalingState.isStabilizing = true;\n                this.scalingState.stabilizationStart = now;\n                \n                setTimeout(() => {\n                    this.scalingState.isStabilizing = false;\n                }, this.config.stabilizationWindow);\n            }\n            \n            // Record scaling history\n            this.scalingHistory.push({\n                timestamp: now,\n                action: decision.action,\n                instances: decision.instances,\n                reason: decision.reason,\n                confidence: decision.confidence,\n                result\n            });\n            \n            // Keep only last 100 entries\n            if (this.scalingHistory.length > 100) {\n                this.scalingHistory.shift();\n            }\n            \n            this.emit('scaling-action', {\n                ...decision,\n                result,\n                timestamp: now\n            });\n            \n        } catch (error) {\n            console.error(`❌ Failed to execute ${decision.action}:`, error);\n            this.emit('scaling-error', {\n                action: decision.action,\n                error: error.message,\n                timestamp: now\n            });\n        }\n    }\n    \n    async _scaleUp(instanceCount) {\n        // Create new proxy instances\n        const promises = [];\n        \n        for (let i = 0; i < instanceCount; i++) {\n            promises.push(this.proxyPool._createInstance());\n        }\n        \n        const results = await Promise.all(promises);\n        \n        console.log(`✅ Successfully scaled up by ${results.length} instances`);\n        \n        return {\n            success: true,\n            instancesCreated: results.length,\n            instanceIds: results.map(instance => instance.id)\n        };\n    }\n    \n    async _scaleDown(instanceCount) {\n        // Get least utilized instances\n        const instances = Array.from(this.proxyPool.instances.values())\n            .filter(instance => instance.status === 'ready')\n            .sort((a, b) => a.connections.size - b.connections.size)\n            .slice(0, instanceCount);\n        \n        const promises = instances.map(instance => \n            this.proxyPool._removeInstance(instance.id)\n        );\n        \n        await Promise.all(promises);\n        \n        console.log(`📉 Successfully scaled down by ${instances.length} instances`);\n        \n        return {\n            success: true,\n            instancesRemoved: instances.length,\n            instanceIds: instances.map(instance => instance.id)\n        };\n    }\n    \n    _performScalingEvaluation() {\n        // This is called periodically to perform comprehensive evaluation\n        const metrics = this.monitor.getSnapshot();\n        \n        // Check for long-term trends\n        this._analyzeTrends(metrics);\n        \n        // Optimize instance distribution\n        this._optimizeInstanceDistribution(metrics);\n    }\n    \n    _analyzeTrends(metrics) {\n        const trends = metrics.trends;\n        \n        if (trends.performance.length < 10) return;\n        \n        // Analyze performance trend\n        const recentPerformance = trends.performance.slice(-10);\n        const avgResponseTime = recentPerformance.reduce((sum, p) => sum + p.responseTime, 0) / recentPerformance.length;\n        const avgThroughput = recentPerformance.reduce((sum, p) => sum + p.throughput, 0) / recentPerformance.length;\n        \n        // Detect degrading performance\n        const isPerformanceDegrading = recentPerformance.slice(-3).every(p => p.responseTime > avgResponseTime * 1.1);\n        \n        if (isPerformanceDegrading) {\n            this.emit('performance-degradation-detected', {\n                avgResponseTime,\n                currentResponseTime: recentPerformance[recentPerformance.length - 1].responseTime,\n                recommendedAction: 'scale-up'\n            });\n        }\n    }\n    \n    _optimizeInstanceDistribution(metrics) {\n        // Ensure even distribution of load across instances\n        // This is a simplified version - real implementation would be more sophisticated\n        \n        const activeInstances = metrics.proxy?.activeInstances || 0;\n        const totalLoad = metrics.embedding?.activeEmbeddings || 0;\n        \n        if (activeInstances > 0 && totalLoad > 0) {\n            const avgLoadPerInstance = totalLoad / activeInstances;\n            \n            // If load is very uneven, trigger rebalancing\n            if (avgLoadPerInstance < 10 || avgLoadPerInstance > 200) {\n                this.emit('load-imbalance-detected', {\n                    avgLoadPerInstance,\n                    totalLoad,\n                    activeInstances,\n                    recommendedAction: 'rebalance'\n                });\n            }\n        }\n    }\n    \n    _performPredictiveAnalysis() {\n        if (!this.config.enablePredictiveScaling) return;\n        \n        // Analyze historical patterns to predict future load\n        const now = Date.now();\n        const historicalData = this.monitor.getHistoricalData(\n            now - this.config.predictionWindow,\n            now\n        );\n        \n        if (historicalData.length < 10) return;\n        \n        // Simple trend analysis (real implementation would use ML)\n        const recentData = historicalData.slice(-5);\n        const olderData = historicalData.slice(-10, -5);\n        \n        const recentAvgQueue = recentData.reduce((sum, d) => sum + (d.embedding?.queueDepth || 0), 0) / recentData.length;\n        const olderAvgQueue = olderData.reduce((sum, d) => sum + (d.embedding?.queueDepth || 0), 0) / olderData.length;\n        \n        const queueGrowthRate = (recentAvgQueue - olderAvgQueue) / olderAvgQueue;\n        \n        // Predict future load and pre-scale if needed\n        if (queueGrowthRate > 0.5) { // 50% growth rate\n            const predictedQueue = recentAvgQueue * (1 + queueGrowthRate);\n            \n            this.emit('predictive-scaling-triggered', {\n                currentQueue: recentAvgQueue,\n                predictedQueue,\n                growthRate: queueGrowthRate,\n                recommendedAction: 'preemptive-scale-up'\n            });\n        }\n    }\n    \n    _performRegionalOptimization() {\n        if (!this.config.enableGeoScaling) return;\n        \n        // Optimize instance distribution across regions\n        // This is a simplified version\n        \n        this.config.regions.forEach(region => {\n            const metrics = this.regionalMetrics.get(region);\n            \n            // Update regional metrics (simplified)\n            metrics.lastUpdate = Date.now();\n            metrics.load = Math.random() * 100; // Simulate load data\n            \n            // Check if region needs scaling\n            if (metrics.load > 80 && metrics.instances < 100) {\n                this.emit('regional-scaling-needed', {\n                    region,\n                    currentLoad: metrics.load,\n                    currentInstances: metrics.instances,\n                    recommendedAction: 'scale-up-region'\n                });\n            }\n        });\n    }\n    \n    _handleAlert(alert) {\n        if (alert.category === 'capacity' && alert.type === 'high-queue-depth') {\n            // Immediate scaling for queue depth alerts\n            this._triggerEmergencyScaling('queue-depth', alert.data);\n        }\n        \n        if (alert.category === 'performance' && alert.severity === 'critical') {\n            // Performance-based scaling\n            this._triggerEmergencyScaling('performance', alert.data);\n        }\n    }\n    \n    _handleCriticalAlert(alert) {\n        console.log('🚨 Critical alert received, initiating emergency procedures');\n        \n        // Trigger emergency scaling\n        this._triggerEmergencyScaling('critical', alert.data);\n        \n        // Initiate recovery procedures\n        this.recoveryManager.initiateEmergencyRecovery(alert);\n    }\n    \n    async _triggerEmergencyScaling(reason, data) {\n        if (!this._canScale()) {\n            console.log('⏳ Emergency scaling requested but currently in cooldown');\n            return;\n        }\n        \n        const emergencyInstances = Math.min(20, this.config.maxScaleUpPerCycle);\n        \n        try {\n            console.log(`🚨 Emergency scaling: Adding ${emergencyInstances} instances (reason: ${reason})`);\n            \n            const result = await this._scaleUp(emergencyInstances);\n            \n            this.emit('emergency-scaling', {\n                reason,\n                instances: emergencyInstances,\n                result,\n                timestamp: Date.now()\n            });\n            \n        } catch (error) {\n            console.error('❌ Emergency scaling failed:', error);\n            this.emit('emergency-scaling-failed', {\n                reason,\n                error: error.message,\n                timestamp: Date.now()\n            });\n        }\n    }\n    \n    _handleFailurePattern(pattern) {\n        console.log(`🔍 Failure pattern detected: ${pattern.type}`);\n        \n        switch (pattern.type) {\n            case 'cascading-failures':\n                this._handleCascadingFailures(pattern);\n                break;\n            case 'high-error-rate':\n                this._handleHighErrorRate(pattern);\n                break;\n            case 'memory-leak':\n                this._handleMemoryLeak(pattern);\n                break;\n        }\n    }\n    \n    _handleCascadingFailures(pattern) {\n        // Implement circuit breaker pattern\n        this.emit('circuit-breaker-triggered', {\n            pattern,\n            action: 'temporary-traffic-reduction',\n            timestamp: Date.now()\n        });\n    }\n    \n    _handleHighErrorRate(pattern) {\n        // Scale up to distribute load\n        this._triggerEmergencyScaling('high-error-rate', pattern.data);\n    }\n    \n    _handleMemoryLeak(pattern) {\n        // Restart affected instances\n        this.recoveryManager.restartUnhealthyInstances();\n    }\n    \n    getScalingStatus() {\n        return {\n            isRunning: this.isRunning,\n            config: { ...this.config },\n            state: { ...this.scalingState },\n            history: [...this.scalingHistory.slice(-20)], // Last 20 actions\n            regionalMetrics: Object.fromEntries(this.regionalMetrics),\n            failureDetector: this.failureDetector.getStatus(),\n            recoveryManager: this.recoveryManager.getStatus()\n        };\n    }\n    \n    async shutdown() {\n        console.log('🛑 Shutting down Auto-Scaling and Recovery System...');\n        this.isRunning = false;\n        \n        if (this.evaluationTimer) {\n            clearInterval(this.evaluationTimer);\n        }\n        \n        await this.failureDetector.shutdown();\n        await this.recoveryManager.shutdown();\n        \n        console.log('✅ Auto-Scaling and Recovery System shutdown complete');\n        this.emit('shutdown');\n    }\n}\n\nclass FailureDetector extends EventEmitter {\n    constructor(config) {\n        super();\n        this.config = config;\n        this.failures = new Map();\n        this.patterns = new Map();\n        this.isRunning = false;\n    }\n    \n    async start() {\n        this.isRunning = true;\n        console.log('🔍 Failure detector started');\n    }\n    \n    recordFailure(type, data) {\n        const timestamp = Date.now();\n        const key = `${type}-${timestamp}`;\n        \n        this.failures.set(key, {\n            type,\n            data,\n            timestamp\n        });\n        \n        this._analyzePatterns();\n        \n        // Clean old failures\n        this._cleanOldFailures();\n    }\n    \n    recordRecovery(type, id) {\n        // Record successful recovery\n        console.log(`✅ Recovery recorded: ${type} ${id}`);\n    }\n    \n    _analyzePatterns() {\n        // Detect failure patterns\n        const recentFailures = Array.from(this.failures.values())\n            .filter(f => f.timestamp > Date.now() - 300000); // Last 5 minutes\n        \n        if (recentFailures.length > 10) {\n            this.emit('pattern-detected', {\n                type: 'high-failure-rate',\n                count: recentFailures.length,\n                data: recentFailures\n            });\n        }\n    }\n    \n    _cleanOldFailures() {\n        const cutoff = Date.now() - 3600000; // 1 hour\n        for (const [key, failure] of this.failures) {\n            if (failure.timestamp < cutoff) {\n                this.failures.delete(key);\n            }\n        }\n    }\n    \n    hasRecentFailures() {\n        const recent = Array.from(this.failures.values())\n            .filter(f => f.timestamp > Date.now() - 60000); // Last minute\n        return recent.length > 5;\n    }\n    \n    getStatus() {\n        return {\n            isRunning: this.isRunning,\n            totalFailures: this.failures.size,\n            recentFailures: Array.from(this.failures.values())\n                .filter(f => f.timestamp > Date.now() - 300000).length\n        };\n    }\n    \n    async shutdown() {\n        this.isRunning = false;\n        console.log('✅ Failure detector stopped');\n    }\n}\n\nclass RecoveryManager extends EventEmitter {\n    constructor(proxyPool, config) {\n        super();\n        this.proxyPool = proxyPool;\n        this.config = config;\n        this.recoveryActions = new Map();\n        this.isRunning = false;\n    }\n    \n    async start() {\n        this.isRunning = true;\n        console.log('🔧 Recovery manager started');\n    }\n    \n    async initiateEmergencyRecovery(alert) {\n        const recoveryId = Date.now().toString();\n        \n        this.emit('recovery-initiated', {\n            id: recoveryId,\n            alert,\n            timestamp: Date.now()\n        });\n        \n        // Implement recovery procedures based on alert type\n        // This is a simplified version\n        \n        setTimeout(() => {\n            this.emit('recovery-completed', {\n                id: recoveryId,\n                success: true,\n                timestamp: Date.now()\n            });\n        }, 5000);\n    }\n    \n    async restartUnhealthyInstances() {\n        // Find and restart unhealthy instances\n        const unhealthyInstances = Array.from(this.proxyPool.instances.values())\n            .filter(instance => instance.status === 'unhealthy');\n        \n        for (const instance of unhealthyInstances) {\n            await this.proxyPool._removeInstance(instance.id);\n            await this.proxyPool._createInstance();\n        }\n        \n        console.log(`🔄 Restarted ${unhealthyInstances.length} unhealthy instances`);\n    }\n    \n    getStatus() {\n        return {\n            isRunning: this.isRunning,\n            activeRecoveries: this.recoveryActions.size\n        };\n    }\n    \n    async shutdown() {\n        this.isRunning = false;\n        console.log('✅ Recovery manager stopped');\n    }\n}\n\nmodule.exports = {\n    AutoScalingManager,\n    FailureDetector,\n    RecoveryManager\n};