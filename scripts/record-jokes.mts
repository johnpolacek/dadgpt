// Records each canned joke to public/jokes/<index>.mp3 with the live Dad voice.
// Run with: pnpm record-jokes (rerun after editing lib/jokes.ts)
import { writeFile } from "node:fs/promises";
import { JOKES, jokeAudioPath } from "../lib/jokes.ts";
import { fetchSpeech } from "../lib/voice.ts";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

for (const [i, joke] of JOKES.entries()) {
  const res = await fetchSpeech(joke, apiKey);
  if (!res.ok) throw new Error(`TTS failed for joke ${i}: ${res.status} ${await res.text()}`);
  await writeFile(`public${jokeAudioPath(i)}`, Buffer.from(await res.arrayBuffer()));
  console.log(`${i}: ${joke}`);
}
