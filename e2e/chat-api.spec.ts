import { test, expect } from "@playwright/test";

test.describe("Chat API", () => {
  test("SSE endpoint returns 500 when ANTHROPIC_API_KEY not set", async ({ request }) => {
    // When API key is not configured, should return 500
    // In production, this would stream real agent responses
    const response = await request.post("/api/chat", {
      data: {
        experimentId: "test-experiment-123",
        message: "Hello, build me a todo app",
      },
    });

    // Without API key, we expect either 500 (not configured) or 200 (streaming)
    // In CI without API key, it should return 500
    const status = response.status();
    if (status === 500) {
      const json = await response.json();
      expect(json.error).toBe("ANTHROPIC_API_KEY is not configured");
    } else {
      // If API key is set (local dev), check SSE response
      expect(status).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/event-stream");
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
