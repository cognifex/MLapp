/**
 * LEK-21 Latent Space: zwischen zwei gelernten Darstellungen interpolieren.
 *
 * Rechenkern: die beiden Darstellungen A und B stehen als feste Vektoren im Code (hier zwei
 * Dimensionen, damit das Bild die Rechnung zeigt). Der interpolierte Punkt ist
 * z(t) = (1 - t) * A + t * B - dieselbe Rechnung läuft in einem echten latenten Raum je
 * Dimension einzeln. Abstände und Verbindungslinie entstehen aus denselben Koordinaten.
 */
import type { Calculated, Curve, Mark, Vector } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState, Point } from "./contract.js";

/** Die beiden gelernten Darstellungen; fest im Code, nicht bedienbar. */
export const DARSTELLUNG_A: Point = { x: -1.8, y: -0.6 };
export const DARSTELLUNG_B: Point = { x: 2, y: 1.4 };

const X_RANGE: [number, number] = [-2.6, 2.6];
const Y_RANGE: [number, number] = [-2.2, 2.2];

/** Zwischenstellen, deren Abstand zu A linear mit t wächst. */
const ZWISCHENSTELLEN: number[] = [0.25, 0.5, 0.75];

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function format(n: number, digits = 3): string {
  return Number.isFinite(n) ? n.toFixed(digits).replace(".", ",") : "nicht definiert";
}

/** Lineare Interpolation zwischen den beiden Darstellungen. */
export function interpoliere(t: number): Point {
  return {
    x: DARSTELLUNG_A.x + t * (DARSTELLUNG_B.x - DARSTELLUNG_A.x),
    y: DARSTELLUNG_A.y + t * (DARSTELLUNG_B.y - DARSTELLUNG_A.y),
  };
}

function abstand(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

registerRules([
  {
    name: "amEndpunktA",
    explain: () =>
      "Der Regler steht am Anfang: die Zwischendarstellung ist genau die gelernte Darstellung A.",
  },
  {
    name: "amEndpunktB",
    explain: () =>
      "Der Regler steht am Ende: die Zwischendarstellung ist genau die gelernte Darstellung B.",
  },
  {
    name: "halbwegs",
    explain: () =>
      "Der Punkt liegt in der Mitte: der Abstand zu A und zu B ist gleich groß - die Zwischendarstellung ist von beiden gleich weit entfernt.",
  },
]);

export const latentSpace: Experiment = {
  id: "exp-latent-space",
  title: "Zwischen zwei Darstellungen interpolieren",
  learningGoal: "Verstehen, wie ein Regler zwischen zwei gelernten Repräsentationen wandert",
  instructions:
    "Ziehe den Regler t von null bis eins. Beobachte, wie der Punkt auf der Verbindungslinie wandert und wie sich die Abstände zu A und B ändern.",
  spokenDescription:
    "Eine Zeichenebene mit zwei festen Punkten A und B und einer gestrichelten Verbindungslinie. " +
    "Der Regler t bewegt einen dritten Punkt von A nach B. Neben dem Bild stehen t, die Koordinaten " +
    "des Punktes und seine Abstände zu A und zu B.",
  controls: [
    {
      kind: "slider",
      id: "t",
      label: "t: Zwischenstellung",
      min: 0,
      max: 1,
      step: 0.01,
      initial: 0.5,
    },
    {
      kind: "toggle",
      id: "zwischenstellen",
      label: "Zwischenstellen zeigen",
      initial: true,
    },
  ],
  initialState: { t: 0.5, zwischenstellen: true },
  update(state, action) {
    if (action.type === "reset") return { t: 0.5, zwischenstellen: true };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const t = Math.min(1, Math.max(0, zahl(state, "t", 0.5)));
    const zeigen = state["zwischenstellen"] === true;
    const punkt = interpoliere(t);
    const zuA = abstand(punkt, DARSTELLUNG_A);
    const zuB = abstand(punkt, DARSTELLUNG_B);
    const gesamt = abstand(DARSTELLUNG_A, DARSTELLUNG_B);

    const punktA: [number, number] = [DARSTELLUNG_A.x, DARSTELLUNG_A.y];
    const punktB: [number, number] = [DARSTELLUNG_B.x, DARSTELLUNG_B.y];
    const linie: Curve = {
      label: "Verbindungslinie",
      dashed: true,
      color: "#5f6368",
      points: [punktA, punktB],
    };

    const points: Mark[] = [
      { label: "A", x: DARSTELLUNG_A.x, y: DARSTELLUNG_A.y, color: "#188038" },
      { label: "B", x: DARSTELLUNG_B.x, y: DARSTELLUNG_B.y, color: "#188038" },
    ];
    if (zeigen) {
      for (const stelle of ZWISCHENSTELLEN) {
        if (Math.abs(stelle - t) <= 0.01) continue;
        const zwischen = interpoliere(stelle);
        points.push({
          label: `t = ${format(stelle, 2)}`,
          x: zwischen.x,
          y: zwischen.y,
          color: "#8a8f98",
        });
      }
    }
    points.push({ label: `t = ${format(t, 2)}`, x: punkt.x, y: punkt.y, color: "#d93025" });

    const vectors: Vector[] = [
      { label: "", from: [0, 0], to: [punkt.x, punkt.y], color: "#d93025" },
      {
        label: "",
        from: [punkt.x, punkt.y],
        to: [DARSTELLUNG_A.x, DARSTELLUNG_A.y],
        color: "#8a8f98",
      },
      {
        label: "",
        from: [punkt.x, punkt.y],
        to: [DARSTELLUNG_B.x, DARSTELLUNG_B.y],
        color: "#8a8f98",
      },
    ];

    return {
      values: [
        { label: "t", value: t, digits: 2 },
        { label: "x", value: punkt.x, digits: 3 },
        { label: "y", value: punkt.y, digits: 3 },
        { label: "Abstand zu A", value: zuA, digits: 3 },
        { label: "Abstand zu B", value: zuB, digits: 3 },
        { label: "Summe der Abstände", value: zuA + zuB, digits: 3 },
      ],
      drawing: {
        kind: "plane",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        vectors,
        points,
        curves: [linie],
      },
      sentences: [
        `Bei t = ${format(t, 2)} liegt der interpolierte Punkt bei (${format(punkt.x)}|${format(punkt.y)}).`,
        `Er ist ${format(zuA)} von A und ${format(zuB)} von B entfernt; A und B selbst liegen ${format(gesamt)} auseinander.`,
        `Der Abstand zu A wächst mit t, der zu B nimmt ab - die Summe bleibt ${format(zuA + zuB)} und damit so groß wie die Verbindungslinie.`,
        t <= 0.05 || t >= 0.95
          ? "Der Regler steht an einem Ende: hier ist die Zwischendarstellung genau eine der beiden gelernten Darstellungen."
          : "Der Punkt liegt zwischen den beiden gelernten Darstellungen - ein Wert, den das Modell so nie als Beispiel gesehen hat.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const t0 = zahl(before, "t", 0.5);
    const t1 = zahl(after, "t", 0.5);
    if (t1 <= 0.05 && t0 > 0.05) events.push({ name: "amEndpunktA", severity: "info" });
    if (t1 >= 0.95 && t0 < 0.95) events.push({ name: "amEndpunktB", severity: "info" });
    if (Math.abs(t1 - 0.5) <= 0.01 && Math.abs(t0 - 0.5) > 0.01) {
      events.push({ name: "halbwegs", severity: "notable" });
    }
    return events;
  },
};
