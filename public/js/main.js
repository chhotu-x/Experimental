// Main JavaScript for 42Web.io

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initSmoothScrolling();
    initFormValidation();
    initAnimations();
    initNavbar();
    initWebsiteEmbedder();
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
    const websiteFrame = document.getElementById('websiteFrame');
    const currentUrlInput = document.getElementById('currentUrl');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const iframeContainer = document.getElementById('iframeContainer');
    
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
    function loadWebsite(url) {
        if (!isValidUrl(url)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }
        
        // Show container and loading
        websiteContainer.classList.remove('d-none');
        quickLinksSection.classList.add('d-none');
        loadingIndicator.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        iframeContainer.style.display = 'none';
        
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
        
        // Clear previous iframe
        websiteFrame.src = 'about:blank';
        
        // Enhanced load detection
        let hasLoaded = false;
        let loadTimeout;
        
        // Handle iframe load
        websiteFrame.onload = function() {
            if (websiteFrame.src === 'about:blank') return; // Ignore blank loads
            
            hasLoaded = true;
            clearTimeout(loadTimeout);
            
            // Delay to check if content actually loaded
            setTimeout(() => {
                try {
                    const iframeDoc = websiteFrame.contentDocument || websiteFrame.contentWindow.document;
                    const iframeWin = websiteFrame.contentWindow;
                    
                    // Check if we can access the document (same-origin)
                    if (iframeDoc) {
                        // Same-origin - check if content is there
                        if (iframeDoc.body && iframeDoc.body.innerHTML.trim() === '') {
                            showError('Website appears to be empty or returned no content', url);
                            return;
                        }
                        
                        // Check for error pages or blocked content
                        const title = iframeDoc.title.toLowerCase();
                        const bodyText = iframeDoc.body ? iframeDoc.body.textContent.toLowerCase() : '';
                        
                        if (title.includes('blocked') || title.includes('forbidden') || 
                            bodyText.includes('blocked') || bodyText.includes('forbidden') ||
                            bodyText.includes('not allowed') || bodyText.includes('access denied')) {
                            showError('Website blocked iframe embedding', url);
                            return;
                        }
                    } else if (iframeWin) {
                        // Cross-origin - try to detect if it's actually blocked
                        try {
                            // If we can access location, it's not properly sandboxed
                            const loc = iframeWin.location.href;
                            if (loc === 'about:blank' || loc.includes('chrome-error://')) {
                                showError('Website refused to load in iframe', url);
                                return;
                            }
                        } catch (e) {
                            // This is expected for cross-origin frames
                            // If we get here, the iframe likely loaded successfully
                        }
                    }
                    
                    // If we get here, assume successful load
                    loadingIndicator.classList.add('d-none');
                    iframeContainer.style.display = 'block';
                    
                } catch (e) {
                    // Cross-origin frame - assume successful load if no other errors
                    loadingIndicator.classList.add('d-none');
                    iframeContainer.style.display = 'block';
                }
            }, 500); // Give time for content to render
        };
        
        // Handle iframe error
        websiteFrame.onerror = function() {
            hasLoaded = true;
            clearTimeout(loadTimeout);
            showError('Failed to load the website due to network or security restrictions', url);
        };
        
        // Set iframe source after setting up handlers
        websiteFrame.src = url;
        
        // Timeout fallback with better detection
        loadTimeout = setTimeout(() => {
            if (!hasLoaded) {
                showError('Website took too long to respond. It may be unavailable or blocking iframe embedding', url);
            }
        }, 10000); // Reduced timeout for better UX
    }
    
    // Show error function
    function showError(message, url) {
        loadingIndicator.classList.add('d-none');
        iframeContainer.style.display = 'none';
        errorMessage.classList.remove('d-none');
        errorText.textContent = message;
        
        // Add suggestions based on URL
        const suggestions = document.getElementById('errorSuggestions');
        if (suggestions && url) {
            let suggestionText = '';
            
            if (url.includes('example.com') || url.includes('google.com') || url.includes('facebook.com') || 
                url.includes('youtube.com') || url.includes('twitter.com') || url.includes('instagram.com') ||
                url.includes('github.com') || url.includes('linkedin.com') || url.includes('reddit.com')) {
                suggestionText = 'Popular sites like Google, Facebook, YouTube, GitHub, and social media platforms typically block embedding for security reasons. Try the "Demo Page" above instead!';
            } else if (url.includes('github.com') || url.includes('stackoverflow.com')) {
                suggestionText = 'Developer sites often block embedding. Try using their API or viewing directly in a new tab.';
            } else if (url.includes('bank') || url.includes('paypal') || url.includes('stripe')) {
                suggestionText = 'Financial and payment sites always block embedding for security. This is normal and expected.';
            } else {
                suggestionText = 'Try the "Demo Page (Always Works)" button above to test that embedding works correctly. Then try other embed-friendly sites.';
            }
            
            suggestions.innerHTML = `<i class="fas fa-lightbulb me-1"></i>${suggestionText}`;
            suggestions.style.display = 'block';
        }
    }
    
    // URL validation
    function isValidUrl(string) {
        // Allow relative URLs for local demo pages
        if (string.startsWith('/')) {
            return true;
        }
        
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            // Check for data URLs
            if (string.startsWith('data:')) {
                return true;
            }
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
            websiteFrame.src = 'about:blank';
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
