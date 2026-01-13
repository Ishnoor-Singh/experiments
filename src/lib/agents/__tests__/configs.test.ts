import { describe, it, expect } from 'vitest';
import {
  agentConfigs,
  getAgentConfig,
  getPlanningAgents,
  getCodegenAgents,
  getTestingAgents,
  getAllAgentInfos
} from '../agent-configs';

describe('Agent Configs', () => {
  it('has all 9 planning agents configured', () => {
    const planningRoles = [
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

    for (const role of planningRoles) {
      expect(agentConfigs[role as keyof typeof agentConfigs]).toBeDefined();
    }
  });

  it('has all 5 code generation agents configured', () => {
    const codegenRoles = [
      'code-orchestrator',
      'schema-generator',
      'api-generator',
      'component-generator',
      'integration-agent',
    ];

    for (const role of codegenRoles) {
      expect(agentConfigs[role as keyof typeof agentConfigs]).toBeDefined();
    }
  });

  it('has all 3 testing agents configured', () => {
    const testingRoles = [
      'test-generator',
      'evaluator',
      'debugger',
    ];

    for (const role of testingRoles) {
      expect(agentConfigs[role as keyof typeof agentConfigs]).toBeDefined();
    }
  });

  it('getAgentConfig returns correct config', () => {
    const config = getAgentConfig('orchestrator');
    expect(config.name).toBe('Planning Orchestrator');
    expect(config.role).toBe('orchestrator');
    expect(config.toolNames).toContain('delegate_to_agent');
  });

  it('getPlanningAgents returns 9 agents', () => {
    const agents = getPlanningAgents();
    expect(agents.length).toBe(9);
    expect(agents.map(a => a.role)).toContain('orchestrator');
    expect(agents.map(a => a.role)).toContain('principal-developer');
  });

  it('getCodegenAgents returns 5 agents', () => {
    const agents = getCodegenAgents();
    expect(agents.length).toBe(5);
    expect(agents.map(a => a.role)).toContain('code-orchestrator');
    expect(agents.map(a => a.role)).toContain('component-generator');
  });

  it('getTestingAgents returns 3 agents', () => {
    const agents = getTestingAgents();
    expect(agents.length).toBe(3);
    expect(agents.map(a => a.role)).toContain('evaluator');
    expect(agents.map(a => a.role)).toContain('debugger');
  });

  it('getAllAgentInfos returns all 17 agents', () => {
    const agents = getAllAgentInfos();
    expect(agents.length).toBe(17);
  });

  it('each agent has required fields', () => {
    for (const [role, config] of Object.entries(agentConfigs)) {
      expect(config.role).toBe(role);
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(Array.isArray(config.skills)).toBe(true);
      expect(Array.isArray(config.specialties)).toBe(true);
      expect(Array.isArray(config.toolNames)).toBe(true);
      expect(['opus', 'sonnet']).toContain(config.model);
    }
  });
});
