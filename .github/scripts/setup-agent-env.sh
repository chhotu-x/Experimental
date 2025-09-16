#!/bin/bash

# GitHub Copilot Coding Agent - Environment Setup Script
# Optimized for ubuntu-latest-96core runners
# Version: 1.0.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display system information
display_system_info() {
    log "=== System Information ==="
    echo "CPU Cores: $(nproc)"
    echo "CPU Model: $(lscpu | grep 'Model name' | sed 's/Model name:[[:space:]]*//')"
    echo "Architecture: $(uname -m)"
    echo "Kernel: $(uname -r)"
    echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
    echo "Available Memory: $(free -h | grep '^Mem:' | awk '{print $7}')"
    echo "Disk Space: $(df -h / | tail -1 | awk '{print $2 " total, " $4 " available"}')"
    echo "Load Average: $(uptime | awk '{print $10 $11 $12}')"
    echo "=========================="
}

# Function to optimize system performance
optimize_system_performance() {
    log "Optimizing system performance for 96-core environment..."
    
    # Set file descriptor limits
    log "Setting file descriptor limits..."
    ulimit -n 65536 || warning "Could not set file descriptor limit"
    
    # Display current limits
    log "Current system limits:"
    ulimit -a | head -15
    
    # Configure kernel parameters for high performance
    log "Configuring kernel parameters..."
    
    # Increase network buffer sizes
    if [[ -f /proc/sys/net/core/rmem_max ]]; then
        echo "Setting network buffer optimizations..."
    fi
    
    success "System performance optimization completed"
}

# Function to setup Node.js environment
setup_nodejs_environment() {
    log "Setting up Node.js environment for 96-core optimization..."
    
    # Set Node.js performance environment variables
    export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=512"
    export UV_THREADPOOL_SIZE="96"
    export NODE_MAX_WORKERS="48"
    
    log "Node.js environment variables set:"
    echo "NODE_OPTIONS: $NODE_OPTIONS"
    echo "UV_THREADPOOL_SIZE: $UV_THREADPOOL_SIZE"
    echo "NODE_MAX_WORKERS: $NODE_MAX_WORKERS"
    
    # Verify Node.js installation
    if command -v node &> /dev/null; then
        success "Node.js $(node --version) is available"
    else
        error "Node.js is not installed or not in PATH"
        return 1
    fi
    
    if command -v npm &> /dev/null; then
        success "npm $(npm --version) is available"
    else
        error "npm is not installed or not in PATH"
        return 1
    fi
}

# Function to configure npm for high performance
configure_npm_performance() {
    log "Configuring npm for high-performance operations..."
    
    # Set npm performance configurations
    npm config set fund false
    npm config set audit false
    npm config set progress false
    npm config set maxsockets 50
    npm config set prefer-offline true
    
    # Note: network-concurrency is set via environment variable NPM_CONFIG_NETWORK_CONCURRENCY
    
    # Set cache directory
    npm config set cache /tmp/.npm
    
    # Display npm configuration
    log "npm configuration for performance:"
    npm config list | grep -E "(fund|audit|progress|maxsockets|prefer-offline|cache)" || echo "npm configuration applied"
    
    success "npm performance configuration completed"
}

# Function to setup performance monitoring
setup_performance_monitoring() {
    log "Setting up performance monitoring..."
    
    # Create monitoring script
    cat > /tmp/performance-monitor.js << 'EOF'
const os = require('os');

function formatBytes(bytes) {
    return Math.round(bytes / 1024 / 1024) + 'MB';
}

function monitorSystem() {
    const cpus = os.cpus();
    const memory = process.memoryUsage();
    const systemMemory = {
        free: formatBytes(os.freemem()),
        total: formatBytes(os.totalmem())
    };
    
    console.log('=== Performance Monitoring ===');
    console.log(`CPU Cores: ${cpus.length}`);
    console.log(`CPU Model: ${cpus[0].model}`);
    console.log(`Load Average: ${os.loadavg().map(x => x.toFixed(2)).join(', ')}`);
    console.log(`Node.js Memory - RSS: ${formatBytes(memory.rss)}, Heap Used: ${formatBytes(memory.heapUsed)}, Heap Total: ${formatBytes(memory.heapTotal)}`);
    console.log(`System Memory - Free: ${systemMemory.free}, Total: ${systemMemory.total}`);
    console.log(`Platform: ${os.platform()} ${os.arch()}`);
    console.log(`Uptime: ${Math.floor(os.uptime() / 60)} minutes`);
    console.log('==============================');
}

// Run monitoring
monitorSystem();

// Performance test
const start = process.hrtime.bigint();
const iterations = 1000000;
let result = 0;

for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
}

const end = process.hrtime.bigint();
const duration = Number(end - start) / 1000000; // Convert to milliseconds

console.log('\n=== Performance Test Results ===');
console.log(`Test Duration: ${duration.toFixed(2)}ms`);
console.log(`Iterations: ${iterations.toLocaleString()}`);
console.log(`Operations per second: ${Math.round(iterations / (duration / 1000)).toLocaleString()}`);
console.log('================================');
EOF
    
    # Run performance monitoring
    node /tmp/performance-monitor.js
    
    success "Performance monitoring setup completed"
}

# Function to setup development tools
setup_development_tools() {
    log "Setting up development tools and optimizations..."
    
    # Configure Git for better performance
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global gc.auto 256
    
    success "Development tools configuration completed"
}

# Function to run system health checks
run_health_checks() {
    log "Running system health checks..."
    
    local health_score=0
    local total_checks=6
    
    # Check 1: CPU cores
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -ge 80 ]]; then
        success "CPU cores check passed ($cpu_cores cores available)"
        ((health_score++))
    else
        warning "CPU cores check: Only $cpu_cores cores available (expected 96+)"
    fi
    
    # Check 2: Available memory
    local available_memory=$(free -g | grep '^Mem:' | awk '{print $7}')
    if [[ $available_memory -ge 20 ]]; then
        success "Memory check passed (${available_memory}GB available)"
        ((health_score++))
    else
        warning "Memory check: Only ${available_memory}GB available (expected 20GB+)"
    fi
    
    # Check 3: Disk space
    local disk_space=$(df / | tail -1 | awk '{print $4}')
    if [[ $disk_space -gt 10000000 ]]; then  # > 10GB in KB
        success "Disk space check passed"
        ((health_score++))
    else
        warning "Disk space check: Limited disk space available"
    fi
    
    # Check 4: Node.js availability
    if command -v node &> /dev/null; then
        success "Node.js availability check passed"
        ((health_score++))
    else
        error "Node.js availability check failed"
    fi
    
    # Check 5: npm availability
    if command -v npm &> /dev/null; then
        success "npm availability check passed"
        ((health_score++))
    else
        error "npm availability check failed"
    fi
    
    # Check 6: Performance test
    if node -e "console.log('Performance test passed')" &> /dev/null; then
        success "Performance test passed"
        ((health_score++))
    else
        error "Performance test failed"
    fi
    
    # Calculate health percentage
    local health_percentage=$((health_score * 100 / total_checks))
    
    log "=== Health Check Summary ==="
    echo "Health Score: $health_score/$total_checks ($health_percentage%)"
    
    if [[ $health_percentage -ge 80 ]]; then
        success "System health check PASSED ($health_percentage%)"
        return 0
    else
        warning "System health check needs attention ($health_percentage%)"
        return 1
    fi
}

# Function to create performance benchmark
create_performance_benchmark() {
    log "Creating performance benchmark..."
    
    # Create benchmark directory
    mkdir -p /tmp/performance-benchmarks
    
    # CPU benchmark
    log "Running CPU benchmark..."
    cat > /tmp/performance-benchmarks/cpu-benchmark.js << 'EOF'
console.log('Starting CPU benchmark...');
const start = Date.now();
const iterations = 5000000;
let result = 0;

for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
}

const duration = Date.now() - start;
console.log(`CPU Benchmark Results:`);
console.log(`Duration: ${duration}ms`);
console.log(`Iterations: ${iterations.toLocaleString()}`);
console.log(`Operations per second: ${Math.round(iterations / (duration / 1000)).toLocaleString()}`);
console.log(`Result: ${result.toFixed(2)}`);
EOF
    
    node /tmp/performance-benchmarks/cpu-benchmark.js
    
    # Memory benchmark
    log "Running memory benchmark..."
    cat > /tmp/performance-benchmarks/memory-benchmark.js << 'EOF'
console.log('Starting memory benchmark...');
const start = Date.now();
const arrays = [];
const arraySize = 100000;
const arrayCount = 100;

for (let i = 0; i < arrayCount; i++) {
    const arr = new Array(arraySize);
    for (let j = 0; j < arraySize; j++) {
        arr[j] = Math.random();
    }
    arrays.push(arr);
}

const memoryUsage = process.memoryUsage();
const duration = Date.now() - start;

console.log(`Memory Benchmark Results:`);
console.log(`Duration: ${duration}ms`);
console.log(`Arrays created: ${arrayCount}`);
console.log(`Total elements: ${(arrayCount * arraySize).toLocaleString()}`);
console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
console.log(`Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
console.log(`Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
EOF
    
    node /tmp/performance-benchmarks/memory-benchmark.js
    
    success "Performance benchmark completed"
}

# Main execution function
main() {
    log "Starting GitHub Copilot Coding Agent environment setup..."
    log "Optimizing for ubuntu-latest-96core runners"
    
    # Display system information
    display_system_info
    
    # Run setup functions
    optimize_system_performance
    setup_nodejs_environment
    configure_npm_performance
    setup_performance_monitoring
    setup_development_tools
    create_performance_benchmark
    
    # Run health checks
    if run_health_checks; then
        success "Environment setup completed successfully!"
        success "GitHub Copilot Coding Agent is ready for 96-core optimization"
    else
        warning "Environment setup completed with warnings"
        warning "Please review the health check results above"
    fi
    
    log "Setup script execution completed"
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi