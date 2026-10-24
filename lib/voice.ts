export const VOICE = "ash";
export const INSTRUCTIONS =
  "Speak like a warm, goofy American dad telling a corny joke. Upbeat and playful, with a short pause before the punchline.";

/** Calls OpenAI text to speech and returns the mp3 response */
export function fetchSpeech(text: string, apiKey: string, voice = VOICE, instructions = INSTRUCTIONS) {
  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      instructions,
      response_format: "mp3",
    }),
  });
}
