/**
 * LEK-36 Conditioning: Eine Bedingung steuert das Denoising.
 *
 * Rechenkern: Zuerst läuft der Rückwärtsprozess ohne Bedingung (zehn Schritte, fester Restfehler
 * der Schätzung). Das Ergebnis ist das unbedingte Bild. Danach zieht die Bedingung dieses Bild in
 * Richtung ihres Zielbildes:
 *
 *   x = (1 - w) * x_ohne + w * x_Ziel
 *
 * w ist die Stärke der Bedingung. Die beiden Zielbilder (Kreuz und Ring) stehen fest im Code;
 * beide Abstände werden immer mitgerechnet, damit sichtbar wird, dass nur das Ziel der gewählten
 * Bedingung näher kommt. Das ist eine vereinfachte Fassung der Guidance - im Text als solche
 * benannt. Kein Math.random.
 */
import type { Calculated, GridCell } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";
import { ORIGINAL, SCHRITTE_MAX, SEITE, abweichung } from "./exp-diffusion-vorwaerts.js";
import { rueckwaerts } from "./exp-diffusion-rueckwaerts.js";

export type Bedingung = "kreuz" | "ring";

/** Zielbild der Bedingung "Kreuz": ein symmetrisches Plus. */
const KREUZ: number[] = [
  0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1,
  1, 0, 0,
];

/** Zielbild der Bedingung "Ring": ein hohles Quadrat. */
const RING: number[] = [
  1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1,
  1, 1, 1,
];

/** Restfehler der unbedingten Schätzung; fest im Code. */
export const BASIS_FEHLER = 0.1;

/** Das unbedingte Bild: Denoising ohne jede Bedingung. */
export const UNBEDINGT: number[] = rueckwaerts(SCHRITTE_MAX, BASIS_FEHLER, ORIGINAL).bild;

/** Zielbild der Bedingung. */
export function zielbild(bedingung: Bedingung): number[] {
  return bedingung === "ring" ? RING : KREUZ;
}

/** Bedingtes Bild zur Stärke w. */
export function bedingtesBild(bedingung: Bedingung, staerke: number): number[] {
  const w = Math.min(1, Math.max(0, staerke));
  const ziel = zielbild(bedingung);
  return UNBEDINGT.map((wert, i) => (1 - w) * wert + w * (ziel[i] ?? 0));
}

/** Abstand des bedingten Bildes zum Zielbild der angegebenen Bedingung. */
export function abstandZumZiel(bedingung: Bedingung, staerke: number): number {
  return abweichung(bedingtesBild(bedingung, staerke), zielbild(bedingung));
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

function bedingungVon(state: ExperimentState): Bedingung {
  return state["bedingung"] === "ring" ? "ring" : "kreuz";
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" ? wert : fallback;
}

registerRules([
  {
    name: "zielNaeher",
    explain: (e) =>
      `Die Bedingung zieht das Bild näher an ihr Ziel: der Abstand beträgt jetzt ${formatValue(e.value ?? 0, 3)}.`,
  },
  {
    name: "bedingungSchwach",
    explain: () =>
      "Die Stärke der Bedingung ist fast null: das Bild bleibt nahe beim unbedingten Ergebnis.",
  },
  {
    name: "bedingungWechsel",
    explain: () =>
      "Die Bedingung ist gewechselt. Dasselbe Rauschbild wird jetzt zu einem anderen Zielbild gezogen.",
  },
]);

export const conditioning: Experiment = {
  id: "exp-conditioning",
  title: "Bedingung steuert das Denoising",
  learningGoal: "Den Einfluss einer Bedingung auf das Denoising-Ergebnis messen",
  instructions:
    "Wähle eine Bedingung und stelle die Stärke ein. Je größer die Stärke, desto näher kommt das Bild dem Zielbild dieser Bedingung - der Abstand zum anderen Zielbild wächst dabei tendenziell.",
  spokenDescription:
    "Eine Denoising-Ausgabe als Graustufenbild. Mit der Auswahl wählst du die Bedingung: Kreuz " +
    "oder Ring. Der Regler stellt ein, wie stark diese Bedingung wirkt. Zwei Zahlen nennen den " +
    "Abstand des Bildes zum Zielbild des Kreuzes und zum Zielbild des Ringes, damit man sieht, " +
    "dass nur eine der beiden Zahlen kleiner wird.",
  controls: [
    {
      kind: "select",
      id: "bedingung",
      label: "Bedingung",
      options: [
        { value: "kreuz", label: "Bedingung Kreuz" },
        { value: "ring", label: "Bedingung Ring" },
      ],
      initial: "kreuz",
    },
    {
      kind: "slider",
      id: "staerke",
      label: "Stärke der Bedingung",
      min: 0,
      max: 1,
      step: 0.05,
      initial: 0.5,
    },
  ],
  initialState: { bedingung: "kreuz", staerke: 0.5 },
  update(state, action) {
    if (action.type === "reset") return { bedingung: "kreuz", staerke: 0.5 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const bedingung = bedingungVon(state);
    const staerke = Math.min(1, Math.max(0, zahl(state, "staerke", 0.5)));
    const bild = bedingtesBild(bedingung, staerke);
    const ziel = zielbild(bedingung);
    const abstandKreuz = abweichung(bild, KREUZ);
    const abstandRing = abweichung(bild, RING);
    const ohneBedingung = abweichung(UNBEDINGT, ziel);

    const name = bedingung === "ring" ? "Ring" : "Kreuz";
    const anderer = bedingung === "ring" ? "Kreuz" : "Ring";
    const eigener = bedingung === "ring" ? abstandRing : abstandKreuz;
    const fremder = bedingung === "ring" ? abstandKreuz : abstandRing;

    return {
      values: [
        { label: "Stärke der Bedingung", value: staerke, digits: 2 },
        { label: "Abstand zum Ziel Kreuz", value: abstandKreuz, digits: 4 },
        { label: "Abstand zum Ziel Ring", value: abstandRing, digits: 4 },
        { label: "Abstand ohne Bedingung", value: ohneBedingung, digits: 4 },
      ],
      drawing: {
        kind: "grid",
        cols: SEITE,
        rows: SEITE,
        cells: zellen(bild),
        xRange: [0, SEITE],
        yRange: [0, SEITE],
        style: "grau",
      },
      sentences: [
        `Die Bedingung ${name} wirkt mit der Stärke ${formatValue(staerke, 2)}.`,
        `Der Abstand zum Zielbild ${name} beträgt ${formatValue(eigener, 4)}, zum Zielbild ${anderer} dagegen ${formatValue(fremder, 4)}.`,
        `Ohne jede Bedingung lag der Abstand bei ${formatValue(ohneBedingung, 4)} - die Bedingung zieht das Ergebnis also zu ihrem Ziel hin.`,
        staerke > 0.95
          ? "Bei voller Stärke ist das Bild genau das Zielbild der Bedingung: der Abstand ist null."
          : "Je größer die Stärke, desto kleiner wird der Abstand zum Zielbild der gewählten Bedingung.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const bb = bedingungVon(before);
    const ba = bedingungVon(after);
    const sb = zahl(before, "staerke", 0.5);
    const sa = zahl(after, "staerke", 0.5);
    const ereignisse: SemanticEvent[] = [];
    if (bb !== ba) ereignisse.push({ name: "bedingungWechsel", severity: "info" });
    const alt = abstandZumZiel(bb, sb);
    const neu = abstandZumZiel(ba, sa);
    if (neu < alt - 1e-9) ereignisse.push({ name: "zielNaeher", severity: "info", value: neu });
    if (sa < 0.1) ereignisse.push({ name: "bedingungSchwach", severity: "notable", value: sa });
    return ereignisse;
  },
};
