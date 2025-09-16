/**
 * 🔄 Parallel Task Executor with Worker Management
 * Advanced parallel execution framework for automation tasks
 */

class ParallelTaskExecutor {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.activeJobs = new Map();
        this.completedJobs = new Map();
        this.workerPool = new WorkerPool();
        this.resourceManager = new ResourceManager();
        this.scheduler = new TaskScheduler();
        
        // Configuration
        this.maxWorkers = navigator.hardwareConcurrency || 4;
        this.maxQueueSize = 1000;
        this.jobTimeout = 30000; // 30 seconds
        
        this.metrics = {
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            averageExecutionTime: 0,
            parallelEfficiency: 0
        };
    }

    async initialize() {
        // Initialize worker pool
        await this.workerPool.initialize(this.maxWorkers);
        
        // Initialize resource manager
        await this.resourceManager.initialize();
        
        // Start task scheduler
        this.scheduler.start();
        
        console.log(`🔄 Parallel executor initialized with ${this.maxWorkers} workers`);
    }

    /**
     * Execute task with parallel processing
     */
    async execute(taskId, taskConfig) {
        if (this.taskQueue.length >= this.maxQueueSize) {
            throw new Error('Task queue is full');
        }

        const job = {
            id: taskId,
            config: taskConfig,
            priority: taskConfig.priority || 0,
            timeout: taskConfig.timeout || this.jobTimeout,
            createdAt: Date.now(),
            retries: 0,
            maxRetries: taskConfig.maxRetries || 3
        };

        // Add to queue
        this.taskQueue.push(job);
        this.metrics.totalJobs++;

        // Schedule execution
        return await this.scheduleExecution(job);
    }

    /**
     * Execute multiple tasks in parallel
     */
    async executeParallel(tasks) {
        const batchId = `batch_${Date.now()}`;
        const jobs = tasks.map((task, index) => ({
            id: `${batchId}_${index}`,
            config: task,
            priority: task.priority || 0,
            batchId
        }));

        // Analyze task dependencies
        const dependencyGraph = this.buildDependencyGraph(jobs);
        
        // Create execution waves
        const executionWaves = this.createExecutionWaves(dependencyGraph);
        
        // Execute waves sequentially, tasks in each wave in parallel
        const results = [];
        for (const wave of executionWaves) {
            const waveResults = await Promise.allSettled(
                wave.map(job => this.executeJob(job))
            );
            results.push(...waveResults);
        }

        return results;
    }

    /**
     * Schedule job execution based on priority and resources
     */
    async scheduleExecution(job) {
        return new Promise((resolve, reject) => {
            // Add to scheduler
            this.scheduler.scheduleJob(job, {
                onComplete: (result) => {
                    this.handleJobCompletion(job, result);
                    resolve(result);
                },
                onError: (error) => {
                    this.handleJobError(job, error);
                    reject(error);
                },
                onTimeout: () => {
                    this.handleJobTimeout(job);
                    reject(new Error(`Job ${job.id} timed out`));
                }
            });
        });
    }

    /**
     * Execute individual job
     */
    async executeJob(job) {
        const startTime = performance.now();
        
        try {
            // Check resource availability
            const resources = await this.resourceManager.allocateResources(job);
            
            // Get available worker
            const worker = await this.workerPool.getWorker();
            
            // Execute task
            this.activeJobs.set(job.id, { job, worker, startTime, resources });
            
            const result = await this.runTaskInWorker(worker, job, resources);
            
            // Record success
            const executionTime = performance.now() - startTime;
            this.recordJobSuccess(job, result, executionTime);
            
            return result;
            
        } catch (error) {
            // Handle failure
            this.recordJobFailure(job, error);
            
            // Retry if possible
            if (job.retries < job.maxRetries) {
                job.retries++;
                return await this.executeJob(job);
            }
            
            throw error;
        } finally {
            // Clean up
            if (this.activeJobs.has(job.id)) {
                const { worker, resources } = this.activeJobs.get(job.id);
                this.workerPool.releaseWorker(worker);
                this.resourceManager.releaseResources(resources);
                this.activeJobs.delete(job.id);
            }
        }
    }

    /**
     * Run task in web worker
     */
    async runTaskInWorker(worker, job, resources) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker execution timeout'));
            }, job.timeout);

            worker.onMessage = (result) => {
                clearTimeout(timeout);
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result.data);
                }
            };

            worker.onError = (error) => {
                clearTimeout(timeout);
                reject(error);
            };

            // Send task to worker
            worker.postMessage({
                type: 'EXECUTE_TASK',
                job: job,
                resources: resources
            });
        });
    }

    /**
     * Build dependency graph for tasks
     */
    buildDependencyGraph(jobs) {
        const graph = new Map();
        
        jobs.forEach(job => {
            const dependencies = job.config.dependencies || [];
            graph.set(job.id, {
                job,
                dependencies,
                dependents: []
            });
        });

        // Build dependent relationships
        for (const [jobId, node] of graph) {
            node.dependencies.forEach(depId => {
                if (graph.has(depId)) {
                    graph.get(depId).dependents.push(jobId);
                }
            });
        }

        return graph;
    }

    /**
     * Create execution waves based on dependencies
     */
    createExecutionWaves(dependencyGraph) {
        const waves = [];
        const processed = new Set();
        
        while (processed.size < dependencyGraph.size) {
            const currentWave = [];
            
            for (const [jobId, node] of dependencyGraph) {
                if (processed.has(jobId)) continue;
                
                // Check if all dependencies are processed
                const canExecute = node.dependencies.every(depId => processed.has(depId));
                
                if (canExecute) {
                    currentWave.push(node.job);
                    processed.add(jobId);
                }
            }
            
            if (currentWave.length === 0) {
                throw new Error('Circular dependency detected in task graph');
            }
            
            waves.push(currentWave);
        }
        
        return waves;
    }

    /**
     * Redistribute tasks for load balancing
     */
    async redistributeTasks() {
        // Analyze current load
        const loadAnalysis = this.analyzeWorkerLoad();
        
        // Identify overloaded workers
        const overloadedWorkers = loadAnalysis.filter(w => w.load > 0.8);
        const underloadedWorkers = loadAnalysis.filter(w => w.load < 0.5);
        
        // Redistribute tasks
        for (const overloaded of overloadedWorkers) {
            const tasksToMove = Math.floor(overloaded.tasks.length * 0.3);
            const tasks = overloaded.tasks.splice(-tasksToMove);
            
            // Distribute to underloaded workers
            const targetWorker = underloadedWorkers.find(w => w.load < 0.7);
            if (targetWorker) {
                targetWorker.tasks.push(...tasks);
                targetWorker.load = targetWorker.tasks.length / this.getMaxTasksPerWorker();
            }
        }
        
        console.log('🔄 Task redistribution completed');
    }

    /**
     * Analyze worker load distribution
     */
    analyzeWorkerLoad() {
        return this.workers.map(worker => ({
            id: worker.id,
            tasks: worker.getCurrentTasks(),
            load: worker.getCurrentLoad(),
            performance: worker.getPerformanceMetrics()
        }));
    }

    getMaxTasksPerWorker() {
        return Math.ceil(this.maxQueueSize / this.maxWorkers);
    }

    // Event handlers
    handleJobCompletion(job, result) {
        this.completedJobs.set(job.id, {
            job,
            result,
            completedAt: Date.now()
        });
        
        this.metrics.completedJobs++;
        this.updateMetrics();
    }

    handleJobError(job, error) {
        this.metrics.failedJobs++;
        console.error(`Job ${job.id} failed:`, error);
    }

    handleJobTimeout(job) {
        this.metrics.failedJobs++;
        console.warn(`Job ${job.id} timed out after ${job.timeout}ms`);
    }

    recordJobSuccess(job, result, executionTime) {
        // Update average execution time
        const totalTime = this.metrics.averageExecutionTime * this.metrics.completedJobs;
        this.metrics.averageExecutionTime = (totalTime + executionTime) / (this.metrics.completedJobs + 1);
        
        // Calculate parallel efficiency
        const serialTime = this.estimateSerialExecutionTime(job);
        const efficiency = serialTime / executionTime;
        this.metrics.parallelEfficiency = (this.metrics.parallelEfficiency + efficiency) / 2;
    }

    recordJobFailure(job, error) {
        console.error(`Job ${job.id} failed:`, error);
    }

    estimateSerialExecutionTime(job) {
        // Estimate based on task type and complexity
        const baseTime = job.config.estimatedTime || 1000;
        return baseTime;
    }

    updateMetrics() {
        // Update real-time metrics
        this.metrics.successRate = this.metrics.completedJobs / this.metrics.totalJobs;
        this.metrics.failureRate = this.metrics.failedJobs / this.metrics.totalJobs;
        this.metrics.queueLength = this.taskQueue.length;
        this.metrics.activeJobs = this.activeJobs.size;
    }

    // Public API
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }

    getSystemStatus() {
        return {
            workers: this.workers.length,
            activeJobs: this.activeJobs.size,
            queueLength: this.taskQueue.length,
            performance: this.getMetrics()
        };
    }

    async shutdown() {
        // Stop scheduler
        this.scheduler.stop();
        
        // Terminate workers
        await this.workerPool.terminate();
        
        // Clear queues
        this.taskQueue.length = 0;
        this.activeJobs.clear();
        
        console.log('🔄 Parallel executor shutdown completed');
    }
}

/**
 * 👥 Worker Pool Management
 */
class WorkerPool {
    constructor() {
        this.workers = [];
        this.availableWorkers = [];
        this.busyWorkers = new Set();
    }

    async initialize(maxWorkers) {
        // Create web workers for parallel execution
        for (let i = 0; i < maxWorkers; i++) {
            const worker = await this.createWorker(i);
            this.workers.push(worker);
            this.availableWorkers.push(worker);
        }
    }

    async createWorker(id) {
        // Create worker with automation capabilities
        const workerCode = this.generateWorkerCode();
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        const worker = new Worker(workerUrl);
        worker.id = id;
        worker.tasksCompleted = 0;
        worker.startTime = Date.now();
        
        return worker;
    }

    generateWorkerCode() {
        return `
            // Web Worker code for automation tasks
            self.onmessage = function(e) {
                const { type, job, resources } = e.data;
                
                if (type === 'EXECUTE_TASK') {
                    executeAutomationTask(job, resources)
                        .then(result => {
                            self.postMessage({ data: result });
                        })
                        .catch(error => {
                            self.postMessage({ error: error.message });
                        });
                }
            };
            
            async function executeAutomationTask(job, resources) {
                // Simulate task execution based on type
                const { config } = job;
                
                switch (config.type) {
                    case 'click':
                        return await simulateClick(config);
                    case 'fill':
                        return await simulateFill(config);
                    case 'harvest':
                        return await simulateHarvest(config);
                    default:
                        throw new Error('Unknown task type: ' + config.type);
                }
            }
            
            async function simulateClick(config) {
                // Simulate click operation
                await delay(Math.random() * 100 + 50);
                return { success: true, selector: config.selector };
            }
            
            async function simulateFill(config) {
                // Simulate form filling
                await delay(Math.random() * 200 + 100);
                return { success: true, fieldsCount: Object.keys(config.data || {}).length };
            }
            
            async function simulateHarvest(config) {
                // Simulate data harvesting
                await delay(Math.random() * 500 + 200);
                return { success: true, dataPoints: Math.floor(Math.random() * 100) + 1 };
            }
            
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        `;
    }

    async getWorker() {
        if (this.availableWorkers.length === 0) {
            // Wait for a worker to become available
            return await this.waitForAvailableWorker();
        }
        
        const worker = this.availableWorkers.pop();
        this.busyWorkers.add(worker);
        return worker;
    }

    releaseWorker(worker) {
        this.busyWorkers.delete(worker);
        this.availableWorkers.push(worker);
        worker.tasksCompleted++;
    }

    async waitForAvailableWorker() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.availableWorkers.length > 0) {
                    clearInterval(checkInterval);
                    resolve(this.getWorker());
                }
            }, 10);
        });
    }

    async terminate() {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers.length = 0;
        this.availableWorkers.length = 0;
        this.busyWorkers.clear();
    }
}

/**
 * 📋 Task Scheduler with Priority Queue
 */
class TaskScheduler {
    constructor() {
        this.priorityQueue = [];
        this.running = false;
        this.schedulerInterval = null;
    }

    start() {
        this.running = true;
        this.schedulerInterval = setInterval(() => {
            this.processQueue();
        }, 50); // Process queue every 50ms
    }

    stop() {
        this.running = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }
    }

    scheduleJob(job, callbacks) {
        this.priorityQueue.push({
            ...job,
            callbacks,
            scheduledAt: Date.now()
        });
        
        // Sort by priority (higher priority first)
        this.priorityQueue.sort((a, b) => b.priority - a.priority);
    }

    processQueue() {
        if (!this.running || this.priorityQueue.length === 0) {
            return;
        }

        // Process highest priority job
        const job = this.priorityQueue.shift();
        this.executeScheduledJob(job);
    }

    async executeScheduledJob(job) {
        try {
            // Execute the job (placeholder - actual execution handled by ParallelTaskExecutor)
            const result = await this.mockJobExecution(job);
            job.callbacks.onComplete(result);
        } catch (error) {
            job.callbacks.onError(error);
        }
    }

    async mockJobExecution(job) {
        // Mock execution for demonstration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        return { success: true, jobId: job.id };
    }
}

// Export classes
window.ParallelTaskExecutor = ParallelTaskExecutor;
window.WorkerPool = WorkerPool;
window.TaskScheduler = TaskScheduler;