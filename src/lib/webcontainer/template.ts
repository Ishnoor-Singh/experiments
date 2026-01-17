/**
 * Template files for the WebContainer Next.js app
 * These files are seeded into Convex when a new project is created
 */

/**
 * Core essential files that must always be included
 * Separating these helps with potential future optimizations
 */
const ESSENTIAL_FILES = [
  "/package.json",
  "/tsconfig.json",
  "/next.config.js",
  "/tailwind.config.js",
  "/postcss.config.js",
  "/app/layout.tsx",
  "/app/globals.css",
  "/app/page.tsx",
  "/components/ConvexClientProvider.tsx",
  "/lib/utils.ts",
  "/lib/useAppData.ts",
  "/convex/_generated/api.d.ts",
  "/convex/_generated/api.js",
];

/**
 * UI component files that can be loaded on-demand
 */
const UI_COMPONENT_FILES = [
  "/components/ui/button.tsx",
  "/components/ui/card.tsx",
  "/components/ui/input.tsx",
  "/components/ui/label.tsx",
  "/components/ui/skeleton.tsx",
  "/components/ui/table.tsx",
];

export const templateFiles: Record<string, string> = {
  "/package.json": `{
  "name": "builder-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "convex": "1.17.4",
    "clsx": "2.1.0",
    "tailwind-merge": "2.2.0"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "autoprefixer": "10.4.17",
    "postcss": "8.4.33",
    "tailwindcss": "3.4.1",
    "typescript": "5.3.3"
  }
}`,

  "/tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  "/next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig`,

  "/tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,

  "/postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  "/app/layout.tsx": `import './globals.css'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'

export const metadata = {
  title: 'My App',
  description: 'Built with Builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}`,

  "/app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,

  "/app/page.tsx": `'use client'

import { useAppData, useAppCreate } from '@/lib/useAppData'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function Home() {
  const { data: examples, isLoading } = useAppData('examples')
  const createExample = useAppCreate('examples')
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    await createExample({ title: newTitle, completed: false })
    setNewTitle('')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Your App
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter title..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Examples</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-400">Loading...</p>
            ) : examples?.length === 0 ? (
              <p className="text-slate-400">No items yet. Add one above!</p>
            ) : (
              <ul className="space-y-2">
                {examples?.map((item: { _id: string; data: { title: string; completed: boolean } }) => (
                  <li
                    key={item._id}
                    className="flex items-center gap-2 p-2 bg-slate-800 rounded"
                  >
                    <span className={item.data.completed ? 'line-through text-slate-500' : ''}>
                      {item.data.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}`,

  "/components/ConvexClientProvider.tsx": `'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}`,

  "/components/ui/button.tsx": `import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'default',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
            'border border-slate-600 bg-transparent hover:bg-slate-800': variant === 'outline',
            'hover:bg-slate-800': variant === 'ghost',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }`,

  "/components/ui/card.tsx": `import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-semibold leading-none', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }`,

  "/components/ui/input.tsx": `import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm',
          'placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }`,

  "/components/ui/label.tsx": `import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }`,

  "/components/ui/skeleton.tsx": `import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-700', className)}
      {...props}
    />
  )
}

export { Skeleton }`,

  "/components/ui/table.tsx": `import * as React from 'react'
import { cn } from '@/lib/utils'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b border-slate-700', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-slate-700 transition-colors hover:bg-slate-800', className)}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-slate-400 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
))
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }`,

  "/lib/utils.ts": `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,

  "/lib/useAppData.ts": `'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'

const PROJECT_UUID = '__PROJECT_UUID__'

function getSchemaKey(tableName: string) {
  return \`\${PROJECT_UUID}_\${tableName}\`
}

export function useAppData(tableName: string) {
  const schemaKey = getSchemaKey(tableName)
  const records = useQuery(api.appRecords.list, { schemaKey })

  return {
    data: records,
    isLoading: records === undefined,
  }
}

export function useAppCreate(tableName: string) {
  const createRecord = useMutation(api.appRecords.create)
  const schemaKey = getSchemaKey(tableName)

  return async (data: Record<string, unknown>) => {
    return createRecord({ schemaKey, data })
  }
}

export function useAppUpdate(tableName: string) {
  const updateRecord = useMutation(api.appRecords.update)

  return async (id: string, data: Record<string, unknown>) => {
    return updateRecord({ id: id as any, data })
  }
}

export function useAppDelete(tableName: string) {
  const deleteRecord = useMutation(api.appRecords.remove)

  return async (id: string) => {
    return deleteRecord({ id: id as any })
  }
}`,

  "/convex/_generated/api.d.ts": `/* This file is auto-generated */
import type { GenericDataModel, FunctionReference } from "convex/server";

export declare const api: {
  appRecords: {
    list: FunctionReference<"query", "public", { schemaKey: string }, any[]>;
    get: FunctionReference<"query", "public", { id: string }, any>;
    create: FunctionReference<"mutation", "public", { schemaKey: string; data: any }, string>;
    update: FunctionReference<"mutation", "public", { id: string; data: any }, void>;
    remove: FunctionReference<"mutation", "public", { id: string }, void>;
  };
};`,

  "/convex/_generated/api.js": `/* This file is auto-generated */
import { anyApi } from "convex/server";

export const api = anyApi;`,

  "/manifest.json": `{
  "version": "1.0.0",
  "components": {
    "ui": {
      "Button": "components/ui/button.tsx",
      "Card": "components/ui/card.tsx",
      "Input": "components/ui/input.tsx",
      "Label": "components/ui/label.tsx",
      "Skeleton": "components/ui/skeleton.tsx",
      "Table": "components/ui/table.tsx"
    },
    "app": {}
  },
  "dataTables": []
}`,
};

/**
 * Get template files with project UUID replaced
 */
export function getTemplateFiles(projectUuid: string): { path: string; content: string }[] {
  return Object.entries(templateFiles).map(([path, content]) => ({
    path,
    content: content.replace(/__PROJECT_UUID__/g, projectUuid),
  }));
}

/**
 * Get the default schema for a new project
 */
export function getDefaultSchema(projectUuid: string) {
  return {
    key: `${projectUuid}_examples`,
    projectUuid,
    tableName: "examples",
    fields: [
      { name: "title", type: "string" as const, required: true },
      { name: "completed", type: "boolean" as const, required: true },
    ],
  };
}
