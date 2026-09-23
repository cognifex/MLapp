/**
 * LEK-28 Transformer: der Datenfluss durch einen vereinfachten Block.
 *
 * Rechenkern: Ein Eingabevektor läuft durch vier Schritte - Normierung, Aufmerksamkeit,
 * Vorwärtsnetz und Restverbindung. Jeder Schritt ist eine reine Funktion des vorherigen Vektors,
 * deshalb lässt sich jeder Zwischenstand nachrechnen und anzeigen.
 *
 * Vereinfachungen, die im Beispiel gelten und in der Lektion benannt werden:
 *  - Die Aufmerksamkeit greift auf einen festen Speicher aus drei Vektoren zu (kein Lernen).
 *  - Die Gewichte des Vorwärtsnetzes sind nicht negativ und die Normierung verschiebt mit beta
 *    größer null, damit im Säulendiagramm alle Komponenten sichtbar bleiben.
 */
import type { Bar, Calculated, DrawingSpec } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Vektor4 = readonly [number, number, number, number];
export type Matrix4 = readonly [Vektor4, Vektor4, Vektor4, Vektor4];

/** Eingabevektor des Beispiels. */
export const EINGABE: Vektor4 = [2.0, 0.5, 1.0, 3.0];

/** Normierung: strecken und verschieben. */
export const GAMMA = 1.5;
export const BETA = 2.0;
const EPSILON = 1e-5;

/** Fester Speicher, auf den die Aufmerksamkeit zugreift: drei Schlüssel- und Wertvektoren. */
export const SPEICHER: readonly [Vektor4, Vektor4, Vektor4] = [
  [1.0, 0.1, 0.1, 1.0],
  [0.1, 1.0, 0.8, 0.1],
  [0.5, 0.2, 0.6, 0.4],
];

/** Gewichte des Vorwärtsnetzes, zwei Schichten mit ReLU dazwischen. */
export const W1: Matrix4 = [
  [0.6, 0.3, 0.0, 0.0],
  [0.0, 0.6, 0.3, 0.0],
  [0.0, 0.0, 0.6, 0.3],
  [0.3, 0.0, 0.0, 0.6],
];

export const W2: Matrix4 = [
  [0.8, 0.2, 0.0, 0.0],
  [0.0, 0.8, 0.2, 0.0],
  [0.0, 0.0, 0.8, 0.2],
  [0.2, 0.0, 0.0, 0.8],
];

/** Verschiebungen der beiden Schichten. */
export const B1 = 0.1;
export const B2 = 0.05;

export type SchrittKey = "norm" | "attention" | "ff" | "rest";
export type Schritt = { key: SchrittKey; label: string; beschreibung: string };

export const SCHRITTE: readonly [Schritt, Schritt, Schritt, Schritt] = [
  {
    key: "norm",
    label: "Normierung",
    beschreibung:
      "Die Normierung zieht den Mittelwert ab, teilt durch die Streuung, streckt mit dem Faktor gamma und verschiebt mit beta.",
  },
  {
    key: "attention",
    label: "Aufmerksamkeit",
    beschreibung:
      "Die Aufmerksamkeit bewertet den Vektor gegen den festen Speicher und mischt die Speichervektoren mit ihren Gewichten.",
  },
  {
    key: "ff",
    label: "Vorwärtsnetz",
    beschreibung:
      "Das Vorwärtsnetz mischt die Merkmale in zwei Schichten; die ReLU-Aktivierung dazwischen setzt negative Werte auf null.",
  },
  {
    key: "rest",
    label: "Restverbindung",
    beschreibung:
      "Die Restverbindung addiert die Eingabe auf die Ausgabe des Blocks, damit die ursprüngliche Information erhalten bleibt.",
  },
];

function wahl(state: ExperimentState, id: string, fallback: string): string {
  const v = state[id];
  return typeof v === "string" ? v : fallback;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

/** Länge eines Vektors. */
export function norm(v: Vektor4): number {
  return Math.hypot(v[0], v[1], v[2], v[3]);
}

export function schrittZu(key: string): Schritt {
  return SCHRITTE.find((s) => s.key === key) ?? SCHRITTE[0];
}

function schicht(matrix: Matrix4, v: Vektor4): Vektor4 {
  const zeilen = matrix.map(
    (zeile) => zeile[0] * v[0] + zeile[1] * v[1] + zeile[2] * v[2] + zeile[3] * v[3],
  );
  return [zeilen[0] ?? 0, zeilen[1] ?? 0, zeilen[2] ?? 0, zeilen[3] ?? 0];
}

export function addieren(a: Vektor4, b: Vektor4): Vektor4 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

/** Normierung über die vier Merkmale: Mittelwert abziehen, durch die Streuung teilen, strecken, verschieben. */
export function normieren(v: Vektor4): Vektor4 {
  const mittel = (v[0] + v[1] + v[2] + v[3]) / 4;
  const abweichungen: Vektor4 = [v[0] - mittel, v[1] - mittel, v[2] - mittel, v[3] - mittel];
  const varianz =
    (abweichungen[0] * abweichungen[0] +
      abweichungen[1] * abweichungen[1] +
      abweichungen[2] * abweichungen[2] +
      abweichungen[3] * abweichungen[3]) /
    4;
  const streuung = Math.sqrt(varianz + EPSILON);
  return [
    BETA + (GAMMA * abweichungen[0]) / streuung,
    BETA + (GAMMA * abweichungen[1]) / streuung,
    BETA + (GAMMA * abweichungen[2]) / streuung,
    BETA + (GAMMA * abweichungen[3]) / streuung,
  ];
}

export function softmax(werte: readonly number[]): number[] {
  const maximum = Math.max(...werte);
  const exponenten = werte.map((w) => Math.exp(w - maximum));
  const summe = exponenten.reduce((a, b) => a + b, 0);
  return exponenten.map((e) => e / summe);
}

/** Bewertungen gegen den festen Speicher und die daraus gemischte Ausgabe. */
export function aufmerksamkeit(v: Vektor4): {
  bewertungen: number[];
  gewichte: number[];
  ausgabe: Vektor4;
} {
  const bewertungen = SPEICHER.map(
    (m) => (v[0] * m[0] + v[1] * m[1] + v[2] * m[2] + v[3] * m[3]) / Math.sqrt(4),
  );
  const gewichte = softmax(bewertungen);
  let erster = 0;
  let zweiter = 0;
  let dritter = 0;
  let vierter = 0;
  SPEICHER.forEach((m, i) => {
    const g = gewichte[i] ?? 0;
    erster += g * m[0];
    zweiter += g * m[1];
    dritter += g * m[2];
    vierter += g * m[3];
  });
  return { bewertungen, gewichte, ausgabe: [erster, zweiter, dritter, vierter] };
}

/** Zwei Schichten mit ReLU dazwischen und je einer Verschiebung. */
export function vorwaertsnetz(v: Vektor4): { verdeckt: Vektor4; ausgabe: Vektor4 } {
  const roh = schicht(W1, v);
  const verdeckt: Vektor4 = [
    Math.max(0, roh[0] + B1),
    Math.max(0, roh[1] + B1),
    Math.max(0, roh[2] + B1),
    Math.max(0, roh[3] + B1),
  ];
  const aus = schicht(W2, verdeckt);
  return {
    verdeckt,
    ausgabe: [aus[0] + B2, aus[1] + B2, aus[2] + B2, aus[3] + B2],
  };
}

export type Durchlauf = {
  eingabe: Vektor4;
  nachNorm: Vektor4;
  nachAufmerksamkeit: Vektor4;
  nachVorwaertsnetz: Vektor4;
  nachRestverbindung: Vektor4;
  bewertungen: number[];
  gewichte: number[];
  verdeckt: Vektor4;
};

/** Der ganze Block in einem Durchgang - alle Zwischenstände entstehen aus derselben Rechnung. */
export function durchlauf(): Durchlauf {
  const eingabe = EINGABE;
  const nachNorm = normieren(eingabe);
  const a = aufmerksamkeit(nachNorm);
  const f = vorwaertsnetz(a.ausgabe);
  return {
    eingabe,
    nachNorm,
    nachAufmerksamkeit: a.ausgabe,
    nachVorwaertsnetz: f.ausgabe,
    nachRestverbindung: addieren(eingabe, f.ausgabe),
    bewertungen: a.bewertungen,
    gewichte: a.gewichte,
    verdeckt: f.verdeckt,
  };
}

/** Vorher- und Nachher-Vektor eines Schrittes. */
export function paar(d: Durchlauf, key: SchrittKey): { vor: Vektor4; nach: Vektor4 } {
  switch (key) {
    case "norm":
      return { vor: d.eingabe, nach: d.nachNorm };
    case "attention":
      return { vor: d.nachNorm, nach: d.nachAufmerksamkeit };
    case "ff":
      return { vor: d.nachAufmerksamkeit, nach: d.nachVorwaertsnetz };
    case "rest":
      return { vor: d.eingabe, nach: d.nachRestverbindung };
  }
}

registerRules([
  {
    name: "normGrew",
    explain: (e) =>
      `Die Norm des Vektors ist auf ${format(e.value ?? 0, 4)} gestiegen: dieser Schritt streckt den Vektor.`,
  },
  {
    name: "normShrank",
    explain: (e) =>
      `Die Norm des Vektors ist auf ${format(e.value ?? 0, 4)} gefallen: dieser Schritt staucht den Vektor.`,
  },
]);

export const transformer: Experiment = {
  id: "exp-transformer",
  title: "Datenfluss durch einen Transformator-Block",
  learningGoal:
    "Die vier Schritte eines vereinfachten Blocks (Normierung, Aufmerksamkeit, Vorwärtsnetz, Restverbindung) Schritt für Schritt verfolgen",
  instructions:
    "Wähle einen Schritt. Die Säulen zeigen den Vektor danach, die gestrichelten Umrisse den Vektor davor.",
  spokenDescription:
    "Ein Säulendiagramm mit vier Merkmalen. Die Auswahl Schritt stellt einen von vier Schritten des " +
    "Blocks ein: Normierung, Aufmerksamkeit, Vorwärtsnetz oder Restverbindung. Die gefüllten Säulen " +
    "zeigen den Vektor nach dem Schritt, die gestrichelten Umrisse den Vektor davor. Daneben stehen die " +
    "Norm des Vektors, die Norm vor dem Schritt und die Änderung der Norm.",
  controls: [
    {
      kind: "select",
      id: "schritt",
      label: "Schritt",
      options: SCHRITTE.map((s, i) => ({ value: s.key, label: `Schritt ${i + 1}: ${s.label}` })),
      initial: "norm",
    },
  ],
  initialState: { schritt: "norm" },
  update(state, action) {
    if (action.type === "reset") return { schritt: "norm" };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const d = durchlauf();
    const schritt = schrittZu(wahl(state, "schritt", "norm"));
    const { vor, nach } = paar(d, schritt.key);
    const normVor = norm(vor);
    const normNach = norm(nach);
    const laengste = Math.max(...nach);
    const stelle = nach.indexOf(laengste);

    const items: Bar[] = [0, 1, 2, 3].map((dim) => ({
      label: `Merkmal ${dim + 1}`,
      value: nach[dim] ?? 0,
      ghost: vor[dim] ?? 0,
    }));

    const drawing: DrawingSpec = {
      kind: "bars",
      items,
      yMax: Math.max(...vor, ...nach),
    };

    const normNachText = format(normNach, 4);
    const normVorText = format(normVor, 4);
    const laengsteText = format(laengste, 4);

    return {
      values: [
        { label: "Norm des Vektors", value: normNach, digits: 4 },
        { label: "Norm vor dem Schritt", value: normVor, digits: 4 },
        { label: "Änderung der Norm", value: normNach - normVor, digits: 4 },
      ],
      drawing,
      sentences: [
        `Schritt ${schritt.label}: die Norm des Vektors ist danach ${normNachText}, vorher ${normVorText}.`,
        `Die größte Komponente liegt bei Merkmal ${stelle + 1} mit ${laengsteText}.`,
        schritt.beschreibung,
      ],
    };
  },
  semanticEvents(_before, after): SemanticEvent[] {
    const schritt = schrittZu(wahl(after, "schritt", "norm"));
    const d = durchlauf();
    const { vor, nach } = paar(d, schritt.key);
    const richtung = compareValues(norm(vor), norm(nach), 0.01);
    if (richtung === "up") return [{ name: "normGrew", severity: "info", value: norm(nach) }];
    if (richtung === "down") return [{ name: "normShrank", severity: "info", value: norm(nach) }];
    return [];
  },
};
