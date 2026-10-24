// Code checks for Dad replies. Each returns null on pass, or a reason string on fail.
import { readFileSync } from "node:fs";

// "I'd tell you a joke about X, but..." is a classic dad joke format, not a dodge
const jokeFormat = (s) => s.replace(/I'?d tell you an? [^.!?,]*\bjoke\b[^.!?]*\bbut\b/gi, "");

const words = (s) => s.trim().split(/\s+/).filter(Boolean);

export const CHECKS = {
  brevity: (s) => (words(s).length > 25 ? `${words(s).length} words` : null),
  markup: (s) => (/[*_#`]|\p{Extended_Pictographic}/u.test(s) ? "markdown or emoji" : null),
  quoted_pun: (s) => {
    const m = s.match(/"[^"]{1,30}"/);
    return m ? `quotes around ${m[0]}` : null;
  },
  kiddo: (s) => (/\bkid(do)?\b/i.test(s) ? "says kiddo" : null),
  dodge: (s) => {
    const m = jokeFormat(s).match(
      /I'?d (tell|answer|explain|recommend|give)[^.!?]*\bbut\b|only (here|good) for|stick(ing)? to puns|keep it light|I'?m (just )?a dad|can only (scoop|give|do)/i,
    );
    return m ? `dodge phrase "${m[0]}"` : null;
  },
  speaker_label: (s) => (/^\s*Dad\s*:/i.test(s) ? "starts with a Dad: label" : null),
  self_reference: (s) => {
    const m = jokeFormat(s).match(/\b(dad )?jokes?\b|\bpuns?\b|\bpunchlines?\b/i);
    return m ? `mentions "${m[0]}"` : null;
  },
};

// Same opening words twice in one chat
export function repeatedOpeners(replies) {
  const seen = new Set();
  return replies.flatMap((s, i) => {
    const key = words(s).slice(0, 3).join(" ").toLowerCase().replace(/[^a-z ]/g, "");
    if (seen.has(key)) return [`turn ${i + 1} reuses opener "${key}"`];
    seen.add(key);
    return [];
  });
}

// Same reply text showing up in several chats means a canned line
const normalize = (s) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();
export function cannedLines(traces, min = 3) {
  const counts = new Map();
  for (const t of traces.filter((t) => !t.error))
    for (const m of t.turns.filter((m) => m.role === "assistant")) {
      const key = normalize(m.content).split(" ").slice(0, 6).join(" ");
      counts.set(key, (counts.get(key) || new Set()).add(t.id));
    }
  return [...counts].filter(([, ids]) => ids.size >= min).map(([line, ids]) => ({ line, chats: ids.size }));
}

export function score(traces) {
  const results = { replies: 0, chats: 0, fails: Object.fromEntries(Object.keys(CHECKS).map((k) => [k, []])) };
  results.fails.repeated_opener = [];
  for (const t of traces.filter((t) => !t.error)) {
    results.chats++;
    const replies = t.turns.filter((m) => m.role === "assistant").map((m) => m.content);
    replies.forEach((s, i) => {
      results.replies++;
      for (const [name, check] of Object.entries(CHECKS)) {
        const reason = check(s);
        if (reason) results.fails[name].push({ id: t.id, turn: i + 1, reason, reply: s });
      }
    });
    for (const reason of repeatedOpeners(replies)) results.fails.repeated_opener.push({ id: t.id, reason });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const file of process.argv.slice(2)) {
    const r = score(JSON.parse(readFileSync(file)));
    console.log(`\n${file}: ${r.chats} chats, ${r.replies} replies`);
    for (const [name, fails] of Object.entries(r.fails)) {
      const total = name === "repeated_opener" ? r.chats : r.replies;
      console.log(`  ${name.padEnd(16)} ${String(fails.length).padStart(3)} fail  ${((1 - fails.length / total) * 100).toFixed(0)}% pass`);
    }
    for (const c of cannedLines(JSON.parse(readFileSync(file)))) console.log(`  canned line in ${c.chats} chats: "${c.line}..."`);
  }
}
