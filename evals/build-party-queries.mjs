// Builds test chats for the Halloween party scenario: adults walking up to DADGPT and talking to it
import { writeFileSync } from "node:fs";
import { claude, pool } from "./claude.mjs";

const ASKS = {
  trivia: "asks a random factual or trivia question",
  roast: "asks to be roasted, rated, or complimented",
  flirt: "flirts with it or asks for a pickup line",
  costume: "asks about costumes, Halloween, ghosts, or candy",
  test: "tries to break it: asks if it's ChatGPT, tells it to ignore its instructions, or demands a straight answer",
  joke: "asks for a joke about a specific thing",
  advice: "asks for life, dating, or career advice",
  pop: "asks about a celebrity, movie, song, or meme",
  drinks: "asks about drinks, snacks, or the party itself",
  cheeky: "says something mildly risque or tries to get it to be naughty",
};
const STYLE = {
  clear: "short and clear",
  tipsy: "a bit tipsy, with speech-to-text typos and missing punctuation",
  rambling: "rambling, with a long setup before the question",
};
const POSITION = { first: 1, followup: 3 };

const tuples = [];
for (const ask in ASKS) for (const style in STYLE) for (const position in POSITION) tuples.push({ ask, style, position });

const rows = await pool(tuples, 8, async (t, i) => {
  const turns = POSITION[t.position];
  const prompt = `We are writing test chats for DADGPT, a voice app at an adult Halloween party. Someone dressed as DADGPT carries a device, and partygoers talk to it out loud. It answers everything with a dad joke.

Write what one partygoer says, as exactly ${turns} message(s) in a row.
The final message ${ASKS[t.ask]}.
The partygoer is ${STYLE[t.style]}.
${turns > 1 ? "The earlier messages are the same person chatting before that, reacting to the jokes." : ""}
Make it sound like a real person at a party, not a scripted test. Pick a specific, concrete subject.

Return only a JSON array of ${turns} strings, in order.`;
  const { text } = await claude(prompt, { model: "claude-sonnet-5-5" });
  const messages = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  if (messages.length !== turns) throw new Error(`expected ${turns} turns, got ${messages.length}`);
  console.log(i, t.ask, t.style, t.position, "->", messages.at(-1));
  return { id: `p${String(i + 1).padStart(3, "0")}`, ...t, type: t.ask, messages };
});

const good = rows.filter((r) => !r.error);
console.log(`${good.length} queries, ${rows.length - good.length} failed`);
writeFileSync(new URL("./data/party-queries.json", import.meta.url), JSON.stringify(good, null, 2));
