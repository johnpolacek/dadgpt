// Measures each judge against hand labels. Usage: node evals/validate-judges.mjs [dev|test]
import { readFileSync, writeFileSync } from "node:fs";
import { pool } from "./claude.mjs";
import { JUDGES, judge } from "./judges.mjs";

const split = process.argv[2] || "dev";
const only = process.argv[3];
const labels = JSON.parse(readFileSync(new URL("./data/labels.json", import.meta.url))).filter((r) => r.split === split);

const names = only ? [only] : Object.keys(JUDGES);
const jobs = names.flatMap((name) => labels.filter((r) => r.labels[name]).map((r) => ({ name, r })));
const results = await pool(jobs, 8, async ({ name, r }) => {
  const verdict = await judge(name, r.user, r.reply);
  return { name, n: r.n, human: r.labels[name], judge: verdict.result, critique: verdict.critique, reply: r.reply };
});

for (const name of names) {
  const rs = results.filter((x) => x.name === name && !x.error);
  const tp = rs.filter((x) => x.human === "Pass" && x.judge === "Pass").length;
  const tn = rs.filter((x) => x.human === "Fail" && x.judge === "Fail").length;
  const p = rs.filter((x) => x.human === "Pass").length;
  const f = rs.filter((x) => x.human === "Fail").length;
  console.log(`${name}: TPR ${((tp / p) * 100).toFixed(0)}% (${tp}/${p})  TNR ${((tn / f) * 100).toFixed(0)}% (${tn}/${f})`);
  for (const x of rs.filter((x) => x.human !== x.judge))
    console.log(`  #${x.n} human ${x.human}, judge ${x.judge}: ${x.reply.slice(0, 90)}\n     ${x.critique}`);
}
console.log(`${results.filter((x) => x.error).length} errors`);
writeFileSync(new URL(`./data/judge-validation-${split}${only ? `-${only}` : ""}.json`, import.meta.url), JSON.stringify(results, null, 2));
