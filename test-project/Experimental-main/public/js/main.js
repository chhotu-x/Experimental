// 🌐 Main JavaScript for 42Web.io - Massive Scale Website Embedder
// Supports 1M+ simultaneous embeddings with real-time automation controls

// Global state management
window.MassiveScaleEmbedder = {
    isInitialized: false,
    activeSessions: new Map(),
    automationControls: new Map(),
    liveViewingSessions: new Map(),
    realTimeEvents: new EventTarget(),
    
    // Configuration
    config: {
        maxEmbeddings: 1000000,
        batchSize: 5000,
        realTimeThreshold: 100, // ms
        defaultRefreshRate: 30, // FPS
        supportedCountries: ['US', 'UK', 'DE', 'FR', 'JP', 'CA', 'AU', 'NL', 'SG', 'BR']
    },
    
    // Performance monitoring
    performance: {
        startTime: Date.now(),
        requestCount: 0,
        errorCount: 0,
        averageResponseTime: 0
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 42Web.io - Massive Scale Embedder & Automation Platform Loading...');
    
    // Initialize core functionality
    initializeMassiveScaleEmbedder();
    initializeRealTimeAutomation();
    initializeLiveViewing();
    initializeProxyManagement();
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Start performance monitoring
    startPerformanceMonitoring();
    
    window.MassiveScaleEmbedder.isInitialized = true;
    console.log('✅ Massive Scale Embedder Platform Ready');
});

/**
 * 🌐 MASSIVE SCALE EMBEDDING FUNCTIONALITY
 */
function initializeMassiveScaleEmbedder() {
    console.log('Initializing massive scale embedder...');
    
    // Initialize UI components
    initializeEmbedderUI();
    
    // Setup batch processing
    setupBatchProcessing();
    
    // Initialize progress monitoring
    initializeProgressMonitoring();
}

function initializeEmbedderUI() {
    const embedderContainer = document.querySelector('#massive-scale-embedder');
    if (!embedderContainer) return;
    
    // Create massive scale control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'massive-scale-controls';
    controlPanel.innerHTML = `
        <div class="control-header">
            <h3>🌐 Massive Scale Website Embedder</h3>
            <div class="scale-indicator">
                <span>Max Capacity: ${window.MassiveScaleEmbedder.config.maxEmbeddings.toLocaleString()} websites</span>
            </div>
        </div>
        
        <div class="embedding-controls">
            <div class="input-section">
                <label for="website-urls">Website URLs (one per line, max 1M):</label>
                <textarea id="website-urls" rows="10" placeholder="https://example1.com
https://example2.com
https://example3.com
..."></textarea>
                <div class="url-stats">
                    <span id="url-count">0 URLs</span>
                    <span id="estimated-time">Est. time: 0 min</span>
                </div>
            </div>
            
            <div class="options-section">
                <div class="option-group">
                    <label>Priority Level:</label>
                    <select id="embed-priority">
                        <option value="0">Critical (Real-time)</option>
                        <option value="1">High</option>
                        <option value="2" selected>Medium</option>
                        <option value="3">Low</option>
                        <option value="4">Background</option>
                    </select>
                </div>
                
                <div class="option-group">
                    <label>Shard Count:</label>
                    <input type="number" id="shard-count" min="1" max="10000" value="1000">
                </div>
                
                <div class="option-group">
                    <label>Proxy Country:</label>
                    <select id="proxy-country">
                        ${window.MassiveScaleEmbedder.config.supportedCountries.map(country => 
                            `<option value="${country}">${country}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="enable-automation" checked>
                        Enable Real-time Automation Controls
                    </label>
                </div>
                
                <div class="option-group">
                    <label>
                        <input type="checkbox" id="enable-live-view" checked>
                        Enable Live Viewing After Start
                    </label>
                </div>
            </div>
            
            <div class="action-section">
                <button id="start-massive-embedding" class="btn-primary">
                    🚀 Start Massive Scale Embedding
                </button>
                <button id="stop-embedding" class="btn-danger" disabled>
                    ⏹️ Stop All Embeddings
                </button>
            </div>
        </div>
        
        <div class="progress-section">
            <div class="progress-header">
                <h4>📊 Progress Monitor</h4>
                <div class="real-time-stats">
                    <span id="active-embeddings">0 active</span>
                    <span id="completion-rate">0% complete</span>
                    <span id="throughput">0/sec</span>
                </div>
            </div>
            <div class="progress-bar">
                <div id="progress-fill" class="progress-fill"></div>
            </div>
            <div class="shard-status" id="shard-status"></div>
        </div>
    `;
    
    embedderContainer.appendChild(controlPanel);
    
    // Setup event listeners
    setupEmbedderEventListeners();
}

function setupEmbedderEventListeners() {
    const urlTextarea = document.getElementById('website-urls');
    const startButton = document.getElementById('start-massive-embedding');
    const stopButton = document.getElementById('stop-embedding');
    
    // URL count and estimation
    urlTextarea?.addEventListener('input', function() {
        const urls = this.value.split('\n').filter(url => url.trim());
        document.getElementById('url-count').textContent = `${urls.length.toLocaleString()} URLs`;
        
        const estimatedMinutes = Math.ceil(urls.length / 1000);
        document.getElementById('estimated-time').textContent = `Est. time: ${estimatedMinutes} min`;
    });
    
    // Start massive embedding
    startButton?.addEventListener('click', async function() {
        await startMassiveScaleEmbedding();
    });
    
    // Stop embedding
    stopButton?.addEventListener('click', async function() {
        await stopMassiveScaleEmbedding();
    });
}

async function startMassiveScaleEmbedding() {
    const urlTextarea = document.getElementById('website-urls');
    const urls = urlTextarea.value.split('\n').filter(url => url.trim());
    
    if (urls.length === 0) {
        alert('Please enter at least one URL');
        return;
    }
    
    if (urls.length > window.MassiveScaleEmbedder.config.maxEmbeddings) {
        alert(`Maximum ${window.MassiveScaleEmbedder.config.maxEmbeddings.toLocaleString()} URLs allowed`);
        return;
    }
    
    const options = {
        priority: parseInt(document.getElementById('embed-priority').value),
        shardCount: parseInt(document.getElementById('shard-count').value),
        country: document.getElementById('proxy-country').value,
        enableAutomation: document.getElementById('enable-automation').checked,
        enableLiveView: document.getElementById('enable-live-view').checked
    };
    
    try {
        // Disable start button, enable stop button
        document.getElementById('start-massive-embedding').disabled = true;
        document.getElementById('stop-embedding').disabled = false;
        
        console.log(`🚀 Starting massive scale embedding: ${urls.length} URLs`);
        
        const response = await webUtils.fetchJSON('/api/embedding/massive-scale', {
            method: 'POST',
            body: JSON.stringify({
                websites: urls,
                options
            })
        });
        
        if (response.success) {
            const sessionId = response.data.batchId;
            
            // Store session
            window.MassiveScaleEmbedder.activeSessions.set(sessionId, {
                ...response.data,
                startTime: Date.now(),
                urls: urls.length,
                options
            });
            
            // Start monitoring
            startProgressMonitoring(sessionId);
            
            // Enable automation if requested
            if (options.enableAutomation) {
                await enableAutomationForSession(sessionId, urls);
            }
            
            // Enable live viewing if requested
            if (options.enableLiveView) {
                await enableLiveViewingForSession(sessionId);
            }
            
            console.log(`✅ Massive scale embedding initiated: ${sessionId}`);
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Failed to start massive scale embedding:', error);
        alert(`Failed to start embedding: ${error.message}`);
        
        // Re-enable start button
        document.getElementById('start-massive-embedding').disabled = false;
        document.getElementById('stop-embedding').disabled = true;
    }
}

/**
 * 🎮 REAL-TIME AUTOMATION CONTROLS
 */
function initializeRealTimeAutomation() {
    console.log('Initializing real-time automation controls...');
    
    const automationContainer = document.querySelector('#real-time-automation');
    if (!automationContainer) return;
    
    // Create automation control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'automation-controls';
    controlPanel.innerHTML = `
        <div class="control-header">
            <h3>🎮 Real-time Automation Controls</h3>
            <div class="automation-status">
                <span id="automation-status">Disabled</span>
                <span id="active-commands">0 commands/sec</span>
            </div>
        </div>
        
        <div class="command-controls">
            <div class="command-section">
                <h4>Quick Commands</h4>
                <div class="quick-commands">
                    <button class="cmd-btn" data-command="screenshot">📷 Screenshot All</button>
                    <button class="cmd-btn" data-command="scroll-down">⬇️ Scroll Down</button>
                    <button class="cmd-btn" data-command="scroll-up">⬆️ Scroll Up</button>
                    <button class="cmd-btn" data-command="refresh">🔄 Refresh All</button>
                </div>
            </div>
            
            <div class="custom-command-section">
                <h4>Custom Command</h4>
                <select id="command-type">
                    <option value="click">Click Element</option>
                    <option value="fill">Fill Form</option>
                    <option value="navigate">Navigate</option>
                    <option value="scroll">Scroll</option>
                    <option value="screenshot">Screenshot</option>
                    <option value="custom">Custom Script</option>
                </select>
                
                <input type="text" id="command-selector" placeholder="CSS Selector or Target">
                <input type="text" id="command-value" placeholder="Value (for fill/navigate)">
                
                <select id="command-priority">
                    <option value="0">Critical (Immediate)</option>
                    <option value="1">High</option>
                    <option value="2" selected>Medium</option>
                    <option value="3">Low</option>
                </select>
                
                <button id="execute-custom-command" class="btn-primary">Execute on All</button>
            </div>
        </div>
        
        <div class="command-history">
            <h4>Command History</h4>
            <div id="command-log" class="command-log"></div>
        </div>
    `;
    
    automationContainer.appendChild(controlPanel);
    
    // Setup automation event listeners
    setupAutomationEventListeners();
}

function setupAutomationEventListeners() {
    // Quick command buttons
    document.querySelectorAll('.cmd-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const command = this.dataset.command;
            await executeQuickCommand(command);
        });
    });
    
    // Custom command execution
    document.getElementById('execute-custom-command')?.addEventListener('click', async function() {
        await executeCustomCommand();
    });
}

async function enableAutomationForSession(sessionId, embeddingIds) {
    try {
        const response = await webUtils.fetchJSON(`/api/automation/enable/${sessionId}`, {
            method: 'POST',
            body: JSON.stringify({
                embeddingIds: embeddingIds.map((_, index) => `embed_${index}`),
                automationRules: []
            })
        });
        
        if (response.success) {
            window.MassiveScaleEmbedder.automationControls.set(sessionId, response.data);
            document.getElementById('automation-status').textContent = 'Enabled';
            console.log(`✅ Automation enabled for session ${sessionId}`);
        }
    } catch (error) {
        console.error('Failed to enable automation:', error);
    }
}

async function executeQuickCommand(commandType) {
    const activeSessions = Array.from(window.MassiveScaleEmbedder.activeSessions.keys());
    
    if (activeSessions.length === 0) {
        alert('No active embedding sessions');
        return;
    }
    
    const command = {
        type: commandType,
        priority: 1,
        timestamp: Date.now()
    };
    
    for (const sessionId of activeSessions) {
        try {
            await executeCommandOnSession(sessionId, command);
        } catch (error) {
            console.error(`Failed to execute command on session ${sessionId}:`, error);
        }
    }
}

async function executeCommandOnSession(sessionId, command) {
    const response = await webUtils.fetchJSON(`/api/automation/command/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ command })
    });
    
    if (response.success) {
        logCommand(sessionId, command, response.data);
    }
    
    return response;
}

function logCommand(sessionId, command, result) {
    const logContainer = document.getElementById('command-log');
    if (!logContainer) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'command-entry';
    logEntry.innerHTML = `
        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
        <span class="session">${sessionId.substr(0, 8)}...</span>
        <span class="command">${command.type}</span>
        <span class="result ${result.results?.successful > 0 ? 'success' : 'error'}">
            ${result.results?.successful || 0}/${result.results?.total || 0}
        </span>
    `;
    
    logContainer.prepend(logEntry);
    
    // Keep only last 100 entries
    while (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

/**
 * 👁️ LIVE VIEWING FUNCTIONALITY
 */
function initializeLiveViewing() {
    console.log('Initializing live viewing...');
    
    const liveViewContainer = document.querySelector('#live-viewing');
    if (!liveViewContainer) return;
    
    // Create live view panel
    const viewPanel = document.createElement('div');
    viewPanel.className = 'live-view-panel';
    viewPanel.innerHTML = `
        <div class="view-header">
            <h3>👁️ Live Website Viewing</h3>
            <div class="view-controls">
                <select id="view-quality">
                    <option value="low">Low Quality</option>
                    <option value="medium" selected>Medium Quality</option>
                    <option value="high">High Quality</option>
                </select>
                <select id="view-refresh-rate">
                    <option value="10">10 FPS</option>
                    <option value="30" selected>30 FPS</option>
                    <option value="60">60 FPS</option>
                </select>
                <button id="toggle-live-view" class="btn-primary">Enable Live View</button>
            </div>
        </div>
        
        <div class="view-grid" id="live-view-grid">
            <!-- Live view thumbnails will be inserted here -->
        </div>
    `;
    
    liveViewContainer.appendChild(viewPanel);
    
    // Setup live view event listeners
    setupLiveViewEventListeners();
}

function setupLiveViewEventListeners() {
    document.getElementById('toggle-live-view')?.addEventListener('click', async function() {
        if (this.textContent.includes('Enable')) {
            await enableLiveViewing();
            this.textContent = '🛑 Disable Live View';
        } else {
            await disableLiveViewing();
            this.textContent = '👁️ Enable Live View';
        }
    });
}

async function enableLiveViewingForSession(sessionId) {
    try {
        // Enable live viewing
        const enableResponse = await webUtils.fetchJSON('/api/live-view/enable', {
            method: 'POST',
            body: JSON.stringify({
                options: {
                    refreshRate: parseInt(document.getElementById('view-refresh-rate')?.value || 30)
                }
            })
        });
        
        if (enableResponse.success) {
            // Create viewing session
            const session = window.MassiveScaleEmbedder.activeSessions.get(sessionId);
            const embeddingIds = Array.from({length: session.urls}, (_, i) => `embed_${i}`);
            
            const sessionResponse = await webUtils.fetchJSON('/api/live-view/session', {
                method: 'POST',
                body: JSON.stringify({
                    embeddingIds,
                    viewerOptions: {
                        quality: document.getElementById('view-quality')?.value || 'medium'
                    }
                })
            });
            
            if (sessionResponse.success) {
                window.MassiveScaleEmbedder.liveViewingSessions.set(sessionId, sessionResponse.data);
                startLiveViewUpdates(sessionId);
                console.log(`✅ Live viewing enabled for session ${sessionId}`);
            }
        }
    } catch (error) {
        console.error('Failed to enable live viewing:', error);
    }
}

/**
 * 🌍 PROXY MANAGEMENT
 */
function initializeProxyManagement() {
    console.log('Initializing proxy management...');
    
    // Monitor proxy status and rotation
    setInterval(async () => {
        try {
            const response = await webUtils.fetchJSON('/api/proxy/countries');
            if (response.success) {
                updateProxyStatus(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch proxy status:', error);
        }
    }, 30000); // Check every 30 seconds
}

function updateProxyStatus(proxyData) {
    // Update proxy indicators in UI
    const proxyIndicator = document.querySelector('.proxy-status');
    if (proxyIndicator) {
        proxyIndicator.innerHTML = `
            <span>🌍 ${proxyData.totalProxies} proxies across ${proxyData.supportedCountries.length} countries</span>
        `;
    }
}

/**
 * 📊 PERFORMANCE MONITORING
 */
function startPerformanceMonitoring() {
    setInterval(() => {
        updatePerformanceMetrics();
    }, 1000);
}

function updatePerformanceMetrics() {
    const perf = window.MassiveScaleEmbedder.performance;
    const uptime = Math.floor((Date.now() - perf.startTime) / 1000);
    
    // Update performance indicators
    const perfIndicator = document.querySelector('.performance-stats');
    if (perfIndicator) {
        perfIndicator.innerHTML = `
            <span>⚡ ${perf.requestCount} requests</span>
            <span>🕒 ${uptime}s uptime</span>
            <span>⚠️ ${perf.errorCount} errors</span>
        `;
    }
}

function startProgressMonitoring(sessionId) {
    const interval = setInterval(async () => {
        try {
            const response = await webUtils.fetchJSON(`/api/embedding/massive-scale/${sessionId}/status`);
            if (response.success) {
                updateProgressDisplay(response.data);
                
                // Stop monitoring if completed
                if (response.data.overallProgress >= 100) {
                    clearInterval(interval);
                    onEmbeddingCompleted(sessionId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch progress:', error);
            clearInterval(interval);
        }
    }, 2000); // Update every 2 seconds
}

function updateProgressDisplay(progress) {
    const progressFill = document.getElementById('progress-fill');
    const shardStatus = document.getElementById('shard-status');
    
    if (progressFill) {
        progressFill.style.width = `${progress.overallProgress}%`;
    }
    
    if (shardStatus) {
        shardStatus.innerHTML = `
            <div class="shard-stats">
                <span>📦 ${progress.completedShards}/${progress.totalShards} shards complete</span>
                <span>🔄 ${progress.processingShards} processing</span>
                <span>❌ ${progress.failedShards} failed</span>
            </div>
        `;
    }
    
    // Update real-time stats
    document.getElementById('completion-rate').textContent = `${progress.overallProgress.toFixed(1)}% complete`;
}

function onEmbeddingCompleted(sessionId) {
    console.log(`✅ Massive scale embedding completed: ${sessionId}`);
    
    // Re-enable start button
    document.getElementById('start-massive-embedding').disabled = false;
    document.getElementById('stop-embedding').disabled = true;
    
    // Show completion notification
    alert('Massive scale embedding completed successfully!');
}

/**
 * 🔧 UTILITY FUNCTIONS AND EVENT LISTENERS
 */
function setupGlobalEventListeners() {
    // Listen for real-time events
    window.addEventListener('automation:command-completed', function(event) {
        console.log('Command completed:', event.detail);
    });
    
    window.addEventListener('automation:live-view-update', function(event) {
        updateLiveViewDisplay(event.detail);
    });
}

// Enhanced utilities
const webUtils = {
    async fetchJSON(url, options = {}) {
        try {
            window.MassiveScaleEmbedder.performance.requestCount++;
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': crypto.randomUUID(),
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                window.MassiveScaleEmbedder.performance.errorCount++;
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            window.MassiveScaleEmbedder.performance.errorCount++;
            console.error('Fetch error:', error);
            throw error;
        }
    },
    
    $(selector) {
        return document.querySelector(selector);
    },
    
    on(element, event, handler) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.addEventListener(event, handler);
        }
    },
    
    formatNumber(num) {
        return num.toLocaleString();
    },
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};

// Export enhanced utilities
window.webUtils = webUtils;