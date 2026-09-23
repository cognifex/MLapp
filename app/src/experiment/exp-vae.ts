/**
 * LEK-23 VAE: die Latentverteilung einstellen und Stichproben daraus ziehen.
 *
 * Rechenkern: Stichprobe = Mittel plus Streuung mal Tabellenwert. Die Tabelle steht fest im Code
 * (kein Zufallsgenerator), damit derselbe Zustand immer dieselben Stichproben ergibt. Mittel,
 * Streuung und die Säulen der Zeichnung entstehen aus genau diesen Stichproben.
 */
import type { Calculated, Bar } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/**
 * Feste Zahlenfolge mit acht Werten, ähnlich einer Standardnormalverteilung: Mittel 0,0625,
 * Streuung 0,8906. Sie ersetzt den Zufallsgenerator und macht das Experiment wiederholbar.
 */
export const TABELLE: number[] = [-1.28, -0.86, -0.54, -0.16, 0.22, 0.61, 1.02, 1.49];

/**
 * Die Intervalle der Zeichnung: acht gleich breite Felder von -5,75 bis 6,25. Der Bereich deckt
 * alles ab, was bei Mittel zwischen -3 und 3 und Streuung zwischen 0,1 und 2 entstehen kann.
 */
export const INTERVALL_START = -5.75;
export const INTERVALL_BREITE = 1.5;
export const INTERVALL_ANZAHL = 8;

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function anzahl(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "anzahl", 8));
  return Math.min(TABELLE.length, Math.max(1, roh));
}

/** Die Stichproben zum eingestellten Mittel und zur eingestellten Streuung. */
export function stichproben(mu: number, sigma: number, anzahlWerte: number): number[] {
  const n = Math.min(TABELLE.length, Math.max(1, Math.round(anzahlWerte)));
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) out.push(mu + sigma * (TABELLE[i] ?? 0));
  return out;
}

export function mittel(werte: number[]): number {
  if (werte.length === 0) return 0;
  let summe = 0;
  for (const wert of werte) summe += wert;
  return summe / werte.length;
}

/** Streuung als Wurzel aus dem Mittel der quadratischen Abweichungen (geteilt durch die Anzahl). */
export function streuung(werte: number[]): number {
  if (werte.length === 0) return 0;
  const m = mittel(werte);
  let summe = 0;
  for (const wert of werte) summe += (wert - m) ** 2;
  return Math.sqrt(summe / werte.length);
}

/** Zählt, wie viele Stichproben in jedes Intervall fallen. */
export function histogramm(werte: number[]): number[] {
  const counts = new Array<number>(INTERVALL_ANZAHL).fill(0);
  for (const wert of werte) {
    const roh = Math.floor((wert - INTERVALL_START) / INTERVALL_BREITE);
    const index = Math.min(INTERVALL_ANZAHL - 1, Math.max(0, roh));
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}

/** Mitte eines Intervalls. */
export function intervallMitte(index: number): number {
  return INTERVALL_START + INTERVALL_BREITE * (index + 0.5);
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export const vae: Experiment = {
  id: "exp-vae",
  title: "Stichproben aus der Latentverteilung",
  learningGoal:
    "Mittel und Streuung der Latentverteilung einstellen und ihre Wirkung auf die Stichproben sehen",
  instructions:
    "Verändere Mittel und Streuung der Latentverteilung und die Zahl der Stichproben. Die Säulen zeigen, wie die Stichproben auf die Intervalle verteilt sind.",
  spokenDescription:
    "Eine feste Zahlenfolge aus acht Werten wird zu Stichproben verrechnet: Mittel plus Streuung mal Tabellenwert. " +
    "Zwei Regler stellen Mittel und Streuung der Latentverteilung ein, ein dritter die Zahl der Stichproben. " +
    "Acht Säulen zeigen, wie viele Stichproben in jedes Intervall fallen. Daneben stehen Mittel und Streuung der Stichproben und die Vorgaben.",
  controls: [
    {
      kind: "slider",
      id: "mu",
      label: "Mittel der Latentverteilung",
      min: -3,
      max: 3,
      step: 0.1,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "sigma",
      label: "Streuung der Latentverteilung",
      min: 0.1,
      max: 2,
      step: 0.1,
      initial: 1,
    },
    {
      kind: "slider",
      id: "anzahl",
      label: "Zahl der Stichproben",
      min: 1,
      max: 8,
      step: 1,
      initial: 8,
    },
  ],
  initialState: { mu: 0.5, sigma: 1, anzahl: 8 },
  update(state, action) {
    if (action.type === "reset") return { mu: 0.5, sigma: 1, anzahl: 8 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const mu = zahl(state, "mu", 0.5);
    const sigma = Math.max(0.01, zahl(state, "sigma", 1));
    const n = anzahl(state);
    const werte = stichproben(mu, sigma, n);
    const m = mittel(werte);
    const s = streuung(werte);
    const counts = histogramm(werte);
    const haeufigstes = counts.reduce(
      (best, wert, i) => (wert > (counts[best] ?? 0) ? i : best),
      0,
    );
    const letzter = werte[werte.length - 1] ?? mu;
    const erster = werte[0] ?? mu;

    const saeulen: Bar[] = counts.map((anzahlWerte, i) => ({
      label: format(intervallMitte(i), 1),
      value: anzahlWerte,
      highlighted: i === haeufigstes && anzahlWerte > 0,
    }));

    return {
      values: [
        { label: "Mittel der Stichproben", value: m, digits: 3 },
        { label: "Streuung der Stichproben", value: s, digits: 3 },
        { label: "Vorgabe Mittel", value: mu, digits: 3 },
        { label: "Vorgabe Streuung", value: sigma, digits: 3 },
        { label: "Abweichung des Mittels", value: m - mu, digits: 3 },
      ],
      drawing: {
        kind: "bars",
        items: saeulen,
        yMax: TABELLE.length,
        unit: "Stichproben",
      },
      sentences: [
        `${n === 1 ? "Eine Stichprobe" : `${n} Stichproben`} aus der Verteilung mit Mittel ${format(mu, 1)} und Streuung ${format(sigma, 1)}: von ${format(erster, 3)} bis ${format(letzter, 3)}.`,
        `Der Mittelwert der Stichproben ist ${format(m, 3)}, also ${format(m - mu, 3)} neben der Vorgabe; ihre Streuung ist ${format(s, 3)}.`,
        `Die meisten Stichproben liegen im Intervall um ${format(intervallMitte(haeufigstes), 1)}.`,
        n < TABELLE.length
          ? "Bei wenigen Stichproben weicht das Mittel stärker von der Vorgabe ab - die Streuung der Stichprobe schwankt von Zug zu Zug."
          : "Auch mit acht Stichproben treffen Mittel und Streuung die Vorgabe nur ungefähr.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const sigmaVorher = zahl(before, "sigma", 1);
    const sigmaNachher = zahl(after, "sigma", 1);
    const muVorher = zahl(before, "mu", 0.5);
    const muNachher = zahl(after, "mu", 0.5);
    const events: SemanticEvent[] = [];
    if (sigmaNachher > sigmaVorher + 1e-9) {
      events.push({
        name: "streuungGewachsen",
        severity: "info",
        value: streuung(stichproben(muNachher, sigmaNachher, anzahl(after))),
      });
    } else if (sigmaNachher < sigmaVorher - 1e-9) {
      events.push({
        name: "streuungGeschrumpft",
        severity: "info",
        value: streuung(stichproben(muNachher, sigmaNachher, anzahl(after))),
      });
    }
    if (Math.abs(muNachher - muVorher) > 1e-9) {
      events.push({ name: "lageVerschoben", severity: "info", value: muNachher });
    }
    return events;
  },
};

registerRules([
  {
    name: "streuungGewachsen",
    explain: (e) =>
      `Die Streuung ist größer geworden (${formatValue(e.value ?? 0, 3)}): die Stichproben liegen weiter auseinander.`,
  },
  {
    name: "streuungGeschrumpft",
    explain: (e) =>
      `Die Streuung ist kleiner geworden (${formatValue(e.value ?? 0, 3)}): die Stichproben liegen enger beieinander.`,
  },
  {
    name: "lageVerschoben",
    explain: (e) =>
      `Der Mittelwert ist verschoben (${formatValue(e.value ?? 0, 3)}): die ganze Verteilung wandert mit.`,
  },
]);
