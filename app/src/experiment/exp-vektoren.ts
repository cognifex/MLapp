/**
 * LEK-02 Vektoren: ziehen, addieren, Skalarprodukt beobachten.
 * Rechenkern: a und b sind Punkte (Vektoren vom Ursprung). Summe, Betraege, Skalarprodukt und
 * Winkel werden aus den Koordinaten gerechnet.
 */
import type { Calculated, Vector } from "../model/types.js";
import type { SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type ExperimentState, type Point } from "./contract.js";

const BOUNDS = { minX: -3, maxX: 3, minY: -2, maxY: 4 };

function point(state: ExperimentState, id: string, fallback: Point): Point {
  const v = state[id];
  return isPoint(v) ? v : fallback;
}

export function length(p: Point): number {
  return Math.hypot(p.x, p.y);
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function angleDegrees(a: Point, b: Point): number {
  const la = length(a);
  const lb = length(b);
  if (la < 1e-9 || lb < 1e-9) return Number.NaN;
  const cos = Math.min(1, Math.max(-1, dot(a, b) / (la * lb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function format(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits).replace(".", ",") : "nicht definiert";
}

export const vektoren: Experiment = {
  id: "exp-vektoren",
  title: "Zwei Vektoren ziehen und vergleichen",
  learningGoal: "Skalarprodukt und Winkel als Mass fuer Gleichrichtung verstehen",
  instructions:
    "Ziehe die beiden Spitzen a und b mit dem Finger. Beobachte, wie sich Summe, Skalarprodukt und Winkel aendern.",
  spokenDescription:
    "Eine Zeichenebene mit zwei Pfeilen vom Ursprung: a und b. Beide Spitzen lassen sich ziehen. " +
    "Zusaetzlich wird die Summe der beiden Vektoren gezeichnet.",
  controls: [
    { kind: "point", id: "a", label: "Spitze von a", bounds: BOUNDS, initial: { x: 2, y: 1 } },
    { kind: "point", id: "b", label: "Spitze von b", bounds: BOUNDS, initial: { x: 0.5, y: 2 } },
    { kind: "toggle", id: "summe", label: "Summe zeigen", initial: true },
  ],
  initialState: { a: { x: 2, y: 1 }, b: { x: 0.5, y: 2 }, summe: true },
  update(state, action) {
    if (action.type === "reset") return { a: { x: 2, y: 1 }, b: { x: 0.5, y: 2 }, summe: true };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const a = point(state, "a", { x: 2, y: 1 });
    const b = point(state, "b", { x: 0.5, y: 2 });
    const showSum = state["summe"] === true;
    const s = { x: a.x + b.x, y: a.y + b.y };
    const d = dot(a, b);
    const angle = angleDegrees(a, b);

    const vectors: Vector[] = [
      { label: "a", from: [0, 0], to: [a.x, a.y], color: "#1a73e8" },
      { label: "b", from: [0, 0], to: [b.x, b.y], color: "#188038" },
    ];
    if (showSum) {
      vectors.push({ label: "a + b", from: [0, 0], to: [s.x, s.y], color: "#d93025" });
      vectors.push({ label: "", from: [a.x, a.y], to: [s.x, s.y], color: "#d93025" });
      vectors.push({ label: "", from: [b.x, b.y], to: [s.x, s.y], color: "#d93025" });
    }

    const explanation =
      Math.abs(d) < 0.05
        ? "Das Skalarprodukt ist praktisch null: die Vektoren stehen senkrecht aufeinander."
        : d > 0
          ? "Das Skalarprodukt ist positiv: die Vektoren zeigen in eine aehnliche Richtung."
          : "Das Skalarprodukt ist negativ: die Vektoren zeigen in entgegengesetzte Richtungen.";

    return {
      values: [
        { label: "Laenge von a", value: length(a), digits: 2 },
        { label: "Laenge von b", value: length(b), digits: 2 },
        { label: "Skalarprodukt", value: d, digits: 2 },
        { label: "Winkel", value: angle, unit: "°", digits: 1 },
      ],
      drawing: {
        kind: "plane",
        xRange: [BOUNDS.minX, BOUNDS.maxX],
        yRange: [BOUNDS.minY, BOUNDS.maxY],
        vectors,
        points: [
          { label: "a", x: a.x, y: a.y, color: "#1a73e8" },
          { label: "b", x: b.x, y: b.y, color: "#188038" },
        ],
      },
      sentences: [
        `a zeigt auf ${format(a.x)}, ${format(a.y)} und hat die Laenge ${format(length(a))}.`,
        `b zeigt auf ${format(b.x)}, ${format(b.y)} mit der Laenge ${format(length(b))}.`,
        `Das Skalarprodukt betraegt ${format(d)}, der Winkel zwischen beiden ist ${format(angle, 1)} Grad.`,
        explanation,
      ],
    };
  },
  semanticEvents(_before, after): SemanticEvent[] {
    const a = point(after, "a", { x: 2, y: 1 });
    const b = point(after, "b", { x: 0.5, y: 2 });
    const la = length(a);
    const lb = length(b);
    if (la < 1e-9 || lb < 1e-9) return [{ name: "similarityLow", severity: "info", value: 0 }];
    const cos = dot(a, b) / (la * lb);
    if (Math.abs(cos) < 0.06) return [{ name: "orthogonal", severity: "notable", value: 0 }];
    if (cos > 0.85) return [{ name: "similarityHigh", severity: "info", value: cos }];
    if (cos < 0.25) return [{ name: "similarityLow", severity: "info", value: cos }];
    return [];
  },
};
