/**
 * LEK-30 Softmax: aus Logits eine Wahrscheinlichkeitsverteilung machen, Temperatur als Schärferegler.
 *
 * Rechenkern: p_i = exp((z_i - z_max) / T) / Summe über j von exp((z_j - z_max) / T).
 * Das Abziehen des größten Logits ist nur ein Rechentrick gegen Überlauf: exp(z - z_max) ist
 * proportional zu exp(z), also bleibt die Verteilung dieselbe.
 *
 * Zahlen, Sätze und Säulen entstehen aus derselben Rechnung - wie überall im Kurs.
 */
import type { Calculated } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/**
 * Wahrscheinlichkeitsverteilung aus Logits. Die Temperatur T > 0 steuert die Schärfe:
 * T nahe null macht die Verteilung spitz (fast eine Eins-Entscheidung), großes T flach.
 */
export function softmaxMitTemperatur(logits: number[], temperatur: number): number[] {
  if (logits.length === 0) return [];
  const t = Math.max(1e-3, temperatur);
  const groesster = Math.max(...logits);
  const gewichte = logits.map((z) => Math.exp((z - groesster) / t));
  const gesamt = gewichte.reduce((a, b) => a + b, 0);
  return gewichte.map((g) => g / gesamt);
}

/** Entropie einer Verteilung in nat: H = -Summe über i von p_i mal ln p_i. */
export function entropie(verteilung: number[]): number {
  let akkumuliert = 0;
  for (const p of verteilung) {
    if (p > 0) akkumuliert += p * Math.log(p);
  }
  return -akkumuliert;
}

/** Wahrscheinlichkeitssumme einer Verteilung - bei Softmax immer eins. */
export function summe(verteilung: number[]): number {
  return verteilung.reduce((a, b) => a + b, 0);
}

const KLASSEN = ["A", "B", "C"];

const START: ExperimentState = { z1: 2, z2: 1, z3: 0, temperatur: 1 };

function zahl(state: ExperimentState, id: string, ersatz: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : ersatz;
}

/** Die drei Logits aus dem Zustand - an einer Stelle, damit Rechnung und Zeichnung dasselbe nutzen. */
export function logitsOf(state: ExperimentState): number[] {
  return [zahl(state, "z1", 2), zahl(state, "z2", 1), zahl(state, "z3", 0)];
}

export function temperaturOf(state: ExperimentState): number {
  return Math.max(0.2, zahl(state, "temperatur", 1));
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Deutsche Aufzählung einer Zahlenliste: "0,6652 | 0,2447 | 0,0900". */
function liste(werte: number[], digits: number): string {
  return werte.map((w) => format(w, digits)).join(" | ");
}

registerRules([
  {
    name: "softmaxSchaerfer",
    explain: (e) =>
      `Die Temperatur sinkt auf ${formatValue(e.value ?? 0)}: die Verteilung wird schärfer, eine Klasse zieht Masse an.`,
  },
  {
    name: "softmaxFlacher",
    explain: (e) =>
      `Die Temperatur steigt auf ${formatValue(e.value ?? 0)}: die Verteilung wird flacher, die Klassen rücken zusammen.`,
  },
  {
    name: "softmaxFastGleichverteilt",
    explain: (e) =>
      `Die größte Wahrscheinlichkeit ist nur ${formatValue(e.value ?? 0, 3)}: das ist fast eine Gleichverteilung, die Entropie ist hoch.`,
  },
]);

export const softmax: Experiment = {
  id: "exp-softmax",
  title: "Logits, Temperatur und Wahrscheinlichkeiten",
  learningGoal: "Softmax als Rechenschritt von Logits zu Wahrscheinlichkeiten verstehen",
  instructions:
    "Verändere die drei Logits und danach die Temperatur. Beobachte, wie sich die Säulen verschieben und wie sich die Entropie ändert.",
  spokenDescription:
    "Drei Regler für die Logits der Klassen A, B und C und ein vierter Regler für die Temperatur. " +
    "Darunter ein Säulendiagramm mit den drei Wahrscheinlichkeiten. Daneben stehen die Summe der Wahrscheinlichkeiten, " +
    "die Entropie und die größte Wahrscheinlichkeit. Eine kleine Temperatur macht die größte Säule hoch und die anderen klein, " +
    "eine große Temperatur lässt die drei Säulen auf gleiche Höhe zusammenrücken.",
  controls: [
    {
      kind: "slider",
      id: "z1",
      label: "Logit der Klasse A",
      min: -4,
      max: 4,
      step: 0.1,
      initial: 2,
    },
    {
      kind: "slider",
      id: "z2",
      label: "Logit der Klasse B",
      min: -4,
      max: 4,
      step: 0.1,
      initial: 1,
    },
    {
      kind: "slider",
      id: "z3",
      label: "Logit der Klasse C",
      min: -4,
      max: 4,
      step: 0.1,
      initial: 0,
    },
    {
      kind: "slider",
      id: "temperatur",
      label: "Temperatur T",
      min: 0.2,
      max: 2,
      step: 0.1,
      initial: 1,
    },
  ],
  initialState: { ...START },
  update(state, action) {
    if (action.type === "reset") return { ...START };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const logits = logitsOf(state);
    const temperatur = temperaturOf(state);
    const p = softmaxMitTemperatur(logits, temperatur);
    const summeP = summe(p);
    const H = entropie(p);
    const groessteP = Math.max(...p);
    const groessteStelle = p.indexOf(groessteP);

    return {
      values: [
        { label: "Summe der Wahrscheinlichkeiten", value: summeP, digits: 6 },
        { label: "Entropie", value: H, digits: 4, unit: "nat" },
        { label: "Größte Wahrscheinlichkeit", value: groessteP, digits: 4 },
      ],
      drawing: {
        kind: "bars",
        items: p.map((wert, i) => ({
          label: `Klasse ${KLASSEN[i] ?? "?"}`,
          value: wert,
          highlighted: i === groessteStelle,
        })),
        yMax: 1,
      },
      sentences: [
        `Die Logits ${liste(logits, 2)} werden bei der Temperatur ${format(temperatur, 2)} zu den Wahrscheinlichkeiten ${liste(p, 4)}.`,
        `Die Summe der Wahrscheinlichkeiten ist ${format(summeP, 6)}: Softmax liefert immer eine Verteilung.`,
        `Die Entropie beträgt ${format(H, 4)} nat, die größte Wahrscheinlichkeit ${format(groessteP, 4)}.`,
        temperatur < 1
          ? "Eine Temperatur unter eins schärft die Verteilung: die größte Klasse zieht Masse an, die Entropie sinkt."
          : temperatur > 1
            ? "Eine Temperatur über eins macht die Verteilung flacher: die Klassen rücken zusammen, die Entropie steigt."
            : "Bei der Temperatur eins steht die Verteilung so, wie die Logits sie vorgeben.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const t0 = temperaturOf(before);
    const t1 = temperaturOf(after);
    const p1 = softmaxMitTemperatur(logitsOf(after), t1);
    const groessteP = p1.length > 0 ? Math.max(...p1) : 1;
    const events: SemanticEvent[] = [];
    if (t1 < t0 - 1e-9) {
      events.push({ name: "softmaxSchaerfer", severity: "info", value: t1 });
    } else if (t1 > t0 + 1e-9) {
      events.push({ name: "softmaxFlacher", severity: "info", value: t1 });
    }
    if (groessteP < 0.34) {
      events.push({ name: "softmaxFastGleichverteilt", severity: "notable", value: groessteP });
    }
    return events;
  },
};
