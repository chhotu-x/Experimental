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
                const proxyUrl = `/proxy?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                
                if (response.ok) {
                    const loadTime = performance.now() - startTime;
                    const htmlContent = await response.text();
                    const cacheStatus = response.headers.get('X-Cache') || 'MISS';
                    
                    // Store performance metrics
                    performanceMetrics = {
                        loadTime: Math.round(loadTime),
                        cacheStatus,
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
                    
                    // Update performance display
                    updateStatsDisplay(`${loadTime.toFixed(0)}ms`, cacheStatus);
                    
                    // Track successful load
                    console.log(`Successfully loaded ${url} in ${loadTime.toFixed(2)}ms`);
                    
                } else {
                    // Enhanced error handling
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
                console.error('Enhanced load error:', error);
                let errorMessage = 'Network error: Unable to connect to the website';
                
                if (error.name === 'TypeError') {
                    errorMessage = 'Network connection failed. Please check your internet connection.';
                } else if (error.name === 'AbortError') {
                    errorMessage = 'Request was cancelled or timed out.';
                }
                
                showError(errorMessage);
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
        
        // Enhanced error display
        function showError(message) {
            elements.loadingIndicator.classList.add('d-none');
            elements.websiteContent.style.display = 'none';
            elements.websiteContent.classList.remove('loading');
            elements.errorMessage.classList.remove('d-none');
            elements.errorText.textContent = message;
            
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
