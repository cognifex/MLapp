/**
 * LEK-06 Wahrscheinlichkeit: Verteilung einstellen und Stichproben ziehen.
 *
 * Rechenkern: die Wahrscheinlichkeiten einer Binomialverteilung, deren n und p aus Erwartungswert
 * und Streuung bestimmt werden, oder einer Glockenform auf den Werten 0 bis 8. Die Stichproben
 * kommen aus dem Regler "seed" (linearer Kongruenzgenerator mit 32 Bit) - nie aus Math.random().
 * Damit ist calculate() rein: gleiche Regler, gleiche Zahlen, gleiche Zeichnung.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Größte Zahl an Einzelversuchen der Binomialverteilung. */
export const N_MAX = 20;
/** Anzahl der Werte der Glockenform: 0 bis 8. */
export const GLOCKEN_WERTE = 9;

const STICHPROBE_MIN = 20;
const STICHPROBE_MAX = 500;
const MU_MIN = 0.5;
const MU_MAX = 7.5;
const SIGMA_MIN = 0.3;
const SIGMA_MAX = 2.5;

const START: ExperimentState = {
  verteilung: "binomial",
  mu: 4,
  sigma: 1.4,
  stichprobe: 100,
  seed: 7,
};

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" && Number.isFinite(wert) ? wert : fallback;
}

function text(state: ExperimentState, id: string, fallback: string): string {
  const wert = state[id];
  return typeof wert === "string" ? wert : fallback;
}

export function begrenze(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

/** Kaufmännisches Runden: in JavaScript und in Python dieselbe Zahl. */
export function ganzeZahl(wert: number): number {
  return Math.floor(wert + 0.5);
}

export function formatiere(wert: number, stellen = 3): string {
  return wert.toFixed(stellen).replace(".", ",");
}

export type BinomialForm = { n: number; p: number };

/**
 * n und p aus Erwartungswert und Streuung. Für eine Binomialverteilung gilt
 * Streuung² = n p (1-p) und Erwartungswert = n p, also p = 1 - Streuung²/Erwartungswert und
 * n = Erwartungswert/p. n wird auf ganze Zahlen gerundet; danach wird p aus n nachgezogen.
 */
export function binomialForm(mu: number, sigma: number): BinomialForm {
  const varianz = sigma * sigma;
  if (varianz > 0 && varianz < mu) {
    const p = 1 - varianz / mu;
    const n = begrenze(ganzeZahl(mu / p), 1, N_MAX);
    return { n, p: begrenze(mu / n, 0.02, 0.98) };
  }
  // Nicht darstellbar: die breiteste Verteilung mit p = 0,1 nehmen.
  const n = begrenze(ganzeZahl(mu / 0.1), 1, N_MAX);
  return { n, p: begrenze(mu / n, 0.02, 0.98) };
}

/** P(0) = (1-p)^n und P(k+1) = P(k) · (n-k)/(k+1) · p/(1-p). */
export function binomialWahrscheinlichkeiten(n: number, p: number): number[] {
  const q = 1 - p;
  const probs: number[] = [];
  let term = 1;
  for (let i = 0; i < n; i += 1) term *= q;
  probs.push(term);
  for (let k = 1; k <= n; k += 1) {
    term = term * ((n - k + 1) / k) * (p / q);
    probs.push(term);
  }
  return probs;
}

/** Glockenform auf den Werten 0 bis 8, auf die Summe eins gebracht. */
export function glockenWahrscheinlichkeiten(mu: number, sigma: number): number[] {
  const gewichte: number[] = [];
  let summe = 0;
  for (let k = 0; k < GLOCKEN_WERTE; k += 1) {
    const abstand = k - mu;
    const gewicht = Math.exp(-(abstand * abstand) / (2 * sigma * sigma));
    gewichte.push(gewicht);
    summe += gewicht;
  }
  return gewichte.map((gewicht) => gewicht / summe);
}

/**
 * Zieht `groesse` Werte nach den Wahrscheinlichkeiten `probs` (Umkehr der Summenfunktion).
 * Die Zufallszahlen stammen aus einem linearen Kongruenzgenerator mit dem Reglerwert als Startwert.
 */
export function stichprobenZaehler(probs: number[], groesse: number, seed: number): number[] {
  const zaehler = probs.map(() => 0);
  let zustand = Math.trunc(seed) | 0;
  for (let i = 0; i < groesse; i += 1) {
    zustand = (Math.imul(1664525, zustand) + 1013904223) | 0;
    const u = (zustand >>> 0) / 4294967296;
    let summe = 0;
    let gewaehlt = probs.length - 1;
    for (let k = 0; k < probs.length; k += 1) {
      summe += probs[k] ?? 0;
      if (u < summe) {
        gewaehlt = k;
        break;
      }
    }
    zaehler[gewaehlt] = (zaehler[gewaehlt] ?? 0) + 1;
  }
  return zaehler;
}

export function stichprobenMittel(zaehler: number[]): number {
  let gewichteteSumme = 0;
  let anzahl = 0;
  for (let k = 0; k < zaehler.length; k += 1) {
    const anzahlHier = zaehler[k] ?? 0;
    gewichteteSumme += k * anzahlHier;
    anzahl += anzahlHier;
  }
  return anzahl > 0 ? gewichteteSumme / anzahl : 0;
}

export function haeufigsterWert(zaehler: number[]): number {
  let bester = 0;
  for (let k = 1; k < zaehler.length; k += 1) {
    if ((zaehler[k] ?? 0) > (zaehler[bester] ?? 0)) bester = k;
  }
  return bester;
}

export type Kenngroessen = {
  art: "binomial" | "normal";
  mu: number;
  sigma: number;
  n: number;
  p: number;
  groesse: number;
  probs: number[];
  zaehler: number[];
  erwartet: number;
  streuung: number;
  mittel: number;
  haeufigster: number;
  summe: number;
};

/** Alles, was Zahlen, Zeichnung und Sätze brauchen - einmal gerechnet. */
export function kenngroessen(state: ExperimentState): Kenngroessen {
  const art = text(state, "verteilung", "binomial") === "normal" ? "normal" : "binomial";
  const mu = begrenze(zahl(state, "mu", 4), MU_MIN, MU_MAX);
  const sigma = begrenze(zahl(state, "sigma", 1.4), SIGMA_MIN, SIGMA_MAX);
  const groesse = ganzeZahl(
    begrenze(zahl(state, "stichprobe", 100), STICHPROBE_MIN, STICHPROBE_MAX),
  );
  const seed = ganzeZahl(zahl(state, "seed", 7));
  const form = binomialForm(mu, sigma);
  const probs =
    art === "normal"
      ? glockenWahrscheinlichkeiten(mu, sigma)
      : binomialWahrscheinlichkeiten(form.n, form.p);
  const zaehler = stichprobenZaehler(probs, groesse, seed);
  let summe = 0;
  for (const p of probs) summe += p;
  return {
    art,
    mu,
    sigma,
    n: form.n,
    p: form.p,
    groesse,
    probs,
    zaehler,
    erwartet: art === "normal" ? mu : form.n * form.p,
    streuung: art === "normal" ? sigma : Math.sqrt(form.n * form.p * (1 - form.p)),
    mittel: stichprobenMittel(zaehler),
    haeufigster: haeufigsterWert(zaehler),
    summe,
  };
}

registerRules([
  {
    name: "sampleMatchesMean",
    explain: (e) =>
      `Der Mittelwert der Stichprobe liegt jetzt bei ${formatiere(e.value ?? 0)} und damit dicht am Erwartungswert.`,
  },
  {
    name: "sampleDeviates",
    explain: (e) =>
      `Der Mittelwert der Stichprobe liegt bei ${formatiere(e.value ?? 0)}; der Erwartungswert ist weiter entfernt.`,
  },
  {
    name: "distributionChanged",
    explain: () =>
      "Die Verteilung hat jetzt einen anderen Wertebereich: es gibt mehr oder weniger mögliche Werte.",
  },
]);

export const wahrscheinlichkeit: Experiment = {
  id: "exp-wahrscheinlichkeit",
  title: "Verteilung einstellen und Stichproben ziehen",
  learningGoal:
    "Erwartungswert und Streuung einer Verteilung mit dem Verhalten der Stichprobe vergleichen",
  instructions:
    "Stelle mit den Reglern Erwartungswert und Streuung ein und beobachte die Säulen. Der Regler Stichprobengröße zieht mehr oder weniger Werte, der Regler Startwert eine andere Stichprobe.",
  spokenDescription:
    "Ein Säulendiagramm über den Werten null bis acht. Die Säulen zeigen die Wahrscheinlichkeiten der eingestellten " +
    "Verteilung, die gestrichelten Umrisse die Anteile der gezogenen Stichprobe. Mit Erwartungswert und Streuung " +
    "verschiebt und verbreitert sich die Verteilung, mit der Stichprobengröße werden mehr oder weniger Werte gezogen.",
  controls: [
    {
      kind: "select",
      id: "verteilung",
      label: "Art der Verteilung",
      options: [
        { value: "binomial", label: "Binomialverteilung" },
        { value: "normal", label: "Glockenform" },
      ],
      initial: "binomial",
    },
    {
      kind: "slider",
      id: "mu",
      label: "Erwartungswert",
      min: MU_MIN,
      max: MU_MAX,
      step: 0.1,
      initial: 4,
    },
    {
      kind: "slider",
      id: "sigma",
      label: "Streuung",
      min: SIGMA_MIN,
      max: SIGMA_MAX,
      step: 0.1,
      initial: 1.4,
    },
    {
      kind: "slider",
      id: "stichprobe",
      label: "Stichprobengröße",
      min: STICHPROBE_MIN,
      max: STICHPROBE_MAX,
      step: 20,
      initial: 100,
    },
    {
      kind: "slider",
      id: "seed",
      label: "Startwert der Stichprobe",
      min: 1,
      max: 99,
      step: 1,
      initial: 7,
    },
  ],
  initialState: { ...START },
  update(state, action) {
    if (action.type === "reset") return { ...START };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const k = kenngroessen(state);
    const staerksteWahrscheinlichkeit = Math.max(...k.probs);
    const staerksterAnteil = Math.max(...k.zaehler.map((anzahl) => anzahl / k.groesse));
    const items: Bar[] = k.probs.map((wahrscheinlichkeit, i) => ({
      label: `k = ${i}`,
      value: wahrscheinlichkeit,
      ghost: (k.zaehler[i] ?? 0) / k.groesse,
      highlighted: i === k.haeufigster,
    }));

    const anzahlHaeufigster = k.zaehler[k.haeufigster] ?? 0;
    const saetze: string[] = [];
    if (k.art === "binomial") {
      saetze.push(
        `Die Verteilung ist binomial mit n gleich ${k.n} und p gleich ${formatiere(k.p)}; ihr ` +
          `Erwartungswert ist ${formatiere(k.erwartet)} und ihre Streuung ${formatiere(k.streuung)}.`,
      );
      if (Math.abs(k.erwartet - k.mu) > 0.05 || Math.abs(k.streuung - k.sigma) > 0.05) {
        saetze.push(
          `Eine Binomialverteilung mit Erwartungswert ${formatiere(k.mu)} und Streuung ` +
            `${formatiere(k.sigma)} gibt es nicht; gezeigt wird die breiteste darstellbare Verteilung ` +
            `mit n gleich ${k.n} und p gleich ${formatiere(k.p)}.`,
        );
      }
    } else {
      saetze.push(
        `Die Verteilung ist eine Glockenform um den Erwartungswert ${formatiere(k.erwartet)} mit der ` +
          `Streuung ${formatiere(k.streuung)}.`,
      );
    }
    saetze.push(
      `Von ${k.groesse} gezogenen Werten liegt der Mittelwert bei ${formatiere(k.mittel)}; der häufigste ` +
        `Wert ist ${k.haeufigster} und kommt ${anzahlHaeufigster} mal vor.`,
    );
    saetze.push(
      `Die Wahrscheinlichkeiten der Verteilung summieren sich zu ${formatiere(k.summe)}; die Säulen zeigen ` +
        `die Wahrscheinlichkeiten, die gestrichelten Umrisse die Anteile der Stichprobe.`,
    );

    const values =
      k.art === "binomial"
        ? [
            { label: "Erwartungswert", value: k.erwartet, digits: 3 },
            { label: "Streuung", value: k.streuung, digits: 3 },
            { label: "n", value: k.n, digits: 0 },
            { label: "p", value: k.p, digits: 3 },
            { label: "Stichprobengröße", value: k.groesse, digits: 0 },
            { label: "Mittel der Stichprobe", value: k.mittel, digits: 3 },
            { label: "Häufigster Wert", value: k.haeufigster, digits: 0 },
          ]
        : [
            { label: "Erwartungswert", value: k.erwartet, digits: 3 },
            { label: "Streuung", value: k.streuung, digits: 3 },
            { label: "Anzahl Werte", value: k.probs.length, digits: 0 },
            { label: "Stichprobengröße", value: k.groesse, digits: 0 },
            { label: "Mittel der Stichprobe", value: k.mittel, digits: 3 },
            { label: "Häufigster Wert", value: k.haeufigster, digits: 0 },
          ];

    return {
      values,
      drawing: {
        kind: "bars",
        items,
        yMax: Math.max(staerksteWahrscheinlichkeit, staerksterAnteil) * 1.05,
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = kenngroessen(before);
    const nachher = kenngroessen(after);
    const events: SemanticEvent[] = [];
    const abweichungVorher = Math.abs(vorher.mittel - vorher.erwartet);
    const abweichungNachher = Math.abs(nachher.mittel - nachher.erwartet);
    if (abweichungNachher < abweichungVorher - 1e-9) {
      events.push({ name: "sampleMatchesMean", severity: "info", value: nachher.mittel });
    } else if (abweichungNachher > abweichungVorher + 1e-9) {
      events.push({ name: "sampleDeviates", severity: "notable", value: nachher.mittel });
    }
    if (nachher.probs.length !== vorher.probs.length) {
      events.push({ name: "distributionChanged", severity: "info" });
    }
    return events;
  },
};
