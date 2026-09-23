/**
 * Einstiegspunkt der Web-Fassung.
 *
 * Beim Start wird der Katalog geprueft: Beanstandungen landen in der Konsole und als sichtbarer
 * Hinweis in der Oberflaeche - eine ungueltige Lektion soll nicht still erscheinen.
 */
import { catalogue } from "./model/lessons/index.js";
import { experimentIds } from "./experiment/registry.js";
import { formatIssues, validateCatalogue } from "./model/validate.js";
import { starteShell, type ShellElemente } from "./ui/shell.js";

function hole(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Element #${id} fehlt in der Seite`);
  return node;
}

function beiBedarf<T extends HTMLElement>(id: string, typ: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof typ)) throw new Error(`Element #${id} fehlt oder hat den falschen Typ`);
  return node;
}

const pruefung = validateCatalogue(catalogue, "app/src/model/lessons/index.ts", experimentIds());
if (!pruefung.ok) {
  console.error(
    `MLapp: ${pruefung.issues.length} Beanstandungen im Katalog\n${formatIssues(pruefung.issues)}`,
  );
  const hinweis = document.getElementById("ladehinweis");
  if (hinweis) {
    hinweis.textContent = `Der Lektionskatalog hat ${pruefung.issues.length} Beanstandungen. Einzelheiten in der Konsole.`;
  }
}

try {
  const elemente: ShellElemente = {
    inhalt: hole("inhalt"),
    kopfzeile: hole("kopfzeile"),
    zurueckKnopf: beiBedarf("zurueck", HTMLButtonElement),
    einstellungenKnopf: beiBedarf("einstellungen-knopf", HTMLButtonElement),
    einstellungenDialog: beiBedarf("einstellungen", HTMLDialogElement),
    einstellungenInhalt: hole("einstellungen-inhalt"),
    vollbild: hole("vollbild"),
    vollbildTitel: hole("vollbild-titel"),
    vollbildInhalt: hole("vollbild-inhalt"),
    vollbildZu: beiBedarf("vollbild-zu", HTMLButtonElement),
    vorleser: hole("vorleser"),
    vorleserText: hole("vorleser-text"),
    vorleserZurueck: beiBedarf("vz-zurueck", HTMLButtonElement),
    vorleserSpielen: beiBedarf("vz-spielen", HTMLButtonElement),
    vorleserVor: beiBedarf("vz-vor", HTMLButtonElement),
    vorleserTempo: beiBedarf("vz-tempo", HTMLInputElement),
  };
  hole("ladehinweis").remove();
  starteShell(elemente);
  installiereSelbstauskunft();
} catch (fehler) {
  const hinweis = document.getElementById("ladehinweis");
  if (hinweis) hinweis.textContent = `Die App konnte nicht starten: ${String(fehler)}`;
  console.error(fehler);
}

/**
 * Selbstauskunft fuer die Oberflaechenpruefung: schreibt die tatsaechliche Fensterbreite und die
 * Breite des Inhalts in ein verstecktes Element. Damit laesst sich "kein waagerechtes Scrollen"
 * messen, statt es zu behaupten - die Pruefung liest die Werte aus dem DOM.
 */
function installiereSelbstauskunft(): void {
  const anzeige = document.createElement("p");
  anzeige.id = "selbstauskunft";
  anzeige.hidden = true;
  document.body.append(anzeige);

  const messen = (): void => {
    const breite = window.innerWidth;
    const scrollbreite = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const engeBereiche: string[] = [];
    for (const node of document.querySelectorAll<HTMLElement>(
      ".abschnitt, .werte, .experiment, .formel",
    )) {
      if (node.scrollWidth > node.clientWidth + 1) engeBereiche.push(`${node.className}`);
    }
    anzeige.dataset.breite = String(breite);
    anzeige.dataset.scrollbreite = String(scrollbreite);
    anzeige.dataset.ueberlauf = engeBereiche.join("|");
    anzeige.dataset.abschnitte = String(document.querySelectorAll(".abschnitt").length);
    anzeige.dataset.regler = String(document.querySelectorAll('input[type="range"]').length);
    anzeige.dataset.zeichnung = String(document.querySelectorAll("canvas").length);
    anzeige.dataset.zweispaltig = getComputedStyle(
      document.querySelector(".app-layout") ?? document.body,
    ).display;
    anzeige.dataset.zeichnungfarben = String(zaehleFarbenInZeichnung());
    // Nur die Formelfelder pruefen: Codebloecke enthalten bewusst Rueckstriche.
    const formelText = [...document.querySelectorAll(".formel")]
      .map((n) => n.textContent ?? "")
      .join(" ");
    anzeige.dataset.formelroh = String(formelText.includes("\\"));
  };

  /**
   * Zaehlt verschiedene Farben in der ersten Zeichenflaeche. Eine leere Flaeche liefert 1
   * (nur Hintergrund) - damit ist "die Zeichnung hat Inhalt" messbar und nicht nur behauptet.
   */
  const zaehleFarbenInZeichnung = (): number => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement) || canvas.width === 0) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const farben = new Set<string>();
    const schrittX = Math.max(1, Math.floor(canvas.width / 24));
    const schrittY = Math.max(1, Math.floor(canvas.height / 24));
    for (let x = 0; x < canvas.width; x += schrittX) {
      for (let y = 0; y < canvas.height; y += schrittY) {
        const daten = ctx.getImageData(x, y, 1, 1).data;
        farben.add(`${daten[0]},${daten[1]},${daten[2]},${daten[3]}`);
      }
    }
    return farben.size;
  };

  messen();
  window.addEventListener("resize", messen);
  window.setTimeout(messen, 400);
  // Nach jedem Ansichtswechsel erneut messen (Wege sind Hash-Adressen).
  window.addEventListener("hashchange", () => window.setTimeout(messen, 400));
}
