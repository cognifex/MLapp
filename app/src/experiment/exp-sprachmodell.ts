/**
 * LEK-31 Sprachmodell: die bedingte Verteilung des nächsten Tokens.
 *
 * Rechenkern: aus einem kleinen Korpus sind die Übergänge fest im Code hinterlegt (Anfang ->
 * Folge-Token mit Anzahl). Die Wahrscheinlichkeiten entstehen durch Auszählen und Teilen:
 * p = Anzahl(Anfang, Token) / Anzahl(Anfang). Keine Zahl ist von Hand gesetzt.
 *
 * Das ist genau das, was ein Sprachmodell ausgibt: für einen gegebenen Kontext eine Verteilung
 * über das ganze Vokabular. Das Modell sagt nicht "das nächste Token ist X", sondern "X ist so
 * wahrscheinlich, Y so wahrscheinlich, ...".
 */
import type { Calculated } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type KontextKey = "hund" | "katze" | "regen";

type Kandidat = { token: string; anzahl: number };
type Kontext = { anfang: string; kandidaten: Kandidat[] };
export type VerteilungEintrag = { token: string; wahrscheinlichkeit: number };

/** Fester Ausschnitt eines Korpus: drei Anfänge mit den beobachteten Fortsetzungen. */
export const KONTEXTE: Record<KontextKey, Kontext> = {
  hund: {
    anfang: "der Hund",
    kandidaten: [
      { token: "bellen", anzahl: 45 },
      { token: "laufen", anzahl: 25 },
      { token: "fressen", anzahl: 18 },
      { token: "schlafen", anzahl: 12 },
    ],
  },
  katze: {
    anfang: "die Katze",
    kandidaten: [
      { token: "schlafen", anzahl: 40 },
      { token: "springen", anzahl: 30 },
      { token: "fressen", anzahl: 20 },
      { token: "schnurren", anzahl: 10 },
    ],
  },
  regen: {
    anfang: "der Regen",
    kandidaten: [
      { token: "fällt", anzahl: 55 },
      { token: "tropft", anzahl: 20 },
      { token: "zieht", anzahl: 15 },
      { token: "aufhört", anzahl: 10 },
    ],
  },
};

const KONTEXT_SCHLUESSEL: KontextKey[] = ["hund", "katze", "regen"];

export function istKontextKey(wert: unknown): wert is KontextKey {
  return typeof wert === "string" && (KONTEXT_SCHLUESSEL as string[]).includes(wert);
}

export function kontextKeyOf(state: ExperimentState): KontextKey {
  const v = state["kontext"];
  return istKontextKey(v) ? v : "hund";
}

export function kontextVon(key: KontextKey): Kontext {
  return KONTEXTE[key];
}

/** Anzahl der beobachteten Fortsetzungen des Anfangs. */
export function beobachtungen(key: KontextKey): number {
  return KONTEXTE[key].kandidaten.reduce((summe, k) => summe + k.anzahl, 0);
}

/** Bedingte Verteilung des nächsten Tokens: Auszählen und Teilen. */
export function verteilung(key: KontextKey): VerteilungEintrag[] {
  const gesamt = beobachtungen(key);
  if (gesamt <= 0) return [];
  return KONTEXTE[key].kandidaten.map((k) => ({
    token: k.token,
    wahrscheinlichkeit: k.anzahl / gesamt,
  }));
}

/** Häufigster Folgetoken mit seiner Wahrscheinlichkeit. */
export function wahrscheinlichster(key: KontextKey): VerteilungEintrag {
  const verteilt = verteilung(key);
  let bester: VerteilungEintrag = verteilt[0] ?? { token: "", wahrscheinlichkeit: 0 };
  for (const eintrag of verteilt) {
    if (eintrag.wahrscheinlichkeit > bester.wahrscheinlichkeit) bester = eintrag;
  }
  return bester;
}

/** Entropie der bedingten Verteilung in nat. */
export function entropie(key: KontextKey): number {
  let akkumuliert = 0;
  for (const eintrag of verteilung(key)) {
    const p = eintrag.wahrscheinlichkeit;
    if (p > 0) akkumuliert += p * Math.log(p);
  }
  return -akkumuliert;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "sprachmodellSicher",
    explain: (e) =>
      `Ein Folgetoken trägt ${formatValue(e.value ?? 0, 4)} der Wahrscheinlichkeit, also mehr als die Hälfte. Hier ist die Fortsetzung gut vorhersagbar.`,
  },
  {
    name: "sprachmodellOffen",
    explain: (e) =>
      `Der wahrscheinlichste Folgetoken trägt nur ${formatValue(e.value ?? 0, 4)}. Die Fortsetzung ist offen - mehrere Tokens sind plausibel.`,
  },
]);

export const sprachmodell: Experiment = {
  id: "exp-sprachmodell",
  title: "Was folgt auf welchen Anfang?",
  learningGoal: "Die bedingte Verteilung des nächsten Tokens lesen und deuten",
  instructions:
    "Wähle einen der drei Anfänge und lies im Säulendiagramm ab, mit welcher Wahrscheinlichkeit welches Token als Nächstes kommt.",
  spokenDescription:
    "Ein Auswahlfeld mit drei Satzanfängen: der Hund, die Katze, der Regen. " +
    "Darunter ein liegendes Säulendiagramm. Jede Säule ist ein mögliches nächstes Token, ihre Länge die Wahrscheinlichkeit. " +
    "Die wahrscheinlichste Fortsetzung ist hervorgehoben. Daneben stehen die Anzahl der Beobachtungen im Korpus, " +
    "die Anzahl der Kandidaten, die größte Wahrscheinlichkeit und die Entropie der Verteilung.",
  controls: [
    {
      kind: "select",
      id: "kontext",
      label: "Anfang des Satzes",
      options: [
        { value: "hund", label: "der Hund" },
        { value: "katze", label: "die Katze" },
        { value: "regen", label: "der Regen" },
      ],
      initial: "hund",
    },
  ],
  initialState: { kontext: "hund" },
  update(state, action) {
    if (action.type === "reset") return { kontext: "hund" };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const key = kontextKeyOf(state);
    const kontext = kontextVon(key);
    const verteilt = verteilung(key);
    const gesamt = beobachtungen(key);
    const haeufigster = wahrscheinlichster(key);
    const H = entropie(key);
    const summe = verteilt.reduce((a, b) => a + b.wahrscheinlichkeit, 0);

    return {
      values: [
        { label: "Summe der Wahrscheinlichkeiten", value: summe, digits: 6 },
        { label: "Beobachtungen im Korpus", value: gesamt, digits: 0 },
        { label: "Anzahl der Kandidaten", value: verteilt.length, digits: 0 },
        { label: "Größte Wahrscheinlichkeit", value: haeufigster.wahrscheinlichkeit, digits: 4 },
        { label: "Entropie", value: H, digits: 4, unit: "nat" },
      ],
      drawing: {
        kind: "bars",
        items: verteilt.map((eintrag) => ({
          label: eintrag.token,
          value: eintrag.wahrscheinlichkeit,
          highlighted: eintrag.token === haeufigster.token,
        })),
        yMax: 1,
        horizontal: true,
      },
      sentences: [
        `Für den Anfang "${kontext.anfang}" zählt der Korpus ${gesamt} Fortsetzungen.`,
        `Am häufigsten folgt ${haeufigster.token} mit der Wahrscheinlichkeit ${format(haeufigster.wahrscheinlichkeit, 4)}.`,
        `Die Summe der ${verteilt.length} Wahrscheinlichkeiten ist ${format(summe, 6)} - das Sprachmodell gibt immer eine Verteilung aus.`,
        `Die Entropie dieser bedingten Verteilung beträgt ${format(H, 4)} nat: je größer sie ist, desto offener ist die Fortsetzung.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const keyVorher = kontextKeyOf(before);
    const keyNachher = kontextKeyOf(after);
    // Ohne Wechsel des Anfangs gibt es nichts Neues zu erklären.
    if (keyVorher === keyNachher) return [];
    const haeufigsterNachher = wahrscheinlichster(keyNachher);
    const events: SemanticEvent[] = [];
    if (haeufigsterNachher.wahrscheinlichkeit >= 0.5) {
      events.push({
        name: "sprachmodellSicher",
        severity: "info",
        value: haeufigsterNachher.wahrscheinlichkeit,
      });
    } else if (haeufigsterNachher.wahrscheinlichkeit < 0.3) {
      events.push({
        name: "sprachmodellOffen",
        severity: "notable",
        value: haeufigsterNachher.wahrscheinlichkeit,
      });
    }
    return events;
  },
};
