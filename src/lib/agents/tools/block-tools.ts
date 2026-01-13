// Structured Block Tools for Planning Agents
// Each tool creates/modifies a specific block type

import Anthropic from '@anthropic-ai/sdk';

// Type definition for Anthropic tools
type AnthropicTool = Anthropic.Tool;

// ============================================
// DATA LAYER TOOLS
// ============================================

export const defineEntity: AnthropicTool = {
  name: 'define_entity',
  description: 'Define a data entity (database table) with its fields. Use PascalCase for entity names (e.g., "User", "HabitEntry") and camelCase for field names.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'PascalCase entity name, e.g., "User", "HabitEntry"',
      },
      description: {
        type: 'string',
        description: 'Brief description of what this entity represents',
      },
      tableName: {
        type: 'string',
        description: 'snake_case database table name, e.g., "users", "habit_entries"',
      },
      fields: {
        type: 'array',
        description: 'List of fields for this entity',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'camelCase field name' },
            type: {
              type: 'string',
              enum: ['string', 'text', 'int', 'float', 'boolean', 'datetime', 'date', 'json', 'uuid', 'enum'],
              description: 'Field data type',
            },
            required: { type: 'boolean', description: 'Whether this field is required' },
            unique: { type: 'boolean', description: 'Whether values must be unique' },
            description: { type: 'string', description: 'Field description' },
            maxLength: { type: 'number', description: 'Max length for string fields' },
            enumValues: { type: 'array', items: { type: 'string' }, description: 'Possible values for enum fields' },
            default: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['literal', 'now', 'uuid', 'auto-increment'] },
                value: { type: ['string', 'number', 'boolean'] },
              },
            },
          },
          required: ['name', 'type', 'required'],
        },
      },
    },
    required: ['name', 'description', 'tableName', 'fields'],
  },
};

export const defineRelationship: AnthropicTool = {
  name: 'define_relationship',
  description: 'Define a relationship between two entities. This creates foreign key constraints and navigation properties.',
  input_schema: {
    type: 'object' as const,
    properties: {
      fromEntity: { type: 'string', description: 'Source entity name' },
      toEntity: { type: 'string', description: 'Target entity name' },
      type: {
        type: 'string',
        enum: ['one-to-one', 'one-to-many', 'many-to-many'],
        description: 'Relationship cardinality',
      },
      name: { type: 'string', description: 'Navigation property name on source, e.g., "habits", "author"' },
      inverseName: { type: 'string', description: 'Navigation property name on target (inverse relation)' },
      onDelete: {
        type: 'string',
        enum: ['cascade', 'set-null', 'restrict'],
        description: 'What happens when parent is deleted',
      },
      foreignKeyField: { type: 'string', description: 'Name of the foreign key field (for one-to-many/one-to-one)' },
    },
    required: ['fromEntity', 'toEntity', 'type', 'name', 'onDelete'],
  },
};

export const defineComputedField: AnthropicTool = {
  name: 'define_computed_field',
  description: 'Define a computed/derived field that is calculated from other data. Use for streaks, totals, aggregations, etc.',
  input_schema: {
    type: 'object' as const,
    properties: {
      entity: { type: 'string', description: 'Entity this computed field belongs to' },
      name: { type: 'string', description: 'camelCase field name' },
      type: { type: 'string', enum: ['int', 'float', 'string', 'boolean', 'datetime'] },
      description: { type: 'string', description: 'Natural language explanation of what this computes' },
      computation: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: ['count', 'sum', 'streak', 'formula', 'custom'],
            description: 'Type of computation',
          },
          of: { type: 'string', description: 'Entity to aggregate (for count/sum)' },
          field: { type: 'string', description: 'Field to sum (for sum)' },
          dateField: { type: 'string', description: 'Date field for streak calculation' },
          expression: { type: 'string', description: 'Formula expression (for formula kind)' },
          logic: { type: 'string', description: 'Natural language description for custom computation' },
          where: { type: 'string', description: 'Filter condition' },
        },
        required: ['kind'],
      },
      derivedFrom: {
        type: 'array',
        items: { type: 'string' },
        description: 'Field names this computation depends on',
      },
    },
    required: ['entity', 'name', 'type', 'description', 'computation'],
  },
};

export const defineIndex: AnthropicTool = {
  name: 'define_index',
  description: 'Define a database index for query optimization.',
  input_schema: {
    type: 'object' as const,
    properties: {
      entity: { type: 'string', description: 'Entity to add index to' },
      name: { type: 'string', description: 'Index name' },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Field names to include in index',
      },
      unique: { type: 'boolean', description: 'Whether this is a unique index' },
      where: { type: 'string', description: 'Partial index condition' },
    },
    required: ['entity', 'name', 'fields'],
  },
};

// ============================================
// API LAYER TOOLS
// ============================================

export const defineEndpoint: AnthropicTool = {
  name: 'define_endpoint',
  description: 'Define an API endpoint with request/response schemas, authentication, and rate limiting.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Human readable endpoint name, e.g., "List user habits"' },
      description: { type: 'string', description: 'What this endpoint does' },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        description: 'HTTP method',
      },
      path: { type: 'string', description: 'Route path with params, e.g., "/api/habits/:id/entries"' },
      auth: {
        type: 'string',
        enum: ['public', 'authenticated', 'admin'],
        description: 'Authentication requirement',
      },
      primaryEntity: { type: 'string', description: 'Main entity this endpoint operates on' },
      pathParams: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['string', 'number', 'uuid'] },
            description: { type: 'string' },
          },
        },
      },
      queryParams: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['string', 'number', 'boolean', 'uuid'] },
            required: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
      },
      requestBody: {
        type: 'object',
        description: 'Request body schema (for POST/PUT/PATCH)',
        properties: {
          type: { type: 'string', enum: ['object', 'array', 'ref'] },
          ref: { type: 'string', description: 'Entity ID if referencing an entity' },
          pick: { type: 'array', items: { type: 'string' } },
          omit: { type: 'array', items: { type: 'string' } },
          properties: { type: 'object' },
          required: { type: 'array', items: { type: 'string' } },
        },
      },
      responseBody: {
        type: 'object',
        description: 'Response body schema',
        properties: {
          type: { type: 'string', enum: ['object', 'array', 'ref'] },
          ref: { type: 'string' },
          pick: { type: 'array', items: { type: 'string' } },
          include: { type: 'array', items: { type: 'string' } },
          properties: { type: 'object' },
        },
      },
      errorResponses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            code: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      rateLimit: {
        type: 'object',
        properties: {
          requests: { type: 'number' },
          window: { type: 'string', description: '"1m", "1h", "1d"' },
          by: { type: 'string', enum: ['ip', 'user', 'api-key'] },
        },
      },
      caching: {
        type: 'object',
        properties: {
          ttl: { type: 'string' },
          scope: { type: 'string', enum: ['public', 'private'] },
          invalidateOn: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: ['name', 'description', 'method', 'path', 'auth'],
  },
};

// ============================================
// WORKFLOW LAYER TOOLS
// ============================================

export const defineWorkflow: AnthropicTool = {
  name: 'define_workflow',
  description: 'Define a workflow with trigger and steps. Workflows handle business logic, background jobs, and event-driven processes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Workflow name' },
      description: { type: 'string', description: 'What this workflow does' },
      trigger: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['event', 'schedule', 'endpoint', 'manual', 'on-create', 'on-update', 'on-delete'],
          },
          event: { type: 'string', description: 'Event name (for event trigger)' },
          cron: { type: 'string', description: 'Cron expression (for schedule trigger)' },
          timezone: { type: 'string', description: 'Timezone for schedule' },
          endpointId: { type: 'string', description: 'Endpoint ID (for endpoint trigger)' },
          entity: { type: 'string', description: 'Entity name (for on-create/update/delete)' },
          fields: { type: 'array', items: { type: 'string' }, description: 'Fields to watch (for on-update)' },
          filter: { type: 'string', description: 'Filter condition' },
        },
        required: ['type'],
      },
      inputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            source: { type: 'string', description: 'e.g., "$event.habitId", "$trigger.userId"' },
          },
        },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string', description: 'Natural language description of this step' },
            action: {
              type: 'string',
              enum: ['query', 'get', 'create', 'update', 'delete', 'compute', 'condition', 'loop', 'parallel', 'call-workflow', 'emit-event', 'notify', 'external-api', 'wait', 'custom'],
            },
            config: { type: 'object', description: 'Action-specific configuration' },
            condition: { type: 'string', description: 'Skip step if this evaluates to false' },
            outputs: { type: 'array', items: { type: 'string' }, description: 'Variable names to capture' },
            retries: { type: 'number' },
            timeout: { type: 'string' },
          },
          required: ['name', 'description', 'action'],
        },
      },
      outputs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
      errorHandling: {
        type: 'object',
        properties: {
          onError: { type: 'string', enum: ['fail', 'continue', 'retry'] },
          maxRetries: { type: 'number' },
          notify: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: ['name', 'description', 'trigger', 'steps'],
  },
};

// ============================================
// UX LAYER TOOLS
// ============================================

export const defineScreen: AnthropicTool = {
  name: 'define_screen',
  description: 'Define a screen/page with its regions, data sources, and styling. Focus on user intent and experience.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Screen name, e.g., "Habit Detail"' },
      route: { type: 'string', description: 'URL route, e.g., "/habits/:habitId"' },
      purpose: { type: 'string', description: 'What the user accomplishes on this screen' },
      data: {
        type: 'array',
        description: 'Data sources needed by this screen',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Variable name for this data' },
            sourceType: { type: 'string', enum: ['endpoint', 'entity', 'workflow', 'static'] },
            source: { type: 'string', description: 'Endpoint/entity/workflow ID or static value' },
            params: { type: 'object', description: 'Parameters to pass' },
            refetchOn: { type: 'array', items: { type: 'string' }, description: 'Events that trigger refetch' },
            refetchInterval: { type: 'string', description: 'Auto-refresh interval like "30s", "5m"' },
          },
          required: ['name', 'sourceType', 'source'],
        },
      },
      regions: {
        type: 'array',
        description: 'Content regions on this screen',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            position: { type: 'string', enum: ['header', 'main', 'footer', 'fab', 'bottom-nav', 'sidebar-left', 'sidebar-right'] },
            contentType: { type: 'string', enum: ['component', 'layout', 'slot'] },
            componentId: { type: 'string', description: 'Component ID if contentType is component' },
            layout: { type: 'object', description: 'Layout definition if contentType is layout' },
            slotPurpose: { type: 'string', description: 'Slot description if contentType is slot' },
            showWhen: { type: 'string', description: 'Conditional visibility expression' },
            sticky: { type: 'boolean' },
          },
          required: ['name', 'position', 'contentType'],
        },
      },
      style: {
        type: 'object',
        properties: {
          mood: { type: 'string', enum: ['minimal', 'playful', 'bold', 'elegant', 'data-dense'] },
          density: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
          motion: { type: 'string', enum: ['none', 'subtle', 'expressive'] },
          background: { type: 'string', enum: ['default', 'muted', 'accent'] },
        },
        required: ['mood', 'density', 'motion'],
      },
      empty: {
        type: 'object',
        description: 'Empty state when there is no data',
        properties: {
          illustration: { type: 'string', enum: ['abstract', 'character', 'icon-large', 'none'] },
          title: { type: 'string' },
          message: { type: 'string' },
          actionLabel: { type: 'string' },
          actionType: { type: 'string', enum: ['navigate', 'open-modal', 'trigger-workflow'] },
          actionTarget: { type: 'string' },
        },
      },
      celebration: {
        type: 'object',
        description: 'Celebration effect for achievements',
        properties: {
          trigger: { type: 'string', description: 'Expression that triggers celebration' },
          effect: { type: 'string', enum: ['confetti', 'fireworks', 'glow', 'shake', 'sound'] },
          intensity: { type: 'string', enum: ['subtle', 'medium', 'over-the-top'] },
        },
      },
      navigation: {
        type: 'object',
        properties: {
          back: { type: 'object', properties: { label: { type: 'string' }, to: { type: 'string' } } },
          title: { type: 'object', properties: { type: { type: 'string', enum: ['static', 'dynamic'] }, value: { type: 'string' }, source: { type: 'string' } } },
          actions: { type: 'array', items: { type: 'object', properties: { icon: { type: 'string' }, label: { type: 'string' }, actionType: { type: 'string' }, actionTarget: { type: 'string' } } } },
        },
      },
      loading: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['skeleton', 'spinner', 'shimmer'] },
        },
      },
    },
    required: ['name', 'route', 'purpose', 'regions', 'style'],
  },
};

export const defineComponent: AnthropicTool = {
  name: 'define_component',
  description: 'Define a reusable UI component with props, layout, interactions, and variants.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'PascalCase component name, e.g., "HabitCard"' },
      description: { type: 'string', description: 'What this component displays/does' },
      props: {
        type: 'array',
        description: 'Props this component accepts',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array', 'function'] },
            required: { type: 'boolean' },
            default: {},
            description: { type: 'string' },
          },
          required: ['name', 'type', 'required'],
        },
      },
      state: {
        type: 'array',
        description: 'Internal state variables',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            initial: {},
          },
        },
      },
      layout: {
        type: 'object',
        properties: {
          pattern: { type: 'string', enum: ['stack', 'row', 'grid', 'list', 'carousel', 'tabs', 'split'] },
          gap: { type: 'string', enum: ['none', 'tight', 'normal', 'loose'] },
          padding: { type: 'string', enum: ['none', 'tight', 'normal', 'loose'] },
          align: { type: 'string', enum: ['start', 'center', 'end', 'stretch', 'baseline'] },
          justify: { type: 'string', enum: ['start', 'center', 'end', 'between', 'around', 'evenly'] },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['primitive', 'component', 'layout', 'slot', 'loop', 'conditional'] },
                content: { type: 'object' },
              },
            },
          },
        },
        required: ['pattern', 'children'],
      },
      interactions: {
        type: 'array',
        description: 'User interactions this component responds to',
        items: {
          type: 'object',
          properties: {
            gesture: { type: 'string', enum: ['tap', 'double-tap', 'long-press', 'swipe-left', 'swipe-right', 'swipe-up', 'swipe-down', 'drag'] },
            target: { type: 'string', description: 'Element ID, defaults to component root' },
            actionType: { type: 'string', enum: ['navigate', 'open-modal', 'open-sheet', 'trigger-workflow', 'set-state', 'toggle-state', 'submit-form', 'copy-to-clipboard', 'share', 'sequence'] },
            actionConfig: { type: 'object' },
            feedback: {
              type: 'object',
              properties: {
                haptic: { type: 'string', enum: ['light', 'medium', 'heavy', 'success', 'warning', 'error'] },
                animation: { type: 'string', enum: ['pulse', 'shake', 'bounce', 'fade', 'scale', 'slide', 'confetti'] },
              },
            },
          },
          required: ['gesture', 'actionType'],
        },
      },
      variants: {
        type: 'array',
        description: 'Visual variants based on state/props',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Variant name like "completed", "overdue"' },
            condition: { type: 'string', description: 'Expression like "$props.status === \'done\'"' },
            overrides: {
              type: 'object',
              properties: {
                opacity: { type: 'number' },
                decoration: { type: 'string', enum: ['strikethrough', 'underline', 'highlight'] },
                colorScheme: { type: 'string' },
                hidden: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          required: ['name', 'condition'],
        },
      },
      a11y: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          label: { type: 'string' },
          hint: { type: 'string' },
        },
      },
    },
    required: ['name', 'description', 'props', 'layout'],
  },
};

export const defineDesignTokens: AnthropicTool = {
  name: 'define_design_tokens',
  description: 'Define the design system tokens (colors, typography, spacing) for the entire app.',
  input_schema: {
    type: 'object' as const,
    properties: {
      colors: {
        type: 'object',
        properties: {
          primary: {
            type: 'object',
            description: 'Primary color scale from 50 (lightest) to 900 (darkest)',
            properties: {
              50: { type: 'string' }, 100: { type: 'string' }, 200: { type: 'string' },
              300: { type: 'string' }, 400: { type: 'string' }, 500: { type: 'string' },
              600: { type: 'string' }, 700: { type: 'string' }, 800: { type: 'string' },
              900: { type: 'string' },
            },
          },
          secondary: { type: 'object', description: 'Secondary color scale' },
          semantic: {
            type: 'object',
            properties: {
              success: { type: 'string' },
              warning: { type: 'string' },
              error: { type: 'string' },
              info: { type: 'string' },
            },
          },
          surface: {
            type: 'object',
            properties: {
              background: { type: 'string' },
              card: { type: 'string' },
              elevated: { type: 'string' },
            },
          },
        },
      },
      typography: {
        type: 'object',
        properties: {
          fontFamily: {
            type: 'object',
            properties: {
              sans: { type: 'string' },
              mono: { type: 'string' },
            },
          },
          fontSize: {
            type: 'object',
            properties: {
              xs: { type: 'string' }, sm: { type: 'string' }, base: { type: 'string' },
              lg: { type: 'string' }, xl: { type: 'string' }, '2xl': { type: 'string' },
              '3xl': { type: 'string' }, '4xl': { type: 'string' },
            },
          },
        },
      },
      spacing: {
        type: 'object',
        description: 'Spacing scale as key-value pairs like { "1": "0.25rem", "2": "0.5rem" }',
      },
      radii: {
        type: 'object',
        properties: {
          none: { type: 'string' }, sm: { type: 'string' }, md: { type: 'string' },
          lg: { type: 'string' }, xl: { type: 'string' }, full: { type: 'string' },
        },
      },
      shadows: {
        type: 'object',
        properties: {
          sm: { type: 'string' }, md: { type: 'string' },
          lg: { type: 'string' }, xl: { type: 'string' },
        },
      },
      motion: {
        type: 'object',
        properties: {
          duration: {
            type: 'object',
            properties: {
              fast: { type: 'string' }, normal: { type: 'string' }, slow: { type: 'string' },
            },
          },
          easing: {
            type: 'object',
            properties: {
              default: { type: 'string' }, in: { type: 'string' }, out: { type: 'string' },
              inOut: { type: 'string' }, bounce: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const defineUserFlow: AnthropicTool = {
  name: 'define_user_flow',
  description: 'Define a user flow showing how users navigate through screens to accomplish a goal.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Flow name, e.g., "Onboarding", "Complete a habit"' },
      description: { type: 'string' },
      startScreen: { type: 'string', description: 'Screen ID where flow starts' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            screen: { type: 'string', description: 'Screen ID' },
            action: { type: 'string', description: 'What user does on this screen' },
            nextScreen: { type: 'string', description: 'Screen ID for next step' },
            condition: { type: 'string', description: 'Optional condition for this path' },
          },
          required: ['screen', 'action'],
        },
      },
      successCriteria: { type: 'string', description: 'What determines flow completion' },
    },
    required: ['name', 'description', 'startScreen', 'steps'],
  },
};

// ============================================
// INFRASTRUCTURE LAYER TOOLS
// ============================================

export const defineAuth: AnthropicTool = {
  name: 'define_auth',
  description: 'Define authentication configuration including providers, methods, and session settings.',
  input_schema: {
    type: 'object' as const,
    properties: {
      provider: {
        type: 'string',
        enum: ['clerk', 'next-auth', 'custom'],
        description: 'Auth provider to use',
      },
      methods: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['email-password', 'magic-link', 'google', 'github', 'apple', 'phone'],
        },
        description: 'Authentication methods to enable',
      },
      sessionDuration: { type: 'string', description: 'Session duration like "7d", "30d"' },
      refreshable: { type: 'boolean', description: 'Whether sessions can be refreshed' },
      mfaRequired: { type: 'boolean', description: 'Whether MFA is required' },
      mfaForRoles: { type: 'array', items: { type: 'string' }, description: 'Roles that require MFA' },
    },
    required: ['provider', 'methods'],
  },
};

export const defineRole: AnthropicTool = {
  name: 'define_role',
  description: 'Define a user role with its permissions.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Role name like "user", "admin", "moderator"' },
      permissions: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of permissions like "read:own", "write:all", "delete:own"',
      },
      inherits: { type: 'string', description: 'Role to inherit permissions from' },
    },
    required: ['name', 'permissions'],
  },
};

export const defineDeployment: AnthropicTool = {
  name: 'define_deployment',
  description: 'Define deployment and infrastructure configuration.',
  input_schema: {
    type: 'object' as const,
    properties: {
      platform: {
        type: 'string',
        enum: ['vercel', 'railway', 'fly', 'custom'],
        description: 'Deployment platform',
      },
      database: {
        type: 'object',
        properties: {
          provider: { type: 'string', enum: ['neon', 'supabase', 'planetscale', 'local'] },
          pooling: { type: 'boolean' },
        },
        required: ['provider'],
      },
      cache: { type: 'string', enum: ['upstash', 'redis', 'none'] },
      storage: { type: 'string', enum: ['vercel-blob', 's3', 'cloudflare-r2', 'none'] },
      environments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: ['development', 'preview', 'production'] },
            variables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  description: { type: 'string' },
                  required: { type: 'boolean' },
                  secret: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    required: ['platform', 'database'],
  },
};

// ============================================
// ORCHESTRATION & VALIDATION TOOLS
// ============================================

export const delegateToAgent: AnthropicTool = {
  name: 'delegate_to_agent',
  description: 'Delegate a task to a specialized agent. Use this to hand off work to sub-agents.',
  input_schema: {
    type: 'object' as const,
    properties: {
      agent: {
        type: 'string',
        enum: ['user-interview', 'principal-developer', 'ux-design', 'frontend', 'backend-database', 'backend-api', 'backend-logic', 'backend-infra'],
        description: 'Agent to delegate to',
      },
      task: { type: 'string', description: 'Description of what the agent should do' },
      context: { type: 'string', description: 'Relevant context from previous work' },
      deliverables: {
        type: 'array',
        items: { type: 'string' },
        description: 'Expected outputs from this agent',
      },
    },
    required: ['agent', 'task'],
  },
};

export const updatePhase: AnthropicTool = {
  name: 'update_phase',
  description: 'Update the current planning phase.',
  input_schema: {
    type: 'object' as const,
    properties: {
      phase: {
        type: 'string',
        enum: ['requirements-gathering', 'ux-design', 'frontend-architecture', 'backend-architecture', 'integration-review', 'documentation', 'completed'],
      },
      reason: { type: 'string', description: 'Why we are moving to this phase' },
    },
    required: ['phase'],
  },
};

export const validateSpec: AnthropicTool = {
  name: 'validate_spec',
  description: 'Validate the current spec for completeness and consistency.',
  input_schema: {
    type: 'object' as const,
    properties: {
      layers: {
        type: 'array',
        items: { type: 'string', enum: ['data', 'api', 'workflow', 'ux', 'infra'] },
        description: 'Which layers to validate',
      },
    },
  },
};

export const linkBlocks: AnthropicTool = {
  name: 'link_blocks',
  description: 'Create explicit links between blocks (e.g., screen data sources to endpoints).',
  input_schema: {
    type: 'object' as const,
    properties: {
      links: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Source block ID' },
            to: { type: 'string', description: 'Target block ID' },
            relationship: { type: 'string', description: 'Type of relationship' },
          },
          required: ['from', 'to', 'relationship'],
        },
      },
    },
    required: ['links'],
  },
};

export const finalizeSpec: AnthropicTool = {
  name: 'finalize_spec',
  description: 'Finalize the spec and produce the complete AppSpec JSON. Call this when all planning is complete.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: { type: 'string', description: 'Summary of the completed spec' },
      notes: { type: 'string', description: 'Any implementation notes or considerations' },
    },
    required: ['summary'],
  },
};

// ============================================
// REQUIREMENTS TOOLS
// ============================================

export const defineRequirement: AnthropicTool = {
  name: 'define_requirement',
  description: 'Define a requirement gathered from user interview.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Short requirement title' },
      description: { type: 'string', description: 'Detailed description' },
      priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
      personas: { type: 'array', items: { type: 'string' }, description: 'Which personas need this' },
      acceptance: { type: 'array', items: { type: 'string' }, description: 'Acceptance criteria' },
    },
    required: ['title', 'description', 'priority'],
  },
};

export const definePersona: AnthropicTool = {
  name: 'define_persona',
  description: 'Define a user persona.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Persona name' },
      description: { type: 'string', description: 'Who this persona is' },
      goals: { type: 'array', items: { type: 'string' } },
      painPoints: { type: 'array', items: { type: 'string' } },
      context: { type: 'string', description: 'When/where they use the app' },
    },
    required: ['name', 'description', 'goals', 'painPoints'],
  },
};

export const defineUserStory: AnthropicTool = {
  name: 'define_user_story',
  description: 'Define a user story in the format: As a [persona], I want [goal] so that [benefit].',
  input_schema: {
    type: 'object' as const,
    properties: {
      persona: { type: 'string' },
      goal: { type: 'string' },
      benefit: { type: 'string' },
      acceptance: { type: 'array', items: { type: 'string' } },
      priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
    },
    required: ['persona', 'goal', 'benefit'],
  },
};

// ============================================
// TOOL COLLECTIONS BY AGENT
// ============================================

export const orchestratorTools: AnthropicTool[] = [
  delegateToAgent,
  updatePhase,
  validateSpec,
  finalizeSpec,
];

export const userInterviewTools: AnthropicTool[] = [
  defineRequirement,
  definePersona,
  defineUserStory,
];

export const uxDesignTools: AnthropicTool[] = [
  defineScreen,
  defineComponent,
  defineDesignTokens,
  defineUserFlow,
];

export const frontendTools: AnthropicTool[] = [
  defineComponent,
  defineScreen,
];

export const backendDatabaseTools: AnthropicTool[] = [
  defineEntity,
  defineRelationship,
  defineComputedField,
  defineIndex,
];

export const backendApiTools: AnthropicTool[] = [
  defineEndpoint,
];

export const backendLogicTools: AnthropicTool[] = [
  defineWorkflow,
];

export const backendInfraTools: AnthropicTool[] = [
  defineAuth,
  defineRole,
  defineDeployment,
];

export const principalDeveloperTools: AnthropicTool[] = [
  delegateToAgent,
  validateSpec,
  linkBlocks,
];

// Export all tools as a collection
export const allBlockTools = {
  // Data
  define_entity: defineEntity,
  define_relationship: defineRelationship,
  define_computed_field: defineComputedField,
  define_index: defineIndex,
  // API
  define_endpoint: defineEndpoint,
  // Workflow
  define_workflow: defineWorkflow,
  // UX
  define_screen: defineScreen,
  define_component: defineComponent,
  define_design_tokens: defineDesignTokens,
  define_user_flow: defineUserFlow,
  // Infra
  define_auth: defineAuth,
  define_role: defineRole,
  define_deployment: defineDeployment,
  // Orchestration
  delegate_to_agent: delegateToAgent,
  update_phase: updatePhase,
  validate_spec: validateSpec,
  link_blocks: linkBlocks,
  finalize_spec: finalizeSpec,
  // Requirements
  define_requirement: defineRequirement,
  define_persona: definePersona,
  define_user_story: defineUserStory,
};
