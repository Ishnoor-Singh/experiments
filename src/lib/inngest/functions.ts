import { inngest } from "./client";
import { ExperimentAgent } from "@/lib/agents/experiment-agent";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Define event types
type AgentChatEvent = {
  name: "agent/chat";
  data: {
    experimentId: string;
    message: string;
    jobId: string;
  };
};

/**
 * Agent chat function - runs in the background with no timeout limits
 * Updates Convex with progress and results
 */
export const agentChat = inngest.createFunction(
  {
    id: "agent-chat",
    name: "Agent Chat",
    // Retry configuration
    retries: 0, // Don't retry failed runs - agent state would be inconsistent
  },
  { event: "agent/chat" },
  async ({ event, step }) => {
    const { experimentId, message, jobId } = event.data;

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Mark job as started
    await step.run("mark-job-started", async () => {
      await convex.mutation(api.jobs.updateStatus, {
        jobId: jobId as Id<"jobs">,
        status: "running",
      });
    });

    // Run the agent
    const result = await step.run("run-agent", async () => {
      const agent = new ExperimentAgent(experimentId);
      const outputs: Array<{ type: string; content: string }> = [];
      let lastAgentRole = "";
      let lastAgentName = "";

      try {
        for await (const event of agent.chat(message)) {
          // Save activities to Convex
          try {
            if (event.type === "agent_start" && event.agentRole) {
              lastAgentRole = event.agentRole;
              lastAgentName = event.agentName || event.agentRole;
              await convex.mutation(api.activities.create, {
                experimentId: experimentId as Id<"experiments">,
                type: "agent_start",
                agentRole: event.agentRole,
                agentName: event.agentName,
              });
            } else if (event.type === "agent_end" && event.agentRole) {
              await convex.mutation(api.activities.create, {
                experimentId: experimentId as Id<"experiments">,
                type: "agent_complete",
                agentRole: event.agentRole,
                agentName: event.agentName,
              });
            } else if (event.type === "tool_start" && event.tool) {
              await convex.mutation(api.activities.create, {
                experimentId: experimentId as Id<"experiments">,
                type: "tool_use",
                tool: event.tool,
                agentRole: event.agentRole,
                metadata: event.toolInput,
              });
            } else if (event.type === "phase_change" && event.phase) {
              await convex.mutation(api.activities.create, {
                experimentId: experimentId as Id<"experiments">,
                type: "phase_change",
                phase: event.phase,
              });
            } else if (event.type === "error") {
              await convex.mutation(api.activities.create, {
                experimentId: experimentId as Id<"experiments">,
                type: "error",
                error: event.error || "Unknown error",
              });
            } else if (event.type === "output" && event.output) {
              // Track block creation
              if (event.output.type === "specification") {
                await convex.mutation(api.activities.create, {
                  experimentId: experimentId as Id<"experiments">,
                  type: "block_created",
                  agentRole: event.agentRole,
                  blockType: event.output.title,
                  metadata: { content: event.output.content },
                });
              }
              // Collect outputs for the final message
              outputs.push({
                type: event.output.type,
                content: event.output.content || event.output.title || "",
              });
            } else if (event.type === "text" && event.text) {
              // Collect text outputs
              outputs.push({
                type: "text",
                content: event.text,
              });
            }
          } catch (activityError) {
            console.error("Failed to save activity:", activityError);
          }
        }

        return {
          success: true,
          outputs,
          lastAgentRole,
          lastAgentName,
        };
      } catch (error) {
        console.error("Agent error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          outputs,
          lastAgentRole,
          lastAgentName,
        };
      }
    });

    // Save the assistant message to Convex
    await step.run("save-message", async () => {
      if (result.outputs.length > 0) {
        // Combine all text outputs into a single message
        const messageContent = result.outputs
          .filter((o) => o.type === "text")
          .map((o) => o.content)
          .join("\n\n");

        if (messageContent) {
          await convex.mutation(api.messages.create, {
            experimentId: experimentId as Id<"experiments">,
            role: "assistant",
            content: messageContent,
            agentRole: result.lastAgentRole,
            agentName: result.lastAgentName,
          });
        }
      }
    });

    // Mark job as complete
    await step.run("mark-job-complete", async () => {
      await convex.mutation(api.jobs.updateStatus, {
        jobId: jobId as Id<"jobs">,
        status: result.success ? "completed" : "failed",
        result: result.success ? { outputCount: result.outputs.length } : undefined,
        error: result.success ? undefined : result.error,
      });
    });

    return {
      success: result.success,
      outputCount: result.outputs.length,
    };
  }
);

// Export all functions
export const functions = [agentChat];
