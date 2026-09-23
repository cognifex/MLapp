/**
 * LEK-26 Query, Key, Value: Bewertungen, Softmax-Gewichte und gewichtete Werte.
 *
 * Rechenkern: Aus festen Tokenvektoren entstehen mit festen Projektionen die Abfragen, Schlüssel
 * und Werte. Eine Bewertung ist das Skalarprodukt aus Abfrage und Schlüssel, geteilt durch die
 * Wurzel der Merkmalszahl. Die Gewichte sind die Softmax dieser Bewertungen, der gewichtete Wert
 * ist die Summe aus Gewicht mal Wert. Zahlen, Säulen und Sätze stammen alle aus dieser Rechnung -
 * es gibt keine zweite Rechnung in der Oberfläche.
 */
import type { Bar, Calculated, DrawingSpec } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Vektor2 = readonly [number, number];
export type Matrix2 = readonly [Vektor2, Vektor2];
export type TokenEintrag = { token: string; v: Vektor2 };

/**
 * Feste Tokenmenge. Das erste Merkmal bedeutet Artikel, das zweite Merkmal Tier: "Der" trägt
 * keinen Tieranteil, "Katze" keinen Artikelanteil.
 */
export const TOKENVEKTOREN: readonly [TokenEintrag, TokenEintrag, TokenEintrag, TokenEintrag] = [
  { token: "Der", v: [1.0, 0.0] },
  { token: "Hund", v: [0.6, 0.8] },
  { token: "jagt", v: [0.8, 0.6] },
  { token: "Katze", v: [0.0, 1.0] },
];

/** Projektionen für Abfrage, Schlüssel und Werte - im Code fest, nichts wird gewürfelt. */
export const W_Q: Matrix2 = [
  [3.0, 1.5],
  [0.0, 3.0],
];

export const W_K: Matrix2 = [
  [3.0, 0.75],
  [1.5, 3.0],
];

export const W_V: Matrix2 = [
  [0.5, 0.0],
  [0.0, 1.0],
];

/** Merkmalszahl von Abfrage und Schlüssel; daraus entsteht der Skalierungsfaktor. */
export const D_K = 2;

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function wahl(state: ExperimentState, id: string, fallback: string): string {
  const v = state[id];
  return typeof v === "string" ? v : fallback;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Position der Abfrage, auf den erlaubten Bereich gezogen. */
export function abfrageIndex(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "abfrage", 1));
  return Math.min(TOKENVEKTOREN.length - 1, Math.max(0, roh));
}

function eintrag(i: number): TokenEintrag {
  return TOKENVEKTOREN[i] ?? TOKENVEKTOREN[0];
}

/** Zeile mal Vektor: aus drei Zahlen der Tokenmatrix werden zwei Merkmale der Abfrage. */
export function projizieren(matrix: Matrix2, v: Vektor2): Vektor2 {
  return [matrix[0][0] * v[0] + matrix[0][1] * v[1], matrix[1][0] * v[0] + matrix[1][1] * v[1]];
}

/** Bewertungen der Abfrage an Position i gegen alle Schlüssel. */
export function bewertungen(i: number): number[] {
  const abfrage = projizieren(W_Q, eintrag(i).v);
  return TOKENVEKTOREN.map((k) => {
    const schluessel = projizieren(W_K, k.v);
    const produkt = abfrage[0] * schluessel[0] + abfrage[1] * schluessel[1];
    return produkt / Math.sqrt(D_K);
  });
}

/** Softmax: zieht das Maximum ab (numerisch stabil) und teilt durch die Summe der Exponentialwerte. */
export function softmax(werte: readonly number[]): number[] {
  const maximum = Math.max(...werte);
  const exponenten = werte.map((w) => Math.exp(w - maximum));
  const summe = exponenten.reduce((a, b) => a + b, 0);
  return exponenten.map((e) => e / summe);
}

/** Softmax-Gewichte der Abfrage an Position i. */
export function gewichte(i: number): number[] {
  return softmax(bewertungen(i));
}

/** Gewichteter Wert: Summe aus Gewicht mal Wert über alle Tokens. */
export function gewichteterWert(i: number): Vektor2 {
  const w = gewichte(i);
  let erster = 0;
  let zweiter = 0;
  TOKENVEKTOREN.forEach((k, j) => {
    const wert = projizieren(W_V, k.v);
    const g = w[j] ?? 0;
    erster += g * wert[0];
    zweiter += g * wert[1];
  });
  return [erster, zweiter];
}

registerRules([
  {
    name: "weightsFocused",
    explain: (e) =>
      `Das größte Gewicht ist auf ${format(e.value ?? 0, 4)} gestiegen. Die Aufmerksamkeit bündelt sich auf weniger Tokens.`,
  },
  {
    name: "weightsSpread",
    explain: (e) =>
      `Das größte Gewicht ist auf ${format(e.value ?? 0, 4)} gefallen. Die Aufmerksamkeit verteilt sich breiter.`,
  },
]);

export const qkv: Experiment = {
  id: "exp-qkv",
  title: "Bewertungen und Gewichte einer Abfrage",
  learningGoal:
    "Aus Query, Key und Value die Bewertungen, die Softmax-Gewichte und den gewichteten Wert berechnen",
  instructions:
    "Stelle mit dem Regler ein, welches Token fragt. Die Auswahl Ansicht zeigt entweder die Bewertungen oder die Gewichte.",
  spokenDescription:
    "Ein Säulendiagramm über vier Tokens: Der, Hund, jagt und Katze. Der Regler Abfrage bestimmt, " +
    "welches Token die Frage stellt; die hervorgehobene Säule ist dieses Token. Die Auswahl Ansicht " +
    "schaltet zwischen den Bewertungen und den Gewichten nach der Softmax um. Rechts stehen die Summe " +
    "der Gewichte, das größte Gewicht und der gewichtete Wert.",
  controls: [
    {
      kind: "slider",
      id: "abfrage",
      label: "Abfrage: Position im Satz",
      min: 0,
      max: 3,
      step: 1,
      initial: 1,
    },
    {
      kind: "select",
      id: "ansicht",
      label: "Ansicht",
      options: [
        { value: "bewertungen", label: "Bewertungen (Skalarprodukte)" },
        { value: "gewichte", label: "Gewichte nach der Softmax" },
      ],
      initial: "gewichte",
    },
  ],
  initialState: { abfrage: 1, ansicht: "gewichte" },
  update(state, action) {
    if (action.type === "reset") return { abfrage: 1, ansicht: "gewichte" };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const i = abfrageIndex(state);
    const ansicht = wahl(state, "ansicht", "gewichte");
    const werte = bewertungen(i);
    const w = gewichte(i);
    const gezeigt = ansicht === "bewertungen" ? werte : w;
    const wert = gewichteterWert(i);
    const summe = w.reduce((a, b) => a + b, 0);
    const groesstes = Math.max(...w);
    const starkIndex = w.indexOf(groesstes);
    const starkToken = TOKENVEKTOREN[starkIndex]?.token ?? "";
    const abfrageToken = eintrag(i).token;

    const items: Bar[] = TOKENVEKTOREN.map((k, j) => ({
      label: k.token,
      value: gezeigt[j] ?? 0,
      highlighted: j === i,
    }));

    const drawing: DrawingSpec = {
      kind: "bars",
      items,
      yMax: ansicht === "gewichte" ? 1 : undefined,
    };

    const groesstesText = format(groesstes, 4);
    const summeText = format(summe, 4);
    const wert1Text = format(wert[0], 4);
    const wert2Text = format(wert[1], 4);

    return {
      values: [
        { label: "Summe der Gewichte", value: summe, digits: 6 },
        { label: "Größtes Gewicht", value: groesstes, digits: 4 },
        { label: "Gewichteter Wert 1", value: wert[0], digits: 4 },
        { label: "Gewichteter Wert 2", value: wert[1], digits: 4 },
      ],
      drawing,
      sentences: [
        `Die Abfrage steht auf "${abfrageToken}" (Position ${i}).`,
        `Die Bewertungen sind ${werte.map((x) => format(x, 3)).join(" / ")}.`,
        `Nach der Softmax trägt "${starkToken}" das größte Gewicht mit ${groesstesText}.`,
        `Die Gewichte summieren sich zu ${summeText}; der gewichtete Wert ist (${wert1Text} | ${wert2Text}).`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = Math.max(...gewichte(abfrageIndex(before)));
    const nachher = Math.max(...gewichte(abfrageIndex(after)));
    const richtung = compareValues(vorher, nachher, 0.02);
    if (richtung === "up") return [{ name: "weightsFocused", severity: "info", value: nachher }];
    if (richtung === "down") return [{ name: "weightsSpread", severity: "info", value: nachher }];
    return [];
  },
};
