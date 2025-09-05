/**
 * Privacy Sandbox & New Browser APIs for Privacy-Preserving Embedding
 * Modern browsers are reducing third-party cookies. This module implements
 * Google's Privacy Sandbox APIs like CHIPS, Storage Access API, and FedCM
 * for secure cookie management in embedded content.
 */

class PrivacySandbox {
    constructor() {
        this.isInFrame = window !== window.top;
        this.supportsStorageAccess = 'requestStorageAccess' in document;
        this.supportsCHIPS = this.checkCHIPSSupport();
        this.supportsFedCM = 'IdentityCredential' in window;
        
        this.init();
    }

    /**
     * Initialize Privacy Sandbox features
     */
    init() {
        if (this.isInFrame) {
            console.log('Privacy Sandbox: Initializing for embedded content');
            this.setupCrossOriginHeaders();
            this.requestStorageAccess();
            this.setupPartitionedCookies();
        }
    }

    /**
     * Check if browser supports CHIPS (Cookie Partitioning)
     */
    checkCHIPSSupport() {
        // Check if browser supports partitioned cookies
        try {
            document.cookie = 'test=1; Partitioned; Secure; SameSite=None';
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Set up cross-origin headers for embedded content
     */
    setupCrossOriginHeaders() {
        // Add meta tag for cross-origin embedder policy if not already present
        if (!document.querySelector('meta[name="Cross-Origin-Embedder-Policy"]')) {
            const meta = document.createElement('meta');
            meta.setAttribute('http-equiv', 'Cross-Origin-Embedder-Policy');
            meta.setAttribute('content', 'credentialless');
            document.head.appendChild(meta);
        }
    }

    /**
     * Request storage access using Storage Access API
     */
    async requestStorageAccess() {
        if (!this.supportsStorageAccess || !this.isInFrame) {
            return false;
        }

        try {
            // Check if we already have storage access
            const hasAccess = await document.hasStorageAccess();
            
            if (!hasAccess) {
                console.log('Privacy Sandbox: Requesting storage access...');
                await document.requestStorageAccess();
                console.log('Privacy Sandbox: Storage access granted');
                
                // Dispatch event for application to handle
                window.dispatchEvent(new CustomEvent('storageAccessGranted'));
                return true;
            } else {
                console.log('Privacy Sandbox: Storage access already available');
                return true;
            }
        } catch (error) {
            console.warn('Privacy Sandbox: Storage access denied or not supported:', error);
            return false;
        }
    }

    /**
     * Set up partitioned cookies using CHIPS
     */
    setupPartitionedCookies() {
        if (!this.supportsCHIPS) {
            console.warn('Privacy Sandbox: CHIPS not supported, falling back to regular cookies');
            return;
        }

        console.log('Privacy Sandbox: Setting up partitioned cookies');
        
        // Example: Set session cookie with partitioning
        this.setPartitionedCookie('embed_session', this.generateSessionId(), {
            maxAge: 3600, // 1 hour
            secure: true,
            sameSite: 'None',
            partitioned: true
        });
    }

    /**
     * Set a partitioned cookie
     */
    setPartitionedCookie(name, value, options = {}) {
        const defaults = {
            path: '/',
            secure: true,
            sameSite: 'None',
            partitioned: true
        };
        
        const opts = { ...defaults, ...options };
        let cookieString = `${name}=${encodeURIComponent(value)}`;
        
        if (opts.maxAge) cookieString += `; Max-Age=${opts.maxAge}`;
        if (opts.path) cookieString += `; Path=${opts.path}`;
        if (opts.secure) cookieString += `; Secure`;
        if (opts.sameSite) cookieString += `; SameSite=${opts.sameSite}`;
        if (opts.partitioned && this.supportsCHIPS) cookieString += `; Partitioned`;
        
        try {
            document.cookie = cookieString;
            console.log(`Privacy Sandbox: Set partitioned cookie: ${name}`);
        } catch (error) {
            console.error('Privacy Sandbox: Failed to set partitioned cookie:', error);
        }
    }

    /**
     * Get a cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
        }
        return null;
    }

    /**
     * Generate session ID for embedded content
     */
    generateSessionId() {
        return 'embed_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Store preferences using partitioned storage
     */
    async storePreference(key, value) {
        if (!this.isInFrame) {
            localStorage.setItem(`embed_${key}`, JSON.stringify(value));
            return;
        }

        try {
            // Request storage access first
            const hasAccess = await this.requestStorageAccess();
            
            if (hasAccess) {
                localStorage.setItem(`embed_${key}`, JSON.stringify(value));
                console.log(`Privacy Sandbox: Stored preference: ${key}`);
            } else {
                // Fallback to partitioned cookie storage
                this.setPartitionedCookie(`pref_${key}`, JSON.stringify(value), {
                    maxAge: 86400 * 30 // 30 days
                });
            }
        } catch (error) {
            console.error('Privacy Sandbox: Failed to store preference:', error);
        }
    }

    /**
     * Retrieve preferences
     */
    async getPreference(key) {
        try {
            // Try localStorage first
            const stored = localStorage.getItem(`embed_${key}`);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Fallback to cookie
            const cookieValue = this.getCookie(`pref_${key}`);
            if (cookieValue) {
                return JSON.parse(cookieValue);
            }
            
            return null;
        } catch (error) {
            console.error('Privacy Sandbox: Failed to retrieve preference:', error);
            return null;
        }
    }

    /**
     * Initialize FedCM for credential management
     */
    async initializeFedCM(config = {}) {
        if (!this.supportsFedCM) {
            console.warn('Privacy Sandbox: FedCM not supported');
            return false;
        }

        try {
            const defaultConfig = {
                providers: [{
                    configURL: `${window.location.origin}/.well-known/web-identity`,
                    clientId: '42web-embed-client'
                }]
            };
            
            const fedCMConfig = { ...defaultConfig, ...config };
            console.log('Privacy Sandbox: FedCM initialized with config:', fedCMConfig);
            
            return true;
        } catch (error) {
            console.error('Privacy Sandbox: FedCM initialization failed:', error);
            return false;
        }
    }

    /**
     * Handle credential request via FedCM
     */
    async requestCredential() {
        if (!this.supportsFedCM) {
            throw new Error('FedCM not supported');
        }

        try {
            const credential = await navigator.credentials.get({
                identity: {
                    providers: [{
                        configURL: `${window.location.origin}/.well-known/web-identity`,
                        clientId: '42web-embed-client'
                    }]
                }
            });
            
            console.log('Privacy Sandbox: Credential obtained via FedCM');
            return credential;
        } catch (error) {
            console.error('Privacy Sandbox: Credential request failed:', error);
            throw error;
        }
    }

    /**
     * Get browser privacy features support status
     */
    getSupportStatus() {
        return {
            isInFrame: this.isInFrame,
            storageAccess: this.supportsStorageAccess,
            chips: this.supportsCHIPS,
            fedCM: this.supportsFedCM,
            thirdPartyCookies: this.checkThirdPartyCookieSupport()
        };
    }

    /**
     * Check if third-party cookies are enabled
     */
    checkThirdPartyCookieSupport() {
        // This is a simplified check - real implementation would be more complex
        if (!this.isInFrame) return true;
        
        try {
            document.cookie = 'third_party_test=1; SameSite=None; Secure';
            const hasSupport = document.cookie.includes('third_party_test=1');
            // Clean up test cookie
            document.cookie = 'third_party_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
            return hasSupport;
        } catch (e) {
            return false;
        }
    }

    /**
     * Display privacy status to user
     */
    displayPrivacyStatus() {
        const status = this.getSupportStatus();
        const statusDiv = document.createElement('div');
        statusDiv.className = 'privacy-status alert alert-info';
        statusDiv.innerHTML = `
            <h6><i class="fas fa-shield-alt"></i> Privacy Features Status</h6>
            <ul class="mb-0">
                <li>Storage Access API: ${status.storageAccess ? '✅ Supported' : '❌ Not supported'}</li>
                <li>CHIPS (Cookie Partitioning): ${status.chips ? '✅ Supported' : '❌ Not supported'}</li>
                <li>FedCM: ${status.fedCM ? '✅ Supported' : '❌ Not supported'}</li>
                <li>Third-party Cookies: ${status.thirdPartyCookies ? '✅ Enabled' : '❌ Blocked'}</li>
            </ul>
        `;
        
        return statusDiv;
    }
}

// Initialize Privacy Sandbox when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.privacySandbox = new PrivacySandbox();
    
    // Add privacy status to embed content if in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const embedContent = document.querySelector('.embed-content');
        if (embedContent) {
            embedContent.appendChild(window.privacySandbox.displayPrivacyStatus());
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacySandbox;
}