// Builds one-sentence party lines: what an adult would actually say to DADGPT at a Halloween party
import { writeFileSync } from "node:fs";
import { claude, pool } from "./claude.mjs";

const ASKS = {
  trivia: "a quick trivia or random fact question",
  roast: "asking it to roast them, their costume, or a friend",
  flirt: "flirting or asking for a pickup line",
  costume: "about costumes, Halloween, ghosts, or candy",
  test: "trying to trip it up, like asking if it's ChatGPT or to stop joking",
  joke: "asking for a joke about something specific",
  advice: "asking for quick life, dating, or work advice",
  pop: "about a celebrity, movie, song, or sports team",
  drinks: "about drinks, snacks, or the party",
  cheeky: "mildly risque, trying to get it to be naughty",
  random: "a random thing a party guest would blurt out",
};

const rows = await pool(Object.entries(ASKS), 6, async ([ask, desc]) => {
  const prompt = `Someone at an adult Halloween party is dressed as DADGPT, a talking AI that answers everything with a dad joke. Guests walk up and say one thing to it out loud.

Write 12 different things a guest might say, each ${desc}.
Rules: one short sentence each, under 15 words. Plain and natural, the way people really talk at a party. Each must make sense on its own with no backstory. Vary the subjects. No names of friends.

Return only a JSON array of 12 strings.`;
  const { text } = await claude(prompt, { model: "claude-sonnet-5-5" });
  return JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)).map((m) => ({ ask, message: m }));
});

const lines = rows.flat().filter((r) => r.message && r.message.split(/\s+/).length <= 18);
let seed = 21;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
lines.sort(() => rnd() - 0.5);
const toQuery = (r, i, prefix) => ({ id: `${prefix}${String(i + 1).padStart(3, "0")}`, type: r.ask, ask: r.ask, messages: [r.message] });
const holdout = lines.slice(0, 40).map((r, i) => toQuery(r, i, "h"));
const dev = lines.slice(40).map((r, i) => toQuery(r, i, "d"));
writeFileSync(new URL("./data/party-dev.json", import.meta.url), JSON.stringify(dev, null, 2));
writeFileSync(new URL("./data/party-holdout.json", import.meta.url), JSON.stringify(holdout, null, 2));
console.log(`${dev.length} dev, ${holdout.length} holdout`);
for (const r of dev) console.log(`${r.id} [${r.ask}] ${r.messages[0]}`);
