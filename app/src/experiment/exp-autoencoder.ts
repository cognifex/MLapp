/**
 * LEK-22 Autoencoder: ein Bild durch eine Engstelle kodieren und wieder aufbauen.
 *
 * Rechenkern: Kodierer und Dekodierer bestehen aus festen Zahlen (als wären sie gelernt).
 * Der Kodierer bildet das 4x4-Bild auf seine Skalarprodukte mit den ersten k Bildmustern ab,
 * der Dekodierer setzt das Bild aus genau diesen Mustern wieder zusammen. Zahlen und Zeichnung
 * entstehen aus derselben Projektion - nichts davon ist von Hand gesetzt.
 */
import type { Calculated, GridCell } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Kantenlänge des Bildes. */
export const SEITENLAENGE = 4;

/** Das Eingabebild, zeilenweise: 16 Werte zwischen 0 (schwarz) und 1 (weiß). Es zeigt ein "L". */
export const BILD: number[] = [
  0.9, 0.2, 0.0, 0.0, 0.9, 0.2, 0.0, 0.0, 0.9, 0.2, 0.2, 0.2, 0.9, 0.9, 0.9, 0.9,
];

/** Vier Grundmuster einer Zeile, jedes von der Länge eins (Hadamard-Basis). */
const GRUNDMUSTER: number[][] = [
  [0.5, 0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5, 0.5],
];

/**
 * Reihenfolge der 16 Bildmuster: erst grob, dann fein. Die ersten Muster tragen die grobe
 * Helligkeitsverteilung, die späteren die feinen Kanten.
 */
export const MUSTER_REIHENFOLGE: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [0, 2],
  [1, 1],
  [2, 0],
  [0, 3],
  [1, 2],
  [2, 1],
  [3, 0],
  [1, 3],
  [2, 2],
  [3, 1],
  [2, 3],
  [3, 2],
  [3, 3],
];

/** Ein Bildmuster: das Produkt zweier Grundmuster, flach als 4x4-Feld. */
function musterAus(a: number, b: number): number[] {
  const links = GRUNDMUSTER[a] ?? [];
  const rechts = GRUNDMUSTER[b] ?? [];
  const out: number[] = [];
  for (let row = 0; row < SEITENLAENGE; row += 1) {
    for (let col = 0; col < SEITENLAENGE; col += 1) {
      out.push((links[row] ?? 0) * (rechts[col] ?? 0));
    }
  }
  return out;
}

/** Alle 16 Bildmuster in der Reihenfolge des Engpasses. */
export const MUSTER: number[][] = MUSTER_REIHENFOLGE.map(([a, b]) => musterAus(a, b));

export function skalarprodukt(a: number[], b: number[]): number {
  let summe = 0;
  const laenge = Math.min(a.length, b.length);
  for (let i = 0; i < laenge; i += 1) summe += (a[i] ?? 0) * (b[i] ?? 0);
  return summe;
}

/** Kodierer: der Code sind die Skalarprodukte des Bildes mit den ersten k Mustern. */
export function kodiere(bild: number[], engpass: number): number[] {
  return MUSTER.slice(0, engpass).map((muster) => skalarprodukt(bild, muster));
}

/** Dekodierer: das Bild ist die Summe der ersten k Muster, jedes mit seinem Codewert gewichtet. */
export function rekonstruiere(bild: number[], engpass: number): number[] {
  const code = kodiere(bild, engpass);
  const out = new Array<number>(SEITENLAENGE * SEITENLAENGE).fill(0);
  code.forEach((wert, i) => {
    const muster = MUSTER[i] ?? [];
    for (let j = 0; j < out.length; j += 1) out[j] = (out[j] ?? 0) + wert * (muster[j] ?? 0);
  });
  return out;
}

/** Mittlerer quadratischer Fehler zwischen Eingabe und Rekonstruktion. */
export function mittlererFehler(bild: number[], engpass: number): number {
  const rekonstruktion = rekonstruiere(bild, engpass);
  let summe = 0;
  for (let i = 0; i < bild.length; i += 1) {
    summe += ((bild[i] ?? 0) - (rekonstruktion[i] ?? 0)) ** 2;
  }
  return summe / bild.length;
}

/** Größter Einzelfehler eines Bildpunktes. */
export function groessterFehler(bild: number[], engpass: number): number {
  const rekonstruktion = rekonstruiere(bild, engpass);
  let max = 0;
  for (let i = 0; i < bild.length; i += 1) {
    max = Math.max(max, Math.abs((bild[i] ?? 0) - (rekonstruktion[i] ?? 0)));
  }
  return max;
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

/** Die Engstelle als ganze Zahl zwischen 1 und 16. */
function engpass(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "engpass", 4));
  return Math.min(MUSTER.length, Math.max(1, roh));
}

function ansicht(state: ExperimentState): "eingabe" | "rekonstruktion" {
  const v = state["ansicht"];
  return v === "rekonstruktion" ? "rekonstruktion" : "eingabe";
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export function raster(bild: number[]): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < SEITENLAENGE; row += 1) {
    for (let col = 0; col < SEITENLAENGE; col += 1) {
      cells.push({ row, col, value: bild[row * SEITENLAENGE + col] ?? 0 });
    }
  }
  return cells;
}

registerRules([
  {
    name: "engstelleVerengt",
    explain: (e) =>
      `Die Engstelle ist enger geworden. Der mittlere Fehler liegt jetzt bei ${formatValue(e.value ?? 0, 4)}.`,
  },
  {
    name: "engstelleErweitert",
    explain: (e) =>
      `Die Engstelle ist weiter geworden. Der mittlere Fehler liegt jetzt bei ${formatValue(e.value ?? 0, 4)}.`,
  },
]);

export const autoencoder: Experiment = {
  id: "exp-autoencoder",
  title: "Bild durch die Engstelle",
  learningGoal:
    "Verstehen, was eine enge Zwischenschicht von einem Bild behält und was verloren geht",
  instructions:
    "Stelle die Zahl der gespeicherten Werte ein und schalte zwischen Eingabe und Rekonstruktion um. Beobachte, wie der mittlere Fehler mit der Engstelle wächst.",
  spokenDescription:
    "Ein kleines Bild aus vier mal vier Grauwerten, die Form eines L. Ein Regler bestimmt, wie viele Zahlen die Engstelle speichert. " +
    "Eine Auswahl zeigt entweder das Eingabebild oder das Bild, das aus den gespeicherten Zahlen wieder aufgebaut wurde. " +
    "Daneben stehen der mittlere Fehler und der größte Einzelfehler.",
  controls: [
    {
      kind: "select",
      id: "ansicht",
      label: "Ansicht",
      options: [
        { value: "eingabe", label: "Eingabe" },
        { value: "rekonstruktion", label: "Rekonstruktion" },
      ],
      initial: "eingabe",
    },
    {
      kind: "slider",
      id: "engpass",
      label: "Engstelle: gespeicherte Zahlen",
      min: 1,
      max: 16,
      step: 1,
      initial: 4,
    },
  ],
  initialState: { ansicht: "eingabe", engpass: 4 },
  update(state, action) {
    if (action.type === "reset") return { ansicht: "eingabe", engpass: 4 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const k = engpass(state);
    const gezeigt = ansicht(state);
    const rekonstruktion = rekonstruiere(BILD, k);
    const fehler = mittlererFehler(BILD, k);
    const groesster = groessterFehler(BILD, k);

    const urteil =
      fehler < 1e-12
        ? "Die Engstelle lässt alle Muster durch: die Rekonstruktion ist das Eingabebild selbst."
        : fehler < 0.05
          ? "Die groben Muster sind erhalten, nur die feinen Einzelheiten fehlen."
          : fehler < 0.12
            ? "Die Form ist noch erkennbar, aber viele Helligkeiten sind verschoben."
            : "Nur die grobe Helligkeit ist geblieben; die Form des L ist verloren.";

    return {
      values: [
        { label: "Mittlerer Fehler", value: fehler, digits: 4 },
        { label: "Größter Einzelfehler", value: groesster, digits: 4 },
        { label: "Gespeicherte Zahlen", value: k, digits: 0 },
        { label: "Werte im Bild", value: BILD.length, digits: 0 },
      ],
      drawing: {
        kind: "grid",
        cols: SEITENLAENGE,
        rows: SEITENLAENGE,
        cells: raster(gezeigt === "eingabe" ? BILD : rekonstruktion),
        xRange: [0, SEITENLAENGE],
        yRange: [0, SEITENLAENGE],
        style: "grau",
      },
      sentences: [
        `Das Bild hat ${BILD.length} Werte; durch die Engstelle gehen ${k} davon.`,
        `Gezeigt ist die ${gezeigt === "eingabe" ? "Eingabe" : "Rekonstruktion"}.`,
        `Der mittlere Fehler beträgt ${format(fehler, 4)}, der größte Einzelfehler ${format(groesster, 4)}.`,
        urteil,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = engpass(before);
    const nachher = engpass(after);
    if (vorher === nachher) return [];
    const fehler = mittlererFehler(BILD, nachher);
    return nachher < vorher
      ? [{ name: "engstelleVerengt", severity: "notable", value: fehler }]
      : [{ name: "engstelleErweitert", severity: "info", value: fehler }];
  },
};
