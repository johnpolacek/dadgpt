// Builds ~100 synthetic test conversations from a grid of failure-prone dimensions
import { writeFileSync } from "node:fs";
import { claude, pool } from "./claude.mjs";

const TYPES = {
  fact: "asks a factual question",
  howto: "asks how to do something",
  feelings: "shares how they feel",
  smalltalk: "makes small talk",
  joke: "asks Dad for a joke",
  sensitive: "brings up something serious, like death, illness, or mental health",
  pushback: "pushes back on Dad, like 'just answer me' or 'that wasn't funny'",
};
const DIFFICULTY = ["easy", "medium", "hard"];
// Specific topics, handed out in turn so no single subject dominates
const TOPICS = {
  easy: ["cats", "dogs", "coffee", "pizza", "rain", "bananas", "cheese", "chickens", "snow", "tacos", "bees", "eggs", "fish", "bread", "corn", "the beach", "cows", "apples", "ducks", "soup", "frogs", "sunshine", "potatoes", "horses", "ice cream", "owls", "tomatoes", "wind", "bears", "cookies", "pigs", "mushrooms", "clouds", "lemons"],
  medium: ["laundry", "commuting", "homework", "golf", "the dentist", "taxes", "moving house", "a job interview", "the gym", "mowing the lawn", "baseball", "a road trip", "painting a room", "a wedding", "the grocery store", "a flat tire", "camping", "a haircut", "bowling", "a leaky roof", "a new puppy", "parent-teacher night", "jury duty", "a dishwasher", "fantasy football", "a garage sale", "a power outage", "car insurance", "a broken printer", "learning guitar", "a school play", "a fence", "a fishing trip", "a book club"],
  hard: ["quantum physics", "a Fourier transform", "recursion", "GDPR", "blockchain", "eigenvalues", "Kubernetes", "the name Siobhan", "existentialism", "mortgage refinancing", "CRISPR", "a mutex", "monetary policy", "the Krebs cycle", "TCP handshakes", "Bayesian statistics", "zoning law", "dark matter", "the name Xochitl", "category theory", "a 401k rollover", "Rust borrow checker", "game theory", "photosynthesis", "patent law", "the Higgs boson", "SQL joins", "macroeconomics", "string theory", "the name Nguyen", "OAuth tokens", "plate tectonics", "epistemology", "inflation"],
};
const nextTopic = { easy: 0, medium: 0, hard: 0 };

const POSITION = {
  first: { turns: 1, desc: "the first message of the chat" },
  same3: { turns: 3, desc: "the third message, after two earlier messages on the same topic" },
  mixed6: { turns: 6, desc: "the sixth message, after five earlier messages on different topics" },
};

const EXAMPLES = [
  "Why do cats purr?",
  "Okay but how do I tighten the bolt?",
  "My grandma passed away",
  "Seriously, just answer the question",
  "Tell me a joke about tax law",
];

// Full grid once, then a second pass over a shuffled grid to reach 100
const grid = [];
for (const type in TYPES)
  for (const difficulty of DIFFICULTY)
    for (const position in POSITION) grid.push({ type, difficulty, position });
const shuffled = [...grid].sort(() => Math.random() - 0.5);
const tuples = [...grid, ...shuffled.slice(0, 100 - grid.length)];

for (const t of tuples) t.topic = TOPICS[t.difficulty][nextTopic[t.difficulty]++ % TOPICS[t.difficulty].length];

const rows = await pool(tuples, 8, async (t, i) => {
  const { turns, desc } = POSITION[t.position];
  const prompt = `We are writing test chats for DADGPT, a voice app where "Dad" answers every message with a dad joke.
Users are adults trying it for fun. They type casually, sometimes with typos or no punctuation.

Write the user's side of a chat with exactly ${turns} message(s).
The final message ${TYPES[t.type]}, about ${t.topic}.
The final message is ${desc}.
Vary the wording. Do not copy these examples: ${EXAMPLES.join(" | ")}

Return only a JSON array of ${turns} strings, one per user message, in order.`;
  const { text } = await claude(prompt, { model: "claude-sonnet-5-5" });
  const messages = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  if (messages.length !== turns) throw new Error(`expected ${turns} turns, got ${messages.length}`);
  console.log(i, t.type, t.topic, t.position, "->", messages.at(-1));
  return { id: `q${String(i + 1).padStart(3, "0")}`, ...t, messages };
});

const good = rows.filter((r) => !r.error);
console.log(`${good.length} queries, ${rows.length - good.length} failed`);
writeFileSync(new URL("./data/queries.json", import.meta.url), JSON.stringify(good, null, 2));
