# Phase 2: Agent System Specification

## Overview

Phase 2 implements the AI agent system that processes user messages and generates code/schema changes. This is the core intelligence layer that makes Builder a no-code platform.

## Agent Architecture

### Message Flow

```
1. User types message in ChatPanel
2. Message saved to Convex with status: "pending"
3. Agent system processes message
4. Agent returns AgentResult
5. FileOps applied to projectFiles
6. SchemaOps applied to appSchemas
7. Response message saved with status: "success"
8. WebContainer syncs files
9. Preview updates
```

### AgentResult Type

```typescript
type AgentResult = {
  chatMessage: string;      // Shown to user
  fileOps: FileOp[];        // File changes
  schemaOps: SchemaOp[];    // Schema changes
  status: "success" | "error";
  error?: {
    message: string;
    suggestion?: string;
    retryable: boolean;
  };
}
```

## Task Breakdown

### Task 2.1: Chat Interface Implementation

**Description**: Build a functional chat interface that displays messages and handles user input.

**Files to Create/Modify**:
- `src/components/builder/ChatPanel.tsx` - Full implementation
- `src/components/builder/MessageBubble.tsx` - Individual message display
- `src/components/builder/ChatInput.tsx` - Input with submit handling

**Completion Criteria**:

Unit Tests:
- [ ] MessageBubble renders user messages correctly
- [ ] MessageBubble renders assistant messages correctly
- [ ] MessageBubble shows error state with retry button
- [ ] ChatInput submits on Enter key
- [ ] ChatInput clears after submit
- [ ] ChatInput disables during pending state

Browser E2E Tests:
- [ ] Navigate to project page, chat panel is visible
- [ ] Type message and press Enter, message appears in list
- [ ] Message shows "pending" state initially
- [ ] Previous messages load on page refresh
- [ ] Long messages wrap correctly
- [ ] Scroll to bottom on new message

---

### Task 2.2: Agent Execution Framework

**Description**: Build the infrastructure for processing messages through agents and applying results.

**Files to Create/Modify**:
- `src/lib/agents/executor.ts` - Main execution logic
- `src/lib/agents/types.ts` - Agent type definitions
- `convex/agents.ts` - Server-side agent execution
- `convex/applyResult.ts` - Apply AgentResult to database

**Completion Criteria**:

Unit Tests:
- [ ] Executor calls agent with correct context
- [ ] FileOps are validated before applying
- [ ] SchemaOps are validated before applying
- [ ] Invalid operations return error result
- [ ] Timeout handling works correctly

Browser E2E Tests:
- [ ] Send message, see "thinking" state
- [ ] Agent response appears in chat
- [ ] File changes appear in FileExplorer
- [ ] Schema changes appear in SchemaView
- [ ] Preview updates after changes
- [ ] Error message shows on agent failure

---

### Task 2.3: Code Generation Agent

**Description**: Implement an agent that generates React components and pages.

**Files to Create/Modify**:
- `src/lib/agents/codeAgent.ts` - Code generation logic
- `src/lib/agents/prompts/code.ts` - System prompts
- `src/lib/agents/utils/codeUtils.ts` - Code manipulation helpers

**Completion Criteria**:

Unit Tests:
- [ ] Agent generates valid React component
- [ ] Agent uses shadcn/ui components correctly
- [ ] Agent imports are correct
- [ ] Agent handles "create page" requests
- [ ] Agent handles "modify component" requests
- [ ] Agent handles "add feature" requests

Browser E2E Tests:
- [ ] "Create a button that says Hello" → button appears in preview
- [ ] "Add a new page called About" → /about route works
- [ ] "Change the title to Welcome" → title updates in preview
- [ ] "Add a counter with + and - buttons" → counter works
- [ ] Generated code uses Tailwind classes
- [ ] Generated code is properly formatted

---

### Task 2.4: Schema Agent

**Description**: Implement an agent that manages data schemas and generates CRUD interfaces.

**Files to Create/Modify**:
- `src/lib/agents/schemaAgent.ts` - Schema generation logic
- `src/lib/agents/prompts/schema.ts` - System prompts
- `src/lib/agents/utils/schemaUtils.ts` - Schema manipulation helpers

**Completion Criteria**:

Unit Tests:
- [ ] Agent creates valid table schema
- [ ] Agent adds fields to existing table
- [ ] Agent generates correct field types
- [ ] Agent handles relation fields
- [ ] Agent validates table/field names

Browser E2E Tests:
- [ ] "Create a posts table with title and content" → table in SchemaView
- [ ] "Add a published boolean to posts" → field appears
- [ ] "Create a form to add posts" → form appears in preview
- [ ] "Show a list of all posts" → list component works
- [ ] Data persists across page refresh
- [ ] CRUD operations work correctly

---

### Task 2.5: Streaming Responses

**Description**: Implement streaming for agent responses so users see progress.

**Files to Create/Modify**:
- `src/lib/agents/streaming.ts` - Streaming utilities
- `src/components/builder/StreamingMessage.tsx` - Animated text display
- `convex/streamingMessages.ts` - Incremental message updates

**Completion Criteria**:

Unit Tests:
- [ ] Streaming chunks arrive in order
- [ ] Partial content displays correctly
- [ ] Final content matches complete response
- [ ] Streaming can be cancelled

Browser E2E Tests:
- [ ] Send message, see text appear word by word
- [ ] Long response streams smoothly
- [ ] Can scroll while streaming
- [ ] Final message is complete
- [ ] No duplicate content

---

### Task 2.6: Error Handling & Recovery

**Description**: Implement robust error handling with retry functionality.

**Files to Create/Modify**:
- `src/lib/agents/errors.ts` - Error types and handling
- `src/components/builder/ErrorMessage.tsx` - Error display component
- `convex/retry.ts` - Retry logic

**Completion Criteria**:

Unit Tests:
- [ ] Network errors are caught and displayed
- [ ] Agent errors include suggestions
- [ ] Retryable errors have retry button
- [ ] Non-retryable errors explain why
- [ ] Rate limiting is handled

Browser E2E Tests:
- [ ] Invalid request shows error message
- [ ] Error message includes helpful suggestion
- [ ] Retry button resubmits message
- [ ] Successful retry clears error state
- [ ] Multiple errors stack correctly

---

### Task 2.7: Integration Testing & Polish

**Description**: Comprehensive testing and UI polish for the complete agent system.

**Files to Create/Modify**:
- `tests/e2e/agent-flow.spec.ts` - E2E test suite
- Various component style tweaks

**Completion Criteria**:

Integration Tests:
- [ ] Full flow: message → agent → files → preview
- [ ] Multiple messages in sequence
- [ ] Complex multi-file changes
- [ ] Schema + code generation together
- [ ] Error recovery flow

Browser E2E Tests:
- [ ] Build a complete todo app via chat
- [ ] Build a blog with posts via chat
- [ ] Modify existing generated code
- [ ] Add features to existing app
- [ ] All UI states are polished

## Definition of Done

Phase 2 is complete when:

1. User can describe an app feature in plain English
2. Agent generates appropriate code and schema changes
3. Changes appear in live preview within 5 seconds
4. Errors are handled gracefully with retry option
5. All unit tests pass
6. All E2E tests pass
7. Performance is acceptable (< 10s for simple requests)

## Dependencies

- Phase 1 complete (WebContainer, file sync, Convex)
- Claude API access (or similar LLM)
- Convex actions for server-side agent execution

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| LLM generates invalid code | Validation layer before applying changes |
| Slow agent response | Streaming + progress indicators |
| WebContainer sync issues | Retry logic + error recovery |
| Complex requests fail | Break into smaller operations |
