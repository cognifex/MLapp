/**
 * LEK-14 Regularisierung: Stärke der L2-Strafe einstellen und die Wirkung auf Gewichte und Verlust
 * sehen.
 *
 * Rechenkern: Ridge-Regression in geschlossener Form. Verlust
 *
 *     L = (1/n)·Σ (y − ŷ)²  +  λ·(w₁² + w₂²)
 *
 * Der Datenanteil ist ein Mittel, die Strafe zählt die Gewichtsquadrate. Abgeleitet und null
 * gesetzt ergibt das die Normalengleichungen (XᵀX + n·λ·P) w = Xᵀy, die hier mit Gauß-Elimination
 * gelöst werden – keine Iteration, kein Zufall. P bestraft die beiden Gewichte; der Bias wird nur
 * bestraft, wenn der Schalter das verlangt.
 *
 * Die sechs Datenpunkte sind so gewählt, dass beide Eingaben den Mittelwert null haben: dann
 * bleibt der Bias von der Strafe unberührt und die Gewichte sinken sichtbar mit wachsendem λ.
 */
import type { Bar, Calculated } from "../model/types.js";
import { compareValues, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Datenpunkte als [x₁, x₂, y]. Beide Eingaben haben den Mittelwert null. */
export const DATEN: [number, number, number][] = [
  [-2.0, 0.0, -2.3],
  [-1.0, 1.0, 1.6],
  [0.0, -1.0, 0.2],
  [1.0, 2.0, 7.2],
  [2.0, 0.0, 5.7],
  [0.0, -2.0, -0.9],
];

export type Lösung = {
  /** Bias. */
  b: number;
  /** Gewicht der ersten Eingabe. */
  w1: number;
  /** Gewicht der zweiten Eingabe. */
  w2: number;
  /** Mittlerer quadratischer Fehler auf den Daten. */
  mse: number;
  /** Strafwert λ · Summe der Gewichtsquadrate. */
  strafe: number;
  /** Strafwert plus Datenfehler. */
  gesamt: number;
  /** Anteil der Strafe am Gesamtverlust, in Prozent. */
  anteil: number;
};

/** Löst ein 3×3-System mit Gauß-Elimination und Spaltenpivot. */
export function loeseDreiGleichungen(A: number[][], rhs: number[]): [number, number, number] {
  const m: number[][] = [
    [A[0]![0]!, A[0]![1]!, A[0]![2]!, rhs[0]!],
    [A[1]![0]!, A[1]![1]!, A[1]![2]!, rhs[1]!],
    [A[2]![0]!, A[2]![1]!, A[2]![2]!, rhs[2]!],
  ];
  for (let c = 0; c < 3; c += 1) {
    let p = c;
    for (let r = c + 1; r < 3; r += 1) {
      if (Math.abs(m[r]![c]!) > Math.abs(m[p]![c]!)) p = r;
    }
    const tausch = m[c]!;
    m[c] = m[p]!;
    m[p] = tausch;
    for (let r = 0; r < 3; r += 1) {
      if (r === c) continue;
      const f = m[r]![c]! / m[c]![c]!;
      for (let k = c; k < 4; k += 1) {
        m[r]![k] = m[r]![k]! - f * m[c]![k]!;
      }
    }
  }
  return [m[0]![3]! / m[0]![0]!, m[1]![3]! / m[1]![1]!, m[2]![3]! / m[2]![2]!];
}

/**
 * Ridge-Lösung für ein gegebenes λ. Mit `biasStrafe` wird auch der Bias gegen null gezogen,
 * sonst wirkt die Strafe nur auf die beiden Gewichte.
 */
export function ridge(lam: number, biasStrafe: boolean): Lösung {
  const A: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const rhs = [0, 0, 0];
  for (const [x1, x2, y] of DATEN) {
    const merkmale = [1, x1, x2];
    for (let a = 0; a < 3; a += 1) {
      for (let b = 0; b < 3; b += 1) {
        A[a]![b] = A[a]![b]! + merkmale[a]! * merkmale[b]!;
      }
      rhs[a] = rhs[a]! + merkmale[a]! * y;
    }
  }
  const skal = lam * DATEN.length;
  A[0]![0] = A[0]![0]! + (biasStrafe ? skal : 0);
  A[1]![1] = A[1]![1]! + skal;
  A[2]![2] = A[2]![2]! + skal;

  const [b, w1, w2] = loeseDreiGleichungen(A, rhs);
  let quadrate = 0;
  for (const [x1, x2, y] of DATEN) {
    const abweichung = y - (b + w1 * x1 + w2 * x2);
    quadrate += abweichung * abweichung;
  }
  const mse = quadrate / DATEN.length;
  const strafe = lam * (w1 * w1 + w2 * w2 + (biasStrafe ? b * b : 0));
  const gesamt = mse + strafe;
  return {
    b,
    w1,
    w2,
    mse,
    strafe,
    gesamt,
    anteil: gesamt > 0 ? (100 * strafe) / gesamt : 0,
  };
}

function value(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function biasStrafeOf(state: ExperimentState): boolean {
  const v = state["biasStrafe"];
  return typeof v === "boolean" ? v : false;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

registerRules([
  {
    name: "weightsShrunk",
    explain: () =>
      "Stärkere Strafe zieht die Gewichte Richtung null: das Modell wird einfacher und passt sich den Daten weniger stark an.",
  },
  {
    name: "weightsGrown",
    explain: () =>
      "Schwächere Strafe lässt die Gewichte wieder wachsen: das Modell darf sich den Daten stärker anpassen.",
  },
]);

export const regularisierung: Experiment = {
  id: "exp-regularisierung",
  title: "Regularisierung: Strafe gegen zu große Gewichte",
  learningGoal:
    "Die Wirkung der L2-Strafe auf Gewichte, Bias und Verlust verstehen und die Stärke einstellen",
  instructions:
    "Ziehe den Regler λ: die Strafe wächst und die Gewichte werden kleiner. Der Umriss jeder Säule zeigt die Gewichte ohne Strafe.",
  spokenDescription:
    "Ein Säulendiagramm mit den beiden Gewichten und dem Bias eines linearen Modells. " +
    "Der Regler lambda stellt die Stärke der L2-Strafe ein. Mit wachsendem lambda werden die Säulen der Gewichte kleiner, " +
    "der Umriss zeigt weiter den Wert ohne Strafe. Daneben stehen Fehler auf den Daten, Strafe und Gesamtverlust.",
  controls: [
    {
      kind: "slider",
      id: "lambda",
      label: "λ: Stärke der Strafe",
      min: 0,
      max: 10,
      step: 0.25,
      initial: 0,
    },
    {
      kind: "toggle",
      id: "biasStrafe",
      label: "Auch den Bias bestrafen",
      initial: false,
    },
  ],
  initialState: { lambda: 0, biasStrafe: false },
  update(state, action) {
    if (action.type === "reset") return { lambda: 0, biasStrafe: false };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const lam = value(state, "lambda", 0);
    const biasStrafe = biasStrafeOf(state);
    const jetzt = ridge(lam, biasStrafe);
    const ohneStrafe = ridge(0, false);

    const items: Bar[] = [
      { label: "w₁", value: jetzt.w1, ghost: ohneStrafe.w1, color: "#1a73e8" },
      { label: "w₂", value: jetzt.w2, ghost: ohneStrafe.w2, color: "#1a73e8" },
      { label: "Bias", value: jetzt.b, ghost: ohneStrafe.b, color: "#5f6368" },
    ];

    const saetze = [
      `Bei λ gleich ${format(lam, 2)} liegen die Gewichte bei w₁ gleich ${format(
        jetzt.w1,
        4,
      )} und w₂ gleich ${format(jetzt.w2, 4)}, der Bias bei ${format(jetzt.b, 4)}.`,
      `Der Fehler auf den Daten ist ${format(jetzt.mse, 4)}, die Strafe ${format(
        jetzt.strafe,
        4,
      )}; der Gesamtverlust beträgt ${format(jetzt.gesamt, 4)}.`,
    ];

    if (lam === 0) {
      saetze.push(
        "Ohne Strafe sucht das Verfahren nur den kleinsten Fehler auf den Daten: die Gewichte sind so groß wie nötig für diese Anpassung.",
      );
    } else {
      saetze.push(
        `Ohne Strafe wären die Gewichte ${format(ohneStrafe.w1, 4)} und ${format(
          ohneStrafe.w2,
          4,
        )}; die Strafe hat sie auf ${format(jetzt.w1, 4)} und ${format(
          jetzt.w2,
          4,
        )} verkleinert. Die Strafe macht ${format(jetzt.anteil, 2)} Prozent des Gesamtverlusts aus.`,
      );
    }

    if (biasStrafe) {
      saetze.push(
        `Der Bias wird mitbestraft: er sinkt von ${format(ohneStrafe.b, 4)} auf ${format(
          jetzt.b,
          4,
        )}.`,
      );
    } else {
      saetze.push(
        "Der Bias bleibt unberührt: beide Eingaben haben den Mittelwert null, deshalb greift die Strafe nur bei den beiden Gewichten.",
      );
    }

    return {
      values: [
        { label: "Fehler auf den Daten (MSE)", value: jetzt.mse, digits: 4 },
        { label: "Strafe", value: jetzt.strafe, digits: 4 },
        { label: "Gesamtverlust", value: jetzt.gesamt, digits: 4 },
        { label: "Anteil der Strafe", value: jetzt.anteil, unit: "%", digits: 2 },
        { label: "w₁", value: jetzt.w1, digits: 4 },
        { label: "w₂", value: jetzt.w2, digits: 4 },
        { label: "b", value: jetzt.b, digits: 4 },
      ],
      drawing: { kind: "bars", items },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const events: SemanticEvent[] = [];
    const alt = ridge(value(before, "lambda", 0), biasStrafeOf(before));
    const neu = ridge(value(after, "lambda", 0), biasStrafeOf(after));
    const laengeAlt = Math.hypot(alt.w1, alt.w2);
    const laengeNeu = Math.hypot(neu.w1, neu.w2);
    const richtung = compareValues(laengeAlt, laengeNeu, 1e-6);

    if (richtung === "down") {
      events.push({ name: "weightsShrunk", severity: "notable", value: laengeNeu });
    }
    if (richtung === "up") {
      events.push({ name: "weightsGrown", severity: "info", value: laengeNeu });
    }
    return events;
  },
};
