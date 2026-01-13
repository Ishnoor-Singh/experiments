import { test, expect } from "@playwright/test";

test.describe("Chat API", () => {
  test("SSE endpoint returns streaming response", async ({ request }) => {
    const response = await request.post("/api/chat", {
      data: {
        experimentId: "test-experiment-123",
        message: "Hello, build me a todo app",
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/event-stream");

    const text = await response.text();

    // Check that we received SSE events
    expect(text).toContain('data: {"type":"agent_start"');
    expect(text).toContain('data: {"type":"text"');
    expect(text).toContain('data: {"type":"agent_end"');
    expect(text).toContain('data: {"type":"done"}');
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
