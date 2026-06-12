import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert travel planner and itinerary assistant called Itinerant.
You help users plan detailed travel itineraries, suggest destinations, activities, restaurants, and accommodations.

When creating itineraries, format them clearly with:
- Day-by-day breakdown
- Morning, afternoon, and evening activities
- Estimated times and costs where relevant
- Local tips and cultural notes
- Transportation suggestions

Be enthusiastic, knowledgeable, and practical. Ask clarifying questions about travel dates, budget, interests, and travel style when needed.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
