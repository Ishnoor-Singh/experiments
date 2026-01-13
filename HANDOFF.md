# Multi-Agent Experiment Builder - Handoff Document

## Project Overview
Building a multi-agent web app generator in `/home/ishnoor/dev/experiments` that uses AI agents to plan and generate complete mini web applications.

## Current Branch
`feature/multi-agent-builder` - all work is on this branch

## Architecture Source
Ported from `/home/ishnoor/dev/SuperApp` planning agents system, adapted for end-to-end code generation with Convex database.

## Completed Commits (1-9)

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

## Test Status
- **39 unit tests** passing (`npm run test`)
- **12 e2e tests** passing (`npm run test:e2e`)

## Remaining Work (Commits 10-21)

### Commit 10: Agent Status & Activities Tracking
- Store agent activities in Convex
- Show activity feed in UI

### Commit 11: Block Storage & Spec Viewer
- Store planning blocks (entities, endpoints, screens) in Convex
- Add spec viewer panel to UI

### Commit 12-14: Code Generation Agents
- `code-orchestrator` - coordinates code generation
- `schema-generator` - generates Convex schema from specs
- `api-generator` - generates API routes
- `component-generator` - generates React components
- `integration-agent` - wires everything together

### Commit 15-17: Testing Framework
- `test-generator` - generates test files
- `evaluator` - scores generated code
- Test runner infrastructure

### Commit 18-20: Iteration Loop
- Evaluation -> Fix -> Re-evaluate cycle
- `debugger` agent for fixing issues
- Convergence detection

### Commit 21: End-to-End Polish
- Output generated apps to `/experiments/{app-name}/`
- Final testing and documentation

## Key Configuration

### Convex
- Deployment: `https://beloved-chinchilla-203.convex.cloud`
- Deploy key in `.env.local` (ask user if needed)
- Run `CONVEX_DEPLOY_KEY="..." npx convex deploy --cmd 'echo deployed'` to deploy schema changes

### Environment Variables Needed
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `ANTHROPIC_API_KEY` - For agent LLM calls (not in repo, user must provide)

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
- SSE streaming for real-time responses

## UI Structure
- **Left sidebar**: Experiment list, create new
- **Center**: Chat interface with streaming
- **Right panel**: Agent status (idle/working/completed)

## Resume Instructions
To continue this work, tell the new agent:

```
Continue work on the multi-agent experiment builder in /home/ishnoor/dev/experiments

Read HANDOFF.md for full context. The project is on branch feature/multi-agent-builder with 9 commits completed.

Next step: Commit 10 - Agent Status & Activities Tracking
- Store agent activities in Convex (create convex/activities.ts)
- Add activity feed component to UI
- Update experiment-agent.ts to save activities

Run tests after each commit: npm run test && npm run test:e2e
```
