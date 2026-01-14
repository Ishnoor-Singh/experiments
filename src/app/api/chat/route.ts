import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Chat endpoint - creates a job and triggers Inngest to run the agent
 * Returns immediately with the job ID for polling
 */
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

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Save the user message
    await convex.mutation(api.messages.create, {
      experimentId: experimentId as Id<"experiments">,
      role: "user",
      content: message,
    });

    // Create a job to track the agent work
    const jobId = await convex.mutation(api.jobs.create, {
      experimentId: experimentId as Id<"experiments">,
      type: "agent_chat",
      input: { message },
    });

    // Trigger Inngest to run the agent in the background
    await inngest.send({
      name: "agent/chat",
      data: {
        experimentId,
        message,
        jobId,
      },
    });

    // Return immediately with job ID
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        message: "Agent started in background",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Invalid request body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
