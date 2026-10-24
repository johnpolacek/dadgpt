// Records the voice lab joke in every voice and style to public/voices/.
// Run with: pnpm record-voices (rerun after editing lib/voice-lab.ts)
import { mkdir, writeFile } from "node:fs/promises";
import { LAB_JOKE, LAB_STYLES, LAB_VOICES, labAudioPath } from "../lib/voice-lab.ts";
import { fetchSpeech } from "../lib/voice.ts";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

await mkdir("public/voices", { recursive: true });

for (const style of LAB_STYLES) {
  await Promise.all(
    LAB_VOICES.map(async (voice) => {
      const res = await fetchSpeech(style.text ?? LAB_JOKE, apiKey, voice, style.instructions);
      if (!res.ok) throw new Error(`TTS failed for ${style.id}/${voice}: ${res.status} ${await res.text()}`);
      await writeFile(`public${labAudioPath(style.id, voice)}`, Buffer.from(await res.arrayBuffer()));
      console.log(`${style.id} ${voice}`);
    }),
  );
}
