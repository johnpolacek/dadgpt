import { NextResponse } from "next/server";
import { smartQuotes } from "@/lib/smart-quotes";
import { haikuJoke, lunaJoke, type Turn } from "@/lib/joke";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages: Turn[] = Array.isArray(body?.messages) ? body.messages : [];

  // Keep only recent, well-formed turns so the request stays small
  const history = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (history.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }

  // Luna first, Haiku as a backup so Dad keeps talking if OpenAI hiccups
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      return NextResponse.json({ reply: smartQuotes(await lunaJoke(history, openaiKey)) });
    } catch (error) {
      console.error(error);
    }
  }

  try {
    return NextResponse.json({ reply: smartQuotes(await haikuJoke(history)) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Dad is napping. Try again." }, { status: 500 });
  }
}
