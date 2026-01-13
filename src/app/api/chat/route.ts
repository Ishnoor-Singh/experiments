import { NextRequest } from "next/server";
import { ExperimentAgent } from "@/lib/agents/experiment-agent";
import { StreamEvent } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for agent execution

// SSE event type for encoding
type SSEEvent =
  | { type: "agent_start"; agentRole: string; agentName: string }
  | { type: "text"; content: string; agentRole?: string }
  | { type: "tool_start"; tool: string; input?: unknown; agentRole?: string }
  | { type: "tool_end"; tool: string; agentRole?: string }
  | { type: "phase_change"; phase: string }
  | { type: "agent_end"; agentRole: string; agentName?: string }
  | { type: "error"; message: string }
  | { type: "done" };

function createSSEEncoder() {
  const encoder = new TextEncoder();

  return {
    encode(event: SSEEvent): Uint8Array {
      const data = JSON.stringify(event);
      return encoder.encode(`data: ${data}\n\n`);
    },
  };
}

// Convert StreamEvent to SSEEvent
function streamEventToSSE(event: StreamEvent): SSEEvent | null {
  switch (event.type) {
    case "agent_start":
      if (!event.agentRole || !event.agentName) return null;
      return {
        type: "agent_start",
        agentRole: event.agentRole,
        agentName: event.agentName,
      };
    case "text":
      return {
        type: "text",
        content: event.content || "",
        agentRole: event.agentRole,
      };
    case "tool_start":
      if (!event.tool) return null;
      return {
        type: "tool_start",
        tool: event.tool,
        input: event.toolInput,
        agentRole: event.agentRole,
      };
    case "tool_end":
      if (!event.tool) return null;
      return {
        type: "tool_end",
        tool: event.tool,
        agentRole: event.agentRole,
      };
    case "phase_change":
      if (!event.phase) return null;
      return {
        type: "phase_change",
        phase: event.phase,
      };
    case "agent_end":
      if (!event.agentRole) return null;
      return {
        type: "agent_end",
        agentRole: event.agentRole,
        agentName: event.agentName,
      };
    case "error":
      return {
        type: "error",
        message: event.error || "Unknown error",
      };
    case "done":
      return { type: "done" };
    default:
      // For output and other events, we don't send to client directly
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { experimentId, message } = body;

    if (!experimentId || !message) {
      return new Response(
        JSON.stringify({ error: "experimentId and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = createSSEEncoder();
    const agent = new ExperimentAgent(experimentId);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of agent.chat(message)) {
            const sseEvent = streamEventToSSE(event);
            if (sseEvent) {
              controller.enqueue(encoder.encode(sseEvent));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Agent error:", error);
          controller.enqueue(
            encoder.encode({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            })
          );
          controller.enqueue(encoder.encode({ type: "done" }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
