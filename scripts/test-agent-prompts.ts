/**
 * Simple test runner for agent prompts
 * Run with: npx tsx scripts/test-agent-prompts.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing Anthropic
config({ path: resolve(process.cwd(), '.env.local') });

import Anthropic from '@anthropic-ai/sdk';
import { loadSkill } from '../src/lib/agents/skill-loader';
import {
  orchestratorTools,
  userInterviewTools,
  uxDesignTools,
  backendDatabaseTools,
  backendApiTools,
  principalDeveloperTools,
} from '../src/lib/agents/tools/block-tools';
import type { AgentRole } from '../src/lib/agents/types';

const TEST_MODEL = 'claude-3-5-haiku-20241022';

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

interface TestResult {
  role: string;
  passed: boolean;
  toolCalls: ToolCall[];
  toolCounts: Record<string, number>;
  textOutput: string;
  error?: string;
}

async function testAgentBehavior(
  role: AgentRole,
  tools: Anthropic.Tool[],
  task: string
): Promise<TestResult> {
  const client = new Anthropic();

  try {
    const skillContent = loadSkill(role);

    const systemPrompt = `${skillContent}

## Your Task
${task}

## Instructions
Complete your assigned task using the tools available to you.
Create structured blocks using the define_* tools.
Be thorough and complete.`;

    const response = await client.messages.create({
      model: TEST_MODEL,
      max_tokens: 2048,
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

    const toolCounts = toolCalls.reduce((acc, call) => {
      acc[call.name] = (acc[call.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      role,
      passed: true,
      toolCalls,
      toolCounts,
      textOutput,
    };
  } catch (error) {
    return {
      role,
      passed: false,
      toolCalls: [],
      toolCounts: {},
      textOutput: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function checkOrchestratorResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (result.toolCalls.length !== 1) {
    reasons.push(`Expected 1 tool call, got ${result.toolCalls.length}`);
  }

  if (result.toolCalls[0]?.name !== 'delegate_to_agent') {
    reasons.push(`Expected delegate_to_agent, got ${result.toolCalls[0]?.name}`);
  }

  if (result.toolCalls[0]?.input?.agent !== 'principal-developer') {
    reasons.push(`Expected delegation to principal-developer, got ${result.toolCalls[0]?.input?.agent}`);
  }

  if (result.textOutput.length > 200) {
    reasons.push(`Text output too long: ${result.textOutput.length} chars (max 200)`);
  }

  return { passed: reasons.length === 0, reasons };
}

function checkUserInterviewResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const personaCount = result.toolCounts['define_persona'] || 0;
  const storyCount = result.toolCounts['define_user_story'] || 0;
  const reqCount = result.toolCounts['define_requirement'] || 0;

  if (personaCount > 1) {
    reasons.push(`Too many personas: ${personaCount} (max 1)`);
  }

  if (storyCount > 3) {
    reasons.push(`Too many user stories: ${storyCount} (max 3)`);
  }

  if (reqCount > 3) {
    reasons.push(`Too many requirements: ${reqCount} (max 3)`);
  }

  if (result.toolCalls.length === 0) {
    reasons.push('No tool calls made - should create blocks');
  }

  if (result.toolCalls.length > 7) {
    reasons.push(`Too many total blocks: ${result.toolCalls.length} (max 7)`);
  }

  return { passed: reasons.length === 0, reasons };
}

function checkUxDesignResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const tokensCount = result.toolCounts['define_design_tokens'] || 0;
  const screenCount = result.toolCounts['define_screen'] || 0;
  const componentCount = result.toolCounts['define_component'] || 0;

  if (tokensCount > 1) {
    reasons.push(`Too many design tokens: ${tokensCount} (max 1)`);
  }

  if (screenCount > 1) {
    reasons.push(`Too many screens: ${screenCount} (max 1)`);
  }

  if (componentCount > 2) {
    reasons.push(`Too many components: ${componentCount} (max 2)`);
  }

  if (result.toolCalls.length === 0) {
    reasons.push('No tool calls made - should create blocks');
  }

  if (result.toolCalls.length > 4) {
    reasons.push(`Too many total blocks: ${result.toolCalls.length} (max 4)`);
  }

  return { passed: reasons.length === 0, reasons };
}

function checkDatabaseResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const entityCount = result.toolCounts['define_entity'] || 0;
  const relCount = result.toolCounts['define_relationship'] || 0;

  if (entityCount > 1) {
    reasons.push(`Too many entities: ${entityCount} (max 1)`);
  }

  if (relCount > 0) {
    reasons.push(`Too many relationships: ${relCount} (max 0 for simple app)`);
  }

  if (result.toolCalls.length === 0) {
    reasons.push('No tool calls made - should create blocks');
  }

  return { passed: reasons.length === 0, reasons };
}

function checkApiResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const endpointCount = result.toolCounts['define_endpoint'] || 0;

  if (endpointCount > 3) {
    reasons.push(`Too many endpoints: ${endpointCount} (max 3)`);
  }

  if (result.toolCalls.length === 0) {
    reasons.push('No tool calls made - should create blocks');
  }

  return { passed: reasons.length === 0, reasons };
}

function checkPrincipalDeveloperResult(result: TestResult): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (result.toolCalls.length === 0) {
    reasons.push('No tool calls made - should delegate');
  }

  if (result.toolCalls[0]?.name !== 'delegate_to_agent') {
    reasons.push(`Expected delegate_to_agent, got ${result.toolCalls[0]?.name}`);
  }

  if (result.toolCalls[0]?.input?.agent !== 'user-interview') {
    reasons.push(`Expected first delegation to user-interview, got ${result.toolCalls[0]?.input?.agent}`);
  }

  return { passed: reasons.length === 0, reasons };
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('AGENT PROMPT BEHAVIOR TESTS');
  console.log('='.repeat(60));
  console.log();

  const tests = [
    {
      name: 'Orchestrator',
      role: 'orchestrator' as AgentRole,
      tools: orchestratorTools,
      task: 'Build a simple counter app',
      checker: checkOrchestratorResult,
    },
    {
      name: 'User Interview',
      role: 'user-interview' as AgentRole,
      tools: userInterviewTools,
      task: 'Gather requirements for a simple counter app',
      checker: checkUserInterviewResult,
    },
    {
      name: 'UX Design',
      role: 'ux-design' as AgentRole,
      tools: uxDesignTools,
      task: 'Design screens for a simple counter app',
      checker: checkUxDesignResult,
    },
    {
      name: 'Backend Database',
      role: 'backend-database' as AgentRole,
      tools: backendDatabaseTools,
      task: 'Design data model for a simple counter app',
      checker: checkDatabaseResult,
    },
    {
      name: 'Backend API',
      role: 'backend-api' as AgentRole,
      tools: backendApiTools,
      task: 'Design API for a simple counter app',
      checker: checkApiResult,
    },
    {
      name: 'Principal Developer',
      role: 'principal-developer' as AgentRole,
      tools: principalDeveloperTools,
      task: 'Build a simple counter app',
      checker: checkPrincipalDeveloperResult,
    },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const test of tests) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`${'─'.repeat(60)}`);

    const result = await testAgentBehavior(test.role, test.tools, test.task);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      failCount++;
      continue;
    }

    console.log(`\nTool Calls: ${result.toolCalls.length}`);
    console.log(`Tool Counts:`, result.toolCounts);
    console.log(`Text Length: ${result.textOutput.length} chars`);

    if (result.toolCalls.length > 0) {
      console.log(`\nFirst Tool Call:`);
      console.log(`  Name: ${result.toolCalls[0].name}`);
      console.log(`  Input: ${JSON.stringify(result.toolCalls[0].input).slice(0, 200)}`);
    }

    const check = test.checker(result);

    if (check.passed) {
      console.log(`\n✅ PASSED`);
      passCount++;
    } else {
      console.log(`\n❌ FAILED`);
      console.log(`Reasons:`);
      for (const reason of check.reasons) {
        console.log(`  - ${reason}`);
      }
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log(`${'='.repeat(60)}`);

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(console.error);
