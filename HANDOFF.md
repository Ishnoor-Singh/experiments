# Multi-Agent Experiment Builder - Handoff Document

## Project Overview
Building a multi-agent web app generator in `/home/ishnoor/dev/experiments` that uses AI agents to plan and generate complete mini web applications.

## Current Branch
`feature/multi-agent-builder` - all work is on this branch

## Architecture Source
Ported from `/home/ishnoor/dev/SuperApp` planning agents system, adapted for end-to-end code generation with Convex database.

## Completed Commits (1-14)

| Commit | Description | Key Files |
|--------|-------------|-----------|
| 1 | Convex Setup | `convex/schema.ts`, `convex/experiments.ts` |
| 2 | Agent Types & Configs | `src/lib/agents/types.ts`, `agent-configs.ts` |
| 3 | Block Tools | `src/lib/agents/tools/block-tools.ts` |
| 4 | Skill Files | `src/lib/agents/skills/*.skill.md` (9 files) |
| 5 | Experiment Agent Runner | `src/lib/agents/experiment-agent.ts`, `skill-loader.ts` |
| 6 | Basic UI Shell | `src/components/experiment/*.tsx`, `src/components/ui/*.tsx` |
| 7 | Experiment CRUD via Convex | `convex/messages.ts`, `NewExperimentDialog.tsx`, Dialog component |
| 8 | SSE Chat Endpoint | `src/app/api/chat/route.ts` |
| 9 | Connect Chat to Agent | Updated `page.tsx` with SSE handling, agent status updates |
| 10 | Agent Status & Activities Tracking | `convex/activities.ts`, `ActivityFeed.tsx`, updated `AgentPanel.tsx` with tabs |
| 11 | Inngest Background Jobs | `src/lib/inngest/`, `convex/jobs.ts`, Vercel deployment ready |
| 12 | Block Storage & Spec Viewer | `convex/blocks.ts`, `SpecViewer.tsx`, updated Inngest to save blocks |
| 13 | Code Generation Tools & Skills | `codegen-tools.ts`, 5 skill files for code gen agents |
| 14 | Code Generation Execution | `convex/generated_files.ts`, `FileViewer.tsx`, updated Inngest & AgentPanel |

## Test Status
- **55 unit tests** passing (`npm run test`)
- **14 e2e tests** passing (`npm run test:e2e`)

## Deployment Architecture

### Inngest Integration (Commit 11)
The app now uses Inngest for background job processing to work within Vercel's timeout limits:
- **API route** (`/api/chat`) creates a job in Convex and triggers Inngest
- **Inngest function** (`agent-chat`) runs the agent in the background (no timeout)
- **UI** subscribes to Convex for real-time updates (jobs, activities, messages, blocks)
- **Job status**: pending → running → completed/failed

### Block Storage (Commit 12)
Planning blocks are automatically saved to Convex when agents use block tools:
- **Blocks API** (`convex/blocks.ts`) - CRUD operations for spec blocks
- **Inngest integration** - Automatically saves blocks when `define_*` tools are called
- **SpecViewer component** - Displays blocks grouped by layer (requirements, data, api, workflow, ux, infra)
- **Real-time updates** - UI updates as blocks are created during agent execution

### Code Generation (Commit 13)
Code generation agents now have tools and skills:
- **Tools** (`src/lib/agents/tools/codegen-tools.ts`):
  - `delegate_codegen` - Orchestrator delegation to sub-agents
  - `validate_code` - TypeScript/import validation
  - `finalize_project` - Generate boilerplate files
  - `generate_file` - Create code files
  - `generate_schema` - Generate Convex schema
  - `generate_api` - Generate Convex functions
  - `generate_component` - Generate React components
  - `generate_page` - Generate Next.js pages
  - `connect_components` - Wire components together
  - `fix_imports` - Fix import statements
- **Skills** (`src/lib/agents/skills/*.skill.md`):
  - `code-orchestrator.skill.md` - Coordinates code generation
  - `schema-generator.skill.md` - Generates Convex schema.ts
  - `api-generator.skill.md` - Generates Convex mutations/queries
  - `component-generator.skill.md` - Generates React components/pages
  - `integration-agent.skill.md` - Wires everything together

### Code Generation Execution (Commit 14)
Generated files are now stored in Convex and viewable in the UI:
- **Generated Files API** (`convex/generated_files.ts`):
  - `list` - List all generated files for an experiment
  - `getByPath` - Get a file by its path
  - `upsert` - Create or update a file (with versioning)
  - `remove`/`removeByPath` - Delete files
  - `clear` - Remove all files for an experiment
  - `getTree` - Get directory structure
  - `getStats` - Get file statistics (count, lines, by language/directory)
- **Inngest Integration** - Saves files to Convex when `generate_file` tool is called
- **FileViewer Component** (`src/components/experiment/FileViewer.tsx`):
  - Tree view of generated files
  - Syntax-highlighted code preview
  - Copy to clipboard and download buttons
  - Real-time updates as files are generated
- **UI** - Added "Files" tab to AgentPanel (now 4 tabs: Agents, Specs, Files, Activity)

### Environment Variables
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://beloved-chinchilla-203.convex.cloud

# Anthropic (required for agents)
ANTHROPIC_API_KEY=sk-ant-...

# Inngest (for background jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

## Remaining Work (Commits 15-21)

### Commit 15: Code Download & Export
- Batch download all generated files as ZIP
- Export to local filesystem option
- Project structure preview

### Commit 16-18: Testing Framework
- `test-generator` - generates test files
- `evaluator` - scores generated code
- Test runner infrastructure

### Commit 19-20: Iteration Loop
- Evaluation → Fix → Re-evaluate cycle
- `debugger` agent for fixing issues
- Convergence detection

### Commit 21: End-to-End Polish
- Output generated apps to `/experiments/{app-name}/`
- Final testing and documentation

## Key Configuration

### Convex
- Deployment: `https://beloved-chinchilla-203.convex.cloud`
- Deploy key: `dev:beloved-chinchilla-203|...`
- Run `CONVEX_DEPLOY_KEY="..." npx convex deploy --cmd 'echo deployed'` to deploy schema changes

### Inngest
- Dashboard: https://app.inngest.com
- Event key and signing key in `.env.local`
- Webhook endpoint: `/api/inngest`

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run unit tests (vitest)
npm run test:e2e     # Run e2e tests (playwright)
```

## Agent Architecture
- **17 agents** total (9 planning, 5 codegen, 3 testing)
- Orchestrator delegates to sub-agents
- Skill files (`.skill.md`) define agent prompts
- Block tools create structured specs (entities, endpoints, screens, etc.)
- Codegen tools generate actual code files
- Background job execution via Inngest
- Blocks automatically saved to Convex for persistence

## UI Structure
- **Left sidebar**: Experiment list, create new
- **Center**: Chat interface with job status
- **Right panel**: 4 tabs
  - **Agents**: Status (idle/working/completed) for all 17 agents
  - **Specs**: Block viewer with layers (requirements, data, api, workflow, ux, infra)
  - **Files**: Generated code files with tree view, preview, copy, and download
  - **Activity**: Real-time feed of agent activities

## Recent Work: Agent Prompt Engineering (In Progress)

### Problem
Agents were creating too many blocks (30+ instead of 7) and not following prompt instructions.

### Research Findings
Based on research from multi-agent frameworks:
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) - Uses SOPs (Standard Operating Procedures) to keep agents on task
- [Augment Code](https://www.augmentcode.com/guides/spec-driven-ai-code-generation-with-multi-agent-systems) - Uses specification-driven development with forced tool output
- [SuperAnnotate](https://www.superannotate.com/blog/multi-agent-llms) - Multi-agent coordination patterns

### Changes Made

1. **Fixed agent delegation** (`experiment-agent.ts`):
   - `delegate_to_agent` now actually spawns sub-agents recursively
   - Added `tool_choice: { type: 'any' }` to force tool use

2. **Restructured system prompt** (`experiment-agent.ts`):
   - Moved constraints AFTER the task for better attention
   - Simplified to: Task → Process (SOP) → Critical Constraints

3. **Rewrote skill files as explicit SOPs**:
   - `orchestrator.skill.md` - One step: delegate to principal-developer
   - `principal-developer.skill.md` - 4 steps: delegate to 4 agents in sequence
   - `user-interview.skill.md` - 8 steps: create exactly 7 blocks
   - `ux-design.skill.md` - 4 steps: create exactly 4 blocks
   - `backend-database.skill.md` - 1 step: create 1 entity
   - `backend-api.skill.md` - 3 steps: create 3 endpoints

4. **Created test framework**:
   - `scripts/test-agent-prompts.ts` - Standalone test runner with dotenv loading
   - `src/lib/agents/skills/__tests__/prompt-behavior.test.ts` - Vitest-based tests
   - Tests each agent's tool usage independently
   - Checks block counts match limits
   - Verifies delegation targets

5. **Fixed vitest compatibility**:
   - Downgraded vitest to v2.1.8 for Node 18 compatibility
   - 55 unit tests passing, LLM tests skipped when no API key

### Status
- Architecture changes complete
- Test framework ready
- Testing blocked by API credit issue
- Need to verify agents follow SOPs when credits restored

## Resume Instructions
To continue this work, tell the new agent:

```
Continue work on the multi-agent experiment builder in /home/ishnoor/dev/experiments

Read HANDOFF.md for full context. The project is on branch feature/multi-agent-builder with 14 commits completed.

Priority: Test the SOP-based agent prompts
1. Run `npx tsx scripts/test-agent-prompts.ts` to verify agents follow SOPs
2. If agents still over-produce, try even simpler prompts or structured output schemas
3. Once agents work correctly, continue with Commit 15 - Code Download & Export

Expected test results:
- Orchestrator: 1 tool call → delegate to principal-developer
- Principal Developer: 1 tool call → delegate to user-interview
- User Interview: 7 blocks (1 persona, 3 stories, 3 requirements)
- UX Design: 4 blocks (1 token, 1 screen, 2 components)
- Backend Database: 1 entity
- Backend API: 3 endpoints

Key files to review:
- `src/lib/agents/experiment-agent.ts` - Agent runner with forced tool use
- `src/lib/agents/skills/*.skill.md` - SOP-style prompts
- `scripts/test-agent-prompts.ts` - Prompt behavior tests

Run tests: npm run test (55 passing)
```
