/**
 * LEK-10 Gradient Descent: Lernrate und Startpunkt einstellen und den Abstieg verfolgen.
 *
 * Rechenkern: Verlustfläche L(w, b) = (w - 0,8)² + 1,6 · (b + 0,6)² mit geschlossenem Gradienten.
 * Der Pfad entsteht Schritt für Schritt aus genau dieser Vorschrift, die Farbfläche zeigt
 * dieselbe Funktion. Kein Zufall, kein Näherungsverfahren: gleicher Zustand, gleiche Ausgabe.
 *
 * Stabilität: der Schritt in b-Richtung wird mit dem Faktor 1 - 3,2 · Lernrate multipliziert.
 * Für eine Lernrate ab 2 / 3,2 = 0,625 wechselt der Faktor das Vorzeichen und wächst über eins
 * hinaus - der Verlust kann dann zunehmen.
 */
import type { Calculated, GridCell, Mark, Vector } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type ExperimentState, type Point } from "./contract.js";

/** Zeichenbereich der Fläche; x und y sind hier beide Parameter einer Verlustfunktion. */
export const RANGE = 2.5;
export const X_RANGE: [number, number] = [-RANGE, RANGE];
export const Y_RANGE: [number, number] = [-RANGE, RANGE];
/** Tiefpunkt der Mulde. */
export const MINIMUM: Point = { x: 0.8, y: -0.6 };
/** Startpunkt der Vorgabe. */
export const START: Point = { x: -1.5, y: -1.2 };
/** Lernrate, ab der die Schritte in b-Richtung über das Ziel hinausschießen. */
export const LERNGRENZE = 2 / 3.2;
/** Schritte, nach denen "bis zur Ruhe" aufgibt. */
export const HORIZONT = 200;
/** Gradientenlänge, ab der der Abstieg als ruhend gilt. */
export const RUHE = 0.01;

/** Verlust an einem Punkt der Fläche. */
export function verlust(p: Point): number {
  const dw = p.x - MINIMUM.x;
  const db = p.y - MINIMUM.y;
  return dw * dw + 1.6 * (db * db);
}

/** Gradient der Verlustfunktion: Richtung des steilsten Anstiegs. */
export function gradient(p: Point): Point {
  return { x: 2 * (p.x - MINIMUM.x), y: 3.2 * (p.y - MINIMUM.y) };
}

/** Ein Abstiegsschritt: einen Punkt um Lernrate mal Gradient verschieben. */
export function schritt(p: Point, lernrate: number): Point {
  const g = gradient(p);
  return { x: p.x - lernrate * g.x, y: p.y - lernrate * g.y };
}

/** Der Pfad: Startpunkt plus die Punkte nach 1 bis n Schritten. */
export function pfad(start: Point, lernrate: number, schritte: number): Point[] {
  const punkte: Point[] = [{ x: start.x, y: start.y }];
  let aktuell = start;
  for (let i = 0; i < schritte; i += 1) {
    aktuell = schritt(aktuell, lernrate);
    punkte.push(aktuell);
  }
  return punkte;
}

/** Zahl der Schritte, bis der Gradient die Ruheschwelle unterschreitet. */
export function bisZurRuhe(start: Point, lernrate: number): { schritte: number; ruhig: boolean } {
  let aktuell = start;
  for (let i = 1; i <= HORIZONT; i += 1) {
    const g = gradient(aktuell);
    if (Math.hypot(g.x, g.y) < RUHE) return { schritte: i - 1, ruhig: true };
    aktuell = schritt(aktuell, lernrate);
  }
  return { schritte: HORIZONT, ruhig: false };
}

/** Farbfläche: der Wert jeder Zelle ist der Verlust in der Zellmitte. */
export function verlustzellen(cols = 21, rows = 21): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = -RANGE + (2 * RANGE * (col + 0.5)) / cols;
      const y = RANGE - (2 * RANGE * (row + 0.5)) / rows;
      cells.push({ row, col, value: verlust({ x, y }) });
    }
  }
  return cells;
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function startpunkt(state: ExperimentState): Point {
  const v = state["start"];
  return isPoint(v) ? v : START;
}

function formatiere(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "learnRateTooLarge",
    explain: (e) =>
      `Die Lernrate ${formatValue(e.value ?? 0)} liegt über der Stabilitätsgrenze ` +
      `${formatValue(LERNGRENZE, 3)}. Die Schritte schießen über das Minimum hinaus, ` +
      "der Verlust kann von Schritt zu Schritt wachsen.",
  },
  {
    name: "learnRateStable",
    explain: (e) =>
      `Die Lernrate ${formatValue(e.value ?? 0)} liegt unter der Stabilitätsgrenze ` +
      `${formatValue(LERNGRENZE, 3)}: jeder Schritt verkleinert den Verlust.`,
  },
]);

export const gradientDescent: Experiment = {
  id: "exp-gradient-descent",
  title: "Abstieg auf der Verlustfläche",
  learningGoal: "Lernrate und Startpunkt so wählen, dass der Abstieg zum Minimum führt",
  instructions:
    "Ziehe den Startpunkt auf die Fläche und stelle die Lernrate ein. Der Pfad zeigt die Punkte nach jedem Schritt; die Zahl der Schritte lässt sich im Regler schritte ändern.",
  spokenDescription:
    "Eine eingefärbte Verlustfläche: dunkel bedeutet hoher Verlust, der Tiefpunkt liegt rechts unten. " +
    "Ein Startpunkt lässt sich mit dem Finger verschieben. Von dort läuft ein Pfad mit Pfeilen bergab, " +
    "ein Punkt je Schritt. Der Regler Lernrate bestimmt die Länge der Schritte, der Regler schritte ihre Anzahl.",
  controls: [
    {
      kind: "point",
      id: "start",
      label: "Startpunkt auf der Fläche",
      bounds: { minX: -2.4, maxX: 2.4, minY: -2.4, maxY: 2.4 },
      initial: { x: START.x, y: START.y },
    },
    {
      kind: "slider",
      id: "lernrate",
      label: "Lernrate",
      min: 0.05,
      max: 1,
      step: 0.05,
      initial: 0.2,
    },
    { kind: "slider", id: "schritte", label: "Schritte", min: 1, max: 12, step: 1, initial: 6 },
  ],
  initialState: { start: { x: START.x, y: START.y }, lernrate: 0.2, schritte: 6 },
  update(state, action) {
    if (action.type === "reset") {
      return { start: { x: START.x, y: START.y }, lernrate: 0.2, schritte: 6 };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const start = startpunkt(state);
    const lernrate = zahl(state, "lernrate", 0.2);
    const schritte = Math.round(zahl(state, "schritte", 6));
    const punkte = pfad(start, lernrate, schritte);
    const letzter = punkte[punkte.length - 1]!;
    const startverlust = verlust(start);
    const endverlust = verlust(letzter);
    const gEnde = gradient(letzter);
    const laengeEnde = Math.hypot(gEnde.x, gEnde.y);
    const abstand = Math.hypot(letzter.x - MINIMUM.x, letzter.y - MINIMUM.y);
    const ruhe = bisZurRuhe(start, lernrate);

    const points: Mark[] = punkte.map((p, i) => ({
      label: `${i}`,
      x: p.x,
      y: p.y,
      color: i === 0 ? "#1f2328" : "#d93025",
    }));
    const vectors: Vector[] = punkte.slice(0, -1).map((p, i) => ({
      label: i === 0 ? "Schritt" : "",
      from: [p.x, p.y],
      to: [punkte[i + 1]!.x, punkte[i + 1]!.y],
      color: "#188038",
    }));

    return {
      values: [
        { label: "Startverlust", value: startverlust, digits: 4 },
        { label: "Verlust nach n Schritten", value: endverlust, digits: 6 },
        { label: "Länge des Gradienten am Ende", value: laengeEnde, digits: 4 },
        { label: "Schritte bis zur Ruhe", value: ruhe.schritte, digits: 0 },
        { label: "Abstand zum Minimum", value: abstand, digits: 4 },
      ],
      drawing: {
        kind: "grid",
        cols: 21,
        rows: 21,
        cells: verlustzellen(),
        xRange: X_RANGE,
        yRange: Y_RANGE,
        style: "verlust",
        points,
        vectors,
      },
      sentences: [
        `Der Startpunkt hat den Verlust ${formatiere(startverlust, 4)}; ` +
          `der letzte gezeichnete Punkt kommt auf ${formatiere(endverlust, 6)}.`,
        ruhe.ruhig
          ? `Mit dieser Lernrate steht der Abstieg nach ${ruhe.schritte} Schritten still.`
          : "Mit dieser Lernrate kommt der Abstieg nicht zur Ruhe: der Verlust wächst von Schritt zu Schritt.",
        `Der letzte Punkt liegt ${formatiere(abstand, 4)} vom Tiefpunkt entfernt; ` +
          `der Gradient misst dort ${formatiere(laengeEnde, 4)}.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const vorher = zahl(before, "lernrate", 0.2);
    const nachher = zahl(after, "lernrate", 0.2);
    if (nachher >= LERNGRENZE && vorher < LERNGRENZE) {
      events.push({ name: "learnRateTooLarge", severity: "warning", value: nachher });
    }
    if (nachher < LERNGRENZE && vorher >= LERNGRENZE) {
      events.push({ name: "learnRateStable", severity: "info", value: nachher });
    }

    const schritte = Math.round(zahl(after, "schritte", 6));
    const startNach = startpunkt(after);
    const startVor = startpunkt(before);
    const letzterNach = pfad(startNach, nachher, schritte)[schritte]!;
    const letzterVor = pfad(startVor, vorher, schritte)[schritte]!;
    const verlustNach = verlust(letzterNach);
    const verlustVor = verlust(letzterVor);
    if (verlustNach < verlustVor * (1 - 1e-9)) {
      events.push({ name: "lossDecreased", severity: "info", value: verlustNach });
    } else if (verlustNach > verlustVor * (1 + 1e-9)) {
      events.push({ name: "lossIncreased", severity: "info", value: verlustNach });
    }
    if (verlustNach > verlust(startNach)) {
      events.push({ name: "diverging", severity: "warning", value: verlustNach });
    }
    return events;
  },
};
