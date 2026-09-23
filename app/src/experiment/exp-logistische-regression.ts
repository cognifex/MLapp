/**
 * LEK-12 Logistische Regression: Sigmoidkurve, Wahrscheinlichkeit und Schwelle einstellen.
 *
 * Rechenkern: z = w·x + b und p = 1 / (1 + e hoch minus z). Aus dem Verlauf von p zwischen null
 * und eins wird eine Entscheidung, sobald eine Schwelle festgelegt ist: p ab der Schwelle gilt
 * als positive Klasse. Die Grenze liegt bei dem x, für das p genau die Schwelle erreicht.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export const X_RANGE: [number, number] = [-3, 3];
export const Y_RANGE: [number, number] = [-0.1, 1.15];

/** Die Sigmoidfunktion: bildet jede reelle Zahl auf einen Wert zwischen null und eins ab. */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Umkehrung der Sigmoidfunktion: der z-Wert, bei dem die Wahrscheinlichkeit p herauskommt. */
export function logit(p: number): number {
  return Math.log(p / (1 - p));
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function formatiere(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "ueberDerSchwelle",
    explain: (e) =>
      `Die Wahrscheinlichkeit ${formatValue(e.value ?? 0, 4)} liegt über der Schwelle: ` +
      "das Modell entscheidet sich für die positive Klasse.",
  },
  {
    name: "unterDerSchwelle",
    explain: (e) =>
      `Die Wahrscheinlichkeit ${formatValue(e.value ?? 0, 4)} liegt unter der Schwelle: ` +
      "das Modell entscheidet sich für die andere Klasse.",
  },
]);

export const logistischeRegression: Experiment = {
  id: "exp-logistische-regression",
  title: "Sigmoid, Wahrscheinlichkeit und Schwelle",
  learningGoal:
    "Die Sigmoidfunktion als Wahrscheinlichkeit lesen und die Schwelle als Entscheidung",
  instructions:
    "Stelle Gewicht und Achsenabschnitt ein, bewege x und verschiebe die Schwelle. Die Anzeige nennt die gewichtete Summe, die Wahrscheinlichkeit und die Stelle, an der die Schwelle erreicht wird.",
  spokenDescription:
    "Ein Koordinatensystem mit einer S-förmigen Kurve, die zwischen null und eins verläuft. Die " +
    "waagerechte gestrichelte Linie ist die Schwelle, der rote Punkt sitzt an der eingestellten Stelle x. " +
    "Gewicht und Achsenabschnitt kippen und verschieben die Kurve, das Gewicht null macht sie waagerecht.",
  controls: [
    {
      kind: "slider",
      id: "gewicht",
      label: "Gewicht w",
      min: -3,
      max: 3,
      step: 0.1,
      initial: 1.5,
    },
    {
      kind: "slider",
      id: "achsenabschnitt",
      label: "Achsenabschnitt b",
      min: -3,
      max: 3,
      step: 0.1,
      initial: -0.5,
    },
    {
      kind: "slider",
      id: "x",
      label: "x: Merkmal",
      min: X_RANGE[0],
      max: X_RANGE[1],
      step: 0.05,
      initial: 1.2,
    },
    {
      kind: "slider",
      id: "schwelle",
      label: "Schwelle",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      initial: 0.5,
    },
  ],
  initialState: { gewicht: 1.5, achsenabschnitt: -0.5, x: 1.2, schwelle: 0.5 },
  update(state, action) {
    if (action.type === "reset") {
      return { gewicht: 1.5, achsenabschnitt: -0.5, x: 1.2, schwelle: 0.5 };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const gewicht = zahl(state, "gewicht", 1.5);
    const achsenabschnitt = zahl(state, "achsenabschnitt", -0.5);
    const x = zahl(state, "x", 1.2);
    const schwelle = zahl(state, "schwelle", 0.5);

    const z = gewicht * x + achsenabschnitt;
    const p = sigmoid(z);
    const steigung = gewicht * p * (1 - p);
    const hatGrenze = Math.abs(gewicht) > 1e-9;
    const grenze = hatGrenze ? (logit(schwelle) - achsenabschnitt) / gewicht : Number.NaN;
    const grenzeImBild = hatGrenze && Math.abs(grenze) <= X_RANGE[1];

    const kurve: Curve = {
      label: "Sigmoidkurve",
      points: Array.from({ length: 241 }, (_, i) => {
        const px = X_RANGE[0] + ((X_RANGE[1] - X_RANGE[0]) * i) / 240;
        return [px, sigmoid(gewicht * px + achsenabschnitt)] as [number, number];
      }),
    };
    const curves: Curve[] = [
      kurve,
      {
        label: "Schwelle",
        dashed: true,
        points: [
          [X_RANGE[0], schwelle],
          [X_RANGE[1], schwelle],
        ],
        color: "#5f6368",
      },
    ];
    if (grenzeImBild) {
      curves.push({
        label: "Grenze",
        dashed: true,
        points: [
          [grenze, 0],
          [grenze, 1],
        ],
        color: "#188038",
      });
    }

    const marks: Mark[] = [{ label: `p = ${formatiere(p, 3)}`, x, y: p, color: "#d93025" }];
    if (grenzeImBild) {
      marks.push({ label: "Grenze", x: grenze, y: schwelle, color: "#188038" });
    }

    return {
      values: [
        { label: "z: gewichtete Summe", value: z, digits: 3 },
        { label: "Wahrscheinlichkeit p", value: p, digits: 4 },
        { label: "Schwelle", value: schwelle, digits: 2 },
        { label: "Steigung von p bei x", value: steigung, digits: 4 },
        ...(hatGrenze ? [{ label: "Grenze bei x", value: grenze, digits: 3 }] : []),
      ],
      drawing: {
        kind: "function-plot",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        curves,
        marks,
      },
      sentences: [
        `An der Stelle x gleich ${formatiere(x)} ist z gleich ${formatiere(z, 3)}. ` +
          `Daraus macht die Sigmoidfunktion die Wahrscheinlichkeit ${formatiere(p, 4)}.`,
        !hatGrenze
          ? "Bei Gewicht null hängt die Wahrscheinlichkeit nicht von x ab: es gibt keine Stelle, an der die Entscheidung kippt."
          : grenzeImBild
            ? `Bei Schwelle ${formatiere(schwelle)} liegt die Grenze bei x gleich ` +
              `${formatiere(grenze, 3)}; dort kippt die Entscheidung.`
            : `Bei Schwelle ${formatiere(schwelle)} läge die Grenze erst bei x gleich ` +
              `${formatiere(grenze, 3)}; das liegt ausserhalb des Bildes.`,
        `Die Steigung der Kurve ist hier ${formatiere(steigung, 4)}: ` +
          "so viel ändert sich die Wahrscheinlichkeit je Einheit von x.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const gewichtVor = zahl(before, "gewicht", 1.5);
    const gewichtNach = zahl(after, "gewicht", 1.5);
    const pVor = sigmoid(
      gewichtVor * zahl(before, "x", 1.2) + zahl(before, "achsenabschnitt", -0.5),
    );
    const pNach = sigmoid(
      gewichtNach * zahl(after, "x", 1.2) + zahl(after, "achsenabschnitt", -0.5),
    );
    const schwelleVor = zahl(before, "schwelle", 0.5);
    const schwelleNach = zahl(after, "schwelle", 0.5);
    const events: SemanticEvent[] = [];
    if (pNach >= schwelleNach && pVor < schwelleVor) {
      events.push({ name: "ueberDerSchwelle", severity: "notable", value: pNach });
    }
    if (pNach < schwelleNach && pVor >= schwelleVor) {
      events.push({ name: "unterDerSchwelle", severity: "notable", value: pNach });
    }
    return events;
  },
};
