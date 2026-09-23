/**
 * LEK-05 Gradient: Richtung des staerksten Anstiegs auf einer Verlustflaeche.
 * Rechenkern: fuer jede Flaeche sind Verlustfunktion und Gradient geschlossen angegeben; die
 * Farbflaeche entsteht aus derselben Funktion, die auch den Zahlenwert liefert.
 */
import type { Calculated, GridCell } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type ExperimentState, type Point } from "./contract.js";

export type SurfaceKey = "mulde" | "sattel" | "rinne";

type Surface = {
  label: string;
  loss: (p: Point) => number;
  gradient: (p: Point) => Point;
  range: number;
};

export const SURFACES: Record<SurfaceKey, Surface> = {
  mulde: {
    label: "Mulde",
    loss: (p) => (p.x - 0.8) ** 2 + 1.6 * (p.y + 0.6) ** 2,
    gradient: (p) => ({ x: 2 * (p.x - 0.8), y: 3.2 * (p.y + 0.6) }),
    range: 2.5,
  },
  sattel: {
    label: "Sattel",
    loss: (p) => 0.8 * p.x ** 2 - 0.8 * p.y ** 2,
    gradient: (p) => ({ x: 1.6 * p.x, y: -1.6 * p.y }),
    range: 2.5,
  },
  rinne: {
    label: "Rinne",
    loss: (p) => 0.3 * p.x ** 2 + 3 * (p.y - 0.2) ** 2,
    gradient: (p) => ({ x: 0.6 * p.x, y: 6 * (p.y - 0.2) }),
    range: 2.5,
  },
};

function position(state: ExperimentState): Point {
  const v = state["p"];
  return isPoint(v) ? v : { x: -1.5, y: -1.2 };
}

function surfaceKeyOf(state: ExperimentState): SurfaceKey {
  const v = state["flaeche"];
  return typeof v === "string" && v in SURFACES ? (v as SurfaceKey) : "mulde";
}

function surfaceOf(state: ExperimentState): Surface {
  return SURFACES[surfaceKeyOf(state)];
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export function lossAt(surfaceKey: SurfaceKey, p: Point): number {
  return SURFACES[surfaceKey].loss(p);
}

export function gradientAt(surfaceKey: SurfaceKey, p: Point): Point {
  return SURFACES[surfaceKey].gradient(p);
}

/** Farbflaeche als Zellenraster; der Farbwert ist der Verlust in der Zellmitte. */
export function lossGrid(surfaceKey: SurfaceKey, cols = 21, rows = 21): GridCell[] {
  const s = SURFACES[surfaceKey];
  const cells: GridCell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = -s.range + (2 * s.range * (col + 0.5)) / cols;
      const y = s.range - (2 * s.range * (row + 0.5)) / rows;
      cells.push({ row, col, value: s.loss({ x, y }) });
    }
  }
  return cells;
}

registerRules([
  {
    name: "gradientSteep",
    explain: (e) => `Der Gradient ist lang: ${format(e.value ?? 0)}. Hier faellt es steil ab.`,
  },
  {
    name: "gradientFlat",
    explain: (e) =>
      `Der Gradient ist kurz: ${format(e.value ?? 0)}. Die Flaeche ist hier flach - der Abstieg wird langsam.`,
  },
]);

export const gradient: Experiment = {
  id: "exp-gradient",
  title: "Verlustflaeche und Gradient",
  learningGoal: "Gradient als Richtung des steilsten Anstiegs lesen",
  instructions:
    "Ziehe den Punkt ueber die Flaeche. Der Pfeil zeigt den Gradienten - die Richtung des steilsten Anstiegs. Entgegengesetzt geht es bergab.",
  spokenDescription:
    "Eine eingefärbte Verlustflaeche. Je dunkler die Farbe, desto groesser der Verlust. Ein Punkt laesst sich ziehen. " +
    "Ein Pfeil am Punkt zeigt den Gradienten: er steht immer senkrecht auf den Hoehenlinien und zeigt bergauf.",
  controls: [
    {
      kind: "select",
      id: "flaeche",
      label: "Flaeche",
      options: [
        { value: "mulde", label: "Mulde" },
        { value: "sattel", label: "Sattel" },
        { value: "rinne", label: "Rinne" },
      ],
      initial: "mulde",
    },
    {
      kind: "point",
      id: "p",
      label: "Punkt auf der Flaeche",
      bounds: { minX: -2.4, maxX: 2.4, minY: -2.4, maxY: 2.4 },
      initial: { x: -1.5, y: -1.2 },
    },
  ],
  initialState: { flaeche: "mulde", p: { x: -1.5, y: -1.2 } },
  update(state, action) {
    if (action.type === "reset") return { flaeche: "mulde", p: { x: -1.5, y: -1.2 } };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const surfaceKey = surfaceKeyOf(state);
    const s = surfaceOf(state);
    const p = position(state);
    const g = s.gradient(p);
    const loss = s.loss(p);
    const length = Math.hypot(g.x, g.y);
    // Der Pfeil wird auf eine lesbare Laenge gebracht, die Richtung bleibt exakt.
    const scale = length > 1e-9 ? Math.min(1.2, 0.35 + length / 6) / length : 0;

    return {
      values: [
        { label: "Verlust", value: loss, digits: 3 },
        { label: "∂L/∂x", value: g.x, digits: 3 },
        { label: "∂L/∂y", value: g.y, digits: 3 },
        { label: "Laenge des Gradienten", value: length, digits: 3 },
      ],
      drawing: {
        kind: "grid",
        cols: 21,
        rows: 21,
        cells: lossGrid(surfaceKey),
        xRange: [-s.range, s.range],
        yRange: [-s.range, s.range],
        vectors: [
          {
            label: "Gradient",
            from: [p.x, p.y],
            to: [p.x + g.x * scale, p.y + g.y * scale],
            color: "#d93025",
          },
        ],
        points: [{ label: "P", x: p.x, y: p.y, color: "#1f2328" }],
      },
      sentences: [
        `Auf der Flaeche ${s.label} betraegt der Verlust an dieser Stelle ${format(loss, 3)}.`,
        `Der Gradient zeigt auf (${format(g.x, 3)} | ${format(g.y, 3)}) und hat die Laenge ${format(length, 3)}.`,
        length < 0.05
          ? "Der Gradient ist hier praktisch null: das ist eine Stelle, an der das Verfahren zur Ruhe kommt."
          : "Der Gradient steht senkrecht auf der Hoehenlinie und zeigt in die Richtung des steilsten Anstiegs. Bergab geht es in die Gegenrichtung.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const surfaceKeyBefore = surfaceKeyOf(before);
    const surfaceKeyAfter = surfaceKeyOf(after);
    const events: SemanticEvent[] = [];
    if (surfaceKeyBefore === surfaceKeyAfter) {
      const l0 = SURFACES[surfaceKeyBefore].loss(position(before));
      const l1 = SURFACES[surfaceKeyAfter].loss(position(after));
      if (l1 < l0 - 1e-6) events.push({ name: "lossDecreased", severity: "info", value: l1 });
      else if (l1 > l0 + 1e-6) events.push({ name: "lossIncreased", severity: "info", value: l1 });
    }
    const g = SURFACES[surfaceKeyAfter].gradient(position(after));
    const length = Math.hypot(g.x, g.y);
    if (length > 3) events.push({ name: "gradientSteep", severity: "info", value: length });
    if (length < 0.25) events.push({ name: "gradientFlat", severity: "notable", value: length });
    return events;
  },
};
