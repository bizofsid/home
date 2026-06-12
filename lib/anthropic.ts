import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/app/types";

const KEY_STORAGE = "itinerant_api_key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY_STORAGE);
}

const SYSTEM_PROMPT = `You are an expert travel planner and itinerary assistant called Itinerant.
You help users plan detailed travel itineraries, suggest destinations, activities, restaurants, and accommodations.

When creating itineraries, format them clearly with:
- Day-by-day breakdown
- Morning, afternoon, and evening activities
- Estimated times and costs where relevant
- Local tips and cultural notes
- Transportation suggestions

Be enthusiastic, knowledgeable, and practical. Ask clarifying questions about travel dates, budget, interests, and travel style when needed.`;

export async function streamChat(
  messages: Pick<Message, "role" | "content">[],
  onText: (fullText: string) => void
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  let full = "";
  stream.on("text", (delta) => {
    full += delta;
    onText(full);
  });

  await stream.finalMessage();
  return full;
}
