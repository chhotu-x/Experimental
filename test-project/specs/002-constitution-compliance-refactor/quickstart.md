# Quick Start Guide: Constitution Compliance Refactor

**Target**: Constitution-compliant modular website architecture  
**Time**: 30 minutes to first working system  
**Prerequisites**: Node.js 18+, Git

## Overview

This guide walks through setting up and validating the new library-first architecture for the tech website. You'll extract monolithic code into testable libraries, implement CLI interfaces, and validate the system works end-to-end.

## Step 1: Environment Setup (5 minutes)

### Install Dependencies
```bash
# Navigate to project directory
cd Experimental-main

# Install new testing and CLI dependencies
npm install --save-dev jest supertest artillery commander
npm install --save winston uuid

# Verify Node.js version
node --version  # Should be 18.0.0 or higher
```

### Initialize Directory Structure
```bash
# Create library directories
mkdir -p src/libs/{web-server,content-manager,middleware-stack,monitor-collector,config-manager}
mkdir -p src/cli
mkdir -p tests/{contract,integration,unit,performance}

# Create configuration directories
mkdir -p config/{development,production,test}
```

## Step 2: Configuration First (5 minutes)

### Create Base Configuration
```bash
# Generate development configuration
config --init --env development
config --feature-flags --enable useLibraryArchitecture
config --validate --env development
```

**Expected Output**:
```
✓ Configuration initialized for development
✓ Feature flag 'useLibraryArchitecture' enabled
✓ Configuration validation passed
```

### Verify Configuration
```bash
config --show --format json
```

**Expected Output**:
```json
{
  "environment": "development",
  "port": 3000,
  "logLevel": "info",
  "featureFlags": {
    "useLibraryArchitecture": true,
    "enableAdvancedCaching": false,
    "enablePerformanceMonitoring": true
  }
}
```

## Step 3: Contract Testing First (10 minutes)

### Generate Contract Tests
```bash
# Generate failing contract tests from specifications
npm run test:generate-contracts

# Run contract tests (should fail - no implementation yet)
npm run test:contract
```

**Expected Output**:
```
FAIL tests/contract/web-server.test.js
  WebServer Library Interface
    ✗ should initialize with configuration
    ✗ should start HTTP server on specified port
    ✗ should provide health check endpoint

FAIL tests/contract/content-manager.test.js
  ContentManager Library Interface
    ✗ should load posts from data file
    ✗ should validate post schema
    ✗ should provide CLI interface

Tests: 6 failed, 0 passed
```

### Validate Test Infrastructure
```bash
# Check test configuration
npm run test:validate-setup

# Verify CLI test harness
npm run test:cli-harness
```

## Step 4: Library Implementation (8 minutes)

### Start with Configuration Manager
```bash
# Implement configuration management library
npm run implement:config-manager

# Test CLI interface
config --validate --verbose
config --feature-flags --list
```

**Expected Output**:
```
✓ Configuration manager library implemented
✓ CLI commands registered successfully
✓ All validation rules passing
```

### Implement Core Libraries
```bash
# Implement in dependency order
npm run implement:monitor-collector
npm run implement:middleware-stack
npm run implement:content-manager
npm run implement:web-server

# Verify libraries load correctly
npm run test:library-loading
```

### Run Contract Tests
```bash
# Contract tests should now pass
npm run test:contract

# Check which tests are now passing
npm run test:status
```

**Expected Output**:
```
PASS tests/contract/config-manager.test.js
PASS tests/contract/monitor-collector.test.js
PASS tests/contract/middleware-stack.test.js
PASS tests/contract/content-manager.test.js
PASS tests/contract/web-server.test.js

Tests: 15 passed, 0 failed
```

## Step 5: Integration Validation (2 minutes)

### Start the New Architecture
```bash
# Start with feature flag enabled
web-server --start --env development --feature-flag useLibraryArchitecture

# Verify server health
web-server --status --detailed
```

**Expected Output**:
```
✓ Web server started on port 3000
✓ All libraries initialized successfully
✓ Health checks passing

Status: running
Components:
  webServer: healthy (response: 42ms)
  contentManager: healthy (posts: 5 loaded)
  middlewareStack: healthy (security: enabled)
  monitoringCollector: healthy (logs: streaming)
  configurationManager: healthy (flags: 5 active)
```

### Test Website Functionality
```bash
# Test core endpoints
curl http://localhost:3000/ -w "%{http_code}"         # Should return 200
curl http://localhost:3000/blog -w "%{http_code}"     # Should return 200
curl http://localhost:3000/health -w "%{http_code}"   # Should return 200

# Test CLI operations
content --list-posts --format json
monitor --health --detailed
```

### Run Integration Tests
```bash
# Full integration test suite
npm run test:integration

# Performance validation
npm run test:performance --duration 30
```

**Expected Output**:
```
✓ Homepage renders correctly
✓ Blog posts load and display
✓ Contact form submission works
✓ Health checks respond properly
✓ Performance within targets (<200ms p95)

Integration Tests: 12 passed, 0 failed
Performance: ✓ All targets met
```

## Verification Checklist

### ✅ Constitution Compliance
- [ ] **Library-First**: ✓ 5 libraries with clear boundaries
- [ ] **CLI Interface**: ✓ All libraries expose CLI commands  
- [ ] **Test-First**: ✓ Contract tests written and passed before implementation
- [ ] **Integration Testing**: ✓ Real dependencies, actual HTTP server
- [ ] **Observability**: ✓ Structured logging, health checks, metrics
- [ ] **Versioning**: ✓ Version 2.0.0 assigned, increment tracking
- [ ] **Simplicity**: ✓ Direct framework usage, no unnecessary abstractions

### ✅ Functional Validation
- [ ] **Website Works**: ✓ All pages render correctly
- [ ] **Performance**: ✓ Response times <200ms maintained
- [ ] **Monitoring**: ✓ Logs, metrics, health checks operational
- [ ] **CLI Tools**: ✓ All commands working with proper help/version
- [ ] **Error Handling**: ✓ Graceful failures with proper error messages

### ✅ Operational Readiness
- [ ] **Zero-Downtime**: ✓ Can reload without service interruption
- [ ] **Rollback**: ✓ Feature flag allows instant revert to old architecture
- [ ] **Monitoring**: ✓ Dashboard shows green health status
- [ ] **Documentation**: ✓ All CLI commands have help text

## Success Criteria Met

✅ **Immediate Goals**:
- All tests passing with 95%+ coverage
- Every library has working CLI interface  
- Website functionality identical to current version
- Structured logging implemented across all components

## Next Steps

1. **Feature Flag Graduation**: Gradually increase traffic to new architecture
2. **Performance Tuning**: Monitor and optimize library communication overhead
3. **Advanced Features**: Implement zero-downtime deployments, advanced caching
4. **Team Training**: Onboard developers to new library-first workflow

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
web-server --stop --force
web-server --start --port 3001
```

**Configuration Errors**:
```bash
config --validate --fix --verbose
```

**Test Failures**:
```bash
npm run test:debug
npm run test:contract --verbose
```

**Performance Issues**:
```bash
monitor --metrics --interval 1
npm run test:performance --profile
```

---

**Version**: 1.0.0 | **Tested**: Node.js 18.x | **Duration**: ~30 minutes