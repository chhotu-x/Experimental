/**
 * Integration Tests for Enhanced Embedder and Automation System
 */

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    testUrls: [
        'https://example.com',
        'https://httpbin.org/html'
    ],
    automationConfig: {
        baseUrl: 'https://example.com',
        count: 100,
        pattern: 'sequential'
    }
};

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message = '') {
    testResults.tests.push({ name, passed, message });
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${name}: PASSED ${message}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: FAILED ${message}`);
    }
}

async function runTests() {
    console.log('🚀 Starting Enhanced Embedder Integration Tests...\n');
    
    try {
        // Test 1: System Stats API
        await testSystemStats();
        
        // Test 2: Single Embedding API
        await testSingleEmbedding();
        
        // Test 3: Batch Embedding API
        await testBatchEmbedding();
        
        // Test 4: Automation Config Creation
        await testAutomationConfig();
        
        // Test 5: Automation Session Management
        await testAutomationSession();
        
        // Test 6: Real-time Command Execution
        await testRealTimeCommands();
        
        // Print test results
        printTestResults();
        
    } catch (error) {
        console.error('Test suite failed:', error);
    }
}

async function testSystemStats() {
    try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stats`);
        const data = await response.json();
        
        const hasEmbeddingStats = data.embedding && typeof data.embedding.totalEmbeddings === 'number';
        const hasProxyStats = data.proxy && typeof data.proxy.totalRequests === 'number';
        const hasSystemStats = data.system && data.system.uptime;
        
        logTest('System Stats API', hasEmbeddingStats && hasProxyStats && hasSystemStats, 
                `Embedding: ${hasEmbeddingStats}, Proxy: ${hasProxyStats}, System: ${hasSystemStats}`);
    } catch (error) {
        logTest('System Stats API', false, error.message);
    }
}

async function testSingleEmbedding() {
    try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/embed/single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: TEST_CONFIG.testUrls[0] })
        });
        
        const data = await response.json();
        const isSuccess = data.success && data.embeddingId && data.content;
        
        logTest('Single Embedding API', isSuccess, 
                `Success: ${data.success}, ProcessingTime: ${data.processingTime}ms`);
    } catch (error) {
        logTest('Single Embedding API', false, error.message);
    }
}

async function testBatchEmbedding() {
    try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/embed/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: TEST_CONFIG.testUrls })
        });
        
        const data = await response.json();
        const isSuccess = data.success && data.batchId && data.summary;
        
        logTest('Batch Embedding API', isSuccess, 
                `BatchId: ${data.batchId}, Total: ${data.summary?.total}, Completed: ${data.summary?.completed}`);
    } catch (error) {
        logTest('Batch Embedding API', false, error.message);
    }
}

async function testAutomationConfig() {
    try {
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/automation/massive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CONFIG.automationConfig)
        });
        
        const data = await response.json();
        const isSuccess = data.success && data.config && data.totalGenerated;
        
        logTest('Automation Config API', isSuccess, 
                `Generated: ${data.totalGenerated}, EstimatedTime: ${data.estimatedProcessingTime}ms`);
    } catch (error) {
        logTest('Automation Config API', false, error.message);
    }
}

async function testAutomationSession() {
    try {
        // Create session
        const createResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/automation/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: TEST_CONFIG.automationConfig })
        });
        
        const createData = await createResponse.json();
        
        if (!createData.success) {
            throw new Error('Failed to create session');
        }
        
        const sessionId = createData.sessionId;
        
        // Start session
        const startResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/automation/sessions/${sessionId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options: {} })
        });
        
        const startData = await startResponse.json();
        const isSuccess = createData.success && startData.success;
        
        logTest('Automation Session Management', isSuccess, 
                `SessionId: ${sessionId}, Status: ${startData.status}`);
        
        // Store session ID for next test
        window.testSessionId = sessionId;
        
    } catch (error) {
        logTest('Automation Session Management', false, error.message);
    }
}

async function testRealTimeCommands() {
    try {
        const sessionId = window.testSessionId;
        
        if (!sessionId) {
            throw new Error('No session ID available from previous test');
        }
        
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/automation/sessions/${sessionId}/commands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                command: { 
                    type: 'click', 
                    selector: '#test-button' 
                } 
            })
        });
        
        const data = await response.json();
        const isSuccess = data.success && data.commandId && typeof data.resultsCount === 'number';
        
        logTest('Real-time Command Execution', isSuccess, 
                `CommandId: ${data.commandId}, Results: ${data.resultsCount}, Failed: ${data.failedCount}`);
                
    } catch (error) {
        logTest('Real-time Command Execution', false, error.message);
    }
}

function printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);
    
    if (testResults.failed === 0) {
        console.log('🎉 All tests passed! The Enhanced Embedder and Automation System is working perfectly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    return testResults;
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
    window.runIntegrationTests = runTests;
    window.testResults = testResults;
    console.log('Integration tests loaded. Run window.runIntegrationTests() to execute.');
} else if (typeof module !== 'undefined') {
    module.exports = { runTests, testResults };
}