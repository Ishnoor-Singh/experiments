# Builder - No-Code App Builder

A no-code application builder that lets users create full-stack applications through natural language chat. Users describe what they want, AI agents generate code, and a live preview updates in real-time.

## Vision

Builder democratizes app development by allowing anyone to create functional web applications without writing code. Through conversational AI, users can:

- Describe features in plain English
- See live previews as changes are made
- Create data models and schemas visually
- Deploy complete applications

## Tech Stack

- **Next.js 16** (App Router) - Main application framework
- **Convex** - Real-time database and backend
- **WebContainers** - In-browser Node.js runtime for live preview
- **shadcn/ui** - Component library for generated apps
- **Claude Agent SDK** - Powers the AI agents (Phase 2+)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  /builder/[projectUuid]                                     │
├──────────────┬────────────────────────────┬─────────────────┤
│  ChatPanel   │      PreviewPanel          │  InspectPanel   │
│              │    (WebContainer iframe)   │   - Files       │
│              │                            │   - Schema      │
│              │                            │   - Tree        │
└──────────────┴─────────────┬──────────────┴─────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │           Convex            │
              │  - projects                 │
              │  - projectFiles             │
              │  - messages                 │
              │  - appSchemas               │
              │  - appRecords               │
              └─────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Convex account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your NEXT_PUBLIC_CONVEX_URL and CONVEX_DEPLOY_KEY

# Deploy Convex functions
npx convex deploy

# Start development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
```

## Project Structure

```
/app
  /builder
    page.tsx                    # Project list
    /[projectUuid]
      page.tsx                  # Main builder interface
      layout.tsx                # Builder layout

/components
  /builder
    ChatPanel.tsx               # Message list + input
    PreviewPanel.tsx            # WebContainer iframe
    InspectPanel.tsx            # Tabs for files/schema
    StatusBar.tsx               # System status
    FileExplorer.tsx            # File tree view
    SchemaView.tsx              # Table/field viewer

/hooks
  useWebContainer.ts            # WebContainer orchestration
  useProject.ts                 # Project CRUD helpers

/lib
  /webcontainer
    service.ts                  # WebContainer boot, mount, spawn
    sync.ts                     # Diff + apply logic
    template.ts                 # Template file contents
  types.ts                      # Shared types
  projectUuid.ts                # UUID generation

/convex
  schema.ts                     # Database schema
  projects.ts                   # Project CRUD
  projectFiles.ts               # File CRUD
  messages.ts                   # Chat history
  appSchemas.ts                 # User-defined schemas
  appRecords.ts                 # User app data
  seed.ts                       # Template seeding
```

## Development Phases

### Phase 1: Foundation (Complete)
- Project CRUD and listing
- WebContainer integration
- File sync between Convex and WebContainer
- Live preview infrastructure
- Inspect panel (files, schema)

### Phase 2: Agent System (In Progress)
- Chat interface with message history
- Agent orchestration system
- Code generation agents
- Schema manipulation agents
- Real-time streaming responses

### Phase 3: Polish & Deploy
- User authentication
- Project deployment
- File uploads/images
- Collaborative editing

## License

MIT
