# GitHub Copilot Coding Agent Setup Guide

## Overview
This guide documents the setup process for GitHub Copilot Coding Agent using ubuntu-latest-96core runners from GitHub Enterprise.

## Architecture
```
GitHub Copilot Coding Agent
├── Triggers (PR creation, manual dispatch)
├── Ubuntu-latest-96core Runner (96 CPU cores)
├── Optimized Environment Setup
├── Parallel Task Execution
└── Performance Monitoring
```

## Files Created

### 1. `.github/workflows/copilot-coding-agent.yml`
- **Purpose**: Main GitHub Actions workflow for Copilot Coding Agent
- **Features**:
  - Uses `ubuntu-latest-96core` runner
  - 120-minute timeout for complex tasks
  - Parallel processing with matrix strategy
  - Comprehensive caching and artifact management
  - Performance monitoring and health checks

### 2. `.github/copilot-agent.yml`
- **Purpose**: Configuration file for agent environment settings
- **Features**:
  - Resource allocation (50% of 96 cores for parallel tasks)
  - Memory optimization (32GB limit)
  - Test and build configuration
  - Performance monitoring thresholds
  - Security and artifact management

### 3. `.github/scripts/setup-agent-env.sh`
- **Purpose**: Environment optimization script
- **Features**:
  - System resource analysis
  - Performance optimizations for npm and Git
  - Node.js configuration for large-scale operations
  - Performance testing and verification

## Key Optimizations

### Resource Utilization
- **CPU**: 96 cores with 50% allocation for parallel tasks (48 cores)
- **Memory**: 32GB with optimized Node.js heap size (8GB)
- **Network**: Increased socket limits and concurrent connections
- **File System**: Enhanced file descriptor limits and caching

### Performance Settings
```yaml
Environment Variables:
- NODE_OPTIONS: "--max-old-space-size=8192"
- UV_THREADPOOL_SIZE: "96"
- NPM_CONFIG_MAXSOCKETS: "50"
- NPM_CONFIG_NETWORK_CONCURRENCY: "16"
```

### Parallel Processing
- Jest tests: 50% of available cores
- Build tasks: 48 parallel jobs
- Matrix strategy for different task types
- Optimized npm and dependency installation

## Usage Instructions

### 1. Automatic Trigger
The workflow automatically triggers when:
- Pull requests are opened, synchronized, or reopened
- Targeting `main` or `develop` branches

### 2. Manual Trigger
```bash
# Via GitHub UI: Actions → Copilot Coding Agent Environment → Run workflow
# Or via GitHub CLI:
gh workflow run copilot-coding-agent.yml
```

### 3. Copilot Coding Agent Integration
When using the GitHub Copilot Coding Agent:
1. Agent creates a new branch
2. Implements requested changes
3. Opens a pull request
4. Workflow automatically runs on the 96-core runner
5. Comprehensive testing and validation occurs

## Performance Benefits

### Before (Standard Runners)
- 2-4 CPU cores
- 7GB RAM
- Sequential processing
- Limited parallel test execution

### After (96-Core Runners)
- 96 CPU cores
- Enhanced memory allocation
- Massive parallel processing
- 10x+ faster build and test times
- Better resource utilization for complex projects

## Monitoring and Metrics

### Resource Monitoring
- CPU usage tracking
- Memory consumption analysis
- Disk space monitoring
- Network performance metrics

### Performance Thresholds
- Build time: Maximum 10 minutes
- Test execution: Maximum 15 minutes
- Memory usage: Maximum 80% of available
- Automatic alerts on threshold breaches

## Enterprise Integration

### GitHub Enterprise Features
- Access to `ubuntu-latest-96core` runners
- Enhanced security and compliance
- Private runner pools
- Advanced monitoring and analytics

### Security Considerations
- Dependency vulnerability scanning
- CodeQL security analysis
- Secure token management
- Audit logging and compliance

## Troubleshooting

### Common Issues
1. **Runner Availability**: Ensure ubuntu-latest-96core runners are configured in your GitHub Enterprise
2. **Permissions**: Verify the workflow has necessary permissions for pull requests and content
3. **Timeouts**: Increase timeout values if needed for very large projects
4. **Memory Issues**: Adjust NODE_OPTIONS for larger heap sizes if required

### Debug Commands
```bash
# Check runner resources
echo "CPU Cores: $(nproc)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h)"

# Verify npm configuration
npm config list

# Check Node.js settings
node --version
echo $NODE_OPTIONS
```

## Cost Optimization

### Efficient Resource Usage
- Smart caching strategies
- Parallel execution where beneficial
- Cleanup of temporary files
- Artifact retention policies

### Best Practices
- Use matrix strategies for independent tasks
- Implement intelligent test selection
- Cache dependencies effectively
- Monitor and optimize build times

## Future Enhancements

### Potential Improvements
- AI-powered test selection
- Dynamic resource allocation
- Advanced performance analytics
- Integration with monitoring tools
- Custom runner configurations

### Scaling Considerations
- Multiple project support
- Cross-repository workflows
- Advanced caching strategies
- Resource pool management

---

## Quick Start Checklist

- [ ] Ensure GitHub Enterprise has ubuntu-latest-96core runners
- [ ] Configure repository permissions
- [ ] Add workflow files to `.github/workflows/`
- [ ] Test with a sample pull request
- [ ] Monitor performance metrics
- [ ] Adjust configurations as needed

## Support and Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Enterprise Runners](https://docs.github.com/en/enterprise-cloud@latest/actions/using-github-hosted-runners)
- [Copilot Coding Agent Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
- [Performance Optimization Guide](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on)

---
*Generated for GitHub Copilot Coding Agent setup with ubuntu-latest-96core runners*