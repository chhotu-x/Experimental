/**
 * Enhanced Website Embedder with Batch and Automation Support
 */

// Enhanced embedder functionality
function initEnhancedWebsiteEmbedder() {
    const urlInput = document.getElementById('urlInput');
    const loadButton = document.getElementById('loadWebsite');
    const batchUrls = document.getElementById('batchUrls');
    const startBatchButton = document.getElementById('startBatchEmbedding');
    const createAutomationButton = document.getElementById('createMassiveAutomation');
    
    // Monitoring elements
    const activeSessions = document.getElementById('activeSessions');
    const completedTotal = document.getElementById('completedTotal');
    const throughputRate = document.getElementById('throughputRate');
    const successRate = document.getElementById('successRate');
    const performanceLog = document.getElementById('performanceLog');
    
    // Global state
    let currentBatchId = null;
    let monitoringInterval = null;
    let stats = {
        active: 0,
        completed: 0,
        throughput: 0,
        success: 100
    };

    if (!urlInput || !loadButton) return;

    // Single website embedding (enhanced)
    loadButton.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        if (!url) return;

        showLoading('Processing single website embedding...');
        
        try {
            const response = await fetch('/api/embed/single', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const result = await response.json();
            
            if (result.success) {
                displayEmbeddedContent(result.content, url);
                logPerformance(`✅ Single embedding completed in ${result.processingTime}ms`);
                updateStats('completed', 1);
            } else {
                showError(result.error);
                logPerformance(`❌ Single embedding failed: ${result.error}`);
            }
        } catch (error) {
            showError('Network error: ' + error.message);
            logPerformance(`❌ Network error: ${error.message}`);
        }
    });

    // Batch embedding
    if (startBatchButton) {
        startBatchButton.addEventListener('click', async function() {
            const urlsText = batchUrls.value.trim();
            if (!urlsText) {
                alert('Please enter URLs for batch processing');
                return;
            }

            const urls = urlsText.split('\n').filter(url => url.trim()).map(url => url.trim());
            
            if (urls.length === 0) {
                alert('No valid URLs found');
                return;
            }

            if (urls.length > 10000) {
                alert('Maximum 10,000 URLs per batch');
                return;
            }

            startBatchButton.disabled = true;
            startBatchButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            
            showLoading(`Processing batch of ${urls.length} websites...`);
            logPerformance(`🚀 Starting batch embedding for ${urls.length} URLs`);

            try {
                const response = await fetch('/api/embed/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        urls,
                        options: {
                            batchSize: parseInt(document.getElementById('batchSize').value),
                            realTime: document.getElementById('realTimeProcessing').checked
                        }
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    currentBatchId = result.batchId;
                    displayBatchResults(result);
                    logPerformance(`✅ Batch completed: ${result.summary.completed}/${result.summary.total} successful`);
                    updateStats('completed', result.summary.completed);
                    
                    // Start monitoring if batch is large
                    if (urls.length > 50) {
                        startBatchMonitoring(result.batchId);
                    }
                } else {
                    showError(result.error);
                    logPerformance(`❌ Batch failed: ${result.error}`);
                }
            } catch (error) {
                showError('Batch processing failed: ' + error.message);
                logPerformance(`❌ Batch error: ${error.message}`);
            } finally {
                startBatchButton.disabled = false;
                startBatchButton.innerHTML = '<i class="fas fa-play me-2"></i>Start Batch';
            }
        });
    }

    // Massive automation creation
    if (createAutomationButton) {
        createAutomationButton.addEventListener('click', async function() {
            const baseUrl = document.getElementById('automationBaseUrl').value.trim();
            const count = parseInt(document.getElementById('automationCount').value);
            const pattern = document.getElementById('automationPattern').value;
            
            if (!baseUrl) {
                alert('Please enter a base URL');
                return;
            }

            createAutomationButton.disabled = true;
            createAutomationButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating...';
            
            logPerformance(`🎛️ Creating massive automation for ${count.toLocaleString()} instances...`);

            try {
                const response = await fetch('/api/automation/massive', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        baseUrl,
                        count,
                        options: {
                            pattern,
                            batchSize: Math.min(count / 100, 1000),
                            enableRealTime: document.getElementById('enableRealTimeControl').checked,
                            enableParallel: document.getElementById('enableParallelProcessing').checked,
                            enableRecovery: document.getElementById('enableAutoRecovery').checked
                        }
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    displayAutomationConfig(result);
                    logPerformance(`✅ Automation config created for ${count.toLocaleString()} websites`);
                    logPerformance(`⏱️ Estimated processing time: ${Math.round(result.estimatedProcessingTime / 1000)}s`);
                } else {
                    showError(result.error);
                    logPerformance(`❌ Automation creation failed: ${result.error}`);
                }
            } catch (error) {
                showError('Automation creation failed: ' + error.message);
                logPerformance(`❌ Automation error: ${error.message}`);
            } finally {
                createAutomationButton.disabled = false;
                createAutomationButton.innerHTML = '<i class="fas fa-magic me-2"></i>Create 1M+ Automation';
            }
        });
    }

    // Utility functions
    function showLoading(message) {
        const websiteContainer = document.getElementById('websiteContainer');
        const quickLinksSection = document.getElementById('quickLinksSection');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const loadingProgress = document.getElementById('loadingProgress');
        
        websiteContainer.classList.remove('d-none');
        quickLinksSection.classList.add('d-none');
        loadingIndicator.classList.remove('d-none');
        
        if (loadingProgress) {
            loadingProgress.querySelector('.progress-bar').style.width = '0%';
            animateProgress();
        }
        
        const loadingText = loadingIndicator.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    function animateProgress() {
        const progressBar = document.querySelector('#loadingProgress .progress-bar');
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 10;
            if (width >= 90) {
                clearInterval(interval);
                width = 90;
            }
            progressBar.style.width = width + '%';
        }, 100);
    }

    function displayEmbeddedContent(content, url) {
        const websiteContent = document.getElementById('websiteContent');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const currentUrlInput = document.getElementById('currentUrl');
        
        loadingIndicator.classList.add('d-none');
        websiteContent.innerHTML = content;
        websiteContent.style.display = 'block';
        
        if (currentUrlInput) {
            currentUrlInput.value = url;
        }
    }

    function displayBatchResults(result) {
        const websiteContent = document.getElementById('websiteContent');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        loadingIndicator.classList.add('d-none');
        
        const resultsHtml = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-layer-group text-success me-2"></i>
                            Batch Embedding Results
                        </h2>
                        
                        <div class="row g-3 mb-4">
                            <div class="col-md-3">
                                <div class="card bg-primary text-white">
                                    <div class="card-body text-center">
                                        <h3>${result.summary.total}</h3>
                                        <small>Total Processed</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-success text-white">
                                    <div class="card-body text-center">
                                        <h3>${result.summary.completed}</h3>
                                        <small>Successful</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-danger text-white">
                                    <div class="card-body text-center">
                                        <h3>${result.summary.failed}</h3>
                                        <small>Failed</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card bg-info text-white">
                                    <div class="card-body text-center">
                                        <h3>${Math.round(result.summary.processingTime)}ms</h3>
                                        <small>Processing Time</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Batch Results (First 10)</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>URL</th>
                                                <th>Status</th>
                                                <th>Processing Time</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${result.results.slice(0, 10).map(r => `
                                                <tr>
                                                    <td>
                                                        <div class="text-truncate" style="max-width: 300px;" title="${r.url || 'N/A'}">
                                                            ${r.url || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="badge ${r.success ? 'bg-success' : 'bg-danger'}">
                                                            ${r.success ? 'Success' : 'Failed'}
                                                        </span>
                                                    </td>
                                                    <td>${r.processingTime || 'N/A'}ms</td>
                                                    <td>
                                                        ${r.success ? `<button class="btn btn-sm btn-outline-primary" onclick="viewEmbedding('${r.embeddingId}')">View</button>` : `<span class="text-muted">${r.error || 'Error'}</span>`}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        websiteContent.innerHTML = resultsHtml;
        websiteContent.style.display = 'block';
    }

    function displayAutomationConfig(result) {
        const websiteContent = document.getElementById('websiteContent');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        loadingIndicator.classList.add('d-none');
        
        const configHtml = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-robot text-warning me-2"></i>
                            Massive Automation Configuration
                        </h2>
                        
                        <div class="alert alert-success">
                            <h4 class="alert-heading">
                                <i class="fas fa-check-circle me-2"></i>Configuration Created Successfully!
                            </h4>
                            <p class="mb-0">
                                Ready to control <strong>${result.totalGenerated.toLocaleString()}</strong> website instances 
                                with an estimated processing time of <strong>${Math.round(result.estimatedProcessingTime / 1000)} seconds</strong>.
                            </p>
                        </div>
                        
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-cog me-2"></i>Configuration Details
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <dl class="row">
                                            <dt class="col-sm-4">Config ID:</dt>
                                            <dd class="col-sm-8"><code>${result.config.id}</code></dd>
                                            
                                            <dt class="col-sm-4">Base URL:</dt>
                                            <dd class="col-sm-8"><code>${result.config.baseUrl}</code></dd>
                                            
                                            <dt class="col-sm-4">Instance Count:</dt>
                                            <dd class="col-sm-8"><strong>${result.config.count.toLocaleString()}</strong></dd>
                                            
                                            <dt class="col-sm-4">Batch Size:</dt>
                                            <dd class="col-sm-8">${result.config.batchSize}</dd>
                                            
                                            <dt class="col-sm-4">Concurrency:</dt>
                                            <dd class="col-sm-8">${result.config.concurrency}</dd>
                                            
                                            <dt class="col-sm-4">Pattern:</dt>
                                            <dd class="col-sm-8">${result.config.pattern}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-eye me-2"></i>URL Preview (First 10)
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <ul class="list-unstyled">
                                            ${result.preview.map(url => `
                                                <li class="mb-1">
                                                    <code class="text-truncate d-block" style="max-width: 100%;" title="${url}">${url}</code>
                                                </li>
                                            `).join('')}
                                        </ul>
                                        ${result.totalGenerated > 10 ? `<small class="text-muted">... and ${(result.totalGenerated - 10).toLocaleString()} more URLs</small>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mt-4">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-play me-2"></i>Automation Controls
                                </h5>
                            </div>
                            <div class="card-body text-center">
                                <button class="btn btn-success btn-lg me-2" onclick="startMassiveAutomation('${result.config.id}')">
                                    <i class="fas fa-rocket me-2"></i>Start Automation
                                </button>
                                <button class="btn btn-info btn-lg me-2" onclick="simulateAutomation('${result.config.id}')">
                                    <i class="fas fa-eye me-2"></i>Simulate (Demo)
                                </button>
                                <button class="btn btn-secondary btn-lg" onclick="downloadConfig('${result.config.id}')">
                                    <i class="fas fa-download me-2"></i>Download Config
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        websiteContent.innerHTML = configHtml;
        websiteContent.style.display = 'block';
    }

    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        loadingIndicator.classList.add('d-none');
        errorMessage.classList.remove('d-none');
        errorText.textContent = message;
    }

    function logPerformance(message) {
        if (performanceLog) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span class="text-muted">[${timestamp}]</span> ${message}`;
            performanceLog.appendChild(logEntry);
            performanceLog.scrollTop = performanceLog.scrollHeight;
        }
    }

    function updateStats(type, value) {
        stats[type] += value;
        updateStatsDisplay();
    }

    function updateStatsDisplay() {
        if (activeSessions) activeSessions.textContent = stats.active.toLocaleString();
        if (completedTotal) completedTotal.textContent = stats.completed.toLocaleString();
        if (throughputRate) throughputRate.textContent = `${stats.throughput}/s`;
        if (successRate) successRate.textContent = `${stats.success}%`;
    }

    // Start live monitoring
    function startLiveMonitoring() {
        if (monitoringInterval) return;
        
        monitoringInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                stats.active = data.embedding.activeEmbeddings;
                stats.completed = data.embedding.completedEmbeddings;
                stats.success = Math.round(data.embedding.successRate);
                
                updateStatsDisplay();
                
                if (Math.random() > 0.7) { // Occasionally log status
                    logPerformance(`📊 Active: ${stats.active} | Completed: ${stats.completed} | Success: ${stats.success}%`);
                }
            } catch (error) {
                console.error('Monitoring error:', error);
            }
        }, 2000);
    }

    // Initialize monitoring when monitor tab is shown
    document.addEventListener('DOMContentLoaded', function() {
        const monitorTab = document.getElementById('monitor-tab');
        if (monitorTab) {
            monitorTab.addEventListener('click', function() {
                startLiveMonitoring();
                logPerformance('🔄 Live monitoring activated');
            });
        }
    });
}

// Global functions for automation controls
let currentAutomationSession = null;

async function startMassiveAutomation(configId) {
    try {
        console.log(`🚀 Starting massive automation with config: ${configId}`);
        
        // Create automation session
        const sessionResponse = await fetch('/api/automation/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                config: {
                    id: configId,
                    baseUrl: document.getElementById('automationBaseUrl').value,
                    count: parseInt(document.getElementById('automationCount').value),
                    pattern: document.getElementById('automationPattern').value
                }
            })
        });

        const sessionResult = await sessionResponse.json();
        
        if (sessionResult.success) {
            currentAutomationSession = sessionResult.sessionId;
            
            // Start the session
            const startResponse = await fetch(`/api/automation/sessions/${currentAutomationSession}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ options: {} })
            });

            const startResult = await startResponse.json();
            
            if (startResult.success) {
                logPerformance(`✅ Automation session ${currentAutomationSession} started successfully`);
                logPerformance(`🎛️ Now controlling ${sessionResult.websiteCount.toLocaleString()} websites in real-time`);
                
                // Show automation controls
                showAutomationControls(currentAutomationSession);
            } else {
                throw new Error(startResult.error);
            }
        } else {
            throw new Error(sessionResult.error);
        }
        
    } catch (error) {
        console.error('Failed to start automation:', error);
        alert(`Failed to start automation: ${error.message}`);
    }
}

function showAutomationControls(sessionId) {
    const websiteContent = document.getElementById('websiteContent');
    
    const controlsHtml = `
        <div class="container py-4">
            <div class="row">
                <div class="col-12">
                    <h2 class="mb-4">
                        <i class="fas fa-robot text-success me-2"></i>
                        Live Automation Control - Session ${sessionId}
                    </h2>
                    
                    <div class="alert alert-success">
                        <h4 class="alert-heading">
                            <i class="fas fa-check-circle me-2"></i>Automation Session Active!
                        </h4>
                        <p class="mb-0">
                            You now have real-time control over all embedded websites. 
                            Execute commands below to control all instances simultaneously.
                        </p>
                    </div>
                    
                    <div class="row g-4">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="fas fa-gamepad me-2"></i>Real-time Command Center
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <button class="btn btn-primary w-100" onclick="executeAutomationCommand('click', '#button')">
                                                <i class="fas fa-mouse-pointer me-2"></i>Click All Buttons
                                            </button>
                                        </div>
                                        <div class="col-md-6">
                                            <button class="btn btn-info w-100" onclick="executeAutomationCommand('scroll', 'down')">
                                                <i class="fas fa-arrow-down me-2"></i>Scroll All Down
                                            </button>
                                        </div>
                                        <div class="col-md-6">
                                            <button class="btn btn-success w-100" onclick="executeAutomationCommand('fill', '#input', 'automated_value')">
                                                <i class="fas fa-edit me-2"></i>Fill All Forms
                                            </button>
                                        </div>
                                        <div class="col-md-6">
                                            <button class="btn btn-warning w-100" onclick="executeAutomationCommand('capture', null)">
                                                <i class="fas fa-camera me-2"></i>Capture All Data
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <hr>
                                    
                                    <h6>Custom Command</h6>
                                    <div class="row g-2">
                                        <div class="col-md-4">
                                            <select class="form-select" id="customCommandType">
                                                <option value="click">Click</option>
                                                <option value="fill">Fill</option>
                                                <option value="navigate">Navigate</option>
                                                <option value="scroll">Scroll</option>
                                                <option value="capture">Capture</option>
                                            </select>
                                        </div>
                                        <div class="col-md-5">
                                            <input type="text" class="form-control" id="customCommandSelector" placeholder="Selector or value">
                                        </div>
                                        <div class="col-md-3">
                                            <button class="btn btn-outline-primary w-100" onclick="executeCustomCommand()">
                                                <i class="fas fa-bolt me-1"></i>Execute
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="fas fa-chart-bar me-2"></i>Session Status
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div id="sessionStats">
                                        <div class="text-center">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-2">Loading session status...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mt-3">
                                <div class="card-header">
                                    <h5 class="mb-0">
                                        <i class="fas fa-history me-2"></i>Command History
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div id="commandHistory" style="max-height: 200px; overflow-y: auto;">
                                        <small class="text-muted">No commands executed yet</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    websiteContent.innerHTML = controlsHtml;
    websiteContent.style.display = 'block';
    
    // Start session monitoring
    startSessionMonitoring(sessionId);
}

async function executeAutomationCommand(type, selector, value = null) {
    if (!currentAutomationSession) {
        alert('No active automation session');
        return;
    }
    
    try {
        const command = { type, selector };
        if (value) command.value = value;
        if (type === 'scroll') command.direction = selector;
        if (type === 'capture') command.options = {};
        
        logPerformance(`⚡ Executing ${type} command across all websites...`);
        
        const response = await fetch(`/api/automation/sessions/${currentAutomationSession}/commands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command })
        });

        const result = await response.json();
        
        if (result.success) {
            logPerformance(`✅ Command executed: ${result.resultsCount} successful, ${result.failedCount} failed (${result.processingTime}ms)`);
            addToCommandHistory(type, result);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Command execution failed:', error);
        logPerformance(`❌ Command failed: ${error.message}`);
    }
}

function executeCustomCommand() {
    const type = document.getElementById('customCommandType').value;
    const selector = document.getElementById('customCommandSelector').value;
    
    if (!selector && type !== 'capture') {
        alert('Please enter a selector or value');
        return;
    }
    
    executeAutomationCommand(type, selector);
}

function addToCommandHistory(type, result) {
    const historyDiv = document.getElementById('commandHistory');
    if (historyDiv) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'border-bottom pb-1 mb-1';
        entry.innerHTML = `
            <small>
                <strong>[${timestamp}]</strong> ${type.toUpperCase()}<br>
                <span class="text-success">${result.resultsCount} OK</span> | 
                <span class="text-danger">${result.failedCount} Failed</span> | 
                <span class="text-muted">${result.processingTime}ms</span>
            </small>
        `;
        
        if (historyDiv.querySelector('.text-muted')) {
            historyDiv.innerHTML = '';
        }
        
        historyDiv.insertBefore(entry, historyDiv.firstChild);
        
        // Keep only last 10 entries
        while (historyDiv.children.length > 10) {
            historyDiv.removeChild(historyDiv.lastChild);
        }
    }
}

function startSessionMonitoring(sessionId) {
    const updateSessionStats = async () => {
        try {
            const response = await fetch(`/api/automation/sessions/${sessionId}/status`);
            const data = await response.json();
            
            if (data.success) {
                const statsDiv = document.getElementById('sessionStats');
                if (statsDiv) {
                    statsDiv.innerHTML = `
                        <div class="row g-2 text-center">
                            <div class="col-6">
                                <div class="bg-primary text-white p-2 rounded">
                                    <div class="h5 mb-0">${data.websiteCount.toLocaleString()}</div>
                                    <small>Total Websites</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-success text-white p-2 rounded">
                                    <div class="h5 mb-0">${data.activeControls.toLocaleString()}</div>
                                    <small>Active Controls</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-info text-white p-2 rounded">
                                    <div class="h5 mb-0">${data.commandHistory}</div>
                                    <small>Commands</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="bg-warning text-white p-2 rounded">
                                    <div class="h5 mb-0">${Math.floor(data.uptime / 1000)}s</div>
                                    <small>Uptime</small>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <div class="badge bg-${data.status === 'active' ? 'success' : 'secondary'} w-100">
                                Status: ${data.status.toUpperCase()}
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Session monitoring error:', error);
        }
    };
    
    // Update immediately and then every 5 seconds
    updateSessionStats();
    setInterval(updateSessionStats, 5000);
}

function simulateAutomation(configId) {
    const performanceLog = document.getElementById('performanceLog');
    if (performanceLog) {
        performanceLog.innerHTML += '<div class="text-info">🎭 Starting simulation mode...</div>';
        
        let count = 0;
        const interval = setInterval(() => {
            count += Math.floor(Math.random() * 100) + 50;
            performanceLog.innerHTML += `<div class="text-success">✅ Processed ${count.toLocaleString()} instances</div>`;
            performanceLog.scrollTop = performanceLog.scrollHeight;
            
            if (count >= 1000) {
                clearInterval(interval);
                performanceLog.innerHTML += '<div class="text-warning">🎯 Simulation complete - 1M+ scale demonstrated</div>';
            }
        }, 500);
    }
}

function downloadConfig(configId) {
    alert(`Downloading configuration: ${configId}`);
    // Implementation would download the config file
}

function viewEmbedding(embeddingId) {
    alert(`Viewing embedding: ${embeddingId}`);
    // Implementation would show the specific embedding
}

// Demo functions
function loadBatchDemo() {
    const batchUrls = document.getElementById('batchUrls');
    const batchTab = document.getElementById('batch-tab');
    
    if (batchUrls) {
        batchUrls.value = 'https://example.com\nhttps://httpbin.org/html\nhttps://postman-echo.com\nhttps://github.com\nhttps://stackoverflow.com';
    }
    
    if (batchTab) {
        batchTab.click();
    }
}

function loadAutomationDemo() {
    const automationBaseUrl = document.getElementById('automationBaseUrl');
    const automationTab = document.getElementById('automation-tab');
    
    if (automationBaseUrl) {
        automationBaseUrl.value = 'https://example.com';
    }
    
    if (automationTab) {
        automationTab.click();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initWebsiteEmbedder === 'function') {
        initWebsiteEmbedder(); // Original functionality
    }
    initEnhancedWebsiteEmbedder(); // Enhanced functionality
});