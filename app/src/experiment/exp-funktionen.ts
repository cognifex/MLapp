/**
 * LEK-01 Funktionen: x veraendern und y im Funktionsgraphen verfolgen.
 *
 * Rechenkern: y = a*x^2 + b*x + c. Alles, was angezeigt wird, entsteht aus dieser Funktion -
 * die Zeichnung ist keine Illustration, sondern die Auswertung.
 */
import type { Calculated, Curve } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export const X_RANGE: [number, number] = [-3, 3];
const Y_RANGE: [number, number] = [-6, 9];

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function parabola(state: ExperimentState, x: number): number {
  return value(state, "a", 1) * x * x + value(state, "b", 0) * x + value(state, "c", 0);
}

function slope(state: ExperimentState, x: number): number {
  return 2 * value(state, "a", 1) * x + value(state, "b", 0);
}

registerRules([
  {
    name: "valuePositive",
    explain: (e) =>
      `Der Funktionswert ist positiv: y ist gleich ${(e.value ?? 0).toFixed(2).replace(".", ",")}.`,
  },
  {
    name: "valueNegative",
    explain: (e) =>
      `Der Funktionswert ist negativ: y ist gleich ${(e.value ?? 0).toFixed(2).replace(".", ",")}.`,
  },
]);

export const funktionen: Experiment = {
  id: "exp-funktionen",
  title: "Funktionsgraph mit beweglicher Stelle",
  learningGoal: "Zusammenhang zwischen der Stelle x und dem Funktionswert y sehen",
  instructions:
    "Ziehe den Regler fuer x und beobachte, wie der Punkt auf der Kurve wandert. a, b und c formen die Kurve selbst.",
  spokenDescription:
    "Ein Koordinatensystem mit einer Parabel. Der rote Punkt sitzt an der Stelle x auf der Kurve. " +
    "Mit dem Regler x wandert der Punkt, die Regler a, b und c veraendern die Form der Kurve.",
  controls: [
    { kind: "slider", id: "a", label: "a: Kruemmung", min: -2, max: 2, step: 0.1, initial: 1 },
    { kind: "slider", id: "b", label: "b: Neigung", min: -4, max: 4, step: 0.1, initial: 0 },
    {
      kind: "slider",
      id: "c",
      label: "c: Verschiebung nach oben",
      min: -4,
      max: 4,
      step: 0.1,
      initial: 0,
    },
    {
      kind: "slider",
      id: "x",
      label: "x: Stelle",
      min: X_RANGE[0],
      max: X_RANGE[1],
      step: 0.05,
      initial: 1,
    },
  ],
  initialState: { a: 1, b: 0, c: 0, x: 1 },
  update(state, action) {
    if (action.type === "reset") return { a: 1, b: 0, c: 0, x: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const x = value(state, "x", 1);
    const y = parabola(state, x);
    const steep = slope(state, x);

    const curve: Curve = {
      label: "y = a·x² + b·x + c",
      points: ([] as [number, number][]).concat(
        ...Array.from({ length: 241 }, (_, i) => {
          const px = X_RANGE[0] + ((X_RANGE[1] - X_RANGE[0]) * i) / 240;
          return [[px, parabola(state, px)] as [number, number]];
        }),
      ),
    };

    const tangent: Curve = {
      label: "Tangente an der Stelle x",
      dashed: true,
      points: [
        [x - 0.8, y - 0.8 * steep],
        [x + 0.8, y + 0.8 * steep],
      ],
    };

    return {
      values: [
        { label: "x", value: x, digits: 2 },
        { label: "y", value: y, digits: 2 },
        { label: "Steigung dort", value: steep, digits: 2 },
      ],
      drawing: {
        kind: "function-plot",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        curves: [curve, tangent],
        marks: [{ label: `x = ${x.toFixed(2).replace(".", ",")}`, x, y, color: "#d93025" }],
      },
      sentences: [
        `An der Stelle x gleich ${x.toFixed(2).replace(".", ",")} liest der Graph den Wert y gleich ${y
          .toFixed(2)
          .replace(".", ",")} ab.`,
        `Dort hat die Kurve die Steigung ${steep.toFixed(2).replace(".", ",")}.`,
        "Verschiebst du x, wandert der Punkt mit - y und Steigung aendern sich dabei.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const xb = value(before, "x", 1);
    const xa = value(after, "x", 1);
    const sb = slope(before, xb);
    const sa = slope(after, xa);
    const ya = parabola(after, xa);

    if (Math.abs(sa) < 0.15) events.push({ name: "derivativeNearZero", severity: "notable" });
    else if (sa > 0) events.push({ name: "derivativePositive", severity: "info", value: sa });
    else events.push({ name: "derivativeNegative", severity: "info", value: sa });

    const change = compareValues(Math.abs(sb), Math.abs(sa), 0.05);
    if (change === "up") events.push({ name: "steepening", severity: "info" });
    if (change === "down") events.push({ name: "flattening", severity: "info" });

    if (ya > 0) events.push({ name: "valuePositive", severity: "info", value: ya });
    if (ya < 0) events.push({ name: "valueNegative", severity: "info", value: ya });
    return events;
  },
};
