/**
 * 📊 Real-Time Performance Monitoring System
 * Advanced monitoring for 1M+ concurrent proxy embedder operations
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class RealTimeMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            metricsInterval: config.metricsInterval || 1000, // 1 second
            alertThresholds: {
                memoryUsagePercent: config.memoryThreshold || 85,
                cpuUsagePercent: config.cpuThreshold || 80,
                responseTimeMs: config.responseTimeThreshold || 200,
                errorRatePercent: config.errorRateThreshold || 5,
                queueDepth: config.queueThreshold || 10000,
                ...config.alertThresholds
            },
            retentionPeriod: config.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
            aggregationWindows: [1, 5, 15, 60], // minutes
            enableDetailedLogging: config.enableDetailedLogging !== false,
            ...config
        };
        
        this.metrics = {
            system: {
                timestamp: Date.now(),
                cpu: { usage: 0, cores: os.cpus().length },
                memory: { 
                    used: 0, 
                    total: os.totalmem(), 
                    percent: 0,
                    heap: process.memoryUsage()
                },
                network: { connections: 0, bandwidth: { in: 0, out: 0 } },
                disk: { usage: 0, io: { read: 0, write: 0 } }
            },
            proxy: {
                totalInstances: 0,
                activeInstances: 0,
                healthyInstances: 0,
                totalConnections: 0,
                avgResponseTime: 0,
                requestsPerSecond: 0,
                errorRate: 0,
                geographical: new Map()
            },
            embedding: {
                totalEmbeddings: 0,
                activeEmbeddings: 0,
                completedEmbeddings: 0,
                failedEmbeddings: 0,
                avgProcessingTime: 0,
                throughputPerSecond: 0,
                queueDepth: 0,
                priorityDistribution: {}
            },
            alerts: [],
            trends: {
                performance: [],
                capacity: [],
                errors: []
            }
        };
        
        this.historicalData = new Map();
        this.aggregatedMetrics = new Map();
        this.alertHistory = [];
        this.isRunning = false;
        this.metricsTimer = null;
        this.lastCpuUsage = process.cpuUsage();
        this.lastNetworkStats = { rx: 0, tx: 0 };
        
        this._initializeAggregation();
    }
    
    _initializeAggregation() {
        // Initialize aggregation buckets for different time windows
        this.config.aggregationWindows.forEach(window => {
            this.aggregatedMetrics.set(window, {
                data: [],
                maxSize: window * 60, // Keep 1 data point per second
                window: window
            });
        });
    }
    
    async start() {
        if (this.isRunning) {
            throw new Error('Monitor is already running');
        }
        
        console.log('📊 Starting Real-Time Performance Monitor...');
        this.isRunning = true;
        
        // Start metrics collection
        this._startMetricsCollection();
        
        // Start alerting system
        this._startAlertSystem();
        
        // Start data cleanup
        this._startDataCleanup();
        
        console.log('✅ Real-Time Performance Monitor started');
        this.emit('started');
    }
    
    _startMetricsCollection() {
        this.metricsTimer = setInterval(async () => {
            await this._collectMetrics();
            this._processMetrics();
            this._checkAlerts();
            this._updateAggregations();
            
            this.emit('metrics-updated', this.getSnapshot());
        }, this.config.metricsInterval);
    }
    
    async _collectMetrics() {
        const timestamp = Date.now();
        
        // System metrics
        await this._collectSystemMetrics();
        
        // Store snapshot in historical data
        this.historicalData.set(timestamp, JSON.parse(JSON.stringify(this.metrics)));
        
        // Clean old data
        const cutoff = timestamp - this.config.retentionPeriod;
        for (const [time] of this.historicalData) {
            if (time < cutoff) {
                this.historicalData.delete(time);
            } else {
                break; // Map is ordered by insertion
            }
        }
    }
    
    async _collectSystemMetrics() {
        // CPU usage
        const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
        const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000 / this.config.metricsInterval * 100;
        this.metrics.system.cpu.usage = Math.min(100, cpuPercent);
        this.lastCpuUsage = process.cpuUsage();
        
        // Memory usage
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        this.metrics.system.memory = {
            used: usedMem,
            total: totalMem,
            percent: (usedMem / totalMem) * 100,
            heap: memUsage
        };
        
        // Network stats (simplified simulation)
        this.metrics.system.network.connections = this.metrics.proxy.totalConnections;
        
        // Timestamp update
        this.metrics.system.timestamp = Date.now();
    }
    
    updateProxyMetrics(proxyMetrics) {
        this.metrics.proxy = {
            ...this.metrics.proxy,
            ...proxyMetrics,
            timestamp: Date.now()
        };
    }
    
    updateEmbeddingMetrics(embeddingMetrics) {
        this.metrics.embedding = {
            ...this.metrics.embedding,
            ...embeddingMetrics,
            timestamp: Date.now()
        };
    }
    
    recordProxyInstanceEvent(event, data) {
        const timestamp = Date.now();
        
        switch (event) {
            case 'instance-created':
                this.metrics.proxy.totalInstances++;
                break;
            case 'instance-ready':
                this.metrics.proxy.activeInstances++;
                this.metrics.proxy.healthyInstances++;
                break;
            case 'instance-unhealthy':
                this.metrics.proxy.healthyInstances--;
                this._recordAlert('proxy', 'instance-unhealthy', data);
                break;
            case 'instance-recovered':
                this.metrics.proxy.healthyInstances++;
                break;
            case 'instance-removed':
                this.metrics.proxy.totalInstances--;
                this.metrics.proxy.activeInstances--;
                break;
            case 'website-embedded':
                this._updateResponseTimeMetrics(data.responseTime);
                break;
            case 'embedding-failed':
                this._updateErrorMetrics();
                break;
        }
        
        if (this.config.enableDetailedLogging) {
            this.emit('proxy-event', {
                event,
                data,
                timestamp,
                metrics: { ...this.metrics.proxy }
            });
        }
    }
    
    recordEmbeddingEvent(event, data) {
        const timestamp = Date.now();
        
        switch (event) {
            case 'embedding-queued':
                this.metrics.embedding.queueDepth++;
                break;
            case 'embedding-started':
                this.metrics.embedding.activeEmbeddings++;
                this.metrics.embedding.queueDepth--;
                break;
            case 'embedding-completed':
                this.metrics.embedding.activeEmbeddings--;
                this.metrics.embedding.completedEmbeddings++;
                this._updateEmbeddingProcessingTime(data.processingTime);
                break;
            case 'embedding-failed':
                this.metrics.embedding.activeEmbeddings--;
                this.metrics.embedding.failedEmbeddings++;
                break;
            case 'batch-queued':
                this.metrics.embedding.queueDepth += data.count;
                break;
        }
        
        this.metrics.embedding.totalEmbeddings = 
            this.metrics.embedding.completedEmbeddings + 
            this.metrics.embedding.failedEmbeddings;
        
        if (this.config.enableDetailedLogging) {
            this.emit('embedding-event', {
                event,
                data,
                timestamp,
                metrics: { ...this.metrics.embedding }
            });
        }
    }
    
    _updateResponseTimeMetrics(responseTime) {
        const alpha = 0.1; // Exponential smoothing factor
        this.metrics.proxy.avgResponseTime = 
            this.metrics.proxy.avgResponseTime * (1 - alpha) + responseTime * alpha;
    }
    
    _updateErrorMetrics() {
        const totalRequests = this.metrics.proxy.totalConnections;
        if (totalRequests > 0) {
            // Simplified error rate calculation
            this.metrics.proxy.errorRate = 
                (this.metrics.embedding.failedEmbeddings / totalRequests) * 100;
        }
    }
    
    _updateEmbeddingProcessingTime(processingTime) {
        const alpha = 0.1;
        this.metrics.embedding.avgProcessingTime = 
            this.metrics.embedding.avgProcessingTime * (1 - alpha) + processingTime * alpha;
    }
    
    _processMetrics() {
        // Calculate derived metrics
        this._calculateThroughput();
        this._updateTrends();
        this._calculateCapacityMetrics();
    }
    
    _calculateThroughput() {
        const now = Date.now();
        const timeWindow = 10000; // 10 seconds
        const recentMetrics = Array.from(this.historicalData.entries())
            .filter(([timestamp]) => timestamp > now - timeWindow);
        
        if (recentMetrics.length >= 2) {
            const oldest = recentMetrics[0][1];
            const newest = recentMetrics[recentMetrics.length - 1][1];
            const timeDiff = (newest.system.timestamp - oldest.system.timestamp) / 1000;
            
            if (timeDiff > 0) {
                const completedDiff = newest.embedding.completedEmbeddings - oldest.embedding.completedEmbeddings;
                this.metrics.embedding.throughputPerSecond = completedDiff / timeDiff;
                
                const requestsDiff = newest.proxy.totalConnections - oldest.proxy.totalConnections;
                this.metrics.proxy.requestsPerSecond = requestsDiff / timeDiff;
            }
        }
    }
    
    _updateTrends() {
        const current = this.metrics;
        
        // Performance trend
        this.metrics.trends.performance.push({
            timestamp: Date.now(),
            responseTime: current.proxy.avgResponseTime,
            throughput: current.embedding.throughputPerSecond,
            errorRate: current.proxy.errorRate
        });
        
        // Capacity trend
        this.metrics.trends.capacity.push({
            timestamp: Date.now(),
            memoryUsage: current.system.memory.percent,
            cpuUsage: current.system.cpu.usage,
            activeInstances: current.proxy.activeInstances,
            queueDepth: current.embedding.queueDepth
        });
        
        // Keep only last 100 trend points
        if (this.metrics.trends.performance.length > 100) {
            this.metrics.trends.performance.shift();
        }
        if (this.metrics.trends.capacity.length > 100) {
            this.metrics.trends.capacity.shift();
        }
    }
    
    _calculateCapacityMetrics() {
        const capacity = {
            current: this.metrics.proxy.activeInstances,
            maximum: this.config.maxInstances || 1000000,
            utilization: (this.metrics.proxy.activeInstances / (this.config.maxInstances || 1000000)) * 100,
            efficiency: this._calculateEfficiency()
        };
        
        this.metrics.capacity = capacity;
    }
    
    _calculateEfficiency() {
        const totalRequests = this.metrics.embedding.totalEmbeddings;
        const successfulRequests = this.metrics.embedding.completedEmbeddings;
        
        if (totalRequests === 0) return 100;
        return (successfulRequests / totalRequests) * 100;
    }
    
    _startAlertSystem() {
        // Check for alerts every 5 seconds
        setInterval(() => {
            this._checkAlerts();
        }, 5000);
    }
    
    _checkAlerts() {
        const thresholds = this.config.alertThresholds;
        const current = this.metrics;
        
        // Memory usage alert
        if (current.system.memory.percent > thresholds.memoryUsagePercent) {
            this._recordAlert('system', 'high-memory-usage', {
                current: current.system.memory.percent,
                threshold: thresholds.memoryUsagePercent
            });
        }
        
        // CPU usage alert
        if (current.system.cpu.usage > thresholds.cpuUsagePercent) {
            this._recordAlert('system', 'high-cpu-usage', {
                current: current.system.cpu.usage,
                threshold: thresholds.cpuUsagePercent
            });
        }
        
        // Response time alert
        if (current.proxy.avgResponseTime > thresholds.responseTimeMs) {
            this._recordAlert('performance', 'slow-response-time', {
                current: current.proxy.avgResponseTime,
                threshold: thresholds.responseTimeMs
            });
        }
        
        // Error rate alert
        if (current.proxy.errorRate > thresholds.errorRatePercent) {
            this._recordAlert('performance', 'high-error-rate', {
                current: current.proxy.errorRate,
                threshold: thresholds.errorRatePercent
            });
        }
        
        // Queue depth alert
        if (current.embedding.queueDepth > thresholds.queueDepth) {
            this._recordAlert('capacity', 'high-queue-depth', {
                current: current.embedding.queueDepth,
                threshold: thresholds.queueDepth
            });
        }
        
        // Clean old alerts (keep last 100)
        if (this.metrics.alerts.length > 100) {
            this.metrics.alerts = this.metrics.alerts.slice(-100);
        }
    }
    
    _recordAlert(category, type, data) {
        const alert = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            category,
            type,
            severity: this._calculateAlertSeverity(category, type, data),
            message: this._generateAlertMessage(category, type, data),
            data,
            resolved: false
        };
        
        // Check if similar alert already exists and is recent
        const recentAlerts = this.metrics.alerts.filter(a => 
            a.type === type && 
            a.timestamp > Date.now() - 60000 && // Last minute
            !a.resolved
        );
        
        if (recentAlerts.length === 0) {
            this.metrics.alerts.push(alert);
            this.alertHistory.push(alert);
            
            this.emit('alert', alert);
            
            if (alert.severity === 'critical') {
                this.emit('critical-alert', alert);
            }
        }
    }
    
    _calculateAlertSeverity(category, type, data) {
        if (category === 'system') {
            if (data.current > data.threshold * 1.2) return 'critical';
            if (data.current > data.threshold * 1.1) return 'warning';
            return 'info';
        }
        
        if (category === 'performance') {
            if (type === 'high-error-rate' && data.current > 10) return 'critical';
            if (type === 'slow-response-time' && data.current > 1000) return 'critical';
            return 'warning';
        }
        
        return 'info';
    }
    
    _generateAlertMessage(category, type, data) {
        switch (type) {
            case 'high-memory-usage':
                return `Memory usage is ${data.current.toFixed(1)}% (threshold: ${data.threshold}%)`;
            case 'high-cpu-usage':
                return `CPU usage is ${data.current.toFixed(1)}% (threshold: ${data.threshold}%)`;
            case 'slow-response-time':
                return `Average response time is ${data.current.toFixed(0)}ms (threshold: ${data.threshold}ms)`;
            case 'high-error-rate':
                return `Error rate is ${data.current.toFixed(1)}% (threshold: ${data.threshold}%)`;
            case 'high-queue-depth':
                return `Queue depth is ${data.current} (threshold: ${data.threshold})`;
            default:
                return `Alert: ${type} in ${category}`;
        }
    }
    
    _updateAggregations() {
        const now = Date.now();
        const currentMetrics = { ...this.metrics };
        
        this.config.aggregationWindows.forEach(window => {
            const bucket = this.aggregatedMetrics.get(window);
            bucket.data.push({
                timestamp: now,
                metrics: currentMetrics
            });
            
            // Remove old data
            const cutoff = now - (window * 60 * 1000);
            bucket.data = bucket.data.filter(item => item.timestamp > cutoff);
        });
    }
    
    _startDataCleanup() {
        // Clean up old data every hour
        setInterval(() => {
            this._cleanupOldData();
        }, 60 * 60 * 1000);
    }
    
    _cleanupOldData() {
        const cutoff = Date.now() - this.config.retentionPeriod;
        
        // Clean historical data
        for (const [timestamp] of this.historicalData) {
            if (timestamp < cutoff) {
                this.historicalData.delete(timestamp);
            }
        }
        
        // Clean alert history
        this.alertHistory = this.alertHistory.filter(alert => 
            alert.timestamp > cutoff
        );
        
        console.log(`🧹 Cleaned up monitoring data older than ${this.config.retentionPeriod / 1000 / 60 / 60} hours`);
    }
    
    getSnapshot() {
        return {
            timestamp: Date.now(),
            system: { ...this.metrics.system },
            proxy: { ...this.metrics.proxy },
            embedding: { ...this.metrics.embedding },
            capacity: { ...this.metrics.capacity },
            alerts: [...this.metrics.alerts.filter(a => !a.resolved)],
            trends: {
                performance: [...this.metrics.trends.performance],
                capacity: [...this.metrics.trends.capacity]
            }
        };
    }
    
    getHistoricalData(startTime, endTime, resolution = 'raw') {
        const data = Array.from(this.historicalData.entries())
            .filter(([timestamp]) => 
                timestamp >= startTime && timestamp <= endTime
            )
            .map(([timestamp, metrics]) => ({
                timestamp,
                ...metrics
            }));
        
        if (resolution === 'raw') {
            return data;
        }
        
        // Aggregate data based on resolution
        const aggregated = this.aggregatedMetrics.get(resolution);
        if (aggregated) {
            return aggregated.data
                .filter(item => 
                    item.timestamp >= startTime && item.timestamp <= endTime
                )
                .map(item => ({
                    timestamp: item.timestamp,
                    ...item.metrics
                }));
        }
        
        return data;
    }
    
    getAlerts(severity = null, resolved = false) {
        let alerts = resolved ? this.alertHistory : this.metrics.alerts;
        
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }
        
        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    resolveAlert(alertId) {
        const alert = this.metrics.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            this.emit('alert-resolved', alert);
        }
    }
    
    async exportMetrics(format = 'json', timeRange = '1h') {
        const endTime = Date.now();
        const startTime = endTime - this._parseTimeRange(timeRange);
        
        const data = this.getHistoricalData(startTime, endTime);
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this._convertToCSV(data);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    _parseTimeRange(range) {
        const units = {
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        
        const match = range.match(/^(\d+)([mhd])$/);
        if (!match) {
            throw new Error(`Invalid time range format: ${range}`);
        }
        
        const [, amount, unit] = match;
        return parseInt(amount) * units[unit];
    }
    
    _convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = [
            'timestamp',
            'system_memory_percent',
            'system_cpu_usage',
            'proxy_active_instances',
            'proxy_avg_response_time',
            'embedding_throughput',
            'embedding_queue_depth'
        ];
        
        const rows = data.map(item => [
            item.timestamp,
            item.system?.memory?.percent || 0,
            item.system?.cpu?.usage || 0,
            item.proxy?.activeInstances || 0,
            item.proxy?.avgResponseTime || 0,
            item.embedding?.throughputPerSecond || 0,
            item.embedding?.queueDepth || 0
        ]);
        
        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Real-Time Monitor...');
        this.isRunning = false;
        
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
        
        // Save final snapshot if needed
        if (this.config.persistOnShutdown) {
            await this._saveFinalSnapshot();
        }
        
        console.log('✅ Real-Time Monitor shutdown complete');
        this.emit('shutdown');
    }
    
    async _saveFinalSnapshot() {
        try {
            const snapshot = this.getSnapshot();
            const filename = `monitor-snapshot-${Date.now()}.json`;
            await fs.writeFile(filename, JSON.stringify(snapshot, null, 2));
            console.log(`💾 Final monitoring snapshot saved to ${filename}`);
        } catch (error) {
            console.error('Failed to save final snapshot:', error);
        }
    }
}

module.exports = RealTimeMonitor;