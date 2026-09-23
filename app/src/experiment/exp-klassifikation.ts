/**
 * LEK-11 Klassifikation: die Entscheidungsgrenze zwischen zwei Punktgruppen verschieben.
 *
 * Rechenkern: eine Gerade y = w·x + b trennt zwei Klassen. Ob ein Punkt richtig liegt, folgt
 * direkt aus dem Vorzeichen des Abstands zur Geraden. Die Punktwolke ist fest verdrahtet und
 * besteht aus einem festen Muster statt aus Zufallszahlen - so bleibt die Anzeige reproduzierbar.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export const X_RANGE: [number, number] = [-3, 3];
export const Y_RANGE: [number, number] = [-3, 3];
/** Steigung der Trennlinie, die beide Gruppen sauber trennt. */
export const WAHRE_STEIGUNG = 0.8;

export type Klasse = "A" | "B";
export type Datenpunkt = { klasse: Klasse; nummer: number; x: number; y: number };

/** x-Stellen beider Gruppen, gleichmässig über den Zeichenbereich verteilt. */
const XS = Array.from({ length: 9 }, (_, i) => -2.4 + 0.6 * i);
/** Festes Muster der Streuung oberhalb der Trennlinie (Klasse A). */
const MUSTER_A = [0.3, -0.18, 0.24, -0.3, 0.12, 0.34, -0.22, 0.28, -0.14];
/** Festes Muster der Streuung unterhalb der Trennlinie (Klasse B). */
const MUSTER_B = [-0.28, 0.16, -0.34, 0.22, -0.12, -0.3, 0.18, -0.24, 0.1];

/** Die feste Punktwolke: je x-Stelle ein Punkt der Klasse A und einer der Klasse B. */
export const PUNKTE: Datenpunkt[] = XS.flatMap((x, i) => [
  { klasse: "A" as Klasse, nummer: i + 1, x, y: WAHRE_STEIGUNG * x + 0.55 + MUSTER_A[i]! },
  { klasse: "B" as Klasse, nummer: i + 1, x, y: WAHRE_STEIGUNG * x - 0.55 + MUSTER_B[i]! },
]);

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

export type Auswertung = { richtig: number; genauigkeit: number; kleinster: number };

/** Anteil richtiger Punkte und kleinster Abstand eines Punktes zur Geraden. */
export function auswertung(steigung: number, achsenabschnitt: number): Auswertung {
  let richtig = 0;
  let kleinster = Number.POSITIVE_INFINITY;
  for (const punkt of PUNKTE) {
    const grenzwert = steigung * punkt.x + achsenabschnitt;
    // Rechtwinkliger Abstand des Punktes von der Geraden.
    const abstand = Math.abs(punkt.y - grenzwert) / Math.sqrt(1 + steigung * steigung);
    if (abstand < kleinster) kleinster = abstand;
    const oberhalb = punkt.y > grenzwert;
    if ((punkt.klasse === "A") === oberhalb) richtig += 1;
  }
  return { richtig, genauigkeit: richtig / PUNKTE.length, kleinster };
}

function formatiere(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "accuracyPerfect",
    explain: () =>
      "Die Gerade trennt jetzt alle Punkte richtig. Der Abstand zur Grenze sagt, wie sicher " +
      "diese Trennung ist: kleine Abstände bedeuten, dass eine kleine Verschiebung schon kippt.",
  },
  {
    name: "accuracyDropped",
    explain: (e) =>
      `Die Genauigkeit ist auf ${formatValue(e.value ?? 0, 3)} gesunken: die Verschiebung hat ` +
      "mindestens einen Punkt auf die falsche Seite gebracht.",
  },
  {
    name: "grenzeStreiftPunkt",
    explain: (e) =>
      `Die Grenze läuft nur ${formatValue(e.value ?? 0, 3)} an einem Punkt vorbei. Dort ist die ` +
      "Vorhersage kaum vom Zufall der Messung zu unterscheiden.",
  },
]);

export const klassifikation: Experiment = {
  id: "exp-klassifikation",
  title: "Entscheidungsgrenze verschieben",
  learningGoal: "Eine Gerade als Entscheidungsgrenze deuten und ihre Lage an Daten anpassen",
  instructions:
    "Verschiebe Steigung und Achsenabschnitt der Geraden so, dass möglichst alle Punkte der Klasse A oberhalb und alle Punkte der Klasse B unterhalb liegen.",
  spokenDescription:
    "Eine Punktwolke aus zwei Gruppen: die obere Gruppe ist rot und heißt Klasse A, die untere ist " +
    "blau und heißt Klasse B. Eine grüne Gerade lässt sich mit zwei Reglern verschieben und kippen. " +
    "Die Anzeige nennt die Zahl der richtig getrennten Punkte und den kleinsten Abstand der Punkte zur Geraden.",
  controls: [
    {
      kind: "slider",
      id: "steigung",
      label: "Steigung w",
      min: -3,
      max: 3,
      step: 0.1,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "achsenabschnitt",
      label: "Achsenabschnitt b",
      min: -3,
      max: 3,
      step: 0.1,
      initial: 0,
    },
  ],
  initialState: { steigung: 0.5, achsenabschnitt: 0 },
  update(state, action) {
    if (action.type === "reset") return { steigung: 0.5, achsenabschnitt: 0 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const steigung = zahl(state, "steigung", 0.5);
    const achsenabschnitt = zahl(state, "achsenabschnitt", 0);
    const erg = auswertung(steigung, achsenabschnitt);
    const falsch = PUNKTE.length - erg.richtig;

    const grenze: Curve = {
      label: "Entscheidungsgrenze",
      points: [
        [X_RANGE[0], steigung * X_RANGE[0] + achsenabschnitt],
        [X_RANGE[1], steigung * X_RANGE[1] + achsenabschnitt],
      ],
      color: "#188038",
    };
    const points: Mark[] = PUNKTE.map((punkt) => ({
      label: `${punkt.klasse}${punkt.nummer}`,
      x: punkt.x,
      y: punkt.y,
      color: punkt.klasse === "A" ? "#d93025" : "#1a73e8",
    }));

    return {
      values: [
        { label: "Steigung der Grenze", value: steigung, digits: 2 },
        { label: "Achsenabschnitt der Grenze", value: achsenabschnitt, digits: 2 },
        { label: "Richtig klassifiziert", value: erg.richtig, digits: 0 },
        { label: "Falsch klassifiziert", value: falsch, digits: 0 },
        { label: "Genauigkeit", value: erg.genauigkeit, digits: 3 },
        { label: "Kleinster Abstand zur Grenze", value: erg.kleinster, digits: 3 },
      ],
      drawing: {
        kind: "scatter",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        points,
        lines: [grenze],
      },
      sentences: [
        `Die Grenze hat die Steigung ${formatiere(steigung)}; ` +
          `ihr Achsenabschnitt ist ${formatiere(achsenabschnitt)}.`,
        `${erg.richtig} von ${PUNKTE.length} Punkten liegen auf der richtigen Seite, ` +
          `${falsch} auf der falschen.`,
        falsch === 0
          ? `Alle Punkte sind getrennt; der kleinste Abstand ist ${formatiere(erg.kleinster, 3)}.`
          : `Der kleinste Abstand ist ${formatiere(erg.kleinster, 3)}: dort kippt die Trennung.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = auswertung(zahl(before, "steigung", 0.5), zahl(before, "achsenabschnitt", 0));
    const nachher = auswertung(zahl(after, "steigung", 0.5), zahl(after, "achsenabschnitt", 0));
    const events: SemanticEvent[] = [];
    if (nachher.richtig === PUNKTE.length && vorher.richtig < PUNKTE.length) {
      events.push({ name: "accuracyPerfect", severity: "notable", value: nachher.genauigkeit });
    }
    if (nachher.richtig < vorher.richtig) {
      events.push({ name: "accuracyDropped", severity: "info", value: nachher.genauigkeit });
    }
    if (nachher.kleinster < 0.05 && vorher.kleinster >= 0.05) {
      events.push({ name: "grenzeStreiftPunkt", severity: "warning", value: nachher.kleinster });
    }
    return events;
  },
};
