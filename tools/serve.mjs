/**
 * Kleiner statischer Server fuer die Entwicklung und die Pruefungen mit dem Kopflosen Chromium.
 * Ohne Abhaengigkeit, damit er auf dem Geraet ohne Netzzugriff laeuft.
 *
 * Aufruf: node tools/serve.mjs [verzeichnis] [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? 8777);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
]);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("verboten");
      return;
    }
    const info = await stat(filePath).catch(() => null);
    if (info?.isDirectory()) filePath = path.join(filePath, "index.html");
    const body = await readFile(filePath).catch(() => null);
    if (!body) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("nicht gefunden");
      return;
    }
    res.writeHead(200, {
      "content-type": types.get(path.extname(filePath)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(String(error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`MLapp laeuft auf http://127.0.0.1:${port}/ (Verzeichnis: ${root})`);
});
