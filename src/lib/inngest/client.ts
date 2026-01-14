import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "experiment-builder",
  // Event key is set via INNGEST_EVENT_KEY env var
});
