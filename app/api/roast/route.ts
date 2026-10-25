import { NextResponse } from "next/server";
import { smartQuotes } from "@/lib/smart-quotes";
import { haikuRoast, lunaRoast } from "@/lib/joke";

/** A downscaled phone photo is well under this. Anything bigger is not from our camera button. */
const MAX_PHOTO = 2_000_000;

// The photo is only passed through to the model, never stored
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const photo = body?.photo;
  if (typeof photo !== "string" || !photo.startsWith("data:image/jpeg;base64,") || photo.length > MAX_PHOTO) {
    return NextResponse.json({ error: "No photo" }, { status: 400 });
  }

  // Luna first, Haiku as a backup, same as the jokes
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      return NextResponse.json({ reply: smartQuotes(await lunaRoast(photo, openaiKey)) });
    } catch (error) {
      console.error(error);
    }
  }

  try {
    return NextResponse.json({ reply: smartQuotes(await haikuRoast(photo)) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Dad is napping. Try again." }, { status: 500 });
  }
}
