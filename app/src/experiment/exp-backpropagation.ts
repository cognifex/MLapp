/**
 * LEK-18 Backpropagation: ein Netz 2-2-1 vorwärts rechnen und die Gradienten rückwärts
 * durch den Rechengraphen tragen.
 *
 * Rechenkern: beide Schichten nutzen Sigmoid, der Verlust ist quadratisch. Die Rückwärts-
 * rechnung ist die Kettenregel, ausgeschrieben je Gewicht - keine Näherung, kein Zahlenwerk
 * von Hand. Die Säulen zeigen den Betrag der Gradienten; die Vorzeichen stehen als Zahlen
 * daneben, weil eine negative Säule in der Zeichnung nicht sichtbar wäre.
 */
import type { Bar, Calculated } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Feste Eingaben des Beispiels; das Netz bleibt mit zwei Zahlen überschaubar. */
export const EINGABEN: [number, number] = [1, 0.5];

/** Die Ausgabeschicht hat keine Vorspannung - so bleibt die Rechnung nachvollziehbar. */
const AUSGABE_VORSPANNUNG = 0;

export type Netzwerte = {
  /** Summe vor der Aktivierung und Aktivierung der beiden versteckten Neuronen. */
  z1: number;
  h1: number;
  z2: number;
  h2: number;
  /** Summe und Aktivierung der Ausgabeschicht. */
  o: number;
  ausgabe: number;
  verlust: number;
  /** Gradienten des Verlusts nach den Gewichten der Ausgabeschicht. */
  gv1: number;
  gv2: number;
  /** Gradienten nach den Gewichten der versteckten Schicht. */
  gw11: number;
  gw12: number;
  gw21: number;
  gw22: number;
  /** Gradienten nach den Vorspannungen der versteckten Schicht. */
  gb1: number;
  gb2: number;
};

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function format(n: number, digits = 3): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Vorwärts durch den Graphen und rückwärts die Gradienten - beides aus demselben Zustand. */
export function netzwerte(state: ExperimentState): Netzwerte {
  const w11 = zahl(state, "w11", 0.8);
  const w12 = zahl(state, "w12", -0.5);
  const w21 = zahl(state, "w21", -0.6);
  const w22 = zahl(state, "w22", 0.9);
  const v1 = zahl(state, "v1", 1.2);
  const v2 = zahl(state, "v2", -0.8);
  const b1 = zahl(state, "b1", -0.2);
  const b2 = zahl(state, "b2", 0.3);
  const ziel = zahl(state, "ziel", 1);
  const x1 = EINGABEN[0];
  const x2 = EINGABEN[1];

  // Vorwärts: erst die versteckte Schicht, dann die Ausgabe.
  const z1 = w11 * x1 + w12 * x2 + b1;
  const h1 = sigmoid(z1);
  const z2 = w21 * x1 + w22 * x2 + b2;
  const h2 = sigmoid(z2);
  const o = v1 * h1 + v2 * h2 + AUSGABE_VORSPANNUNG;
  const ausgabe = sigmoid(o);
  const verlust = 0.5 * (ausgabe - ziel) ** 2;

  // Rückwärts: erst der Fehler an der Ausgabe, dann je Schicht eine Kettengliedstufe mehr.
  const gAusgabe = (ausgabe - ziel) * ausgabe * (1 - ausgabe);
  const gv1 = gAusgabe * h1;
  const gv2 = gAusgabe * h2;
  const gz1 = gAusgabe * v1 * h1 * (1 - h1);
  const gz2 = gAusgabe * v2 * h2 * (1 - h2);

  return {
    z1,
    h1,
    z2,
    h2,
    o,
    ausgabe,
    verlust,
    gv1,
    gv2,
    gw11: gz1 * x1,
    gw12: gz1 * x2,
    gw21: gz2 * x1,
    gw22: gz2 * x2,
    gb1: gz1,
    gb2: gz2,
  };
}

/** Größter Gradient der Ausgabeschicht geteilt durch den größten der versteckten Schicht. */
function schrumpffaktor(n: Netzwerte): number {
  const ausgabe = Math.max(Math.abs(n.gv1), Math.abs(n.gv2));
  const versteckt = Math.max(
    Math.abs(n.gw11),
    Math.abs(n.gw12),
    Math.abs(n.gw21),
    Math.abs(n.gw22),
  );
  if (versteckt < 1e-12) return ausgabe < 1e-12 ? 1 : Number.POSITIVE_INFINITY;
  return ausgabe / versteckt;
}

function saettigt(n: Netzwerte): boolean {
  const grenze = 0.995;
  return [n.h1, n.h2].some((h) => h > grenze || h < 1 - grenze);
}

registerRules([
  {
    name: "saettigung",
    explain: () =>
      "Ein verstecktes Neuron ist gesättigt: seine Aktivierung liegt fast bei null oder fast bei eins. " +
      "Dort ist die Ableitung fast null, und der Gradient versickert auf dem Weg nach hinten.",
  },
  {
    name: "gradientShrinks",
    explain: (e) =>
      `Der Gradient wird nach hinten kleiner: der größte Gradient der Ausgabeschicht ist ${format(
        e.value ?? 0,
      )} mal so groß wie der größte der versteckten Schicht.`,
  },
]);

export const backpropagation: Experiment = {
  id: "exp-backpropagation",
  title: "Rechengraph vorwärts und rückwärts",
  learningGoal: "Die Kettenregel als Rückwärtsdurchlauf durch ein kleines Netz verstehen",
  instructions:
    "Verändere Gewichte, Vorspannungen und Sollwert. Oben stehen die Werte aus dem Vorwärtsdurchlauf, die Säulen zeigen die Gradienten aus dem Rückwärtsdurchlauf.",
  spokenDescription:
    "Ein Netz mit zwei Eingaben, zwei versteckten Neuronen und einer Ausgabe. Regler bestimmen die " +
    "vier Gewichte der versteckten Schicht, die zwei Gewichte der Ausgabe, die zwei Vorspannungen und " +
    "den Sollwert. Die Säulen zeigen den Betrag jedes Gradienten, geordnet nach Schicht.",
  controls: [
    {
      kind: "slider",
      id: "w11",
      label: "w11: Gewicht zu h1",
      min: -2,
      max: 2,
      step: 0.05,
      initial: 0.8,
    },
    {
      kind: "slider",
      id: "w12",
      label: "w12: Gewicht zu h1",
      min: -2,
      max: 2,
      step: 0.05,
      initial: -0.5,
    },
    {
      kind: "slider",
      id: "w21",
      label: "w21: Gewicht zu h2",
      min: -2,
      max: 2,
      step: 0.05,
      initial: -0.6,
    },
    {
      kind: "slider",
      id: "w22",
      label: "w22: Gewicht zu h2",
      min: -2,
      max: 2,
      step: 0.05,
      initial: 0.9,
    },
    {
      kind: "slider",
      id: "v1",
      label: "v1: Gewicht von h1",
      min: -2,
      max: 2,
      step: 0.05,
      initial: 1.2,
    },
    {
      kind: "slider",
      id: "v2",
      label: "v2: Gewicht von h2",
      min: -2,
      max: 2,
      step: 0.05,
      initial: -0.8,
    },
    {
      kind: "slider",
      id: "b1",
      label: "b1: Vorspannung von h1",
      min: -6,
      max: 6,
      step: 0.1,
      initial: -0.2,
    },
    {
      kind: "slider",
      id: "b2",
      label: "b2: Vorspannung von h2",
      min: -6,
      max: 6,
      step: 0.1,
      initial: 0.3,
    },
    { kind: "slider", id: "ziel", label: "Sollwert", min: 0, max: 1, step: 0.05, initial: 1 },
  ],
  initialState: {
    w11: 0.8,
    w12: -0.5,
    w21: -0.6,
    w22: 0.9,
    v1: 1.2,
    v2: -0.8,
    b1: -0.2,
    b2: 0.3,
    ziel: 1,
  },
  update(state, action) {
    if (action.type === "reset") {
      return {
        w11: 0.8,
        w12: -0.5,
        w21: -0.6,
        w22: 0.9,
        v1: 1.2,
        v2: -0.8,
        b1: -0.2,
        b2: 0.3,
        ziel: 1,
      };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const n = netzwerte(state);

    // Beträge: die Säulen zeigen die Größe, die Vorzeichen stehen in den Zahlen daneben.
    const balken: Bar[] = [
      { label: "v1", value: Math.abs(n.gv1), color: "#d93025" },
      { label: "v2", value: Math.abs(n.gv2), color: "#d93025" },
      { label: "w11", value: Math.abs(n.gw11), color: "#1a73e8" },
      { label: "w12", value: Math.abs(n.gw12), color: "#1a73e8" },
      { label: "w21", value: Math.abs(n.gw21), color: "#1a73e8" },
      { label: "w22", value: Math.abs(n.gw22), color: "#1a73e8" },
      { label: "b1", value: Math.abs(n.gb1), color: "#188038" },
      { label: "b2", value: Math.abs(n.gb2), color: "#188038" },
    ];
    const groesster = Math.max(...balken.map((b) => b.value));
    const hervorgehoben = balken.map((b) => ({ ...b, highlighted: b.value === groesster }));
    const faktor = schrumpffaktor(n);

    return {
      values: [
        { label: "h1", value: n.h1, digits: 3 },
        { label: "h2", value: n.h2, digits: 3 },
        { label: "Ausgabe", value: n.ausgabe, digits: 3 },
        { label: "Verlust", value: n.verlust, digits: 4 },
        { label: "∂L/∂v1", value: n.gv1, digits: 4 },
        { label: "∂L/∂v2", value: n.gv2, digits: 4 },
        { label: "∂L/∂w11", value: n.gw11, digits: 4 },
        { label: "∂L/∂w12", value: n.gw12, digits: 4 },
        { label: "∂L/∂w21", value: n.gw21, digits: 4 },
        { label: "∂L/∂w22", value: n.gw22, digits: 4 },
      ],
      drawing: {
        kind: "bars",
        items: hervorgehoben,
        yMax: Math.max(1e-9, groesster) * 1.15,
      },
      sentences: [
        `Vorwärts: die versteckten Neuronen geben ${format(n.h1)} und ${format(n.h2)} weiter, daraus wird die Ausgabe ${format(n.ausgabe)}.`,
        `Bei einem Sollwert von ${format(zahl(state, "ziel", 1))} beträgt der Verlust ${format(n.verlust, 4)}.`,
        `Rückwärts: ∂L/∂v1 ist ${format(n.gv1, 4)} und ∂L/∂v2 ist ${format(n.gv2, 4)}; in der versteckten Schicht bleibt ∂L/∂w11 = ${format(n.gw11, 4)} und ∂L/∂w22 = ${format(n.gw22, 4)}.`,
        saettigt(n)
          ? "Mindestens ein verstecktes Neuron ist gesättigt: seine Ableitung ist fast null, deshalb fällt der Gradient dort kaum noch ins Gewicht."
          : `Der größte Gradient der Ausgabeschicht ist ${format(faktor)} mal so groß wie der größte der versteckten Schicht - nach hinten wird der Einfluss kleiner.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const n0 = netzwerte(before);
    const n1 = netzwerte(after);
    const change = compareValues(n0.verlust, n1.verlust, 1e-9);
    if (change === "down") {
      events.push({ name: "lossDecreased", severity: "info", value: n1.verlust });
    }
    if (change === "up") {
      events.push({ name: "lossIncreased", severity: "info", value: n1.verlust });
    }
    if (n1.verlust < 1e-3) {
      events.push({ name: "converged", severity: "notable", value: n1.verlust });
    }
    if (saettigt(n1)) events.push({ name: "saettigung", severity: "warning" });
    const faktor = schrumpffaktor(n1);
    if (Number.isFinite(faktor) && faktor >= 3) {
      events.push({ name: "gradientShrinks", severity: "info", value: faktor });
    }
    return events;
  },
};
