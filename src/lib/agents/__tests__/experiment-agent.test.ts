import { describe, it, expect } from 'vitest';
import { loadSkill, clearSkillCache } from '../skill-loader';
import { ExperimentAgent } from '../experiment-agent';

describe('Skill Loader', () => {
  it('loads orchestrator skill', () => {
    clearSkillCache();
    const skill = loadSkill('orchestrator');
    expect(skill).toBeTruthy();
    expect(skill.toLowerCase()).toContain('orchestrat');
  });

  it('loads user-interview skill', () => {
    const skill = loadSkill('user-interview');
    expect(skill).toBeTruthy();
    expect(skill.toLowerCase()).toContain('requirement');
  });

  it('returns cached skill on second load', () => {
    const skill1 = loadSkill('orchestrator');
    const skill2 = loadSkill('orchestrator');
    expect(skill1).toBe(skill2);
  });
});

describe('ExperimentAgent', () => {
  it('initializes with session ID', () => {
    const agent = new ExperimentAgent('test-session-123');
    expect(agent.sessionId).toBe('test-session-123');
  });

  it('generates session ID if not provided', () => {
    const agent = new ExperimentAgent();
    expect(agent.sessionId).toBeTruthy();
    expect(agent.sessionId.length).toBeGreaterThan(0);
  });

  it('initializes session with correct defaults', () => {
    const agent = new ExperimentAgent('test');
    const session = agent.getSession();

    expect(session.id).toBe('test');
    expect(session.status).toBe('planning');
    expect(session.currentPhase).toBe('requirements');
    expect(session.agents.length).toBeGreaterThan(0);
    expect(session.activities).toEqual([]);
    expect(session.outputs).toEqual([]);
  });

  it('returns all agent details', () => {
    const agent = new ExperimentAgent('test');
    const agents = agent.getAllAgentDetails();

    expect(agents.length).toBe(17);
    expect(agents.map(a => a.role)).toContain('orchestrator');
    expect(agents.map(a => a.role)).toContain('code-orchestrator');
    expect(agents.map(a => a.role)).toContain('evaluator');
  });

  it('returns specific agent details', () => {
    const agent = new ExperimentAgent('test');
    const orchestrator = agent.getAgentDetails('orchestrator');

    expect(orchestrator).toBeDefined();
    expect(orchestrator?.name).toBe('Planning Orchestrator');
    expect(orchestrator?.status).toBe('idle');
  });

  it('can add outputs', () => {
    const agent = new ExperimentAgent('test');
    const output = agent.addOutput(
      'orchestrator',
      'specification',
      'Test Output',
      '{"test": true}',
      'json'
    );

    expect(output.agentRole).toBe('orchestrator');
    expect(output.title).toBe('Test Output');
    expect(output.format).toBe('json');

    const session = agent.getSession();
    expect(session.outputs.length).toBe(1);
  });
});
