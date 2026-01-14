// Code Generation Tools for Code Generation Agents
// These tools output actual code files to the generated project

import Anthropic from '@anthropic-ai/sdk';

// Type definition for Anthropic tools
type AnthropicTool = Anthropic.Tool;

// ============================================
// CODE ORCHESTRATOR TOOLS
// ============================================

export const delegateCodegen: AnthropicTool = {
  name: 'delegate_codegen',
  description: 'Delegate code generation task to a specialized agent.',
  input_schema: {
    type: 'object' as const,
    properties: {
      agent: {
        type: 'string',
        enum: ['schema-generator', 'api-generator', 'component-generator', 'integration-agent'],
        description: 'Agent to delegate to',
      },
      task: { type: 'string', description: 'Description of what the agent should generate' },
      blocks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Block IDs from the spec that this agent should use as input',
      },
      context: { type: 'string', description: 'Additional context from previous generation steps' },
      dependencies: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths that this generation depends on',
      },
    },
    required: ['agent', 'task'],
  },
};

export const validateCode: AnthropicTool = {
  name: 'validate_code',
  description: 'Validate generated code for TypeScript errors and spec compliance.',
  input_schema: {
    type: 'object' as const,
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'File paths to validate',
      },
      checkTypes: { type: 'boolean', description: 'Run TypeScript type checking' },
      checkImports: { type: 'boolean', description: 'Verify all imports resolve' },
      checkSpec: { type: 'boolean', description: 'Verify code matches spec blocks' },
    },
    required: ['files'],
  },
};

export const finalizeProject: AnthropicTool = {
  name: 'finalize_project',
  description: 'Finalize the generated project, creating any missing boilerplate files.',
  input_schema: {
    type: 'object' as const,
    properties: {
      projectName: { type: 'string', description: 'Name of the generated project' },
      outputDir: { type: 'string', description: 'Directory to output the project (defaults to /experiments/{projectName})' },
      includeReadme: { type: 'boolean', description: 'Generate README.md' },
      includePackageJson: { type: 'boolean', description: 'Generate package.json' },
      includeTailwindConfig: { type: 'boolean', description: 'Generate tailwind.config.js' },
    },
    required: ['projectName'],
  },
};

// ============================================
// FILE GENERATION TOOLS
// ============================================

export const generateFile: AnthropicTool = {
  name: 'generate_file',
  description: 'Generate a code file with the given content.',
  input_schema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'File path relative to project root, e.g., "convex/schema.ts" or "src/components/Button.tsx"',
      },
      content: {
        type: 'string',
        description: 'Complete file content including all imports and exports',
      },
      description: {
        type: 'string',
        description: 'Brief description of what this file contains',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite if file exists (default: true)',
      },
    },
    required: ['path', 'content'],
  },
};

// ============================================
// SCHEMA GENERATOR TOOLS
// ============================================

export const generateSchema: AnthropicTool = {
  name: 'generate_schema',
  description: 'Generate a Convex schema.ts file from entity blocks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      entities: {
        type: 'array',
        description: 'Entity blocks to convert to Convex tables',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Entity name (PascalCase)' },
            tableName: { type: 'string', description: 'Table name (snake_case)' },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      relationships: {
        type: 'array',
        description: 'Relationship blocks to add foreign key fields',
        items: {
          type: 'object',
          properties: {
            fromEntity: { type: 'string' },
            toEntity: { type: 'string' },
            type: { type: 'string' },
            foreignKeyField: { type: 'string' },
          },
        },
      },
      indexes: {
        type: 'array',
        description: 'Index blocks to add to tables',
        items: {
          type: 'object',
          properties: {
            entity: { type: 'string' },
            name: { type: 'string' },
            fields: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    required: ['entities'],
  },
};

// ============================================
// API GENERATOR TOOLS
// ============================================

export const generateApi: AnthropicTool = {
  name: 'generate_api',
  description: 'Generate Convex mutation/query functions from endpoint blocks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      tableName: {
        type: 'string',
        description: 'Convex table this API operates on',
      },
      endpoints: {
        type: 'array',
        description: 'Endpoint blocks to convert to Convex functions',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Function name' },
            type: { type: 'string', enum: ['query', 'mutation'], description: 'Convex function type' },
            description: { type: 'string' },
            args: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                },
              },
            },
            auth: { type: 'string', enum: ['public', 'authenticated', 'admin'] },
          },
        },
      },
    },
    required: ['tableName', 'endpoints'],
  },
};

// ============================================
// COMPONENT GENERATOR TOOLS
// ============================================

export const generateComponent: AnthropicTool = {
  name: 'generate_component',
  description: 'Generate a React component from a component block.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Component name (PascalCase)' },
      description: { type: 'string', description: 'What this component does' },
      props: {
        type: 'array',
        description: 'Component props',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
      },
      imports: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional imports needed',
      },
      useClient: { type: 'boolean', description: 'Whether to add "use client" directive' },
      hooks: {
        type: 'array',
        items: { type: 'string' },
        description: 'React hooks used (useState, useEffect, etc.)',
      },
      convexQueries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Convex queries this component uses',
      },
      convexMutations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Convex mutations this component uses',
      },
      styling: {
        type: 'string',
        enum: ['tailwind', 'css-modules', 'styled-components'],
        description: 'Styling approach',
      },
    },
    required: ['name', 'description'],
  },
};

export const generatePage: AnthropicTool = {
  name: 'generate_page',
  description: 'Generate a Next.js page from a screen block.',
  input_schema: {
    type: 'object' as const,
    properties: {
      route: { type: 'string', description: 'Page route, e.g., "/habits/[id]"' },
      name: { type: 'string', description: 'Screen name' },
      purpose: { type: 'string', description: 'What the user accomplishes on this page' },
      layout: {
        type: 'string',
        enum: ['default', 'dashboard', 'auth', 'minimal'],
        description: 'Page layout to use',
      },
      components: {
        type: 'array',
        items: { type: 'string' },
        description: 'Component names used on this page',
      },
      dataFetching: {
        type: 'string',
        enum: ['server', 'client', 'hybrid'],
        description: 'Data fetching strategy',
      },
      params: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
        },
        description: 'Dynamic route parameters',
      },
    },
    required: ['route', 'name', 'purpose'],
  },
};

// ============================================
// INTEGRATION TOOLS
// ============================================

export const connectComponents: AnthropicTool = {
  name: 'connect_components',
  description: 'Wire components together by updating imports and exports.',
  input_schema: {
    type: 'object' as const,
    properties: {
      connections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Source file path' },
            to: { type: 'string', description: 'Target file path' },
            imports: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names to import',
            },
          },
        },
      },
    },
    required: ['connections'],
  },
};

export const fixImports: AnthropicTool = {
  name: 'fix_imports',
  description: 'Fix import statements in generated files.',
  input_schema: {
    type: 'object' as const,
    properties: {
      file: { type: 'string', description: 'File path to fix' },
      addImports: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            module: { type: 'string' },
            names: { type: 'array', items: { type: 'string' } },
            default: { type: 'string' },
          },
        },
      },
      removeImports: {
        type: 'array',
        items: { type: 'string' },
        description: 'Import names to remove',
      },
    },
    required: ['file'],
  },
};

// ============================================
// TOOL COLLECTIONS BY AGENT
// ============================================

export const codeOrchestratorTools: AnthropicTool[] = [
  delegateCodegen,
  validateCode,
  finalizeProject,
  generateFile,
];

export const schemaGeneratorTools: AnthropicTool[] = [
  generateFile,
  generateSchema,
];

export const apiGeneratorTools: AnthropicTool[] = [
  generateFile,
  generateApi,
];

export const componentGeneratorTools: AnthropicTool[] = [
  generateFile,
  generateComponent,
  generatePage,
];

export const integrationAgentTools: AnthropicTool[] = [
  generateFile,
  connectComponents,
  fixImports,
];

// Export all tools as a collection
export const allCodegenTools = {
  // Orchestrator
  delegate_codegen: delegateCodegen,
  validate_code: validateCode,
  finalize_project: finalizeProject,
  // File generation
  generate_file: generateFile,
  // Schema
  generate_schema: generateSchema,
  // API
  generate_api: generateApi,
  // Components
  generate_component: generateComponent,
  generate_page: generatePage,
  // Integration
  connect_components: connectComponents,
  fix_imports: fixImports,
};
