// Tiny labeling server. Usage: node evals/review/server.mjs [pun|ab], then open http://localhost:4173
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const mode = process.argv[2] || "pun";
const page = new URL(mode === "ab" ? "./ab.html" : "./index.html", import.meta.url);
const itemsFile = new URL(mode === "ab" ? "../data/ab-items.json" : "../data/pun-review-items.json", import.meta.url);
const labelsFile = new URL(mode === "ab" ? "../data/user-ab-labels.json" : "../data/user-pun-labels.json", import.meta.url);
const PORT = 4173;

const send = (res, type, body) => res.writeHead(200, { "Content-Type": type }).end(body);

createServer((req, res) => {
  if (req.url === "/") return send(res, "text/html", readFileSync(page));
  if (req.url === "/api/items") return send(res, "application/json", readFileSync(itemsFile));
  if (req.url === "/api/labels" && req.method === "GET")
    return send(res, "application/json", existsSync(labelsFile) ? readFileSync(labelsFile) : "{}");
  if (req.url === "/api/labels" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      writeFileSync(labelsFile, JSON.stringify(JSON.parse(body), null, 2));
      send(res, "application/json", "{}");
    });
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`${mode} review at http://localhost:${PORT}`));
