/**
 * 🚀 Advanced Proxy Pool Manager with Global Country Support
 * Manages massive concurrent proxy instances for 1M+ parallel website embedding
 * Features: Top countries support, automatic rotation, failover, user agent management
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const os = require('os');

// Top countries for proxy support
const TOP_COUNTRIES = {
    'US': { name: 'United States', timezone: 'America/New_York', preferredUserAgents: ['chrome', 'firefox', 'safari'] },
    'UK': { name: 'United Kingdom', timezone: 'Europe/London', preferredUserAgents: ['chrome', 'firefox', 'edge'] },
    'DE': { name: 'Germany', timezone: 'Europe/Berlin', preferredUserAgents: ['chrome', 'firefox'] },
    'FR': { name: 'France', timezone: 'Europe/Paris', preferredUserAgents: ['chrome', 'firefox'] },
    'JP': { name: 'Japan', timezone: 'Asia/Tokyo', preferredUserAgents: ['chrome', 'safari'] },
    'CA': { name: 'Canada', timezone: 'America/Toronto', preferredUserAgents: ['chrome', 'firefox', 'safari'] },
    'AU': { name: 'Australia', timezone: 'Australia/Sydney', preferredUserAgents: ['chrome', 'safari'] },
    'NL': { name: 'Netherlands', timezone: 'Europe/Amsterdam', preferredUserAgents: ['chrome', 'firefox'] },
    'SG': { name: 'Singapore', timezone: 'Asia/Singapore', preferredUserAgents: ['chrome', 'safari'] },
    'BR': { name: 'Brazil', timezone: 'America/Sao_Paulo', preferredUserAgents: ['chrome', 'firefox'] },
    'IN': { name: 'India', timezone: 'Asia/Kolkata', preferredUserAgents: ['chrome', 'firefox'] },
    'KR': { name: 'South Korea', timezone: 'Asia/Seoul', preferredUserAgents: ['chrome'] },
    'ES': { name: 'Spain', timezone: 'Europe/Madrid', preferredUserAgents: ['chrome', 'firefox'] },
    'IT': { name: 'Italy', timezone: 'Europe/Rome', preferredUserAgents: ['chrome', 'firefox'] },
    'SE': { name: 'Sweden', timezone: 'Europe/Stockholm', preferredUserAgents: ['chrome', 'firefox'] }
};

// Modern user agent strings for rotation
const USER_AGENTS = {
    chrome: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ],
    firefox: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ],
    safari: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
    ],
    edge: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
    ]
};

class ProxyInstance extends EventEmitter {
    constructor(id, config = {}) {
        super();
        this.id = id;
        this.config = {
            maxConnections: config.maxConnections || 1000, // Increased for 1M scale
            timeout: config.timeout || 3000,
            retryAttempts: config.retryAttempts || 3,
            region: config.region || 'auto',
            country: config.country || 'US',
            enableRotation: config.enableRotation !== false,
            rotationInterval: config.rotationInterval || 300000, // 5 minutes
            userAgentRotation: config.userAgentRotation !== false,
            userAgentChangeInterval: config.userAgentChangeInterval || 60000, // 1 minute
            enableFailover: config.enableFailover !== false,
            healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
            ...config
        };
        
        this.status = 'initializing';
        this.connections = new Map();
        this.countryInfo = TOP_COUNTRIES[this.config.country] || TOP_COUNTRIES['US'];
        this.currentUserAgent = this._getRandomUserAgent();
        this.lastRotation = Date.now();
        this.lastUserAgentChange = Date.now();
        this.failoverProxies = new Set();
        
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            lastActivity: Date.now(),
            uptime: Date.now(),
            rotationCount: 0,
            userAgentChanges: 0,
            failoverEvents: 0,
            countryRequests: new Map() // Track requests by country
        };
        
        this.resourceLimits = {
            maxMemoryMB: config.maxMemoryMB || 512,
            maxCpuPercent: config.maxCpuPercent || 80,
            maxResponseTimeMs: config.maxResponseTimeMs || 200
        };
        
        this.websites = new Map(); // Track embedded websites
        this.healthCheckInterval = null;
        
        this._initialize();
    }
    
    async _initialize() {
        this.status = 'ready';
        
        // Initialize proxy rotation if enabled
        if (this.config.enableRotation) {
            this._startRotationTimer();
        }
        
        // Initialize user agent rotation if enabled
        if (this.config.userAgentRotation) {
            this._startUserAgentRotation();
        }
        
        // Initialize health check
        this._startHealthCheck();
        this.emit('ready', this.id);
    }
    
    _getRandomUserAgent() {
        const preferredAgents = this.countryInfo.preferredUserAgents;
        const agentType = preferredAgents[Math.floor(Math.random() * preferredAgents.length)];
        const agents = USER_AGENTS[agentType] || USER_AGENTS.chrome;
        return agents[Math.floor(Math.random() * agents.length)];
    }
    
    _startRotationTimer() {
        this.rotationTimer = setInterval(() => {
            this._performRotation();
        }, this.config.rotationInterval);
    }
    
    _startUserAgentRotation() {
        this.userAgentTimer = setInterval(() => {
            this._rotateUserAgent();
        }, this.config.userAgentChangeInterval);
    }
    
    async _performRotation() {
        if (this.status !== 'ready') return;
        
        console.log(`🔄 Performing proxy rotation for instance ${this.id} (${this.config.country})`);
        
        try {
            // Gracefully rotate proxy endpoint
            const oldConnections = new Map(this.connections);
            this.connections.clear();
            
            // Simulate proxy endpoint rotation
            this.config.endpoint = this._generateNewEndpoint();
            this.lastRotation = Date.now();
            this.metrics.rotationCount++;
            
            // Migrate existing connections to new endpoint
            for (const [connectionId, connection] of oldConnections) {
                if (connection.isActive) {
                    await this._migrateConnection(connection);
                }
            }
            
            this.emit('rotation-completed', {
                instanceId: this.id,
                country: this.config.country,
                newEndpoint: this.config.endpoint,
                migratedConnections: oldConnections.size
            });
            
        } catch (error) {
            console.error(`❌ Rotation failed for instance ${this.id}:`, error);
            this.emit('rotation-failed', { instanceId: this.id, error: error.message });
            
            if (this.config.enableFailover) {
                await this._triggerFailover();
            }
        }
    }
    
    _rotateUserAgent() {
        const oldUserAgent = this.currentUserAgent;
        this.currentUserAgent = this._getRandomUserAgent();
        this.lastUserAgentChange = Date.now();
        this.metrics.userAgentChanges++;
        
        this.emit('user-agent-rotated', {
            instanceId: this.id,
            oldUserAgent,
            newUserAgent: this.currentUserAgent,
            country: this.config.country
        });
    }
    
    _generateNewEndpoint() {
        // Simulate generating a new proxy endpoint for the country
        const basePort = 8000 + Math.floor(Math.random() * 1000);
        return `proxy-${this.config.country.toLowerCase()}-${basePort}.example.com:${basePort}`;
    }
    
    async _migrateConnection(connection) {
        try {
            // Simulate connection migration to new proxy endpoint
            connection.endpoint = this.config.endpoint;
            connection.userAgent = this.currentUserAgent;
            connection.lastMigrated = Date.now();
            
            this.connections.set(connection.id, connection);
        } catch (error) {
            console.error(`Failed to migrate connection ${connection.id}:`, error);
        }
    }
    
    async _triggerFailover() {
        console.log(`🆘 Triggering failover for instance ${this.id}`);
        
        try {
            // Find alternative proxy in same or nearby country
            const alternativeCountries = this._getNearbyCountries(this.config.country);
            const failoverConfig = {
                ...this.config,
                country: alternativeCountries[0],
                endpoint: this._generateNewEndpoint()
            };
            
            // Update instance configuration
            this.config = failoverConfig;
            this.countryInfo = TOP_COUNTRIES[this.config.country];
            this.currentUserAgent = this._getRandomUserAgent();
            this.metrics.failoverEvents++;
            
            this.emit('failover-completed', {
                instanceId: this.id,
                oldCountry: this.config.country,
                newCountry: failoverConfig.country,
                newEndpoint: failoverConfig.endpoint
            });
            
        } catch (error) {
            console.error(`❌ Failover failed for instance ${this.id}:`, error);
            this.status = 'failed';
            this.emit('failover-failed', { instanceId: this.id, error: error.message });
        }
    }
    
    _getNearbyCountries(country) {
        // Define geographic proximity for failover
        const proximity = {
            'US': ['CA', 'UK', 'AU'],
            'UK': ['DE', 'FR', 'NL', 'US'],
            'DE': ['UK', 'FR', 'NL', 'SE'],
            'FR': ['UK', 'DE', 'ES', 'IT'],
            'JP': ['KR', 'SG', 'AU'],
            'CA': ['US', 'UK'],
            'AU': ['SG', 'JP', 'US'],
            'NL': ['DE', 'UK', 'SE'],
            'SG': ['JP', 'AU', 'IN'],
            'BR': ['US', 'ES'],
            'IN': ['SG', 'JP'],
            'KR': ['JP', 'SG'],
            'ES': ['FR', 'IT', 'BR'],
            'IT': ['FR', 'ES', 'DE'],
            'SE': ['NL', 'DE', 'UK']
        };
        
        return proximity[country] || ['US', 'UK', 'DE'];
    }
    
    _startHealthCheck() {
        this.healthCheckInterval = setInterval(() => {
            this._updateMetrics();
            this._checkHealth();
        }, 1000); // Check every second for real-time monitoring
    }
    
    _updateMetrics() {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024);
        this.metrics.activeConnections = this.connections.size;
        this.metrics.lastActivity = Date.now();
        
        // Emit metrics for real-time monitoring
        this.emit('metrics', {
            instanceId: this.id,
            metrics: { ...this.metrics }
        });
    }
    
    _checkHealth() {
        const issues = [];
        
        if (this.metrics.memoryUsage > this.resourceLimits.maxMemoryMB) {
            issues.push(`Memory usage too high: ${this.metrics.memoryUsage}MB`);
        }
        
        if (this.metrics.avgResponseTime > this.resourceLimits.maxResponseTimeMs) {
            issues.push(`Response time too slow: ${this.metrics.avgResponseTime}ms`);
        }
        
        if (this.metrics.activeConnections >= this.config.maxConnections) {
            issues.push(`Connection limit reached: ${this.metrics.activeConnections}`);
        }
        
        if (issues.length > 0) {
            this.status = 'unhealthy';
            this.emit('unhealthy', { instanceId: this.id, issues });
        } else if (this.status === 'unhealthy') {
            this.status = 'ready';
            this.emit('recovered', this.id);
        }
    }
    
    async embedWebsite(websiteUrl, options = {}) {
        if (this.status !== 'ready') {
            throw new Error(`Proxy instance ${this.id} is not ready (status: ${this.status})`);
        }
        
        // Check if rotation/user agent change is needed
        await this._checkRotationNeeds();
        
        const connectionId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            // Create connection with current proxy settings
            const connection = {
                id: connectionId,
                websiteUrl,
                startTime,
                options: {
                    ...options,
                    userAgent: this.currentUserAgent,
                    country: this.config.country,
                    timezone: this.countryInfo.timezone
                },
                status: 'connecting',
                endpoint: this.config.endpoint,
                userAgent: this.currentUserAgent,
                retryCount: 0
            };
            
            this.connections.set(connectionId, connection);
            
            // Process the website embedding
            const result = await this._processWebsiteEmbedding(websiteUrl, connection.options);
            
            // Update connection status
            connection.status = 'completed';
            connection.endTime = Date.now();
            connection.responseTime = connection.endTime - startTime;
            
            // Update metrics
            this._updateResponseMetrics(connection.responseTime, true);
            this._updateCountryMetrics(this.config.country);
            
            // Store embedded website info
            this.websites.set(websiteUrl, {
                connectionId,
                embedTime: Date.now(),
                country: this.config.country,
                userAgent: this.currentUserAgent
            });
            
            this.emit('website-embedded', {
                instanceId: this.id,
                websiteUrl,
                connectionId,
                country: this.config.country,
                responseTime: connection.responseTime
            });
            
            return {
                connectionId,
                result,
                metadata: {
                    country: this.config.country,
                    userAgent: this.currentUserAgent,
                    responseTime: connection.responseTime,
                    endpoint: this.config.endpoint
                }
            };
            
        } catch (error) {
            // Handle connection errors with retry logic
            const connection = this.connections.get(connectionId);
            if (connection && connection.retryCount < this.config.retryAttempts) {
                connection.retryCount++;
                console.log(`🔄 Retrying connection ${connectionId} (attempt ${connection.retryCount})`);
                return await this.embedWebsite(websiteUrl, options);
            }
            
            this._updateResponseMetrics(Date.now() - startTime, false);
            
            // Remove failed connection
            if (this.connections.has(connectionId)) {
                this.connections.delete(connectionId);
            }
            
            throw error;
        }
    }
    
    async _checkRotationNeeds() {
        const now = Date.now();
        
        // Check if proxy rotation is needed
        if (this.config.enableRotation && 
            (now - this.lastRotation) >= this.config.rotationInterval) {
            await this._performRotation();
        }
        
        // Check if user agent rotation is needed
        if (this.config.userAgentRotation && 
            (now - this.lastUserAgentChange) >= this.config.userAgentChangeInterval) {
            this._rotateUserAgent();
        }
    }
    
    _updateCountryMetrics(country) {
        const current = this.metrics.countryRequests.get(country) || 0;
        this.metrics.countryRequests.set(country, current + 1);
    }
    
    /**
     * Execute real-time command on embedded website
     */
    async executeCommand(embeddingId, command) {
        const connection = Array.from(this.connections.values())
            .find(conn => conn.id === embeddingId);
        
        if (!connection) {
            throw new Error(`Connection ${embeddingId} not found`);
        }
        
        try {
            // Execute command with current proxy settings
            const result = await this._executeCommandOnConnection(connection, command);
            
            this.emit('command-executed', {
                instanceId: this.id,
                embeddingId,
                command,
                result,
                country: this.config.country
            });
            
            return result;
        } catch (error) {
            console.error(`Command execution failed for ${embeddingId}:`, error);
            throw error;
        }
    }
    
    async _executeCommandOnConnection(connection, command) {
        // Simulate command execution with proxy settings
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    command,
                    timestamp: Date.now(),
                    country: this.config.country,
                    userAgent: this.currentUserAgent,
                    executionTime: Math.random() * 50 + 10 // 10-60ms
                });
            }, Math.random() * 20 + 5); // 5-25ms processing time
        });
    }
    
    /**
     * Capture current state for live viewing
     */
    async captureState(embeddingId, options = {}) {
        const connection = Array.from(this.connections.values())
            .find(conn => conn.id === embeddingId);
        
        if (!connection) {
            throw new Error(`Connection ${embeddingId} not found`);
        }
        
        try {
            // Capture state with current proxy settings
            const state = await this._captureConnectionState(connection, options);
            
            return {
                embeddingId,
                state,
                timestamp: Date.now(),
                country: this.config.country,
                userAgent: this.currentUserAgent
            };
        } catch (error) {
            console.error(`State capture failed for ${embeddingId}:`, error);
            throw error;
        }
    }
    
    async _captureConnectionState(connection, options) {
        // Simulate state capture
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    url: connection.websiteUrl,
                    status: connection.status,
                    loadTime: connection.responseTime || 0,
                    country: this.config.country,
                    timestamp: Date.now(),
                    screenshot: options.enableScreenshots ? 'data:image/jpeg;base64,/9j/4AAQ...' : null
                });
            }, Math.random() * 10 + 5); // 5-15ms capture time
        });
    }
    
    async _processWebsiteEmbedding(websiteUrl, options) {
        // Simulate real website embedding logic with optimized processing
        return new Promise((resolve) => {
            // Fast processing simulation (real implementation would use actual HTTP requests)
            setTimeout(() => {
                resolve({
                    embeddedHtml: `<iframe src="${websiteUrl}" style="width:100%;height:100%"></iframe>`,
                    metadata: {
                        title: `Embedded: ${websiteUrl}`,
                        loadTime: Math.random() * 100 + 50, // 50-150ms
                        size: Math.floor(Math.random() * 1000) + 500 // 500-1500 KB
                    }
                });
            }, Math.random() * 50 + 10); // 10-60ms processing time
        });
    }
    
    _updateResponseMetrics(responseTime, success) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Calculate rolling average response time
        const alpha = 0.1; // Smoothing factor
        this.metrics.avgResponseTime = this.metrics.avgResponseTime * (1 - alpha) + responseTime * alpha;
    }
    
    getStatus() {
        return {
            id: this.id,
            status: this.status,
            metrics: { ...this.metrics },
            config: { ...this.config },
            activeWebsites: this.websites.size,
            websites: Array.from(this.websites.keys())
        };
    }
    
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        this.status = 'shutting-down';
        
        // Gracefully close all connections
        for (const [connectionId, connection] of this.connections) {
            this.emit('connection-closing', { connectionId, url: connection.url });
        }
        
        this.connections.clear();
        this.websites.clear();
        this.status = 'shutdown';
        this.emit('shutdown', this.id);
    }
}

class AdvancedProxyPoolManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxInstances: config.maxInstances || 1000000, // 1M instances
            instancesPerNode: config.instancesPerNode || 10000, // 10K per node
            autoScale: config.autoScale !== false,
            healthCheckInterval: config.healthCheckInterval || 5000,
            loadBalanceStrategy: config.loadBalanceStrategy || 'least-connections',
            ...config
        };
        
        this.instances = new Map();
        this.nodeMetrics = new Map();
        this.globalMetrics = {
            totalInstances: 0,
            activeInstances: 0,
            totalRequests: 0,
            totalWebsites: 0,
            avgResponseTime: 0,
            systemLoad: 0,
            memoryUsage: 0
        };
        
        this.isRunning = false;
        this.healthCheckTimer = null;
        this.autoScaleTimer = null;
        
        this._setupEventHandlers();
    }
    
    _setupEventHandlers() {
        // Handle proxy instance events
        this.on('instance-ready', (instanceId) => {
            console.log(`✅ Proxy instance ${instanceId} is ready`);
        });
        
        this.on('instance-unhealthy', (data) => {
            console.warn(`⚠️ Proxy instance ${data.instanceId} is unhealthy:`, data.issues);
            this._handleUnhealthyInstance(data.instanceId);
        });
        
        this.on('instance-recovered', (instanceId) => {
            console.log(`🔄 Proxy instance ${instanceId} has recovered`);
        });
    }
    
    async start() {
        if (this.isRunning) {
            throw new Error('Proxy pool manager is already running');
        }
        
        console.log('🚀 Starting Advanced Proxy Pool Manager...');
        this.isRunning = true;
        
        // Start with initial instances
        const initialInstances = Math.min(100, this.config.instancesPerNode);
        await this._createInstances(initialInstances);
        
        // Start monitoring and auto-scaling
        this._startHealthMonitoring();
        if (this.config.autoScale) {
            this._startAutoScaling();
        }
        
        console.log(`✅ Proxy pool manager started with ${this.instances.size} instances`);
        this.emit('started');
    }
    
    async _createInstances(count) {
        const promises = [];
        
        for (let i = 0; i < count; i++) {
            promises.push(this._createInstance());
        }
        
        await Promise.all(promises);
    }
    
    async _createInstance(config = {}) {
        if (this.instances.size >= this.config.maxInstances) {
            throw new Error('Maximum number of instances reached');
        }
        
        const instanceId = `proxy-${crypto.randomUUID()}`;
        const instance = new ProxyInstance(instanceId, config);
        
        // Set up event forwarding
        instance.on('ready', (id) => this.emit('instance-ready', id));
        instance.on('unhealthy', (data) => this.emit('instance-unhealthy', data));
        instance.on('recovered', (id) => this.emit('instance-recovered', id));
        instance.on('metrics', (data) => this._updateGlobalMetrics(data));
        instance.on('website-embedded', (data) => this.emit('website-embedded', data));
        instance.on('embedding-failed', (data) => this.emit('embedding-failed', data));
        
        this.instances.set(instanceId, instance);
        this.globalMetrics.totalInstances++;
        
        return instance;
    }
    
    _updateGlobalMetrics(instanceMetrics) {
        // Update global metrics with instance data
        const activeInstances = Array.from(this.instances.values())
            .filter(instance => instance.status === 'ready').length;
        
        this.globalMetrics.activeInstances = activeInstances;
        this.globalMetrics.totalWebsites = Array.from(this.instances.values())
            .reduce((total, instance) => total + instance.websites.size, 0);
        
        // Calculate system-wide averages
        const allMetrics = Array.from(this.instances.values())
            .map(instance => instance.metrics);
        
        if (allMetrics.length > 0) {
            this.globalMetrics.avgResponseTime = allMetrics
                .reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length;
            
            this.globalMetrics.totalRequests = allMetrics
                .reduce((sum, m) => sum + m.totalRequests, 0);
            
            this.globalMetrics.memoryUsage = allMetrics
                .reduce((sum, m) => sum + m.memoryUsage, 0);
        }
        
        // Emit global metrics for monitoring
        this.emit('global-metrics', { ...this.globalMetrics });
    }
    
    async embedWebsite(websiteUrl, options = {}) {
        const instance = this._selectOptimalInstance();
        
        if (!instance) {
            // Auto-create instance if needed and possible
            if (this.instances.size < this.config.maxInstances) {
                const newInstance = await this._createInstance();
                return await newInstance.embedWebsite(websiteUrl, options);
            } else {
                throw new Error('No available proxy instances and maximum capacity reached');
            }
        }
        
        return await instance.embedWebsite(websiteUrl, options);
    }
    
    _selectOptimalInstance() {
        const readyInstances = Array.from(this.instances.values())
            .filter(instance => instance.status === 'ready');
        
        if (readyInstances.length === 0) {
            return null;
        }
        
        switch (this.config.loadBalanceStrategy) {
            case 'least-connections':
                return readyInstances.reduce((min, current) => 
                    current.connections.size < min.connections.size ? current : min
                );
            
            case 'fastest-response':
                return readyInstances.reduce((min, current) => 
                    current.metrics.avgResponseTime < min.metrics.avgResponseTime ? current : min
                );
            
            case 'round-robin':
                // Simple round-robin selection
                const index = this.globalMetrics.totalRequests % readyInstances.length;
                return readyInstances[index];
            
            default:
                return readyInstances[Math.floor(Math.random() * readyInstances.length)];
        }
    }
    
    _startHealthMonitoring() {
        this.healthCheckTimer = setInterval(() => {
            this._performGlobalHealthCheck();
        }, this.config.healthCheckInterval);
    }
    
    _performGlobalHealthCheck() {
        const systemStats = {
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            uptime: process.uptime(),
            loadAverage: os.loadavg()
        };
        
        this.globalMetrics.systemLoad = systemStats.loadAverage[0];
        
        // Check if system is under stress
        if (systemStats.memoryUsage.heapUsed > 1024 * 1024 * 1024 * 2) { // 2GB
            this.emit('system-warning', 'High memory usage detected');
        }
        
        if (systemStats.loadAverage[0] > os.cpus().length * 0.8) {
            this.emit('system-warning', 'High CPU load detected');
        }
    }
    
    _startAutoScaling() {
        this.autoScaleTimer = setInterval(() => {
            this._performAutoScaling();
        }, 10000); // Check every 10 seconds
    }
    
    async _performAutoScaling() {
        const readyInstances = Array.from(this.instances.values())
            .filter(instance => instance.status === 'ready');
        
        const avgConnections = readyInstances.length > 0 ? 
            readyInstances.reduce((sum, instance) => sum + instance.connections.size, 0) / readyInstances.length : 0;
        
        // Scale up if average connections > 70% of max
        if (avgConnections > 70 && this.instances.size < this.config.maxInstances) {
            const newInstances = Math.min(10, this.config.maxInstances - this.instances.size);
            console.log(`📈 Auto-scaling up: creating ${newInstances} new instances`);
            await this._createInstances(newInstances);
        }
        
        // Scale down if average connections < 20% and we have more than 10 instances
        else if (avgConnections < 20 && readyInstances.length > 10) {
            const instancesToRemove = Math.min(5, readyInstances.length - 10);
            console.log(`📉 Auto-scaling down: removing ${instancesToRemove} instances`);
            
            // Remove least used instances
            const sortedInstances = readyInstances
                .sort((a, b) => a.connections.size - b.connections.size)
                .slice(0, instancesToRemove);
            
            for (const instance of sortedInstances) {
                await this._removeInstance(instance.id);
            }
        }
    }
    
    async _handleUnhealthyInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        console.log(`🔧 Attempting to recover unhealthy instance ${instanceId}`);
        
        // Try to recover the instance
        setTimeout(async () => {
            if (instance.status === 'unhealthy') {
                console.log(`❌ Removing unrecoverable instance ${instanceId}`);
                await this._removeInstance(instanceId);
                
                // Create replacement instance if auto-scaling is enabled
                if (this.config.autoScale) {
                    await this._createInstance();
                }
            }
        }, 30000); // Give 30 seconds to recover
    }
    
    async _removeInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        await instance.shutdown();
        this.instances.delete(instanceId);
        this.globalMetrics.totalInstances--;
        
        this.emit('instance-removed', instanceId);
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: { ...this.config },
            globalMetrics: { ...this.globalMetrics },
            instances: Array.from(this.instances.values()).map(instance => instance.getStatus())
        };
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Proxy Pool Manager...');
        this.isRunning = false;
        
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        
        if (this.autoScaleTimer) {
            clearInterval(this.autoScaleTimer);
        }
        
        // Shutdown all instances
        const shutdownPromises = Array.from(this.instances.values())
            .map(instance => instance.shutdown());
        
        await Promise.all(shutdownPromises);
        this.instances.clear();
        
        console.log('✅ Proxy Pool Manager shutdown complete');
        this.emit('shutdown');
    }
}

module.exports = {
    ProxyInstance,
    AdvancedProxyPoolManager
};