/**
 * LEK-32 Sampling: aus einer Verteilung eine Auswahl machen (Temperatur, Top-k, Top-p).
 *
 * Rechenkern: aus festen Logits entsteht per Softmax eine Verteilung. Danach wird geschnitten:
 * Top-k begrenzt die Anzahl, Top-p nimmt die kleinste Gruppe, die zusammen mindestens p trägt.
 * Zuletzt werden die behaltenen Wahrscheinlichkeiten auf die Summe eins umskaliert.
 *
 * Gezogen wird nicht: das Experiment zeigt nur, welche Tokens überhaupt noch zur Wahl stehen und
 * wie viel Masse sie tragen. So bleibt die Rechnung rein - kein Zufall aus einem Zufallsgenerator.
 */
import type { Bar, Calculated } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import { softmaxMitTemperatur } from "./exp-softmax.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Vokabel = { token: string; logit: number };

/** Feste Logits eines kleinen Sprachmodells für den nächsten Token. */
export const VOKABULAR: Vokabel[] = [
  { token: "hund", logit: 3 },
  { token: "katze", logit: 2 },
  { token: "regen", logit: 1.5 },
  { token: "sonne", logit: 0.5 },
  { token: "baum", logit: 0 },
  { token: "haus", logit: -1 },
];

export type Auswahl = {
  /** Indizes nach Wahrscheinlichkeit absteigend. */
  reihenfolge: number[];
  /** Indizes der behaltenen Tokens. */
  behalten: number[];
  /** Wahrscheinlichkeitssumme der behaltenen Tokens vor der Umskalierung. */
  masse: number;
  /** Wahrscheinlichkeiten der behaltenen Tokens nach der Umskalierung (Summe eins). */
  umskaliert: number[];
};

/** Verteilung des nächsten Tokens bei gegebener Temperatur. */
export function wahrscheinlichkeiten(temperatur: number): number[] {
  return softmaxMitTemperatur(
    VOKABULAR.map((vokabel) => vokabel.logit),
    temperatur,
  );
}

/** Top-k und Top-p anwenden: erst die Anzahl begrenzen, dann die Masse. */
export function auswahl(verteilung: number[], topK: number, topP: number): Auswahl {
  const stellen = verteilung.map((_, i) => i);
  const nachGroesse = (a: number, b: number) => (verteilung[b] ?? 0) - (verteilung[a] ?? 0);
  const reihenfolge = stellen.sort(nachGroesse);
  const grenze = Math.max(1, Math.round(topK));
  const behalten: number[] = [];
  let masse = 0;
  for (const index of reihenfolge) {
    if (behalten.length >= grenze) break;
    if (masse >= topP) break;
    behalten.push(index);
    masse += verteilung[index] ?? 0;
  }
  const teiler = masse > 0 ? masse : 1;
  const umskaliert = behalten.map((index) => (verteilung[index] ?? 0) / teiler);
  return { reihenfolge, behalten, masse, umskaliert };
}

function zahl(state: ExperimentState, id: string, ersatz: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : ersatz;
}

export function temperaturOf(state: ExperimentState): number {
  return Math.max(0.3, zahl(state, "temperatur", 1));
}

export function topKOf(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "topK", 3));
  return Math.min(VOKABULAR.length, Math.max(1, roh));
}

export function topPOf(state: ExperimentState): number {
  return Math.min(1, Math.max(0.05, zahl(state, "topP", 0.9)));
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "samplingSchnittStaerker",
    explain: (e) =>
      `Es bleiben ${formatValue(e.value ?? 0, 0)} Tokens: der Schnitt ist strenger, die Auswahl wird vorhersehbarer.`,
  },
  {
    name: "samplingSchnittLockerer",
    explain: (e) =>
      `Es bleiben ${formatValue(e.value ?? 0, 0)} Tokens: der Schnitt ist lockerer, die Auswahl wird vielfältiger.`,
  },
  {
    name: "samplingFestgelegt",
    explain: () =>
      "Nur ein Token überlebt den Schnitt: Temperatur und Top-p ändern nichts mehr, das Modell wählt immer dasselbe Token.",
  },
]);

/** Anzahl der Tokens, die der Schnitt im gegebenen Zustand übrig lässt. */
function anzahlBehalten(state: ExperimentState): number {
  const p = wahrscheinlichkeiten(temperaturOf(state));
  return auswahl(p, topKOf(state), topPOf(state)).behalten.length;
}

export const sampling: Experiment = {
  id: "exp-sampling",
  title: "Welche Tokens kommen überhaupt in Frage?",
  learningGoal: "Temperatur, Top-k und Top-p als Schnitte an einer Verteilung verstehen",
  instructions:
    "Stelle Temperatur, Top-k und Top-p ein. Gefüllte Säulen sind die behaltenen Tokens, gestrichelte Umrisse die abgeschnittenen.",
  spokenDescription:
    "Ein Säulendiagramm mit sechs Tokens des nächsten Schritts. Drei Regler: Temperatur, Top-k als Anzahl und Top-p als Massenanteil. " +
    "Behaltene Tokens sind mit gefüllter Säule und hervorgehoben dargestellt, abgeschnittene Tokens erscheinen nur als gestrichelter Umriss. " +
    "Daneben stehen die Anzahl der behaltenen und der abgeschnittenen Tokens, die Wahrscheinlichkeitssumme der behaltenen Tokens " +
    "vor der Umskalierung und die Summe danach.",
  controls: [
    {
      kind: "slider",
      id: "temperatur",
      label: "Temperatur T",
      min: 0.3,
      max: 2,
      step: 0.1,
      initial: 1,
    },
    { kind: "slider", id: "topK", label: "Top-k: Anzahl", min: 1, max: 6, step: 1, initial: 3 },
    {
      kind: "slider",
      id: "topP",
      label: "Top-p: Massenanteil",
      min: 0.05,
      max: 1,
      step: 0.05,
      initial: 0.9,
    },
  ],
  initialState: { temperatur: 1, topK: 3, topP: 0.9 },
  update(state, action) {
    if (action.type === "reset") return { temperatur: 1, topK: 3, topP: 0.9 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const temperatur = temperaturOf(state);
    const topK = topKOf(state);
    const topP = topPOf(state);
    const p = wahrscheinlichkeiten(temperatur);
    const geschnitten = auswahl(p, topK, topP);
    const neueWerte = new Map<number, number>();
    geschnitten.behalten.forEach((index, platz) => {
      neueWerte.set(index, geschnitten.umskaliert[platz] ?? 0);
    });
    const summeNeu = geschnitten.umskaliert.reduce((a, b) => a + b, 0);
    const abgeschnitten = VOKABULAR.length - geschnitten.behalten.length;

    const items: Bar[] = VOKABULAR.map((vokabel, i) => {
      const original = p[i] ?? 0;
      const behalten = neueWerte.has(i);
      return {
        label: vokabel.token,
        value: behalten ? (neueWerte.get(i) ?? 0) : 0,
        ghost: original,
        highlighted: behalten,
      };
    });

    return {
      values: [
        { label: "Behaltene Tokens", value: geschnitten.behalten.length, digits: 0 },
        { label: "Abgeschnittene Tokens", value: abgeschnitten, digits: 0 },
        {
          label: "Wahrscheinlichkeitssumme der behaltenen Tokens",
          value: geschnitten.masse,
          digits: 4,
        },
        { label: "Summe nach der Umskalierung", value: summeNeu, digits: 6 },
      ],
      drawing: { kind: "bars", items, yMax: 1, horizontal: true },
      sentences: [
        `Die Verteilung über ${VOKABULAR.length} Tokens wird bei der Temperatur ${format(temperatur, 2)} beschnitten: ${geschnitten.behalten.length} Tokens bleiben, ${abgeschnitten} fallen weg.`,
        `Die behaltenen Tokens tragen zusammen die Wahrscheinlichkeitssumme ${format(geschnitten.masse, 4)}.`,
        `Nach der Umskalierung steht ihre Summe auf ${format(summeNeu, 6)}: gezogen wird nur noch aus der Auswahl.`,
        `Der Schnitt aus Top-k ${topK} und Top-p ${format(topP, 2)} trifft zuerst die unwahrscheinlichsten Tokens; die kleinen Wahrscheinlichkeiten der behaltenen Tokens werden dabei angehoben.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = anzahlBehalten(before);
    const nachher = anzahlBehalten(after);
    const events: SemanticEvent[] = [];
    if (nachher < vorher) {
      events.push({ name: "samplingSchnittStaerker", severity: "info", value: nachher });
    } else if (nachher > vorher) {
      events.push({ name: "samplingSchnittLockerer", severity: "info", value: nachher });
    }
    if (nachher === 1 && vorher > 1) {
      events.push({ name: "samplingFestgelegt", severity: "notable" });
    }
    return events;
  },
};
