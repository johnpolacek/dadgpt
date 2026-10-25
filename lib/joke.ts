import Anthropic from "@anthropic-ai/sdk";
import { DAD_SYSTEM } from "@/lib/dad-prompt";

export type Turn = { role: "user" | "assistant"; content: string };

export const LUNA_MODEL = "gpt-6-luna";
export const HAIKU_MODEL = "claude-haiku-5-5";

const REFUSAL_REPLY = "I’d tell you a joke about that, but it’s above my pay grade. Ask your mother.";

/** Gets a joke from gpt-6-luna, which won the blind party face-off */
export async function lunaJoke(history: Turn[], apiKey: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LUNA_MODEL,
      instructions: DAD_SYSTEM,
      input: history,
      max_output_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Luna failed ${res.status}: ${await res.text().catch(() => "")}`);

  const data = await res.json();
  const parts = (data.output ?? []).flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? []);
  if (parts.some((p: { type: string }) => p.type === "refusal")) return REFUSAL_REPLY;
  return parts
    .map((p: { type: string; text?: string }) => (p.type === "output_text" ? p.text : ""))
    .join("")
    .trim();
}

/** Gets a joke from Claude Haiku, the fallback when Luna is unavailable */
export async function haikuJoke(history: Turn[]) {
  const response = await new Anthropic().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: DAD_SYSTEM,
    messages: history,
  });
  if (response.stop_reason === "refusal") return REFUSAL_REPLY;
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}
