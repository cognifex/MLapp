/**
 * LEK-17 Aktivierungen: ReLU, Sigmoid, Tanh und GELU als Funktionen vergleichen.
 *
 * Dieses Modul ist die einzige Quelle für die vier Aktivierungsfunktionen und ihre Ableitungen.
 * LEK-15 (exp-neuron) und LEK-16 (exp-mlp) verwenden dieselben Funktionen – so können die
 * Lektionen nicht auseinanderlaufen.
 *
 * GELU wird als tanh-Näherung gerechnet, weil JavaScript kein Math.erf kennt. An der Stelle null
 * liefert die Näherung exakt null; gegenüber der genauen GELU weicht sie um höchstens 0,00048 ab
 * (nachgerechnet über x von minus zehn bis zehn, größte Abweichung bei x = -2,6989).
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type AktivierungKey = "relu" | "sigmoid" | "tanh" | "gelu";

export const AKTIVIERUNG_OPTIONEN: { value: AktivierungKey; label: string }[] = [
  { value: "relu", label: "ReLU" },
  { value: "sigmoid", label: "Sigmoid" },
  { value: "tanh", label: "Tanh" },
  { value: "gelu", label: "GELU" },
];

export const AKTIVIERUNG_LABEL: Record<AktivierungKey, string> = {
  relu: "ReLU",
  sigmoid: "Sigmoid",
  tanh: "Tanh",
  gelu: "GELU",
};

const AKTIVIERUNG_FARBE: Record<AktivierungKey, string> = {
  relu: "#d93025",
  sigmoid: "#1a73e8",
  tanh: "#188038",
  gelu: "#8430ce",
};

const GELU_K = Math.sqrt(2 / Math.PI);
const GELU_A = 0.044715;

/** ReLU: positive Werte bleiben stehen, negative werden zu null. */
export function relu(z: number): number {
  return z > 0 ? z : 0;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function tanh(z: number): number {
  return Math.tanh(z);
}

/** GELU als tanh-Näherung: 0,5 z (1 + tanh(k (z + 0,044715 z³))). */
export function gelu(z: number): number {
  const u = GELU_K * (z + GELU_A * z ** 3);
  return 0.5 * z * (1 + Math.tanh(u));
}

export function aktivierung(key: AktivierungKey, z: number): number {
  switch (key) {
    case "relu":
      return relu(z);
    case "sigmoid":
      return sigmoid(z);
    case "tanh":
      return tanh(z);
    case "gelu":
      return gelu(z);
  }
}

/**
 * Ableitung der Aktivierung – die Steigung, die beim Lernen gebraucht wird.
 * Bei ReLU ist die Stelle null nicht eindeutig; dort wird null angezeigt und im Text gesagt.
 */
export function aktivierungAbleitung(key: AktivierungKey, z: number): number {
  switch (key) {
    case "relu":
      return z > 0 ? 1 : 0;
    case "sigmoid": {
      const s = sigmoid(z);
      return s * (1 - s);
    }
    case "tanh": {
      const t = tanh(z);
      return 1 - t * t;
    }
    case "gelu": {
      const u = GELU_K * (z + GELU_A * z ** 3);
      const ableitungU = GELU_K * (1 + 3 * GELU_A * z * z);
      const t = Math.tanh(u);
      return 0.5 * (1 + t) + 0.5 * z * (1 - t * t) * ableitungU;
    }
  }
}

export function istAktivierungKey(v: unknown): v is AktivierungKey {
  return v === "relu" || v === "sigmoid" || v === "tanh" || v === "gelu";
}

/** Zeichenbereich: rechts bis zwei, links bis minus vier – dort sieht man das Sperren und Sättigen. */
export const X_RANGE: [number, number] = [-4, 2];
const Y_RANGE: [number, number] = [-1.2, 2.4];
const SCHRITTE = 240;

function curveOf(key: AktivierungKey, dashed: boolean): Curve {
  const points: [number, number][] = [];
  for (let i = 0; i <= SCHRITTE; i += 1) {
    const x = X_RANGE[0] + ((X_RANGE[1] - X_RANGE[0]) * i) / SCHRITTE;
    points.push([x, aktivierung(key, x)]);
  }
  return { label: AKTIVIERUNG_LABEL[key], points, dashed, color: AKTIVIERUNG_FARBE[key] };
}

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function keyOf(state: ExperimentState): AktivierungKey {
  const v = state["funktion"];
  return istAktivierungKey(v) ? v : "relu";
}

function format(n: number, digits = 4): string {
  return n.toFixed(digits).replace(".", ",");
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
      "ReLU ist an dieser Stelle gesperrt: der Wert ist null und die Steigung ist null. Negative Eingaben kommen hier nicht durch.",
  },
]);

export const aktivierungen: Experiment = {
  id: "exp-aktivierungen",
  title: "ReLU, Sigmoid, Tanh und GELU im Vergleich",
  learningGoal: "Die vier Aktivierungsfunktionen in Form, Wertebereich und Steigung unterscheiden",
  instructions:
    "Ziehe den Regler x und wähle eine Funktion aus. Der Punkt sitzt auf der gewählten Kurve; alle vier Kurven bleiben sichtbar, die gewählte ist durchgezogen.",
  spokenDescription:
    "Ein Koordinatensystem mit vier Kurven: ReLU, Sigmoid, Tanh und GELU. Ein Punkt lässt sich mit dem Regler x verschieben " +
    "und sitzt auf der ausgewählten Kurve. Daneben stehen die Werte aller vier Funktionen an dieser Stelle und die Steigung der gewählten.",
  controls: [
    {
      kind: "select",
      id: "funktion",
      label: "Aktivierung",
      options: AKTIVIERUNG_OPTIONEN,
      initial: "relu",
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
  initialState: { funktion: "relu", x: 1 },
  update(state, action) {
    if (action.type === "reset") return { funktion: "relu", x: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const key = keyOf(state);
    const x = value(state, "x", 1);
    const a = aktivierung(key, x);
    const steigung = aktivierungAbleitung(key, x);
    const mark: Mark = {
      label: `${AKTIVIERUNG_LABEL[key]} an x = ${format(x, 2)}`,
      x,
      y: a,
      color: AKTIVIERUNG_FARBE[key],
    };

    const saetze = [
      `An der Stelle x gleich ${format(x, 2)} liefert ReLU ${format(relu(x))}, Sigmoid ${format(
        sigmoid(x),
      )}, Tanh ${format(tanh(x))} und GELU ${format(gelu(x))}.`,
      `Die gewählte Funktion ${AKTIVIERUNG_LABEL[key]} hat dort den Wert ${format(
        a,
      )} und die Steigung ${format(steigung)}.`,
    ];

    if (key === "relu") {
      saetze.push(
        x < 0
          ? "An dieser Stelle ist ReLU gesperrt: der Wert ist null, die Steigung ebenfalls. Nur positive Eingaben kommen durch."
          : "ReLU lässt positive Werte unverändert stehen und schneidet alles Negative auf null ab.",
      );
    } else if (key === "sigmoid") {
      saetze.push(
        "Sigmoid bleibt immer zwischen null und eins. Je weiter x nach außen wandert, desto flacher wird sie.",
      );
    } else if (key === "tanh") {
      saetze.push(
        "Tanh liegt zwischen minus eins und eins und ist um die null steiler als Sigmoid.",
      );
    } else {
      saetze.push(
        "GELU verhält sich für große Werte fast wie ReLU und geht für kleine Werte weich gegen null – die Nahtstelle ist glatt.",
      );
    }

    if (key === "relu" && x === 0) {
      saetze.push(
        "Genau an der Stelle null ist die Steigung von ReLU nicht eindeutig; links davon ist sie null, rechts davon eins.",
      );
    } else if (key !== "relu" && Math.abs(steigung) < 0.05) {
      saetze.push(
        `Die Steigung ist hier mit ${format(steigung)} fast null: die Kurve ist gesättigt, ein Lernschritt würde kaum etwas bewegen.`,
      );
    }

    return {
      values: [
        { label: "x", value: x, digits: 2 },
        { label: "ReLU(x)", value: relu(x), digits: 4 },
        { label: "Sigmoid(x)", value: sigmoid(x), digits: 4 },
        { label: "Tanh(x)", value: tanh(x), digits: 4 },
        { label: "GELU(x)", value: gelu(x), digits: 4 },
        { label: "Steigung der gewählten Funktion", value: steigung, digits: 4 },
      ],
      drawing: {
        kind: "function-plot",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        curves: AKTIVIERUNG_OPTIONEN.map((o) => curveOf(o.value, o.value !== key)),
        marks: [mark],
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const key = keyOf(after);
    const x = value(after, "x", 1);
    const steigung = aktivierungAbleitung(key, x);
    const vorher = aktivierungAbleitung(keyOf(before), value(before, "x", 1));

    if (key === "relu" && x < 0) events.push({ name: "reluBlocked", severity: "info" });
    if (key !== "relu" && Math.abs(steigung) < 0.05) {
      events.push({ name: "activationSaturated", severity: "notable", value: steigung });
    }

    const richtung = compareValues(Math.abs(vorher), Math.abs(steigung), 0.01);
    if (richtung === "up") events.push({ name: "steepening", severity: "info" });
    if (richtung === "down") events.push({ name: "flattening", severity: "info" });
    return events;
  },
};
