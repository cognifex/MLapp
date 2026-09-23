/**
 * Semantische Ereignisse und Erklaerungsregeln (CONTENT-03).
 *
 * Ein Experiment meldet nicht "Regler 3 ist jetzt 4.2", sondern ein bedeutungsvolles Ereignis wie
 * "lossIncreased". Daraus entstehen (a) die Erklaerung im Text, (b) das Zahlenfeedback und
 * (c) optional die Sprachausgabe. Wiederholte Regleraenderungen werden gedrosselt, damit Sprache
 * nicht zur Dauerberieselung wird.
 */

export type Severity = "info" | "notable" | "warning";

export type SemanticEvent = {
  /** Sprechender Name, z. B. lossIncreased, derivativeNearZero, diverging. */
  name: string;
  severity: Severity;
  /** Zahlenwert, auf den sich das Ereignis bezieht (z. B. neuer Verlust). */
  value?: number;
  /** Kurze sachliche Ergaenzung, falls die Regel sie braucht. */
  detail?: string;
};

export type ExplanationContext = {
  experimentId: string;
  /** Einheit, falls das Ereignis eine Groesse traegt (z. B. "%" oder "grad"). */
  unit?: string;
  /** Zusaetzliche Formulierungen je Experiment. */
  extra?: Record<string, string>;
};

export type ExplanationRule = {
  /** Ereignisname, fuer den die Regel gilt. */
  name: string;
  explain(event: SemanticEvent, ctx: ExplanationContext): string;
};

const formatters = new Map<string, (n: number) => string>();

export function registerFormatter(name: string, fn: (n: number) => string): void {
  formatters.set(name, fn);
}

export function formatValue(value: number, digits = 2): string {
  const text = value.toFixed(digits);
  // Deutsche Schreibweise mit Komma - die Oberflaeche und die Sprachausgabe lesen dasselbe.
  return text.replace(".", ",");
}

const defaultRules: ExplanationRule[] = [
  {
    name: "derivativeNearZero",
    explain: () =>
      "Die Steigung ist hier fast null. Die Tangente liegt waagerecht - hier ist ein Hoch-, Tief- oder Sattelpunkt.",
  },
  {
    name: "derivativePositive",
    explain: (e) => `Die Steigung ist jetzt positiv, naemlich ${formatValue(e.value ?? 0)}.`,
  },
  {
    name: "derivativeNegative",
    explain: (e) => `Die Steigung ist jetzt negativ, naemlich ${formatValue(e.value ?? 0)}.`,
  },
  {
    name: "steepening",
    explain: () => "Die Kurve wird steiler: der Betrag der Steigung hat zugenommen.",
  },
  {
    name: "flattening",
    explain: () => "Die Kurve wird flacher: der Betrag der Steigung hat abgenommen.",
  },
  {
    name: "lossDecreased",
    explain: (e) =>
      `Der Verlust sinkt auf ${formatValue(e.value ?? 0)}. Der Schritt war also nuetzlich.`,
  },
  {
    name: "lossIncreased",
    explain: (e) =>
      `Der Verlust steigt auf ${formatValue(e.value ?? 0)}. Dieser Schritt ging in die falsche Richtung.`,
  },
  {
    name: "converged",
    explain: () => "Der Verlust aendert sich kaum noch. Der Abstieg ist am Ziel angekommen.",
  },
  {
    name: "diverging",
    explain: () =>
      "Der Verlust waechst mit jedem Schritt. Die Lernrate ist zu gross - das Verfahren schiesst ueber das Ziel hinaus.",
  },
  {
    name: "similarityHigh",
    explain: (e) =>
      `Die Aehnlichkeit ist gross (${formatValue(e.value ?? 0)}): die Vektoren zeigen fast in dieselbe Richtung.`,
  },
  {
    name: "similarityLow",
    explain: (e) =>
      `Die Aehnlichkeit ist klein (${formatValue(e.value ?? 0)}): die Vektoren zeigen kaum in dieselbe Richtung.`,
  },
  {
    name: "orthogonal",
    explain: () => "Das Skalarprodukt ist null: die Vektoren stehen senkrecht aufeinander.",
  },
];

export const explanationRules: ExplanationRule[] = [...defaultRules];

/** Experimente koennen eigene Erklaerungsregeln anmelden (Schluessel: Ereignisname). */
export function registerRules(rules: ExplanationRule[]): void {
  for (const rule of rules) {
    const index = explanationRules.findIndex((r) => r.name === rule.name);
    if (index >= 0) explanationRules[index] = rule;
    else explanationRules.push(rule);
  }
}

/** Uebersetzt Ereignisse in deutsche Erklaersaetze. Unbekannte Ereignisse werden uebersprungen. */
export function explain(events: SemanticEvent[], ctx: ExplanationContext): string[] {
  const out: string[] = [];
  for (const event of events) {
    const key = `${ctx.experimentId}:${event.name}`;
    const rule =
      explanationRules.find((r) => `${ctx.experimentId}:${r.name}` === key) ??
      explanationRules.find((r) => r.name === event.name);
    if (!rule) continue;
    const sentence = rule.explain(event, ctx);
    if (sentence && !out.includes(sentence)) out.push(sentence);
  }
  return out;
}

/**
 * Drosselung wiederholter Ereignisse: gleiche Ereignisse werden hoechstens alle `minIntervalMs`
 * durchgelassen, unterschiedliche Ereignisse sofort. Damit folgt die Sprachausgabe dem Finger
 * nicht bei jeder Zwischenstellung.
 */
export class EventThrottle {
  private last = new Map<string, number>();

  constructor(private readonly minIntervalMs = 900) {}

  accept(event: SemanticEvent, now: number): boolean {
    const previous = this.last.get(event.name);
    if (previous !== undefined && now - previous < this.minIntervalMs) return false;
    this.last.set(event.name, now);
    return true;
  }

  acceptAll(events: SemanticEvent[], now: number): SemanticEvent[] {
    return events.filter((e) => this.accept(e, now));
  }

  reset(): void {
    this.last.clear();
  }
}

/** Vergleicht zwei Zahlenfolgen und meldet, ob und wie sie sich unterscheiden. */
export function compareValues(
  before: number,
  after: number,
  tolerance = 1e-9,
): "up" | "down" | "equal" {
  if (Math.abs(after - before) <= tolerance) return "equal";
  return after > before ? "up" : "down";
}
