// Types for the Experiment Builder Agents System

export type AgentRole =
  // Planning agents (ported from SuperApp)
  | 'orchestrator'
  | 'user-interview'
  | 'ux-design'
  | 'frontend'
  | 'backend-database'
  | 'backend-api'
  | 'backend-logic'
  | 'backend-infra'
  | 'principal-developer'
  // Code generation agents (new)
  | 'code-orchestrator'
  | 'schema-generator'
  | 'api-generator'
  | 'component-generator'
  | 'integration-agent'
  // Testing/evaluation agents (new)
  | 'test-generator'
  | 'evaluator'
  | 'debugger';

export type AgentStatus = 'idle' | 'working' | 'waiting' | 'completed' | 'error';

export interface AgentInfo {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  status: AgentStatus;
  skills: string[];
  specialties: string[];
  parentAgent?: AgentRole;
  subAgents?: AgentRole[];
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  timestamp: Date;
  type: 'thinking' | 'tool_use' | 'message' | 'handoff' | 'output';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentOutput {
  agentId: string;
  agentRole: AgentRole;
  type: 'requirements' | 'design' | 'specification' | 'diagram' | 'document' | 'code' | 'test' | 'evaluation';
  title: string;
  content: string;
  format: 'markdown' | 'json' | 'mermaid' | 'typescript';
  timestamp: Date;
}

export interface ExperimentSession {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'generating' | 'testing' | 'complete' | 'failed';
  currentPhase: ExperimentPhase;
  agents: AgentInfo[];
  activities: AgentActivity[];
  outputs: AgentOutput[];
  createdAt: Date;
  updatedAt: Date;
}

export type ExperimentPhase =
  // Planning phases
  | 'requirements'
  | 'ux-design'
  | 'frontend-architecture'
  | 'backend-architecture'
  | 'integration-review'
  // Code generation phases
  | 'code-generation'
  | 'schema-generation'
  | 'api-generation'
  | 'component-generation'
  | 'integration'
  // Testing phases
  | 'test-generation'
  | 'test-execution'
  | 'evaluation'
  | 'debugging'
  // Terminal
  | 'completed';

export interface StreamEvent {
  type: 'text' | 'thinking' | 'agent_start' | 'agent_end' | 'tool_start' | 'tool_end' | 'output' | 'phase_change' | 'error' | 'done' | 'ping';
  content?: string;
  agentRole?: AgentRole;
  agentName?: string;
  tool?: string;
  toolInput?: unknown;
  toolResult?: unknown;
  output?: AgentOutput;
  phase?: ExperimentPhase;
  error?: string;
  timestamp?: number;
}

// Model types for agents
export type AgentModel = 'opus' | 'sonnet';

// Agent configuration
export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  skills: string[];
  specialties: string[];
  systemPrompt: string;
  toolNames: string[];
  outputSchema?: string;
  subAgents?: AgentRole[];
  model: AgentModel;
}

// Evaluation types
export interface EvaluationCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  criteria: EvaluationCriterion[];
  summary: string;
  suggestedFixes: string[];
}

export interface IterationState {
  iteration: number;
  scores: number[];
  status: 'running' | 'passed' | 'failed' | 'stalled';
  history: {
    iteration: number;
    evaluation: EvaluationResult;
    changesApplied: string[];
  }[];
}
