import { AgentConfig, AgentRole } from './types';

// Agent configurations for the Experiment Builder
// Planning agents are ported from SuperApp
// Code generation and testing agents are new

export const agentConfigs: Record<AgentRole, AgentConfig> = {
  // ============================================
  // PLANNING AGENTS (ported from SuperApp)
  // ============================================

  'orchestrator': {
    role: 'orchestrator',
    name: 'Planning Orchestrator',
    description: 'Coordinates the overall app planning process and assembles the final AppSpec',
    skills: ['coordination', 'communication', 'planning'],
    specialties: ['Project management', 'Stakeholder communication', 'Process orchestration'],
    systemPrompt: '', // Loaded from skill file
    toolNames: ['delegate_to_agent', 'update_phase', 'validate_spec', 'finalize_spec'],
    outputSchema: undefined,
    subAgents: ['user-interview', 'principal-developer'],
    model: 'sonnet',
  },

  'user-interview': {
    role: 'user-interview',
    name: 'User Interview Agent',
    description: 'Gathers requirements and produces structured requirements using The Mom Test methodology',
    skills: ['user-research', 'interviewing', 'requirements-analysis'],
    specialties: ['The Mom Test', 'User personas', 'Requirements gathering', 'Pain point analysis'],
    systemPrompt: '',
    toolNames: ['define_requirement', 'define_persona', 'define_user_story'],
    outputSchema: 'RequirementsOutput',
    model: 'sonnet',
  },

  'ux-design': {
    role: 'ux-design',
    name: 'UX Design Agent',
    description: 'Designs screens, components, and interactions using structured blocks',
    skills: ['ux-design', 'mobile-design', 'design-systems', 'wireframing'],
    specialties: ['Mobile-first design', 'Design tokens', 'Component libraries', 'Accessibility'],
    systemPrompt: '',
    toolNames: ['define_screen', 'define_component', 'define_design_tokens', 'define_user_flow'],
    outputSchema: 'UXOutput',
    model: 'sonnet',
  },

  'frontend': {
    role: 'frontend',
    name: 'Frontend Agent',
    description: 'Refines component architecture and state management',
    skills: ['nextjs', 'react', 'pwa', 'typescript', 'tailwindcss'],
    specialties: ['Next.js App Router', 'React Server Components', 'PWA configuration', 'State management'],
    systemPrompt: '',
    toolNames: ['refine_component', 'define_state', 'define_animation'],
    outputSchema: 'FrontendOutput',
    model: 'sonnet',
  },

  'backend-database': {
    role: 'backend-database',
    name: 'Database Design Agent',
    description: 'Designs entities, fields, relationships, and indexes',
    skills: ['database-design', 'convex', 'indexing'],
    specialties: ['Schema design', 'Normalization', 'Index optimization', 'Data modeling', 'Convex'],
    systemPrompt: '',
    toolNames: ['define_entity', 'define_relationship', 'define_index', 'define_computed_field'],
    outputSchema: 'DataOutput',
    model: 'sonnet',
  },

  'backend-api': {
    role: 'backend-api',
    name: 'API Design Agent',
    description: 'Designs Convex functions and API contracts',
    skills: ['api-design', 'convex', 'authentication'],
    specialties: ['Convex mutations/queries', 'Authentication/Authorization', 'Real-time subscriptions'],
    systemPrompt: '',
    toolNames: ['define_endpoint', 'define_error_response'],
    outputSchema: 'APIOutput',
    model: 'sonnet',
  },

  'backend-logic': {
    role: 'backend-logic',
    name: 'Logic & Workflows Agent',
    description: 'Designs workflows, triggers, and business logic',
    skills: ['workflow-design', 'event-driven', 'business-logic'],
    specialties: ['Workflow automation', 'Event sourcing', 'Business rules', 'Background jobs'],
    systemPrompt: '',
    toolNames: ['define_workflow', 'define_trigger', 'define_notification'],
    outputSchema: 'LogicOutput',
    model: 'sonnet',
  },

  'backend-infra': {
    role: 'backend-infra',
    name: 'Infrastructure Agent',
    description: 'Designs auth, deployment, and infrastructure',
    skills: ['security', 'authentication', 'deployment', 'infrastructure'],
    specialties: ['Auth patterns', 'RBAC/ABAC', 'Vercel deployment', 'Environment config'],
    systemPrompt: '',
    toolNames: ['define_auth', 'define_role', 'define_deployment'],
    outputSchema: 'InfraOutput',
    model: 'sonnet',
  },

  'principal-developer': {
    role: 'principal-developer',
    name: 'Principal Developer Agent',
    description: 'Coordinates technical agents and validates spec completeness',
    skills: ['technical-leadership', 'architecture-review', 'integration', 'documentation'],
    specialties: ['Technical orchestration', 'Design verification', 'Integration review'],
    systemPrompt: '',
    toolNames: ['request_subagent', 'validate_layer', 'link_blocks', 'create_summary'],
    outputSchema: undefined,
    subAgents: ['ux-design', 'frontend', 'backend-database', 'backend-api', 'backend-logic', 'backend-infra'],
    model: 'sonnet',
  },

  // ============================================
  // CODE GENERATION AGENTS (new)
  // ============================================

  'code-orchestrator': {
    role: 'code-orchestrator',
    name: 'Code Generation Orchestrator',
    description: 'Coordinates the code generation process from AppSpec to working code',
    skills: ['coordination', 'code-generation', 'project-structure'],
    specialties: ['Next.js projects', 'Convex integration', 'File organization'],
    systemPrompt: '',
    toolNames: ['delegate_codegen', 'validate_code', 'finalize_project'],
    outputSchema: undefined,
    subAgents: ['schema-generator', 'api-generator', 'component-generator', 'integration-agent'],
    model: 'sonnet',
  },

  'schema-generator': {
    role: 'schema-generator',
    name: 'Schema Generator Agent',
    description: 'Generates Convex schema from entity definitions',
    skills: ['convex', 'typescript', 'database-schema'],
    specialties: ['Convex schema design', 'Index optimization', 'Type generation'],
    systemPrompt: '',
    toolNames: ['generate_file', 'generate_schema'],
    outputSchema: 'SchemaOutput',
    model: 'sonnet',
  },

  'api-generator': {
    role: 'api-generator',
    name: 'API Generator Agent',
    description: 'Generates Convex mutations and queries from endpoint definitions',
    skills: ['convex', 'typescript', 'api-design'],
    specialties: ['Convex functions', 'Validation', 'Error handling'],
    systemPrompt: '',
    toolNames: ['generate_file', 'generate_api'],
    outputSchema: 'APICodeOutput',
    model: 'sonnet',
  },

  'component-generator': {
    role: 'component-generator',
    name: 'Component Generator Agent',
    description: 'Generates React components and pages from UX definitions',
    skills: ['react', 'typescript', 'tailwindcss'],
    specialties: ['React components', 'Next.js pages', 'Tailwind styling'],
    systemPrompt: '',
    toolNames: ['generate_file', 'generate_component', 'generate_page'],
    outputSchema: 'ComponentOutput',
    model: 'sonnet',
  },

  'integration-agent': {
    role: 'integration-agent',
    name: 'Integration Agent',
    description: 'Wires components together, fixes imports, and ensures compilation',
    skills: ['typescript', 'imports', 'debugging'],
    specialties: ['Import resolution', 'Type checking', 'Project integration'],
    systemPrompt: '',
    toolNames: ['generate_file', 'connect_components', 'fix_imports'],
    outputSchema: 'IntegrationOutput',
    model: 'sonnet',
  },

  // ============================================
  // TESTING & EVALUATION AGENTS (new)
  // ============================================

  'test-generator': {
    role: 'test-generator',
    name: 'Test Generator Agent',
    description: 'Generates test cases from requirements and code',
    skills: ['testing', 'vitest', 'playwright'],
    specialties: ['Unit tests', 'Integration tests', 'E2E tests'],
    systemPrompt: '',
    toolNames: ['generate_unit_test', 'generate_integration_test', 'generate_e2e_test'],
    outputSchema: 'TestOutput',
    model: 'sonnet',
  },

  'evaluator': {
    role: 'evaluator',
    name: 'Evaluator Agent',
    description: 'Evaluates generated outputs against requirements and quality standards',
    skills: ['code-review', 'requirements-analysis', 'quality-assessment'],
    specialties: ['Code quality', 'Spec compliance', 'Best practices'],
    systemPrompt: '',
    toolNames: ['evaluate_spec', 'evaluate_code', 'score_output'],
    outputSchema: 'EvaluationOutput',
    model: 'sonnet',
  },

  'debugger': {
    role: 'debugger',
    name: 'Debugger Agent',
    description: 'Analyzes failures and suggests fixes',
    skills: ['debugging', 'error-analysis', 'code-fixing'],
    specialties: ['Error diagnosis', 'Code fixes', 'Regression prevention'],
    systemPrompt: '',
    toolNames: ['analyze_error', 'suggest_fix', 'apply_fix'],
    outputSchema: 'DebugOutput',
    model: 'sonnet',
  },
};

export function getAgentConfig(role: AgentRole): AgentConfig {
  return agentConfigs[role];
}

export function getAgentInfo(role: AgentRole) {
  const config = agentConfigs[role];
  return {
    id: role,
    role: config.role,
    name: config.name,
    description: config.description,
    status: 'idle' as const,
    skills: config.skills,
    specialties: config.specialties,
    subAgents: config.subAgents,
  };
}

// Get all planning agents
export function getPlanningAgents() {
  const planningRoles: AgentRole[] = [
    'orchestrator',
    'user-interview',
    'ux-design',
    'frontend',
    'backend-database',
    'backend-api',
    'backend-logic',
    'backend-infra',
    'principal-developer',
  ];
  return planningRoles.map((role) => getAgentInfo(role));
}

// Get all code generation agents
export function getCodegenAgents() {
  const codegenRoles: AgentRole[] = [
    'code-orchestrator',
    'schema-generator',
    'api-generator',
    'component-generator',
    'integration-agent',
  ];
  return codegenRoles.map((role) => getAgentInfo(role));
}

// Get all testing agents
export function getTestingAgents() {
  const testingRoles: AgentRole[] = [
    'test-generator',
    'evaluator',
    'debugger',
  ];
  return testingRoles.map((role) => getAgentInfo(role));
}

// Get all agents
export function getAllAgentInfos() {
  return [
    ...getPlanningAgents(),
    ...getCodegenAgents(),
    ...getTestingAgents(),
  ];
}
