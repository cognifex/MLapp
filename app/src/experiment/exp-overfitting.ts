/**
 * LEK-13 Overfitting: Polynomgrad einstellen und Trainings- mit Testfehler vergleichen.
 *
 * Rechenkern: zu elf festen Trainingspunkten wird ein Polynom des eingestellten Grades nach der
 * Methode der kleinsten Quadrate angepasst. Aufgestellt und gelöst werden die Normalengleichungen
 * (XᵀX + λI)·a = Xᵀy mit dem Gauss-Jordan-Verfahren und Spaltenpivot; λ = 10⁻⁹ stabilisiert nur
 * die Rechnung und ändert die Anpassung praktisch nicht. x wird auf den Bereich [-1, 1] skaliert
 * (t = x / 2,5), damit die Potenzen gutmütig bleiben.
 *
 * Die Störung der Trainingspunkte ist ein festes Zahlenmuster statt echtem Zufall, damit die
 * Anzeige reproduzierbar bleibt; der Testbereich ist die reine Sinusfunktion ohne Störung.
 */
import type { Calculated, Curve, Mark } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export const X_RANGE: [number, number] = [-2.5, 2.5];
export const Y_RANGE: [number, number] = [-2.5, 2.5];
/** Skalierung der x-Werte vor dem Aufstellen der Potenzen. */
export const X_MAX = 2.5;
/** Kleine Regularisierung, damit die Normalengleichungen auch bei hohem Grad lösbar bleiben. */
export const LAMBDA = 1e-9;
/** Festes Störungsmuster der Trainingspunkte (Ersatz für Zufall). */
export const RAUSCHMUSTER = [0.55, 0.2, -0.6, 0.45, 0.1, -0.5, 0.6, -0.15, 0.35, -0.55, 0.4];
/** Höchster einstellbarer Polynomgrad. */
export const MAX_GRAD = 9;

/** x-Stellen der elf Trainingspunkte. */
export const TRAIN_X = Array.from({ length: 11 }, (_, i) => -2.5 + 0.5 * i);
/** x-Stellen der einundzwanzig Testpunkte: dieselbe Funktion, ohne Störung. */
export const TEST_X = Array.from({ length: 21 }, (_, i) => -2.5 + 0.25 * i);
/** Die Funktion, aus der beide Datensätze stammen. */
export function wahreFunktion(x: number): number {
  return Math.sin(x);
}

/** Trainingswerte: Sinuswerte plus das eingestellte Vielfache des festen Störungsmusters. */
export function trainingswerte(rauschen: number): number[] {
  return TRAIN_X.map((x, i) => wahreFunktion(x) + rauschen * RAUSCHMUSTER[i]!);
}

/** Testwerte: die reine Funktion, ohne Störung. */
export function testwerte(): number[] {
  return TEST_X.map((x) => wahreFunktion(x));
}

/** Gauss-Jordan mit Spaltenpivot; loest ein quadratisches System rein und deterministisch. */
function loese(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m: number[][] = a.map((zeile, i) => [...zeile, b[i]!]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    }
    const zwischen = m[col]!;
    m[col] = m[pivot]!;
    m[pivot] = zwischen;
    const d = m[col]![col]!;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const faktor = m[r]![col]! / d;
      for (let c = col; c <= n; c += 1) m[r]![c] = m[r]![c]! - faktor * m[col]![c]!;
    }
  }
  return m.map((zeile, i) => zeile[n]! / zeile[i]!);
}

/** Koeffizienten des Polynoms zum eingestellten Grad (in der skalierten Variablen t). */
export function koeffizienten(grad: number, rauschen: number): number[] {
  const ys = trainingswerte(rauschen);
  const breite = grad + 1;
  const matrix: number[][] = Array.from({ length: breite }, () =>
    new Array<number>(breite).fill(0),
  );
  const rechteSeite: number[] = new Array<number>(breite).fill(0);
  for (let i = 0; i < TRAIN_X.length; i += 1) {
    const t = TRAIN_X[i]! / X_MAX;
    const merkmale: number[] = [1];
    for (let k = 1; k < breite; k += 1) merkmale.push(merkmale[k - 1]! * t);
    for (let r = 0; r < breite; r += 1) {
      rechteSeite[r] = rechteSeite[r]! + merkmale[r]! * ys[i]!;
      for (let c = 0; c < breite; c += 1) {
        matrix[r]![c] = matrix[r]![c]! + merkmale[r]! * merkmale[c]!;
      }
    }
  }
  for (let k = 0; k < breite; k += 1) matrix[k]![k] = matrix[k]![k]! + LAMBDA;
  return loese(matrix, rechteSeite);
}

/** Wert des Polynoms an der Stelle x; ausgewertet in der Hornerform. */
export function modellwert(koeff: number[], x: number): number {
  const t = x / X_MAX;
  let summe = 0;
  for (let k = koeff.length - 1; k >= 0; k -= 1) summe = summe * t + koeff[k]!;
  return summe;
}

/** Mittlerer quadratischer Fehler eines Modells auf einem Datensatz. */
export function mittlererFehler(koeff: number[], xs: number[], ys: number[]): number {
  let summe = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const d = modellwert(koeff, xs[i]!) - ys[i]!;
    summe += d * d;
  }
  return summe / xs.length;
}

export type Gradvergleich = { grad: number; fehler: number };

/** Der Grad mit dem geringsten Testfehler in der ganzen Reihe von 1 bis 9. */
export function besterGrad(rauschen: number): Gradvergleich {
  const ys = testwerte();
  let beste: Gradvergleich | undefined;
  for (let grad = 1; grad <= MAX_GRAD; grad += 1) {
    const fehler = mittlererFehler(koeffizienten(grad, rauschen), TEST_X, ys);
    if (!beste || fehler < beste.fehler) beste = { grad, fehler };
  }
  return beste!;
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function formatiere(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "overfittingBegan",
    explain: () =>
      "Der Trainingsfehler sinkt, der Testfehler steigt: das Modell lernt die Störung der " +
      "Trainingspunkte mit, statt die Funktion dahinter. Genau das heißt Overfitting.",
  },
  {
    name: "testErrorFell",
    explain: (e) =>
      `Der Testfehler sinkt auf ${formatValue(e.value ?? 0, 4)}: ` +
      "die Anpassung trägt jetzt besser auf Punkte, die das Modell nicht kennt.",
  },
]);

export const overfitting: Experiment = {
  id: "exp-overfitting",
  title: "Trainings- und Testfehler über der Modellkomplexität",
  learningGoal:
    "Sehen, dass ein zu komplexes Modell den Trainingsfehler senkt und den Testfehler hebt",
  instructions:
    "Stelle den Polynomgrad ein und beobachte beide Fehler. Der Regler rauschen bestimmt, wie stark die Trainingspunkte vom Sinus abweichen.",
  spokenDescription:
    "Ein Koordinatensystem mit roten Trainingspunkten und grauen Testpunkten entlang einer Sinuskurve. " +
    "Die durchgezogene Kurve ist das angepasste Polynom, die gestrichelte die wahre Funktion dahinter. " +
    "Der Regler Polynomgrad verändert die Biegsamkeit der Kurve, der Regler rauschen die Streuung der Trainingspunkte.",
  controls: [
    {
      kind: "slider",
      id: "grad",
      label: "Polynomgrad",
      min: 1,
      max: MAX_GRAD,
      step: 1,
      initial: 3,
    },
    {
      kind: "slider",
      id: "rauschen",
      label: "Streuung der Trainingspunkte",
      min: 0,
      max: 0.8,
      step: 0.05,
      initial: 0.6,
    },
  ],
  initialState: { grad: 3, rauschen: 0.6 },
  update(state, action) {
    if (action.type === "reset") return { grad: 3, rauschen: 0.6 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const grad = Math.round(zahl(state, "grad", 3));
    const rauschen = zahl(state, "rauschen", 0.6);
    const ysTrain = trainingswerte(rauschen);
    const ysTest = testwerte();
    const koeff = koeffizienten(grad, rauschen);
    const trainFehler = mittlererFehler(koeff, TRAIN_X, ysTrain);
    const testFehler = mittlererFehler(koeff, TEST_X, ysTest);
    const beste = besterGrad(rauschen);

    const modellkurve: Curve = {
      label: `Polynom vom Grad ${grad}`,
      points: Array.from({ length: 201 }, (_, i) => {
        const px = X_RANGE[0] + ((X_RANGE[1] - X_RANGE[0]) * i) / 200;
        return [px, modellwert(koeff, px)] as [number, number];
      }),
      color: "#1a73e8",
    };
    const wahrerkurve: Curve = {
      label: "y = sin(x)",
      dashed: true,
      points: Array.from({ length: 201 }, (_, i) => {
        const px = X_RANGE[0] + ((X_RANGE[1] - X_RANGE[0]) * i) / 200;
        return [px, wahreFunktion(px)] as [number, number];
      }),
      color: "#5f6368",
    };
    const marks: Mark[] = [
      ...TRAIN_X.map((x, i) => ({
        label: i === 5 ? "Trainingspunkte" : "",
        x,
        y: ysTrain[i]!,
        color: "#d93025",
      })),
      ...TEST_X.map((x, i) => ({
        label: i === 19 ? "Testpunkte" : "",
        x,
        y: ysTest[i]!,
        color: "#188038",
      })),
    ];

    const verhaeltnis = formatiere(testFehler / beste.fehler, 1);
    const diagnose =
      testFehler <= beste.fehler * 1.5
        ? "Der Testfehler liegt dicht am geringsten Wert der Reihe: die Anpassung trägt auch für neue Punkte."
        : grad < beste.grad
          ? "Das Modell ist zu einfach: mit mehr Komplexität würde der Testfehler weiter sinken."
          : `Überanpassung: der Testfehler ist ${verhaeltnis}-mal so groß ` +
            "wie der geringste Wert der Reihe.";

    return {
      values: [
        { label: "Polynomgrad", value: grad, digits: 0 },
        { label: "Trainingsfehler (MSE)", value: trainFehler, digits: 6 },
        { label: "Testfehler (MSE)", value: testFehler, digits: 6 },
        { label: "Geringster Testfehler", value: beste.fehler, digits: 6 },
        { label: "Grad mit dem geringsten Testfehler", value: beste.grad, digits: 0 },
      ],
      drawing: {
        kind: "function-plot",
        xRange: X_RANGE,
        yRange: Y_RANGE,
        curves: [modellkurve, wahrerkurve],
        marks,
      },
      sentences: [
        `Mit Polynomgrad ${grad} beträgt der Trainingsfehler ${formatiere(trainFehler, 4)} ` +
          `und der Testfehler ${formatiere(testFehler, 4)}.`,
        `Der geringste Testfehler der Reihe ist ${formatiere(beste.fehler, 4)} ` +
          `(bei Grad ${beste.grad}).`,
        diagnose,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const rauschenVor = zahl(before, "rauschen", 0.6);
    const rauschenNach = zahl(after, "rauschen", 0.6);
    const gradVor = Math.round(zahl(before, "grad", 3));
    const gradNach = Math.round(zahl(after, "grad", 3));
    const ysTest = testwerte();
    const vor = {
      train: mittlererFehler(
        koeffizienten(gradVor, rauschenVor),
        TRAIN_X,
        trainingswerte(rauschenVor),
      ),
      test: mittlererFehler(koeffizienten(gradVor, rauschenVor), TEST_X, ysTest),
    };
    const nach = {
      train: mittlererFehler(
        koeffizienten(gradNach, rauschenNach),
        TRAIN_X,
        trainingswerte(rauschenNach),
      ),
      test: mittlererFehler(koeffizienten(gradNach, rauschenNach), TEST_X, ysTest),
    };
    const events: SemanticEvent[] = [];
    if (nach.test > vor.test * 1.2 && nach.train < vor.train) {
      events.push({ name: "overfittingBegan", severity: "warning", value: nach.test });
    }
    if (nach.test < vor.test * 0.8) {
      events.push({ name: "testErrorFell", severity: "info", value: nach.test });
    }
    return events;
  },
};
