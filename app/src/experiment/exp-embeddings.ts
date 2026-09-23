/**
 * LEK-20 Embeddings: Wortvektoren als Richtungen im Raum.
 *
 * Rechenkern: aus den Koordinaten entstehen Längen, Skalarprodukt und Kosinus. Die festen
 * Wortvektoren stehen im Code (kleiner Wortschatz in zwei Dimensionen), die beiden Pfeile a und b
 * lassen sich ziehen - die Ähnlichkeit ist der Kosinus zwischen ihnen, nicht ein getippter Wert.
 */
import type { Calculated, Mark, Vector } from "../model/types.js";
import type { SemanticEvent } from "../semantic/events.js";
import { isPoint, type Experiment, type Point } from "./contract.js";

const BOUNDS = { minX: -2.4, maxX: 2.4, minY: -2.4, maxY: 2.4 };

export type Wortvektor = { wort: string; vektor: Point };

/** Fester kleiner Wortschatz; die Vektoren sind feste Größen des Beispiels. */
export const WORTVEKTOREN: Wortvektor[] = [
  { wort: "Hund", vektor: { x: 2, y: 1.1 } },
  { wort: "Wolf", vektor: { x: 2.3, y: 1.5 } },
  { wort: "Auto", vektor: { x: -1.8, y: 1.9 } },
  { wort: "Bahn", vektor: { x: -2.1, y: 1.2 } },
];

const START_A: Point = { x: 2, y: 1.1 };
const START_B: Point = { x: 1.6, y: 2 };

function wurzel(a: Point): number {
  return Math.hypot(a.x, a.y);
}

/** Kosinus zwischen zwei Vektoren: 1 = gleiche Richtung, 0 = rechter Winkel, -1 = Gegenrichtung. */
export function kosinus(a: Point, b: Point): number {
  const la = wurzel(a);
  const lb = wurzel(b);
  if (la < 1e-9 || lb < 1e-9) return Number.NaN;
  return (a.x * b.x + a.y * b.y) / (la * lb);
}

/** Pfeil vom Ursprung zur Spitze - die übliche Darstellung eines Vektors. */
function pfeil(label: string, spitze: Point, color: string): Vector {
  return { label, from: [0, 0], to: [spitze.x, spitze.y], color };
}

/** Winkel in Grad; bei einem Nullvektor gibt es keinen Winkel. */
export function winkelGrad(a: Point, b: Point): number {
  const c = kosinus(a, b);
  if (!Number.isFinite(c)) return Number.NaN;
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

export const embeddings: Experiment = {
  id: "exp-embeddings",
  title: "Wortvektoren und ihre Ähnlichkeit",
  learningGoal: "Ähnlichkeit als Kosinus zweier Vektoren lesen",
  instructions:
    "Ziehe die beiden Pfeile a und b. Der Kosinus zeigt, wie gleichgerichtet sie sind. Die vier weiteren Pfeile sind ein fester kleiner Wortschatz.",
  spokenDescription:
    "Eine Zeichenebene mit vier festen Wortvektoren: Hund, Wolf, Auto und Bahn. Zwei weitere Pfeile, " +
    "a und b, lassen sich ziehen. Der Kosinus zwischen a und b steht als Zahl daneben, ebenso der " +
    "Winkel in Grad und der Abstand der beiden Spitzen.",
  controls: [
    {
      kind: "point",
      id: "a",
      label: "Vektor a",
      bounds: BOUNDS,
      initial: START_A,
    },
    {
      kind: "point",
      id: "b",
      label: "Vektor b",
      bounds: BOUNDS,
      initial: START_B,
    },
  ],
  initialState: { a: START_A, b: START_B },
  update(state, action) {
    if (action.type === "reset") return { a: START_A, b: START_B };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const punktA = state["a"];
    const punktB = state["b"];
    const a: Point = isPoint(punktA) ? punktA : START_A;
    const b: Point = isPoint(punktB) ? punktB : START_B;
    const c = kosinus(a, b);
    const winkel = winkelGrad(a, b);
    const skalar = a.x * b.x + a.y * b.y;
    const la = wurzel(a);
    const lb = wurzel(b);
    const abstand = Math.hypot(a.x - b.x, a.y - b.y);

    // Nächstes Wort aus dem festen Wortschatz: größter Kosinus entscheidet.
    function naechstesWort(p: Point): Wortvektor {
      let bestes = WORTVEKTOREN[0] ?? { wort: "Hund", vektor: { x: 0, y: 0 } };
      let bester = Number.NEGATIVE_INFINITY;
      for (const eintrag of WORTVEKTOREN) {
        const wert = kosinus(p, eintrag.vektor);
        if (Number.isFinite(wert) && wert > bester) {
          bester = wert;
          bestes = eintrag;
        }
      }
      return bestes;
    }

    const naheA = naechstesWort(a);
    const naheB = naechstesWort(b);

    const vectors: Vector[] = [
      pfeil("a", a, "#1a73e8"),
      pfeil("b", b, "#188038"),
      ...WORTVEKTOREN.map((eintrag) => pfeil(eintrag.wort, eintrag.vektor, "#8a8f98")),
    ];

    const points: Mark[] = [
      { label: "a", x: a.x, y: a.y, color: "#1a73e8" },
      { label: "b", x: b.x, y: b.y, color: "#188038" },
    ];

    return {
      values: [
        { label: "Kosinus", value: c, digits: 3 },
        { label: "Winkel", value: winkel, unit: "°", digits: 1 },
        { label: "Skalarprodukt", value: skalar, digits: 3 },
        { label: "Länge von a", value: la, digits: 3 },
        { label: "Länge von b", value: lb, digits: 3 },
        { label: "Abstand der Spitzen", value: abstand, digits: 3 },
      ],
      drawing: {
        kind: "plane",
        xRange: [BOUNDS.minX, BOUNDS.maxX],
        yRange: [BOUNDS.minY, BOUNDS.maxY],
        vectors,
        points,
      },
      sentences: [
        `Der Kosinus zwischen a und b ist ${zahlText(c)}; der Winkel beträgt ${zahlText(winkel, 1)} Grad.`,
        `Das Skalarprodukt ist ${zahlText(skalar)}, die Längen sind ${zahlText(la)} und ${zahlText(lb)}, der Abstand der Spitzen ${zahlText(abstand)}.`,
        deuten(c),
        `Am nächsten liegt bei a der Wortvektor ${naheA.wort} (Kosinus ${zahlText(kosinus(a, naheA.vektor))}), bei b der Wortvektor ${naheB.wort} (Kosinus ${zahlText(kosinus(b, naheB.vektor))}).`,
      ],
    };
  },
  semanticEvents(_before, after): SemanticEvent[] {
    const punktA = after["a"];
    const punktB = after["b"];
    const a: Point = isPoint(punktA) ? punktA : START_A;
    const b: Point = isPoint(punktB) ? punktB : START_B;
    const c = kosinus(a, b);
    if (!Number.isFinite(c)) return [{ name: "similarityLow", severity: "info", value: 0 }];
    if (Math.abs(c) < 0.06) return [{ name: "orthogonal", severity: "notable", value: 0 }];
    if (c > 0.85) return [{ name: "similarityHigh", severity: "info", value: c }];
    if (c < 0.25) return [{ name: "similarityLow", severity: "info", value: c }];
    return [];
  },
};

function zahlText(n: number, digits = 3): string {
  return Number.isFinite(n) ? n.toFixed(digits).replace(".", ",") : "nicht definiert";
}

/** Ein Satz zur Bedeutung des Kosinus - die Grenzen sind die der Zeichenebene. */
function deuten(c: number): string {
  if (!Number.isFinite(c)) {
    return "Ein Pfeil hat die Länge null: dann gibt es keine Richtung und keinen Winkel.";
  }
  if (Math.abs(c) < 0.06) {
    return "Der Kosinus ist praktisch null: die beiden Vektoren stehen senkrecht aufeinander, die Wörter haben hier nichts gemeinsam.";
  }
  if (c > 0.85) {
    return "Der Kosinus ist groß: die Vektoren zeigen fast in dieselbe Richtung, die Wörter liegen im Raum beieinander.";
  }
  if (c < -0.85) {
    return "Der Kosinus ist fast minus eins: die Vektoren zeigen in entgegengesetzte Richtungen.";
  }
  return "Der Kosinus liegt dazwischen: die Richtungen sind verwandt, aber nicht gleich.";
}
