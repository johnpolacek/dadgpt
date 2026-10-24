// Runs judges on the final reply of every chat in a traces file
// Usage: node evals/judge-run.mjs <label> [judge,judge]
import { readFileSync, writeFileSync } from "node:fs";
import { pool } from "./claude.mjs";
import { JUDGES, judge } from "./judges.mjs";

const label = process.argv[2];
const traces = JSON.parse(readFileSync(new URL(`./data/traces-${label}.json`, import.meta.url))).filter((t) => !t.error);
const names = process.argv[3] ? process.argv[3].split(",") : Object.keys(JUDGES);
const jobs = traces.flatMap((t) => names.map((name) => ({ t, name })));

let done = 0;
const results = await pool(jobs, 8, async ({ t, name }) => {
  const v = await judge(name, t.turns.at(-2).content, t.turns.at(-1).content);
  if (++done % 20 === 0) console.log(`  ${done}/${jobs.length} judged`);
  return { id: t.id, type: t.type, name, result: v.result, critique: v.critique, reply: t.turns.at(-1).content };
});

for (const name of names) {
  const rs = results.filter((r) => r.name === name && !r.error);
  console.log(`${name.padEnd(10)} ${rs.filter((r) => r.result === "Pass").length}/${rs.length} pass`);
}
console.log(`${results.filter((r) => r.error).length} errors`);
writeFileSync(new URL(`./data/judged-${label}.json`, import.meta.url), JSON.stringify(results, null, 2));
