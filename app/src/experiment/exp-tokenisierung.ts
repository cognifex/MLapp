/**
 * LEK-29 Tokenisierung: Text in Tokens zerlegen und die Token-Nummern ansehen.
 *
 * Rechenkern: Der Text wird an Leerzeichen getrennt, Satzzeichen am Rand werden eigene Tokens.
 * Wörter aus der festen Wörterbuchliste ergeben genau ein Token. Unbekannte Wörter werden von
 * links nach rechts in die längsten passenden Stücke zerlegt; Einzelzeichen sind der Notausgang.
 * Kein Netz, kein Zufall: dieselbe Zerlegung ergibt immer dieselben Tokens und Nummern.
 *
 * Die Nummern sind fest vergeben: Wörterbuch 1 bis n, Satzzeichen ab 100, Stücke ab 200,
 * Einzelzeichen ab 400 plus Zeichencode.
 */
import type { Bar, Calculated, DrawingSpec } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Token = {
  /** Der Text des Tokens, wie er im Satz steht. */
  text: string;
  /** Die feste Nummer des Tokens. */
  id: number;
  /** Wahr, wenn das Token erst durch Zerlegen eines unbekannten Wortes entstanden ist. */
  stueck: boolean;
  /** Das Wort, aus dem das Token stammt. */
  wort: string;
};

/** Feste Wörterbuchliste; die Nummer ist die Position plus eins. */
export const WOERTER: readonly string[] = [
  "der",
  "die",
  "das",
  "hund",
  "katze",
  "jagt",
  "läuft",
  "kind",
  "spielt",
  "im",
  "garten",
  "und",
  "ein",
  "ball",
  "ist",
  "groß",
  "klein",
  "heute",
  "sonne",
  "scheint",
  "modell",
  "text",
  "liest",
  "mit",
  "dem",
  "satz",
  "zerlegt",
  "tokens",
  "einem",
  "wort",
  "besteht",
  "den",
  "in",
];

/** Satzzeichen werden zu eigenen Tokens; Nummern ab 100. */
export const SATZZEICHEN: readonly string[] = [".", ",", "!", "?", ":", ";"];

/** Stücke für unbekannte Wörter, längste zuerst geprüft; Nummern ab 200. */
export const STUECKE: readonly string[] = [
  "keit",
  "heit",
  "lich",
  "ung",
  "ver",
  "un",
  "be",
  "ge",
  "en",
  "er",
  "es",
  "in",
  "te",
  "st",
];

export type Beispiel = { key: string; text: string };

/** Vier Beispielsätze, alle aus der Wörterbuchliste gebaut - die letzten beiden enthalten ein fremdes Wort. */
export const BEISPIELE: readonly [Beispiel, Beispiel, Beispiel, Beispiel] = [
  { key: "s1", text: "Der Hund jagt die Katze." },
  { key: "s2", text: "Das Kind spielt im Garten und läuft." },
  { key: "s3", text: "Ein Modell liest den Text und zerlegt ihn in Tokens." },
  { key: "s4", text: "Heute scheint die Sonne, und das Kind lernt." },
];

function wahl(state: ExperimentState, id: string, fallback: string): string {
  const v = state[id];
  return typeof v === "string" ? v : fallback;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export function beispielZu(key: string): Beispiel {
  return BEISPIELE.find((b) => b.key === key) ?? BEISPIELE[0];
}

function satzzeichenId(zeichen: string): number {
  const i = SATZZEICHEN.indexOf(zeichen);
  return i >= 0 ? 100 + i : 100;
}

function woerterbuchId(wort: string): number | undefined {
  const i = WOERTER.indexOf(wort.toLowerCase());
  return i >= 0 ? i + 1 : undefined;
}

function stueckId(stueck: string): number {
  const i = STUECKE.indexOf(stueck);
  return i >= 0 ? 200 + i : 400 + stueck.charCodeAt(0);
}

/** Zerlegt ein unbekanntes Wort in die längsten passenden Stücke. */
export function zerlegeWort(wort: string): Token[] {
  const stuecke: Token[] = [];
  let i = 0;
  while (i < wort.length) {
    let treffer = "";
    for (const kandidat of STUECKE) {
      if (kandidat.length > treffer.length && wort.startsWith(kandidat, i)) treffer = kandidat;
    }
    const teil = treffer.length > 0 ? treffer : wort.charAt(i);
    if (teil.length === 0) break;
    stuecke.push({ text: teil, id: stueckId(teil), stueck: true, wort });
    i += teil.length;
  }
  return stuecke;
}

/** Der ganze Text als Tokenfolge. */
export function zerlege(text: string): Token[] {
  const tokens: Token[] = [];
  for (const stueck of text.split(/\s+/)) {
    if (stueck.length === 0) continue;
    let wort = stueck;
    const vorne: string[] = [];
    const hinten: string[] = [];
    while (wort.length > 0 && SATZZEICHEN.includes(wort.charAt(0))) {
      vorne.push(wort.charAt(0));
      wort = wort.slice(1);
    }
    while (wort.length > 0 && SATZZEICHEN.includes(wort.charAt(wort.length - 1))) {
      hinten.unshift(wort.charAt(wort.length - 1));
      wort = wort.slice(0, -1);
    }
    for (const zeichen of vorne) {
      tokens.push({ text: zeichen, id: satzzeichenId(zeichen), stueck: false, wort: stueck });
    }
    if (wort.length > 0) {
      const treffer = woerterbuchId(wort);
      if (treffer !== undefined) {
        tokens.push({ text: wort, id: treffer, stueck: false, wort: stueck });
      } else {
        tokens.push(...zerlegeWort(wort));
      }
    }
    for (const zeichen of hinten) {
      tokens.push({ text: zeichen, id: satzzeichenId(zeichen), stueck: false, wort: stueck });
    }
  }
  return tokens;
}

/** Die Wörter eines Textes, die nicht im Wörterbuch stehen (jedes nur einmal). */
export function unbekannteWoerter(text: string): string[] {
  const gefunden: string[] = [];
  for (const token of zerlege(text)) {
    if (token.stueck && !gefunden.includes(token.wort)) gefunden.push(token.wort);
  }
  return gefunden;
}

/** Anzahl der Wörter: alles, was durch Leerzeichen getrennt ist. */
export function wortAnzahl(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Anteil der Tokens in Prozent, die erst durch das Zerlegen unbekannter Wörter entstehen. */
export function anteilStuecke(key: string): number {
  const tokens = zerlege(beispielZu(key).text);
  if (tokens.length === 0) return 0;
  return (tokens.filter((t) => t.stueck).length / tokens.length) * 100;
}

registerRules([
  {
    name: "textNeedsMoreTokens",
    explain: (e) =>
      `Der neue Satz braucht mehr Stücke: ${format(e.value ?? 0, 1)} Prozent aller Tokens entstehen erst durch das Zerlegen unbekannter Wörter.`,
  },
  {
    name: "textNeedsFewerTokens",
    explain: (e) =>
      `Der neue Satz kommt mit weniger Stücken aus: nur ${format(e.value ?? 0, 1)} Prozent aller Tokens entstehen durch das Zerlegen unbekannter Wörter.`,
  },
]);

export const tokenisierung: Experiment = {
  id: "exp-tokenisierung",
  title: "Text in Tokens zerlegen",
  learningGoal:
    "Sehen, wie ein Satz in Tokens und Nummern zerfällt und wie viele Tokens ein Wort kostet",
  instructions:
    "Wähle einen Beispielsatz. Die Balken zeigen jedes Token in seiner Länge, hinter dem Token steht seine Nummer.",
  spokenDescription:
    "Ein waagerechtes Balkendiagramm. Jeder Balken ist ein Token des gewählten Satzes; " +
    "seine Länge ist die Anzahl der Zeichen, und hinter dem Token steht seine Nummer. " +
    "Die Auswahl Beispielsatz stellt einen von vier Sätzen ein. Daneben stehen die Anzahl der Tokens, " +
    "die Anzahl der Wörter, die Tokens je Wort und der Anteil, der erst durch das Zerlegen entsteht.",
  controls: [
    {
      kind: "select",
      id: "satz",
      label: "Beispielsatz",
      options: BEISPIELE.map((b) => ({ value: b.key, label: b.text })),
      initial: "s1",
    },
  ],
  initialState: { satz: "s1" },
  update(state, action) {
    if (action.type === "reset") return { satz: "s1" };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const beispiel = beispielZu(wahl(state, "satz", "s1"));
    const tokens = zerlege(beispiel.text);
    const woerter = wortAnzahl(beispiel.text);
    const stuecke = tokens.filter((t) => t.stueck).length;
    const anteil = anteilStuecke(beispiel.key);
    const laengen = tokens.map((t) => t.text.length);
    const laengste = Math.max(...laengen);
    const laengstesToken = tokens[laengen.indexOf(laengste)]?.text ?? "";
    const unbekannt = unbekannteWoerter(beispiel.text);
    const stueckListe = tokens
      .filter((t) => t.stueck)
      .map((t) => `${t.text} (${t.id})`)
      .join(", ");

    const items: Bar[] = tokens.map((t) => ({
      label: `${t.text} (${t.id})`,
      value: t.text.length,
    }));

    const drawing: DrawingSpec = {
      kind: "bars",
      items,
      yMax: Math.max(1, laengste),
      horizontal: true,
    };

    const saetze: string[] = [
      `Der Satz „${beispiel.text}“ zerfällt in ${tokens.length} Tokens; er besteht aus ${woerter} Wörtern.`,
      `Das längste Token ist „${laengstesToken}“ mit ${laengste} Zeichen.`,
    ];
    if (unbekannt.length > 0) {
      const erstes = unbekannt[0] ?? "";
      const liste =
        unbekannt.length === 1 ? `„${erstes}“` : unbekannt.map((w) => `„${w}“`).join(" und ");
      const anteilText = format(anteil, 1);
      saetze.push(
        `Nicht im Wörterbuch steht ${liste}; daraus werden ${stuecke} Stücke: ${stueckListe} - also ${anteilText} Prozent aller Tokens.`,
      );
      saetze.push(
        "Unbekannte Wörter kosten mehr Tokens: jedes Stück zählt als eigenes Token, bekannte Wörter nur eines.",
      );
    } else {
      saetze.push(
        "Jedes Wort steht im Wörterbuch, deshalb liefert jedes Wort genau ein Token und nur das Satzzeichen kommt dazu.",
      );
      saetze.push(
        `Die ${tokens.length} Tokens bestehen aus ${woerter} Wörtern und ${tokens.length - woerter} Satzzeichen.`,
      );
    }

    return {
      values: [
        { label: "Anzahl Tokens", value: tokens.length, digits: 0 },
        { label: "Anzahl Wörter", value: woerter, digits: 0 },
        { label: "Tokens je Wort", value: woerter > 0 ? tokens.length / woerter : 0, digits: 2 },
        { label: "Anteil aus Stücken", value: anteil, unit: "%", digits: 1 },
      ],
      drawing,
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = anteilStuecke(wahl(before, "satz", "s1"));
    const nachher = anteilStuecke(wahl(after, "satz", "s1"));
    const richtung = compareValues(vorher, nachher, 0.5);
    if (richtung === "up") {
      return [{ name: "textNeedsMoreTokens", severity: "info", value: nachher }];
    }
    if (richtung === "down") {
      return [{ name: "textNeedsFewerTokens", severity: "info", value: nachher }];
    }
    return [];
  },
};
