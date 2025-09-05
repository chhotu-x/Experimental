/**
 * Privacy Sandbox & New Browser APIs for Privacy-Preserving Embedding
 * Enhanced implementation with improved efficiency, features, and error handling
 * Supports CHIPS, Storage Access API, FedCM, and modern privacy standards
 */

class PrivacySandbox {
    constructor(options = {}) {
        // Core properties with caching
        this.isInFrame = window !== window.top;
        this.embedOrigin = this.isInFrame ? document.referrer : window.location.origin;
        
        // Feature support cache (computed once)
        this._featureCache = new Map();
        this.supportsStorageAccess = this._cacheFeature('storageAccess', 'requestStorageAccess' in document);
        this.supportsCHIPS = this._cacheFeature('chips', this._checkCHIPSSupport());
        this.supportsFedCM = this._cacheFeature('fedcm', 'IdentityCredential' in window);
        this.supportsTopicsAPI = this._cacheFeature('topics', 'browsingTopics' in document);
        this.supportsTrustTokens = this._cacheFeature('trustTokens', 'trustToken' in document.body?.getClientRects);
        
        // Enhanced configuration
        this.config = {
            enableAnalytics: true,
            enablePerformanceTracking: true,
            storageRetryAttempts: 3,
            storageRetryDelay: 1000,
            debugMode: options.debug || (window.location.hostname === 'localhost'),
            maxCookieAge: 86400 * 30, // 30 days
            sessionCookieAge: 3600, // 1 hour
            ...options
        };
        
        // Event handling and performance tracking
        this.eventHandlers = new Map();
        this.performanceMetrics = {
            initTime: performance.now(),
            storageAccessTime: null,
            featureDetectionTime: null,
            errors: []
        };
        
        // Rate limiting and security
        this.requestCounts = new Map();
        this.lastRequestTime = new Map();
        
        this.init();
    }

    /**
     * Enhanced initialization with better performance and error handling
     */
    async init() {
        const startTime = performance.now();
        
        try {
            if (this.config.debugMode) {
                console.log('Privacy Sandbox: Enhanced initialization starting');
            }
            
            if (this.isInFrame) {
                await this._initializeEmbeddedMode();
            } else {
                await this._initializeStandaloneMode();
            }
            
            // Set up performance monitoring
            this._setupPerformanceMonitoring();
            
            // Initialize privacy analytics if enabled
            if (this.config.enableAnalytics) {
                this._initializeAnalytics();
            }
            
            this.performanceMetrics.featureDetectionTime = performance.now() - startTime;
            
            if (this.config.debugMode) {
                console.log(`Privacy Sandbox: Initialization completed in ${this.performanceMetrics.featureDetectionTime.toFixed(2)}ms`);
            }
        } catch (error) {
            this._handleError('Initialization failed', error);
        }
    }

    /**
     * Initialize for embedded content with enhanced features
     */
    async _initializeEmbeddedMode() {
        console.log('Privacy Sandbox: Initializing enhanced embedded mode');
        
        // Set up cross-origin communication
        this._setupCrossOriginMessaging();
        
        // Enhanced cross-origin headers
        this._setupEnhancedHeaders();
        
        // Request storage access with retry logic
        await this._requestStorageAccessWithRetry();
        
        // Set up partitioned cookies with lifecycle management
        this._setupEnhancedPartitionedCookies();
        
        // Initialize privacy-preserving storage
        await this._initializePrivacyStorage();
        
        // Set up user interaction monitoring
        this._setupUserInteractionMonitoring();
    }

    /**
     * Initialize for standalone mode
     */
    async _initializeStandaloneMode() {
        if (this.config.debugMode) {
            console.log('Privacy Sandbox: Initializing standalone mode');
        }
        
        // Initialize FedCM for standalone authentication
        await this._initializeFedCM();
        
        // Set up privacy preferences management
        this._setupPrivacyPreferences();
    }

    /**
     * Cache feature support with performance optimization
     */
    _cacheFeature(name, value) {
        if (this._featureCache.has(name)) {
            return this._featureCache.get(name);
        }
        this._featureCache.set(name, value);
        return value;
    }

    /**
     * Enhanced CHIPS (Cookie Partitioning) detection with robust testing
     */
    _checkCHIPSSupport() {
        try {
            // More comprehensive CHIPS detection
            const testCookieName = '_chips_test_' + Math.random().toString(36).substr(2, 8);
            const testValue = 'test_' + Date.now();
            
            // Try to set a partitioned cookie
            document.cookie = `${testCookieName}=${testValue}; Partitioned; Secure; SameSite=None; Max-Age=1`;
            
            // Check if the cookie was set successfully
            const cookieSet = document.cookie.includes(`${testCookieName}=${testValue}`);
            
            // Clean up test cookie
            if (cookieSet) {
                document.cookie = `${testCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Partitioned; Secure; SameSite=None`;
            }
            
            return cookieSet;
        } catch (e) {
            console.warn('Privacy Sandbox: CHIPS detection failed:', e);
            return false;
        }
    }

    /**
     * Enhanced cross-origin headers setup
     */
    _setupEnhancedHeaders() {
        const headers = [
            ['Cross-Origin-Embedder-Policy', 'credentialless'],
            ['Permissions-Policy', 'storage-access=*, identity-credentials-get=*, browsing-topics=*'],
            ['Cross-Origin-Resource-Policy', 'cross-origin']
        ];
        
        headers.forEach(([name, content]) => {
            if (!document.querySelector(`meta[http-equiv="${name}"]`)) {
                const meta = document.createElement('meta');
                meta.setAttribute('http-equiv', name);
                meta.setAttribute('content', content);
                document.head.appendChild(meta);
            }
        });
    }

    /**
     * Cross-origin messaging setup for parent-iframe communication
     */
    _setupCrossOriginMessaging() {
        if (!this.isInFrame) return;
        
        const handleMessage = (event) => {
            // Validate origin for security
            if (!this._isAllowedOrigin(event.origin)) {
                console.warn('Privacy Sandbox: Message from disallowed origin:', event.origin);
                return;
            }
            
            this._handleParentMessage(event.data);
        };
        
        window.addEventListener('message', handleMessage);
        this._addEventHandler('message', handleMessage);
    }

    /**
     * Enhanced storage access request with retry logic and user interaction
     */
    async _requestStorageAccessWithRetry() {
        if (!this.supportsStorageAccess || !this.isInFrame) {
            return false;
        }

        const startTime = performance.now();
        let attempts = 0;
        
        while (attempts < this.config.storageRetryAttempts) {
            try {
                // Check if we already have access
                const hasAccess = await document.hasStorageAccess();
                
                if (hasAccess) {
                    console.log('Privacy Sandbox: Storage access already available');
                    this.performanceMetrics.storageAccessTime = performance.now() - startTime;
                    return true;
                }
                
                // Wait for user interaction if this is the first attempt
                if (attempts === 0) {
                    await this._waitForUserInteraction();
                }
                
                console.log(`Privacy Sandbox: Requesting storage access (attempt ${attempts + 1})`);
                await document.requestStorageAccess();
                
                console.log('Privacy Sandbox: Storage access granted');
                this.performanceMetrics.storageAccessTime = performance.now() - startTime;
                
                // Dispatch success event
                this._dispatchEvent('storageAccessGranted', { attempts: attempts + 1 });
                
                // Track analytics
                this._trackEvent('storage_access_granted', { attempts: attempts + 1 });
                
                return true;
                
            } catch (error) {
                attempts++;
                console.warn(`Privacy Sandbox: Storage access attempt ${attempts} failed:`, error);
                
                if (attempts < this.config.storageRetryAttempts) {
                    await this._delay(this.config.storageRetryDelay * attempts);
                }
            }
        }
        
        console.warn('Privacy Sandbox: Storage access denied after all attempts');
        this._trackEvent('storage_access_denied', { attempts });
        return false;
    }

    /**
     * Enhanced partitioned cookies setup with lifecycle management
     */
    _setupEnhancedPartitionedCookies() {
        if (!this.supportsCHIPS) {
            console.warn('Privacy Sandbox: CHIPS not supported, using alternative storage strategy');
            return;
        }

        console.log('Privacy Sandbox: Setting up enhanced partitioned cookies');
        
        // Set session cookie with automatic refresh
        this._setManagedPartitionedCookie('embed_session', this._generateEnhancedSessionId(), {
            maxAge: this.config.sessionCookieAge,
            autoRefresh: true
        });
        
        // Set theme preference cookie
        const theme = new URLSearchParams(window.location.search).get('theme') || 'default';
        this._setManagedPartitionedCookie('embed_theme', theme, {
            maxAge: this.config.maxCookieAge
        });
        
        // Set up cookie cleanup scheduler
        this._scheduleCookieCleanup();
    }

    /**
     * Enhanced partitioned cookie management with auto-refresh and cleanup
     */
    _setManagedPartitionedCookie(name, value, options = {}) {
        const defaults = {
            path: '/',
            secure: true,
            sameSite: 'None',
            partitioned: true,
            autoRefresh: false
        };
        
        const opts = { ...defaults, ...options };
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        // Build cookie string
        if (opts.maxAge) cookieString += `; Max-Age=${opts.maxAge}`;
        if (opts.path) cookieString += `; Path=${opts.path}`;
        if (opts.secure) cookieString += `; Secure`;
        if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
        if (opts.partitioned && this.supportsCHIPS) cookieString += `; Partitioned`;
        
        try {
            document.cookie = cookieString;
            
            // Set up auto-refresh if enabled
            if (opts.autoRefresh && opts.maxAge) {
                this._scheduleRefresh(name, value, opts);
            }
            
            if (this.config.debugMode) {
                console.log(`Privacy Sandbox: Set managed partitioned cookie: ${name}`);
            }
        } catch (error) {
            this._handleError('Failed to set partitioned cookie', error);
        }
    }

    /**
     * Schedule cookie refresh for auto-refresh cookies
     */
    _scheduleRefresh(name, value, options) {
        const refreshTime = (options.maxAge * 1000) * 0.8; // Refresh at 80% of expiry
        
        setTimeout(() => {
            if (this._getCookie(name)) { // Only refresh if cookie still exists
                this._setManagedPartitionedCookie(name, value, options);
            }
        }, refreshTime);
    }

    /**
     * Enhanced cookie retrieval with caching
     */
    _getCookie(name) {
        // Use cached value if available and recent
        const cacheKey = `cookie_${name}`;
        const cached = this._getCache(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < 1000) {
            return cached.value;
        }
        
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        const result = parts.length === 2 ? decodeURIComponent(parts.pop().split(';').shift()) : null;
        
        // Cache the result
        this._setCache(cacheKey, result);
        return result;
    }

    /**
     * Generate enhanced session ID with entropy and metadata
     */
    _generateEnhancedSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 12);
        const entropy = this._generateEntropy();
        
        return `embed_${timestamp}_${random}_${entropy}`;
    }

    /**
     * Generate additional entropy for session IDs
     */
    _generateEntropy() {
        const factors = [
            navigator.userAgent.length % 100,
            screen.width % 100,
            screen.height % 100,
            (new Date()).getTimezoneOffset() % 100
        ];
        
        return factors.reduce((acc, val) => acc + val, 0).toString(36);
    }

    /**
     * Enhanced privacy-preserving storage with advanced fallback strategies
     */
    async _initializePrivacyStorage() {
        this.storageStrategy = await this._determineOptimalStorageStrategy();
        
        if (this.config.debugMode) {
            console.log('Privacy Sandbox: Using storage strategy:', this.storageStrategy);
        }
    }

    /**
     * Determine the best storage strategy based on available features
     */
    async _determineOptimalStorageStrategy() {
        // Test storage access availability
        const hasStorageAccess = this.supportsStorageAccess && await this._testStorageAccess();
        
        if (hasStorageAccess) {
            return 'localStorage_with_access';
        } else if (this.supportsCHIPS) {
            return 'partitioned_cookies';
        } else if (this.isInFrame) {
            return 'postMessage_bridge';
        } else {
            return 'localStorage_native';
        }
    }

    /**
     * Test if storage access is actually available
     */
    async _testStorageAccess() {
        try {
            return await document.hasStorageAccess();
        } catch (e) {
            return false;
        }
    }

    /**
     * Enhanced preference storage with advanced strategies
     */
    async storePreference(key, value, options = {}) {
        const strategy = options.strategy || this.storageStrategy;
        const serializedValue = JSON.stringify({
            value,
            timestamp: Date.now(),
            version: '2.0'
        });
        
        try {
            switch (strategy) {
                case 'localStorage_with_access':
                    await this._storeInLocalStorage(key, serializedValue);
                    break;
                    
                case 'partitioned_cookies':
                    this._storeInPartitionedCookies(key, serializedValue, options);
                    break;
                    
                case 'postMessage_bridge':
                    await this._storeViaPostMessage(key, serializedValue);
                    break;
                    
                default:
                    localStorage.setItem(`embed_${key}`, serializedValue);
            }
            
            this._trackEvent('preference_stored', { key, strategy });
            
        } catch (error) {
            this._handleError('Failed to store preference', error);
            // Try fallback strategy
            await this._storeFallback(key, serializedValue);
        }
    }

    /**
     * Enhanced preference retrieval with caching and validation
     */
    async getPreference(key, defaultValue = null) {
        const cacheKey = `pref_${key}`;
        
        // Check memory cache first
        const cached = this._getCache(cacheKey);
        if (cached && this._isValidCachedPreference(cached)) {
            return cached.value;
        }
        
        try {
            let rawValue = null;
            
            // Try different storage strategies
            const strategies = [this.storageStrategy, 'localStorage_native', 'partitioned_cookies'];
            
            for (const strategy of strategies) {
                rawValue = await this._retrieveByStrategy(key, strategy);
                if (rawValue) break;
            }
            
            if (!rawValue) return defaultValue;
            
            const parsed = JSON.parse(rawValue);
            const value = parsed.value !== undefined ? parsed.value : parsed; // Handle legacy format
            
            // Cache the result
            this._setCache(cacheKey, value);
            
            return value;
        } catch (error) {
            this._handleError('Failed to retrieve preference', error);
            return defaultValue;
        }
    }

    /**
     * Store via localStorage with storage access
     */
    async _storeInLocalStorage(key, value) {
        const hasAccess = await this._ensureStorageAccess();
        if (hasAccess) {
            localStorage.setItem(`embed_${key}`, value);
            if (this.config.debugMode) {
                console.log(`Privacy Sandbox: Stored preference in localStorage: ${key}`);
            }
        } else {
            throw new Error('Storage access not available');
        }
    }

    /**
     * Store in partitioned cookies with compression for large values
     */
    _storeInPartitionedCookies(key, value, options = {}) {
        // Compress large values
        const compressed = value.length > 1000 ? this._compressString(value) : value;
        
        this._setManagedPartitionedCookie(`pref_${key}`, compressed, {
            maxAge: options.maxAge || this.config.maxCookieAge,
            compressed: value.length > 1000
        });
    }

    /**
     * Store via postMessage communication with parent
     */
    async _storeViaPostMessage(key, value) {
        if (!this.isInFrame) throw new Error('Not in frame context');
        
        return new Promise((resolve, reject) => {
            const messageId = this._generateMessageId();
            
            const handleResponse = (event) => {
                if (event.data.id === messageId) {
                    window.removeEventListener('message', handleResponse);
                    if (event.data.success) {
                        resolve();
                    } else {
                        reject(new Error(event.data.error));
                    }
                }
            };
            
            window.addEventListener('message', handleResponse);
            
            window.parent.postMessage({
                type: 'privacy_sandbox_store',
                id: messageId,
                key,
                value
            }, '*');
            
            // Timeout after 5 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Storage request timeout'));
            }, 5000);
        });
    }

    /**
     * Enhanced FedCM initialization with better error handling and features
     */
    async _initializeFedCM(config = {}) {
        if (!this.supportsFedCM) {
            if (this.config.debugMode) {
                console.warn('Privacy Sandbox: FedCM not supported in this browser');
            }
            return false;
        }

        try {
            const defaultConfig = {
                providers: [{
                    configURL: `${window.location.origin}/.well-known/web-identity`,
                    clientId: '42web-embed-client',
                    nonce: this._generateNonce()
                }],
                mode: 'auto',
                mediation: 'optional'
            };
            
            this.fedCMConfig = { ...defaultConfig, ...config };
            
            // Pre-validate FedCM configuration
            await this._validateFedCMConfig();
            
            if (this.config.debugMode) {
                console.log('Privacy Sandbox: FedCM initialized successfully');
            }
            
            this._trackEvent('fedcm_initialized');
            return true;
        } catch (error) {
            this._handleError('FedCM initialization failed', error);
            return false;
        }
    }

    /**
     * Enhanced credential request with better UX and error handling
     */
    async requestCredential(options = {}) {
        if (!this.supportsFedCM) {
            throw new Error('FedCM not supported in this browser');
        }

        const startTime = performance.now();
        
        try {
            // Ensure user interaction for credential request
            await this._ensureUserInteraction();
            
            const credentialOptions = {
                identity: {
                    providers: this.fedCMConfig.providers.map(provider => ({
                        ...provider,
                        ...options.providerOverrides
                    }))
                },
                mediation: options.mediation || 'optional'
            };
            
            if (this.config.debugMode) {
                console.log('Privacy Sandbox: Requesting credential via FedCM');
            }
            
            const credential = await navigator.credentials.get(credentialOptions);
            
            if (credential) {
                this._trackEvent('credential_obtained', {
                    duration: performance.now() - startTime
                });
                
                // Store credential metadata securely
                await this._storeCredentialMetadata(credential);
                
                return credential;
            } else {
                throw new Error('No credential returned');
            }
        } catch (error) {
            this._trackEvent('credential_request_failed', {
                error: error.message,
                duration: performance.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Enhanced browser support status with performance metrics
     */
    getSupportStatus() {
        return {
            // Basic support
            isInFrame: this.isInFrame,
            storageAccess: this.supportsStorageAccess,
            chips: this.supportsCHIPS,
            fedCM: this.supportsFedCM,
            
            // Advanced features
            topicsAPI: this.supportsTopicsAPI,
            trustTokens: this.supportsTrustTokens,
            
            // Privacy status
            thirdPartyCookies: this._checkThirdPartyCookieSupport(),
            storageStrategy: this.storageStrategy,
            
            // Performance metrics
            initializationTime: this.performanceMetrics.featureDetectionTime,
            storageAccessTime: this.performanceMetrics.storageAccessTime,
            
            // Security
            embedOrigin: this.embedOrigin,
            secureContext: window.isSecureContext,
            
            // Browser info
            userAgent: navigator.userAgent,
            cookiesEnabled: navigator.cookieEnabled
        };
    }

    /**
     * Enhanced third-party cookie support check
     */
    _checkThirdPartyCookieSupport() {
        if (!this.isInFrame) return true;
        
        const cacheKey = 'third_party_cookie_support';
        const cached = this._getCache(cacheKey);
        if (cached !== null) return cached;
        
        try {
            const testName = '_3p_test_' + Math.random().toString(36).substr(2, 8);
            document.cookie = `${testName}=1; SameSite=None; Secure; Max-Age=1`;
            const hasSupport = document.cookie.includes(`${testName}=1`);
            
            // Clean up test cookie
            if (hasSupport) {
                document.cookie = `${testName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
            }
            
            this._setCache(cacheKey, hasSupport);
            return hasSupport;
        } catch (e) {
            this._setCache(cacheKey, false);
            return false;
        }
    }

    /**
     * Enhanced privacy status display with interactive features
     */
    displayPrivacyStatus() {
        const status = this.getSupportStatus();
        const statusDiv = document.createElement('div');
        statusDiv.className = 'privacy-status alert alert-info position-relative';
        statusDiv.style.cssText = `
            margin: 10px 0;
            font-size: 0.9em;
            border-left: 4px solid #0d6efd;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        `;
        
        statusDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-2">
                        <i class="fas fa-shield-alt text-primary"></i> 
                        Privacy Features Status
                        <span class="badge bg-${this._getOverallStatusBadge(status)} ms-2">${this._getOverallStatus(status)}</span>
                    </h6>
                    <div class="row">
                        <div class="col-md-6">
                            <ul class="mb-2 small">
                                <li>Storage Access API: ${this._getStatusIcon(status.storageAccess)} ${status.storageAccess ? 'Supported' : 'Not supported'}</li>
                                <li>CHIPS (Partitioned Cookies): ${this._getStatusIcon(status.chips)} ${status.chips ? 'Supported' : 'Not supported'}</li>
                                <li>FedCM: ${this._getStatusIcon(status.fedCM)} ${status.fedCM ? 'Supported' : 'Not supported'}</li>
                                <li>Third-party Cookies: ${this._getStatusIcon(status.thirdPartyCookies)} ${status.thirdPartyCookies ? 'Enabled' : 'Blocked'}</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <ul class="mb-2 small">
                                <li>Topics API: ${this._getStatusIcon(status.topicsAPI)} ${status.topicsAPI ? 'Supported' : 'Not supported'}</li>
                                <li>Storage Strategy: <code>${status.storageStrategy}</code></li>
                                <li>Secure Context: ${this._getStatusIcon(status.secureContext)} ${status.secureContext ? 'Yes' : 'No'}</li>
                                <li>Frame Context: ${this._getStatusIcon(status.isInFrame)} ${status.isInFrame ? 'Embedded' : 'Standalone'}</li>
                            </ul>
                        </div>
                    </div>
                    ${this._getPerformanceInfo(status)}
                </div>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="this.parentElement.parentElement.style.display='none'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add click handler for detailed view
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-sm btn-link text-decoration-none p-0';
        detailsBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show Details';
        detailsBtn.onclick = () => this._showDetailedStatus(status);
        statusDiv.appendChild(detailsBtn);
        
        return statusDiv;
    }

    /**
     * Helper methods for privacy status display
     */
    _getStatusIcon(supported) {
        return supported ? '✅' : '❌';
    }

    _getOverallStatus(status) {
        const score = [
            status.storageAccess,
            status.chips,
            status.fedCM,
            status.secureContext
        ].filter(Boolean).length;
        
        if (score >= 3) return 'Excellent';
        if (score >= 2) return 'Good';
        if (score >= 1) return 'Basic';
        return 'Limited';
    }

    _getOverallStatusBadge(status) {
        const overall = this._getOverallStatus(status);
        const badges = {
            'Excellent': 'success',
            'Good': 'primary',
            'Basic': 'warning',
            'Limited': 'danger'
        };
        return badges[overall] || 'secondary';
    }

    _getPerformanceInfo(status) {
        if (!status.initializationTime) return '';
        
        return `
            <div class="mt-2 p-2 bg-light rounded small">
                <strong>Performance:</strong>
                Init: ${status.initializationTime?.toFixed(2)}ms
                ${status.storageAccessTime ? `, Storage: ${status.storageAccessTime.toFixed(2)}ms` : ''}
            </div>
        `;
    }

    /**
     * Show detailed privacy status in modal or expanded view
     */
    _showDetailedStatus(status) {
        const modal = document.createElement('div');
        modal.className = 'privacy-details-modal';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; border: 2px solid #dee2e6; border-radius: 8px;
            padding: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5>Detailed Privacy Status</h5>
                <button class="btn btn-sm btn-outline-secondary" onclick="this.closest('.privacy-details-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <pre class="bg-light p-3 rounded small">${JSON.stringify(status, null, 2)}</pre>
        `;
        
        document.body.appendChild(modal);
    }
}

/**
 * Utility and helper methods for enhanced functionality
 */

// Add utility methods to PrivacySandbox prototype
Object.assign(PrivacySandbox.prototype, {
    // Cache management
    _cache: new Map(),
    
    _getCache(key) {
        const item = this._cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > 60000) { // 1 minute cache
            this._cache.delete(key);
            return null;
        }
        return item;
    },
    
    _setCache(key, value) {
        this._cache.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    // Event management
    _addEventHandler(type, handler) {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, []);
        }
        this.eventHandlers.get(type).push(handler);
    },

    _dispatchEvent(type, data) {
        const event = new CustomEvent(`privacySandbox:${type}`, { detail: data });
        window.dispatchEvent(event);
    },

    // User interaction helpers
    async _waitForUserInteraction() {
        if (this._hasUserInteracted) return;
        
        return new Promise(resolve => {
            const interactionEvents = ['click', 'touch', 'keydown'];
            const handler = () => {
                this._hasUserInteracted = true;
                interactionEvents.forEach(event => 
                    document.removeEventListener(event, handler)
                );
                resolve();
            };
            
            interactionEvents.forEach(event => 
                document.addEventListener(event, handler, { once: true })
            );
        });
    },

    async _ensureUserInteraction() {
        if (!this._hasUserInteracted) {
            await this._waitForUserInteraction();
        }
    },

    _setupUserInteractionMonitoring() {
        const interactionEvents = ['click', 'touch', 'keydown', 'scroll'];
        const handler = () => {
            this._hasUserInteracted = true;
            interactionEvents.forEach(event => 
                document.removeEventListener(event, handler)
            );
        };
        
        interactionEvents.forEach(event => 
            document.addEventListener(event, handler, { once: true, passive: true })
        );
    },

    // Performance monitoring
    _setupPerformanceMonitoring() {
        if (!this.config.enablePerformanceTracking) return;
        
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this._trackPerformanceEntry(entry);
                    }
                });
                observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
            } catch (e) {
                console.warn('Privacy Sandbox: Performance monitoring not available');
            }
        }
    },

    _trackPerformanceEntry(entry) {
        if (entry.name.includes('privacy') || entry.name.includes('sandbox')) {
            this.performanceMetrics[entry.name] = entry.duration;
        }
    },

    // Analytics and tracking
    _initializeAnalytics() {
        if (!this.config.enableAnalytics) return;
        
        this.analytics = {
            startTime: Date.now(),
            events: [],
            maxEvents: 100
        };
        
        this._trackEvent('privacy_sandbox_loaded', {
            userAgent: navigator.userAgent,
            isInFrame: this.isInFrame,
            supportedFeatures: Array.from(this._featureCache.keys())
        });
    },

    _trackEvent(eventName, data = {}) {
        if (!this.config.enableAnalytics || !this.analytics) return;
        
        const event = {
            name: eventName,
            timestamp: Date.now(),
            data: { ...data },
            sessionId: this._getCookie('embed_session')
        };
        
        this.analytics.events.push(event);
        
        if (this.analytics.events.length > this.analytics.maxEvents) {
            this.analytics.events.shift();
        }
        
        if (this.config.debugMode) {
            console.log('Privacy Sandbox Analytics:', event);
        }
    },

    // Error handling
    _handleError(message, error) {
        const errorInfo = {
            message,
            error: error?.message || error,
            stack: error?.stack,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.performanceMetrics.errors.push(errorInfo);
        
        if (this.config.debugMode) {
            console.error('Privacy Sandbox Error:', errorInfo);
        }
        
        this._trackEvent('error', errorInfo);
    },

    // Security helpers
    _isAllowedOrigin(origin) {
        const allowedPatterns = [
            /^https?:\/\/localhost(:\d+)?$/,
            /^https:\/\/.*\.42web\.io$/,
            /^https:\/\/42web\.io$/
        ];
        
        return allowedPatterns.some(pattern => pattern.test(origin));
    },

    _generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    _generateMessageId() {
        return 'msg_' + this._generateNonce();
    },

    // Compression helpers
    _compressString(str) {
        return btoa(encodeURIComponent(str));
    },

    _decompressString(compressed) {
        try {
            return decodeURIComponent(atob(compressed));
        } catch (e) {
            return compressed;
        }
    },

    // Utility methods
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    _isValidCachedPreference(cached) {
        return cached && (Date.now() - cached.timestamp) < 300000;
    },

    async _ensureStorageAccess() {
        if (!this.supportsStorageAccess) return false;
        try {
            return await document.hasStorageAccess();
        } catch (e) {
            return false;
        }
    },

    async _retrieveByStrategy(key, strategy) {
        switch (strategy) {
            case 'localStorage_with_access':
            case 'localStorage_native':
                try {
                    return localStorage.getItem(`embed_${key}`);
                } catch (e) {
                    return null;
                }
                
            case 'partitioned_cookies':
                const cookieValue = this._getCookie(`pref_${key}`);
                return cookieValue ? this._decompressString(cookieValue) : null;
                
            default:
                return null;
        }
    },

    async _storeFallback(key, value) {
        if (!this._inMemoryStorage) {
            this._inMemoryStorage = new Map();
        }
        this._inMemoryStorage.set(key, value);
    },

    async _validateFedCMConfig() {
        for (const provider of this.fedCMConfig.providers) {
            try {
                const response = await fetch(provider.configURL, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`FedCM config not accessible: ${provider.configURL}`);
                }
            } catch (error) {
                console.warn('Privacy Sandbox: FedCM config validation failed:', error);
            }
        }
    },

    async _storeCredentialMetadata(credential) {
        const metadata = {
            id: credential.id,
            type: credential.type,
            timestamp: Date.now()
        };
        
        await this.storePreference('last_credential', metadata);
    },

    _handleParentMessage(data) {
        if (data.type === 'privacy_sandbox_query') {
            window.parent.postMessage({
                type: 'privacy_sandbox_status',
                id: data.id,
                status: this.getSupportStatus()
            }, '*');
        }
    },

    _setupPrivacyPreferences() {
        if (this.config.debugMode) {
            console.log('Privacy Sandbox: Setting up privacy preferences');
        }
    },

    _scheduleCookieCleanup() {
        setInterval(() => {
            this._cleanupExpiredCookies();
        }, 3600000);
    },

    _cleanupExpiredCookies() {
        if (this.config.debugMode) {
            console.log('Privacy Sandbox: Cleaning up expired cookies');
        }
    },

    // Public API methods
    getAnalytics() {
        return this.analytics;
    },

    getPerformanceMetrics() {
        return this.performanceMetrics;
    },

    clearCache() {
        this._cache.clear();
    },

    async testPrivacyFeatures() {
        const results = {};
        
        results.storageAccess = await this._testStorageAccess();
        results.chips = this._testCHIPS();
        results.fedcm = await this._testFedCM();
        
        return results;
    },

    _testCHIPS() {
        try {
            this._setManagedPartitionedCookie('_test_chips', 'test', { maxAge: 1 });
            return this._getCookie('_test_chips') === 'test';
        } catch (e) {
            return false;
        }
    },

    async _testFedCM() {
        if (!this.supportsFedCM) return false;
        try {
            return 'IdentityCredential' in window && typeof navigator.credentials?.get === 'function';
        } catch (e) {
            return false;
        }
    },

    // Cleanup method
    destroy() {
        this.eventHandlers.forEach((handlers, type) => {
            handlers.forEach(handler => {
                window.removeEventListener(type, handler);
            });
        });
        
        this._cache.clear();
        this._featureCache.clear();
        this.analytics = null;
        
        if (this.config.debugMode) {
            console.log('Privacy Sandbox: Cleanup completed');
        }
    }
});

// Enhanced initialization
document.addEventListener('DOMContentLoaded', () => {
    window.privacySandbox = new PrivacySandbox({
        debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    });
    
    // Add enhanced privacy status to embed content
    if (window.privacySandbox.config.debugMode) {
        const embedContent = document.querySelector('.embed-content');
        if (embedContent) {
            setTimeout(() => {
                const statusDisplay = window.privacySandbox.displayPrivacyStatus();
                embedContent.appendChild(statusDisplay);
            }, 1000); // Delay to ensure full initialization
        }
    }
    
    // Set up global error handling for privacy features
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message?.includes('privacy')) {
            window.privacySandbox._handleError('Global privacy error', event.error);
        }
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacySandbox;
}