/**
 * LEK-08 Lineare Regression: Datenpunkte bewegen und die Gerade y = w x + b einstellen.
 *
 * Rechenkern: die Gerade wird aus den Reglern w und b ausgewertet, jeder Punkt wird mit derselben
 * Geraden verglichen. Alles, was angezeigt wird, entsteht aus dieser einen Rechnung.
 *
 * Hinweis zur Bedienung: Die Oberfläche verbindet genau einen Punktregler mit der Zeichenfläche.
 * Deshalb wird der Punkt über die Auswahl gewählt und dann mit dem Punktregler verschoben; die
 * übrigen vier Punkte bleiben an ihrer Ausgangslage.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type ExperimentState, type Point } from "./contract.js";

export const X_RANGE: [number, number] = [-3, 3];
export const Y_RANGE: [number, number] = [-3, 3];

/** Auswahlwerte des Reglers "punkt". */
export const AUSWAHL_VALUES = ["p1", "p2", "p3", "p4", "p5"];
/** Ausgangslage der fünf Punkte: sie liegen auf der Geraden y = x. */
export const AUSGANGSLAGE: Point[] = [
  { x: -2, y: -2 },
  { x: -1, y: -1 },
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 2 },
];

const START: ExperimentState = { punkt: "p3", position: { x: 0, y: 0 }, w: 1, b: 0 };

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" && Number.isFinite(wert) ? wert : fallback;
}

export function formatiere(wert: number, stellen = 3): string {
  return wert.toFixed(stellen).replace(".", ",");
}

/** Index des gewählten Punktes (0 bis 4). */
export function auswahl(state: ExperimentState): number {
  const wert = state["punkt"];
  const i = typeof wert === "string" ? AUSWAHL_VALUES.indexOf(wert) : -1;
  return i >= 0 ? i : 2;
}

/** Die fünf Datenpunkte; der gewählte steht dort, wo der Punktregler ihn hinträgt. */
export function punkte(state: ExperimentState): Point[] {
  const gewaehlt = auswahl(state);
  const v = state["position"];
  const lage: Point = isPoint(v) ? v : { x: 0, y: 0 };
  return AUSGANGSLAGE.map((p, i) => {
    if (i === gewaehlt) return { x: lage.x, y: lage.y };
    return { x: p.x, y: p.y };
  });
}

/** Abstand jedes Punktes zur Geraden: Messwert minus Vorhersage. */
export function abstaende(state: ExperimentState): number[] {
  const w = zahl(state, "w", 1);
  const b = zahl(state, "b", 0);
  return punkte(state).map((p) => p.y - (w * p.x + b));
}

/** Mittlerer Betrag der Abstände - ein Maß dafür, wie gut die Gerade passt. */
export function mittlererAbstand(state: ExperimentState): number {
  const werte = abstaende(state);
  let summe = 0;
  for (const wert of werte) summe += Math.abs(wert);
  return summe / werte.length;
}

/** Sichtbarer Teil der Geraden: bis zu den Rändern der Zeichnung. */
export function geradenStrecke(w: number, b: number): [number, number][] {
  let xa = X_RANGE[0];
  let xb = X_RANGE[1];
  if (Math.abs(w) > 1e-9) {
    const links = (Y_RANGE[0] - b) / w;
    const rechts = (Y_RANGE[1] - b) / w;
    xa = Math.max(X_RANGE[0], Math.min(links, rechts));
    xb = Math.min(X_RANGE[1], Math.max(links, rechts));
  }
  return [
    [xa, w * xa + b],
    [xb, w * xb + b],
  ];
}

registerRules([
  {
    name: "fitBetter",
    explain: (e) =>
      `Die Gerade passt besser: der mittlere Abstand der Punkte beträgt jetzt ${formatiere(e.value ?? 0)}.`,
  },
  {
    name: "fitWorse",
    explain: (e) =>
      `Die Gerade passt schlechter: der mittlere Abstand der Punkte beträgt jetzt ${formatiere(e.value ?? 0)}.`,
  },
]);

export const lineareRegression: Experiment = {
  id: "exp-lineare-regression",
  title: "Gerade durch eine Punktwolke",
  learningGoal: "Steigung und Achsenabschnitt einer Geraden mit den Datenpunkten vergleichen",
  instructions:
    "Wähle einen Punkt aus, ziehe ihn an die gewünschte Stelle und stelle dann mit den Reglern w und b die Gerade ein. Der mittlere Abstand zeigt, wie gut die Gerade liegt.",
  spokenDescription:
    "Eine Punktwolke aus fünf Punkten und eine Gerade. Der gewählte Punkt lässt sich mit dem Finger verschieben, " +
    "die Auswahl bestimmt, welcher Punkt das ist. Die Regler w und b neigen und heben die Gerade. Der mittlere " +
    "Abstand der Punkte zur Geraden steht als Zahl daneben und wird kleiner, wenn die Gerade besser liegt.",
  controls: [
    {
      kind: "select",
      id: "punkt",
      label: "Gewählter Punkt",
      options: [
        { value: "p1", label: "Punkt 1 bei x = -2" },
        { value: "p2", label: "Punkt 2 bei x = -1" },
        { value: "p3", label: "Punkt 3 bei x = 0" },
        { value: "p4", label: "Punkt 4 bei x = 1" },
        { value: "p5", label: "Punkt 5 bei x = 2" },
      ],
      initial: "p3",
    },
    {
      kind: "point",
      id: "position",
      label: "Lage des gewählten Punktes",
      bounds: { minX: X_RANGE[0], maxX: X_RANGE[1], minY: Y_RANGE[0], maxY: Y_RANGE[1] },
      initial: { x: 0, y: 0 },
    },
    { kind: "slider", id: "w", label: "w: Steigung", min: -2, max: 2, step: 0.05, initial: 1 },
    {
      kind: "slider",
      id: "b",
      label: "b: Achsenabschnitt",
      min: -3,
      max: 3,
      step: 0.05,
      initial: 0,
    },
  ],
  initialState: { ...START },
  update(state, action) {
    if (action.type === "reset") return { ...START, position: { x: 0, y: 0 } };
    if (
      action.type === "set-value" &&
      action.controlId === "punkt" &&
      typeof action.value === "string"
    ) {
      const i = AUSWAHL_VALUES.indexOf(action.value);
      const lage = AUSGANGSLAGE[i];
      return {
        ...state,
        punkt: action.value,
        position: lage ? { ...lage } : { x: 0, y: 0 },
      };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const w = zahl(state, "w", 1);
    const b = zahl(state, "b", 0);
    const daten = punkte(state);
    const gewaehlt = auswahl(state);
    const abstand = abstaende(state);
    const mittel = mittlererAbstand(state);
    const gewaehlterAbstand = abstand[gewaehlt] ?? 0;

    const marks: Mark[] = daten.map((p, i) => ({
      label: `P${i + 1}`,
      x: p.x,
      y: p.y,
      color: i === gewaehlt ? "#d93025" : "#1f2328",
    }));

    const gerade: Curve = {
      label: "Gerade y = w·x + b",
      points: geradenStrecke(w, b),
    };

    const richtung =
      mittel < 1e-12
        ? "Alle Punkte liegen genau auf der Geraden."
        : "Je kleiner der mittlere Abstand, desto besser liegt die Gerade in der Punktwolke.";

    return {
      values: [
        { label: "Steigung w", value: w, digits: 2 },
        { label: "Achsenabschnitt b", value: b, digits: 2 },
        { label: "y bei x = 0", value: b, digits: 2 },
        { label: "y bei x = 1", value: w + b, digits: 2 },
        { label: "Mittlerer Abstand", value: mittel, digits: 3 },
        { label: "Anzahl Punkte", value: daten.length, digits: 0 },
      ],
      drawing: {
        kind: "scatter",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        points: marks,
        lines: [gerade],
      },
      sentences: [
        `Die Gerade steigt um ${formatiere(w, 2)} je Schritt in x-Richtung und schneidet die y-Achse bei ${formatiere(b, 2)}.`,
        `Der gewählte Punkt P${gewaehlt + 1} liegt bei x gleich ${formatiere(daten[gewaehlt]?.x ?? 0, 2)} und y gleich ${formatiere(daten[gewaehlt]?.y ?? 0, 2)}; sein Abstand zur Geraden ist ${formatiere(gewaehlterAbstand)}.`,
        `Über alle fünf Punkte beträgt der mittlere Abstand ${formatiere(mittel)}. ${richtung}`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = mittlererAbstand(before);
    const nachher = mittlererAbstand(after);
    if (nachher < vorher - 1e-9) {
      return [{ name: "fitBetter", severity: "info", value: nachher }];
    }
    if (nachher > vorher + 1e-9) {
      return [{ name: "fitWorse", severity: "notable", value: nachher }];
    }
    return [];
  },
};
