#!/usr/bin/env node

/**
 * GitHub Copilot Coding Agent - Performance Validation Script
 * Tests and validates the 96-core optimization setup
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class PerformanceValidator {
    constructor() {
        this.results = {
            systemInfo: {},
            performanceTests: {},
            configurationTests: {},
            recommendations: []
        };
    }

    // System information gathering
    gatherSystemInfo() {
        console.log('📊 Gathering system information...');
        
        const cpus = os.cpus();
        const memory = process.memoryUsage();
        
        this.results.systemInfo = {
            cpuCores: cpus.length,
            cpuModel: cpus[0].model,
            architecture: os.arch(),
            platform: os.platform(),
            nodeVersion: process.version,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB',
            loadAverage: os.loadavg(),
            uptime: Math.floor(os.uptime() / 60) + ' minutes',
            processMemory: {
                rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
                external: Math.round(memory.external / 1024 / 1024) + 'MB'
            }
        };

        console.log('✅ System information gathered');
        return this.results.systemInfo;
    }

    // CPU performance test
    async runCpuPerformanceTest() {
        console.log('🔥 Running CPU performance test...');
        
        const start = performance.now();
        const iterations = 5000000;
        let result = 0;

        // CPU-intensive calculation
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }

        const duration = performance.now() - start;
        const opsPerSecond = Math.round(iterations / (duration / 1000));

        this.results.performanceTests.cpu = {
            duration: Math.round(duration) + 'ms',
            iterations: iterations.toLocaleString(),
            operationsPerSecond: opsPerSecond.toLocaleString(),
            result: result.toFixed(2),
            score: this.calculateCpuScore(duration, iterations)
        };

        console.log(`✅ CPU test completed in ${Math.round(duration)}ms`);
        return this.results.performanceTests.cpu;
    }

    // Memory performance test
    async runMemoryPerformanceTest() {
        console.log('🧠 Running memory performance test...');
        
        const start = performance.now();
        const arrays = [];
        const arraySize = 100000;
        const arrayCount = 200;

        // Memory allocation test
        for (let i = 0; i < arrayCount; i++) {
            const arr = new Array(arraySize);
            for (let j = 0; j < arraySize; j++) {
                arr[j] = Math.random() * 1000;
            }
            arrays.push(arr);
        }

        // Memory access test
        let sum = 0;
        for (const arr of arrays) {
            for (let i = 0; i < arr.length; i += 100) {
                sum += arr[i];
            }
        }

        const duration = performance.now() - start;
        const memoryUsage = process.memoryUsage();

        this.results.performanceTests.memory = {
            duration: Math.round(duration) + 'ms',
            arraysCreated: arrayCount.toLocaleString(),
            totalElements: (arrayCount * arraySize).toLocaleString(),
            memoryAllocated: Math.round(arrays.length * arraySize * 8 / 1024 / 1024) + 'MB',
            finalSum: sum.toFixed(2),
            processMemory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
            },
            score: this.calculateMemoryScore(duration, arrayCount * arraySize)
        };

        console.log(`✅ Memory test completed in ${Math.round(duration)}ms`);
        return this.results.performanceTests.memory;
    }

    // Parallel processing test
    async runParallelProcessingTest() {
        console.log('⚡ Running parallel processing test...');
        
        const start = performance.now();
        const workerCount = Math.min(os.cpus().length, 48); // Use up to 48 cores
        const taskCount = 1000;
        const tasksPerWorker = Math.ceil(taskCount / workerCount);

        // Simulate parallel work
        const workers = [];
        for (let i = 0; i < workerCount; i++) {
            workers.push(this.simulateWorkerTask(tasksPerWorker, i));
        }

        const results = await Promise.all(workers);
        const duration = performance.now() - start;
        const totalOperations = results.reduce((sum, result) => sum + result.operations, 0);

        this.results.performanceTests.parallel = {
            duration: Math.round(duration) + 'ms',
            workerCount: workerCount,
            totalTasks: taskCount,
            totalOperations: totalOperations.toLocaleString(),
            operationsPerSecond: Math.round(totalOperations / (duration / 1000)).toLocaleString(),
            efficiency: Math.round((totalOperations / duration) * 100) / 100,
            score: this.calculateParallelScore(duration, totalOperations, workerCount)
        };

        console.log(`✅ Parallel test completed using ${workerCount} workers`);
        return this.results.performanceTests.parallel;
    }

    // Simulate worker task
    async simulateWorkerTask(taskCount, workerId) {
        return new Promise((resolve) => {
            let operations = 0;
            const start = performance.now();

            for (let i = 0; i < taskCount; i++) {
                // Simulate CPU work
                for (let j = 0; j < 10000; j++) {
                    Math.sqrt(j * workerId + i);
                    operations++;
                }
            }

            const duration = performance.now() - start;
            resolve({ workerId, operations, duration });
        });
    }

    // Configuration validation
    validateConfiguration() {
        console.log('⚙️ Validating configuration...');
        
        const config = {
            nodeOptions: process.env.NODE_OPTIONS || '',
            uvThreadpoolSize: process.env.UV_THREADPOOL_SIZE || '',
            npmMaxSockets: process.env.NPM_CONFIG_MAXSOCKETS || '',
            jestWorkers: process.env.JEST_WORKERS || '',
            nodeMaxWorkers: process.env.NODE_MAX_WORKERS || ''
        };

        const validations = {
            nodeOptionsValid: config.nodeOptions.includes('max-old-space-size'),
            uvThreadpoolOptimized: parseInt(config.uvThreadpoolSize) >= 48,
            npmOptimized: parseInt(config.npmMaxSockets) >= 20,
            jestConfigured: config.jestWorkers.includes('%') || parseInt(config.jestWorkers) > 1,
            workersConfigured: parseInt(config.nodeMaxWorkers) >= 24
        };

        this.results.configurationTests = {
            environment: config,
            validations: validations,
            score: Object.values(validations).filter(Boolean).length / Object.keys(validations).length * 100
        };

        console.log('✅ Configuration validation completed');
        return this.results.configurationTests;
    }

    // Check GitHub Actions workflow
    checkWorkflowConfiguration() {
        console.log('📋 Checking workflow configuration...');
        
        const workflowPath = '.github/workflows/copilot-coding-agent-96core.yml';
        const configPath = '.github/copilot-agent.yml';
        const setupScriptPath = '.github/scripts/setup-agent-env.sh';

        const checks = {
            workflowExists: fs.existsSync(workflowPath),
            configExists: fs.existsSync(configPath),
            setupScriptExists: fs.existsSync(setupScriptPath),
            setupScriptExecutable: false
        };

        // Check if setup script is executable
        if (checks.setupScriptExists) {
            try {
                const stats = fs.statSync(setupScriptPath);
                checks.setupScriptExecutable = !!(stats.mode & parseInt('111', 8));
            } catch (error) {
                checks.setupScriptExecutable = false;
            }
        }

        this.results.workflowValidation = checks;
        console.log('✅ Workflow configuration checked');
        return checks;
    }

    // Calculate performance scores
    calculateCpuScore(duration, iterations) {
        const baseline = 2000; // Baseline duration in ms for comparison
        const score = Math.max(0, Math.min(100, (baseline / duration) * 50));
        return Math.round(score);
    }

    calculateMemoryScore(duration, elements) {
        const baseline = 1000; // Baseline duration in ms
        const score = Math.max(0, Math.min(100, (baseline / duration) * 50));
        return Math.round(score);
    }

    calculateParallelScore(duration, operations, workers) {
        const efficiency = operations / (duration * workers);
        const score = Math.min(100, efficiency / 100);
        return Math.round(score);
    }

    // Generate recommendations
    generateRecommendations() {
        const cpuCores = this.results.systemInfo.cpuCores;
        const config = this.results.configurationTests;

        if (cpuCores < 80) {
            this.results.recommendations.push('⚠️ Consider using ubuntu-latest-96core runners for optimal performance');
        }

        if (!config.validations.nodeOptionsValid) {
            this.results.recommendations.push('🔧 Set NODE_OPTIONS with --max-old-space-size=8192 for better memory management');
        }

        if (!config.validations.uvThreadpoolOptimized) {
            this.results.recommendations.push('🔧 Set UV_THREADPOOL_SIZE to 96 for optimal thread utilization');
        }

        if (!config.validations.npmOptimized) {
            this.results.recommendations.push('🔧 Increase NPM_CONFIG_MAXSOCKETS to 50 for faster package installation');
        }

        if (this.results.performanceTests.parallel?.score < 50) {
            this.results.recommendations.push('⚡ Consider optimizing parallel processing configuration');
        }

        if (this.results.recommendations.length === 0) {
            this.results.recommendations.push('🎉 Configuration is optimized for 96-core performance!');
        }
    }

    // Generate report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 GITHUB COPILOT CODING AGENT - PERFORMANCE VALIDATION REPORT');
        console.log('='.repeat(80));

        // System Information
        console.log('\n🖥️ SYSTEM INFORMATION:');
        console.log(`CPU Cores: ${this.results.systemInfo.cpuCores}`);
        console.log(`CPU Model: ${this.results.systemInfo.cpuModel}`);
        console.log(`Node.js Version: ${this.results.systemInfo.nodeVersion}`);
        console.log(`Total Memory: ${this.results.systemInfo.totalMemory}`);
        console.log(`Free Memory: ${this.results.systemInfo.freeMemory}`);
        console.log(`Platform: ${this.results.systemInfo.platform} ${this.results.systemInfo.architecture}`);

        // Performance Test Results
        console.log('\n⚡ PERFORMANCE TEST RESULTS:');
        if (this.results.performanceTests.cpu) {
            console.log(`CPU Performance: ${this.results.performanceTests.cpu.operationsPerSecond} ops/sec (Score: ${this.results.performanceTests.cpu.score}/100)`);
        }
        if (this.results.performanceTests.memory) {
            console.log(`Memory Performance: ${this.results.performanceTests.memory.duration} for ${this.results.performanceTests.memory.totalElements} elements (Score: ${this.results.performanceTests.memory.score}/100)`);
        }
        if (this.results.performanceTests.parallel) {
            console.log(`Parallel Processing: ${this.results.performanceTests.parallel.workerCount} workers, ${this.results.performanceTests.parallel.operationsPerSecond} ops/sec (Score: ${this.results.performanceTests.parallel.score}/100)`);
        }

        // Configuration Status
        console.log('\n⚙️ CONFIGURATION STATUS:');
        const config = this.results.configurationTests;
        if (config) {
            console.log(`Overall Configuration Score: ${Math.round(config.score)}%`);
            Object.entries(config.validations).forEach(([key, value]) => {
                const status = value ? '✅' : '❌';
                console.log(`${status} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            });
        }

        // Workflow Validation
        console.log('\n📋 WORKFLOW VALIDATION:');
        const workflow = this.results.workflowValidation;
        if (workflow) {
            Object.entries(workflow).forEach(([key, value]) => {
                const status = value ? '✅' : '❌';
                console.log(`${status} ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            });
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        this.results.recommendations.forEach(rec => console.log(rec));

        console.log('\n' + '='.repeat(80));
        console.log('✅ Performance validation completed!');
        console.log('='.repeat(80));
    }

    // Save results to file
    saveResults() {
        const resultsPath = 'performance-validation-results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 Results saved to ${resultsPath}`);
    }

    // Main execution method
    async run() {
        console.log('🚀 Starting GitHub Copilot Coding Agent Performance Validation...\n');

        try {
            // Run all tests
            this.gatherSystemInfo();
            await this.runCpuPerformanceTest();
            await this.runMemoryPerformanceTest();
            await this.runParallelProcessingTest();
            this.validateConfiguration();
            this.checkWorkflowConfiguration();
            this.generateRecommendations();

            // Generate and display report
            this.generateReport();
            this.saveResults();

        } catch (error) {
            console.error('❌ Error during performance validation:', error.message);
            process.exit(1);
        }
    }
}

// Run the validator if this script is executed directly
if (require.main === module) {
    const validator = new PerformanceValidator();
    validator.run().catch(console.error);
}

module.exports = PerformanceValidator;