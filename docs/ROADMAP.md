# Builder Roadmap

## Phase 1: Foundation (Complete)

### Goals
Build the infrastructure for a no-code app builder without AI agents. Users can create projects and see a live preview.

### Deliverables

- [x] Convex schema and CRUD operations
- [x] Project list page (`/builder`)
- [x] Project builder page (`/builder/[projectUuid]`)
- [x] Three-panel layout (Chat, Preview, Inspect)
- [x] WebContainer integration
- [x] Template seeding for new projects
- [x] File sync from Convex to WebContainer
- [x] Inspect panel with file explorer and schema view
- [x] Status bar with boot/sync states

### Success Criteria

- [x] Create new project redirects to builder
- [x] WebContainer boots and shows preview
- [x] Files in Convex sync to WebContainer
- [x] Editing file in Convex dashboard updates preview
- [x] Inspect panel shows project files and schemas

---

## Phase 2: Agent System (Current)

### Goals
Implement the AI agent system that processes user messages and generates code/schema changes.

### Tasks

#### 2.1 Chat Interface
- Functional chat input and message display
- Message persistence in Convex
- Loading states during agent processing
- Error display with retry functionality

#### 2.2 Agent Orchestration
- Agent execution framework
- Message → AgentResult pipeline
- Apply file operations to Convex
- Apply schema operations to Convex
- Streaming response support

#### 2.3 Code Generation Agent
- Generate React components
- Generate pages and routes
- Modify existing files
- Use shadcn/ui components correctly

#### 2.4 Schema Agent
- Create new data tables
- Add/modify fields
- Generate CRUD UI for tables
- Validate schema changes

#### 2.5 Integration & Polish
- End-to-end flow testing
- Error recovery
- Performance optimization
- UI polish

### Success Criteria

- [ ] User can type message and see response in chat
- [ ] Agent can create new pages/components
- [ ] Agent can create data tables
- [ ] Agent can generate CRUD interfaces
- [ ] Changes appear in preview within 5 seconds
- [ ] Errors are displayed with helpful messages
- [ ] Retry works for recoverable errors

---

## Phase 3: Authentication & Multi-user

### Goals
Add user authentication and support for multiple users with their own projects.

### Deliverables

- [ ] Clerk authentication integration
- [ ] User-scoped projects
- [ ] Project sharing (view/edit permissions)
- [ ] User settings page

### Success Criteria

- [ ] Users can sign up/sign in
- [ ] Users only see their own projects
- [ ] Projects can be shared with other users
- [ ] Auth state persists across sessions

---

## Phase 4: Deployment

### Goals
Enable users to deploy their applications to production.

### Deliverables

- [ ] One-click deploy to Vercel
- [ ] Custom domain support
- [ ] Environment variable management
- [ ] Deployment history

### Success Criteria

- [ ] User can deploy app with one click
- [ ] Deployed app is accessible via URL
- [ ] Can update deployed app
- [ ] Can rollback to previous version

---

## Phase 5: Advanced Features

### Goals
Add advanced features for power users.

### Potential Features

- [ ] File upload/image support
- [ ] Custom component library
- [ ] API integrations (external services)
- [ ] Collaborative editing (real-time)
- [ ] Version control (git-like)
- [ ] Template marketplace
- [ ] Mobile app generation

---

## Technical Debt & Improvements

### Performance
- [ ] WebContainer boot caching
- [ ] Incremental file sync
- [ ] Query optimization

### Developer Experience
- [ ] Better error messages
- [ ] Debug mode
- [ ] Logging infrastructure

### Testing
- [ ] Unit tests for agents
- [ ] Integration tests for Convex
- [ ] E2E tests with Playwright

### Documentation
- [ ] API documentation
- [ ] Agent development guide
- [ ] Contribution guidelines
