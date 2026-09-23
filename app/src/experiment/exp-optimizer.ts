/**
 * LEK-19 Optimizer: SGD, Momentum und Adam auf derselben Verlustfläche.
 *
 * Rechenkern: die Verlustfläche kommt aus exp-gradient (Mulde mit dem Minimum bei x = 0,8 und
 * y = -0,6). Der Abstiegspfad entsteht aus derselben Gradientenfunktion, die auch die Pfeile der
 * Lektion 5 liefert - drei Verfahren, ein Startpunkt, eine Lernrate.
 */
import type { Calculated, Mark, Vector } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type ExperimentState, type Point } from "./contract.js";
import { gradientAt, lossAt, lossGrid, SURFACES } from "./exp-gradient.js";

/** Alle drei Verfahren laufen auf derselben Fläche. */
const FLAECHE = "mulde";
const REICHWEITE = SURFACES[FLAECHE].range;

/** Feste Verfahrenskonstanten; sichtbar als Text in der Lektion, nicht als Regler. */
const MOMENTUM = 0.9;
const ADAM_BETA1 = 0.9;
const ADAM_BETA2 = 0.999;
const ADAM_EPSILON = 1e-8;

const START: Point = { x: -2, y: -1.8 };

export type VerfahrenKey = "sgd" | "momentum" | "adam";

export const VERFAHREN: { value: VerfahrenKey; label: string }[] = [
  { value: "sgd", label: "SGD (steiler Abstieg)" },
  { value: "momentum", label: "Momentum" },
  { value: "adam", label: "Adam" },
];

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function verfahrenVon(state: ExperimentState): VerfahrenKey {
  const v = state["verfahren"];
  return v === "momentum" || v === "adam" ? v : "sgd";
}

function startPunkt(state: ExperimentState): Point {
  const v = state["start"];
  return isPoint(v) ? v : START;
}

function format(n: number, digits = 4): string {
  return Number.isFinite(n) ? n.toFixed(digits).replace(".", ",") : "nicht definiert";
}

/**
 * Der Abstiegspfad. Die Verfahren unterscheiden sich nur darin, wie sie den Gradienten in einen
 * Schritt umrechnen:
 *   SGD       p' = p - eta * g
 *   Momentum  v' = beta * v - eta * g,  p' = p + v'
 *   Adam      m und s schätzen Mittel und Streuung, korrigiert und je Koordinate normiert
 */
export function abstieg(
  verfahren: VerfahrenKey,
  start: Point,
  lernrate: number,
  schritte: number,
): Point[] {
  const pfad: Point[] = [{ x: start.x, y: start.y }];
  const anzahl = Math.max(0, Math.round(schritte));
  let p: Point = { x: start.x, y: start.y };
  let v: Point = { x: 0, y: 0 };
  let m: Point = { x: 0, y: 0 };
  let s: Point = { x: 0, y: 0 };

  for (let t = 1; t <= anzahl; t += 1) {
    const g = gradientAt(FLAECHE, p);
    if (verfahren === "sgd") {
      p = { x: p.x - lernrate * g.x, y: p.y - lernrate * g.y };
    } else if (verfahren === "momentum") {
      v = { x: MOMENTUM * v.x - lernrate * g.x, y: MOMENTUM * v.y - lernrate * g.y };
      p = { x: p.x + v.x, y: p.y + v.y };
    } else {
      m = {
        x: ADAM_BETA1 * m.x + (1 - ADAM_BETA1) * g.x,
        y: ADAM_BETA1 * m.y + (1 - ADAM_BETA1) * g.y,
      };
      s = {
        x: ADAM_BETA2 * s.x + (1 - ADAM_BETA2) * g.x * g.x,
        y: ADAM_BETA2 * s.y + (1 - ADAM_BETA2) * g.y * g.y,
      };
      const mKorrigiert = { x: m.x / (1 - ADAM_BETA1 ** t), y: m.y / (1 - ADAM_BETA1 ** t) };
      const sKorrigiert = { x: s.x / (1 - ADAM_BETA2 ** t), y: s.y / (1 - ADAM_BETA2 ** t) };
      p = {
        x: p.x - lernrate * (mKorrigiert.x / (Math.sqrt(sKorrigiert.x) + ADAM_EPSILON)),
        y: p.y - lernrate * (mKorrigiert.y / (Math.sqrt(sKorrigiert.y) + ADAM_EPSILON)),
      };
    }
    pfad.push({ x: p.x, y: p.y });
  }
  return pfad;
}

registerRules([
  {
    name: "overshoot",
    explain: () =>
      "Der Verlust pendelt: das Verfahren schießt über das Minimum hinaus und kommt dort nicht " +
      "zur Ruhe. Der beste Wert auf dem Weg ist deutlich kleiner als der letzte.",
  },
]);

export const optimizer: Experiment = {
  id: "exp-optimizer",
  title: "Drei Verfahren auf einer Verlustfläche",
  learningGoal: "Vergleichen, wie SGD, Momentum und Adam denselben Abhang hinabgehen",
  instructions:
    "Wähle ein Verfahren, stelle die Lernrate und die Anzahl der Schritte ein. Der Pfad beginnt immer am selben Startpunkt.",
  spokenDescription:
    "Eine eingefärbte Verlustfläche mit dem Minimum etwas rechts unter der Mitte. Ein Startpunkt " +
    "ist gestrichelt umrandet. Die Punkte zeigen den Weg, den das gewählte Verfahren von dort nimmt. " +
    "Ein Pfeil zeigt den letzten Schritt.",
  controls: [
    {
      kind: "select",
      id: "verfahren",
      label: "Verfahren",
      options: VERFAHREN,
      initial: "sgd",
    },
    {
      kind: "slider",
      id: "lernrate",
      label: "Lernrate",
      min: 0.01,
      max: 0.8,
      step: 0.01,
      initial: 0.1,
    },
    {
      kind: "slider",
      id: "schritte",
      label: "Schritte",
      min: 1,
      max: 40,
      step: 1,
      initial: 12,
    },
    {
      kind: "point",
      id: "start",
      label: "Startpunkt",
      bounds: { minX: -2.4, maxX: 2.4, minY: -2.4, maxY: 2.4 },
      initial: START,
    },
  ],
  initialState: { verfahren: "sgd", lernrate: 0.1, schritte: 12, start: START },
  update(state, action) {
    if (action.type === "reset") {
      return { verfahren: "sgd", lernrate: 0.1, schritte: 12, start: START };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const verfahren = verfahrenVon(state);
    const lernrate = zahl(state, "lernrate", 0.1);
    const schritte = Math.round(zahl(state, "schritte", 12));
    const start = startPunkt(state);
    const pfad = abstieg(verfahren, start, lernrate, schritte);
    const verluste = pfad.map((p) => lossAt(FLAECHE, p));
    const startVerlust = verluste[0] ?? 0;
    const endVerlust = verluste[verluste.length - 1] ?? 0;
    const besterVerlust = Math.min(...verluste);
    const ende = pfad[pfad.length - 1] ?? start;
    const vorheriger = pfad[pfad.length - 2] ?? start;
    const name = VERFAHREN.find((v) => v.value === verfahren)?.label ?? "SGD";

    const punkte: Mark[] = pfad.map((p, i) => ({
      label: i === 0 ? "Start" : i === pfad.length - 1 ? "Ende" : "",
      x: p.x,
      y: p.y,
      color: i === pfad.length - 1 ? "#d93025" : "#1f2328",
    }));

    const pfeile: Vector[] = [
      {
        label: "letzter Schritt",
        from: [vorheriger.x, vorheriger.y],
        to: [ende.x, ende.y],
        color: "#d93025",
      },
    ];

    return {
      values: [
        { label: "Verlust am Start", value: startVerlust, digits: 4 },
        { label: "Verlust am Ende", value: endVerlust, digits: 4 },
        { label: "Bester Verlust", value: besterVerlust, digits: 4 },
        { label: "Endpunkt x", value: ende.x, digits: 3 },
        { label: "Endpunkt y", value: ende.y, digits: 3 },
      ],
      drawing: {
        kind: "grid",
        cols: 21,
        rows: 21,
        cells: lossGrid(FLAECHE),
        xRange: [-REICHWEITE, REICHWEITE],
        yRange: [-REICHWEITE, REICHWEITE],
        style: "verlust",
        vectors: pfeile,
        points: punkte,
      },
      sentences: [
        `${name} geht mit der Lernrate ${format(lernrate, 2)} in ${schritte} Schritten vom Verlust ${format(startVerlust)} auf ${format(endVerlust)}.`,
        `Der beste Wert auf dem Weg war ${format(besterVerlust)}, der Endpunkt liegt bei (${format(ende.x, 3)}|${format(ende.y, 3)}).`,
        Math.abs(ende.x) > REICHWEITE || Math.abs(ende.y) > REICHWEITE
          ? "Der Pfad verlässt den gezeigten Bereich: die Lernrate ist so groß, dass jeder Schritt übers Ziel hinausschießt."
          : endVerlust > besterVerlust * 3 && endVerlust > 0.01
            ? "Der letzte Wert ist deutlich schlechter als der beste Wert auf dem Weg: das Verfahren pendelt um das Minimum."
            : "Der Pfad läuft auf das Minimum der Mulde zu und wird dabei in jedem Schritt kürzer.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const pfadVorher = abstieg(
      verfahrenVon(before),
      startPunkt(before),
      zahl(before, "lernrate", 0.1),
      Math.round(zahl(before, "schritte", 12)),
    );
    const pfadNachher = abstieg(
      verfahrenVon(after),
      startPunkt(after),
      zahl(after, "lernrate", 0.1),
      Math.round(zahl(after, "schritte", 12)),
    );
    const l0 = pfadVorher.map((p) => lossAt(FLAECHE, p));
    const l1 = pfadNachher.map((p) => lossAt(FLAECHE, p));
    const ende0 = l0[l0.length - 1] ?? 0;
    const ende1 = l1[l1.length - 1] ?? 0;
    const best1 = Math.min(...l1);

    if (ende1 < ende0 - 1e-9) {
      events.push({ name: "lossDecreased", severity: "info", value: ende1 });
    }
    if (ende1 > ende0 + 1e-9) {
      events.push({ name: "lossIncreased", severity: "info", value: ende1 });
    }
    if (ende1 < 1e-3) events.push({ name: "converged", severity: "notable", value: ende1 });
    if (ende1 > (l1[0] ?? 0) * 1.5 && ende1 > 0.01) {
      events.push({ name: "diverging", severity: "warning", value: ende1 });
    } else if (best1 < ende1 / 3 && ende1 > 0.01) {
      events.push({ name: "overshoot", severity: "notable", value: ende1 - best1 });
    }
    return events;
  },
};
