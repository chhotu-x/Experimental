# Implementation Plan: Constitution Compliance Refactor

**Branch**: `002-constitution-compliance-refactor` | **Date**: 2025-09-12 | **Spec**: [/specs/002-constitution-compliance-refactor/spec.md]
**Input**: Feature specification from `/specs/002-constitution-compliance-refactor/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Spec found and analyzed
2. Fill Technical Context ✓
   → Detected Project Type: web (frontend+backend)
   → Set Structure Decision: separate libraries with CLI interfaces
3. Evaluate Constitution Check section ✓
   → Multiple violations documented
   → Justification: Legacy refactor for compliance
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ✓
   → All clarifications resolved
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → Validation after design complete
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Refactor monolithic Express.js tech website into constitution-compliant modular architecture with library-first design, comprehensive testing, CLI interfaces, structured observability, and proper versioning. Transform 962-line server.js into testable, maintainable libraries while preserving all existing functionality.

## Technical Context
**Language/Version**: Node.js 18+, JavaScript ES2022  
**Primary Dependencies**: Express.js 4.18.2, EJS 3.1.9, Helmet 8.1.0, Compression 1.7.4  
**Storage**: JSON files (data/posts.json), filesystem (public assets)  
**Testing**: Jest (new), Supertest (new), Artillery (performance)  
**Target Platform**: Linux server, containerizable  
**Project Type**: web - requires frontend+backend structure  
**Performance Goals**: <200ms p95 response time, <512MB memory per library, <30s test suite  
**Constraints**: Zero-downtime deployment, backward compatibility, preserve existing UI/UX  
**Scale/Scope**: Single website, ~5 libraries, ~50 CLI commands, ~100 tests

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 5 (web-server, content-manager, middleware-stack, monitor-collector, config-manager) - exceeds limit but justified for refactor
- Using framework directly? Express.js used directly, no wrapper classes
- Single data model? JSON-based content model, no DTOs
- Avoiding patterns? Direct implementation, no Repository/UoW unless proven need

**Architecture**:
- EVERY feature as library? YES - web serving, content management, middleware, monitoring, configuration
- Libraries listed: 
  - web-server-lib (HTTP routing, static serving)
  - content-manager-lib (posts, pages, data handling)
  - middleware-stack-lib (security, performance, caching)
  - monitor-collector-lib (logging, metrics, health checks)
  - config-manager-lib (environment, settings, feature flags)
- CLI per library: 
  - web-server-cli: --start/--stop/--reload/--status
  - content-cli: --list-posts/--add-post/--validate-content
  - middleware-cli: --test-security/--check-performance/--clear-cache
  - monitor-cli: --health/--logs/--metrics/--alerts
  - config-cli: --validate/--env/--feature-flags
- Library docs: llms.txt format planned for each library

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - tests written first, must fail, then implement
- Git commits show tests before implementation? YES - enforced workflow
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES - actual Express server, real file system, live ports
- Integration tests for: new libraries, contract changes, shared schemas? YES - all covered
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES - Winston with correlation IDs
- Frontend logs → backend? YES - unified stream via WebSocket
- Error context sufficient? YES - stack traces, request context, user actions

**Versioning**:
- Version number assigned? YES - 2.0.0 (breaking change from monolith)
- BUILD increments on every change? YES - automated in CI
- Breaking changes handled? YES - parallel tests, migration plan for existing deployments

**Complexity Tracking**:
- Current violations: Monolithic architecture, no tests, no CLI, minimal observability
- Justification: Legacy system refactor required for maintainability and operational safety
- Mitigation: Incremental migration, feature flags, rollback capabilities

## Phase 0: Research & Discovery *(Prerequisites: spec.md)*

**Status**: COMPLETED
**Research Questions Resolved**:
1. Library boundaries → Analyzed server.js, identified 5 clear domains
2. CLI interface patterns → Express app lifecycle, content CRUD, monitoring queries
3. Testing strategy → Contract-first for APIs, integration for request flows
4. Performance preservation → Keep existing optimizations, add monitoring
5. Migration approach → Blue-green deployment with feature flags

**Key Decisions**:
- Preserve Express.js routing patterns
- Extract middleware to separate library with composition
- Content management as pure functions with CLI wrapper
- Monitoring as observer pattern with pluggable collectors
- Configuration as immutable objects with validation

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - WebServer: routes, middleware stack, static handling
   - ContentManager: posts, pages, metadata, validation
   - MiddlewareStack: security headers, compression, caching, rate limiting
   - MonitoringCollector: metrics, logs, health status, alerts
   - ConfigurationManager: environment variables, feature flags, validation rules

2. **Generate API contracts** from functional requirements:
   - HTTP routes: GET /, /about, /services, /contact, /blog, /blog/:id
   - CLI commands: server management, content operations, monitoring queries
   - Library interfaces: initialization, configuration, lifecycle methods
   - Output OpenAPI schema to `/contracts/api.yaml`
   - Output CLI specifications to `/contracts/cli-*.yaml`

3. **Generate contract tests** from contracts:
   - HTTP endpoint tests for all routes with status codes and response schemas
   - CLI command tests with input validation and output format verification
   - Library interface tests for initialization and method contracts
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Developer library isolation testing
   - DevOps CLI operational workflows
   - QA automated testing pipelines
   - Admin monitoring and troubleshooting scenarios

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh claude` for Claude development
   - Add Node.js/Express.js patterns, testing with Jest/Supertest
   - Include constitution compliance requirements
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2 Planning: Task Generation Approach

**Task Categories**:
1. **Setup Tasks**: Package.json updates, test framework installation, directory structure
2. **Contract Tests [P]**: One test file per library interface, CLI command, HTTP endpoint
3. **Core Library Tasks**: Extract and implement each library with CLI interface
4. **Integration Tasks**: Connect libraries, configure middleware stack, deploy integration
5. **Polish Tasks [P]**: Performance tests, documentation, monitoring dashboard

**Parallel Execution Strategy**:
- Contract tests can run in parallel (different files)
- Library implementation sequential (shared package.json, potential conflicts)
- Integration tests parallel after core libraries complete
- Polish tasks parallel (documentation, performance testing, monitoring setup)

**TDD Enforcement**:
- Every task has corresponding failing test
- Git commits show test-first pattern
- Implementation only after test approval and failure
- Integration before unit tests (constitution order)

**File Structure Planning**:
```
src/
  libs/
    web-server/         # HTTP routing and static serving
    content-manager/    # Posts, pages, data handling
    middleware-stack/   # Security, performance, caching
    monitor-collector/  # Logging, metrics, health
    config-manager/     # Environment, settings, flags
  cli/
    web-server-cli.js   # Server management commands
    content-cli.js      # Content operations
    middleware-cli.js   # Middleware testing and config
    monitor-cli.js      # Monitoring and health checks
    config-cli.js       # Configuration validation
tests/
  contract/             # Library interface and CLI tests
  integration/          # End-to-end workflow tests
  unit/                # Individual function tests
  performance/          # Load and stress tests
```

**Dependencies Graph**:
- config-manager-lib → (foundation for all other libraries)
- monitor-collector-lib → (independent, observes others)
- middleware-stack-lib → config-manager-lib
- content-manager-lib → config-manager-lib, monitor-collector-lib
- web-server-lib → all other libraries (orchestration layer)

**Output**: Detailed tasks.md with numbering, dependencies, and parallel execution examples

## Progress Tracking

- [x] Initial Constitution Check: Multiple violations identified, refactor justified
- [x] Phase 0: Research completed, architectural decisions made
- [ ] Phase 1: Design and contracts (IN PROGRESS)
- [ ] Post-Design Constitution Check: Pending design completion
- [ ] Ready for /tasks command: Pending Phase 1 completion

## Notes

**Critical Success Factors**:
- Maintain website functionality throughout refactor
- Enforce TDD workflow strictly
- Validate performance preservation
- Test CLI interfaces thoroughly

**Risk Mitigation**:
- Feature flags for gradual migration
- Parallel testing environment
- Rollback procedures documented
- Performance benchmarks established

**Constitution Compliance Strategy**:
- Library-first: Extract clear domain boundaries
- CLI interfaces: Every library exposes functionality via command line
- Test-first: RED-GREEN-Refactor enforced with git pre-commit hooks
- Observability: Structured logging and monitoring throughout
- Versioning: Semantic versioning with automated increment

---

**Version**: 1.0.0 | **Created**: 2025-09-12 | **Status**: Phase 1 Ready