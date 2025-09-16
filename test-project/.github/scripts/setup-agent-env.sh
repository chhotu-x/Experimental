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

# Set optimal npm configuration
npm config set maxsockets 50
npm config set network-concurrency 16
npm config set prefer-offline true
npm config set audit false

# Configure Git for better performance
git config --global core.preloadindex true
git config --global core.fscache true
git config --global gc.auto 0

# Set Node.js optimizations
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=256"
export UV_THREADPOOL_SIZE=96

# Configure npm for parallel operations
export NPM_CONFIG_MAXSOCKETS=50
export NPM_CONFIG_NETWORK_CONCURRENCY=16

echo "✅ Environment optimization complete"

# Verify setup
echo "🔍 Verifying environment..."
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Git: $(git --version)"

# Performance test
echo "🏃 Running performance test..."
start_time=$(date +%s)

# Create test directory and files
mkdir -p /tmp/perf-test
cd /tmp/perf-test

# Test parallel file operations
seq 1 1000 | xargs -n 1 -P 48 -I {} touch file_{}.txt
echo "  Created 1000 files in parallel"

# Test npm installation speed
npm init -y > /dev/null 2>&1
npm install express --silent
echo "  npm package installation test completed"

# Cleanup
cd /
rm -rf /tmp/perf-test

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "  Performance test completed in ${duration}s"

echo "🎉 GitHub Copilot Coding Agent environment is ready!"
echo "   Optimized for ubuntu-latest-96core runners"
echo "   Ready for large-scale development tasks"