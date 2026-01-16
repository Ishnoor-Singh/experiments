# Builder Architecture

## Overview

Builder is a three-panel application that enables no-code app development through AI-powered chat. The architecture is designed for real-time collaboration between the user, AI agents, and a live preview environment.

## Core Concepts

### Data Flow

```
User Message → Convex (messages table)
     ↓
Agent Processing → AgentResult
     ↓
File Operations → Convex (projectFiles table)
     ↓
Reactive Sync → WebContainer filesystem
     ↓
Hot Reload → Preview iframe
     ↓
Response → Chat UI
```

### Key Principles

1. **Convex as Single Source of Truth**: All data flows through Convex. Agents never write directly to WebContainer.
2. **Reactive Updates**: Changes in Convex automatically sync to WebContainer via reactive queries.
3. **Singleton WebContainer**: One WebContainer instance per browser session, reused across operations.
4. **Stateless Agents**: Agents receive context and return results without maintaining state.

## Component Architecture

### Frontend Components

#### ChatPanel
- Displays message history from `messages` table
- Handles user input submission
- Shows agent streaming responses
- Displays error states with retry options

#### PreviewPanel
- Embeds WebContainer iframe
- Shows loading/booting states
- Handles preview errors
- Provides reload functionality

#### InspectPanel
- Tabbed interface for Files and Schema views
- FileExplorer: Tree view of `projectFiles`
- SchemaView: Visual representation of `appSchemas`

#### StatusBar
- Real-time system status display
- States: idle, booting, installing, starting, syncing, ready, error

### Backend (Convex)

#### Tables

```typescript
projects: {
  uuid: string          // p_[nanoid(12)]
  userId: string        // Owner
  name: string          // Display name
  createdAt: number     // Timestamp
}

projectFiles: {
  projectUuid: string   // Foreign key
  path: string          // e.g., "/app/page.tsx"
  content: string       // File contents
  updatedAt: number     // For sync detection
}

messages: {
  projectUuid: string   // Foreign key
  role: "user" | "assistant"
  content: string       // Message text
  status: "pending" | "success" | "error"
  error?: string        // Error details
  timestamp: number
}

appSchemas: {
  key: string           // {projectUuid}_{tableName}
  projectUuid: string   // Foreign key
  tableName: string     // e.g., "posts"
  fields: FieldDef[]    // Schema definition
}

appRecords: {
  schemaKey: string     // Foreign key to appSchemas
  data: any             // User's app data
  createdAt: number
  updatedAt: number
}
```

### WebContainer Integration

#### Boot Sequence

1. `bootWebContainer()` - Initialize singleton instance
2. `mountFiles()` - Write all project files to virtual filesystem
3. `installDependencies()` - Run `npm install`
4. `startDevServer()` - Run `npm run dev`
5. Listen for `server-ready` event to get preview URL

#### Sync Protocol

```typescript
// On Convex file changes:
1. Compute diffs between Convex files and local state
2. Apply diffs to WebContainer filesystem
3. Next.js hot reload handles the rest
```

## Agent System (Phase 2)

### Agent Types

```typescript
type AgentResult = {
  chatMessage: string;      // Response to show user
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

### File Operations

```typescript
type FileOp =
  | { op: "create"; path: string; content: string }
  | { op: "update"; path: string; content: string }
  | { op: "delete"; path: string }
```

### Schema Operations

```typescript
type SchemaOp =
  | { op: "createTable"; table: string; fields: FieldDef[] }
  | { op: "addField"; table: string; field: FieldDef }
  | { op: "updateField"; table: string; fieldName: string; field: FieldDef }
```

## Template System

### Generated App Structure

```
/app
  layout.tsx          # ConvexProvider + global styles
  page.tsx            # Default page with example
  globals.css         # Tailwind
/components
  /ui                 # shadcn components
  ConvexClientProvider.tsx
/lib
  useAppData.ts       # Data hooks for generated app
  utils.ts            # cn() helper
/convex
  _generated/         # Convex client stubs
package.json
tsconfig.json
tailwind.config.js
.env.local            # NEXT_PUBLIC_CONVEX_URL
```

### Data Hooks

Generated apps use these hooks to access their data:

```typescript
useAppData(tableName)     // Query records
useAppCreate(tableName)   // Create mutation
useAppUpdate(tableName)   // Update mutation
useAppDelete(tableName)   // Delete mutation
```

## Security Considerations

1. **No Auth Yet**: Phase 1 uses a mock `demo-user` ID
2. **Convex Rules**: Will need row-level security in production
3. **WebContainer Isolation**: Runs in browser sandbox
4. **Input Validation**: Agent outputs are validated before applying

## Performance Considerations

1. **WebContainer Boot**: ~15-20 seconds on first load (npm install)
2. **File Sync Debouncing**: 500ms debounce on file changes
3. **Reactive Queries**: Convex handles efficient updates
4. **Singleton Pattern**: Single WebContainer instance per session

## Error Handling

### WebContainer Errors
- Display in StatusBar with error state
- Provide "Reload Preview" option
- Log to console for debugging

### Convex Errors
- Toast notifications for mutation failures
- Automatic retry for network issues
- Error messages in chat for agent failures

### Agent Errors
- Store in `messages` table with `status: "error"`
- Show error + suggestion in chat
- Enable retry if `retryable: true`
