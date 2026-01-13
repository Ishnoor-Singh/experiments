import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SSE event types
type SSEEvent =
  | { type: "agent_start"; agentRole: string; agentName: string }
  | { type: "text"; content: string }
  | { type: "tool_use"; toolName: string; input: unknown }
  | { type: "tool_result"; toolName: string; result: unknown }
  | { type: "agent_end"; agentRole: string }
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

    const encoder = createSSEEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send agent start event
          controller.enqueue(
            encoder.encode({
              type: "agent_start",
              agentRole: "orchestrator",
              agentName: "Planning Orchestrator",
            })
          );

          // TODO: In Commit 9, this will call the actual ExperimentAgent
          // For now, send a placeholder response
          const placeholderResponse = `I received your message: "${message}"\n\nThis is a placeholder response. The agent integration will be completed in the next commit.`;

          // Simulate streaming by sending chunks
          const words = placeholderResponse.split(" ");
          for (let i = 0; i < words.length; i++) {
            const chunk = (i > 0 ? " " : "") + words[i];
            controller.enqueue(
              encoder.encode({
                type: "text",
                content: chunk,
              })
            );
            // Small delay to simulate streaming
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          // Send agent end event
          controller.enqueue(
            encoder.encode({
              type: "agent_end",
              agentRole: "orchestrator",
            })
          );

          // Send done event
          controller.enqueue(encoder.encode({ type: "done" }));

          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            })
          );
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
