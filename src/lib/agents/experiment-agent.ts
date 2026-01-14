import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';
import {
  AgentRole,
  AgentActivity,
  AgentOutput,
  ExperimentPhase,
  StreamEvent,
  ExperimentSession,
  AgentInfo,
  AgentModel,
} from './types';
import { getAgentConfig, getAgentInfo, getAllAgentInfos } from './agent-configs';
import { loadSkill } from './skill-loader';
import {
  orchestratorTools,
  userInterviewTools,
  uxDesignTools,
  backendDatabaseTools,
  backendApiTools,
  backendLogicTools,
  backendInfraTools,
  principalDeveloperTools,
} from './tools/block-tools';

// Model ID mapping
const MODEL_IDS: Record<AgentModel, string> = {
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-5-20251101',
};

function getModelId(model?: AgentModel): string {
  return MODEL_IDS[model || 'sonnet'];
}

// Get tools for a specific agent role
function getToolsForRole(role: AgentRole): Anthropic.Tool[] {
  switch (role) {
    case 'orchestrator':
      return orchestratorTools;
    case 'user-interview':
      return userInterviewTools;
    case 'ux-design':
      return uxDesignTools;
    case 'frontend':
      return uxDesignTools; // Uses same tools
    case 'backend-database':
      return backendDatabaseTools;
    case 'backend-api':
      return backendApiTools;
    case 'backend-logic':
      return backendLogicTools;
    case 'backend-infra':
      return backendInfraTools;
    case 'principal-developer':
      return principalDeveloperTools;
    default:
      return [];
  }
}

export class ExperimentAgent {
  private client: Anthropic;
  public sessionId: string;
  private session: ExperimentSession;
  private activeAgents: Map<AgentRole, AgentInfo> = new Map();

  constructor(sessionId?: string) {
    this.sessionId = sessionId || nanoid();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 5 * 60 * 1000, // 5 minute timeout
    });

    // Initialize session
    this.session = {
      id: this.sessionId,
      name: 'New Experiment',
      status: 'planning',
      currentPhase: 'requirements',
      agents: getAllAgentInfos(),
      activities: [],
      outputs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Initialize all agents
    this.session.agents.forEach((agent) => {
      this.activeAgents.set(agent.role, agent);
    });
  }

  getSession(): ExperimentSession {
    return this.session;
  }

  getAgentDetails(role: AgentRole): AgentInfo | undefined {
    return this.activeAgents.get(role);
  }

  getAllAgentDetails(): AgentInfo[] {
    return Array.from(this.activeAgents.values());
  }

  private updateAgentStatus(role: AgentRole, status: AgentInfo['status']) {
    const agent = this.activeAgents.get(role);
    if (agent) {
      agent.status = status;
    }
  }

  private addActivity(
    agentRole: AgentRole,
    type: AgentActivity['type'],
    content: string,
    metadata?: Record<string, unknown>
  ): AgentActivity {
    const activity: AgentActivity = {
      id: nanoid(),
      agentId: agentRole,
      agentRole,
      timestamp: new Date(),
      type,
      content,
      metadata,
    };
    this.session.activities.push(activity);
    return activity;
  }

  addOutput(
    agentRole: AgentRole,
    type: AgentOutput['type'],
    title: string,
    content: string,
    format: AgentOutput['format'] = 'markdown'
  ): AgentOutput {
    const output: AgentOutput = {
      agentId: agentRole,
      agentRole,
      type,
      title,
      content,
      format,
      timestamp: new Date(),
    };
    this.session.outputs.push(output);
    return output;
  }

  private buildSessionContext(): string {
    const recentMessages = this.session.outputs.slice(-5);
    if (recentMessages.length === 0) {
      return 'No previous context.';
    }

    return recentMessages
      .map((o) => `[${o.agentRole}] ${o.title}: ${o.content.slice(0, 200)}...`)
      .join('\n');
  }

  async *chat(message: string): AsyncGenerator<StreamEvent> {
    // Start with orchestrator
    yield* this.runOrchestrator(message);
  }

  private async *runOrchestrator(userMessage: string): AsyncGenerator<StreamEvent> {
    const orchestratorConfig = getAgentConfig('orchestrator');
    const skillContent = loadSkill('orchestrator');
    this.updateAgentStatus('orchestrator', 'working');

    yield {
      type: 'agent_start',
      agentRole: 'orchestrator',
      agentName: orchestratorConfig.name,
    };

    const sessionContext = this.buildSessionContext();

    const systemPrompt = `${skillContent}

## Current Session Context
${sessionContext}

## Current Phase
${this.session.currentPhase}

## Instructions
Based on the user's message and current context, decide what to do:
1. If gathering requirements, engage the User Interview Agent
2. If ready for technical planning, engage the Principal Developer Agent
3. If answering a question, respond directly

CRITICAL: When the user wants to build an app, you MUST:
1. First engage the User Interview Agent to gather requirements
2. Then engage the Principal Developer Agent who will coordinate ALL technical agents
3. DO NOT stop until the Principal Developer has completed their work

Use the delegate_to_agent tool to engage specialized agents.`;

    const tools: Anthropic.Tool[] = [
      {
        name: 'delegate_to_agent',
        description: 'Delegate a task to a specialized agent',
        input_schema: {
          type: 'object' as const,
          properties: {
            agent_role: {
              type: 'string',
              enum: ['user-interview', 'principal-developer', 'ux-design', 'frontend', 'backend-database', 'backend-api', 'backend-logic', 'backend-infra'],
              description: 'The role of the agent to delegate to',
            },
            task: {
              type: 'string',
              description: 'The task to assign to the agent',
            },
            context: {
              type: 'string',
              description: 'Additional context for the agent',
            },
          },
          required: ['agent_role', 'task'],
        },
      },
      {
        name: 'update_phase',
        description: 'Update the current planning phase',
        input_schema: {
          type: 'object' as const,
          properties: {
            phase: {
              type: 'string',
              enum: ['requirements', 'ux-design', 'frontend-architecture', 'backend-architecture', 'integration-review', 'code-generation', 'completed'],
              description: 'The new phase',
            },
          },
          required: ['phase'],
        },
      },
    ];

    let currentMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    // Agent loop
    for (let iteration = 0; iteration < 30; iteration++) {
      const stream = this.client.messages.stream({
        model: getModelId(orchestratorConfig.model),
        max_tokens: 8192,
        system: systemPrompt,
        tools,
        messages: currentMessages,
      });

      let hasToolUse = false;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      const contentBlocks: Anthropic.ContentBlock[] = [];

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              yield { type: 'text', content: event.delta.text };
            }
          }
        }
      } catch (streamError) {
        console.error('Orchestrator stream error:', streamError);
        yield {
          type: 'error',
          error: `Stream error: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`,
        };
        break;
      }

      let response;
      try {
        response = await stream.finalMessage();
      } catch (finalError) {
        console.error('Orchestrator final message error:', finalError);
        yield {
          type: 'error',
          error: `Failed to get response: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`,
        };
        break;
      }

      for (const block of response.content) {
        contentBlocks.push(block);
        if (block.type === 'text') {
          this.addActivity('orchestrator', 'message', block.text);
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          const toolName = block.name;
          const toolInput = block.input as Record<string, unknown>;

          yield { type: 'tool_start', tool: toolName, toolInput };

          try {
            let result: unknown;

            if (toolName === 'delegate_to_agent') {
              const agentRole = toolInput.agent_role as AgentRole;
              const task = toolInput.task as string;
              const context = toolInput.context as string | undefined;

              let agentResponse = '';
              for await (const event of this.runSubAgent(agentRole, task, context)) {
                yield event;
                if (event.type === 'text') {
                  agentResponse += event.content;
                }
              }
              result = { success: true, response: agentResponse };
            } else if (toolName === 'update_phase') {
              const phase = toolInput.phase as ExperimentPhase;
              this.session.currentPhase = phase;
              yield { type: 'phase_change', phase };
              result = { success: true, phase };
            } else {
              result = { error: 'Unknown tool' };
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          } catch (toolError) {
            console.error(`Tool ${toolName} error:`, toolError);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ error: String(toolError) }),
              is_error: true,
            });
          }

          yield { type: 'tool_end', tool: toolName };
        }
      }

      // If no tool use, we're done
      if (!hasToolUse || response.stop_reason === 'end_turn') {
        break;
      }

      // Continue with tool results
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: contentBlocks },
        { role: 'user', content: toolResults },
      ];
    }

    this.updateAgentStatus('orchestrator', 'completed');
    yield {
      type: 'agent_end',
      agentRole: 'orchestrator',
      agentName: orchestratorConfig.name,
    };

    yield { type: 'done' };
  }

  private async *runSubAgent(
    role: AgentRole,
    task: string,
    context?: string
  ): AsyncGenerator<StreamEvent> {
    const config = getAgentConfig(role);
    const skillContent = loadSkill(role);
    this.updateAgentStatus(role, 'working');

    yield {
      type: 'agent_start',
      agentRole: role,
      agentName: config.name,
    };

    const tools = getToolsForRole(role);

    // Put constraints AFTER the task so they're closer to model attention
    const systemPrompt = `You are a specialized agent. Your ONLY job is to call tools.

## Your Task
${task}

${context ? `## Context\n${context}` : ''}

## Your Process
${skillContent}

## CRITICAL CONSTRAINTS
- You MUST use tools to complete your task
- DO NOT output explanatory text - only call tools
- Follow the SOP steps exactly in order
- Stop when the SOP is complete`;

    let currentMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Please complete this task: ${task}` },
    ];

    // Sub-agent loop - force tool use for deterministic output
    for (let iteration = 0; iteration < 25; iteration++) {
      const stream = this.client.messages.stream({
        model: getModelId(config.model),
        max_tokens: 8192,
        system: systemPrompt,
        tools: tools.length > 0 ? tools : undefined,
        // Force tool use - agents must output via tools, not free-form text
        tool_choice: tools.length > 0 ? { type: 'any' } : undefined,
        messages: currentMessages,
      });

      let hasToolUse = false;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      const contentBlocks: Anthropic.ContentBlock[] = [];

      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              yield { type: 'text', content: event.delta.text, agentRole: role };
            }
          }
        }
      } catch (streamError) {
        console.error(`${role} stream error:`, streamError);
        yield {
          type: 'error',
          error: `Stream error: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`,
        };
        break;
      }

      let response;
      try {
        response = await stream.finalMessage();
      } catch (finalError) {
        console.error(`${role} final message error:`, finalError);
        break;
      }

      for (const block of response.content) {
        contentBlocks.push(block);
        if (block.type === 'text') {
          this.addActivity(role, 'message', block.text);
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          const toolName = block.name;
          const toolInput = block.input as Record<string, unknown>;

          yield { type: 'tool_start', tool: toolName, toolInput, agentRole: role };

          // Handle delegate_to_agent by actually spawning the sub-agent
          if (toolName === 'delegate_to_agent') {
            const agentRole = (toolInput.agent || toolInput.agent_role) as AgentRole;
            const delegatedTask = toolInput.task as string;
            const delegatedContext = toolInput.context as string | undefined;

            let agentResponse = '';
            for await (const event of this.runSubAgent(agentRole, delegatedTask, delegatedContext)) {
              yield event;
              if (event.type === 'text') {
                agentResponse += event.content;
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ success: true, response: agentResponse.slice(0, 500) }),
            });
          } else {
            // For other planning tools, record the block data
            const output = this.addOutput(
              role,
              'specification',
              `${toolName}: ${toolInput.name || toolInput.title || 'Block'}`,
              JSON.stringify(toolInput, null, 2),
              'json'
            );

            yield { type: 'output', output, agentRole: role };

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ success: true, blockId: output.agentId }),
            });
          }

          yield { type: 'tool_end', tool: toolName, agentRole: role };
        }
      }

      if (!hasToolUse || response.stop_reason === 'end_turn') {
        break;
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: contentBlocks },
        { role: 'user', content: toolResults },
      ];
    }

    this.updateAgentStatus(role, 'completed');
    yield {
      type: 'agent_end',
      agentRole: role,
      agentName: config.name,
    };
  }
}
