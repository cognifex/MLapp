/**
 * LEK-09 Loss: Residuen und mittleren quadratischen Fehler zeigen.
 *
 * Rechenkern: feste Messpunkte, eine Gerade y = w x + b aus zwei Reglern, daraus die Residuen
 * (Messwert minus Vorhersage), die Summe der Quadrate und der mittlere quadratische Fehler (MSE).
 * Die senkrechten gestrichelten Linien der Zeichnung sind dieselben Residuen, die als Zahlen
 * erscheinen - die Zeichnung ist keine Illustration, sondern die Auswertung.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState, Point } from "./contract.js";

export const X_RANGE: [number, number] = [-0.5, 4.5];
export const Y_RANGE: [number, number] = [-0.5, 4.5];

/** Feste Messpunkte: fünf Werte, x von 0 bis 4. */
export const DATEN: Point[] = [
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 1.5 },
  { x: 3, y: 3.5 },
  { x: 4, y: 4 },
];

const START: ExperimentState = { w: 1, b: 0 };

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" && Number.isFinite(wert) ? wert : fallback;
}

export function formatiere(wert: number, stellen = 3): string {
  return wert.toFixed(stellen).replace(".", ",");
}

export type Verlust = {
  w: number;
  b: number;
  residuen: number[];
  summeQuadrate: number;
  mse: number;
  mittlererFehler: number;
  groesstes: number;
};

/** Residuum je Punkt ist der Messwert minus der Vorhersage auf der Geraden. */
export function verlust(w: number, b: number): Verlust {
  const residuen: number[] = [];
  let summeQuadrate = 0;
  let summe = 0;
  for (const punkt of DATEN) {
    const r = punkt.y - (w * punkt.x + b);
    residuen.push(r);
    summeQuadrate += r * r;
    summe += r;
  }
  let groesstes = 0;
  for (const r of residuen) {
    if (Math.abs(r) > groesstes) groesstes = Math.abs(r);
  }
  const anzahl = DATEN.length;
  return {
    w,
    b,
    residuen,
    summeQuadrate,
    mse: summeQuadrate / anzahl,
    mittlererFehler: summe / anzahl,
    groesstes,
  };
}

/**
 * Günstigste Gerade für die festen Punkte: w = Summe der gemischten Abweichungen durch Summe der
 * quadrierten x-Abweichungen, b = Mittelwert y minus w mal Mittelwert x.
 */
export function besteGerade(): { w: number; b: number; mse: number } {
  const anzahl = DATEN.length;
  let summeX = 0;
  let summeY = 0;
  for (const punkt of DATEN) {
    summeX += punkt.x;
    summeY += punkt.y;
  }
  const mittelX = summeX / anzahl;
  const mittelY = summeY / anzahl;
  let zaehler = 0;
  let nenner = 0;
  for (const punkt of DATEN) {
    zaehler += (punkt.x - mittelX) * (punkt.y - mittelY);
    nenner += (punkt.x - mittelX) * (punkt.x - mittelX);
  }
  const w = zaehler / nenner;
  const b = mittelY - w * mittelX;
  return { w, b, mse: verlust(w, b).mse };
}

registerRules([
  {
    name: "lossMinimal",
    explain: (e) =>
      `Der mittlere quadratische Fehler ist mit ${formatiere(e.value ?? 0)} am kleinsten Wert angekommen: keine andere Gerade liegt besser in der Punktwolke.`,
  },
]);

export const loss: Experiment = {
  id: "exp-loss",
  title: "Residuen und mittlerer quadratischer Fehler",
  learningGoal: "Ein Verlustmaß aus den Residuen aufbauen und seinen kleinsten Wert deuten",
  instructions:
    "Stelle mit w und b die Gerade ein und beobachte die senkrechten gestrichelten Linien: das sind die Residuen. Der mittlere quadratische Fehler wird kleiner, je besser die Gerade liegt.",
  spokenDescription:
    "Fünf feste Messpunkte und eine Gerade. Die Regler w und b neigen und heben die Gerade. Von jedem Punkt " +
    "geht eine senkrechte gestrichelte Linie zur Geraden - die Länge ist das Residuum des Punktes. Daneben steht " +
    "der mittlere quadratische Fehler; er wird kleiner, wenn die Gerade besser durch die Punkte läuft, und ist am " +
    "kleinsten, wenn sie die günstigste Lage erreicht.",
  controls: [
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
    if (action.type === "reset") return { ...START };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const w = zahl(state, "w", 1);
    const b = zahl(state, "b", 0);
    const k = verlust(w, b);
    const best = besteGerade();

    const marks: Mark[] = DATEN.map((punkt, i) => ({
      label: `P${i + 1}`,
      x: punkt.x,
      y: punkt.y,
      color: "#1f2328",
    }));

    const gerade: Curve = {
      label: "Gerade y = w·x + b",
      points: [
        [X_RANGE[0], w * X_RANGE[0] + b],
        [X_RANGE[1], w * X_RANGE[1] + b],
      ],
    };
    const residuen: Curve[] = DATEN.map((punkt, i) => ({
      label: `Residuum ${i + 1}`,
      dashed: true,
      color: "#b3261e",
      points: [
        [punkt.x, punkt.y],
        [punkt.x, w * punkt.x + b],
      ],
    }));

    const lage =
      Math.abs(k.mittlererFehler) < 1e-9
        ? "Im Mittel liegt die Gerade genau in der Mitte der Punkte."
        : k.mittlererFehler > 0
          ? "Der mittlere Fehler ist positiv: die Gerade liegt im Mittel unter den Punkten."
          : "Der mittlere Fehler ist negativ: die Gerade liegt im Mittel über den Punkten.";

    return {
      values: [
        { label: "MSE", value: k.mse, digits: 3 },
        { label: "Mittlerer Fehler", value: k.mittlererFehler, digits: 3 },
        { label: "Summe der Quadrate", value: k.summeQuadrate, digits: 3 },
        { label: "Größtes Residuum", value: k.groesstes, digits: 3 },
        { label: "Bestes w", value: best.w, digits: 2 },
        { label: "Bestes b", value: best.b, digits: 2 },
        { label: "Kleinster erreichbarer MSE", value: best.mse, digits: 3 },
      ],
      drawing: {
        kind: "scatter",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        points: marks,
        lines: [gerade, ...residuen],
      },
      sentences: [
        `Der mittlere quadratische Fehler ist ${formatiere(k.mse)}; er entsteht aus der Summe der Quadrate ${formatiere(k.summeQuadrate)} geteilt durch ${DATEN.length} Punkte.`,
        `Der mittlere Fehler ist ${formatiere(k.mittlererFehler)}, das größte Residuum ${formatiere(k.groesstes)}. ${lage}`,
        `Die günstigste Gerade für diese Punkte wäre w gleich ${formatiere(best.w, 2)} und b gleich ${formatiere(best.b, 2)}; dort ist der mittlere quadratische Fehler ${formatiere(best.mse)}.`,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = verlust(zahl(before, "w", 1), zahl(before, "b", 0));
    const nachher = verlust(zahl(after, "w", 1), zahl(after, "b", 0));
    const best = besteGerade();
    const events: SemanticEvent[] = [];
    if (nachher.mse < vorher.mse - 1e-9) {
      events.push({ name: "lossDecreased", severity: "info", value: nachher.mse });
    } else if (nachher.mse > vorher.mse + 1e-9) {
      events.push({ name: "lossIncreased", severity: "info", value: nachher.mse });
    }
    if (Math.abs(nachher.mse - best.mse) < 1e-9) {
      events.push({ name: "lossMinimal", severity: "notable", value: nachher.mse });
    }
    return events;
  },
};
