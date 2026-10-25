import Anthropic from "@anthropic-ai/sdk";
import { DAD_SYSTEM } from "@/lib/dad-prompt";
import { ROAST_SYSTEM } from "@/lib/roast-prompt";

export type Turn = { role: "user" | "assistant"; content: string };

export const LUNA_MODEL = "gpt-6-luna";
export const HAIKU_MODEL = "claude-haiku-5-5";

const REFUSAL_REPLY = "I’d tell you a joke about that, but it’s above my pay grade. Ask your mother.";
const ROAST_REFUSAL_REPLY = "I’d roast you, but it looks like life already did.";

/** What the roast models get along with the photo */
const ROAST_ASK = "Roast me.";

/** Gets a joke from gpt-6-luna, which won the blind party face-off */
export function lunaJoke(history: Turn[], apiKey: string) {
  return askLuna(DAD_SYSTEM, history, apiKey, REFUSAL_REPLY);
}

/** Roasts the person in a JPEG data URL photo with gpt-6-luna */
export function lunaRoast(photo: string, apiKey: string) {
  const input = [{ role: "user", content: [{ type: "input_text", text: ROAST_ASK }, { type: "input_image", image_url: photo }] }];
  return askLuna(ROAST_SYSTEM, input, apiKey, ROAST_REFUSAL_REPLY);
}

async function askLuna(instructions: string, input: unknown, apiKey: string, refusal: string) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LUNA_MODEL,
      instructions,
      input,
      max_output_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Luna failed ${res.status}: ${await res.text().catch(() => "")}`);

  const data = await res.json();
  const parts = (data.output ?? []).flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? []);
  if (parts.some((p: { type: string }) => p.type === "refusal")) return refusal;
  return parts
    .map((p: { type: string; text?: string }) => (p.type === "output_text" ? p.text : ""))
    .join("")
    .trim();
}

/** Gets a joke from Claude Haiku, the fallback when Luna is unavailable */
export function haikuJoke(history: Turn[]) {
  return askHaiku(DAD_SYSTEM, history, REFUSAL_REPLY);
}

/** Roasts the person in a JPEG data URL photo with Claude Haiku */
export function haikuRoast(photo: string) {
  const data = photo.slice(photo.indexOf(",") + 1);
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data } },
        { type: "text", text: ROAST_ASK },
      ],
    },
  ];
  return askHaiku(ROAST_SYSTEM, messages, ROAST_REFUSAL_REPLY);
}

async function askHaiku(system: string, messages: Anthropic.MessageParam[], refusal: string) {
  const response = await new Anthropic().messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    output_config: { effort: "low" },
    system,
    messages,
  });
  if (response.stop_reason === "refusal") return refusal;
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}
