# Tech Stack Context

This context is shared across all code generation agents to ensure generated code integrates properly with the experiments app.

## Architecture Overview

You are generating code for a **multi-agent experiment builder** application. Each experiment creates a mini-app within the main application. Generated code is NOT standalone - it integrates into the existing codebase.

## Tech Stack

### Platform
- **Hosting**: Vercel
- **Framework**: Next.js 16+ with App Router
- **Runtime**: Node.js 20+

### Frontend
- **React 19** with Server Components and Client Components
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Radix UI / shadcn/ui** components from `@/components/ui/`
- **Lucide React** for icons

### Backend & Database
- **Convex** for real-time database and backend functions
- Existing Convex deployment at the project root
- Tables are namespaced with `experimentId` to isolate experiment data

### Existing UI Components
The following components are already available in `@/components/ui/`:
- Button, Input, Label, Textarea
- Card, CardHeader, CardTitle, CardContent, CardFooter
- Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
- ScrollArea
- Tabs, TabsList, TabsTrigger, TabsContent
- Badge, Skeleton

**Always use these existing components instead of generating new ones.**

## File Structure for Generated Code

Generated code lives within the experiments app:

```
src/
├── app/
│   └── experiments/
│       └── [experimentId]/
│           └── app/             # Generated app routes
│               ├── page.tsx     # App home page
│               └── [feature]/   # Feature routes
│                   └── page.tsx
├── components/
│   └── generated/
│       └── [experimentId]/      # Generated components
│           └── {ComponentName}.tsx
convex/
├── schema.ts                    # ADD tables for new entities (prefixed)
├── experiments.ts               # Existing - DO NOT MODIFY
├── messages.ts                  # Existing - DO NOT MODIFY
├── activities.ts                # Existing - DO NOT MODIFY
├── jobs.ts                      # Existing - DO NOT MODIFY
├── blocks.ts                    # Existing - DO NOT MODIFY
└── generated/
    └── [experimentId]_*.ts      # Generated Convex functions
```

## Code Generation Rules

### 1. Database Schema
- Add new tables to the EXISTING `convex/schema.ts`
- Prefix table names with experiment context: `counter_values`, `todo_items`
- Always include `experimentId: v.id("experiments")` field
- Create index: `.index("by_experiment", ["experimentId"])`

### 2. Convex Functions
- Create in `convex/generated/` directory
- All queries/mutations MUST filter by `experimentId`
- Example:
```typescript
export const list = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("counter_values")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
  },
});
```

### 3. React Components
- Use `"use client"` directive for interactive components
- Import from existing UI: `import { Button } from "@/components/ui/button"`
- Use Convex hooks: `useQuery`, `useMutation` from `convex/react`
- Pass `experimentId` as prop to components

### 4. Pages
- Create under `src/app/experiments/[experimentId]/app/`
- Access experimentId from route params
- Example:
```typescript
interface PageProps {
  params: Promise<{ experimentId: string }>;
}

export default async function CounterPage({ params }: PageProps) {
  const { experimentId } = await params;
  return <CounterApp experimentId={experimentId} />;
}
```

### 5. Styling
- Use Tailwind CSS classes
- Follow existing app's color scheme: primary, muted, card, etc.
- Use CSS variables: `var(--primary)`, `var(--background)`

## Generated Files Storage

Generated code is saved to the `generated_files` Convex table:
- `experimentId`: Link to experiment
- `path`: File path (e.g., "convex/generated/counter.ts")
- `content`: File contents
- `language`: "typescript" | "tsx" | "json"

Use the `generate_file` tool to save files.

## Quality Requirements

Generated code must be:
1. **Type-safe**: Full TypeScript types, no `any`
2. **Consistent**: Follow existing patterns in the codebase
3. **PR-ready**: Code should be mergeable with minimal changes
4. **Self-contained**: Each experiment's code is isolated

## DO NOT

- Modify existing files (experiments.ts, messages.ts, etc.)
- Create standalone project structures (package.json, etc.)
- Use external dependencies not in the project
- Generate code that requires `npm install`
