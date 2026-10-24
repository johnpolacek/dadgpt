// Plays each test conversation through Dad, one real turn at a time
// Usage: [PROMPT=r1] node evals/run.mjs <label> [queries file] [claude-haiku-5-5 | gpt-6-luna]
import { readFileSync, writeFileSync } from "node:fs";
import { claude, codex, pool } from "./claude.mjs";
import { DAD_SYSTEM as APP_PROMPT } from "../lib/dad-prompt.ts";

const label = process.argv[2] || new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const queriesFile = process.argv[3] || "queries.json";
const model = process.argv[4] || "claude-haiku-5-5";
// PROMPT=r1 tests evals/prompts/r1.txt instead of the app's prompt
const DAD_SYSTEM = process.env.PROMPT ? readFileSync(new URL(`./prompts/${process.env.PROMPT}.txt`, import.meta.url), "utf8") : APP_PROMPT;
const call = model.startsWith("gpt") ? codex : claude;
const queries = JSON.parse(readFileSync(new URL(`./data/${queriesFile}`, import.meta.url)));

const traces = await pool(queries, 8, async (q) => {
  const turns = [];
  let sessionId;
  for (const message of q.messages) {
    const reply = await call(message, { system: DAD_SYSTEM, model, resume: sessionId });
    sessionId = reply.sessionId;
    turns.push({ role: "user", content: message }, { role: "assistant", content: reply.text });
  }
  console.log(q.id, "->", turns.at(-1).content);
  return { ...q, model, prompt: DAD_SYSTEM, turns };
});

const out = new URL(`./data/traces-${label}.json`, import.meta.url);
writeFileSync(out, JSON.stringify(traces, null, 2));
console.log(`${traces.filter((t) => !t.error).length} traces written to ${out.pathname}`);
