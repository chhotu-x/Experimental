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
        // Enhanced automation state management with performance tracking
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
            
            // Performance metrics
            performance: {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                lastExecutionTime: 0,
                executionHistory: []
            },
            
            // Enhanced configuration with new features
            config: {
                autoFill: {
                    name: '',
                    email: '',
                    phone: '',
                    message: '',
                    enabled: true,
                    smartDetection: true
                },
                scroll: {
                    speed: 2000,
                    distance: 300,
                    infinite: false,
                    pauseOnHover: false,
                    smoothScrolling: true,
                    adaptiveSpeed: false
                },
                schedule: {
                    interval: 'none',
                    maxExecutions: 10,
                    cronExpression: '',
                    enabled: false
                },
                advanced: {
                    smartWaiting: true,
                    elementHighlighting: true,
                    errorRetries: 3,
                    timeoutMs: 30000,
                    batchProcessing: false,
                    performanceLogging: true
                }
            },
            
            // Memoization cache for frequently used elements
            elementCache: new Map(),
            selectorCache: new Map(),
            
            // Smart waiting system
            waitingStrategies: {
                element: async (selector, timeout = 10000) => {
                    const startTime = Date.now();
                    const websiteContent = document.getElementById('websiteContent');
                    if (!websiteContent) return null;
                    
                    while (Date.now() - startTime < timeout) {
                        const element = websiteContent.querySelector(selector);
                        if (element && element.offsetParent !== null) {
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
    
    // Get enhanced templates
    const enhancedTemplates = getEnhancedAutomationTemplates();
    
    const templates = {
        // Legacy templates (updated)
        'form-filler': `// Enhanced Auto-fill form template with smart detection
const batch = new AutomationBatch();
batch.addTask('auto-fill', {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    message: 'This is an automated message with smart field detection'
});

const result = await batch.processAll();
console.log('Smart form filling completed:', result);`,
        
        'content-monitor': `// Enhanced content monitoring with change detection
let previousHash = '';
const monitorContent = async () => {
    const content = document.body.textContent;
    const currentHash = btoa(content).substring(0, 20);
    
    if (previousHash && previousHash !== currentHash) {
        console.log('Content changed detected!', {
            previous: previousHash,
            current: currentHash,
            timestamp: new Date().toISOString()
        });
        
        // Trigger notification or action
        showToast('Page content has changed!', 'info');
    }
    
    previousHash = currentHash;
    setTimeout(monitorContent, 10000); // Check every 10 seconds
};

console.log('Starting enhanced content monitoring...');
monitorContent();`,
        
        'page-navigator': enhancedTemplates['intelligent-navigator'].script,
        'data-scraper': enhancedTemplates['data-harvester'].script,
        
        // New enhanced templates
        'smart-form-filler': enhancedTemplates['smart-form-filler'].script,
        'data-harvester': enhancedTemplates['data-harvester'].script,
        'performance-tester': enhancedTemplates['performance-tester'].script,
        'intelligent-navigator': enhancedTemplates['intelligent-navigator'].script,
        
        'custom': `// Enhanced Custom automation script
// Available classes and functions:
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
console.log('Enhanced automation script started');`
    };
    
    const selectedTemplate = templates[templateType] || templates.custom;
    customScript.value = selectedTemplate;
    
    // Show enhanced information about the template
    const templateInfo = enhancedTemplates[templateType];
    if (templateInfo) {
        showToast(`Loaded: ${templateInfo.name} - ${templateInfo.description}`, 'info');
    } else {
        showToast(`Loaded ${templateType} template`, 'info');
    }
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

// ========== ADVANCED AUTOMATION FEATURES ==========

// Enhanced element detection with AI-powered selectors
function getSmartSelector(element) {
    if (!element) return null;
    
    // Check cache first for performance
    const cacheKey = element.tagName + element.className + element.id;
    if (window.automationEngine.selectorCache.has(cacheKey)) {
        return window.automationEngine.selectorCache.get(cacheKey);
    }
    
    let selector = null;
    
    // Priority-based selector generation
    if (element.id && element.id.length > 0) {
        selector = `#${element.id}`;
    } else if (element.getAttribute('data-testid')) {
        selector = `[data-testid="${element.getAttribute('data-testid')}"]`;
    } else if (element.getAttribute('aria-label')) {
        selector = `[aria-label="${element.getAttribute('aria-label')}"]`;
    } else if (element.name) {
        selector = `[name="${element.name}"]`;
    } else if (element.className && element.className.length > 0) {
        const classes = element.className.split(' ').filter(c => c && !c.startsWith('bootstrap') && !c.startsWith('btn'));
        if (classes.length > 0) {
            selector = `.${classes.slice(0, 2).join('.')}`;
        }
    }
    
    // Fallback to xpath-like selector
    if (!selector) {
        selector = generateAdvancedSelector(element);
    }
    
    // Cache the result
    window.automationEngine.selectorCache.set(cacheKey, selector);
    return selector;
}

// Advanced selector generation with context awareness
function generateAdvancedSelector(element) {
    const paths = [];
    let current = element;
    
    while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        // Add position if multiple siblings of same type
        const siblings = Array.from(current.parentNode?.children || [])
            .filter(sibling => sibling.tagName === current.tagName);
        
        if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
        }
        
        paths.unshift(selector);
        current = current.parentElement;
        
        // Limit depth for performance
        if (paths.length > 5) break;
    }
    
    return paths.join(' > ');
}

// Semaphore for managing parallel concurrency
class ParallelSemaphore {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentCount = 0;
        this.waitingQueue = [];
    }
    
    async acquire() {
        return new Promise((resolve) => {
            if (this.currentCount < this.maxConcurrency) {
                this.currentCount++;
                resolve(() => this.release());
            } else {
                this.waitingQueue.push(() => {
                    this.currentCount++;
                    resolve(() => this.release());
                });
            }
        });
    }
    
    release() {
        this.currentCount--;
        if (this.waitingQueue.length > 0) {
            const next = this.waitingQueue.shift();
            next();
        }
    }
    
    getStatus() {
        return {
            currentCount: this.currentCount,
            maxConcurrency: this.maxConcurrency,
            queueLength: this.waitingQueue.length,
            utilization: (this.currentCount / this.maxConcurrency * 100).toFixed(1)
        };
    }
}

// Batch processing for multiple automation tasks
class AutomationBatch {
    constructor(options = {}) {
        this.tasks = [];
        this.results = [];
        this.isProcessing = false;
        
        // Parallel processing configuration
        this.maxConcurrency = options.maxConcurrency || 100; // Default 100 parallel workers
        this.batchSize = options.batchSize || 1000; // Process in chunks of 1000 for memory management
        this.enableParallel = options.enableParallel !== false; // Default to parallel processing
        this.progressCallback = options.progressCallback || null;
        this.memoryThreshold = options.memoryThreshold || 0.8; // GC threshold at 80% memory usage
        
        // Performance tracking for parallel operations
        this.parallelMetrics = {
            totalOperations: 0,
            completedOperations: 0,
            failedOperations: 0,
            averageTaskTime: 0,
            peakConcurrency: 0,
            currentConcurrency: 0,
            memoryUsage: 0
        };
        
        // Worker pool for parallel processing
        this.activeWorkers = new Set();
        this.taskQueue = [];
        this.completedTasks = new Map();
    }
    
    addTask(type, config, priority = 0) {
        const task = {
            id: Date.now() + Math.random(),
            type,
            config,
            priority, // Higher priority tasks run first
            status: 'pending',
            result: null,
            error: null,
            timestamp: Date.now(),
            startTime: null,
            endTime: null,
            retryCount: 0,
            maxRetries: config.maxRetries || 3
        };
        
        this.tasks.push(task);
        this.parallelMetrics.totalOperations++;
        return task.id; // Return task ID for tracking
    }
    
    // Add multiple tasks at once for bulk operations
    addTasks(taskDefinitions) {
        const taskIds = [];
        for (const taskDef of taskDefinitions) {
            const taskId = this.addTask(taskDef.type, taskDef.config, taskDef.priority || 0);
            taskIds.push(taskId);
        }
        return taskIds;
    }
    
    // Remove task by ID
    removeTask(taskId) {
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            this.parallelMetrics.totalOperations--;
            return true;
        }
        return false;
    }
    
    async processAll() {
        if (this.isProcessing) {
            console.warn('Batch processing already in progress');
            return this.getCurrentProgress();
        }
        
        if (this.tasks.length === 0) {
            console.warn('No tasks to process');
            return { totalTasks: 0, successCount: 0, errorCount: 0, totalTime: 0, tasks: [] };
        }
        
        this.isProcessing = true;
        this.resetMetrics();
        
        const startTime = Date.now();
        let result;
        
        try {
            if (this.enableParallel && this.tasks.length > 1) {
                result = await this.processParallel();
            } else {
                result = await this.processSequential();
            }
        } catch (error) {
            console.error('Batch processing failed:', error);
            this.isProcessing = false;
            throw error;
        }
        
        const totalTime = Date.now() - startTime;
        this.isProcessing = false;
        
        // Final status update
        const successCount = result.successCount;
        const errorCount = result.errorCount;
        
        updateAutomationStatus('READY', 
            `Batch completed: ${successCount} success, ${errorCount} errors in ${(totalTime / 1000).toFixed(1)}s`);
        
        showToast(
            `Parallel processing completed: ${successCount}/${this.tasks.length} tasks in ${(totalTime / 1000).toFixed(1)}s`, 
            errorCount === 0 ? 'success' : 'warning'
        );
        
        // Cleanup memory after processing
        this.cleanupCompletedTasks();
        
        return {
            ...result,
            totalTime,
            parallelMetrics: { ...this.parallelMetrics },
            averageTaskTime: totalTime / this.tasks.length,
            tasksPerSecond: (this.tasks.length / totalTime * 1000).toFixed(2)
        };
    }
    
    async processParallel() {
        updateAutomationStatus('BATCH_PROCESSING', 
            `Starting parallel processing of ${this.tasks.length} tasks with ${this.maxConcurrency} workers...`);
        
        // Sort tasks by priority (higher priority first)
        const sortedTasks = [...this.tasks].sort((a, b) => b.priority - a.priority);
        
        // Split into chunks for memory management
        const chunks = this.chunkTasks(sortedTasks, this.batchSize);
        let totalSuccessCount = 0;
        let totalErrorCount = 0;
        
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            
            updateAutomationStatus('BATCH_PROCESSING', 
                `Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} tasks)...`);
            
            const chunkResult = await this.processChunkParallel(chunk);
            totalSuccessCount += chunkResult.successCount;
            totalErrorCount += chunkResult.errorCount;
            
            // Memory cleanup between chunks
            if (chunks.length > 1) {
                await this.performMemoryCleanup();
            }
            
            // Progress callback
            if (this.progressCallback) {
                const overallProgress = {
                    completed: totalSuccessCount + totalErrorCount,
                    total: this.tasks.length,
                    successCount: totalSuccessCount,
                    errorCount: totalErrorCount,
                    chunkIndex: chunkIndex + 1,
                    totalChunks: chunks.length
                };
                this.progressCallback(overallProgress);
            }
        }
        
        return {
            totalTasks: this.tasks.length,
            successCount: totalSuccessCount,
            errorCount: totalErrorCount,
            tasks: this.tasks
        };
    }
    
    async processChunkParallel(tasks) {
        const semaphore = new ParallelSemaphore(this.maxConcurrency);
        const promises = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const task of tasks) {
            const promise = semaphore.acquire().then(async (release) => {
                try {
                    this.parallelMetrics.currentConcurrency++;
                    this.parallelMetrics.peakConcurrency = Math.max(
                        this.parallelMetrics.peakConcurrency, 
                        this.parallelMetrics.currentConcurrency
                    );
                    
                    const result = await this.executeTask(task);
                    successCount++;
                    this.parallelMetrics.completedOperations++;
                    return result;
                } catch (error) {
                    errorCount++;
                    this.parallelMetrics.failedOperations++;
                    throw error;
                } finally {
                    this.parallelMetrics.currentConcurrency--;
                    release();
                }
            });
            
            promises.push(promise);
        }
        
        // Wait for all tasks in chunk to complete
        await Promise.allSettled(promises);
        
        return { successCount, errorCount };
    }
    
    async processSequential() {
        updateAutomationStatus('BATCH_PROCESSING', `Processing ${this.tasks.length} tasks sequentially...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const task of this.tasks) {
            try {
                await this.executeTask(task);
                successCount++;
                this.parallelMetrics.completedOperations++;
            } catch (error) {
                errorCount++;
                this.parallelMetrics.failedOperations++;
                console.error(`Sequential task error:`, error);
            }
            
            // Progress update
            if (this.progressCallback) {
                this.progressCallback({
                    completed: successCount + errorCount,
                    total: this.tasks.length,
                    successCount,
                    errorCount
                });
            }
            
            // Small delay between tasks in sequential mode
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return {
            totalTasks: this.tasks.length,
            successCount,
            errorCount,
            tasks: this.tasks
        };
    }
    
    async executeTask(task) {
        const startTime = Date.now();
        task.startTime = startTime;
        task.status = 'processing';
        
        try {
            let result = null;
            
            switch (task.type) {
                case 'auto-fill':
                    result = await this.executeAutoFill(task.config);
                    break;
                case 'extract-data':
                    result = await this.executeDataExtraction(task.config);
                    break;
                case 'navigate':
                    result = await this.executeNavigation(task.config);
                    break;
                case 'custom-script':
                    result = await this.executeCustomScript(task.config);
                    break;
                case 'wait':
                    result = await this.executeWait(task.config);
                    break;
                case 'click':
                    result = await this.executeClick(task.config);
                    break;
                case 'scroll':
                    result = await this.executeScroll(task.config);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            
            task.status = 'completed';
            task.result = result;
            task.endTime = Date.now();
            
            // Update average task time
            const taskTime = task.endTime - task.startTime;
            this.parallelMetrics.averageTaskTime = 
                (this.parallelMetrics.averageTaskTime * this.parallelMetrics.completedOperations + taskTime) / 
                (this.parallelMetrics.completedOperations + 1);
            
            return result;
            
        } catch (error) {
            task.status = 'error';
            task.error = error.message;
            task.endTime = Date.now();
            
            // Retry logic for failed tasks
            if (task.retryCount < task.maxRetries) {
                task.retryCount++;
                task.status = 'retrying';
                console.warn(`Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries})`);
                
                // Exponential backoff for retries
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, task.retryCount) * 1000)
                );
                
                return this.executeTask(task);
            }
            
            throw error;
        }
    }
    
    // Helper methods for memory management and parallel processing
    chunkTasks(tasks, chunkSize) {
        const chunks = [];
        for (let i = 0; i < tasks.length; i += chunkSize) {
            chunks.push(tasks.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    resetMetrics() {
        this.parallelMetrics = {
            totalOperations: this.tasks.length,
            completedOperations: 0,
            failedOperations: 0,
            averageTaskTime: 0,
            peakConcurrency: 0,
            currentConcurrency: 0,
            memoryUsage: 0
        };
    }
    
    getCurrentProgress() {
        return {
            isProcessing: this.isProcessing,
            metrics: { ...this.parallelMetrics },
            progress: this.parallelMetrics.totalOperations > 0 ? 
                (this.parallelMetrics.completedOperations + this.parallelMetrics.failedOperations) / 
                this.parallelMetrics.totalOperations : 0
        };
    }
    
    async performMemoryCleanup() {
        // Force garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        // Clear completed tasks from memory if threshold exceeded
        const memoryUsage = this.estimateMemoryUsage();
        if (memoryUsage > this.memoryThreshold) {
            this.cleanupCompletedTasks();
        }
        
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    estimateMemoryUsage() {
        // Estimate memory usage based on task count and size
        const completedTasksSize = this.tasks.filter(task => 
            task.status === 'completed' || task.status === 'error'
        ).length;
        
        // Rough estimation - adjust based on actual usage patterns
        return completedTasksSize / this.tasks.length;
    }
    
    cleanupCompletedTasks() {
        // Move completed tasks to results array and clear from main tasks
        const completedTasks = this.tasks.filter(task => 
            task.status === 'completed' || task.status === 'error'
        );
        
        // Keep only essential data for completed tasks
        completedTasks.forEach(task => {
            this.completedTasks.set(task.id, {
                id: task.id,
                type: task.type,
                status: task.status,
                startTime: task.startTime,
                endTime: task.endTime,
                error: task.error
            });
            
            // Clear heavy data
            delete task.result;
            delete task.config;
        });
    }
    
    // New task execution methods for additional automation types
    async executeWait(config) {
        const waitTime = config.duration || 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return { waited: waitTime };
    }
    
    async executeClick(config) {
        const selector = config.selector;
        if (!selector) throw new Error('Click task requires selector');
        
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Element not found: ${selector}`);
        
        element.click();
        return { clicked: selector };
    }
    
    async executeScroll(config) {
        const { x = 0, y = 0, behavior = 'smooth' } = config;
        
        window.scrollTo({
            left: x,
            top: y,
            behavior
        });
        
        return { scrolled: { x, y } };
    }
    
    async executeAutoFill(config) {
        if (!websiteContent) throw new Error('No website content available');
        
        const forms = websiteContent.querySelectorAll('form');
        let filledCount = 0;
        
        for (const form of forms) {
            // Smart field detection
            const fields = this.detectFormFields(form);
            
            for (const field of fields) {
                if (config[field.type] && !field.element.value) {
                    field.element.value = config[field.type];
                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                    field.element.dispatchEvent(new Event('change', { bubbles: true }));
                    filledCount++;
                }
            }
        }
        
        return { filledFields: filledCount };
    }
    
    detectFormFields(form) {
        const fields = [];
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            let type = 'unknown';
            
            // Smart type detection
            if (input.type === 'email' || input.name?.includes('email') || input.id?.includes('email')) {
                type = 'email';
            } else if (input.type === 'tel' || input.name?.includes('phone') || input.id?.includes('phone')) {
                type = 'phone';
            } else if (input.name?.includes('name') || input.id?.includes('name') || input.placeholder?.includes('name')) {
                type = 'name';
            } else if (input.tagName === 'TEXTAREA' || input.name?.includes('message') || input.id?.includes('message')) {
                type = 'message';
            }
            
            if (type !== 'unknown') {
                fields.push({ element: input, type });
            }
        });
        
        return fields;
    }
    
    async executeDataExtraction(config) {
        const websiteContent = document.getElementById('websiteContent');
        if (!websiteContent) throw new Error('No website content available');
        
        const data = {};
        
        if (config.extractText) {
            data.text = websiteContent.innerText;
        }
        
        if (config.extractLinks) {
            data.links = Array.from(websiteContent.querySelectorAll('a[href]'))
                .map(link => ({
                    text: link.textContent.trim(),
                    href: link.href,
                    target: link.target
                }));
        }
        
        if (config.extractImages) {
            data.images = Array.from(websiteContent.querySelectorAll('img'))
                .map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height
                }));
        }
        
        if (config.extractForms) {
            data.forms = Array.from(websiteContent.querySelectorAll('form'))
                .map(form => ({
                    action: form.action,
                    method: form.method,
                    fields: this.detectFormFields(form).map(f => ({
                        type: f.type,
                        name: f.element.name,
                        id: f.element.id,
                        placeholder: f.element.placeholder
                    }))
                }));
        }
        
        return data;
    }
    
    async executeNavigation(config) {
        const websiteContent = document.getElementById('websiteContent');
        if (!websiteContent) throw new Error('No website content available');
        
        if (config.url) {
            websiteContent.src = config.url;
            return { navigatedTo: config.url };
        }
        
        if (config.selector) {
            const link = await window.automationEngine.waitingStrategies.clickable(config.selector);
            if (link) {
                link.click();
                return { clicked: config.selector };
            }
            throw new Error(`Navigation element not found: ${config.selector}`);
        }
        
        throw new Error('No navigation target specified');
    }
    
    async executeCustomScript(config) {
        if (!config.script) throw new Error('No script provided');
        
        const websiteContent = document.getElementById('websiteContent');
        if (!websiteContent) throw new Error('No website content available');
        
        // Create safe execution context
        const context = {
            wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
            querySelector: (selector) => websiteContent.querySelector(selector),
            querySelectorAll: (selector) => websiteContent.querySelectorAll(selector),
            click: async (selector) => {
                const element = await window.automationEngine.waitingStrategies.clickable(selector);
                if (element) element.click();
                return !!element;
            }
        };
        
        const asyncFunction = new Function('context', `
            return (async function() {
                with (context) {
                    ${config.script}
                }
            })();
        `);
        
        const result = await asyncFunction(context);
        return { scriptResult: result };
    }
    
    // Advanced methods for massive parallel automation (100k+ operations)
    
    /**
     * Process up to 100,000 automation operations in parallel
     * Uses intelligent chunking and memory management
     */
    async processMassiveParallel(maxOperations = 100000) {
        if (this.tasks.length > maxOperations) {
            throw new Error(`Too many tasks: ${this.tasks.length}. Maximum allowed: ${maxOperations}`);
        }
        
        console.log(`🚀 Starting massive parallel processing: ${this.tasks.length} operations`);
        
        // Optimize settings for massive operations
        const originalBatchSize = this.batchSize;
        const originalMaxConcurrency = this.maxConcurrency;
        
        // Adaptive settings based on task count
        if (this.tasks.length > 10000) {
            this.batchSize = Math.max(500, Math.min(2000, Math.floor(this.tasks.length / 50)));
            this.maxConcurrency = Math.min(500, Math.max(50, Math.floor(navigator.hardwareConcurrency * 10)));
        } else if (this.tasks.length > 1000) {
            this.batchSize = Math.max(200, Math.min(1000, Math.floor(this.tasks.length / 20)));
            this.maxConcurrency = Math.min(200, Math.max(20, Math.floor(navigator.hardwareConcurrency * 5)));
        }
        
        updateAutomationStatus('MASSIVE_PARALLEL', 
            `🔥 Massive parallel mode: ${this.tasks.length} ops, ${this.maxConcurrency} workers, ${this.batchSize} batch size`);
        
        try {
            const result = await this.processParallel();
            
            // Restore original settings
            this.batchSize = originalBatchSize;
            this.maxConcurrency = originalMaxConcurrency;
            
            return result;
        } catch (error) {
            // Restore settings on error
            this.batchSize = originalBatchSize;
            this.maxConcurrency = originalMaxConcurrency;
            throw error;
        }
    }
    
    /**
     * Create automation tasks for stress testing (up to 100k operations)
     */
    generateStressTestTasks(count = 10000, taskTypes = ['wait', 'click', 'scroll']) {
        const tasks = [];
        
        for (let i = 0; i < count; i++) {
            const taskType = taskTypes[i % taskTypes.length];
            let config;
            
            switch (taskType) {
                case 'wait':
                    config = { duration: Math.floor(Math.random() * 1000) + 100 };
                    break;
                case 'click':
                    config = { selector: `#test-element-${i % 100}` };
                    break;
                case 'scroll':
                    config = { x: 0, y: Math.floor(Math.random() * 1000) };
                    break;
                case 'auto-fill':
                    config = { 
                        name: `Test User ${i}`, 
                        email: `test${i}@example.com` 
                    };
                    break;
                default:
                    config = {};
            }
            
            tasks.push({
                type: taskType,
                config: config,
                priority: Math.floor(Math.random() * 10)
            });
        }
        
        this.addTasks(tasks);
        return tasks;
    }
    
    /**
     * Parallel form filling across multiple forms simultaneously
     */
    async massiveFillForms(formConfigs) {
        const fillTasks = formConfigs.map((config, index) => ({
            type: 'auto-fill',
            config: config,
            priority: config.priority || 0
        }));
        
        this.addTasks(fillTasks);
        
        console.log(`🔄 Mass filling ${fillTasks.length} forms in parallel`);
        return await this.processMassiveParallel();
    }
    
    /**
     * Parallel data extraction from multiple sources
     */
    async massiveDataExtraction(extractionConfigs) {
        const extractTasks = extractionConfigs.map(config => ({
            type: 'extract-data',
            config: config,
            priority: config.priority || 0
        }));
        
        this.addTasks(extractTasks);
        
        console.log(`📊 Mass extracting data from ${extractTasks.length} sources in parallel`);
        return await this.processMassiveParallel();
    }
    
    /**
     * Parallel navigation across multiple pages/sections
     */
    async massiveNavigation(navigationConfigs) {
        const navTasks = navigationConfigs.map(config => ({
            type: 'navigate',
            config: config,
            priority: config.priority || 0
        }));
        
        this.addTasks(navTasks);
        
        console.log(`🧭 Mass navigation across ${navTasks.length} targets in parallel`);
        return await this.processMassiveParallel();
    }
    
    /**
     * Get real-time parallel processing statistics
     */
    getParallelStats() {
        const stats = {
            ...this.parallelMetrics,
            tasksRemaining: this.tasks.filter(t => t.status === 'pending').length,
            tasksProcessing: this.tasks.filter(t => t.status === 'processing').length,
            tasksCompleted: this.tasks.filter(t => t.status === 'completed').length,
            tasksErrors: this.tasks.filter(t => t.status === 'error').length,
            efficiency: this.parallelMetrics.totalOperations > 0 ? 
                (this.parallelMetrics.completedOperations / this.parallelMetrics.totalOperations * 100).toFixed(2) : 0,
            throughput: this.parallelMetrics.averageTaskTime > 0 ? 
                (1000 / this.parallelMetrics.averageTaskTime).toFixed(2) : 0,
            totalMemoryUsage: this.estimateMemoryUsage()
        };
        
        return stats;
    }
    
    /**
     * Cancel all pending tasks (emergency stop for massive operations)
     */
    async emergencyStop() {
        console.warn('🛑 Emergency stop triggered for parallel automation');
        
        // Mark all pending tasks as cancelled
        this.tasks.filter(task => task.status === 'pending').forEach(task => {
            task.status = 'cancelled';
            task.error = 'Emergency stop triggered';
        });
        
        // Wait for current processing to complete
        let attempts = 0;
        while (this.parallelMetrics.currentConcurrency > 0 && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        this.isProcessing = false;
        updateAutomationStatus('STOPPED', 'Emergency stop completed');
        
        return {
            cancelledTasks: this.tasks.filter(task => task.status === 'cancelled').length,
            completedTasks: this.tasks.filter(task => task.status === 'completed').length
        };
    }
}

// Performance monitoring for automation tasks
class AutomationPerformanceMonitor {
    constructor() {
        this.metrics = {
            taskExecutions: [],
            averageResponseTime: 0,
            successRate: 0,
            memoryUsage: [],
            cpuUsage: []
        };
    }
    
    startTask(taskName) {
        return {
            taskName,
            startTime: performance.now(),
            startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
        };
    }
    
    endTask(taskContext, success = true, error = null) {
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        const execution = {
            taskName: taskContext.taskName,
            duration: endTime - taskContext.startTime,
            memoryDelta: endMemory - taskContext.startMemory,
            success,
            error,
            timestamp: Date.now()
        };
        
        this.metrics.taskExecutions.push(execution);
        
        // Keep only last 100 executions for memory efficiency
        if (this.metrics.taskExecutions.length > 100) {
            this.metrics.taskExecutions.shift();
        }
        
        this.updateAggregatedMetrics();
        return execution;
    }
    
    updateAggregatedMetrics() {
        const executions = this.metrics.taskExecutions;
        if (executions.length === 0) return;
        
        // Calculate average response time
        const totalDuration = executions.reduce((sum, exec) => sum + exec.duration, 0);
        this.metrics.averageResponseTime = totalDuration / executions.length;
        
        // Calculate success rate
        const successCount = executions.filter(exec => exec.success).length;
        this.metrics.successRate = (successCount / executions.length) * 100;
        
        // Memory usage tracking
        if (performance.memory) {
            this.metrics.memoryUsage.push({
                timestamp: Date.now(),
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            });
            
            // Keep only last 50 memory samples
            if (this.metrics.memoryUsage.length > 50) {
                this.metrics.memoryUsage.shift();
            }
        }
    }
    
    getReport() {
        return {
            totalExecutions: this.metrics.taskExecutions.length,
            averageResponseTime: Math.round(this.metrics.averageResponseTime),
            successRate: Math.round(this.metrics.successRate * 100) / 100,
            recentExecutions: this.metrics.taskExecutions.slice(-10),
            memoryTrend: this.metrics.memoryUsage.slice(-10)
        };
    }
}

// Initialize global automation utilities with massive parallel support
window.automationBatch = new AutomationBatch({
    maxConcurrency: 100, // Default concurrent workers
    batchSize: 1000,     // Default batch size
    enableParallel: true, // Enable parallel processing by default
    progressCallback: (progress) => {
        // Real-time progress updates for massive operations
        if (window.updateAutomationProgress) {
            window.updateAutomationProgress(progress);
        }
        console.log(`📊 Progress: ${progress.completed}/${progress.total} (${(progress.completed/progress.total*100).toFixed(1)}%)`);
    }
});

window.automationMonitor = new AutomationPerformanceMonitor();

// Add global functions for massive parallel operations
window.automationMassive = {
    // Stress test with configurable operations
    async stressTest(operationCount = 10000) {
        console.log(`🔥 Starting stress test with ${operationCount} operations`);
        const batch = new AutomationBatch({ maxConcurrency: 200, batchSize: 500 });
        batch.generateStressTestTasks(operationCount);
        return await batch.processMassiveParallel();
    },
    
    // Mass form filling
    async fillManyForms(count = 1000) {
        const formConfigs = Array.from({ length: count }, (_, i) => ({
            name: `User ${i}`,
            email: `user${i}@test.com`,
            phone: `555-${String(i).padStart(4, '0')}`,
            priority: Math.floor(i / 100) // Group by priority
        }));
        
        return await window.automationBatch.massiveFillForms(formConfigs);
    },
    
    // Emergency stop all operations
    async emergencyStop() {
        return await window.automationBatch.emergencyStop();
    },
    
    // Get real-time stats
    getStats() {
        return window.automationBatch.getParallelStats();
    }
};

// Enhanced automation templates with new features
function getEnhancedAutomationTemplates() {
    return {
        'smart-form-filler': {
            name: 'Smart Form Filler',
            description: 'Intelligently detect and fill form fields with advanced validation',
            script: `// Smart form filling with validation
const batch = new AutomationBatch();
batch.addTask('auto-fill', {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    message: 'This is an automated message with smart detection'
});

const result = await batch.processAll();
console.log('Form filling completed:', result);`
        },
        
        'data-harvester': {
            name: 'Advanced Data Harvester',
            description: 'Extract comprehensive data from web pages with structure analysis',
            script: `// Advanced data extraction
const batch = new AutomationBatch();
batch.addTask('extract-data', {
    extractText: true,
    extractLinks: true,
    extractImages: true,
    extractForms: true
});

const result = await batch.processAll();
console.log('Data extraction completed:', result);

// Save to localStorage for later use
localStorage.setItem('extractedData', JSON.stringify(result.tasks[0].result));`
        },
        
        'performance-tester': {
            name: 'Performance Testing Suite',
            description: 'Comprehensive performance testing and monitoring',
            script: `// Performance testing automation
const monitor = window.automationMonitor;
const testTasks = [
    () => document.querySelectorAll('*').length, // DOM complexity
    () => Array.from(document.images).filter(img => img.complete).length, // Image loading
    () => document.readyState, // Document state
    () => performance.navigation.type // Navigation type
];

for (let i = 0; i < testTasks.length; i++) {
    const taskContext = monitor.startTask(\`performance-test-\${i}\`);
    try {
        const result = testTasks[i]();
        monitor.endTask(taskContext, true);
        console.log(\`Test \${i} result:\`, result);
    } catch (error) {
        monitor.endTask(taskContext, false, error);
    }
    await wait(1000);
}

const report = monitor.getReport();
console.log('Performance report:', report);`
        },
        
        'intelligent-navigator': {
            name: 'Intelligent Page Navigator',
            description: 'Smart navigation with content analysis and breadcrumb tracking',
            script: `// Intelligent navigation with analysis
const links = Array.from(document.querySelectorAll('a[href]'))
    .filter(link => link.href && !link.href.startsWith('javascript:'))
    .slice(0, 5);

for (const link of links) {
    const taskContext = window.automationMonitor.startTask('navigation');
    try {
        console.log('Navigating to:', link.textContent.trim(), link.href);
        
        // Smart clicking with validation
        const clickable = await window.automationEngine.waitingStrategies.clickable(
            getSmartSelector(link), 5000
        );
        
        if (clickable) {
            clickable.click();
            await wait(3000); // Wait for page load
            
            // Analyze new page content
            const pageInfo = {
                title: document.title,
                headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.textContent.trim()),
                wordCount: document.body.textContent.split(/\\s+/).length,
                imageCount: document.images.length
            };
            
            console.log('Page analysis:', pageInfo);
            window.automationMonitor.endTask(taskContext, true);
        } else {
            throw new Error('Link not clickable');
        }
    } catch (error) {
        window.automationMonitor.endTask(taskContext, false, error);
        console.error('Navigation error:', error);
    }
    
    await wait(2000);
}`
        },
        
        'massive-parallel-demo': {
            name: '🚀 Massive Parallel Demo (10K Operations)',
            description: 'Demonstrate massive parallel processing with 10,000 automation operations',
            script: `// Massive parallel processing demonstration
console.log('🔥 Starting massive parallel demo with 10,000 operations...');

const batch = new AutomationBatch({
    maxConcurrency: 200,    // 200 parallel workers
    batchSize: 500,         // Process in chunks of 500
    enableParallel: true,
    progressCallback: (progress) => {
        console.log(\`Progress: \${progress.completed}/\${progress.total} (\${(progress.completed/progress.total*100).toFixed(1)}%)\`);
    }
});

// Generate 10,000 test operations
batch.generateStressTestTasks(10000, ['wait', 'scroll', 'click']);

const startTime = Date.now();
const result = await batch.processMassiveParallel();
const totalTime = Date.now() - startTime;

console.log(\`🎉 Completed \${result.totalTasks} operations in \${(totalTime/1000).toFixed(2)}s\`);
console.log(\`⚡ Throughput: \${(result.totalTasks / totalTime * 1000).toFixed(0)} ops/sec\`);
console.log(\`✅ Success rate: \${(result.successCount/result.totalTasks*100).toFixed(1)}%\`);`
        },
        
        'parallel-form-filling': {
            name: '📝 Parallel Form Filling (1K Forms)',
            description: 'Fill 1,000 forms simultaneously with intelligent field detection',
            script: `// Mass parallel form filling
console.log('📝 Starting parallel form filling for 1,000 forms...');

const formConfigs = Array.from({ length: 1000 }, (_, i) => ({
    name: \`User \${i + 1}\`,
    email: \`user\${i + 1}@parallel-test.com\`,
    phone: \`555-\${String(i + 1).padStart(4, '0')}\`,
    message: \`Automated message \${i + 1} from parallel processing\`,
    priority: Math.floor(i / 100) // Prioritize in groups
}));

const result = await window.automationBatch.massiveFillForms(formConfigs);

console.log(\`📊 Form filling results:\`);
console.log(\`   Total forms: \${result.totalTasks}\`);
console.log(\`   Successful: \${result.successCount}\`);
console.log(\`   Failed: \${result.errorCount}\`);
console.log(\`   Time: \${(result.totalTime/1000).toFixed(2)}s\`);
console.log(\`   Forms/sec: \${result.tasksPerSecond}\`);`
        },
        
        'stress-test-100k': {
            name: '💪 Ultimate Stress Test (100K Operations)',
            description: 'Push the limits with 100,000 parallel automation operations',
            script: `// Ultimate stress test with 100,000 operations
console.warn('⚠️  This will run 100,000 operations in parallel!');
console.log('🚀 Initializing ultimate stress test...');

// Create high-performance batch configuration
const batch = new AutomationBatch({
    maxConcurrency: 500,    // Maximum parallel workers
    batchSize: 2000,        // Large batch sizes for efficiency
    enableParallel: true,
    memoryThreshold: 0.9,   // Aggressive memory management
    progressCallback: (progress) => {
        if (progress.completed % 10000 === 0) {
            console.log(\`🔥 Milestone: \${progress.completed}/\${progress.total} operations completed\`);
        }
    }
});

// Generate 100,000 test operations with varied types
const operationTypes = ['wait', 'scroll', 'click', 'auto-fill'];
batch.generateStressTestTasks(100000, operationTypes);

console.log('🎯 Starting 100K parallel operations...');
const startTime = performance.now();

try {
    const result = await batch.processMassiveParallel(100000);
    const totalTime = performance.now() - startTime;
    
    console.log('🎉 STRESS TEST COMPLETED!');
    console.log(\`📊 Results:\`);
    console.log(\`   Operations: \${result.totalTasks.toLocaleString()}\`);
    console.log(\`   Successful: \${result.successCount.toLocaleString()}\`);
    console.log(\`   Failed: \${result.errorCount.toLocaleString()}\`);
    console.log(\`   Total time: \${(totalTime/1000).toFixed(2)}s\`);
    console.log(\`   Throughput: \${Math.round(result.totalTasks / totalTime * 1000).toLocaleString()} ops/sec\`);
    console.log(\`   Success rate: \${(result.successCount/result.totalTasks*100).toFixed(2)}%\`);
    
} catch (error) {
    console.error('❌ Stress test failed:', error);
} finally {
    // Cleanup and memory recovery
    await batch.performMemoryCleanup();
    console.log('🧹 Memory cleanup completed');
}`
        },
        
        'parallel-monitoring': {
            name: '📊 Real-time Parallel Monitoring',
            description: 'Monitor parallel automation performance in real-time',
            script: `// Real-time parallel processing monitor
console.log('📊 Starting real-time parallel monitoring...');

// Start a background operation to monitor
const batch = new AutomationBatch({
    maxConcurrency: 100,
    batchSize: 200,
    enableParallel: true
});

// Generate background operations
batch.generateStressTestTasks(5000, ['wait', 'scroll']);

// Start monitoring before processing
const monitorInterval = setInterval(() => {
    const stats = batch.getParallelStats();
    console.clear();
    console.log('🔄 REAL-TIME PARALLEL AUTOMATION MONITOR');
    console.log('═══════════════════════════════════════');
    console.log(\`📈 Total Operations: \${stats.totalOperations}\`);
    console.log(\`✅ Completed: \${stats.tasksCompleted}\`);
    console.log(\`⚡ Processing: \${stats.tasksProcessing}\`);
    console.log(\`⏳ Remaining: \${stats.tasksRemaining}\`);
    console.log(\`❌ Errors: \${stats.tasksErrors}\`);
    console.log(\`🎯 Efficiency: \${stats.efficiency}%\`);
    console.log(\`🚀 Throughput: \${stats.throughput} ops/sec\`);
    console.log(\`🧠 Memory Usage: \${(stats.totalMemoryUsage * 100).toFixed(1)}%\`);
    console.log(\`⚙️  Current Workers: \${stats.currentConcurrency}\`);
    console.log(\`📊 Peak Workers: \${stats.peakConcurrency}\`);
    
    if (!batch.isProcessing) {
        clearInterval(monitorInterval);
        console.log('\\n🎉 Monitoring completed!');
    }
}, 500);

// Start the batch processing
batch.processAll().then(result => {
    console.log('\\n📋 Final Results:', result);
});`
        }
    };
}

// Parallel Processing UI Controls and Real-time Updates
document.addEventListener('DOMContentLoaded', function() {
    // Initialize parallel processing controls
    initParallelProcessingUI();
});

function initParallelProcessingUI() {
    // Slider value updates
    const maxConcurrencySlider = document.getElementById('maxConcurrency');
    const batchSizeSlider = document.getElementById('batchSize');
    const concurrencyValue = document.getElementById('concurrencyValue');
    const batchSizeValue = document.getElementById('batchSizeValue');
    
    if (maxConcurrencySlider && concurrencyValue) {
        maxConcurrencySlider.addEventListener('input', function() {
            concurrencyValue.textContent = this.value;
            if (window.automationBatch) {
                window.automationBatch.maxConcurrency = parseInt(this.value);
            }
        });
    }
    
    if (batchSizeSlider && batchSizeValue) {
        batchSizeSlider.addEventListener('input', function() {
            batchSizeValue.textContent = this.value;
            if (window.automationBatch) {
                window.automationBatch.batchSize = parseInt(this.value);
            }
        });
    }
    
    // Start parallel test button
    const startParallelTest = document.getElementById('startParallelTest');
    if (startParallelTest) {
        startParallelTest.addEventListener('click', async function() {
            const operationCount = parseInt(document.getElementById('operationCount').value);
            const maxConcurrency = parseInt(document.getElementById('maxConcurrency').value);
            const batchSize = parseInt(document.getElementById('batchSize').value);
            
            addToParallelLog(`🚀 Starting parallel test with ${operationCount.toLocaleString()} operations`);
            addToParallelLog(`⚙️  Configuration: ${maxConcurrency} workers, ${batchSize} batch size`);
            
            this.disabled = true;
            document.getElementById('emergencyStopParallel').disabled = false;
            
            try {
                // Create new batch with current settings
                const testBatch = new AutomationBatch({
                    maxConcurrency: maxConcurrency,
                    batchSize: batchSize,
                    enableParallel: true,
                    progressCallback: updateParallelProgress
                });
                
                // Generate test operations
                testBatch.generateStressTestTasks(operationCount, ['wait', 'scroll', 'click']);
                
                // Start processing
                const startTime = performance.now();
                const result = await testBatch.processMassiveParallel();
                const totalTime = performance.now() - startTime;
                
                // Display results
                addToParallelLog(`🎉 Test completed successfully!`);
                addToParallelLog(`📊 Results: ${result.successCount}/${result.totalTasks} successful`);
                addToParallelLog(`⚡ Performance: ${(result.totalTasks / totalTime * 1000).toFixed(0)} ops/sec`);
                addToParallelLog(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
                
            } catch (error) {
                addToParallelLog(`❌ Test failed: ${error.message}`, 'error');
                console.error('Parallel test error:', error);
            } finally {
                this.disabled = false;
                document.getElementById('emergencyStopParallel').disabled = true;
            }
        });
    }
    
    // Emergency stop button
    const emergencyStop = document.getElementById('emergencyStopParallel');
    if (emergencyStop) {
        emergencyStop.addEventListener('click', async function() {
            addToParallelLog(`🛑 Emergency stop triggered!`, 'warning');
            
            if (window.automationBatch) {
                const result = await window.automationBatch.emergencyStop();
                addToParallelLog(`🔴 Stopped: ${result.cancelledTasks} cancelled, ${result.completedTasks} completed`);
            }
            
            this.disabled = true;
            document.getElementById('startParallelTest').disabled = false;
        });
    }
    
    // Clear log button
    const clearLog = document.getElementById('clearParallelLog');
    if (clearLog) {
        clearLog.addEventListener('click', function() {
            const log = document.getElementById('parallelLog');
            if (log) {
                log.innerHTML = '<div class="text-success">🚀 Parallel automation system ready</div>';
            }
        });
    }
    
    // Export results button
    const exportResults = document.getElementById('exportParallelResults');
    if (exportResults) {
        exportResults.addEventListener('click', function() {
            if (window.automationBatch) {
                const stats = window.automationBatch.getParallelStats();
                const exportData = {
                    timestamp: new Date().toISOString(),
                    configuration: {
                        maxConcurrency: window.automationBatch.maxConcurrency,
                        batchSize: window.automationBatch.batchSize
                    },
                    statistics: stats,
                    tasks: window.automationBatch.tasks.map(task => ({
                        id: task.id,
                        type: task.type,
                        status: task.status,
                        startTime: task.startTime,
                        endTime: task.endTime,
                        duration: task.endTime ? task.endTime - task.startTime : null
                    }))
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `parallel-automation-results-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                addToParallelLog(`📥 Results exported successfully`);
            }
        });
    }
}

// Global progress update function for parallel operations
window.updateAutomationProgress = function(progress) {
    // Update parallel stats in the main status bar
    const parallelStats = document.getElementById('parallelStats');
    if (parallelStats && progress.total > 100) { // Only show for large operations
        parallelStats.classList.remove('d-none');
        
        // Update individual elements
        updateElement('parallelTotal', progress.total.toLocaleString());
        updateElement('parallelCompleted', progress.completed.toLocaleString());
        updateElement('parallelActive', (progress.total - progress.completed).toLocaleString());
        
        // Update progress bar
        const progressBar = document.getElementById('parallelProgress');
        if (progressBar) {
            const percentage = (progress.completed / progress.total * 100).toFixed(1);
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
        }
        
        // Calculate and update throughput
        const currentTime = Date.now();
        if (!window.parallelStartTime) {
            window.parallelStartTime = currentTime;
        }
        
        const elapsedSeconds = (currentTime - window.parallelStartTime) / 1000;
        const throughput = elapsedSeconds > 0 ? (progress.completed / elapsedSeconds).toFixed(0) : '0';
        updateElement('parallelThroughput', throughput);
    }
    
    // Update modal statistics if open
    updateModalStatistics(progress);
};

function updateModalStatistics(progress) {
    const modal = document.getElementById('parallelControlModal');
    if (modal && modal.classList.contains('show')) {
        // Update main stats
        updateElement('statsTotal', progress.total?.toLocaleString() || '0');
        updateElement('statsCompleted', progress.completed?.toLocaleString() || '0');
        updateElement('statsProcessing', (progress.total - progress.completed)?.toLocaleString() || '0');
        
        // Update progress bar in modal
        const progressBar = document.getElementById('parallelProgressBar');
        const progressPercent = document.getElementById('progressPercent');
        if (progressBar && progress.total > 0) {
            const percentage = (progress.completed / progress.total * 100).toFixed(1);
            progressBar.style.width = percentage + '%';
            if (progressPercent) {
                progressPercent.textContent = percentage + '%';
            }
        }
        
        // Update throughput
        const currentTime = Date.now();
        if (window.parallelStartTime) {
            const elapsedSeconds = (currentTime - window.parallelStartTime) / 1000;
            const throughput = elapsedSeconds > 0 ? (progress.completed / elapsedSeconds).toFixed(0) : '0';
            updateElement('statsThroughput', throughput);
        }
        
        // Update parallel stats if available
        if (window.automationBatch) {
            const stats = window.automationBatch.getParallelStats();
            updateElement('statsPeakWorkers', stats.peakConcurrency || '0');
            updateElement('statsCurrentWorkers', stats.currentConcurrency || '0');
            updateElement('statsEfficiency', stats.efficiency + '%' || '0%');
            updateElement('statsMemory', (stats.totalMemoryUsage * 100).toFixed(1) + '%' || '0%');
        }
    }
}

function addToParallelLog(message, type = 'info') {
    const log = document.getElementById('parallelLog');
    if (log) {
        const timestamp = new Date().toLocaleTimeString();
        let className = 'text-light';
        let icon = 'ℹ️';
        
        switch (type) {
            case 'success':
                className = 'text-success';
                icon = '✅';
                break;
            case 'warning':
                className = 'text-warning';
                icon = '⚠️';
                break;
            case 'error':
                className = 'text-danger';
                icon = '❌';
                break;
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = className;
        logEntry.textContent = `[${timestamp}] ${icon} ${message}`;
        
        log.appendChild(logEntry);
        log.scrollTop = log.scrollHeight;
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Initialize parallel start time when automation starts
const originalUpdateAutomationStatus = window.updateAutomationStatus || function() {};
window.updateAutomationStatus = function(status, description) {
    if (status === 'BATCH_PROCESSING' || status === 'MASSIVE_PARALLEL') {
        window.parallelStartTime = Date.now();
    } else if (status === 'READY') {
        window.parallelStartTime = null;
        // Hide parallel stats when done
        const parallelStats = document.getElementById('parallelStats');
        if (parallelStats) {
            setTimeout(() => parallelStats.classList.add('d-none'), 2000);
        }
    }
    
    // Call original function
    originalUpdateAutomationStatus(status, description);
};
