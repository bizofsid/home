import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/app/types";
import { describeHousehold, executeTool } from "./household";

const KEY_STORAGE = "itinerant_api_key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_STORAGE) ?? "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

const SYSTEM_PROMPT = `You are Itinerant — a discreet, hyper-competent executive assistant in the principal's pocket. You run their day: assets, household staff, and itinerary.

Core duties:
- Organize the principal's day across their assets (residences, jet, yacht, vehicles, and the equipment nested on them).
- Allocate staff with GEOGRAPHY in mind: match staff tags to where the day happens, keeping people flexible. Never assign Monaco crew to a Manhattan errand.
- Dispatch staff cues promptly. Every cue optimizes exactly one of the principal's five resources — choose the dimension deliberately:
  • time — scheduling, punctuality, readiness ("car at the door 07:30")
  • space — positioning of assets/people ("move the tender to the east dock")
  • money — spend, procurement, negotiation ("cap the charter at 40k")
  • matter — physical goods and upkeep ("provision the galley", "summer house cleaned")
  • value — efficiency plays that compound ("consolidate both trips into one wheels-up")

Operating style:
- Crisp, anticipatory, zero fluff. Confirm actions in one or two lines, like a chief of staff texting back.
- USE YOUR TOOLS. When the principal asks for anything actionable — schedule it, cue the right staff member, log the asset. Don't describe what could be done; do it.
- When a request spans several staff, send each their own cue.
- If an asset needs attention (e.g. summer home not cleaned), cue the right staff and update the asset status.
- Ask at most one clarifying question, and only when truly ambiguous.

The current household state is provided below. It is the source of truth.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "add_schedule_item",
    description: "Add an item to today's itinerary.",
    input_schema: {
      type: "object" as const,
      properties: {
        time: { type: "string", description: '24h "HH:MM"' },
        title: { type: "string" },
        asset_name: { type: "string", description: "Asset where this happens (fuzzy matched)" },
        staff_names: { type: "array", items: { type: "string" }, description: "Staff involved (fuzzy matched by name or role)" },
        notes: { type: "string" },
      },
      required: ["time", "title"],
    },
  },
  {
    name: "remove_schedule_item",
    description: "Remove an itinerary item by (partial) title.",
    input_schema: {
      type: "object" as const,
      properties: { title: { type: "string" } },
      required: ["title"],
    },
  },
  {
    name: "send_staff_cue",
    description:
      "Dispatch an instruction to a staff member. Pick the one resource dimension the cue optimizes.",
    input_schema: {
      type: "object" as const,
      properties: {
        staff_name: { type: "string", description: "Name or role, fuzzy matched" },
        instruction: { type: "string" },
        dimension: {
          type: "string",
          enum: ["time", "space", "money", "matter", "value"],
        },
        time: { type: "string", description: 'When relevant, 24h "HH:MM"' },
      },
      required: ["staff_name", "instruction", "dimension"],
    },
  },
  {
    name: "update_asset_status",
    description: "Update an asset's status and/or location (e.g. 'Cleaned', 'Repositioned to Cannes').",
    input_schema: {
      type: "object" as const,
      properties: {
        asset_name: { type: "string" },
        status: { type: "string" },
        location: { type: "string" },
      },
      required: ["asset_name", "status"],
    },
  },
  {
    name: "add_asset",
    description: "Log a new asset. Nest it on a parent asset when it physically lives there (jetski on yacht, car at residence).",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        type: {
          type: "string",
          enum: ["residence", "jet", "yacht", "vehicle", "watercraft", "aircraft", "office", "equipment"],
        },
        location: { type: "string" },
        status: { type: "string" },
        parent_asset_name: { type: "string", description: "Parent asset if nested" },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "add_staff",
    description: "Add a staff member with geographic/skill tags and contact channels.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        tags: { type: "array", items: { type: "string" }, description: "Geographic + skill tags" },
        phone: { type: "string" },
        instagram: { type: "string", description: "Handle without @" },
      },
      required: ["name", "role"],
    },
  },
];

export async function streamChat(
  messages: Pick<Message, "role" | "content">[],
  onText: (fullText: string) => void,
  onAction?: () => void
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const system = `${SYSTEM_PROMPT}\n\n=== CURRENT HOUSEHOLD STATE ===\n${describeHousehold()}`;

  let convo: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  let full = "";

  // Agentic loop: keep going while the model wants to use tools.
  for (let round = 0; round < 8; round++) {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      tools: TOOLS,
      messages: convo,
    });

    const before = full;
    let roundText = "";
    stream.on("text", (delta) => {
      roundText += delta;
      const sep = before && roundText ? (before.endsWith("\n\n") ? "" : "\n\n") : "";
      onText(before + sep + roundText);
    });

    const final = await stream.finalMessage();
    const sep = before && roundText ? (before.endsWith("\n\n") ? "" : "\n\n") : "";
    full = before + sep + roundText;
    onText(full);

    if (final.stop_reason !== "tool_use") return full;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of final.content) {
      if (block.type === "tool_use") {
        const result = executeTool(block.name, block.input as Record<string, unknown>);
        onAction?.();
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }
    convo = [
      ...convo,
      { role: "assistant", content: final.content },
      { role: "user", content: toolResults },
    ];
  }

  return full;
}
