// Enhanced Main JavaScript for 42Web.io with Performance Optimizations

// Performance monitoring
const performanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
};

document.addEventListener('DOMContentLoaded', function() {
    const startTime = performance.now();
    
    // Initialize components with performance tracking
    Promise.all([
        initSmoothScrolling(),
        initFormValidation(),
        initAnimations(),
        initNavbar(),
        initWebsiteEmbedder(),
        initWebsiteAutomation(),
        initImageLazyLoading(),
        initSearchFunctionality(),
        initThemeToggle()
    ]).then(() => {
        performanceMetrics.loadTime = performance.now() - startTime;
        console.log(`Components loaded in ${performanceMetrics.loadTime.toFixed(2)}ms`);
    });
});

// Enhanced smooth scrolling with performance optimization
function initSmoothScrolling() {
    return new Promise((resolve) => {
        const links = document.querySelectorAll('a[href^="#"]');
        
        // Use passive event listeners for better performance
        links.forEach(link => {
            link.addEventListener('click', handleSmoothScroll, { passive: false });
        });
        
        resolve();
    });
}

function handleSmoothScroll(e) {
    const href = this.getAttribute('href');
    
    if (href === '#') return;
    
    e.preventDefault();
    
    const target = document.querySelector(href);
    if (target) {
        const offsetTop = target.offsetTop - 80;
        
        // Use requestAnimationFrame for smooth performance
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        } else {
            // Fallback for older browsers
            smoothScrollTo(offsetTop, 800);
        }
    }
}

// Custom smooth scroll fallback
function smoothScrollTo(targetPosition, duration) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Enhanced form validation with real-time feedback
function initFormValidation() {
    return new Promise((resolve) => {
        const contactForm = document.querySelector('form[action="/contact"]');
        
        if (contactForm) {
            const fields = {
                name: contactForm.querySelector('#name'),
                email: contactForm.querySelector('#email'),
                message: contactForm.querySelector('#message')
            };
            
            // Real-time validation
            Object.values(fields).forEach(field => {
                if (field) {
                    field.addEventListener('input', debounce(() => validateField(field), 300));
                    field.addEventListener('blur', () => validateField(field));
                }
            });
            
            contactForm.addEventListener('submit', function(e) {
                const isValid = validateForm(fields);
                
                if (!isValid) {
                    e.preventDefault();
                    return false;
                }
                
                // Show enhanced loading state
                showFormLoading(this);
            });
        }
        
        resolve();
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    let isValid = true;
    let message = '';
    
    clearFieldValidation(field);
    
    switch (fieldName) {
        case 'name':
            if (!value) {
                isValid = false;
                message = 'Please enter your name';
            } else if (value.length < 2) {
                isValid = false;
                message = 'Name must be at least 2 characters long';
            }
            break;
            
        case 'email':
            if (!value) {
                isValid = false;
                message = 'Please enter your email';
            } else if (!isValidEmail(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
            break;
            
        case 'message':
            if (!value) {
                isValid = false;
                message = 'Please enter your message';
            } else if (value.length < 10) {
                isValid = false;
                message = 'Message must be at least 10 characters long';
            } else if (value.length > 5000) {
                isValid = false;
                message = 'Message is too long (maximum 5000 characters)';
            }
            break;
    }
    
    if (isValid) {
        showFieldSuccess(field);
    } else {
        showFieldError(field, message);
    }
    
    return isValid;
}

// Validate entire form
function validateForm(fields) {
    let isValid = true;
    
    Object.values(fields).forEach(field => {
        if (field && !validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Show enhanced loading state
function showFormLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Sending...
    `;
    submitBtn.disabled = true;
    
    // Store original state for potential restoration
    submitBtn.dataset.originalText = originalText;
    
    // Auto-restore after timeout (in case of network issues)
    setTimeout(() => {
        if (submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
            submitBtn.disabled = false;
            delete submitBtn.dataset.originalText;
        }
    }, 10000);
}
// Enhanced field validation display
function showFieldError(field, message) {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
    
    // Remove existing feedback
    clearFieldFeedback(field);
    
    // Add new error feedback
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback d-block';
    feedback.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i>${message}`;
    field.parentNode.appendChild(feedback);
}

function showFieldSuccess(field) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    // Remove existing feedback
    clearFieldFeedback(field);
    
    // Add success feedback
    const feedback = document.createElement('div');
    feedback.className = 'valid-feedback d-block';
    feedback.innerHTML = '<i class="fas fa-check-circle me-1"></i>Looks good!';
    field.parentNode.appendChild(feedback);
}

function clearFieldValidation(field) {
    field.classList.remove('is-invalid', 'is-valid');
    clearFieldFeedback(field);
}

function clearFieldFeedback(field) {
    const existingFeedback = field.parentNode.querySelectorAll('.invalid-feedback, .valid-feedback');
    existingFeedback.forEach(feedback => feedback.remove());
}

// Clear validation states (legacy function)
function clearValidationStates(fields) {
    fields.forEach(field => {
        if (field) clearFieldValidation(field);
    });
}

// Enhanced email validation with more comprehensive checks
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Basic format check
    if (!emailRegex.test(email)) {
        return false;
    }
    
    // Additional checks
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [local, domain] = parts;
    
    // Local part checks
    if (local.length > 64 || local.length === 0) return false;
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (local.includes('..')) return false;
    
    // Domain part checks
    if (domain.length > 255 || domain.length === 0) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;
    
    return true;
}

// Enhanced image lazy loading
function initImageLazyLoading() {
    return new Promise((resolve) => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src) {
                            img.src = src;
                            img.classList.add('loaded');
                            img.removeAttribute('data-src');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
            
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                img.classList.add('lazy-loading');
                imageObserver.observe(img);
            });
        }
        
        resolve();
    });
}

// Search functionality for blog and content
function initSearchFunctionality() {
    return new Promise((resolve) => {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        
        if (searchInput && searchResults) {
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(this.value.trim());
                }, 300);
            });
            
            searchInput.addEventListener('focus', function() {
                if (this.value.trim()) {
                    searchResults.classList.add('show');
                }
            });
            
            // Close search results when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.search-container')) {
                    searchResults.classList.remove('show');
                }
            });
        }
        
        resolve();
    });
}

// Perform search functionality
async function performSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    if (!query || query.length < 2) {
        searchResults.classList.remove('show');
        return;
    }
    
    try {
        // Simulated search - in a real app, this would call an API
        const mockResults = [
            { title: 'Web Development Services', url: '/services', type: 'service' },
            { title: 'About Our Team', url: '/about', type: 'page' },
            { title: 'Contact Us', url: '/contact', type: 'page' }
        ].filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        );
        
        displaySearchResults(mockResults);
        searchResults.classList.add('show');
        
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="p-3 text-muted">No results found</div>';
        return;
    }
    
    const resultsHTML = results.map(result => `
        <a href="${result.url}" class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${result.title}</h6>
                <small class="text-muted">${result.type}</small>
            </div>
        </a>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// Theme toggle functionality
function initThemeToggle() {
    return new Promise((resolve) => {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        if (themeToggle) {
            updateThemeToggleIcon(currentTheme);
            
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeToggleIcon(newTheme);
                
                // Animate the transition
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        }
        
        resolve();
    });
}

// Update theme toggle icon
function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
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
    const alertClass = type === 'info' ? 'alert-info' : type === 'success' ? 'alert-success' : 'alert-danger';
    const iconClass = type === 'info' ? 'fa-info-circle' : type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    toast.className = `alert ${alertClass} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${iconClass} me-2"></i>
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
            
            // Navigation buttons
            goBackBtn: document.getElementById('goBack'),
            goForwardBtn: document.getElementById('goForward'),
            refreshBtn: document.getElementById('refreshPage'),
            openInNewTabBtn: document.getElementById('openInNewTab'),
            copyUrlBtn: document.getElementById('copyUrl'),
            closeBtn: document.getElementById('closeEmbedded'),
            toggleFullscreenBtn: document.getElementById('toggleFullscreen'),
            clearUrlBtn: document.getElementById('clearUrl'),
            retryBtn: document.getElementById('retryLoad'),
            
            // Stats elements
            loadTimeElement: document.getElementById('loadTime'),
            cacheStatusElement: document.getElementById('cacheStatus'),
            
            // Quick link buttons
            quickLinkButtons: document.querySelectorAll('.quick-link')
        };
        
        // History tracking with enhanced metadata
        let navigationHistory = [];
        let currentHistoryIndex = -1;
        let performanceMetrics = {};
        
        if (!elements.urlInput || !elements.loadButton) {
            resolve();
            return;
        }
        
        // Enhanced load website function with performance tracking
        async function loadWebsite(url, addToHistory = true) {
            const startTime = performance.now();
            
            if (!isValidUrl(url)) {
                showError('Please enter a valid URL starting with http:// or https://');
                return;
            }
            
            // Show container and loading
            elements.websiteContainer.classList.remove('d-none');
            elements.quickLinksSection.classList.add('d-none');
            elements.loadingIndicator.classList.remove('d-none');
            elements.errorMessage.classList.add('d-none');
            elements.websiteContent.style.display = 'none';
            elements.websiteContent.classList.add('loading');
            
            // Update current URL display
            elements.currentUrlInput.value = url;
            
            // Add to history management
            if (addToHistory && navigationHistory[currentHistoryIndex] !== url) {
                navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
                navigationHistory.push(url);
                currentHistoryIndex = navigationHistory.length - 1;
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
                    const cacheStatus = response.headers.get('X-Cache') || 'MISS';
                    const contentSource = response.headers.get('X-Content-Source') || 'proxy';
                    
                    // Store performance metrics
                    performanceMetrics = {
                        loadTime: Math.round(loadTime),
                        cacheStatus,
                        contentSource,
                        url,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Clear previous content and load new content
                    elements.websiteContent.innerHTML = htmlContent;
                    
                    // Process the loaded content with enhancements
                    await processLoadedContent(url);
                    
                    // Hide loading and show content
                    elements.loadingIndicator.classList.add('d-none');
                    elements.websiteContent.style.display = 'block';
                    elements.websiteContent.classList.remove('loading');
                    
                    // Update performance display with source indicator
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
                            error: `HTTP ${response.status} ${response.statusText}`,
                            code: `HTTP_${response.status}`,
                            suggestions: [
                                'The server encountered an error',
                                'Try a different website',
                                'Check if the URL is correct'
                            ]
                        };
                    }
                    showError(errorDetails);
                }
                
            } catch (error) {
                console.error('Enhanced load error:', error);
                let errorData = {
                    error: 'Network error: Unable to connect to the website',
                    code: 'NETWORK_ERROR',
                    suggestions: [
                        'Check your internet connection',
                        'Try a different website',
                        'The website might be temporarily unavailable',
                        'Refresh the page and try again'
                    ]
                };
                
                if (error.name === 'TypeError') {
                    errorData.error = 'Network connection failed';
                    errorData.code = 'CONNECTION_FAILED';
                    errorData.suggestions = [
                        'Check your internet connection',
                        'The website might be blocking requests',
                        'Try again in a few moments'
                    ];
                } else if (error.name === 'AbortError') {
                    errorData.error = 'Request was cancelled or timed out';
                    errorData.code = 'REQUEST_ABORTED';
                    errorData.suggestions = [
                        'The request took too long to complete',
                        'Try a faster loading website',
                        'Check your network speed'
                    ];
                }
                
                showError(errorData);
            }
        }
        
        // Enhanced content processing with additional optimizations
        async function processLoadedContent(originalUrl) {
            const baseUrl = new URL(originalUrl);
            
            // Enhanced link processing
            const links = elements.websiteContent.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
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
                    
                    // Add visual indication for external links
                    if (href.startsWith('http') && !href.includes(baseUrl.host)) {
                        link.classList.add('external-link');
                        link.title = 'External link';
                    }
                }
            });
            
            // Enhanced form handling
            const forms = elements.websiteContent.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    showToast('Form submissions are limited in embedded mode. Please visit the original site for full functionality.', 'warning');
                });
            });
            
            // Enhanced image optimization
            const images = elements.websiteContent.querySelectorAll('img');
            images.forEach(img => {
                // Add loading="lazy" if not present
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                // Add error handling
                img.addEventListener('error', function() {
                    this.style.opacity = '0.5';
                    this.title = 'Image failed to load';
                });
            });
            
            // Add smooth scrolling
            elements.websiteContent.style.scrollBehavior = 'smooth';
            
            // Scroll to top when new content loads
            elements.websiteContent.scrollTop = 0;
        }
        
        // Enhanced error display with detailed feedback
        function showError(errorData) {
            elements.loadingIndicator.classList.add('d-none');
            elements.websiteContent.style.display = 'none';
            elements.websiteContent.classList.remove('loading');
            elements.errorMessage.classList.remove('d-none');
            
            // Handle both string messages and detailed error objects
            let message, suggestions = [], code = 'UNKNOWN';
            
            if (typeof errorData === 'string') {
                message = errorData;
            } else if (typeof errorData === 'object' && errorData.error) {
                message = errorData.error;
                suggestions = errorData.suggestions || [];
                code = errorData.code || 'UNKNOWN';
            } else {
                message = 'An unexpected error occurred';
            }
            
            elements.errorText.innerHTML = `
                <div class="error-details">
                    <div class="error-message mb-3">
                        <strong>${message}</strong>
                        ${code !== 'UNKNOWN' ? `<small class="text-muted d-block mt-1">Error Code: ${code}</small>` : ''}
                    </div>
                    ${suggestions.length > 0 ? `
                        <div class="error-suggestions">
                            <h6 class="text-muted mb-2">Suggestions:</h6>
                            <ul class="list-unstyled mb-3">
                                ${suggestions.map(suggestion => `<li class="mb-1"><i class="fas fa-lightbulb text-warning me-2"></i>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="error-actions mt-3">
                        <button class="btn btn-primary btn-sm me-2" onclick="document.getElementById('urlInput').focus()">
                            <i class="fas fa-edit me-1"></i>Try Different URL
                        </button>
                        <button class="btn btn-outline-success btn-sm me-2" onclick="tryDemoMode()">
                            <i class="fas fa-play me-1"></i>Try Demo Mode
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="location.reload()">
                            <i class="fas fa-refresh me-1"></i>Refresh Page
                        </button>
                    </div>
                </div>
            `;
            
            updateStatsDisplay('Error', 'ERROR');
        }
        
        // Enhanced URL validation with better error messages
        function isValidUrl(string) {
            try {
                const url = new URL(string);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                return false;
            }
        }
        
        // Update navigation buttons with enhanced state management
        function updateNavigationButtons() {
            if (elements.goBackBtn && elements.goForwardBtn) {
                elements.goBackBtn.disabled = currentHistoryIndex <= 0;
                elements.goForwardBtn.disabled = currentHistoryIndex >= navigationHistory.length - 1;
                
                // Update tooltips
                elements.goBackBtn.title = currentHistoryIndex > 0 ? 
                    `Go back to ${navigationHistory[currentHistoryIndex - 1]}` : 'No previous page';
                elements.goForwardBtn.title = currentHistoryIndex < navigationHistory.length - 1 ? 
                    `Go forward to ${navigationHistory[currentHistoryIndex + 1]}` : 'No next page';
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
        
        // Enhanced event listeners
        
        // Main load button
        if (elements.loadButton) {
            elements.loadButton.addEventListener('click', function() {
                const url = elements.urlInput.value.trim();
                if (url) {
                    loadWebsite(url);
                }
            });
        }
        
        // Enhanced URL input with better UX
        if (elements.urlInput) {
            elements.urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const url = this.value.trim();
                    if (url) {
                        loadWebsite(url);
                    }
                }
            });
            
            // Auto-add protocol with better detection
            elements.urlInput.addEventListener('blur', function() {
                let url = this.value.trim();
                if (url && !url.match(/^https?:\/\//)) {
                    // Smart protocol detection
                    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.')) {
                        url = 'http://' + url;
                    } else {
                        url = 'https://' + url;
                    }
                    this.value = url;
                }
            });
            
            // Real-time validation feedback
            elements.urlInput.addEventListener('input', debounce(function() {
                const url = this.value.trim();
                if (url && url.length > 7) {
                    if (isValidUrl(url) || (!url.startsWith('http') && url.includes('.'))) {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                    } else {
                        this.classList.remove('is-valid');
                        this.classList.add('is-invalid');
                    }
                } else {
                    this.classList.remove('is-valid', 'is-invalid');
                }
            }, 300));
        }
        
        // Clear URL button
        if (elements.clearUrlBtn) {
            elements.clearUrlBtn.addEventListener('click', function() {
                elements.urlInput.value = '';
                elements.urlInput.classList.remove('is-valid', 'is-invalid');
                elements.urlInput.focus();
            });
        }
        
        // Enhanced navigation handlers
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
                    window.open(currentUrl, '_blank', 'noopener,noreferrer');
                }
            });
        }
        
        // Copy URL functionality
        if (elements.copyUrlBtn) {
            elements.copyUrlBtn.addEventListener('click', async function() {
                const currentUrl = elements.currentUrlInput.value;
                if (currentUrl) {
                    try {
                        await navigator.clipboard.writeText(currentUrl);
                        showToast('URL copied to clipboard!', 'success');
                        
                        // Visual feedback
                        const icon = this.querySelector('i');
                        const originalClass = icon.className;
                        icon.className = 'fas fa-check';
                        setTimeout(() => {
                            icon.className = originalClass;
                        }, 1000);
                    } catch (err) {
                        showToast('Failed to copy URL', 'error');
                    }
                }
            });
        }
        
        // Enhanced fullscreen toggle
        if (elements.toggleFullscreenBtn) {
            elements.toggleFullscreenBtn.addEventListener('click', function() {
                const container = elements.websiteContainer;
                const icon = this.querySelector('i');
                
                if (container.classList.contains('fullscreen')) {
                    container.classList.remove('fullscreen');
                    icon.className = 'fas fa-expand';
                    this.title = 'Toggle Fullscreen';
                } else {
                    container.classList.add('fullscreen');
                    icon.className = 'fas fa-compress';
                    this.title = 'Exit Fullscreen';
                }
            });
        }
        
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', function() {
                elements.websiteContainer.classList.add('d-none');
                elements.quickLinksSection.classList.remove('d-none');
                elements.websiteContent.innerHTML = '';
                elements.urlInput.value = '';
                elements.urlInput.classList.remove('is-valid', 'is-invalid');
                navigationHistory = [];
                currentHistoryIndex = -1;
                updateStatsDisplay('-', '-');
            });
        }
        
        // Retry functionality
        if (elements.retryBtn) {
            elements.retryBtn.addEventListener('click', function() {
                const currentUrl = elements.currentUrlInput.value;
                if (currentUrl) {
                    loadWebsite(currentUrl, false);
                }
            });
        }
        
        // Enhanced quick link handlers with better UX
        elements.quickLinkButtons.forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                if (url) {
                    elements.urlInput.value = url;
                    elements.urlInput.classList.remove('is-invalid');
                    elements.urlInput.classList.add('is-valid');
                    
                    // Add loading state to button
                    const originalHTML = this.innerHTML;
                    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Loading...';
                    this.disabled = true;
                    
                    loadWebsite(url).finally(() => {
                        this.innerHTML = originalHTML;
                        this.disabled = false;
                    });
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (elements.websiteContainer && !elements.websiteContainer.classList.contains('d-none')) {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'r':
                            e.preventDefault();
                            if (elements.refreshBtn) elements.refreshBtn.click();
                            break;
                        case 'w':
                            e.preventDefault();
                            if (elements.closeBtn) elements.closeBtn.click();
                            break;
                        case 't':
                            e.preventDefault();
                            if (elements.openInNewTabBtn) elements.openInNewTabBtn.click();
                            break;
                    }
                } else {
                    switch (e.key) {
                        case 'Escape':
                            if (elements.websiteContainer.classList.contains('fullscreen')) {
                                elements.toggleFullscreenBtn.click();
                            } else {
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

// Try demo mode - loads a demo website
function tryDemoMode() {
    const demoSites = [
        'https://example.com',
        'https://github.com', 
        'https://httpbin.org/html'
    ];
    
    const randomSite = demoSites[Math.floor(Math.random() * demoSites.length)];
    const urlInput = document.getElementById('urlInput');
    
    if (urlInput) {
        urlInput.value = randomSite;
        urlInput.classList.remove('is-invalid');
        urlInput.classList.add('is-valid');
        
        // Load the demo site using the load button
        const loadButton = document.getElementById('loadWebsite');
        if (loadButton) {
            loadButton.click();
        }
    }
}

// Advanced Website Automation Engine
function initWebsiteAutomation() {
    return new Promise((resolve) => {
        // Automation state management
        window.automationEngine = {
            isRecording: false,
            isPlaying: false,
            isScheduled: false,
            recordedActions: [],
            currentActionIndex: 0,
            scheduleInterval: null,
            executionCount: 0,
            maxExecutions: 10,
            startTime: null,
            config: {
                autoFill: {
                    name: '',
                    email: '',
                    phone: '',
                    message: ''
                },
                scroll: {
                    speed: 2000,
                    distance: 300,
                    infinite: false,
                    pauseOnHover: false
                },
                schedule: {
                    interval: 'none',
                    maxExecutions: 10
                }
            }
        };

        // Get automation UI elements
        const automationElements = {
            toggleBtn: document.getElementById('toggleAutomation'),
            panel: document.getElementById('automationPanel'),
            status: document.getElementById('automationStatus'),
            indicator: document.getElementById('automationIndicator'),
            description: document.getElementById('automationDescription'),
            actionCount: document.getElementById('actionCount'),
            runtime: document.getElementById('automationRuntime'),
            recordBtn: document.getElementById('recordActions'),
            playBtn: document.getElementById('playbackActions'),
            stopBtn: document.getElementById('stopAutomation'),
            autoFillBtn: document.getElementById('autoFillForms'),
            autoScrollBtn: document.getElementById('autoScroll'),
            extractBtn: document.getElementById('extractContent'),
            scheduleBtn: document.getElementById('scheduleTask'),
            templatesBtn: document.getElementById('automationTemplates'),
            configModal: document.getElementById('automationConfigModal'),
            saveConfigBtn: document.getElementById('saveAutomationConfig'),
            clearActionsBtn: document.getElementById('clearActions'),
            actionsList: document.getElementById('recordedActionsList'),
            customScript: document.getElementById('customScript'),
            validateScriptBtn: document.getElementById('validateScript'),
            executeScriptBtn: document.getElementById('executeScript')
        };

        // Toggle automation panel
        if (automationElements.toggleBtn) {
            automationElements.toggleBtn.addEventListener('click', function() {
                const panel = automationElements.panel;
                const isVisible = !panel.classList.contains('d-none');
                
                if (isVisible) {
                    panel.classList.add('d-none');
                    automationElements.status.classList.add('d-none');
                    this.classList.remove('btn-outline-info');
                    this.classList.add('btn-outline-secondary');
                } else {
                    panel.classList.remove('d-none');
                    automationElements.status.classList.remove('d-none');
                    this.classList.remove('btn-outline-secondary');
                    this.classList.add('btn-outline-info');
                    updateAutomationStatus('READY', 'Automation panel activated');
                }
            });
        }

        // Record actions functionality
        if (automationElements.recordBtn) {
            automationElements.recordBtn.addEventListener('click', function() {
                if (!window.automationEngine.isRecording) {
                    startRecording();
                } else {
                    stopRecording();
                }
            });
        }

        // Playback recorded actions
        if (automationElements.playBtn) {
            automationElements.playBtn.addEventListener('click', async function() {
                if (window.automationEngine.recordedActions.length > 0) {
                    await playbackActions();
                } else {
                    showToast('No recorded actions to playback', 'warning');
                }
            });
        }

        // Stop automation
        if (automationElements.stopBtn) {
            automationElements.stopBtn.addEventListener('click', function() {
                stopAllAutomation();
            });
        }

        // Auto-fill forms
        if (automationElements.autoFillBtn) {
            automationElements.autoFillBtn.addEventListener('click', function() {
                autoFillForms();
            });
        }

        // Auto-scroll functionality
        if (automationElements.autoScrollBtn) {
            automationElements.autoScrollBtn.addEventListener('click', function() {
                toggleAutoScroll();
            });
        }

        // Content extraction
        if (automationElements.extractBtn) {
            automationElements.extractBtn.addEventListener('click', function() {
                extractContent();
            });
        }

        // Schedule task
        if (automationElements.scheduleBtn) {
            automationElements.scheduleBtn.addEventListener('click', function() {
                const modal = new bootstrap.Modal(automationElements.configModal);
                modal.show();
            });
        }

        // Template selection
        document.querySelectorAll('[data-template]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                loadAutomationTemplate(this.dataset.template);
            });
        });

        // Save configuration
        if (automationElements.saveConfigBtn) {
            automationElements.saveConfigBtn.addEventListener('click', function() {
                saveAutomationConfig();
                const modal = bootstrap.Modal.getInstance(automationElements.configModal);
                if (modal) modal.hide();
            });
        }

        // Clear actions
        if (automationElements.clearActionsBtn) {
            automationElements.clearActionsBtn.addEventListener('click', function() {
                clearRecordedActions();
            });
        }

        // Custom script validation and execution
        if (automationElements.validateScriptBtn) {
            automationElements.validateScriptBtn.addEventListener('click', function() {
                validateCustomScript();
            });
        }

        if (automationElements.executeScriptBtn) {
            automationElements.executeScriptBtn.addEventListener('click', function() {
                executeCustomScript();
            });
        }

        // Start automation runtime timer
        startAutomationTimer();

        resolve();
    });
}

// Start recording user actions
function startRecording() {
    window.automationEngine.isRecording = true;
    window.automationEngine.recordedActions = [];
    window.automationEngine.startTime = Date.now();
    
    const recordBtn = document.getElementById('recordActions');
    recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    recordBtn.classList.remove('btn-outline-light');
    recordBtn.classList.add('btn-outline-danger');
    
    updateAutomationStatus('RECORDING', 'Recording user actions...');
    
    // Inject recording script into embedded content
    injectRecordingScript();
    
    showToast('Started recording actions', 'success');
}

// Stop recording actions
function stopRecording() {
    window.automationEngine.isRecording = false;
    
    const recordBtn = document.getElementById('recordActions');
    recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Record';
    recordBtn.classList.remove('btn-outline-danger');
    recordBtn.classList.add('btn-outline-light');
    
    const playBtn = document.getElementById('playbackActions');
    if (playBtn) playBtn.disabled = false;
    
    updateAutomationStatus('READY', `Recorded ${window.automationEngine.recordedActions.length} actions`);
    updateActionsList();
    
    showToast(`Recording stopped. Captured ${window.automationEngine.recordedActions.length} actions`, 'info');
}

// Inject recording script into embedded website
function injectRecordingScript() {
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) return;
    
    // Create recording overlay
    const recordingOverlay = document.createElement('div');
    recordingOverlay.id = 'automationRecordingOverlay';
    recordingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 0, 0, 0.1);
        pointer-events: none;
        z-index: 999999;
        border: 3px dashed red;
    `;
    
    websiteContent.appendChild(recordingOverlay);
    
    // Record clicks, form interactions, and scrolls
    const recordAction = (type, data) => {
        if (window.automationEngine.isRecording) {
            const action = {
                type,
                data,
                timestamp: Date.now() - window.automationEngine.startTime,
                selector: data.selector || null
            };
            window.automationEngine.recordedActions.push(action);
            updateActionCount();
        }
    };
    
    // Add event listeners for recording
    websiteContent.addEventListener('click', function(e) {
        if (window.automationEngine.isRecording) {
            const selector = generateSelector(e.target);
            recordAction('click', {
                selector,
                x: e.clientX,
                y: e.clientY,
                tagName: e.target.tagName,
                text: e.target.textContent.substring(0, 50)
            });
        }
    }, true);
    
    websiteContent.addEventListener('input', function(e) {
        if (window.automationEngine.isRecording && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            const selector = generateSelector(e.target);
            recordAction('input', {
                selector,
                value: e.target.value,
                type: e.target.type || 'text'
            });
        }
    }, true);
    
    websiteContent.addEventListener('scroll', function(e) {
        if (window.automationEngine.isRecording) {
            recordAction('scroll', {
                scrollTop: websiteContent.scrollTop,
                scrollLeft: websiteContent.scrollLeft
            });
        }
    }, { passive: true });
}

// Generate CSS selector for an element
function generateSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c);
        if (classes.length > 0) {
            return `.${classes.join('.')}`;
        }
    }
    
    let selector = element.tagName.toLowerCase();
    let parent = element.parentElement;
    
    while (parent && parent !== document.body) {
        const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
        if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector = `${parent.tagName.toLowerCase()} > ${selector}:nth-child(${index})`;
        } else {
            selector = `${parent.tagName.toLowerCase()} > ${selector}`;
        }
        element = parent;
        parent = parent.parentElement;
    }
    
    return selector;
}

// Auto-fill forms with configured data
function autoFillForms() {
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) {
        showToast('No embedded website to auto-fill', 'warning');
        return;
    }
    
    const config = window.automationEngine.config.autoFill;
    const forms = websiteContent.querySelectorAll('form');
    let fieldsFilledCount = 0;
    
    forms.forEach(form => {
        // Fill name fields
        const nameFields = form.querySelectorAll('input[name*="name"], input[id*="name"], input[placeholder*="name"], input[type="text"]');
        nameFields.forEach(field => {
            if (config.name && !field.value) {
                field.value = config.name;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                fieldsFilledCount++;
            }
        });
        
        // Fill email fields
        const emailFields = form.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]');
        emailFields.forEach(field => {
            if (config.email && !field.value) {
                field.value = config.email;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                fieldsFilledCount++;
            }
        });
        
        // Fill phone fields
        const phoneFields = form.querySelectorAll('input[type="tel"], input[name*="phone"], input[id*="phone"], input[placeholder*="phone"]');
        phoneFields.forEach(field => {
            if (config.phone && !field.value) {
                field.value = config.phone;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                fieldsFilledCount++;
            }
        });
        
        // Fill message/textarea fields
        const messageFields = form.querySelectorAll('textarea, input[name*="message"], input[id*="message"], input[placeholder*="message"]');
        messageFields.forEach(field => {
            if (config.message && !field.value) {
                field.value = config.message;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                fieldsFilledCount++;
            }
        });
    });
    
    if (fieldsFilledCount > 0) {
        showToast(`Auto-filled ${fieldsFilledCount} form fields`, 'success');
        updateAutomationStatus('ACTIVE', `Auto-filled ${fieldsFilledCount} fields`);
    } else {
        showToast('No compatible form fields found', 'info');
    }
}

// Toggle auto-scroll functionality
function toggleAutoScroll() {
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) {
        showToast('No embedded website to scroll', 'warning');
        return;
    }
    
    if (window.automationEngine.autoScrollInterval) {
        // Stop auto-scroll
        clearInterval(window.automationEngine.autoScrollInterval);
        window.automationEngine.autoScrollInterval = null;
        
        const scrollBtn = document.getElementById('autoScroll');
        if (scrollBtn) {
            scrollBtn.innerHTML = '<i class="fas fa-arrows-alt-v"></i> Scroll';
            scrollBtn.classList.remove('btn-outline-warning');
            scrollBtn.classList.add('btn-outline-light');
        }
        
        updateAutomationStatus('READY', 'Auto-scroll stopped');
        showToast('Auto-scroll stopped', 'info');
    } else {
        // Start auto-scroll
        const config = window.automationEngine.config.scroll;
        let currentPosition = websiteContent.scrollTop;
        
        window.automationEngine.autoScrollInterval = setInterval(() => {
            currentPosition += config.distance;
            
            if (currentPosition >= websiteContent.scrollHeight - websiteContent.clientHeight) {
                if (config.infinite) {
                    currentPosition = 0;
                } else {
                    // Stop at bottom
                    clearInterval(window.automationEngine.autoScrollInterval);
                    window.automationEngine.autoScrollInterval = null;
                    showToast('Reached bottom of page', 'info');
                    return;
                }
            }
            
            websiteContent.scrollTo({
                top: currentPosition,
                behavior: 'smooth'
            });
        }, config.speed);
        
        const scrollBtn = document.getElementById('autoScroll');
        if (scrollBtn) {
            scrollBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            scrollBtn.classList.remove('btn-outline-light');
            scrollBtn.classList.add('btn-outline-warning');
        }
        
        updateAutomationStatus('SCROLLING', 'Auto-scrolling active');
        showToast('Auto-scroll started', 'success');
    }
}

// Extract content from embedded website
function extractContent() {
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) {
        showToast('No embedded website to extract from', 'warning');
        return;
    }
    
    const extractedData = {
        title: websiteContent.querySelector('title')?.textContent || 'No title',
        headings: Array.from(websiteContent.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            level: h.tagName,
            text: h.textContent.trim()
        })),
        paragraphs: Array.from(websiteContent.querySelectorAll('p')).map(p => p.textContent.trim()).filter(text => text.length > 10),
        links: Array.from(websiteContent.querySelectorAll('a[href]')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
        })),
        images: Array.from(websiteContent.querySelectorAll('img[src]')).map(img => ({
            src: img.src,
            alt: img.alt || 'No alt text'
        })),
        forms: Array.from(websiteContent.querySelectorAll('form')).map(form => ({
            action: form.action || 'No action',
            method: form.method || 'GET',
            fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
                name: field.name || field.id || 'unnamed',
                type: field.type || field.tagName.toLowerCase(),
                placeholder: field.placeholder || ''
            }))
        }))
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `extracted-content-${Date.now()}.json`;
    link.click();
    
    updateAutomationStatus('ACTIVE', `Extracted ${extractedData.headings.length} headings, ${extractedData.paragraphs.length} paragraphs, ${extractedData.links.length} links`);
    showToast('Content extracted and downloaded', 'success');
}

// Stop all automation activities
function stopAllAutomation() {
    window.automationEngine.isRecording = false;
    window.automationEngine.isPlaying = false;
    
    // Clear intervals
    if (window.automationEngine.autoScrollInterval) {
        clearInterval(window.automationEngine.autoScrollInterval);
        window.automationEngine.autoScrollInterval = null;
    }
    
    if (window.automationEngine.scheduleInterval) {
        clearInterval(window.automationEngine.scheduleInterval);
        window.automationEngine.scheduleInterval = null;
    }
    
    // Reset UI
    const recordBtn = document.getElementById('recordActions');
    const playBtn = document.getElementById('playbackActions');
    const stopBtn = document.getElementById('stopAutomation');
    const scrollBtn = document.getElementById('autoScroll');
    
    if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Record';
        recordBtn.classList.remove('btn-outline-danger');
        recordBtn.classList.add('btn-outline-light');
    }
    
    if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
        playBtn.disabled = window.automationEngine.recordedActions.length === 0;
    }
    
    if (stopBtn) stopBtn.disabled = true;
    
    if (scrollBtn) {
        scrollBtn.innerHTML = '<i class="fas fa-arrows-alt-v"></i> Scroll';
        scrollBtn.classList.remove('btn-outline-warning');
        scrollBtn.classList.add('btn-outline-light');
    }
    
    // Remove recording overlay
    const overlay = document.getElementById('automationRecordingOverlay');
    if (overlay) overlay.remove();
    
    updateAutomationStatus('READY', 'All automation stopped');
    showToast('All automation activities stopped', 'warning');
}

// Update automation status display
function updateAutomationStatus(status, description) {
    const indicator = document.getElementById('automationIndicator');
    const descriptionEl = document.getElementById('automationDescription');
    
    if (indicator) {
        indicator.textContent = status;
        indicator.className = 'badge me-2';
        
        switch (status) {
            case 'READY':
                indicator.classList.add('bg-success');
                break;
            case 'RECORDING':
                indicator.classList.add('bg-danger');
                break;
            case 'PLAYING':
            case 'SCROLLING':
            case 'ACTIVE':
                indicator.classList.add('bg-warning');
                break;
            default:
                indicator.classList.add('bg-secondary');
        }
    }
    
    if (descriptionEl) {
        descriptionEl.textContent = description;
    }
}

// Update action count display
function updateActionCount() {
    const actionCountEl = document.getElementById('actionCount');
    if (actionCountEl) {
        actionCountEl.textContent = window.automationEngine.recordedActions.length;
    }
}

// Update recorded actions list
function updateActionsList() {
    const listEl = document.getElementById('recordedActionsList');
    if (!listEl) return;
    
    if (window.automationEngine.recordedActions.length === 0) {
        listEl.innerHTML = `
            <div class="text-muted text-center py-3">
                <i class="fas fa-info-circle me-2"></i>
                No actions recorded yet. Click "Record" to start capturing actions.
            </div>
        `;
        return;
    }
    
    const actionsHtml = window.automationEngine.recordedActions.map((action, index) => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <span class="badge bg-primary me-2">${index + 1}</span>
                <strong>${action.type.toUpperCase()}</strong>
                <small class="text-muted ms-2">${action.data.selector || action.data.tagName || ''}</small>
            </div>
            <small class="text-muted">${(action.timestamp / 1000).toFixed(1)}s</small>
        </div>
    `).join('');
    
    listEl.innerHTML = actionsHtml;
}

// Clear recorded actions
function clearRecordedActions() {
    window.automationEngine.recordedActions = [];
    updateActionsList();
    updateActionCount();
    
    const playBtn = document.getElementById('playbackActions');
    if (playBtn) playBtn.disabled = true;
    
    showToast('Recorded actions cleared', 'info');
}

// Save automation configuration
function saveAutomationConfig() {
    const config = window.automationEngine.config;
    
    // Auto-fill configuration
    config.autoFill.name = document.getElementById('autoFillName')?.value || '';
    config.autoFill.email = document.getElementById('autoFillEmail')?.value || '';
    config.autoFill.phone = document.getElementById('autoFillPhone')?.value || '';
    config.autoFill.message = document.getElementById('autoFillMessage')?.value || '';
    
    // Scroll configuration
    config.scroll.speed = parseInt(document.getElementById('scrollSpeed')?.value) || 2000;
    config.scroll.distance = parseInt(document.getElementById('scrollDistance')?.value) || 300;
    config.scroll.infinite = document.getElementById('infiniteScroll')?.checked || false;
    config.scroll.pauseOnHover = document.getElementById('pauseOnHover')?.checked || false;
    
    // Schedule configuration
    config.schedule.interval = document.getElementById('scheduleInterval')?.value || 'none';
    config.schedule.maxExecutions = parseInt(document.getElementById('maxExecutions')?.value) || 10;
    
    // Save to localStorage
    localStorage.setItem('automationConfig', JSON.stringify(config));
    
    showToast('Automation configuration saved', 'success');
}

// Load automation template
function loadAutomationTemplate(templateType) {
    const customScript = document.getElementById('customScript');
    if (!customScript) return;
    
    const templates = {
        'form-filler': `// Auto-fill form template
await wait(1000);
const forms = document.querySelectorAll('form');
forms.forEach(async form => {
    await fillForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is an automated message'
    });
});`,
        'content-monitor': `// Content monitoring template
const checkForChanges = async () => {
    const content = document.body.textContent;
    const hash = btoa(content).substring(0, 20);
    console.log('Content hash:', hash);
    
    // Check every 30 seconds
    setTimeout(checkForChanges, 30000);
};
checkForChanges();`,
        'page-navigator': `// Page navigation template
const links = document.querySelectorAll('a[href]');
for (let i = 0; i < Math.min(links.length, 3); i++) {
    await wait(2000);
    await click(links[i]);
    await wait(3000);
}`,
        'data-scraper': `// Data scraping template
const data = {
    title: document.title,
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.textContent),
    links: Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href}))
};
console.log('Scraped data:', data);`,
        'custom': `// Custom automation script
// Available functions:
// - wait(milliseconds) - Wait for specified time
// - click(selector) - Click element by CSS selector
// - fillForm(data) - Fill form with data object
// - scrollTo(position) - Scroll to position

await wait(1000);
console.log('Custom automation started');`
    };
    
    customScript.value = templates[templateType] || templates.custom;
    showToast(`Loaded ${templateType} template`, 'info');
}

// Validate custom script
function validateCustomScript() {
    const customScript = document.getElementById('customScript');
    if (!customScript) return;
    
    const script = customScript.value.trim();
    if (!script) {
        showToast('Script is empty', 'warning');
        return;
    }
    
    try {
        // Basic syntax validation
        new Function(`async function validateScript() { ${script} }`);
        showToast('Script syntax is valid', 'success');
    } catch (error) {
        showToast(`Script validation error: ${error.message}`, 'error');
    }
}

// Execute custom script
async function executeCustomScript() {
    const customScript = document.getElementById('customScript');
    if (!customScript) return;
    
    const script = customScript.value.trim();
    if (!script) {
        showToast('Script is empty', 'warning');
        return;
    }
    
    const websiteContent = document.getElementById('websiteContent');
    if (!websiteContent) {
        showToast('No embedded website for script execution', 'warning');
        return;
    }
    
    updateAutomationStatus('EXECUTING', 'Running custom script...');
    
    try {
        // Create execution context with helper functions
        const executionContext = {
            wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
            click: (selector) => {
                const element = websiteContent.querySelector(selector);
                if (element) {
                    element.click();
                    return true;
                }
                return false;
            },
            fillForm: (data) => {
                let filled = 0;
                Object.keys(data).forEach(key => {
                    const inputs = websiteContent.querySelectorAll(`input[name="${key}"], input[id="${key}"], #${key}`);
                    inputs.forEach(input => {
                        input.value = data[key];
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        filled++;
                    });
                });
                return filled;
            },
            scrollTo: (position) => {
                websiteContent.scrollTo({ top: position, behavior: 'smooth' });
            },
            document: websiteContent,
            console: {
                log: (...args) => {
                    console.log('[Automation Script]:', ...args);
                    showToast(`Script: ${args.join(' ')}`, 'info');
                }
            }
        };
        
        // Execute script in context
        const asyncFunction = new Function('context', `
            return (async function() {
                with (context) {
                    ${script}
                }
            })();
        `);
        
        await asyncFunction(executionContext);
        
        updateAutomationStatus('READY', 'Custom script completed');
        showToast('Custom script executed successfully', 'success');
    } catch (error) {
        updateAutomationStatus('ERROR', `Script error: ${error.message}`);
        showToast(`Script execution error: ${error.message}`, 'error');
    }
}

// Start automation timer
function startAutomationTimer() {
    setInterval(() => {
        if (window.automationEngine && window.automationEngine.startTime) {
            const elapsed = Date.now() - window.automationEngine.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const runtimeEl = document.getElementById('automationRuntime');
            if (runtimeEl) {
                runtimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }, 1000);
}
