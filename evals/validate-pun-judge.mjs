// Measures the clean_pun judge against the user's own pun labels, minus the ones used as examples
import { readFileSync } from "node:fs";
import { pool } from "./claude.mjs";
import { judge } from "./judges.mjs";

const FEW_SHOT = new Set([57, 2, 70, 116, 14, 1]);
const labels = JSON.parse(readFileSync(new URL("./data/user-pun-labels.json", import.meta.url)));
const rows = Object.entries(labels)
  .filter(([n, l]) => !FEW_SHOT.has(+n) && ["good", "bad"].includes(l.label))
  .map(([n, l]) => ({ n: +n, ...l, human: l.label === "good" ? "Pass" : "Fail" }));

const results = await pool(rows, 8, async (r) => ({ ...r, judge: (await judge("clean_pun", r.user, r.reply)).result }));
const ok = results.filter((x) => !x.error);
const tp = ok.filter((x) => x.human === "Pass" && x.judge === "Pass").length, p = ok.filter((x) => x.human === "Pass").length;
const tn = ok.filter((x) => x.human === "Fail" && x.judge === "Fail").length, f = ok.filter((x) => x.human === "Fail").length;
console.log(`clean_pun vs your labels: TPR ${tp}/${p}  TNR ${tn}/${f}  agreement ${tp + tn}/${ok.length}`);
for (const x of ok.filter((x) => x.human !== x.judge)) console.log(`  #${x.n} you ${x.human}, judge ${x.judge}: ${x.reply.slice(0, 100)}`);
