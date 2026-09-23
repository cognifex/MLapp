/**
 * LEK-27 Multi-Head Attention: dieselben Tokens, mehrere Köpfe mit eigenen Projektionen.
 *
 * Rechenkern: Jeder Kopf hat eine feste Abfrage- und Schlüsselprojektion. Aus den Bewertungen
 * (Skalarprodukt, geteilt durch die Wurzel der Merkmalszahl) entsteht je Abfragetoken eine
 * Gewichtszeile über alle Tokens. Die Gewichtsmatrix wird als Farbfläche gezeigt, dazu das
 * größte Gewicht und die Entropie der gewählten Zeile - beides aus derselben Rechnung.
 */
import type { Calculated, DrawingSpec, GridCell } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Vektor3 = readonly [number, number, number];
export type Projektion = readonly [Vektor3, Vektor3];
export type TokenEintrag = { token: string; v: Vektor3 };

export type Kopf = {
  key: string;
  label: string;
  beschreibung: string;
  wQ: Projektion;
  wK: Projektion;
};

/**
 * Feste Tokenmenge mit drei Merkmalen: Artikel, Tier, Handlung. "Der" trägt fast nur das
 * Artikelmerkmal, "jagt" fast nur das Handlungsmerkmal.
 */
export const TOKENVEKTOREN: readonly [TokenEintrag, TokenEintrag, TokenEintrag, TokenEintrag] = [
  { token: "Der", v: [1.0, 0.3, 0.1] },
  { token: "Hund", v: [0.1, 1.0, 0.2] },
  { token: "jagt", v: [0.1, 0.2, 1.0] },
  { token: "Katze", v: [0.1, 0.8, 0.3] },
];

/** Merkmalszahl der projizierten Abfragen und Schlüssel; daraus entsteht der Skalierungsfaktor. */
export const D_K = 2;

/**
 * Drei Köpfe. Die Projektionen sind im Code fest und unterscheiden sich in ihrer Struktur: Kopf 1
 * liest Artikel und Tier und fragt nach Tier und Handlung, Kopf 2 liest Handlung und Tier und fragt
 * nach Artikel und Tier, Kopf 3 liest nur Tier und ist schwach skaliert (breiter Blick).
 */
export const KOEPFE: readonly [Kopf, Kopf, Kopf] = [
  {
    key: "kopf-1",
    label: "Kopf 1: Bedeutung",
    beschreibung:
      "Kopf 1 projiziert Artikel und Tier der Abfrage und fragt damit nach Tier und Handlung des Schlüssels.",
    wQ: [
      [2.0, 0.0, 0.0],
      [0.0, 2.0, 0.0],
    ],
    wK: [
      [0.0, 2.0, 0.0],
      [0.0, 0.0, 2.0],
    ],
  },
  {
    key: "kopf-2",
    label: "Kopf 2: Handlung",
    beschreibung:
      "Kopf 2 projiziert Handlung und Tier der Abfrage und fragt damit nach Artikel und Tier des Schlüssels.",
    wQ: [
      [0.0, 0.0, 2.0],
      [0.0, 2.0, 0.0],
    ],
    wK: [
      [2.0, 0.0, 0.0],
      [0.0, 2.0, 0.0],
    ],
  },
  {
    key: "kopf-3",
    label: "Kopf 3: breiter Blick",
    beschreibung:
      "Kopf 3 liest in beiden Zeilen nur das Tiermerkmal und ist schwach skaliert - er verteilt die Aufmerksamkeit breit.",
    wQ: [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
    ],
    wK: [
      [0.0, 1.0, 0.0],
      [0.0, 1.0, 0.0],
    ],
  },
];

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

export function kopfZu(key: string): Kopf {
  return KOEPFE.find((k) => k.key === key) ?? KOEPFE[0];
}

function eintrag(i: number): TokenEintrag {
  return TOKENVEKTOREN[i] ?? TOKENVEKTOREN[0];
}

/** Zeile der Zeilenzahl, auf den erlaubten Bereich gezogen. */
export function zeilenIndex(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "zeile", 1));
  return Math.min(TOKENVEKTOREN.length - 1, Math.max(0, roh));
}

/** Projektion von drei Merkmalen auf zwei: Abfrage- oder Schlüsselraum eines Kopfes. */
export function projizieren(p: Projektion, v: Vektor3): readonly [number, number] {
  return [
    p[0][0] * v[0] + p[0][1] * v[1] + p[0][2] * v[2],
    p[1][0] * v[0] + p[1][1] * v[1] + p[1][2] * v[2],
  ];
}

export function softmax(werte: readonly number[]): number[] {
  const maximum = Math.max(...werte);
  const exponenten = werte.map((w) => Math.exp(w - maximum));
  const summe = exponenten.reduce((a, b) => a + b, 0);
  return exponenten.map((e) => e / summe);
}

/** Bewertungen eines Kopfes für eine Abfrage an Position i. */
export function bewertungen(kopf: Kopf, i: number): number[] {
  const abfrage = projizieren(kopf.wQ, eintrag(i).v);
  return TOKENVEKTOREN.map((k) => {
    const schluessel = projizieren(kopf.wK, k.v);
    return (abfrage[0] * schluessel[0] + abfrage[1] * schluessel[1]) / Math.sqrt(D_K);
  });
}

/** Gewichtszeile eines Kopfes: wie viel Aufmerksamkeit die Abfrage an Position i verteilt. */
export function gewichteZeile(kopf: Kopf, i: number): number[] {
  return softmax(bewertungen(kopf, i));
}

/** Vollständige Gewichtsmatrix eines Kopfes (Zeile = Abfragetoken, Spalte = Schlüsseltoken). */
export function gewichtsmatrix(kopf: Kopf): number[][] {
  return TOKENVEKTOREN.map((_k, r) => gewichteZeile(kopf, r));
}

/** Entropie einer Verteilung: klein heißt scharf, groß heißt breit verteilt. */
export function entropie(werte: readonly number[]): number {
  return werte.reduce((summe, w) => (w > 0 ? summe - w * Math.log(w) : summe), 0);
}

registerRules([
  {
    name: "rowFlatter",
    explain: (e) =>
      `Die Entropie der Zeile ist auf ${format(e.value ?? 0, 4)} gestiegen: dieser Kopf verteilt sein Gewicht breiter.`,
  },
  {
    name: "rowSharper",
    explain: (e) =>
      `Die Entropie der Zeile ist auf ${format(e.value ?? 0, 4)} gefallen: dieser Kopf bündelt sein Gewicht auf wenige Tokens.`,
  },
]);

export const multiHead: Experiment = {
  id: "exp-multi-head",
  title: "Gewichtsmatrix mehrerer Köpfe",
  learningGoal:
    "Vergleichen, wie verschiedene Köpfe dieselben Tokens unterschiedlich gewichten, und die Entropie einer Zeile deuten",
  instructions:
    "Wähle einen Kopf und eine Zeile. Die Farbfläche zeigt die Gewichte aller Abfragetokens, die Zahlen darunter die gewählte Zeile.",
  spokenDescription:
    "Eine Farbfläche mit vier mal vier Zellen. Die Zeilen sind die Abfragetokens Der, Hund, jagt und Katze, " +
    "die Spalten sind dieselben Tokens als Schlüssel. Dunkler heißt größeres Gewicht. Die Auswahl Kopf " +
    "schaltet zwischen drei Köpfen mit eigenen Projektionen um, der Regler Zeile wählt die Abfrage. " +
    "Darunter stehen das größte Gewicht der Zeile, ihre Entropie und ihre Summe.",
  controls: [
    {
      kind: "select",
      id: "kopf",
      label: "Kopf",
      options: [
        { value: "kopf-1", label: "Kopf 1: Bedeutung fragt nach Handlung" },
        { value: "kopf-2", label: "Kopf 2: Handlung fragt nach Artikel" },
        { value: "kopf-3", label: "Kopf 3: breiter Blick" },
      ],
      initial: "kopf-1",
    },
    {
      kind: "slider",
      id: "zeile",
      label: "Zeile: Abfragetoken",
      min: 0,
      max: 3,
      step: 1,
      initial: 1,
    },
  ],
  initialState: { kopf: "kopf-1", zeile: 1 },
  update(state, action) {
    if (action.type === "reset") return { kopf: "kopf-1", zeile: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const kopf = kopfZu(wahl(state, "kopf", "kopf-1"));
    const zeile = gewichteZeile(kopf, zeilenIndex(state));
    const zeilenName = eintrag(zeilenIndex(state)).token;
    const groesstes = Math.max(...zeile);
    const starkToken = TOKENVEKTOREN[zeile.indexOf(groesstes)]?.token ?? "";
    const ent = entropie(zeile);
    const summe = zeile.reduce((a, b) => a + b, 0);

    const cells: GridCell[] = [];
    gewichtsmatrix(kopf).forEach((reihe, r) => {
      reihe.forEach((wert, c) => {
        cells.push({ row: r, col: c, value: wert, label: format(wert, 2) });
      });
    });

    const drawing: DrawingSpec = {
      kind: "grid",
      cols: TOKENVEKTOREN.length,
      rows: TOKENVEKTOREN.length,
      cells,
      xRange: [0, TOKENVEKTOREN.length],
      yRange: [0, TOKENVEKTOREN.length],
      style: "anteil",
    };

    const groesstesText = format(groesstes, 4);
    const entropieText = format(ent, 4);
    const summeText = format(summe, 4);

    return {
      values: [
        { label: "Größtes Gewicht der Zeile", value: groesstes, digits: 4 },
        { label: "Entropie der Zeile", value: ent, digits: 4 },
        { label: "Summe der Zeile", value: summe, digits: 6 },
      ],
      drawing,
      sentences: [
        `${kopf.label}: ${kopf.beschreibung}`,
        `Die Zeile der Abfrage "${zeilenName}" hat ihr größtes Gewicht bei "${starkToken}" mit ${groesstesText}.`,
        `Die Entropie dieser Zeile ist ${entropieText} - je größer sie ist, desto breiter verteilt der Kopf sein Gewicht.`,
        `Die Summe der Zeile ist ${summeText}; jede Abfrage verteilt genau ihr ganzes Gewicht.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = entropie(
      gewichteZeile(kopfZu(wahl(before, "kopf", "kopf-1")), zeilenIndex(before)),
    );
    const nachher = entropie(
      gewichteZeile(kopfZu(wahl(after, "kopf", "kopf-1")), zeilenIndex(after)),
    );
    const richtung = compareValues(vorher, nachher, 0.02);
    if (richtung === "up") return [{ name: "rowFlatter", severity: "info", value: nachher }];
    if (richtung === "down") return [{ name: "rowSharper", severity: "info", value: nachher }];
    return [];
  },
};
