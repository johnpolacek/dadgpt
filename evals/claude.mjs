import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Calls the local Claude CLI login, so evals don't spend API credits
export function claude(prompt, { system, model = "claude-haiku-5-5", resume } = {}) {
  const args = ["-p", "--model", model, "--setting-sources", "", "--output-format", "json"];
  if (system) args.push("--system-prompt", system);
  if (resume) args.push("--resume", resume);

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd: process.env.TMPDIR || "/tmp" });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      try {
        const json = JSON.parse(out);
        resolve({ text: json.result.trim(), sessionId: json.session_id, stopReason: json.stop_reason });
      } catch {
        reject(new Error(`claude exited ${code}: ${err || out}`));
      }
    });
    child.stdin.end(prompt);
  });
}

// Runs fn over items with a fixed number of workers
export async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i).catch((error) => ({ error: String(error) }));
      }
    }),
  );
  return results;
}

// Calls a GPT model through the local Codex login, with the system prompt swapped in as its instructions
export function codex(prompt, { system, model = "gpt-6-luna", resume } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "dadgpt-codex-"));
  const instructions = join(dir, "instructions.txt");
  const out = join(dir, "out.txt");
  writeFileSync(instructions, system || "");
  const flags = ["-m", model, "--skip-git-repo-check", "-c", "sandbox_mode=read-only", "--json", "-o", out, "-c", `model_instructions_file=${instructions}`];
  const args = resume ? ["exec", "resume", ...flags, resume, "-"] : ["exec", ...flags, "-"];

  return new Promise((resolve, reject) => {
    const child = spawn("codex", args, { cwd: dir });
    let events = "";
    let err = "";
    child.stdout.on("data", (d) => (events += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      try {
        const started = events.split("\n").map((l) => { try { return JSON.parse(l); } catch { return {}; } }).find((e) => e.thread_id);
        resolve({ text: readFileSync(out, "utf8").trim(), sessionId: resume || started.thread_id });
      } catch {
        reject(new Error(`codex exited ${code}: ${err.slice(-500)}`));
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
    child.stdin.end(prompt);
  });
}
