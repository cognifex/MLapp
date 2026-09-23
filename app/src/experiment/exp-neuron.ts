/**
 * LEK-15 Neuron: Eingaben, Gewichte, Bias, gewichtete Summe und Aktivierung verfolgen.
 *
 * Rechenkern: z = w₁·x₁ + w₂·x₂ + b und a = Aktivierung(z). Die Säulen zeigen genau die drei
 * Beiträge, die sich zur gewichteten Summe addieren – die Zeichnung ist die Rechnung, nicht ein
 * Bild davon. Die Aktivierungsfunktionen kommen aus exp-aktivierungen (eine Quelle für das ganze
 * Kapitel).
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import {
  AKTIVIERUNG_LABEL,
  AKTIVIERUNG_OPTIONEN,
  aktivierung,
  aktivierungAbleitung,
  istAktivierungKey,
  type AktivierungKey,
} from "./exp-aktivierungen.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Startwerte: eine positive und eine negative Eingabe, damit beide Vorzeichen vorkommen. */
export const START = {
  x1: 1.5,
  x2: 0.5,
  w1: 2,
  w2: -1.5,
  b: 0.5,
  aktivierung: "relu" as AktivierungKey,
};

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function keyOf(state: ExperimentState): AktivierungKey {
  const v = state["aktivierung"];
  return istAktivierungKey(v) ? v : "relu";
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Gewichtete Summe – dieselbe Rechnung wie in calculate(), auch für den Ereignisvergleich. */
function gewichteteSumme(state: ExperimentState): number {
  return (
    value(state, "w1", START.w1) * value(state, "x1", START.x1) +
    value(state, "w2", START.w2) * value(state, "x2", START.x2) +
    value(state, "b", START.b)
  );
}

registerRules([
  {
    name: "activationSaturated",
    explain: () =>
      "Die Aktivierung ist hier gesättigt: die Steigung geht gegen null. Ein Änderungsschritt an der Eingabe bewegt die Ausgabe kaum noch.",
  },
  {
    name: "reluBlocked",
    explain: () =>
      "Die gewichtete Summe ist negativ, deshalb gibt ReLU null zurück. Das Neuron ist an dieser Stelle gesperrt.",
  },
  {
    name: "sumNegative",
    explain: () =>
      "Die gewichtete Summe ist jetzt negativ: die Beiträge ziehen gegeneinander, der größere zieht die Summe unter null.",
  },
  {
    name: "sumPositive",
    explain: () => "Die gewichtete Summe ist jetzt positiv: die Beiträge stützen sich gegenseitig.",
  },
]);

export const neuron: Experiment = {
  id: "exp-neuron",
  title: "Ein Neuron: Beiträge, Summe und Aktivierung",
  learningGoal:
    "Sehen, wie Eingaben mit Gewichten und Bias zur gewichteten Summe werden und was die Aktivierung daraus macht",
  instructions:
    "Stelle Eingaben, Gewichte und Bias ein. Die Säulen zeigen die Beiträge der Eingaben und des Bias; ihre Summe ist die gewichtete Summe. Zum Schluss formt die Aktivierung daraus die Ausgabe.",
  spokenDescription:
    "Zwei Eingaben x eins und x zwei, zwei Gewichte, ein Bias und die Auswahl der Aktivierung. " +
    "Das Säulendiagramm zeigt den Beitrag jeder Eingabe und des Bias zur gewichteten Summe. " +
    "Darunter stehen die gewichtete Summe z und die Aktivierung a.",
  controls: [
    {
      kind: "slider",
      id: "x1",
      label: "x₁: erste Eingabe",
      min: -2,
      max: 2,
      step: 0.1,
      initial: 1.5,
    },
    {
      kind: "slider",
      id: "x2",
      label: "x₂: zweite Eingabe",
      min: -2,
      max: 2,
      step: 0.1,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "w1",
      label: "w₁: Gewicht der ersten Eingabe",
      min: -3,
      max: 3,
      step: 0.1,
      initial: 2,
    },
    {
      kind: "slider",
      id: "w2",
      label: "w₂: Gewicht der zweiten Eingabe",
      min: -3,
      max: 3,
      step: 0.1,
      initial: -1.5,
    },
    { kind: "slider", id: "b", label: "b: Bias", min: -2, max: 2, step: 0.1, initial: 0.5 },
    {
      kind: "select",
      id: "aktivierung",
      label: "Aktivierung",
      options: AKTIVIERUNG_OPTIONEN,
      initial: "relu",
    },
  ],
  initialState: { ...START },
  update(state, action) {
    if (action.type === "reset") return { ...START };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const x1 = value(state, "x1", START.x1);
    const x2 = value(state, "x2", START.x2);
    const w1 = value(state, "w1", START.w1);
    const w2 = value(state, "w2", START.w2);
    const b = value(state, "b", START.b);
    const key = keyOf(state);

    const beitrag1 = w1 * x1;
    const beitrag2 = w2 * x2;
    const z = beitrag1 + beitrag2 + b;
    const a = aktivierung(key, z);
    const steigung = aktivierungAbleitung(key, z);
    const label = AKTIVIERUNG_LABEL[key];

    const items: Bar[] = [
      {
        label: "w₁ · x₁",
        value: beitrag1,
        color: beitrag1 < 0 ? "#d93025" : "#1a73e8",
        highlighted: true,
      },
      {
        label: "w₂ · x₂",
        value: beitrag2,
        color: beitrag2 < 0 ? "#d93025" : "#1a73e8",
        highlighted: true,
      },
      { label: "Bias b", value: b, color: b < 0 ? "#d93025" : "#5f6368" },
      { label: "Summe z", value: z, color: "#188038", highlighted: true },
    ];

    const saetze = [
      `Die erste Eingabe trägt ${format(beitrag1)} zur Summe bei, die zweite ${format(
        beitrag2,
      )}, der Bias ${format(b)}.`,
      `Die gewichtete Summe ist z gleich ${format(z)}.`,
      `Die Aktivierung ${label} macht daraus die Ausgabe a gleich ${format(a)}.`,
    ];

    if (key === "relu") {
      saetze.push(
        z > 0
          ? "ReLU lässt den positiven Wert unverändert stehen; nur eine negative Summe würde auf null gesetzt."
          : "Weil die Summe negativ ist, gibt ReLU null zurück: das Neuron ist an dieser Stelle gesperrt.",
      );
    } else if (key === "sigmoid") {
      saetze.push("Sigmoid quetscht die Summe in den Bereich zwischen null und eins.");
    } else if (key === "tanh") {
      saetze.push("Tanh bildet die Summe auf den Bereich zwischen minus eins und eins ab.");
    } else {
      saetze.push("GELU lässt große positive Summen fast unverändert durch.");
    }

    if (key !== "relu" && Math.abs(steigung) < 0.05) {
      saetze.push(
        `Die Steigung der Aktivierung ist hier mit ${format(steigung, 4)} fast null: das Neuron ist gesättigt und lernt an dieser Stelle kaum.`,
      );
    }

    return {
      values: [
        { label: "Beitrag w₁ · x₁", value: beitrag1, digits: 2 },
        { label: "Beitrag w₂ · x₂", value: beitrag2, digits: 2 },
        { label: "Bias b", value: b, digits: 2 },
        { label: "Gewichtete Summe z", value: z, digits: 2 },
        { label: "Ausgabe a", value: a, digits: 4 },
        { label: "Steigung der Aktivierung", value: steigung, digits: 4 },
      ],
      drawing: { kind: "bars", items },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const key = keyOf(after);
    const z = gewichteteSumme(after);
    const vorher = gewichteteSumme(before);

    if (key === "relu" && z < 0) events.push({ name: "reluBlocked", severity: "info" });
    if (key !== "relu" && Math.abs(aktivierungAbleitung(key, z)) < 0.05) {
      events.push({ name: "activationSaturated", severity: "notable", value: z });
    }
    if (vorher >= 0 && z < 0) events.push({ name: "sumNegative", severity: "notable", value: z });
    if (vorher < 0 && z >= 0) events.push({ name: "sumPositive", severity: "notable", value: z });
    return events;
  },
};
