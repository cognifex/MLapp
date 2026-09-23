/**
 * LEK-43 Praeferenzbasiertes Posttraining: aus Bewertungen wird eine Vorliebe, aus der Vorliebe
 * ein Update.
 *
 * Rechenkern: zwei Antworten mit je zwei festen Bewertungen. Aus dem Mittelwert der Bewertungen
 * entsteht der Abstand der Antworten. Die Praeferenzstaerke gibt an, wie deutlich die bevorzugte
 * Antwort gewinnen soll: ihre Wahrscheinlichkeit ist Sigma von Praeferenzstaerke mal Abstand.
 * Das Update ist bewusst einfach gehalten: die bevorzugte Antwort wird um eine feste Schrittweite
 * mal Praeferenzstaerke angehoben, die andere um denselben Betrag gesenkt. Alles ist rein.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** So weit verschiebt eine Einheit Praeferenzstaerke die Bewertungen - fest im Code. */
export const SCHRITT_JE_STAERKE = 0.4;

export type Antwort = { id: string; text: string; bewertungen: [number, number] };

/** Die beiden Antworten mit ihren Bewertungen - fest im Code. */
export const ANTWORTEN: Antwort[] = [
  { id: "A", text: "Kurze, direkte Antwort auf die Frage.", bewertungen: [4, 5] },
  { id: "B", text: "Lange Antwort, die am Thema vorbeigeht.", bewertungen: [2, 3] },
];

const ERSTE: Antwort = { id: "A", text: "", bewertungen: [4, 5] };
const ZWEITE: Antwort = { id: "B", text: "", bewertungen: [2, 3] };

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

function wert(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function mittelwert(werte: [number, number]): number {
  return ((werte[0] ?? 0) + (werte[1] ?? 0)) / 2;
}

/** Sigmoid: macht aus einer Punktzahl eine Wahrscheinlichkeit zwischen null und eins. */
export function sigma(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export type Rechnung = {
  /** Mittelwert der Bewertungen je Antwort. */
  mittel: [number, number];
  /** Abstand der Antworten vor dem Update. */
  abstandVorher: number;
  /** Wahrscheinlichkeit, dass die bevorzugte Antwort gewinnt. */
  praeferenz: number;
  /** Wie weit das Update jede Bewertung verschiebt. */
  schub: number;
  /** Abstand der Antworten nach dem Update. */
  abstandNachher: number;
  /** Kennung der bevorzugten Antwort (hoeherer Mittelwert). */
  bevorzugt: string;
  /** Kennung der anderen Antwort. */
  benachteiligt: string;
  /** Bewertungen nach dem Update, je Antwort ein Paar. */
  nachher: [number, number][];
};

/** Rechnet Bewertungen, Praeferenzwahrscheinlichkeit und das vereinfachte Update durch. */
export function rechnung(staerke: number): Rechnung {
  const a = ANTWORTEN[0] ?? ERSTE;
  const b = ANTWORTEN[1] ?? ZWEITE;
  const mittelA = mittelwert(a.bewertungen);
  const mittelB = mittelwert(b.bewertungen);
  const abstandVorher = Math.abs(mittelA - mittelB);
  const bevorzugt = mittelA >= mittelB ? a.id : b.id;
  const benachteiligt = bevorzugt === a.id ? b.id : a.id;
  const praeferenz = sigma(staerke * abstandVorher);
  const schub = SCHRITT_JE_STAERKE * staerke;
  const nachher: [number, number][] = ANTWORTEN.map((antwort): [number, number] => {
    const richtung = antwort.id === bevorzugt ? 1 : -1;
    return [
      (antwort.bewertungen[0] ?? 0) + richtung * schub,
      (antwort.bewertungen[1] ?? 0) + richtung * schub,
    ];
  });
  const mittelNachher = nachher.map((werte) => ((werte[0] ?? 0) + (werte[1] ?? 0)) / 2);
  const groesster = Math.max(...mittelNachher);
  const kleinster = Math.min(...mittelNachher);
  return {
    mittel: [mittelA, mittelB],
    abstandVorher,
    praeferenz,
    schub,
    abstandNachher: groesster - kleinster,
    bevorzugt,
    benachteiligt,
    nachher,
  };
}

/** Saeulen der Bewertungen; der Umriss zeigt den Stand vor dem Update. */
export function bewertungsbalken(r: Rechnung): Bar[] {
  const balken: Bar[] = [];
  for (let i = 0; i < ANTWORTEN.length; i += 1) {
    const antwort = ANTWORTEN[i];
    if (!antwort) continue;
    const nachher = r.nachher[i] ?? [0, 0];
    for (let k = 0; k < antwort.bewertungen.length; k += 1) {
      balken.push({
        label: `Antwort ${antwort.id} · Bewertung ${k + 1}`,
        value: nachher[k] ?? 0,
        ghost: antwort.bewertungen[k] ?? 0,
        highlighted: antwort.id === r.bevorzugt,
      });
    }
  }
  return balken;
}

/** Obere Grenze der Achse: die Bewertungsskala bis fuenf, sonst der hoechste vorkommende Wert. */
function achsenobergrenze(r: Rechnung): number {
  let groesste = 5;
  for (const balken of bewertungsbalken(r)) {
    if (balken.value > groesste) groesste = balken.value;
    const umriss = balken.ghost ?? 0;
    if (umriss > groesste) groesste = umriss;
  }
  return Math.ceil(groesste * 2) / 2;
}

registerRules([
  {
    name: "preferenceGapWidened",
    explain: (e) =>
      `Der Abstand der Antworten waechst auf ${format(e.value ?? 0, 2)}: das Update trennt die bevorzugte Antwort weiter von der anderen.`,
  },
  {
    name: "preferenceUnchanged",
    explain: () =>
      "Bei Praeferenzstaerke null passiert nichts: beide Antworten sind gleich wahrscheinlich, der Abstand bleibt wie er ist.",
  },
]);

export const praeferenzen: Experiment = {
  id: "exp-praeferenzen",
  title: "Zwei Antworten, zwei Bewertungen, ein Update",
  learningGoal: "Aus Bewertungen eine Praeferenz und daraus einen Update-Schritt machen",
  instructions:
    "Ziehe die Präferenzstärke. Die Säulen zeigen die Bewertungen nach dem Update, der gestrichelte Umriss den Stand davor.",
  spokenDescription:
    "Zwei Antworten mit je zwei Bewertungen. Ein Regler bestimmt die Praeferenzstärke. " +
    "Säulen zeigen die Bewertungen nach dem Update, der gestrichelte Umriss den Stand davor. " +
    "Die hervorgehobenen Säulen gehören der bevorzugten Antwort. Darunter stehen der Abstand der Antworten und die Präferenzwahrscheinlichkeit.",
  controls: [
    {
      kind: "slider",
      id: "staerke",
      label: "Präferenzstärke",
      min: 0,
      max: 3,
      step: 0.25,
      initial: 1,
    },
  ],
  initialState: { staerke: 1 },
  update(state, action) {
    if (action.type === "reset") return { staerke: 1 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const staerke = wert(state, "staerke", 1);
    const r = rechnung(staerke);
    const mittelA = r.mittel[0] ?? 0;
    const mittelB = r.mittel[1] ?? 0;

    return {
      values: [
        { label: "Abstand der Antworten vorher", value: r.abstandVorher, digits: 3 },
        { label: "Abstand der Antworten nachher", value: r.abstandNachher, digits: 3 },
        { label: "Präferenzwahrscheinlichkeit", value: r.praeferenz, digits: 4 },
        { label: "Verschiebung je Antwort", value: r.schub, digits: 3 },
      ],
      drawing: {
        kind: "bars",
        items: bewertungsbalken(r),
        yMax: achsenobergrenze(r),
      },
      sentences: [
        `Die erste Antwort wird im Mittel mit ${format(mittelA, 1)} bewertet, die zweite mit ${format(mittelB, 1)}; der Abstand ist ${format(r.abstandVorher, 1)}.`,
        `Bei Präferenzstärke ${format(staerke, 2)} gewinnt die bevorzugte Antwort mit der Wahrscheinlichkeit ${format(r.praeferenz, 3)}.`,
        `Das Update verschiebt jede Bewertung um ${format(r.schub, 2)}: der Abstand wächst von ${format(r.abstandVorher, 1)} auf ${format(r.abstandNachher, 1)}.`,
        staerke > 0
          ? `Angehoben wird Antwort ${r.bevorzugt}, gesenkt wird Antwort ${r.benachteiligt}.`
          : "Ohne Präferenzstärke gibt es kein Update: die Bewertungen bleiben, wie sie sind.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const r0 = rechnung(wert(before, "staerke", 1));
    const r1 = rechnung(wert(after, "staerke", 1));
    const events: SemanticEvent[] = [];
    if (r1.abstandNachher > r0.abstandNachher + 1e-9) {
      events.push({ name: "preferenceGapWidened", severity: "info", value: r1.abstandNachher });
    } else if (Math.abs(r1.abstandNachher - r0.abstandNachher) <= 1e-9) {
      events.push({ name: "preferenceUnchanged", severity: "notable", value: r1.abstandNachher });
    }
    return events;
  },
};
