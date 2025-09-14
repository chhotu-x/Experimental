/**
 * 🧠 AI-Powered Element Detection System
 * Advanced element detection with machine learning patterns and intelligent fallbacks
 */

class AIElementDetector {
    constructor() {
        this.selectorCache = new Map();
        this.performanceCache = new Map();
        this.contextAnalyzer = new ContextAnalyzer();
        this.fallbackStrategies = new FallbackStrategies();
        this.selectorOptimizer = new SelectorOptimizer();
        
        // AI training data for selector patterns
        this.trainingData = {
            commonPatterns: [
                { pattern: 'button[type="submit"]', success: 0.95, context: 'form' },
                { pattern: 'input[type="email"]', success: 0.92, context: 'form' },
                { pattern: '.btn-primary', success: 0.88, context: 'action' },
                { pattern: '#submit', success: 0.85, context: 'form' }
            ],
            contextRules: new Map(),
            successMetrics: new Map()
        };
        
        this.initialize();
    }

    async initialize() {
        // Load cached patterns
        await this.loadCachedPatterns();
        
        // Initialize context analyzer
        await this.contextAnalyzer.initialize();
        
        // Train initial patterns
        this.trainInitialPatterns();
        
        console.log('🧠 AI Element Detector initialized');
    }

    /**
     * Find element using AI-powered detection
     */
    async findElement(selector, options = {}) {
        const detectionStart = performance.now();
        const context = await this.analyzeContext(options);
        
        try {
            // Try cached selector first
            const cachedResult = this.getCachedSelector(selector, context);
            if (cachedResult) {
                return await this.validateCachedElement(cachedResult, options);
            }

            // Generate intelligent selectors
            const intelligentSelectors = await this.generateIntelligentSelectors(selector, context);
            
            // Try selectors in order of predicted success
            for (const selectorInfo of intelligentSelectors) {
                const element = await this.trySelector(selectorInfo, options);
                if (element) {
                    // Cache successful selector
                    this.cacheSuccessfulSelector(selector, selectorInfo, context);
                    return element;
                }
            }

            // Use fallback strategies
            return await this.fallbackStrategies.findElement(selector, context, options);
            
        } finally {
            this.recordDetectionPerformance(selector, performance.now() - detectionStart);
        }
    }

    /**
     * Generate intelligent selectors based on context and AI patterns
     */
    async generateIntelligentSelectors(originalSelector, context) {
        const selectors = [];
        
        // Analyze selector type and generate variations
        const selectorType = this.analyzeSelectorType(originalSelector);
        
        switch (selectorType) {
            case 'id':
                selectors.push(...this.generateIdSelectors(originalSelector, context));
                break;
            case 'class':
                selectors.push(...this.generateClassSelectors(originalSelector, context));
                break;
            case 'attribute':
                selectors.push(...this.generateAttributeSelectors(originalSelector, context));
                break;
            case 'text':
                selectors.push(...this.generateTextSelectors(originalSelector, context));
                break;
            default:
                selectors.push(...this.generateGenericSelectors(originalSelector, context));
        }

        // Add context-aware selectors
        selectors.push(...this.generateContextAwareSelectors(originalSelector, context));
        
        // Sort by predicted success rate
        return this.sortBySuccessProbability(selectors, context);
    }

    generateIdSelectors(selector, context) {
        const id = selector.replace('#', '');
        return [
            { selector: `#${id}`, priority: 0.95, type: 'exact_id' },
            { selector: `[id="${id}"]`, priority: 0.90, type: 'attribute_id' },
            { selector: `[id*="${id}"]`, priority: 0.75, type: 'partial_id' },
            { selector: `[id^="${id}"]`, priority: 0.70, type: 'starts_with_id' },
            { selector: `[id$="${id}"]`, priority: 0.65, type: 'ends_with_id' }
        ];
    }

    generateClassSelectors(selector, context) {
        const className = selector.replace('.', '');
        return [
            { selector: `.${className}`, priority: 0.85, type: 'exact_class' },
            { selector: `[class*="${className}"]`, priority: 0.75, type: 'partial_class' },
            { selector: `[class^="${className}"]`, priority: 0.70, type: 'starts_with_class' },
            { selector: `[class$="${className}"]`, priority: 0.65, type: 'ends_with_class' }
        ];
    }

    generateAttributeSelectors(selector, context) {
        const match = selector.match(/\[([^=]+)=?"?([^"]*)"?\]/);
        if (!match) return [];
        
        const [, attr, value] = match;
        return [
            { selector: `[${attr}="${value}"]`, priority: 0.90, type: 'exact_attribute' },
            { selector: `[${attr}*="${value}"]`, priority: 0.75, type: 'partial_attribute' },
            { selector: `[${attr}^="${value}"]`, priority: 0.70, type: 'starts_with_attribute' },
            { selector: `[${attr}$="${value}"]`, priority: 0.65, type: 'ends_with_attribute' },
            { selector: `[${attr}]`, priority: 0.60, type: 'attribute_exists' }
        ];
    }

    generateTextSelectors(selector, context) {
        const text = selector.replace(/['"]/g, '');
        return [
            { selector: `//*[text()="${text}"]`, priority: 0.80, type: 'exact_text', xpath: true },
            { selector: `//*[contains(text(),"${text}")]`, priority: 0.70, type: 'partial_text', xpath: true },
            { selector: `//*[normalize-space(text())="${text.trim()}"]`, priority: 0.75, type: 'normalized_text', xpath: true }
        ];
    }

    generateGenericSelectors(selector, context) {
        // For complex selectors, try variations
        return [
            { selector: selector, priority: 0.85, type: 'original' },
            { selector: selector.toLowerCase(), priority: 0.70, type: 'lowercase' },
            { selector: selector.replace(/\s+/g, ' '), priority: 0.65, type: 'normalized_spaces' }
        ];
    }

    generateContextAwareSelectors(selector, context) {
        const contextSelectors = [];
        
        // Add context-specific improvements
        if (context.formContext) {
            contextSelectors.push(...this.generateFormContextSelectors(selector, context));
        }
        
        if (context.navigationContext) {
            contextSelectors.push(...this.generateNavigationSelectors(selector, context));
        }
        
        if (context.modalContext) {
            contextSelectors.push(...this.generateModalSelectors(selector, context));
        }
        
        return contextSelectors;
    }

    generateFormContextSelectors(selector, context) {
        return [
            { selector: `form ${selector}`, priority: 0.80, type: 'form_scoped' },
            { selector: `fieldset ${selector}`, priority: 0.75, type: 'fieldset_scoped' },
            { selector: `.form-group ${selector}`, priority: 0.70, type: 'form_group_scoped' }
        ];
    }

    generateNavigationSelectors(selector, context) {
        return [
            { selector: `nav ${selector}`, priority: 0.80, type: 'nav_scoped' },
            { selector: `.navbar ${selector}`, priority: 0.75, type: 'navbar_scoped' },
            { selector: `header ${selector}`, priority: 0.70, type: 'header_scoped' }
        ];
    }

    generateModalSelectors(selector, context) {
        return [
            { selector: `.modal ${selector}`, priority: 0.85, type: 'modal_scoped' },
            { selector: `.modal-body ${selector}`, priority: 0.80, type: 'modal_body_scoped' },
            { selector: `.modal-content ${selector}`, priority: 0.75, type: 'modal_content_scoped' }
        ];
    }

    /**
     * Try a selector and return element if found
     */
    async trySelector(selectorInfo, options) {
        try {
            let element;
            
            if (selectorInfo.xpath) {
                element = this.findByXPath(selectorInfo.selector);
            } else {
                element = document.querySelector(selectorInfo.selector);
            }
            
            if (element && this.isElementValid(element, options)) {
                return element;
            }
            
            return null;
        } catch (error) {
            console.debug(`Selector failed: ${selectorInfo.selector}`, error);
            return null;
        }
    }

    findByXPath(xpath) {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
    }

    isElementValid(element, options) {
        // Check visibility if required
        if (options.mustBeVisible !== false) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            if (rect.width === 0 || rect.height === 0 || 
                style.visibility === 'hidden' || 
                style.display === 'none') {
                return false;
            }
        }

        // Check if element is enabled if required
        if (options.mustBeEnabled !== false && element.disabled) {
            return false;
        }

        // Custom validation function
        if (options.validator && !options.validator(element)) {
            return false;
        }

        return true;
    }

    /**
     * Analyze page context for better element detection
     */
    async analyzeContext(options) {
        const context = {
            url: window.location.href,
            title: document.title,
            formContext: this.detectFormContext(),
            modalContext: this.detectModalContext(),
            navigationContext: this.detectNavigationContext(),
            framework: this.detectFramework(),
            timestamp: Date.now()
        };

        // Add user-provided context
        if (options.context) {
            Object.assign(context, options.context);
        }

        return context;
    }

    detectFormContext() {
        return {
            hasForm: document.querySelector('form') !== null,
            formCount: document.querySelectorAll('form').length,
            hasSubmitButton: document.querySelector('input[type="submit"], button[type="submit"]') !== null
        };
    }

    detectModalContext() {
        return {
            hasModal: document.querySelector('.modal, [role="dialog"]') !== null,
            modalVisible: document.querySelector('.modal.show, .modal.in') !== null
        };
    }

    detectNavigationContext() {
        return {
            hasNav: document.querySelector('nav') !== null,
            hasNavbar: document.querySelector('.navbar') !== null
        };
    }

    detectFramework() {
        // Detect common frameworks
        if (window.React) return 'react';
        if (window.Vue) return 'vue';
        if (window.angular) return 'angular';
        if (window.jQuery) return 'jquery';
        if (document.querySelector('[ng-app]')) return 'angularjs';
        
        return 'vanilla';
    }

    /**
     * Sort selectors by success probability
     */
    sortBySuccessProbability(selectors, context) {
        return selectors
            .map(selector => ({
                ...selector,
                probability: this.calculateSuccessProbability(selector, context)
            }))
            .sort((a, b) => b.probability - a.probability);
    }

    calculateSuccessProbability(selector, context) {
        let baseProbability = selector.priority || 0.5;
        
        // Adjust based on historical success
        const historicalSuccess = this.getHistoricalSuccess(selector.selector, context);
        if (historicalSuccess) {
            baseProbability = (baseProbability + historicalSuccess) / 2;
        }

        // Adjust based on context
        baseProbability *= this.getContextMultiplier(selector, context);
        
        // Adjust based on selector complexity
        baseProbability *= this.getComplexityMultiplier(selector.selector);
        
        return Math.min(1, Math.max(0, baseProbability));
    }

    getHistoricalSuccess(selector, context) {
        const cacheKey = `${selector}_${context.url}`;
        return this.performanceCache.get(cacheKey)?.successRate || null;
    }

    getContextMultiplier(selector, context) {
        let multiplier = 1.0;
        
        // Framework-specific adjustments
        if (context.framework === 'react' && selector.selector.includes('[data-')) {
            multiplier *= 1.2;
        }
        
        // Form context adjustments
        if (context.formContext.hasForm && selector.type?.includes('form')) {
            multiplier *= 1.1;
        }
        
        return multiplier;
    }

    getComplexityMultiplier(selector) {
        // Simpler selectors are more reliable
        const complexity = selector.split(' ').length + selector.split('>').length;
        return Math.max(0.5, 1.0 - (complexity - 1) * 0.1);
    }

    // Caching methods
    cacheSelector(selector, element) {
        const cacheKey = this.generateCacheKey(selector);
        this.selectorCache.set(cacheKey, {
            selector,
            element: this.getElementSignature(element),
            timestamp: Date.now(),
            useCount: 1
        });
    }

    cacheSuccessfulSelector(originalSelector, selectorInfo, context) {
        const cacheKey = `${originalSelector}_${context.url}`;
        const existing = this.performanceCache.get(cacheKey) || { attempts: 0, successes: 0 };
        
        existing.attempts++;
        existing.successes++;
        existing.lastSuccess = selectorInfo;
        existing.successRate = existing.successes / existing.attempts;
        
        this.performanceCache.set(cacheKey, existing);
    }

    getCachedSelector(selector, context) {
        const cacheKey = this.generateCacheKey(selector, context);
        const cached = this.selectorCache.get(cacheKey);
        
        if (cached && this.isCacheValid(cached)) {
            cached.useCount++;
            return cached;
        }
        
        return null;
    }

    async validateCachedElement(cachedResult, options) {
        // Try to find element using cached selector
        const element = await this.trySelector(cachedResult.lastSuccess, options);
        return element;
    }

    isCacheValid(cached) {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return Date.now() - cached.timestamp < maxAge;
    }

    generateCacheKey(selector, context = {}) {
        return `${selector}_${context.url || window.location.href}`;
    }

    getElementSignature(element) {
        return {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            textContent: element.textContent?.substring(0, 50)
        };
    }

    clearCache() {
        this.selectorCache.clear();
        console.log('🧹 AI selector cache cleared');
    }

    recordDetectionPerformance(selector, duration) {
        const key = `perf_${selector}`;
        const existing = this.performanceCache.get(key) || { totalTime: 0, count: 0 };
        
        existing.totalTime += duration;
        existing.count++;
        existing.averageTime = existing.totalTime / existing.count;
        
        this.performanceCache.set(key, existing);
    }

    // Training and learning methods
    trainInitialPatterns() {
        // Train with common web patterns
        this.trainingData.commonPatterns.forEach(pattern => {
            this.trainingData.successMetrics.set(pattern.pattern, pattern.success);
        });
    }

    async loadCachedPatterns() {
        // Load patterns from localStorage if available
        try {
            const stored = localStorage.getItem('ai_detector_patterns');
            if (stored) {
                const patterns = JSON.parse(stored);
                // Restore patterns
                console.log('📚 Loaded cached AI patterns');
            }
        } catch (error) {
            console.debug('No cached patterns found');
        }
    }

    // Public API
    getPerformanceMetrics() {
        const metrics = {
            cacheSize: this.selectorCache.size,
            cacheHitRate: this.calculateCacheHitRate(),
            averageDetectionTime: this.calculateAverageDetectionTime(),
            successRate: this.calculateOverallSuccessRate()
        };
        
        return metrics;
    }

    calculateCacheHitRate() {
        let totalUses = 0;
        let hits = 0;
        
        for (const cached of this.selectorCache.values()) {
            totalUses += cached.useCount;
            if (cached.useCount > 1) hits += cached.useCount - 1;
        }
        
        return totalUses > 0 ? hits / totalUses : 0;
    }

    calculateAverageDetectionTime() {
        const times = Array.from(this.performanceCache.values())
            .filter(metric => metric.averageTime)
            .map(metric => metric.averageTime);
            
        return times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
    }

    calculateOverallSuccessRate() {
        const rates = Array.from(this.performanceCache.values())
            .filter(metric => metric.successRate)
            .map(metric => metric.successRate);
            
        return rates.length > 0 ? rates.reduce((a, b) => a + b) / rates.length : 0;
    }
}

/**
 * 📊 Context Analyzer for Smart Element Detection
 */
class ContextAnalyzer {
    constructor() {
        this.patterns = new Map();
        this.pageAnalysis = new Map();
    }

    async initialize() {
        // Analyze current page
        await this.analyzePage();
        console.log('📊 Context Analyzer initialized');
    }

    async analyzePage() {
        const analysis = {
            structure: this.analyzeStructure(),
            content: this.analyzeContent(),
            interactions: this.analyzeInteractions(),
            performance: this.analyzePerformance()
        };
        
        this.pageAnalysis.set(window.location.href, analysis);
        return analysis;
    }

    analyzeStructure() {
        return {
            elementCount: document.querySelectorAll('*').length,
            formCount: document.querySelectorAll('form').length,
            buttonCount: document.querySelectorAll('button, input[type="button"], input[type="submit"]').length,
            linkCount: document.querySelectorAll('a').length,
            imageCount: document.querySelectorAll('img').length,
            depth: this.calculateDOMDepth()
        };
    }

    analyzeContent() {
        return {
            textLength: document.body.textContent?.length || 0,
            headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            listCount: document.querySelectorAll('ul, ol').length,
            tableCount: document.querySelectorAll('table').length
        };
    }

    analyzeInteractions() {
        return {
            hasJavaScript: document.querySelectorAll('script').length > 0,
            hasEventListeners: this.detectEventListeners(),
            hasDynamicContent: this.detectDynamicContent()
        };
    }

    analyzePerformance() {
        return {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            renderTime: performance.now()
        };
    }

    calculateDOMDepth() {
        let maxDepth = 0;
        
        function traverse(element, depth) {
            maxDepth = Math.max(maxDepth, depth);
            for (const child of element.children) {
                traverse(child, depth + 1);
            }
        }
        
        traverse(document.body, 0);
        return maxDepth;
    }

    detectEventListeners() {
        // Heuristic detection of event listeners
        return document.querySelectorAll('[onclick], [onsubmit], [onchange]').length > 0;
    }

    detectDynamicContent() {
        // Check for common dynamic content indicators
        return document.querySelectorAll('[data-react], [ng-app], [v-if]').length > 0;
    }
}

/**
 * 🔄 Fallback Strategies for Element Detection
 */
class FallbackStrategies {
    constructor() {
        this.strategies = [
            this.fuzzyTextMatch.bind(this),
            this.similarElementDetection.bind(this),
            this.visualSimilarityMatch.bind(this),
            this.semanticRoleMatch.bind(this)
        ];
    }

    async findElement(selector, context, options) {
        for (const strategy of this.strategies) {
            try {
                const element = await strategy(selector, context, options);
                if (element) {
                    console.log(`🔄 Fallback strategy succeeded: ${strategy.name}`);
                    return element;
                }
            } catch (error) {
                console.debug(`Fallback strategy failed: ${strategy.name}`, error);
            }
        }
        
        return null;
    }

    async fuzzyTextMatch(selector, context, options) {
        // Try to find elements with similar text content
        const text = this.extractTextFromSelector(selector);
        if (!text) return null;
        
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
            if (this.isSimilarText(element.textContent, text)) {
                return element;
            }
        }
        
        return null;
    }

    async similarElementDetection(selector, context, options) {
        // Find elements with similar attributes or structure
        const selectorParts = this.parseSelector(selector);
        const candidates = document.querySelectorAll('*');
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const element of candidates) {
            const score = this.calculateSimilarityScore(element, selectorParts);
            if (score > bestScore && score > 0.7) {
                bestScore = score;
                bestMatch = element;
            }
        }
        
        return bestMatch;
    }

    async visualSimilarityMatch(selector, context, options) {
        // Match elements based on visual characteristics
        // This is a simplified implementation
        return null;
    }

    async semanticRoleMatch(selector, context, options) {
        // Match based on semantic roles and ARIA attributes
        const role = this.inferRole(selector);
        if (role) {
            return document.querySelector(`[role="${role}"]`);
        }
        
        return null;
    }

    extractTextFromSelector(selector) {
        const textMatch = selector.match(/['"]([^'"]+)['"]/);
        return textMatch ? textMatch[1] : null;
    }

    isSimilarText(text1, text2) {
        if (!text1 || !text2) return false;
        
        const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalized1 = normalize(text1);
        const normalized2 = normalize(text2);
        
        return normalized1.includes(normalized2) || normalized2.includes(normalized1);
    }

    parseSelector(selector) {
        return {
            id: selector.match(/#([^.[\s]+)/)?.[1],
            classes: selector.match(/\.([^#.[\s]+)/g)?.map(c => c.slice(1)),
            attributes: selector.match(/\[([^\]]+)\]/g),
            tagName: selector.match(/^([a-zA-Z0-9]+)/)?.[1]
        };
    }

    calculateSimilarityScore(element, selectorParts) {
        let score = 0;
        let maxScore = 0;
        
        if (selectorParts.id) {
            maxScore += 0.4;
            if (element.id === selectorParts.id) score += 0.4;
        }
        
        if (selectorParts.classes) {
            maxScore += 0.3;
            const elementClasses = element.className.split(/\s+/);
            const matchedClasses = selectorParts.classes.filter(c => elementClasses.includes(c));
            score += (matchedClasses.length / selectorParts.classes.length) * 0.3;
        }
        
        if (selectorParts.tagName) {
            maxScore += 0.2;
            if (element.tagName.toLowerCase() === selectorParts.tagName.toLowerCase()) score += 0.2;
        }
        
        return maxScore > 0 ? score / maxScore : 0;
    }

    inferRole(selector) {
        if (selector.includes('button') || selector.includes('btn')) return 'button';
        if (selector.includes('link') || selector.includes('nav')) return 'link';
        if (selector.includes('input')) return 'textbox';
        if (selector.includes('submit')) return 'button';
        
        return null;
    }
}

/**
 * ⚡ Selector Optimizer for Performance
 */
class SelectorOptimizer {
    constructor() {
        this.optimizationRules = [
            this.removeUnnecessaryDescendants,
            this.preferIdOverClass,
            this.simplifyComplexSelectors,
            this.cacheFrequentSelectors
        ];
    }

    optimizeSelector(selector) {
        let optimized = selector;
        
        for (const rule of this.optimizationRules) {
            optimized = rule(optimized);
        }
        
        return optimized;
    }

    removeUnnecessaryDescendants(selector) {
        // Remove redundant descendant selectors
        return selector.replace(/\s+>/g, '>').replace(/>\s+/g, '>');
    }

    preferIdOverClass(selector) {
        // If selector has both ID and class, prefer ID
        const idMatch = selector.match(/#[^.\s[]+/);
        if (idMatch) {
            return idMatch[0];
        }
        return selector;
    }

    simplifyComplexSelectors(selector) {
        // Simplify overly complex selectors
        const parts = selector.split(/\s+/);
        if (parts.length > 4) {
            return parts.slice(-2).join(' ');
        }
        return selector;
    }

    cacheFrequentSelectors(selector) {
        // Mark frequently used selectors for caching
        return selector;
    }
}

// Export the main class
window.AIElementDetector = AIElementDetector;