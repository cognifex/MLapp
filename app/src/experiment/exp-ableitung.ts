/**
 * LEK-04 Ableitung: die Tangente entlang eines Graphen bewegen, Sekante gegen Tangente.
 * Rechenkern: f und f' sind fuer jede waehlbare Funktion geschlossen angegeben; die
 * Sekantensteigung wird aus zwei Funktionswerten gerechnet. Kein Naeherungsverfahren im Spiel.
 */
import type { Calculated, Curve } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type FunctionKey = "quadrat" | "kubisch" | "sinus" | "exponential";

type FunctionPair = { f: (x: number) => number; df: (x: number) => number; label: string };

const FUNCTIONS: Record<FunctionKey, FunctionPair> = {
  quadrat: { f: (x) => x * x, df: (x) => 2 * x, label: "y = x²" },
  kubisch: { f: (x) => x * x * x, df: (x) => 3 * x * x, label: "y = x³" },
  sinus: { f: (x) => Math.sin(x), df: (x) => Math.cos(x), label: "y = sin(x)" },
  exponential: { f: (x) => Math.exp(x), df: (x) => Math.exp(x), label: "y = e^x" },
};

function number(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function key(state: ExperimentState): FunctionKey {
  const v = state["funktion"];
  return typeof v === "string" && v in FUNCTIONS ? (v as FunctionKey) : "quadrat";
}

function format(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits).replace(".", ",") : "sehr gross";
}

registerRules([
  {
    name: "secantApproximatesTangent",
    explain: () =>
      "Der Sekantenabstand ist klein geworden. Die Sekantensteigung liegt jetzt dicht an der Tangentensteigung - das ist der Kern der Ableitung.",
  },
  {
    name: "secantFarFromTangent",
    explain: () =>
      "Der Sekantenabstand ist gross. Die Sekante mittelt ueber ein weites Stueck Kurve und weicht deutlich von der Tangente ab.",
  },
]);

export const ableitung: Experiment = {
  id: "exp-ableitung",
  title: "Sekante wird zur Tangente",
  learningGoal: "Ableitung als Grenzwert des Differenzenquotienten verstehen",
  instructions:
    "Bewege x entlang der Kurve und verkleinere dann h. Beobachte, wie die gestrichelte Sekante zur Tangente wird.",
  spokenDescription:
    "Ein Funktionsgraph mit einem Punkt. Die durchgezogene Gerade ist die Tangente an dieser Stelle, " +
    "die gestrichelte Gerade die Sekante durch den Punkt im Abstand h. Mit dem Regler h wandert der zweite Punkt auf die Stelle zu.",
  controls: [
    {
      kind: "select",
      id: "funktion",
      label: "Funktion",
      options: [
        { value: "quadrat", label: "y = x²" },
        { value: "kubisch", label: "y = x³" },
        { value: "sinus", label: "y = sin(x)" },
        { value: "exponential", label: "y = e^x" },
      ],
      initial: "quadrat",
    },
    { kind: "slider", id: "x", label: "x: Stelle", min: -2.5, max: 2.5, step: 0.05, initial: 1 },
    {
      kind: "slider",
      id: "h",
      label: "h: Abstand des zweiten Punktes",
      min: 0.05,
      max: 2,
      step: 0.05,
      initial: 1,
    },
  ],
  initialState: { funktion: "quadrat", x: 1, h: 1 },
  update(state, action) {
    if (action.type === "reset") return { funktion: "quadrat", x: 1, h: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const fn = FUNCTIONS[key(state)];
    const x = number(state, "x", 1);
    const h = Math.max(0.01, number(state, "h", 1));
    const y = fn.f(x);
    const yh = fn.f(x + h);
    const slope = fn.df(x);
    const secantSlope = (yh - y) / h;
    const deviation = Math.abs(secantSlope - slope);

    const curve: Curve = {
      label: fn.label,
      points: Array.from({ length: 241 }, (_, i) => {
        const px = -2.5 + (5 * i) / 240;
        return [px, fn.f(px)] as [number, number];
      }),
    };
    const tangent: Curve = {
      label: "Tangente",
      points: [
        [x - 1, y - slope],
        [x + 1, y + slope],
      ],
    };
    const secant: Curve = {
      label: "Sekante",
      dashed: true,
      color: "#188038",
      points: [
        [x - 0.3, y - 0.3 * secantSlope],
        [x + h + 0.3, yh + 0.3 * secantSlope],
      ],
    };

    return {
      values: [
        { label: "x", value: x, digits: 2 },
        { label: "f(x)", value: y, digits: 3 },
        { label: "Tangentensteigung f'(x)", value: slope, digits: 3 },
        { label: "Sekantensteigung", value: secantSlope, digits: 3 },
        { label: "Abweichung", value: deviation, digits: 4 },
      ],
      drawing: {
        kind: "function-plot",
        xRange: [-2.5, 2.5],
        yRange: [-3, 8],
        curves: [curve, tangent, secant],
        marks: [
          { label: "P", x, y, color: "#d93025" },
          { label: "Q", x: x + h, y: yh, color: "#188038" },
        ],
      },
      sentences: [
        `Die Sekante verbindet die Punkte P bei x gleich ${format(x)} und Q bei x gleich ${format(x + h)}.`,
        `Ihre Steigung ist der Differenzenquotient: ${format(secantSlope, 3)}.`,
        `Die Tangente hat dort die Steigung ${format(slope, 3)} - das ist der Grenzwert fuer h gegen null.`,
        deviation < 0.05
          ? "Sekante und Tangente sind jetzt praktisch deckungsgleich."
          : `Noch weichen sie um ${format(deviation, 4)} voneinander ab.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const fn = FUNCTIONS[key(after)];
    const x = number(after, "x", 1);
    const slope = fn.df(x);
    const events: SemanticEvent[] = [];
    if (Math.abs(slope) < 0.15) events.push({ name: "derivativeNearZero", severity: "notable" });
    else if (slope > 0) events.push({ name: "derivativePositive", severity: "info", value: slope });
    else events.push({ name: "derivativeNegative", severity: "info", value: slope });

    const hBefore = number(before, "h", 1);
    const hAfter = number(after, "h", 1);
    if (hAfter !== hBefore) {
      if (hAfter <= 0.25)
        events.push({ name: "secantApproximatesTangent", severity: "info", value: hAfter });
      else if (hBefore <= 0.25)
        events.push({ name: "secantFarFromTangent", severity: "info", value: hAfter });
    }
    return events;
  },
};
