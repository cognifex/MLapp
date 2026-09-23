/**
 * LEK-03 Matrizen: eine Punktwolke durch eine Matrix transformieren.
 * Rechenkern: p' = M * p fuer jeden Punkt der Figur. Determinante und Flaechenfaktor entstehen
 * aus denselben Matrixeintraegen - nichts davon ist von Hand gesetzt.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState, Point } from "./contract.js";

const BOUNDS = { minX: -3, maxX: 3, minY: -2, maxY: 4 };

/** Punktwolke in Form eines kleinen Hauses - asymmetrisch, damit Spiegelung sichtbar wird. */
export const CLOUD: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0.5, y: 1.6 },
  { x: 0, y: 1 },
];

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Geschlossener Linienzug durch alle Punkte (erster Punkt wird am Ende wiederholt). */
export function ring(points: Point[]): [number, number][] {
  const first = points[0] ?? { x: 0, y: 0 };
  return [...points.map((p) => [p.x, p.y] as [number, number]), [first.x, first.y]];
}

export function matrixOf(state: ExperimentState): {
  m11: number;
  m12: number;
  m21: number;
  m22: number;
} {
  return {
    m11: value(state, "m11", 1),
    m12: value(state, "m12", 0),
    m21: value(state, "m21", 0),
    m22: value(state, "m22", 1),
  };
}

export function determinant(state: ExperimentState): number {
  const m = matrixOf(state);
  return m.m11 * m.m22 - m.m12 * m.m21;
}

export function transform(state: ExperimentState, p: Point): Point {
  const m = matrixOf(state);
  return { x: m.m11 * p.x + m.m12 * p.y, y: m.m21 * p.x + m.m22 * p.y };
}

registerRules([
  {
    name: "orientationFlipped",
    explain: () =>
      "Die Determinante ist negativ. Die Figur wird gespiegelt: der Umlaufsinn kehrt sich um.",
  },
  {
    name: "singular",
    explain: () =>
      "Die Determinante ist fast null. Die Figur wird zu einer Linie plattgedrueckt - zwei verschiedene Punkte landen auf demselben Bild.",
  },
  {
    name: "areaGrew",
    explain: (e) => `Die Flaeche waechst um den Faktor ${format(e.value ?? 1)}.`,
  },
  {
    name: "areaShrank",
    explain: (e) => `Die Flaeche schrumpft auf den Faktor ${format(e.value ?? 1)}.`,
  },
]);

export const matrizen: Experiment = {
  id: "exp-matrizen",
  title: "Punktwolke unter einer Matrix",
  learningGoal: "Wirkung einer 2x2-Matrix auf Punkte und Flaechen verstehen",
  instructions:
    "Veraendere die vier Eintraege der Matrix. Gestrichelt siehst du die Ausgangsfigur, farbig ihr Bild.",
  spokenDescription:
    "Eine kleine Hausfigur aus fuenf Punkten. Vier Regler bestimmen die Eintraege einer zwei mal zwei Matrix. " +
    "Die gestrichelte Figur ist der Ausgangszustand, die farbige das Bild unter der Matrix.",
  controls: [
    { kind: "slider", id: "m11", label: "m11", min: -2, max: 2, step: 0.1, initial: 1 },
    { kind: "slider", id: "m12", label: "m12", min: -2, max: 2, step: 0.1, initial: 0 },
    { kind: "slider", id: "m21", label: "m21", min: -2, max: 2, step: 0.1, initial: 0 },
    { kind: "slider", id: "m22", label: "m22", min: -2, max: 2, step: 0.1, initial: 1 },
  ],
  initialState: { m11: 1, m12: 0, m21: 0, m22: 1 },
  update(state, action) {
    if (action.type === "reset") return { m11: 1, m12: 0, m21: 0, m22: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const det = determinant(state);
    const image = CLOUD.map((p) => transform(state, p));
    const imageOfOneOne = transform(state, { x: 1, y: 1 });

    const original: Curve = {
      label: "Ausgangsfigur",
      dashed: true,
      color: "#5f6368",
      points: ring(CLOUD),
    };
    const moved: Curve = { label: "Bild der Figur", color: "#1a73e8", points: ring(image) };
    const marks: Mark[] = [
      { label: "(1|1)", x: imageOfOneOne.x, y: imageOfOneOne.y, color: "#d93025" },
    ];

    return {
      values: [
        { label: "Determinante", value: det, digits: 2 },
        { label: "Flaechenfaktor", value: Math.abs(det), digits: 2 },
      ],
      drawing: {
        kind: "plane",
        xRange: [BOUNDS.minX, BOUNDS.maxX],
        yRange: [BOUNDS.minY, BOUNDS.maxY],
        vectors: [],
        points: marks,
        curves: [original, moved],
      },
      sentences: [
        `Die Matrix bildet den Punkt (1|1) auf (${format(imageOfOneOne.x)}|${format(imageOfOneOne.y)}) ab.`,
        `Die Determinante ist ${format(det)}.`,
        Math.abs(det) < 0.05
          ? "Fast alle Bildpunkte landen auf einer Linie: die Abbildung ist nicht mehr umkehrbar."
          : det < 0
            ? "Der Flaecheninhalt bleibt betragsmaessig, aber die Orientierung kippt - die Figur wird gespiegelt."
            : det > 1
              ? "Die Figur wird gestreckt: der Flaecheninhalt waechst."
              : "Die Figur wird gestaucht, die Orientierung bleibt erhalten.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const d0 = determinant(before);
    const d1 = determinant(after);
    const events: SemanticEvent[] = [];
    if (d0 >= 0 && d1 < 0)
      events.push({ name: "orientationFlipped", severity: "notable", value: d1 });
    if (Math.abs(d1) < 0.05) events.push({ name: "singular", severity: "warning", value: d1 });
    else if (Math.abs(d1) > Math.abs(d0) + 0.05)
      events.push({ name: "areaGrew", severity: "info", value: Math.abs(d1) });
    else if (Math.abs(d1) < Math.abs(d0) - 0.05)
      events.push({ name: "areaShrank", severity: "info", value: Math.abs(d1) });
    return events;
  },
};
