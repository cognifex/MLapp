/**
 * LEK-33 Sprachmodelltraining: ein Gradientenschritt auf der Ausgabe eines Sprachmodells.
 *
 * Rechenkern: das Modell gibt drei Logits aus. Der Softmax daraus ergibt die Verteilung des
 * nächsten Tokens. Für das richtige Token (Ziel) wird die Kreuzentropie gerechnet:
 * L = -ln p_ziel. Ihr Gradient nach den Logits ist einfach p_i - y_i, wobei y für das Ziel-Token
 * eins ist und sonst null. Ein Schritt zieht die Logits in die Gegenrichtung:
 * z_i wird zu z_i - Lernrate mal (p_i - y_i).
 *
 * Das ist derselbe Abstieg wie auf jeder Verlustfläche - nur ist die Fläche hier die
 * Kreuzentropie des Ziel-Tokens. Alles, was angezeigt wird, entsteht aus dieser Rechnung.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import { softmaxMitTemperatur } from "./exp-softmax.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Die Kandidaten des nächsten Tokens in fester Reihenfolge. */
export const TOKENS: string[] = ["bellen", "laufen", "schlafen"];

/** Logits vor dem Training: "bellen" liegt vorn, ist aber nicht sicher. */
export const START_LOGITS: number[] = [1, 0.5, 0];

/** Verteilung des nächsten Tokens zu gegebenen Logits. */
export function verteilungAus(logits: number[]): number[] {
  return softmaxMitTemperatur(logits, 1);
}

/** Kreuzentropie des Ziel-Tokens: L = -ln p_ziel, in nat. */
export function kreuzentropie(verteilung: number[], zielIndex: number): number {
  const p = verteilung[zielIndex] ?? 0;
  return -Math.log(Math.max(1e-12, p));
}

/** Ein Gradientenschritt: z_i wird um Lernrate mal (p_i - y_i) verschoben. */
export function einSchritt(logits: number[], zielIndex: number, lernrate: number): number[] {
  const p = verteilungAus(logits);
  return logits.map((z, i) => {
    const y = i === zielIndex ? 1 : 0;
    return z - lernrate * ((p[i] ?? 0) - y);
  });
}

/** Mehrere Schritte hintereinander - das ist die Trainingsschleife. */
export function mehrereSchritte(
  logits: number[],
  zielIndex: number,
  lernrate: number,
  anzahl: number,
): number[] {
  let aktuell = [...logits];
  const runden = Math.max(0, Math.round(anzahl));
  for (let s = 0; s < runden; s += 1) {
    aktuell = einSchritt(aktuell, zielIndex, lernrate);
  }
  return aktuell;
}

/** Stelle des größten Werts einer Verteilung. */
function vornIndexOf(werte: number[]): number {
  let stelle = 0;
  for (let i = 1; i < werte.length; i += 1) {
    if ((werte[i] ?? 0) > (werte[stelle] ?? 0)) stelle = i;
  }
  return stelle;
}

function zahl(state: ExperimentState, id: string, ersatz: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : ersatz;
}

export function zielIndexOf(state: ExperimentState): number {
  const v = state["ziel"];
  const stelle = typeof v === "string" ? TOKENS.indexOf(v) : -1;
  return stelle >= 0 ? stelle : 0;
}

export function lernrateOf(state: ExperimentState): number {
  return Math.min(1, Math.max(0.05, zahl(state, "lernrate", 0.5)));
}

export function schritteOf(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "schritte", 1));
  return Math.min(20, Math.max(1, roh));
}

export function zielVerteilungOf(state: ExperimentState): number[] {
  const ziel = zielIndexOf(state);
  const logits = mehrereSchritte(START_LOGITS, ziel, lernrateOf(state), schritteOf(state));
  return verteilungAus(logits);
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "trainingErreicht",
    explain: () =>
      "Die Kreuzentropie des Ziel-Tokens liegt nahe bei null: das Modell sagt das Ziel fast sicher voraus.",
  },
]);

export const sprachmodelltraining: Experiment = {
  id: "exp-sprachmodelltraining",
  title: "Ein Update für das Sprachmodell",
  learningGoal: "Kreuzentropie und einen Gradientenschritt auf den Logits nachvollziehen",
  instructions:
    "Wähle das Ziel-Token und stelle Lernrate und Anzahl der Schritte ein. Beobachte, wie sich die Verteilung und die Kreuzentropie ändern.",
  spokenDescription:
    "Ein Säulendiagramm mit drei Tokens. Die gefüllte Säule ist die Verteilung nach dem Update, " +
    "der gestrichelte Umriss darunter die Verteilung davor. Das Ziel-Token ist hervorgehoben. " +
    "Drei Regler: die Lernrate, die Anzahl der Schritte und ein Auswahlfeld für das Ziel-Token. " +
    "Daneben stehen die Kreuzentropie vor und nach dem Update und ihre Verringerung.",
  controls: [
    {
      kind: "select",
      id: "ziel",
      label: "Ziel-Token",
      options: [
        { value: "bellen", label: "bellen" },
        { value: "laufen", label: "laufen" },
        { value: "schlafen", label: "schlafen" },
      ],
      initial: "bellen",
    },
    {
      kind: "slider",
      id: "lernrate",
      label: "Lernrate",
      min: 0.05,
      max: 1,
      step: 0.05,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "schritte",
      label: "Anzahl der Schritte",
      min: 1,
      max: 20,
      step: 1,
      initial: 1,
    },
  ],
  initialState: { ziel: "bellen", lernrate: 0.5, schritte: 1 },
  update(state, action) {
    if (action.type === "reset") return { ziel: "bellen", lernrate: 0.5, schritte: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const zielIndex = zielIndexOf(state);
    const lernrate = lernrateOf(state);
    const anzahl = schritteOf(state);
    const vorher = verteilungAus(START_LOGITS);
    const nachher = zielVerteilungOf(state);
    const ceVorher = kreuzentropie(vorher, zielIndex);
    const ceNachher = kreuzentropie(nachher, zielIndex);
    const verbesserung = ceVorher - ceNachher;
    const zielToken = TOKENS[zielIndex] ?? "";
    const pZielVorher = vorher[zielIndex] ?? 0;
    const pZielNachher = nachher[zielIndex] ?? 0;
    const stelleVorn = vornIndexOf(vorher);
    const vornVorher = TOKENS[stelleVorn] ?? "";
    const pVornVorher = vorher[stelleVorn] ?? 0;

    const items: Bar[] = TOKENS.map((token, i) => ({
      label: token,
      value: nachher[i] ?? 0,
      ghost: vorher[i] ?? 0,
      highlighted: i === zielIndex,
    }));

    return {
      values: [
        { label: "Kreuzentropie vorher", value: ceVorher, digits: 4, unit: "nat" },
        { label: "Kreuzentropie nachher", value: ceNachher, digits: 4, unit: "nat" },
        { label: "Verringerung", value: verbesserung, digits: 4, unit: "nat" },
        { label: "Wahrscheinlichkeit des Ziel-Tokens nachher", value: pZielNachher, digits: 4 },
      ],
      drawing: { kind: "bars", items, yMax: 1, horizontal: true },
      sentences: [
        `Vor dem Update liegt ${vornVorher} vorn, und zwar mit der Wahrscheinlichkeit ${format(pVornVorher, 4)}.`,
        `Ziel-Token ist ${zielToken}: seine Kreuzentropie ist minus Logarithmus naturalis von ${format(pZielVorher, 4)}, also ${format(ceVorher, 4)} nat.`,
        `Nach ${anzahl} Schritten bei der Lernrate ${format(lernrate, 2)} beträgt sie ${format(ceNachher, 4)} nat, die Wahrscheinlichkeit des Ziel-Tokens ${format(pZielNachher, 4)}.`,
        verbesserung < 0.001
          ? "Der Schritt ändert kaum etwas: dafür ist die Lernrate zu klein."
          : ceNachher < 0.1
            ? "Das Ziel-Token trägt fast die ganze Masse: weitere Schritte bringen hier kaum noch etwas."
            : `Die Verringerung beträgt ${format(verbesserung, 4)} nat; jeder weitere Schritt geht in dieselbe Richtung.`,
      ],
    };
  },
  semanticEvents(_before, after): SemanticEvent[] {
    const zielIndex = zielIndexOf(after);
    const ceVorher = kreuzentropie(verteilungAus(START_LOGITS), zielIndex);
    const ceNachher = kreuzentropie(zielVerteilungOf(after), zielIndex);
    const verbesserung = ceVorher - ceNachher;
    const events: SemanticEvent[] = [];
    if (verbesserung < -1e-6) {
      events.push({ name: "lossIncreased", severity: "warning", value: ceNachher });
    } else if (verbesserung < 0.001) {
      events.push({ name: "converged", severity: "info", value: ceNachher });
    } else {
      events.push({ name: "lossDecreased", severity: "info", value: ceNachher });
    }
    if (ceNachher < 0.05 && verbesserung >= 0.001) {
      events.push({ name: "trainingErreicht", severity: "notable", value: ceNachher });
    }
    return events;
  },
};
