import { NextResponse } from "next/server";
import { fetchSpeech } from "@/lib/voice";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No voice configured" }, { status: 503 });

  const res = await fetchSpeech(text, apiKey);

  if (!res.ok || !res.body) {
    console.error("TTS failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Dad lost his voice" }, { status: 502 });
  }

  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } });
}
