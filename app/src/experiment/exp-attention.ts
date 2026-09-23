/**
 * LEK-25 Attention: welche Tokens sich auf welche beziehen.
 *
 * Rechenkern: das Gewicht von Token i auf Token j ist die weiche Maximalfunktion (Softmax) über
 * die Skalarprodukte der beiden Einbettungen. Die Einbettungen stehen fest im Code; Gewichte,
 * Zahlen und Zeichnung entstehen aus derselben Rechnung.
 */
import type { Calculated, GridCell, Mark } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Die feste Tokenmenge des Beispielsatzes. */
export const TOKENS: string[] = ["Hund", "Katze", "bellt", "miaut", "der"];

/** Zwei Zahlen je Token: die Einbettung. Inhaltstragende Wörter zeigen deutlich in eine Richtung. */
export const EINBETTUNGEN: number[][] = [
  [1.8, 0.0],
  [0.0, 1.8],
  [1.1, 0.15],
  [0.15, 1.1],
  [0.06, 0.06],
];

export function skalarprodukt(a: number[], b: number[]): number {
  let summe = 0;
  const laenge = Math.min(a.length, b.length);
  for (let i = 0; i < laenge; i += 1) summe += (a[i] ?? 0) * (b[i] ?? 0);
  return summe;
}

/** Weiche Maximalfunktion: macht aus beliebigen Punktzahlen Gewichte, die sich zu eins addieren. */
export function softmax(werte: number[]): number[] {
  if (werte.length === 0) return [];
  const groesster = Math.max(...werte);
  const hoch = werte.map((wert) => Math.exp(wert - groesster));
  const summe = hoch.reduce((a, b) => a + b, 0);
  return hoch.map((wert) => wert / summe);
}

/** Skalarprodukte der Einbettungen, Zeile für Zeile. */
export function punktzahlen(abfrage: number): number[] {
  const eigen = EINBETTUNGEN[abfrage] ?? [];
  return EINBETTUNGEN.map((schluessel) => skalarprodukt(eigen, schluessel));
}

/** Eine Zeile der Attention-Matrix: die Gewichte der Abfrage auf alle Tokens. */
export function gewichteZeile(abfrage: number): number[] {
  return softmax(punktzahlen(abfrage));
}

/** Die ganze Matrix: Zeile = Abfrage, Spalte = Schlüssel. */
export function gewichte(): number[][] {
  return EINBETTUNGEN.map((_, i) => gewichteZeile(i));
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

/** Die Abfrageposition als Zeilenindex von 0 bis 4. */
function abfrageIndex(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "abfrage", 3));
  return Math.min(TOKENS.length, Math.max(1, roh)) - 1;
}

function token(index: number): string {
  return TOKENS[index] ?? "?";
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

function zellen(matrix: number[][]): GridCell[] {
  const cells: GridCell[] = [];
  matrix.forEach((zeile, row) => {
    zeile.forEach((wert, col) => {
      cells.push({ row, col, value: wert, label: format(wert, 2) });
    });
  });
  return cells;
}

export const attention: Experiment = {
  id: "exp-attention",
  title: "Wer schaut auf wen",
  learningGoal: "Die Attention-Matrix lesen: Gewichte deuten und ihre Zeilensumme prüfen",
  instructions:
    "Wähle die Abfrageposition. Der rote Punkt markiert die Zeile der gewählten Abfrage; die Zahlen in den Zellen sind die Gewichte.",
  spokenDescription:
    "Eine Matrix aus fünf mal fünf Zellen. Die Zeilen sind die abfragenden Tokens, die Spalten die Tokens, auf die sich die Abfrage beziehen kann. " +
    "Jede Zelle trägt ihr Gewicht als Zahl, je dunkler die Zelle, desto größer das Gewicht. " +
    "Ein Regler wählt die Abfrage; ein roter Punkt markiert ihre Zeile, und daneben stehen das größte und das kleinste Gewicht dieser Zeile.",
  controls: [
    {
      kind: "slider",
      id: "abfrage",
      label: "Abfrage: welches Token fragt?",
      min: 1,
      max: 5,
      step: 1,
      initial: 3,
    },
  ],
  initialState: { abfrage: 3 },
  update(state, action) {
    if (action.type === "reset") return { abfrage: 3 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const index = abfrageIndex(state);
    const zeile = gewichteZeile(index);
    const groesster = Math.max(...zeile);
    const kleinster = Math.min(...zeile);
    const staerkster = zeile.indexOf(groesster);
    const summe = zeile.reduce((a, b) => a + b, 0);
    const selbst = zeile[index] ?? 0;

    const marker: Mark[] = [
      {
        label: "",
        x: 0.2,
        y: TOKENS.length - 1 - index + 0.5,
        color: "#d93025",
      },
    ];

    const urteil =
      groesster > 0.5
        ? `Die Aufmerksamkeit ist gebündelt: ${token(staerkster)} bekommt mehr als die Hälfte der Gewichte dieser Zeile.`
        : groesster > 0.25
          ? "Keine Stelle bekommt die Hälfte der Gewichte, aber sie sind deutlich ungleich verteilt."
          : "Die Gewichte sind fast gleich: dieses Token weiß nicht recht, worauf es sich beziehen soll.";

    return {
      values: [
        { label: "Größtes Gewicht", value: groesster, digits: 3 },
        { label: "Kleinstes Gewicht", value: kleinster, digits: 3 },
        { label: "Gewicht auf sich selbst", value: selbst, digits: 3 },
        { label: "Summe der Gewichte", value: summe, digits: 3 },
      ],
      drawing: {
        kind: "grid",
        cols: TOKENS.length,
        rows: TOKENS.length,
        cells: zellen(gewichte()),
        xRange: [0, TOKENS.length],
        yRange: [0, TOKENS.length],
        style: "anteil",
        points: marker,
      },
      sentences: [
        `Das Token ${token(index)} fragt; seine Zeile hat ${TOKENS.length} Gewichte.`,
        `Am größten ist das Gewicht auf ${token(staerkster)}: ${format(groesster, 3)}.`,
        `Auf sich selbst entfallen ${format(selbst, 3)}, das kleinste Gewicht ist ${format(kleinster, 3)}.`,
        urteil,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const groessterVorher = Math.max(...gewichteZeile(abfrageIndex(before)));
    const groessterNachher = Math.max(...gewichteZeile(abfrageIndex(after)));
    const events: SemanticEvent[] = [];
    if (groessterNachher > 0.5 && groessterVorher <= 0.5) {
      events.push({ name: "aufmerksamkeitGebuendelt", severity: "info", value: groessterNachher });
    } else if (groessterNachher < 0.25 && groessterVorher >= 0.25) {
      events.push({ name: "aufmerksamkeitVerteilt", severity: "info", value: groessterNachher });
    }
    return events;
  },
};

registerRules([
  {
    name: "aufmerksamkeitGebuendelt",
    explain: (e) =>
      `Ein einzelnes Gewicht ist groß (${formatValue(e.value ?? 0, 3)}): diese Abfrage bezieht sich auf ein bestimmtes Token.`,
  },
  {
    name: "aufmerksamkeitVerteilt",
    explain: (e) =>
      `Die Gewichte sind fast gleich (das größte liegt bei ${formatValue(e.value ?? 0, 3)}): die Abfrage verteilt ihre Aufmerksamkeit breit.`,
  },
]);
