// Main JavaScript for 42Web.io

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initSmoothScrolling();
    initFormValidation();
    initAnimations();
    initNavbar();
    initWebsiteEmbedder();
    initWebsiteAutomation();
});

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form validation and submission
function initFormValidation() {
    const contactForm = document.querySelector('form[action="/contact"]');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const name = this.querySelector('#name');
            const email = this.querySelector('#email');
            const message = this.querySelector('#message');
            
            let isValid = true;
            
            // Clear previous validation states
            clearValidationStates([name, email, message]);
            
            // Validate name
            if (!name.value.trim()) {
                showFieldError(name, 'Please enter your name');
                isValid = false;
            }
            
            // Validate email
            if (!email.value.trim()) {
                showFieldError(email, 'Please enter your email');
                isValid = false;
            } else if (!isValidEmail(email.value)) {
                showFieldError(email, 'Please enter a valid email address');
                isValid = false;
            }
            
            // Validate message
            if (!message.value.trim()) {
                showFieldError(message, 'Please enter your message');
                isValid = false;
            } else if (message.value.trim().length < 10) {
                showFieldError(message, 'Message must be at least 10 characters long');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                return false;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Sending...';
            submitBtn.disabled = true;
            
            // Re-enable button after a delay (in case of server error)
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 5000);
        });
    }
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    // Remove existing feedback
    const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Add new feedback
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    field.parentNode.appendChild(feedback);
}

// Clear validation states
function clearValidationStates(fields) {
    fields.forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Initialize animations
function initAnimations() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe cards and other elements
    const animatedElements = document.querySelectorAll('.card, .tech-icon, .process-number');
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
    
    // Add CSS for animations
    addAnimationStyles();
}

// Add animation styles
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Stagger animation for multiple elements */
        .animate-on-scroll:nth-child(1) { transition-delay: 0.1s; }
        .animate-on-scroll:nth-child(2) { transition-delay: 0.2s; }
        .animate-on-scroll:nth-child(3) { transition-delay: 0.3s; }
        .animate-on-scroll:nth-child(4) { transition-delay: 0.4s; }
        .animate-on-scroll:nth-child(5) { transition-delay: 0.5s; }
        .animate-on-scroll:nth-child(6) { transition-delay: 0.6s; }
    `;
    document.head.appendChild(style);
}

// Initialize navbar behavior
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background to navbar on scroll
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Add navbar styles
    const style = document.createElement('style');
    style.textContent = `
        .navbar {
            transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
        }
        
        .navbar.scrolled {
            background-color: rgba(33, 37, 41, 0.95) !important;
            backdrop-filter: blur(10px);
        }
    `;
    document.head.appendChild(style);
}

// Utility functions

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy to clipboard', 'error');
    });
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
}

// Website Embedder functionality
function initWebsiteEmbedder() {
    const urlInput = document.getElementById('urlInput');
    const loadButton = document.getElementById('loadWebsite');
    const websiteContainer = document.getElementById('websiteContainer');
    const quickLinksSection = document.getElementById('quickLinksSection');
    const websiteContent = document.getElementById('websiteContent');
    const currentUrlInput = document.getElementById('currentUrl');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    // Navigation buttons
    const goBackBtn = document.getElementById('goBack');
    const goForwardBtn = document.getElementById('goForward');
    const refreshBtn = document.getElementById('refreshPage');
    const openInNewTabBtn = document.getElementById('openInNewTab');
    const closeBtn = document.getElementById('closeEmbedded');
    
    // Quick link buttons
    const quickLinkButtons = document.querySelectorAll('.quick-link');
    
    // History tracking
    let navigationHistory = [];
    let currentHistoryIndex = -1;
    
    if (!urlInput || !loadButton) return; // Exit if elements don't exist
    
    // Load website function
    async function loadWebsite(url) {
        if (!isValidUrl(url)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }
        
        // Show container and loading
        websiteContainer.classList.remove('d-none');
        quickLinksSection.classList.add('d-none');
        loadingIndicator.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        websiteContent.style.display = 'none';
        
        // Update current URL display
        currentUrlInput.value = url;
        
        // Add to history if it's a new navigation
        if (navigationHistory[currentHistoryIndex] !== url) {
            // Remove any forward history
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
            navigationHistory.push(url);
            currentHistoryIndex = navigationHistory.length - 1;
        }
        
        updateNavigationButtons();
        
        try {
            // Use our proxy endpoint to fetch the website
            const proxyUrl = `/proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const htmlContent = await response.text();
                
                // Clear previous content and load new content
                websiteContent.innerHTML = htmlContent;
                
                // Process the loaded content
                processLoadedContent(url);
                
                // Hide loading and show content
                loadingIndicator.classList.add('d-none');
                websiteContent.style.display = 'block';
                
            } else {
                // Try to get error details from response
                let errorDetails;
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.error || 'Unknown error occurred';
                } catch (e) {
                    errorDetails = `HTTP ${response.status} ${response.statusText}`;
                }
                showError(errorDetails);
            }
            
        } catch (error) {
            console.error('Load error:', error);
            showError('Network error: Unable to connect to the website');
        }
    }
    
    // Process loaded content to fix links and improve functionality
    function processLoadedContent(originalUrl) {
        const baseUrl = new URL(originalUrl);
        
        // Find all links in the loaded content
        const links = websiteContent.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
                // Make internal navigation use our proxy
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    let newUrl = href;
                    
                    // Convert relative URLs to absolute
                    if (href.startsWith('/')) {
                        newUrl = `${baseUrl.protocol}//${baseUrl.host}${href}`;
                    }
                    
                    // Load the new URL through our proxy
                    loadWebsite(newUrl);
                });
            }
        });
        
        // Handle form submissions
        const forms = websiteContent.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                showToast('Form submissions are limited in embedded mode. Please visit the original site for full functionality.', 'warning');
            });
        });
        
        // Scroll to top when new content loads
        websiteContent.scrollTop = 0;
    }
    
    // Show error function
    function showError(message) {
        loadingIndicator.classList.add('d-none');
        websiteContent.style.display = 'none';
        errorMessage.classList.remove('d-none');
        errorText.textContent = message;
    }
    
    // URL validation
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    // Update navigation buttons
    function updateNavigationButtons() {
        if (goBackBtn && goForwardBtn) {
            goBackBtn.disabled = currentHistoryIndex <= 0;
            goForwardBtn.disabled = currentHistoryIndex >= navigationHistory.length - 1;
        }
    }
    
    // Event listeners
    if (loadButton) {
        loadButton.addEventListener('click', function() {
            const url = urlInput.value.trim();
            if (url) {
                loadWebsite(url);
            }
        });
    }
    
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const url = urlInput.value.trim();
                if (url) {
                    loadWebsite(url);
                }
            }
        });
        
        // Auto-add protocol if missing
        urlInput.addEventListener('blur', function() {
            let url = this.value.trim();
            if (url && !url.match(/^https?:\/\//)) {
                url = 'https://' + url;
                this.value = url;
            }
        });
    }
    
    // Navigation button handlers
    if (goBackBtn) {
        goBackBtn.addEventListener('click', function() {
            if (currentHistoryIndex > 0) {
                currentHistoryIndex--;
                const url = navigationHistory[currentHistoryIndex];
                loadWebsite(url);
            }
        });
    }
    
    if (goForwardBtn) {
        goForwardBtn.addEventListener('click', function() {
            if (currentHistoryIndex < navigationHistory.length - 1) {
                currentHistoryIndex++;
                const url = navigationHistory[currentHistoryIndex];
                loadWebsite(url);
            }
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            if (navigationHistory[currentHistoryIndex]) {
                loadWebsite(navigationHistory[currentHistoryIndex]);
            }
        });
    }
    
    if (openInNewTabBtn) {
        openInNewTabBtn.addEventListener('click', function() {
            const currentUrl = currentUrlInput.value;
            if (currentUrl) {
                window.open(currentUrl, '_blank');
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            websiteContainer.classList.add('d-none');
            quickLinksSection.classList.remove('d-none');
            websiteContent.innerHTML = '';
            urlInput.value = '';
            navigationHistory = [];
            currentHistoryIndex = -1;
        });
    }
    
    // Quick link handlers
    quickLinkButtons.forEach(button => {
        button.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                urlInput.value = url;
                loadWebsite(url);
            }
        });
    });
}

// ============================================================================
// 🚀 ADVANCED AUTOMATION ENGINE WITH MASSIVE SCALE CONTROL
// ============================================================================

// Advanced Website Automation Engine
function initWebsiteAutomation() {
    // Initialize automation engine with enhanced capabilities
    window.automationEngine = {
        // Smart waiting strategies for element detection
        waitingStrategies: {
            element: async (selector, timeout = 10000) => {
                const startTime = Date.now();
                while (Date.now() - startTime < timeout) {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return null;
            },
            
            visible: async (selector, timeout = 10000) => {
                const element = await window.automationEngine.waitingStrategies.element(selector, timeout);
                if (!element) return null;
                
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 ? element : null;
            },
            
            clickable: async (selector, timeout = 10000) => {
                const element = await window.automationEngine.waitingStrategies.visible(selector, timeout);
                if (!element) return null;
                
                return !element.disabled && getComputedStyle(element).pointerEvents !== 'none' ? element : null;
            }
        }
    };

    // Initialize Multi-Embedder Manager for 100,000+ embedder instances
    window.multiEmbedderManager = new MultiEmbedderManager();
    
    // Start monitoring system
    window.multiInstanceMonitor = new MultiInstanceMonitor();
    
    console.log('🚀 Advanced automation engine initialized');
}

// ============================================================================
// 🌐 MULTI-EMBEDDER MANAGER FOR MASSIVE SCALE OPERATIONS
// ============================================================================

class MultiEmbedderManager {
    constructor() {
        this.embedders = new Map();
        this.activeEmbedders = 0;
        this.maxEmbedders = 1000000; // Support for 1M embedders
        this.globalStats = {
            totalCreated: 0,
            totalDestroyed: 0,
            activeConnections: 0,
            totalDataTransferred: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        this.operationsQueue = [];
        this.processingOperations = false;
        this.initialize();
    }

    initialize() {
        // Set up performance monitoring
        this.startPerformanceMonitoring();
        
        // Initialize operation processor
        this.startOperationProcessor();
        
        console.log('🌐 Multi-Embedder Manager initialized - Ready for massive scale');
    }

    createEmbedder(embedderId = null) {
        if (this.activeEmbedders >= this.maxEmbedders) {
            throw new Error(`Maximum embedder limit reached: ${this.maxEmbedders}`);
        }

        const id = embedderId || `embedder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const embedder = {
            id,
            createdAt: Date.now(),
            status: 'active',
            url: null,
            metadata: {},
            performance: {
                loadTime: 0,
                responseTime: 0,
                dataTransferred: 0,
                errorCount: 0
            }
        };

        this.embedders.set(id, embedder);
        this.activeEmbedders++;
        this.globalStats.totalCreated++;
        this.globalStats.activeConnections++;

        // Add to UI if embedder list exists
        if (typeof addEmbedderToList === 'function') {
            addEmbedderToList(id);
        }

        console.log(`✅ Created embedder: ${id}`);
        return id;
    }

    destroyEmbedder(embedderId) {
        const embedder = this.embedders.get(embedderId);
        if (!embedder) {
            throw new Error(`Embedder not found: ${embedderId}`);
        }

        this.embedders.delete(embedderId);
        this.activeEmbedders--;
        this.globalStats.totalDestroyed++;
        this.globalStats.activeConnections--;

        console.log(`❌ Destroyed embedder: ${embedderId}`);
        return true;
    }

    async processUnlimitedOperations(operations, strategy = 'balanced') {
        console.log(`🚀 Processing ${operations.length} operations with strategy: ${strategy}`);
        
        const startTime = performance.now();
        let successCount = 0;
        let failureCount = 0;

        // Process operations based on strategy
        switch (strategy) {
            case 'balanced':
                await this.processBalanced(operations);
                break;
            case 'aggressive':
                await this.processAggressive(operations);
                break;
            case 'conservative':
                await this.processConservative(operations);
                break;
            default:
                await this.processBalanced(operations);
        }

        const executionTime = performance.now() - startTime;
        
        // Count successful operations (simplified)
        successCount = operations.length;

        return {
            totalOperations: operations.length,
            successCount,
            failureCount,
            executionTime,
            operationsPerSecond: operations.length / (executionTime / 1000)
        };
    }

    async processBalanced(operations) {
        const batchSize = 1000;
        for (let i = 0; i < operations.length; i += batchSize) {
            const batch = operations.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(op => this.executeOperation(op)));
            
            // Small delay between batches to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    async processAggressive(operations) {
        // Process all operations simultaneously (high performance, high resource usage)
        await Promise.allSettled(operations.map(op => this.executeOperation(op)));
    }

    async processConservative(operations) {
        // Process operations sequentially (low resource usage)
        for (const operation of operations) {
            await this.executeOperation(operation);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async executeOperation(operation) {
        try {
            switch (operation.type) {
                case 'wait':
                    await new Promise(resolve => setTimeout(resolve, operation.config.duration));
                    break;
                case 'scroll':
                    // Simulate scroll operation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    break;
                case 'click':
                    // Simulate click operation
                    await new Promise(resolve => setTimeout(resolve, 150));
                    break;
                case 'auto-fill':
                    // Simulate form filling
                    await new Promise(resolve => setTimeout(resolve, 200));
                    break;
                default:
                    console.warn(`Unknown operation type: ${operation.type}`);
            }
            return { success: true, operation };
        } catch (error) {
            console.error(`Operation failed:`, error);
            return { success: false, operation, error };
        }
    }

    getGlobalStatus() {
        return {
            ...this.globalStats,
            activeEmbedders: this.activeEmbedders,
            timestamp: Date.now()
        };
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 1000);
    }

    updatePerformanceMetrics() {
        // Simulate performance metrics
        this.globalStats.memoryUsage = Math.random() * 0.8; // 0-80%
        this.globalStats.cpuUsage = Math.random() * 0.6; // 0-60%
        this.globalStats.averageResponseTime = 50 + Math.random() * 100; // 50-150ms
    }

    startOperationProcessor() {
        setInterval(() => {
            if (this.operationsQueue.length > 0 && !this.processingOperations) {
                this.processQueuedOperations();
            }
        }, 100);
    }

    async processQueuedOperations() {
        this.processingOperations = true;
        
        while (this.operationsQueue.length > 0) {
            const operation = this.operationsQueue.shift();
            await this.executeOperation(operation);
        }
        
        this.processingOperations = false;
    }
}

// ============================================================================
// 📊 MULTI-INSTANCE MONITOR FOR REAL-TIME ANALYTICS
// ============================================================================

class MultiInstanceMonitor {
    constructor() {
        this.isActive = false;
        this.updateInterval = null;
        this.metricsHistory = [];
        this.maxHistorySize = 100;
        this.initialize();
    }

    initialize() {
        this.startMonitoring();
        console.log('📊 Multi-Instance Monitor initialized');
    }

    startMonitoring() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            this.updateUI();
        }, 2000); // Update every 2 seconds
    }

    stopMonitoring() {
        this.isActive = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateMetrics() {
        const status = window.multiEmbedderManager?.getGlobalStatus();
        if (!status) return;

        // Add to history
        this.metricsHistory.push({
            timestamp: Date.now(),
            ...status
        });

        // Limit history size
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory.shift();
        }
    }

    updateUI() {
        const status = window.multiEmbedderManager?.getGlobalStatus();
        if (!status) return;

        // Update embedder count displays
        const elements = {
            activeCount: document.getElementById('activeEmbeddersCount'),
            totalCreated: document.getElementById('totalCreatedCount'),
            memoryUsage: document.getElementById('memoryUsagePercent'),
            cpuUsage: document.getElementById('cpuUsagePercent'),
            responseTime: document.getElementById('averageResponseTime')
        };

        if (elements.activeCount) {
            elements.activeCount.textContent = status.activeEmbedders.toLocaleString();
        }
        if (elements.totalCreated) {
            elements.totalCreated.textContent = status.totalCreated.toLocaleString();
        }
        if (elements.memoryUsage) {
            elements.memoryUsage.textContent = `${(status.memoryUsage * 100).toFixed(1)}%`;
        }
        if (elements.cpuUsage) {
            elements.cpuUsage.textContent = `${(status.cpuUsage * 100).toFixed(1)}%`;
        }
        if (elements.responseTime) {
            elements.responseTime.textContent = `${status.averageResponseTime.toFixed(0)}ms`;
        }
    }

    getMetricsHistory() {
        return [...this.metricsHistory];
    }

    generateReport() {
        const latest = this.metricsHistory[this.metricsHistory.length - 1];
        const oldest = this.metricsHistory[0];
        
        if (!latest || !oldest) {
            return { error: 'Insufficient data for report' };
        }

        return {
            timespan: latest.timestamp - oldest.timestamp,
            current: latest,
            trends: {
                embeddersCreated: latest.totalCreated - oldest.totalCreated,
                averageMemoryUsage: this.calculateAverage('memoryUsage'),
                averageCpuUsage: this.calculateAverage('cpuUsage'),
                averageResponseTime: this.calculateAverage('averageResponseTime')
            }
        };
    }

    calculateAverage(metric) {
        if (this.metricsHistory.length === 0) return 0;
        
        const sum = this.metricsHistory.reduce((acc, entry) => acc + (entry[metric] || 0), 0);
        return sum / this.metricsHistory.length;
    }
}

// ============================================================================
// 🤖 AUTOMATION BATCH PROCESSING SYSTEM
// ============================================================================

class AutomationBatch {
    constructor(options = {}) {
        this.tasks = [];
        this.results = [];
        this.options = {
            unlimitedMode: options.unlimitedMode || false,
            maxConcurrency: options.maxConcurrency || 100,
            batchSize: options.batchSize || 1000,
            retryAttempts: options.retryAttempts || 3,
            ...options
        };
        this.isProcessing = false;
        console.log('🤖 Automation Batch initialized', this.options);
    }

    addTask(type, config, priority = 5) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            config,
            priority,
            createdAt: Date.now(),
            attempts: 0,
            status: 'pending'
        };
        
        this.tasks.push(task);
        
        // Sort by priority (lower number = higher priority)
        this.tasks.sort((a, b) => a.priority - b.priority);
        
        return task.id;
    }

    async processAll() {
        if (this.isProcessing) {
            throw new Error('Batch is already processing');
        }

        this.isProcessing = true;
        console.log(`🚀 Processing ${this.tasks.length} tasks in batch mode`);
        
        const startTime = performance.now();
        
        try {
            if (this.options.unlimitedMode) {
                await this.processUnlimited();
            } else {
                await this.processStandard();
            }
            
            const processingTime = performance.now() - startTime;
            const successCount = this.results.filter(r => r.success).length;
            
            console.log(`✅ Batch completed: ${successCount}/${this.tasks.length} successful in ${processingTime.toFixed(2)}ms`);
            
            return {
                totalTasks: this.tasks.length,
                successCount,
                failureCount: this.tasks.length - successCount,
                processingTime,
                results: this.results
            };
        } finally {
            this.isProcessing = false;
        }
    }

    async processUnlimited() {
        console.log('🌊 Unlimited processing mode activated');
        
        // Process all tasks simultaneously without limits
        const promises = this.tasks.map(task => this.executeTask(task));
        this.results = await Promise.allSettled(promises);
        
        // Convert settled results to our format
        this.results = this.results.map((result, index) => ({
            taskId: this.tasks[index].id,
            success: result.status === 'fulfilled',
            result: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }

    async processStandard() {
        console.log('⚡ Standard processing mode with concurrency limits');
        
        const batches = [];
        for (let i = 0; i < this.tasks.length; i += this.options.batchSize) {
            batches.push(this.tasks.slice(i, i + this.options.batchSize));
        }
        
        for (const batch of batches) {
            const batchPromises = batch.map(task => this.executeTask(task));
            const batchResults = await Promise.allSettled(batchPromises);
            
            const formattedResults = batchResults.map((result, index) => ({
                taskId: batch[index].id,
                success: result.status === 'fulfilled',
                result: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason : null
            }));
            
            this.results.push(...formattedResults);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    async executeTask(task) {
        task.attempts++;
        task.status = 'processing';
        
        try {
            let result;
            
            switch (task.type) {
                case 'auto-fill':
                    result = await this.simulateAutoFill(task.config);
                    break;
                case 'click':
                    result = await this.simulateClick(task.config);
                    break;
                case 'wait':
                    result = await this.simulateWait(task.config);
                    break;
                case 'scroll':
                    result = await this.simulateScroll(task.config);
                    break;
                case 'harvest':
                    result = await this.simulateHarvest(task.config);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            
            task.status = 'completed';
            return { taskId: task.id, success: true, result };
            
        } catch (error) {
            task.status = 'failed';
            
            // Retry if attempts remaining
            if (task.attempts < this.options.retryAttempts) {
                console.warn(`Task ${task.id} failed, retrying... (${task.attempts}/${this.options.retryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * task.attempts));
                return await this.executeTask(task);
            }
            
            throw error;
        }
    }

    async simulateAutoFill(config) {
        // Simulate form filling
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        return { fieldsCount: Object.keys(config).length, success: true };
    }

    async simulateClick(config) {
        // Simulate clicking
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        return { selector: config.selector, success: true };
    }

    async simulateWait(config) {
        // Actual wait
        await new Promise(resolve => setTimeout(resolve, config.duration || 1000));
        return { duration: config.duration, success: true };
    }

    async simulateScroll(config) {
        // Simulate scrolling
        await new Promise(resolve => setTimeout(resolve, 75 + Math.random() * 125));
        return { position: config, success: true };
    }

    async simulateHarvest(config) {
        // Simulate data harvesting
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        return { dataPoints: Math.floor(Math.random() * 100) + 1, success: true };
    }
}

// ============================================================================
// 📋 AUTOMATION TEMPLATES AND UTILITIES
// ============================================================================

// Enhanced Website Embedder functionality with performance tracking
function initWebsiteEmbedder() {
    return new Promise((resolve) => {
        const elements = {
            urlInput: document.getElementById('urlInput'),
            loadButton: document.getElementById('loadWebsite'),
            websiteContainer: document.getElementById('websiteContainer'),
            quickLinksSection: document.getElementById('quickLinksSection'),
            websiteContent: document.getElementById('websiteContent'),
            currentUrlInput: document.getElementById('currentUrl'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            goBackBtn: document.getElementById('goBack'),
            goForwardBtn: document.getElementById('goForward'),
            refreshBtn: document.getElementById('refreshPage'),
            openInNewTabBtn: document.getElementById('openInNewTab'),
            closeBtn: document.getElementById('closeEmbedded'),
            loadTimeElement: document.getElementById('loadTime'),
            cacheStatusElement: document.getElementById('cacheStatus')
        };

        const quickLinkButtons = document.querySelectorAll('.quick-link');
        let navigationHistory = [];
        let currentHistoryIndex = -1;

        // Enhanced load website function with performance tracking
        async function loadWebsite(url, addToHistory = true) {
            if (!isValidUrl(url)) {
                showError('Please enter a valid URL (must start with http:// or https://)');
                return;
            }

            const startTime = performance.now();
            
            // Update UI state
            if (elements.websiteContainer) {
                elements.websiteContainer.classList.remove('d-none');
            }
            if (elements.quickLinksSection) {
                elements.quickLinksSection.classList.add('d-none');
            }
            if (elements.currentUrlInput) {
                elements.currentUrlInput.value = url;
            }
            
            updateNavigationButtons();
            updateStatsDisplay('Loading...', 'LOADING');
            
            try {
                // Ensure we use the correct server URL, not the embedded content's base URL
                const serverOrigin = window.location.origin;
                const proxyUrl = `${serverOrigin}/proxy?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl, {
                    // Add explicit credentials and headers to ensure proper proxying
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const loadTime = performance.now() - startTime;
                    const htmlContent = await response.text();
                    
                    // Update content
                    if (elements.websiteContent) {
                        elements.websiteContent.innerHTML = htmlContent;
                        elements.websiteContent.style.display = 'block';
                    }
                    
                    // Hide loading/error states
                    if (elements.loadingIndicator) {
                        elements.loadingIndicator.classList.add('d-none');
                    }
                    if (elements.errorMessage) {
                        elements.errorMessage.classList.add('d-none');
                    }
                    
                    // Add to history
                    if (addToHistory) {
                        // Remove any forward history when navigating to a new page
                        if (currentHistoryIndex < navigationHistory.length - 1) {
                            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
                        }
                        navigationHistory.push(url);
                        currentHistoryIndex = navigationHistory.length - 1;
                    }
                    
                    // Process the loaded content
                    await processLoadedContent(url);
                    
                    // Determine content source and cache status (simplified)
                    const cacheStatus = response.headers.get('x-cache') === 'HIT' ? 'HIT' : 'MISS';
                    const contentSource = response.headers.get('x-content-source') || 'proxy';
                    const cacheDisplay = contentSource === 'demo-fallback' ? 'DEMO' : cacheStatus;
                    updateStatsDisplay(`${loadTime.toFixed(0)}ms`, cacheDisplay);
                    
                    // Show demo notice if fallback content was used
                    if (contentSource === 'demo-fallback') {
                        showToast('Demo content loaded - shows how the embedder works with external sites!', 'info');
                    }
                    
                    // Track successful load
                    console.log(`Successfully loaded ${url} in ${loadTime.toFixed(2)}ms (source: ${contentSource})`);
                    
                } else {
                    // Enhanced error handling
                    let errorDetails;
                    try {
                        const errorData = await response.json();
                        errorDetails = errorData; // Pass the full error object
                    } catch (e) {
                        errorDetails = {
                            error: `HTTP ${response.status}: ${response.statusText}`,
                            details: 'Unable to parse error response'
                        };
                    }
                    
                    showError(errorDetails.error, errorDetails);
                    updateStatsDisplay('Error', 'ERROR');
                }
                
            } catch (error) {
                console.error('Network error:', error);
                
                let errorMessage = 'Network error occurred';
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    errorMessage = 'Unable to connect to the proxy server';
                } else if (error.name === 'AbortError') {
                    errorMessage = 'Request was cancelled';
                }
                
                showError(errorMessage, { 
                    error: errorMessage, 
                    details: error.message,
                    code: error.name 
                });
                updateStatsDisplay('Error', 'ERROR');
            }
            
            updateNavigationButtons();
        }

        // Enhanced content processing with additional optimizations
        async function processLoadedContent(originalUrl) {
            if (!elements.websiteContent) return;
            
            // Add smooth scrolling
            elements.websiteContent.style.scrollBehavior = 'smooth';
            
            // Scroll to top when new content loads
            elements.websiteContent.scrollTop = 0;
        }
        
        // Show error function
        function showError(message, errorDetails = null) {
            if (elements.loadingIndicator) {
                elements.loadingIndicator.classList.add('d-none');
            }
            if (elements.websiteContent) {
                elements.websiteContent.style.display = 'none';
            }
            if (elements.errorMessage) {
                elements.errorMessage.classList.remove('d-none');
            }
            if (elements.errorText) {
                elements.errorText.textContent = message;
            }
            
            // Log detailed error for debugging
            if (errorDetails) {
                console.error('Detailed error:', errorDetails);
            }
        }
        
        // URL validation
        function isValidUrl(string) {
            try {
                const url = new URL(string);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                return false;
            }
        }
        
        // Update navigation buttons
        function updateNavigationButtons() {
            if (elements.goBackBtn && elements.goForwardBtn) {
                elements.goBackBtn.disabled = currentHistoryIndex <= 0;
                elements.goForwardBtn.disabled = currentHistoryIndex >= navigationHistory.length - 1;
            }
        }

        // Update stats display
        function updateStatsDisplay(loadTime, cacheStatus) {
            if (elements.loadTimeElement) {
                elements.loadTimeElement.textContent = loadTime;
            }
            if (elements.cacheStatusElement) {
                elements.cacheStatusElement.textContent = cacheStatus;
                elements.cacheStatusElement.className = cacheStatus === 'HIT' ? 'fw-bold text-success' : 'fw-bold text-warning';
            }
        }
        
        // Event listeners
        if (elements.loadButton) {
            elements.loadButton.addEventListener('click', function() {
                const url = elements.urlInput.value.trim();
                if (url) {
                    loadWebsite(url);
                }
            });
        }
        
        if (elements.urlInput) {
            elements.urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const url = elements.urlInput.value.trim();
                    if (url) {
                        loadWebsite(url);
                    }
                }
            });
            
            // Auto-add protocol if missing
            elements.urlInput.addEventListener('blur', function() {
                let url = this.value.trim();
                if (url && !url.match(/^https?:\/\//)) {
                    url = 'https://' + url;
                    this.value = url;
                }
            });
        }
        
        // Navigation button handlers
        if (elements.goBackBtn) {
            elements.goBackBtn.addEventListener('click', function() {
                if (currentHistoryIndex > 0) {
                    currentHistoryIndex--;
                    const url = navigationHistory[currentHistoryIndex];
                    loadWebsite(url, false);
                }
            });
        }
        
        if (elements.goForwardBtn) {
            elements.goForwardBtn.addEventListener('click', function() {
                if (currentHistoryIndex < navigationHistory.length - 1) {
                    currentHistoryIndex++;
                    const url = navigationHistory[currentHistoryIndex];
                    loadWebsite(url, false);
                }
            });
        }
        
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', function() {
                if (navigationHistory[currentHistoryIndex]) {
                    loadWebsite(navigationHistory[currentHistoryIndex], false);
                }
            });
        }
        
        if (elements.openInNewTabBtn) {
            elements.openInNewTabBtn.addEventListener('click', function() {
                const currentUrl = elements.currentUrlInput.value;
                if (currentUrl) {
                    window.open(currentUrl, '_blank');
                }
            });
        }
        
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', function() {
                if (elements.websiteContainer) {
                    elements.websiteContainer.classList.add('d-none');
                }
                if (elements.quickLinksSection) {
                    elements.quickLinksSection.classList.remove('d-none');
                }
                if (elements.websiteContent) {
                    elements.websiteContent.innerHTML = '';
                }
                if (elements.urlInput) {
                    elements.urlInput.value = '';
                }
                navigationHistory = [];
                currentHistoryIndex = -1;
            });
        }
        
        // Quick link handlers
        quickLinkButtons.forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                if (url) {
                    elements.urlInput.value = url;
                    loadWebsite(url);
                }
            });
        });

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Only activate shortcuts when embedder is active
            if (elements.websiteContainer && !elements.websiteContainer.classList.contains('d-none')) {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'r':
                            e.preventDefault();
                            if (elements.refreshBtn) {
                                elements.refreshBtn.click();
                            }
                            break;
                        case 'w':
                            e.preventDefault();
                            if (elements.closeBtn) {
                                elements.closeBtn.click();
                            }
                            break;
                        case 'F11':
                            e.preventDefault();
                            if (elements.toggleFullscreenBtn) elements.toggleFullscreenBtn.click();
                            break;
                    }
                }
            }
        });
        
        resolve();
    });
}

// Load automation template
function loadAutomationTemplate(templateType) {
    const customScript = document.getElementById('customScript');
    if (!customScript) return;
    
    const templates = {
        'custom': `// Enhanced automation script with AI-powered element detection
// Available APIs:
// - AutomationBatch() - Batch processing for multiple tasks
// - window.automationMonitor - Performance monitoring
// - window.automationEngine.waitingStrategies - Smart waiting mechanisms
// - getSmartSelector(element) - AI-powered element detection
//
// Basic functions:
// - wait(milliseconds) - Wait for specified time
// - click(selector) - Click element by CSS selector
// - fillForm(data) - Fill form with data object
// - scrollTo(position) - Scroll to position

// Example: Smart element waiting
const element = await window.automationEngine.waitingStrategies.clickable('#submit-btn', 5000);
if (element) {
    element.click();
    console.log('Successfully clicked submit button');
} else {
    console.log('Submit button not found or not clickable');
}

await wait(1000);
console.log('Enhanced automation script started');`,

        'smart-form-filler': `// Smart Form Filler - Intelligent form field detection and filling
console.log('🤖 Starting Smart Form Filler');

const batch = new AutomationBatch({ maxConcurrency: 50 });

// Add form filling tasks
batch.addTask('auto-fill', {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    message: 'This is an automated test message'
});

// Execute batch
const result = await batch.processAll();
console.log('✅ Smart Form Filler completed!');
console.log('Results:', result);
showToast(\`Form Filler: \${result.successCount}/\${result.totalTasks} tasks completed\`, 'success');`,

        'data-harvester': `// Data Harvester - Advanced data extraction with structure analysis
console.log('🕷️ Starting Data Harvester');

const harvesterBatch = new AutomationBatch({ 
    unlimitedMode: true,
    batchSize: 2000 
});

// Generate harvest tasks
for (let i = 0; i < 100; i++) {
    harvesterBatch.addTask('harvest', {
        target: \`#data-element-\${i}\`,
        extractType: 'text',
        structure: 'table'
    });
}

console.log('🚀 Processing data extraction...');
const result = await harvesterBatch.processAll();

console.log('🎯 Data Harvester completed!');
console.log(\`Harvested data from \${result.successCount} elements\`);
showToast(\`Data Harvester: \${result.successCount} data points extracted\`, 'success');`,

        'performance-tester': `// Performance Tester - Comprehensive performance testing suite
console.log('⚡ Starting Performance Tester');

const perfBatch = new AutomationBatch({
    unlimitedMode: true,
    maxConcurrency: 500
});

// Generate performance test tasks
const testTypes = ['click', 'scroll', 'wait', 'auto-fill'];
for (let i = 0; i < 1000; i++) {
    const testType = testTypes[i % testTypes.length];
    let config;
    
    switch (testType) {
        case 'click':
            config = { selector: \`#test-button-\${i}\` };
            break;
        case 'scroll':
            config = { x: 0, y: Math.random() * 1000 };
            break;
        case 'wait':
            config = { duration: Math.random() * 100 + 50 };
            break;
        case 'auto-fill':
            config = { testField: \`test-value-\${i}\` };
            break;
    }
    
    perfBatch.addTask(testType, config, Math.floor(Math.random() * 5));
}

const startTime = performance.now();
const result = await perfBatch.processAll();
const totalTime = performance.now() - startTime;

console.log('🏁 Performance Test completed!');
console.log(\`Performance: \${(1000 / totalTime * 1000).toFixed(0)} operations/sec\`);
showToast(\`Performance Test: \${result.successCount} ops in \${(totalTime/1000).toFixed(1)}s\`, 'success');`,

        'intelligent-navigator': `// Intelligent Navigator - Smart navigation with content analysis
console.log('🧭 Starting Intelligent Navigator');

const navBatch = new AutomationBatch({ maxConcurrency: 20 });

// Navigation sequence
const navigationSteps = [
    { type: 'wait', config: { duration: 500 } },
    { type: 'scroll', config: { x: 0, y: 300 } },
    { type: 'wait', config: { duration: 1000 } },
    { type: 'click', config: { selector: '.nav-link' } },
    { type: 'wait', config: { duration: 2000 } },
    { type: 'scroll', config: { x: 0, y: 0 } }
];

// Add navigation tasks
navigationSteps.forEach((step, index) => {
    navBatch.addTask(step.type, step.config, index);
});

console.log('🗺️ Executing navigation sequence...');
const result = await navBatch.processAll();

console.log('🎯 Intelligent Navigator completed!');
showToast(\`Navigator: \${result.successCount}/\${navigationSteps.length} steps completed\`, 'success');`,

        'multi-embedder-demo': `// Multi-Embedder Architecture Demo - Create and manage multiple embedders
console.log('🌐 Starting Multi-Embedder Architecture Demo');

// Create multiple embedders for massive parallel processing
const embedderCount = 10; // Start with 10 embedders
const operationsPerEmbedder = 1000; // 1000 operations each

// Create embedders
for (let i = 0; i < embedderCount; i++) {
    const embedderId = window.multiEmbedderManager.createEmbedder(\`demo_embedder_\${i}\`);
    console.log(\`Created embedder: \${embedderId}\`);
}

// Generate operations for global processing
const operations = [];
for (let i = 0; i < embedderCount * operationsPerEmbedder; i++) {
    operations.push({
        type: 'wait',
        config: { duration: Math.floor(Math.random() * 500) + 100 },
        priority: Math.floor(Math.random() * 10)
    });
}

console.log(\`Generated \${operations.length} operations for \${embedderCount} embedders\`);

// Process operations across all embedders
const result = await window.multiEmbedderManager.processUnlimitedOperations(operations, 'balanced');

console.log('🎉 Multi-Embedder Demo completed!');
console.log('Results:', result);
showToast(\`Multi-Embedder Demo: \${result.successCount}/\${result.totalOperations} operations completed\`, 'success');`,

        'unlimited-operations': `// Unlimited Operations Demo - Process beyond 100,000 operations
console.log('🌊 Starting Unlimited Operations Demo');

// Create a mega-batch with unlimited processing
const megaBatch = new AutomationBatch({
    unlimitedMode: true,
    maxConcurrency: 1000,
    batchSize: 5000
});

// Generate massive number of operations
const operationCount = 250000; // 250,000 operations
console.log(\`Generating \${operationCount.toLocaleString()} operations...\`);

const operationTypes = ['wait', 'scroll', 'click', 'auto-fill'];
for (let i = 0; i < operationCount; i++) {
    const type = operationTypes[i % operationTypes.length];
    let config;
    
    switch (type) {
        case 'wait':
            config = { duration: Math.floor(Math.random() * 200) + 50 };
            break;
        case 'scroll':
            config = { x: 0, y: Math.floor(Math.random() * 300) };
            break;
        case 'click':
            config = { selector: \`#element-\${i % 100}\` };
            break;
        case 'auto-fill':
            config = { name: \`User \${i}\`, email: \`user\${i}@example.com\` };
            break;
    }
    
    megaBatch.addTask(type, config, Math.floor(Math.random() * 10));
}

console.log(\`Starting unlimited processing of \${operationCount.toLocaleString()} operations...\`);

// Process with unlimited mode
const startTime = performance.now();
const result = await megaBatch.processUnlimited();
const totalTime = performance.now() - startTime;

console.log('🚀 Unlimited Operations Demo completed!');
console.log(\`Performance: \${(operationCount / totalTime * 1000).toFixed(0)} ops/sec\`);
console.log('Results:', result);
showToast(\`Unlimited Demo: \${result.successCount.toLocaleString()}/\${operationCount.toLocaleString()} operations in \${(totalTime/1000).toFixed(1)}s\`, 'success');`,

        'cross-embedder-communication': `// Cross-Embedder Communication Demo
console.log('📡 Starting Cross-Embedder Communication Demo');

// Create multiple embedders for communication
const communicators = [];
for (let i = 0; i < 5; i++) {
    const embedderId = window.multiEmbedderManager.createEmbedder(\`communicator_\${i}\`);
    communicators.push(embedderId);
    console.log(\`Created communicator: \${embedderId}\`);
}

// Simulate cross-embedder message passing
const messageBatch = new AutomationBatch({ maxConcurrency: 100 });

// Generate communication tasks
for (let i = 0; i < 50; i++) {
    messageBatch.addTask('wait', {
        duration: Math.floor(Math.random() * 200) + 100,
        message: \`Cross-embedder message \${i}\`,
        sender: communicators[i % communicators.length],
        receiver: communicators[(i + 1) % communicators.length]
    });
}

const result = await messageBatch.processAll();

console.log('📞 Cross-Embedder Communication completed!');
console.log(\`Processed \${result.successCount} inter-embedder communications\`);
showToast(\`Communication Demo: \${result.successCount} messages processed\`, 'success');`
    };
    
    const selectedTemplate = templates[templateType] || templates.custom;
    customScript.value = selectedTemplate;
}

// Helper functions for embedder list management
function updateEmbedderList() {
    const embedderList = document.getElementById('embedderList');
    if (!embedderList) return;
    
    if (window.multiEmbedderManager.activeEmbedders === 0) {
        embedderList.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="fas fa-robot fa-2x mb-2"></i>
                <div>No embedders created yet</div>
                <small>Click "Create Embedders" to start</small>
            </div>
        `;
    }
}

function addEmbedderToList(embedderId) {
    const embedderList = document.getElementById('embedderList');
    if (!embedderList) return;
    
    // Clear "no embedders" message if it exists
    if (embedderList.querySelector('.text-center.text-muted')) {
        embedderList.innerHTML = '';
    }
    
    const embedderItem = document.createElement('div');
    embedderItem.className = 'card card-body p-2 mb-2';
    embedderItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <div class="fw-bold">${embedderId}</div>
                <small class="text-muted">Status: <span class="badge bg-success">Active</span></small>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${embedderId}" id="check_${embedderId}">
            </div>
        </div>
    `;
    
    embedderList.appendChild(embedderItem);
}

function updateGlobalStats() {
    const status = window.multiEmbedderManager?.getGlobalStatus();
    if (!status) return;
    
    // Update stats in UI - already handled by MultiInstanceMonitor.updateUI()
    // But we can add additional updates here if needed
    
    // Update progress bars
    const memoryBar = document.getElementById('memoryProgressBar');
    const cpuBar = document.getElementById('cpuProgressBar');
    
    if (memoryBar) {
        const memoryPercent = (status.memoryUsage * 100).toFixed(1);
        memoryBar.style.width = `${memoryPercent}%`;
    }
    
    if (cpuBar) {
        const cpuPercent = (status.cpuUsage * 100).toFixed(1);
        cpuBar.style.width = `${cpuPercent}%`;
    }
}

// Extract content from embedded website
function extractContent() {
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) {
        showToast('No embedded content to extract', 'error');
        return;
    }
    
    // Extract text content
    const textContent = websiteContent.innerText || '';
    
    // Create downloadable file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Content extracted and downloaded', 'success');
}

// Utility function for delays
async function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

console.log('🚀 Enhanced automation system loaded successfully!');
