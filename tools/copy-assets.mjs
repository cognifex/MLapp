/**
 * Kopiert die nicht kompilierten Bestandteile in das Bauverzeichnis.
 *
 * Die Seite liegt bewusst unter app/index.html und laedt die Fassung aus dist/ mit absoluten
 * Pfaden (/app/src/main.js). Damit braucht der Bau keine Pfadumschreibung und die Android-Huelle
 * kann denselben Baum unveraendert als Anlagenverzeichnis ausliefern.
 */
import { cp, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

async function copyDir(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dst);
    else await copyFile(src, dst);
  }
}

async function main() {
  await mkdir(dist, { recursive: true });
  await copyFile(path.join(root, "app", "index.html"), path.join(dist, "index.html"));
  await copyDir(path.join(root, "app", "styles"), path.join(dist, "app", "styles"));
  if (existsSync(path.join(root, "app", "assets"))) {
    await copyDir(path.join(root, "app", "assets"), path.join(dist, "app", "assets"));
  }
  await cp(path.join(root, "SPEZIFIKATION.md"), path.join(dist, "SPEZIFIKATION.md"), {
    force: true,
  }).catch(() => {});
  console.log(
    "Anlagen kopiert: index.html, app/styles" +
      (existsSync(path.join(root, "app", "assets")) ? ", app/assets" : ""),
  );
}

await main();
