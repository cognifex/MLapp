/**
 * LEK-16 MLP: Datenfluss durch mehrere Schichten schrittweise ansehen.
 *
 * Das Netz ist fest verdrahtet (2 → 3 → 2 → 1), die Gewichte stehen als Konstanten im Modul:
 * So bleibt der Vorwärtslauf nachvollziehbar und jede Zahl nachrechenbar. Versteckte Schichten
 * rechnen mit ReLU, die Ausgabeschicht ist linear.
 *
 *     x (2)  →  h1 (3, ReLU)  →  h2 (2, ReLU)  →  y (1, linear)
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import { relu } from "./exp-aktivierungen.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Gewichte der ersten Schicht: drei Einheiten, je zwei Eingaben. */
export const W1: [number, number][] = [
  [0.8, -1.2],
  [-1.0, 0.6],
  [0.5, -0.9],
];
export const B1: number[] = [0.1, -0.2, 0.3];

/** Gewichte der zweiten Schicht: zwei Einheiten, je drei Eingaben. */
export const W2: [number, number, number][] = [
  [1.0, -0.5, 0.7],
  [-0.6, 0.9, 0.2],
];
export const B2: number[] = [0.05, -0.15];

/** Gewichte der Ausgabeschicht: eine Einheit, zwei Eingaben, linear. */
export const W3: [number, number] = [1.1, -0.8];
export const B3 = 0.2;

export type SchichtKey = "eingabe" | "versteckt1" | "versteckt2" | "ausgabe";

export const SCHICHT_OPTIONEN: { value: SchichtKey; label: string }[] = [
  { value: "eingabe", label: "Eingabe (2 Einheiten)" },
  { value: "versteckt1", label: "Versteckte Schicht 1 (3 Einheiten)" },
  { value: "versteckt2", label: "Versteckte Schicht 2 (2 Einheiten)" },
  { value: "ausgabe", label: "Ausgabe (1 Einheit)" },
];

export type Vorwaerts = {
  x: [number, number];
  /** Gewichtete Summen der ersten versteckten Schicht (vor ReLU). */
  z1: number[];
  /** Aktivierungen der ersten versteckten Schicht (nach ReLU). */
  a1: number[];
  z2: number[];
  a2: number[];
  /** Ausgabe der letzten Schicht, linear gerechnet. */
  y: number;
};

/** Vorwärtslauf: derselbe Weg, den die Lektion Schritt für Schritt zeigt. */
export function vorwaerts(x1: number, x2: number): Vorwaerts {
  const z1 = W1.map(([w1, w2], i) => w1 * x1 + w2 * x2 + (B1[i] ?? 0));
  const a1 = z1.map(relu);
  const z2 = W2.map((w, i) => {
    const aus1 = w[0] * (a1[0] ?? 0);
    const aus2 = w[1] * (a1[1] ?? 0);
    const aus3 = w[2] * (a1[2] ?? 0);
    return aus1 + aus2 + aus3 + (B2[i] ?? 0);
  });
  const a2 = z2.map(relu);
  const y = W3[0] * (a2[0] ?? 0) + W3[1] * (a2[1] ?? 0) + B3;
  return { x: [x1, x2], z1, a1, z2, a2, y };
}

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function istSchichtKey(v: unknown): v is SchichtKey {
  return v === "eingabe" || v === "versteckt1" || v === "versteckt2" || v === "ausgabe";
}

function schichtOf(state: ExperimentState): SchichtKey {
  const v = state["schicht"];
  return istSchichtKey(v) ? v : "versteckt1";
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

function liste(werte: number[], digits = 3): string {
  const texte = werte.map((w) => format(w, digits));
  if (texte.length === 0) return "keine";
  if (texte.length === 1) return texte[0] ?? "";
  return `${texte.slice(0, -1).join(", ")} und ${texte[texte.length - 1] ?? ""}`;
}

function einheitenText(n: number): string {
  if (n === 0) return "keine Einheit";
  if (n === 1) return "eine Einheit";
  return `${n} Einheiten`;
}

function schichtWerte(v: Vorwaerts, schicht: SchichtKey): number[] {
  switch (schicht) {
    case "eingabe":
      return [...v.x];
    case "versteckt1":
      return v.a1;
    case "versteckt2":
      return v.a2;
    case "ausgabe":
      return [v.y];
  }
}

/** Säulen der gewählten Schicht; der Umriss ist die gewichtete Summe vor der Aktivierung. */
function barItems(v: Vorwaerts, schicht: SchichtKey): Bar[] {
  switch (schicht) {
    case "eingabe":
      return [
        { label: "x₁", value: v.x[0], color: v.x[0] < 0 ? "#d93025" : "#1a73e8" },
        { label: "x₂", value: v.x[1], color: v.x[1] < 0 ? "#d93025" : "#1a73e8" },
      ];
    case "versteckt1":
      return v.a1.map((a, i) => ({
        label: `Einheit ${i + 1}`,
        value: a,
        ghost: v.z1[i] ?? 0,
        color: a > 0 ? "#1a73e8" : "#5f6368",
        highlighted: a > 0,
      }));
    case "versteckt2":
      return v.a2.map((a, i) => ({
        label: `Einheit ${i + 1}`,
        value: a,
        ghost: v.z2[i] ?? 0,
        color: a > 0 ? "#8430ce" : "#5f6368",
        highlighted: a > 0,
      }));
    case "ausgabe":
      return [{ label: "y", value: v.y, color: "#188038", highlighted: true }];
  }
}

registerRules([
  {
    name: "unitClipped",
    explain: () =>
      "Eine Einheit der ersten versteckten Schicht liegt im negativen Bereich: ReLU setzt ihre Aktivierung auf null, sie gibt nichts an die nächste Schicht weiter.",
  },
  {
    name: "unitAwake",
    explain: () =>
      "Eine Einheit der ersten versteckten Schicht ist wieder aktiv: ihre Aktivierung ist größer als null und sie trägt wieder zur nächsten Schicht bei.",
  },
]);

export const mlp: Experiment = {
  id: "exp-mlp",
  title: "Datenfluss durch ein kleines Netz",
  learningGoal:
    "Verfolgen, wie Eingaben durch mehrere Schichten laufen und wie ReLU einzelne Einheiten abschaltet",
  instructions:
    "Wähle eine Schicht aus und stelle die beiden Eingaben ein. Die Säulen zeigen die Werte dieser Schicht; der Umriss zeigt die gewichtete Summe vor der Aktivierung.",
  spokenDescription:
    "Ein kleines Netz mit zwei Eingaben, zwei versteckten Schichten und einer Ausgabe. " +
    "Mit dem Schalter wählt man die Schicht, deren Werte als Säulen erscheinen. " +
    "Die Zahl der Ausgabeschicht steht immer daneben, der Umriss einer Säule zeigt die gewichtete Summe vor der Aktivierung.",
  controls: [
    {
      kind: "slider",
      id: "x1",
      label: "x₁: erste Eingabe",
      min: -2,
      max: 2,
      step: 0.1,
      initial: 1,
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
      kind: "select",
      id: "schicht",
      label: "Schicht",
      options: SCHICHT_OPTIONEN,
      initial: "versteckt1",
    },
  ],
  initialState: { x1: 1, x2: 0.5, schicht: "versteckt1" },
  update(state, action) {
    if (action.type === "reset") return { x1: 1, x2: 0.5, schicht: "versteckt1" };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const x1 = value(state, "x1", 1);
    const x2 = value(state, "x2", 0.5);
    const schicht = schichtOf(state);
    const v = vorwaerts(x1, x2);
    const werte = schichtWerte(v, schicht);
    const summe = werte.reduce((a, b) => a + Math.abs(b), 0);
    const groesste = werte.length > 0 ? Math.max(...werte) : 0;
    const abgeschnitten1 = v.z1.filter((z) => z < 0).length;
    const abgeschnitten2 = v.z2.filter((z) => z < 0).length;

    const saetze = [
      `Die Eingabe ist x₁ = ${format(x1)} und x₂ = ${format(x2)}.`,
      `Erste versteckte Schicht: die gewichteten Summen sind ${liste(v.z1)}, ReLU macht daraus ${liste(
        v.a1,
      )}.`,
      `Zweite versteckte Schicht rechnet mit ${liste(v.a1)} und liefert die Aktivierungen ${liste(
        v.a2,
      )}.`,
      `Die Ausgabe der letzten Schicht ist y = ${format(v.y, 3)}.`,
    ];

    if (abgeschnitten1 + abgeschnitten2 === 0) {
      saetze.push(
        "Keine gewichtete Summe ist negativ: ReLU ändert in diesem Durchlauf nichts, alle Einheiten tragen bei.",
      );
    } else {
      saetze.push(
        `ReLU schneidet ab: ${einheitenText(abgeschnitten1)} in der ersten und ${einheitenText(
          abgeschnitten2,
        )} in der zweiten versteckten Schicht liefern null, weil ihre gewichtete Summe negativ ist.`,
      );
    }

    return {
      values: [
        { label: "Ausgabe y", value: v.y, digits: 3 },
        { label: "Einheiten in der Schicht", value: werte.length, digits: 0 },
        { label: "Summe der Beträge in der Schicht", value: summe, digits: 3 },
        { label: "Größte Aktivierung in der Schicht", value: groesste, digits: 3 },
      ],
      drawing: { kind: "bars", items: barItems(v, schicht) },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const vorher = vorwaerts(value(before, "x1", 1), value(before, "x2", 0.5));
    const nachher = vorwaerts(value(after, "x1", 1), value(after, "x2", 0.5));
    const stillVorher = vorher.z1.filter((z) => z < 0).length;
    const stillNachher = nachher.z1.filter((z) => z < 0).length;

    if (stillNachher > stillVorher) {
      events.push({ name: "unitClipped", severity: "notable", value: stillNachher });
    } else if (stillNachher < stillVorher) {
      events.push({ name: "unitAwake", severity: "info", value: stillNachher });
    }
    return events;
  },
};
