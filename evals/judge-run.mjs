// Runs all judges on the final reply of every chat in a traces file. Usage: node evals/judge-run.mjs v4
import { readFileSync, writeFileSync } from "node:fs";
import { pool } from "./claude.mjs";
import { JUDGES, judge } from "./judges.mjs";

const label = process.argv[2];
const traces = JSON.parse(readFileSync(new URL(`./data/traces-${label}.json`, import.meta.url))).filter((t) => !t.error);
const jobs = traces.flatMap((t) => Object.keys(JUDGES).map((name) => ({ t, name })));

const results = await pool(jobs, 8, async ({ t, name }) => {
  const v = await judge(name, t.turns.at(-2).content, t.turns.at(-1).content);
  return { id: t.id, type: t.type, name, result: v.result, critique: v.critique, reply: t.turns.at(-1).content };
});

for (const name of Object.keys(JUDGES)) {
  const rs = results.filter((r) => r.name === name && !r.error);
  console.log(`${name.padEnd(10)} ${rs.filter((r) => r.result === "Pass").length}/${rs.length} pass`);
}
console.log(`${results.filter((r) => r.error).length} errors`);
writeFileSync(new URL(`./data/judged-${label}.json`, import.meta.url), JSON.stringify(results, null, 2));
