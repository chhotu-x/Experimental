#!/bin/bash

# GitHub Copilot Coding Agent Setup Script
# This script prepares the environment for optimal performance on ubuntu-latest-96core runners

set -euo pipefail

echo "🚀 Setting up GitHub Copilot Coding Agent Environment"
echo "Runner: ubuntu-latest-96core (96 CPU cores)"

# System Information
echo "📊 System Resources:"
echo "  CPU Cores: $(nproc)"
echo "  Memory: $(free -h | awk 'NR==2{printf "%.1fG/%.1fG (%.2f%%)", $3/1024/1024, $2/1024/1024, $3*100/$2}')"
echo "  Disk Space: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3, $2, $5}')"

# Optimize system settings for large-scale operations
echo "⚙️  Optimizing system settings..."

# Increase file descriptor limits
ulimit -n 65536

# Set optimal npm configuration for 96-core performance
npm config set maxsockets 96
npm config set prefer-offline true
npm config set audit false
npm config set fund false
npm config set progress false

# Configure Git for better performance
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 0

# Set Node.js optimizations for 96-core system
export NODE_OPTIONS="--max-old-space-size=16384 --max-semi-space-size=512"
export UV_THREADPOOL_SIZE=96

# Configure npm for high-performance parallel operations
export NPM_CONFIG_MAXSOCKETS=96

# Set up optimal cache directories
mkdir -p /tmp/.npm /tmp/.yarn
npm config set cache /tmp/.npm

echo "✅ Environment optimization complete"

# Verify setup
echo "🔍 Verifying environment..."
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Git: $(git --version)"
echo "  ulimit -n: $(ulimit -n)"

# Performance test specifically designed for 96-core system
echo "🏃 Running 96-core performance test..."
start_time=$(date +%s)

# Create test directory and files
mkdir -p /tmp/perf-test-96core
cd /tmp/perf-test-96core

# Test parallel file operations using all 96 cores
echo "  Testing parallel file operations (96 cores)..."
seq 1 5000 | xargs -P 96 -I {} touch file_{}.txt
echo "  ✓ Created 5000 files using 96 parallel processes"

# Test CPU-intensive operations
echo "  Testing CPU performance..."
node -e "
const os = require('os');
const cpus = os.cpus().length;
console.log(\`  ✓ Detected \${cpus} CPU cores\`);

// Simple CPU-intensive test
console.log('  ✓ Running CPU performance test...');
const start = Date.now();
let result = 0;
for (let i = 0; i < 1000000; i++) {
  result += Math.sqrt(i);
}
const duration = Date.now() - start;
console.log(\`  ✓ CPU test completed in \${duration}ms (result: \${Math.floor(result)})\`);
"

# Test npm installation speed with parallel downloads
echo "  Testing npm performance..."
npm init -y > /dev/null 2>&1
time npm install express axios cheerio --silent || echo "  ✓ npm installation test completed"

# Memory performance test
echo "  Testing memory allocation..."
node -e "
const iterations = 100000;
const arrays = [];
console.log(\`  Testing memory allocation with \${iterations} iterations...\`);
for (let i = 0; i < iterations; i++) {
  arrays.push(new Array(100).fill(i));
}
console.log(\`  ✓ Memory test completed - allocated \${arrays.length} arrays\`);
"

# Cleanup
cd /
rm -rf /tmp/perf-test-96core

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "  ✅ 96-core performance test completed in ${duration}s"

# System health check
echo "🔍 Final system health check..."
echo "  Load Average: $(uptime | awk -F'load average:' '{ print $2 }')"
echo "  Available Memory: $(free -h | awk 'NR==2{print $7}')"
echo "  Disk Usage: $(df -h / | awk 'NR==2{print $5}')"

# Create performance baseline file
cat > /tmp/copilot-agent-baseline.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "system": {
    "cpu_cores": $(nproc),
    "memory_total": "$(free -m | awk 'NR==2{print $2}')MB",
    "disk_available": "$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')GB"
  },
  "performance": {
    "setup_duration": ${duration},
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)"
  },
  "optimizations": {
    "uv_threadpool_size": "${UV_THREADPOOL_SIZE}",
    "max_old_space_size": "16384MB",
    "npm_maxsockets": 96,
    "file_descriptors": $(ulimit -n)
  }
}
EOF

echo "📊 Performance baseline created at /tmp/copilot-agent-baseline.json"

echo "🎉 GitHub Copilot Coding Agent environment is ready!"
echo "   ✅ Optimized for ubuntu-latest-96core runners"
echo "   ✅ 96 CPU cores configured for maximum parallel processing"
echo "   ✅ Enhanced memory allocation (16GB Node.js heap)"
echo "   ✅ High-performance npm configuration"
echo "   ✅ Ready for large-scale development tasks"
echo ""
echo "🚀 Environment is now optimized for GitHub Copilot Coding Agent!"