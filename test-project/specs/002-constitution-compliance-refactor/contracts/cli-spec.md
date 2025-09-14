# CLI Command Contracts

## Web Server CLI (`web-server`)

### Command: `web-server --start`
**Purpose**: Start the web server with specified configuration
```bash
web-server --start [options]
```

**Options**:
- `--port <number>`: Server port (default: 3000)
- `--env <string>`: Environment (development|production)
- `--config <path>`: Configuration file path
- `--daemon`: Run as background daemon

**Exit Codes**:
- `0`: Server started successfully
- `1`: Configuration error
- `2`: Port already in use
- `3`: Insufficient permissions

**Output Format** (JSON with `--format json`):
```json
{
  "status": "started",
  "pid": 12345,
  "port": 3000,
  "environment": "development",
  "timestamp": "2025-09-12T10:00:00Z"
}
```

### Command: `web-server --stop`
**Purpose**: Stop the running web server
```bash
web-server --stop [options]
```

**Options**:
- `--graceful`: Wait for requests to complete (default: true)
- `--timeout <seconds>`: Max wait time for graceful shutdown (default: 30)
- `--force`: Force immediate shutdown

**Exit Codes**:
- `0`: Server stopped successfully
- `1`: No server running
- `2`: Force required (timeout exceeded)

### Command: `web-server --status`
**Purpose**: Get server status and health information
```bash
web-server --status [options]
```

**Options**:
- `--format <format>`: Output format (text|json)
- `--detailed`: Include component health details

**Output Format** (JSON):
```json
{
  "status": "running",
  "pid": 12345,
  "uptime": 3600,
  "port": 3000,
  "requests": {
    "total": 1234,
    "success": 1200,
    "error": 34
  },
  "health": "healthy"
}
```

### Command: `web-server --reload`
**Purpose**: Reload server configuration without downtime
```bash
web-server --reload [options]
```

**Options**:
- `--zero-downtime`: Use zero-downtime reload strategy
- `--config <path>`: New configuration file

---

## Content Management CLI (`content`)

### Command: `content --list-posts`
**Purpose**: List all blog posts with metadata
```bash
content --list-posts [options]
```

**Options**:
- `--format <format>`: Output format (table|json|csv)
- `--status <status>`: Filter by status (draft|published|archived)
- `--tag <tag>`: Filter by tag
- `--limit <number>`: Limit number of results

**Output Format** (JSON):
```json
{
  "posts": [
    {
      "id": "post-123",
      "title": "Example Post",
      "author": "John Doe",
      "status": "published",
      "publishDate": "2025-09-12",
      "tags": ["tech", "javascript"]
    }
  ],
  "total": 1,
  "filtered": 1
}
```

### Command: `content --add-post`
**Purpose**: Add new blog post from file or stdin
```bash
content --add-post [options]
```

**Options**:
- `--file <path>`: Markdown file to import
- `--title <string>`: Post title
- `--author <string>`: Post author
- `--status <status>`: Initial status (draft|published)
- `--tags <list>`: Comma-separated tags
- `--validate`: Validate content before adding

**Exit Codes**:
- `0`: Post added successfully
- `1`: Validation failed
- `2`: File not found
- `3`: Duplicate ID

### Command: `content --validate-all`
**Purpose**: Validate all content files and check for issues
```bash
content --validate-all [options]
```

**Options**:
- `--fix-errors`: Automatically fix correctable issues
- `--format <format>`: Output format (text|json)
- `--verbose`: Show detailed validation results

**Output Format** (JSON):
```json
{
  "status": "valid",
  "errors": [],
  "warnings": [
    {
      "type": "missing_tag",
      "post": "post-123",
      "message": "Post has no tags"
    }
  ],
  "fixed": 0
}
```

---

## Middleware CLI (`middleware`)

### Command: `middleware --test-security`
**Purpose**: Test security middleware configuration
```bash
middleware --test-security [options]
```

**Options**:
- `--report`: Generate detailed security report
- `--fix`: Apply recommended security fixes
- `--benchmark`: Run security benchmarks

**Exit Codes**:
- `0`: All security tests passed
- `1`: Security issues found
- `2`: Configuration errors

### Command: `middleware --check-performance`
**Purpose**: Analyze middleware performance impact
```bash
middleware --check-performance [options]
```

**Options**:
- `--benchmark`: Run performance benchmarks
- `--duration <seconds>`: Test duration (default: 60)
- `--requests <number>`: Number of test requests

**Output Format** (JSON):
```json
{
  "middleware": [
    {
      "name": "helmet",
      "avgLatency": 0.5,
      "memoryImpact": 12.3
    }
  ],
  "totalOverhead": 2.1,
  "recommendations": []
}
```

### Command: `middleware --clear-cache`
**Purpose**: Clear middleware caches
```bash
middleware --clear-cache [options]
```

**Options**:
- `--type <type>`: Cache type (all|response|static|api)
- `--confirm`: Skip confirmation prompt

---

## Monitoring CLI (`monitor`)

### Command: `monitor --health`
**Purpose**: Check system health status
```bash
monitor --health [options]
```

**Options**:
- `--detailed`: Include component-level health
- `--format <format>`: Output format (text|json)
- `--watch`: Continuously monitor health

**Output Format** (JSON):
```json
{
  "overall": "healthy",
  "components": {
    "webServer": {
      "status": "healthy",
      "responseTime": 45.2,
      "lastCheck": "2025-09-12T10:00:00Z"
    }
  }
}
```

### Command: `monitor --logs`
**Purpose**: View and follow system logs
```bash
monitor --logs [options]
```

**Options**:
- `--follow`: Follow log output (like tail -f)
- `--level <level>`: Filter by log level (debug|info|warn|error)
- `--component <name>`: Filter by component name
- `--since <time>`: Show logs since timestamp
- `--correlation-id <id>`: Filter by correlation ID

### Command: `monitor --metrics`
**Purpose**: Display system performance metrics
```bash
monitor --metrics [options]
```

**Options**:
- `--interval <seconds>`: Update interval for live metrics
- `--format <format>`: Output format (text|json|prometheus)
- `--export <file>`: Export metrics to file

---

## Configuration CLI (`config`)

### Command: `config --validate`
**Purpose**: Validate configuration files and environment
```bash
config --validate [options]
```

**Options**:
- `--env <environment>`: Target environment to validate
- `--fix`: Attempt to fix validation errors
- `--strict`: Use strict validation mode

**Exit Codes**:
- `0`: Configuration is valid
- `1`: Validation errors found
- `2`: Missing required configuration

### Command: `config --show`
**Purpose**: Display current configuration
```bash
config --show [options]
```

**Options**:
- `--section <name>`: Show specific configuration section
- `--format <format>`: Output format (text|json|yaml)
- `--redact`: Hide sensitive values

### Command: `config --feature-flags`
**Purpose**: Manage feature flags
```bash
config --feature-flags [options]
```

**Options**:
- `--list`: List all feature flags and their status
- `--enable <flag>`: Enable specific feature flag
- `--disable <flag>`: Disable specific feature flag
- `--reset`: Reset all flags to defaults

**Output Format** (JSON):
```json
{
  "flags": {
    "useLibraryArchitecture": true,
    "enableAdvancedCaching": false,
    "enablePerformanceMonitoring": true
  },
  "environment": "development",
  "lastModified": "2025-09-12T10:00:00Z"
}
```

---

## Global CLI Options

All CLI commands support these global options:

- `--help, -h`: Show command help
- `--version, -v`: Show version information
- `--format <format>`: Output format (text|json|yaml)
- `--quiet, -q`: Suppress non-error output
- `--verbose`: Enable verbose output
- `--config <path>`: Configuration file path
- `--log-level <level>`: Set log level (debug|info|warn|error)

## Error Handling

All CLI commands follow consistent error handling:

### Standard Error Response (JSON format):
```json
{
  "error": "ValidationError",
  "message": "Invalid port number: must be between 1024-65535",
  "command": "web-server --start --port 80",
  "timestamp": "2025-09-12T10:00:00Z",
  "suggestions": [
    "Use a port number above 1024",
    "Try: web-server --start --port 3000"
  ]
}
```

### Exit Code Standards:
- `0`: Success
- `1`: General error
- `2`: Misuse of command (invalid arguments)
- `3`: Permissions/access error
- `4`: Resource not found
- `5`: Resource conflict/already exists
- `126`: Command found but not executable
- `127`: Command not found
- `130`: Command terminated by user (Ctrl+C)