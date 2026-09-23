/**
 * LEK-07 Entropie: Wahrscheinlichkeiten verschieben und die Entropie mitrechnen.
 *
 * Rechenkern: H = -Summe über alle Klassen aus p mal Logarithmus zur Basis zwei von p.
 * Die Regler sind Rohgewichte; sie werden erst auf die Summe eins gebracht, damit jeder
 * Reglerstand eine gültige Verteilung ergibt. Alles, was angezeigt wird, entsteht aus dieser
 * einen Rechnung.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Anzahl der Klassen der Verteilung. */
export const KLASSEN = 4;
const KLASSEN_IDS = ["p1", "p2", "p3", "p4"];

const START: ExperimentState = { p1: 0.25, p2: 0.25, p3: 0.25, p4: 0.25 };

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" && Number.isFinite(wert) ? wert : fallback;
}

export function begrenze(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

export function formatiere(wert: number, stellen = 3): string {
  return wert.toFixed(stellen).replace(".", ",");
}

/** Rohgewichte der Regler; negative Werte zählen als null. */
export function rohWerte(state: ExperimentState): number[] {
  return KLASSEN_IDS.map((id) => begrenze(zahl(state, id, 0.25), 0, 1));
}

/** Bringt Rohgewichte auf die Summe eins - bei Summe null gleichmäßig. */
export function normiere(roh: number[]): number[] {
  const sauber = roh.map((wert) => (wert > 0 ? wert : 0));
  let summe = 0;
  for (const wert of sauber) summe += wert;
  if (summe <= 0) return sauber.map(() => 1 / sauber.length);
  return sauber.map((wert) => wert / summe);
}

/** Entropie in Bit: -Summe p log2 p; Klassen mit Anteil null zählen nicht. */
export function entropieVon(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

/** Anteilsskala der Oberfläche: hell bei null, satt bei eins. */
export function anteilsFarbe(anteil: number): string {
  const t = begrenze(anteil, 0, 1);
  const helligkeit = 96 - 52 * t;
  const saettigung = 25 + 60 * t;
  return `hsl(214 ${saettigung}% ${helligkeit}%)`;
}

registerRules([
  {
    name: "entropyIncreased",
    explain: (e) =>
      `Die Entropie steigt auf ${formatiere(e.value ?? 0)} Bit: die Anteile werden gleichmäßiger.`,
  },
  {
    name: "entropyDecreased",
    explain: (e) =>
      `Die Entropie sinkt auf ${formatiere(e.value ?? 0)} Bit: eine Klasse zieht Anteil auf sich.`,
  },
  {
    name: "entropyMaximal",
    explain: (e) =>
      `Die Entropie ist mit ${formatiere(e.value ?? 0)} Bit am Höchstwert: alle vier Klassen sind gleich wahrscheinlich.`,
  },
]);

export const entropie: Experiment = {
  id: "exp-entropie",
  title: "Wahrscheinlichkeiten verschieben und Entropie messen",
  learningGoal: "Entropie als Maß für die Unbestimmtheit einer Verteilung lesen",
  instructions:
    "Schiebe die vier Regler und beobachte, wie sich die Anteile und die Entropie ändern. Die Anteile werden auf die Summe eins gebracht, die Farbe der Säulen folgt dem Anteil.",
  spokenDescription:
    "Ein Säulendiagramm mit vier Klassen. Jede Säule zeigt den Anteil einer Klasse, die Farbe wird mit dem " +
    "Anteil kräftiger. Vier Regler verschieben die Rohgewichte der Klassen; die angezeigten Anteile sind auf die " +
    "Summe eins gebracht. Die Entropie in Bit steht als Zahl daneben: sie ist null, wenn eine Klasse alles " +
    "auf sich zieht, und am größten, wenn alle vier gleich groß sind.",
  controls: KLASSEN_IDS.map((id, i) => ({
    kind: "slider" as const,
    id,
    label: `Rohgewicht der Klasse ${i + 1}`,
    min: 0,
    max: 1,
    step: 0.05,
    initial: 0.25,
  })),
  initialState: { ...START },
  update(state, action) {
    if (action.type === "reset") return { ...START };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const probs = normiere(rohWerte(state));
    const h = entropieVon(probs);
    const wirksameKlassen = 2 ** h;
    const hoechstwert = Math.log2(KLASSEN);
    const anteileText = probs.map((p) => formatiere(p)).join(" | ");
    const staerkster = Math.max(...probs);
    const eindeutigStaerkster = probs.filter((p) => Math.abs(p - staerkster) < 1e-12).length === 1;
    const items: Bar[] = probs.map((anteil, i) => ({
      label: `Klasse ${i + 1}`,
      value: anteil,
      color: anteilsFarbe(anteil),
      highlighted: eindeutigStaerkster && anteil === staerkster,
    }));

    const saetze: string[] = [
      `Die vier Klassen haben die Anteile ${anteileText}.`,
      h >= hoechstwert - 1e-9
        ? `Die Entropie ist ${formatiere(h)} Bit und damit am Höchstwert; gleichmäßiger geht es bei vier Klassen nicht.`
        : `Die Entropie ist ${formatiere(h)} Bit; der Höchstwert bei vier Klassen wäre ${formatiere(hoechstwert)} Bit.`,
      `Die wirksamen Klassen sind ${formatiere(wirksameKlassen, 2)}: so viele gleich wahrscheinliche Klassen hätten dieselbe Entropie.`,
    ];

    return {
      values: [
        ...probs.map((anteil, i) => ({
          label: `Anteil Klasse ${i + 1}`,
          value: anteil,
          digits: 3,
        })),
        { label: "Entropie", value: h, digits: 3, unit: "Bit" },
        { label: "Wirksame Klassen", value: wirksameKlassen, digits: 2 },
        { label: "Höchstwert", value: hoechstwert, digits: 2, unit: "Bit" },
      ],
      drawing: {
        kind: "bars",
        items,
        yMax: 1,
        unit: "Anteil",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const hVorher = entropieVon(normiere(rohWerte(before)));
    const hNachher = entropieVon(normiere(rohWerte(after)));
    const events: SemanticEvent[] = [];
    if (Math.abs(hNachher - Math.log2(KLASSEN)) < 1e-9) {
      events.push({ name: "entropyMaximal", severity: "notable", value: hNachher });
    } else if (hNachher > hVorher + 1e-9) {
      events.push({ name: "entropyIncreased", severity: "info", value: hNachher });
    } else if (hNachher < hVorher - 1e-9) {
      events.push({ name: "entropyDecreased", severity: "info", value: hNachher });
    }
    return events;
  },
};
