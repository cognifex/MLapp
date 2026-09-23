/**
 * LEK-44 Gesamtsystem: ein kleines autoregressives Transformer-Modell von den Tokens bis zur
 * Ausgabe.
 *
 * Rechenkern: feste, von Hand gesetzte Gewichte - kein Training, kein Zufall. Aus dem Kontext
 * entstehen Token- und Positionsvektoren, daraus per kausaler Selbstaufmerksamkeit ein gemischter
 * Vektor, dann eine kleine Zwischenschicht und zuletzt je Token eine Punktzahl. Die Temperatur
 * teilt die Punktzahlen vor der Softmax: unter eins wird die Verteilung spitzer, ueber eins
 * flacher. Alle Gewichte sind unten als Zahlen angegeben und werden im Code nachgerechnet.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Das Vokabular des Beispielsatzes. */
export const TOKENS = ["der", "kleine", "Hund", "läuft", "."];
/** Je Token eine eigene Achse; dazu kommt eine Achse fuer die Position. */
const WORTACHSEN = TOKENS.length;
const ACHSEN = WORTACHSEN + 1;
/** Ueblicher Teiler der Aufmerksamkeitsbewertungen. */
const TEILER = Math.sqrt(ACHSEN);
/** So viele Positionen kennt das Modell; der laengste Kontext hat vier Tokens. */
export const POSITIONEN = 4;

/**
 * Token-Einbettung: jedes Token liegt auf seiner eigenen Achse.
 * Zeile = Token, Spalte = Achse.
 */
export const E: number[][] = [
  [1, 0, 0, 0, 0, 0], // der
  [0, 1, 0, 0, 0, 0], // kleine
  [0, 0, 1, 0, 0, 0], // Hund
  [0, 0, 0, 1, 0, 0], // läuft
  [0, 0, 0, 0, 1, 0], // .
];

/** Positionsvektoren: die letzte Achse traegt null Komma zwei mal die Position. */
export const P: number[][] = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0.2],
  [0, 0, 0, 0, 0, 0.4],
  [0, 0, 0, 0, 0, 0.6],
];

function diagonal(faktor: number): number[][] {
  return Array.from({ length: ACHSEN }, (_, z) =>
    Array.from({ length: ACHSEN }, (_, s) => (z === s ? faktor : 0)),
  );
}

/** Abfrage: das Token fragt nach sich selbst. */
const W_Q: number[][] = diagonal(1);
/** Wert: das Token selbst, schwaecher gewichtet als die Rest-Verbindung. */
const W_V: number[][] = diagonal(0.6);
/** Zwischenschicht: hier verstaerkt jede Achse nur sich selbst (feste Gewichte, kein Training). */
const W1: number[][] = diagonal(1);
const W2: number[][] = diagonal(0.2);

/**
 * Schluessel: jede Zeile passt auf ihren Vorgaenger im Beispielsatz -
 * Zeile "kleine" auf die Achse "der", Zeile "Hund" auf "kleine", Zeile "läuft" auf "Hund",
 * Zeile "." auf "läuft". Die Positionsachse passt auf sich selbst.
 */
export const W_K: number[][] = [
  [0, 0, 0, 0, 0, 0],
  [0.9, 0, 0, 0, 0, 0],
  [0, 0.9, 0, 0, 0, 0],
  [0, 0, 0.9, 0, 0, 0],
  [0, 0, 0, 0.9, 0, 0],
  [0, 0, 0, 0, 0, 0.5],
];

/**
 * Ausgabe: Zeile = vorhergesagtes Token, Spalte = Achse. Von Hand gesetzt sind nur die
 * Uebergaenge des Beispielsatzes.
 */
export const W_OUT: number[][] = [
  [0, 0, 0, 0, 0, 0], // der
  [1.4, 0, 0, 0, 0, 0], // kleine folgt auf der
  [0, 1.4, 0, 0, 0, 0], // Hund folgt auf kleine
  [0, 0, 1.4, 0, 0, 0], // läuft folgt auf Hund
  [0, 0, 0, 1.4, 0, 0], // . folgt auf läuft
];

/** Die vier Kontexte, die der Regler zur Auswahl stellt. */
export const KONTEXTE: { value: string; label: string }[] = [
  { value: "der", label: "der" },
  { value: "der-kleine", label: "der kleine" },
  { value: "der-kleine-hund", label: "der kleine Hund" },
  { value: "der-kleine-hund-laeuft", label: "der kleine Hund läuft" },
];

const KONTEXT_TOKENS: Record<string, number[]> = {
  der: [0],
  "der-kleine": [0, 1],
  "der-kleine-hund": [0, 1, 2],
  "der-kleine-hund-laeuft": [0, 1, 2, 3],
};

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

function wert(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function softmax(werte: number[]): number[] {
  const groesste = Math.max(...werte);
  const hoch = werte.map((w) => Math.exp(w - groesste));
  const summe = hoch.reduce((a, b) => a + b, 0);
  return hoch.map((h) => h / summe);
}

/** Entropie einer Wahrscheinlichkeitsverteilung, in der Einheit Nat. */
export function entropie(werte: number[]): number {
  return -werte.reduce((summe, p) => (p > 0 ? summe + p * Math.log(p) : summe), 0);
}

function matrixMalVektor(matrix: number[][], vektor: number[]): number[] {
  return matrix.map((zeile) =>
    zeile.reduce((summe, eintrag, k) => summe + eintrag * (vektor[k] ?? 0), 0),
  );
}

function skalarprodukt(a: number[], b: number[]): number {
  let summe = 0;
  const laenge = Math.min(a.length, b.length);
  for (let i = 0; i < laenge; i += 1) summe += (a[i] ?? 0) * (b[i] ?? 0);
  return summe;
}

/** Der Kontext als Token-Nummern; ein unbekannter Wert faellt auf den vollen Satz zurueck. */
export function kontextTokens(state: ExperimentState): number[] {
  const wahl = state["kontext"];
  const schluessel = typeof wahl === "string" ? wahl : "der-kleine-hund";
  return KONTEXT_TOKENS[schluessel] ?? KONTEXT_TOKENS["der-kleine-hund"] ?? [0, 1, 2];
}

export function kontextLabel(state: ExperimentState): string {
  const wahl = state["kontext"];
  const schluessel = typeof wahl === "string" ? wahl : "der-kleine-hund";
  return KONTEXTE.find((k) => k.value === schluessel)?.label ?? "der kleine Hund";
}

export type Durchlauf = {
  /** Eingabevektoren aus Token- und Positionsanteil. */
  eingabe: number[][];
  /** Aufmerksamkeitsgewichte je Position (nur die eigene und die frueheren Positionen). */
  aufmerksamkeit: number[][];
  /** Ausgabe des Blocks je Position. */
  ausgang: number[][];
  /** Punktzahlen je Token, aus der letzten Position. */
  logits: number[];
  /** Wahrscheinlichkeiten je Token nach der Temperatur. */
  wahrscheinlichkeiten: number[];
};

/** Ein Durchlauf durch den Block: Tokens hinein, Wahrscheinlichkeiten je Token hinaus. */
export function durchlauf(tokenIds: number[], temperatur: number): Durchlauf {
  const eingabe = tokenIds.map((id, position) => {
    const einbettung = E[id] ?? [];
    const ortsvektor = P[position] ?? [];
    return Array.from({ length: ACHSEN }, (_, s) => (einbettung[s] ?? 0) + (ortsvektor[s] ?? 0));
  });

  const abfrage = eingabe.map((vektor) => matrixMalVektor(W_Q, vektor));
  const schluessel = eingabe.map((vektor) => matrixMalVektor(W_K, vektor));
  const werte = eingabe.map((vektor) => matrixMalVektor(W_V, vektor));

  const aufmerksamkeit: number[][] = [];
  const gemischt: number[][] = [];
  for (let i = 0; i < eingabe.length; i += 1) {
    // Kausaler Blick: nur die eigene Position und alles davor.
    const bewertungen: number[] = [];
    for (let j = 0; j <= i; j += 1) {
      bewertungen.push(skalarprodukt(abfrage[i] ?? [], schluessel[j] ?? []) / TEILER);
    }
    const gewichte = softmax(bewertungen);
    aufmerksamkeit.push(gewichte);
    const gemischterVektor: number[] = [];
    for (let s = 0; s < ACHSEN; s += 1) {
      let summe = 0;
      for (let j = 0; j < gewichte.length; j += 1) {
        summe += (gewichte[j] ?? 0) * ((werte[j] ?? [])[s] ?? 0);
      }
      gemischterVektor.push(summe);
    }
    gemischt.push(gemischterVektor);
  }

  // Rest-Verbindung und Zwischenschicht - beides gehoert zum Block.
  const ausgang: number[][] = [];
  for (let i = 0; i < eingabe.length; i += 1) {
    const rest: number[] = [];
    for (let s = 0; s < ACHSEN; s += 1) {
      rest.push((eingabe[i]?.[s] ?? 0) + (gemischt[i]?.[s] ?? 0));
    }
    const zwischen = matrixMalVektor(W1, rest).map((w) => Math.max(0, w));
    const rueck = matrixMalVektor(W2, zwischen);
    ausgang.push(rest.map((eintrag, s) => eintrag + (rueck[s] ?? 0)));
  }

  const logits = matrixMalVektor(W_OUT, ausgang[ausgang.length - 1] ?? []);
  const sicher = Math.max(0.05, temperatur);
  const wahrscheinlichkeiten = softmax(logits.map((l) => l / sicher));
  return { eingabe, aufmerksamkeit, ausgang, logits, wahrscheinlichkeiten };
}

/** Das Token mit der groessten Wahrscheinlichkeit; bei Gleichstand das erste. */
export function gewaehltesToken(wahrscheinlichkeiten: number[]): number {
  let bestes = 0;
  for (let j = 1; j < wahrscheinlichkeiten.length; j += 1) {
    if ((wahrscheinlichkeiten[j] ?? 0) > (wahrscheinlichkeiten[bestes] ?? 0)) bestes = j;
  }
  return bestes;
}

/** Saeulen der Token-Wahrscheinlichkeiten; das gewaehlte Token ist hervorgehoben. */
export function tokenbalken(wahrscheinlichkeiten: number[], bestes: number): Bar[] {
  return TOKENS.map((token, j) => ({
    label: token,
    value: wahrscheinlichkeiten[j] ?? 0,
    highlighted: j === bestes,
  }));
}

registerRules([
  {
    name: "distributionFlattened",
    explain: (e) =>
      `Die Verteilung wird flacher: die Entropie steigt auf ${format(e.value ?? 0, 3)} Nat. Die Temperatur ist hoch, das Modell wird unsicherer.`,
  },
  {
    name: "distributionSharpened",
    explain: (e) =>
      `Die Verteilung wird spitzer: die Entropie faellt auf ${format(e.value ?? 0, 3)} Nat. Die Temperatur ist niedrig, das Modell wird sicherer.`,
  },
]);

export const miniTransformer: Experiment = {
  id: "exp-mini-transformer",
  title: "Ein Mini-Transformer sagt das nächste Token voraus",
  learningGoal:
    "Den Weg von Tokens über Aufmerksamkeit und Zwischenschicht bis zur Token-Verteilung nachvollziehen",
  instructions:
    "Wähle einen Kontext und ziehe die Temperatur. Waagerechte Säulen zeigen die Wahrscheinlichkeit jedes Tokens; hervorgehoben ist das wahrscheinlichste.",
  spokenDescription:
    "Ein kleines Transformer-Modell mit festen Gewichten und fünf Tokens. Ein Auswahlfeld bestimmt den Kontext, " +
    "ein Regler die Temperatur. Waagerechte Säulen zeigen, mit welcher Wahrscheinlichkeit jedes Token als nächstes käme; " +
    "die hervorgehobene Säule ist das wahrscheinlichste Token. Darunter stehen seine Wahrscheinlichkeit und die Entropie der Verteilung.",
  controls: [
    {
      kind: "select",
      id: "kontext",
      label: "Kontext",
      options: KONTEXTE,
      initial: "der-kleine-hund",
    },
    {
      kind: "slider",
      id: "temperatur",
      label: "Temperatur",
      min: 0.2,
      max: 2,
      step: 0.1,
      initial: 1,
    },
  ],
  initialState: { kontext: "der-kleine-hund", temperatur: 1 },
  update(state, action) {
    if (action.type === "reset") return { kontext: "der-kleine-hund", temperatur: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const temperatur = wert(state, "temperatur", 1);
    const label = kontextLabel(state);
    const r = durchlauf(kontextTokens(state), temperatur);
    const p = r.wahrscheinlichkeiten;
    const bestes = gewaehltesToken(p);
    const gewaehlt = p[bestes] ?? 0;
    const H = entropie(p);
    const letzteGewichte = r.aufmerksamkeit[r.aufmerksamkeit.length - 1] ?? [];
    const aufVorheriges =
      letzteGewichte.length > 1 ? (letzteGewichte[letzteGewichte.length - 2] ?? 0) : 1;

    return {
      values: [
        { label: "Wahrscheinlichkeit des gewählten Tokens", value: gewaehlt, digits: 4 },
        { label: "Entropie", value: H, unit: "nat", digits: 4 },
        { label: "Aufmerksamkeit auf das vorherige Token", value: aufVorheriges, digits: 3 },
      ],
      drawing: {
        kind: "bars",
        items: tokenbalken(p, bestes),
        yMax: 1,
        horizontal: true,
      },
      sentences: [
        `Nach dem Kontext "${label}" gibt das Modell dem Token ${TOKENS[bestes] ?? ""} die größte Wahrscheinlichkeit, nämlich ${format(gewaehlt, 3)}.`,
        `Die Entropie der Verteilung ist ${format(H, 3)} Nat; eine Gleichverteilung über fünf Tokens hätte ${format(Math.log(TOKENS.length), 3)} Nat.`,
        letzteGewichte.length > 1
          ? `Die Aufmerksamkeit der letzten Position liegt zu ${format(aufVorheriges * 100, 1)} Prozent auf dem vorherigen Token; der Rest verteilt sich auf die früheren Positionen.`
          : "Der Kontext hat nur ein Token: die Aufmerksamkeit liegt ganz auf diesem einen Token.",
        temperatur < 0.95
          ? "Die Temperatur unter eins schärft die Verteilung: das gewählte Token wird wahrscheinlicher, die Entropie sinkt."
          : temperatur > 1.05
            ? "Die Temperatur über eins macht die Verteilung flacher: die Entropie steigt, das Modell wird unsicherer."
            : "Bei Temperatur eins stehen die Punktzahlen unverändert in der Softmax.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const r0 = durchlauf(kontextTokens(before), wert(before, "temperatur", 1));
    const r1 = durchlauf(kontextTokens(after), wert(after, "temperatur", 1));
    const h0 = entropie(r0.wahrscheinlichkeiten);
    const h1 = entropie(r1.wahrscheinlichkeiten);
    const events: SemanticEvent[] = [];
    if (h1 > h0 + 1e-9) {
      events.push({ name: "distributionFlattened", severity: "info", value: h1 });
    } else if (h1 < h0 - 1e-9) {
      events.push({ name: "distributionSharpened", severity: "notable", value: h1 });
    }
    return events;
  },
};
