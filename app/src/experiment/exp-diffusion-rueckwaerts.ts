/**
 * LEK-35 Diffusion: Rückwärtsprozess.
 *
 * Rechenkern: Vom voll verrauschten Bild (zehn Vorwärtsschritte, siehe exp-diffusion-vorwaerts)
 * geht es Schritt für Schritt zurück. In jedem Schritt schätzt das Modell das unverrauschte Bild;
 * diese Schätzung trägt einen Restfehler, den der Regler steuert. Der Denoising-Schritt mischt den
 * aktuellen Stand mit dieser Schätzung:
 *
 *   x_(t-1) = (1 - beta_t) * x_t + beta_t * s_t
 *
 * Die Mischgewichte nehmen dabei von Schritt zu Schritt ab (0,5 am stärksten verrauschten Ende,
 * 0,05 am Ende) - genau wie bei einem echten Denoising-Zeitplan. Alles ist reine Rechnung aus dem
 * Zustand, kein Math.random.
 */
import type { Calculated, GridCell } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";
import {
  ORIGINAL,
  PIXEL,
  SCHRITTE_MAX,
  SEITE,
  abweichung,
  betaVon,
  rauschwert,
  vorwaerts,
} from "./exp-diffusion-vorwaerts.js";

/** Anfangswert des Reglers für den Restfehler der Modellschätzung. */
export const FEHLER_INITIAL = 0.2;

/** Höchster einstellbarer Restfehler. */
export const FEHLER_MAX = 0.4;

/** Auf 0 bis 1 begrenzen - die Zeichnung ist ein Graustufenbild. */
export function begrenze(wert: number): number {
  return Math.min(1, Math.max(0, wert));
}

/** Bilder des festen Rauschfeldes für die Schätzung: zweiter, unabhängiger Abschnitt. */
export function schaetzfehler(k: number, i: number): number {
  return 2 * rauschwert(3000 + (k - 1) * PIXEL + i) - 1;
}

/** Schätzung des unverrauschten Bildes in Stufe k, behaftet mit dem Restfehler. */
export function modellschaetzung(k: number, fehler: number, ziel: number[] = ORIGINAL): number[] {
  return ziel.map((wert, i) => begrenze(wert + fehler * schaetzfehler(k, i)));
}

export type DenoisingErgebnis = { bild: number[]; fehlerJeSchritt: number[] };

/** Rückwärtsprozess: Denoising mit der angegebenen Zahl von Schritten. */
export function rueckwaerts(
  schritte: number,
  fehler: number,
  ziel: number[] = ORIGINAL,
): DenoisingErgebnis {
  const stufen = Math.max(1, Math.min(SCHRITTE_MAX, Math.round(schritte)));
  let bild = vorwaerts(SCHRITTE_MAX, ziel);
  const fehlerJeSchritt: number[] = [];
  for (let j = 1; j <= stufen; j += 1) {
    const k = SCHRITTE_MAX - j + 1;
    const beta = betaVon(k);
    const schaetzung = modellschaetzung(k, fehler, ziel);
    bild = bild.map((wert, i) => begrenze((1 - beta) * wert + beta * (schaetzung[i] ?? 0)));
    fehlerJeSchritt.push(abweichung(bild, ziel));
  }
  return { bild, fehlerJeSchritt };
}

/** Das verrauschte Startbild (zehn Vorwärtsschritte) - für Zahlen und Erklärung. */
export function rauschbild(): number[] {
  return vorwaerts(SCHRITTE_MAX);
}

function zellen(bild: number[]): GridCell[] {
  const out: GridCell[] = [];
  for (let row = 0; row < SEITE; row += 1) {
    for (let col = 0; col < SEITE; col += 1) {
      out.push({ row, col, value: bild[row * SEITE + col] ?? 0 });
    }
  }
  return out;
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" ? wert : fallback;
}

registerRules([
  {
    name: "fehlerSinkt",
    explain: (e) =>
      `Der Abstand zum Zielbild sinkt auf ${formatValue(e.value ?? 0, 3)}: dieser Denoising-Schritt war nützlich.`,
  },
  {
    name: "restfehlerBleibt",
    explain: (e) =>
      `Es bleibt ein Rest von ${formatValue(e.value ?? 0, 3)}. Der Schritt war klein, die Schätzung ist nicht genau genug.`,
  },
  {
    name: "bildWiederhergestellt",
    explain: () =>
      "Das Bild stimmt fast wieder mit dem Zielbild überein: der Rückwärtsprozess ist am Ziel.",
  },
]);

export const diffusionRueckwaerts: Experiment = {
  id: "exp-diffusion-rueckwaerts",
  title: "Denoising Schritt für Schritt",
  learningGoal: "Den Rückwärtsprozess als Folge von Denoising-Schritten mit Restfehler verstehen",
  instructions:
    "Stelle ein, wie viele Denoising-Schritte gerechnet werden und wie stark die Schätzung des Modells daneben liegt. Beobachte, wie der Fehler je Schritt kleiner wird und wo er stehen bleibt.",
  spokenDescription:
    "Dasselbe Bild wie im Vorwärtsprozess, jetzt aber voll verrauscht. Mit zwei Reglern stellst du " +
    "die Zahl der Denoising-Schritte und den Restfehler der Modellschätzung ein. Jeder Schritt " +
    "mischt den aktuellen Stand mit der Schätzung des unverrauschten Bildes, und die Zahlen " +
    "nennen den Fehler nach jedem Schritt.",
  controls: [
    {
      kind: "slider",
      id: "schritte",
      label: "Denoising-Schritte",
      min: 1,
      max: SCHRITTE_MAX,
      step: 1,
      initial: 5,
    },
    {
      kind: "slider",
      id: "fehler",
      label: "Restfehler der Schätzung",
      min: 0,
      max: FEHLER_MAX,
      step: 0.05,
      initial: FEHLER_INITIAL,
    },
  ],
  initialState: { schritte: 5, fehler: FEHLER_INITIAL },
  update(state, action) {
    if (action.type === "reset") return { schritte: 5, fehler: FEHLER_INITIAL };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const schritte = Math.max(1, Math.min(SCHRITTE_MAX, Math.round(zahl(state, "schritte", 5))));
    const fehler = begrenze(zahl(state, "fehler", FEHLER_INITIAL));
    const startfehler = abweichung(rauschbild(), ORIGINAL);
    const { bild, fehlerJeSchritt } = rueckwaerts(schritte, fehler);
    const ende = fehlerJeSchritt[fehlerJeSchritt.length - 1] ?? startfehler;

    const werte = [
      { label: "Denoising-Schritte", value: schritte, digits: 0 },
      { label: "Restfehler der Schätzung", value: fehler, digits: 2 },
      { label: "Fehler vor dem ersten Schritt", value: startfehler, digits: 4 },
      ...fehlerJeSchritt.map((wert, i) => ({
        label: `Fehler nach Schritt ${i + 1}`,
        value: wert,
        digits: 4,
      })),
      { label: "Fehler am Ende", value: ende, digits: 4 },
    ];

    const verlauf = fehlerJeSchritt
      .map((wert, i) => `${i + 1}: ${formatValue(wert, 3)}`)
      .join(", ");
    const saetze: string[] = [
      `Das voll verrauschte Startbild weicht im Mittel ${formatValue(startfehler, 4)} vom Zielbild ab.`,
      `Nach ${schritte} Denoising-Schritten beträgt der Fehler ${formatValue(ende, 4)}.`,
      `Der Fehler je Schritt: ${verlauf}.`,
    ];
    if (fehler === 0) {
      saetze.push(
        "Die Schätzung ist fehlerfrei: mit allen zehn Schritten verschwindet der Fehler fast vollständig.",
      );
    } else {
      saetze.push(
        `Mit einem Restfehler der Schätzung von ${formatValue(fehler, 2)} bleibt ein Boden von rund ${formatValue(ende, 3)} stehen - mehr Schritte holen ihn nicht heraus.`,
      );
    }

    return {
      values: werte,
      drawing: {
        kind: "grid",
        cols: SEITE,
        rows: SEITE,
        cells: zellen(bild),
        xRange: [0, SEITE],
        yRange: [0, SEITE],
        style: "grau",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const fb = begrenze(zahl(before, "fehler", FEHLER_INITIAL));
    const fa = begrenze(zahl(after, "fehler", FEHLER_INITIAL));
    const sb = Math.round(zahl(before, "schritte", 5));
    const sa = Math.round(zahl(after, "schritte", 5));
    if (fb === fa && sb === sa) return [];

    const startfehler = abweichung(rauschbild(), ORIGINAL);
    const vorher = rueckwaerts(sb, fb);
    const nachher = rueckwaerts(sa, fa);
    const alt = vorher.fehlerJeSchritt[vorher.fehlerJeSchritt.length - 1] ?? startfehler;
    const neu = nachher.fehlerJeSchritt[nachher.fehlerJeSchritt.length - 1] ?? startfehler;
    const ereignisse: SemanticEvent[] = [];
    if (neu < alt - 1e-9) {
      ereignisse.push({ name: "fehlerSinkt", severity: "info", value: neu });
    }
    if (neu > alt + 1e-9) {
      ereignisse.push({ name: "restfehlerBleibt", severity: "notable", value: neu });
    }
    if (neu < 0.05) {
      ereignisse.push({ name: "bildWiederhergestellt", severity: "notable", value: neu });
    }
    return ereignisse;
  },
};
