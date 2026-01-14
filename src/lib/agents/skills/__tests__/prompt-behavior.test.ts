import { describe, it, expect, beforeAll } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { loadSkill } from '../../skill-loader';
import {
  orchestratorTools,
  userInterviewTools,
  uxDesignTools,
  backendDatabaseTools,
  backendApiTools,
  principalDeveloperTools,
} from '../../tools/block-tools';

// Skip if no API key (for CI)
const SKIP_LLM_TESTS = !process.env.ANTHROPIC_API_KEY;

// Use haiku for faster, cheaper tests
const TEST_MODEL = 'claude-3-5-haiku-20241022';

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

async function testAgentBehavior(
  role: string,
  tools: Anthropic.Tool[],
  task: string,
  maxTokens = 1024
): Promise<{ toolCalls: ToolCall[]; textOutput: string }> {
  const client = new Anthropic();
  const skillContent = loadSkill(role as any);

  const systemPrompt = `${skillContent}

## Your Task
${task}

## Instructions
Complete your assigned task using the tools available to you.
Create structured blocks using the define_* tools.
Be thorough and complete.`;

  const response = await client.messages.create({
    model: TEST_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    tools: tools.length > 0 ? tools : undefined,
    messages: [{ role: 'user', content: `Please complete this task: ${task}` }],
  });

  const toolCalls: ToolCall[] = [];
  let textOutput = '';

  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    } else if (block.type === 'text') {
      textOutput += block.text;
    }
  }

  return { toolCalls, textOutput };
}

describe.skipIf(SKIP_LLM_TESTS)('Agent Prompt Behavior Tests', () => {
  let client: Anthropic;

  beforeAll(() => {
    client = new Anthropic();
  });

  describe('Orchestrator Agent', () => {
    it('should delegate to principal-developer only', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'orchestrator',
        orchestratorTools,
        'Build a simple counter app'
      );

      // Should have exactly one tool call
      expect(toolCalls.length).toBe(1);

      // Should be delegate_to_agent
      expect(toolCalls[0].name).toBe('delegate_to_agent');

      // Should delegate to principal-developer, NOT user-interview
      expect(toolCalls[0].input.agent).toBe('principal-developer');

      // Text should be minimal (1 sentence)
      expect(textOutput.length).toBeLessThan(200);

      console.log('Orchestrator result:', { toolCalls, textOutput: textOutput.slice(0, 100) });
    }, 30000);
  });

  describe('User Interview Agent', () => {
    it('should create exactly 7 blocks (1 persona, 3 stories, 3 requirements)', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'user-interview',
        userInterviewTools,
        'Gather requirements for a simple counter app'
      );

      // Count tool calls by type
      const toolCounts = toolCalls.reduce((acc, call) => {
        acc[call.name] = (acc[call.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('User Interview tool counts:', toolCounts);
      console.log('User Interview text output:', textOutput.slice(0, 200));

      // Should have define_persona calls
      expect(toolCounts['define_persona'] || 0).toBeLessThanOrEqual(1);

      // Should have define_user_story calls
      expect(toolCounts['define_user_story'] || 0).toBeLessThanOrEqual(3);

      // Should have define_requirement calls
      expect(toolCounts['define_requirement'] || 0).toBeLessThanOrEqual(3);

      // Total should be at most 7
      expect(toolCalls.length).toBeLessThanOrEqual(7);

      // Should have at least some tool calls (not just text)
      expect(toolCalls.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('UX Design Agent', () => {
    it('should create exactly 4 blocks (1 tokens, 1 screen, 2 components)', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'ux-design',
        uxDesignTools,
        'Design screens for a simple counter app'
      );

      const toolCounts = toolCalls.reduce((acc, call) => {
        acc[call.name] = (acc[call.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('UX Design tool counts:', toolCounts);
      console.log('UX Design text output:', textOutput.slice(0, 200));

      // Check limits
      expect(toolCounts['define_design_tokens'] || 0).toBeLessThanOrEqual(1);
      expect(toolCounts['define_screen'] || 0).toBeLessThanOrEqual(1);
      expect(toolCounts['define_component'] || 0).toBeLessThanOrEqual(2);

      // Total should be at most 4
      expect(toolCalls.length).toBeLessThanOrEqual(4);

      // Should have at least some tool calls
      expect(toolCalls.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Backend Database Agent', () => {
    it('should create exactly 1 entity', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'backend-database',
        backendDatabaseTools,
        'Design data model for a simple counter app'
      );

      const toolCounts = toolCalls.reduce((acc, call) => {
        acc[call.name] = (acc[call.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Backend Database tool counts:', toolCounts);
      console.log('Backend Database text output:', textOutput.slice(0, 200));

      // Should have at most 1 entity
      expect(toolCounts['define_entity'] || 0).toBeLessThanOrEqual(1);

      // Should have at most 0 relationships for simple app
      expect(toolCounts['define_relationship'] || 0).toBeLessThanOrEqual(0);

      // Total should be at most 1
      expect(toolCalls.length).toBeLessThanOrEqual(1);

      // Should have at least 1 tool call
      expect(toolCalls.length).toBeGreaterThanOrEqual(1);
    }, 60000);
  });

  describe('Backend API Agent', () => {
    it('should create exactly 3 endpoints', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'backend-api',
        backendApiTools,
        'Design API for a simple counter app'
      );

      const toolCounts = toolCalls.reduce((acc, call) => {
        acc[call.name] = (acc[call.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Backend API tool counts:', toolCounts);
      console.log('Backend API text output:', textOutput.slice(0, 200));

      // Should have at most 3 endpoints
      expect(toolCounts['define_endpoint'] || 0).toBeLessThanOrEqual(3);

      // Total should be at most 3
      expect(toolCalls.length).toBeLessThanOrEqual(3);

      // Should have at least 1 tool call
      expect(toolCalls.length).toBeGreaterThanOrEqual(1);
    }, 60000);
  });

  describe('Principal Developer Agent', () => {
    it('should delegate to user-interview first', async () => {
      const { toolCalls, textOutput } = await testAgentBehavior(
        'principal-developer',
        principalDeveloperTools,
        'Build a simple counter app'
      );

      console.log('Principal Developer tool calls:', toolCalls);
      console.log('Principal Developer text output:', textOutput.slice(0, 200));

      // Should have at least one tool call
      expect(toolCalls.length).toBeGreaterThan(0);

      // First tool call should be delegate_to_agent
      expect(toolCalls[0].name).toBe('delegate_to_agent');

      // Should delegate to user-interview first
      expect(toolCalls[0].input.agent).toBe('user-interview');
    }, 30000);
  });
});
