import { test, expect } from "@playwright/test";

test.describe("Chat API", () => {
  test("returns 500 when ANTHROPIC_API_KEY not set or 200 with job info", async ({ request }) => {
    // When API key is not configured, should return 500
    // When configured, triggers Inngest job and returns job info
    const response = await request.post("/api/chat", {
      data: {
        experimentId: "test-experiment-123",
        message: "Hello, build me a todo app",
      },
    });

    const status = response.status();
    const json = await response.json();

    if (status === 500) {
      // Without API key, we expect 500
      expect(json.error).toBe("ANTHROPIC_API_KEY is not configured");
    } else if (status === 200) {
      // With API key, we expect job info (Inngest triggered)
      expect(json.success).toBe(true);
      expect(json.jobId).toBeDefined();
      expect(json.message).toBe("Agent started in background");
    } else {
      // 400 may occur if experiment doesn't exist in Convex
      expect(status).toBe(400);
    }
  });

  test("returns 400 for missing experimentId", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        message: "Hello",
      },
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("experimentId and message are required");
  });

  test("returns 400 for missing message", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        experimentId: "test-123",
      },
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("experimentId and message are required");
  });
});
