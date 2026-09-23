/**
 * LEK-34 Diffusion: Vorwärtsprozess.
 *
 * Rechenkern: Ein festes Bild aus Nullen und Einsen (6 mal 6 Punkte) wird Schritt für Schritt
 * verändert. Die Rauschwerte stammen aus einem festen Zahlenfeld - einer linearen Kongruenzfolge,
 * die allein aus dem Index berechnet wird -, das der Regler abschneidet. Es gibt keinen Zugriff
 * auf Math.random: gleicher Zustand ergibt dieselbe Ausgabe.
 *
 *   x_t = (1 - beta_t) * x_(t-1) + beta_t * m_t
 *
 * Die Werte m_t liegen zwischen 0 und 1, deshalb bleibt das Bild im Bereich 0 bis 1 und die
 * Zeichnung ist unmittelbar ein Graustufenbild. Gegenüber der üblichen Fassung mit
 * Normalverteilung ist das eine begrenzte Vereinfachung; sie ist im Text als solche benannt.
 */
import type { Calculated, GridCell } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Kantenlänge des festen Bildes in Bildpunkten. */
export const SEITE = 6;

/** Anzahl der Bildpunkte. */
export const PIXEL = SEITE * SEITE;

/** Das feste Bild: ein symmetrisches Muster aus Nullen und Einsen (1 = hell). */
export const ORIGINAL: number[] = [
  1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0,
  0, 0, 1,
];

/** Rauschstärken der zehn Schritte: von wenig (0,05) bis viel (0,5), fest im Code. */
export const BETAS: number[] = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];

/** Höchste Rauschstufe und damit Anzahl der Schritte im Vorwärtsprozess. */
export const SCHRITTE_MAX = BETAS.length;

/** Rauschstärke des Schrittes k (1 bis SCHRITTE_MAX). */
export function betaVon(k: number): number {
  return BETAS[k - 1] ?? 0;
}

/**
 * Wert des festen Rauschfeldes an der Stelle index. Ganzzahlig gerechnet, damit er auf jeder
 * Maschine identisch herauskommt und nachrechenbar bleibt.
 */
export function rauschwert(index: number): number {
  return ((1103515245 * index + 12345) % 2147483648) / 2147483648;
}

/** Vorwärtsprozess: das Bild nach der angegebenen Zahl von Rauschschritten. */
export function vorwaerts(schritte: number, original: number[] = ORIGINAL): number[] {
  const stufen = Math.max(0, Math.min(SCHRITTE_MAX, Math.round(schritte)));
  let x = original.slice();
  for (let k = 1; k <= stufen; k += 1) {
    const beta = betaVon(k);
    x = x.map((wert, i) => (1 - beta) * wert + beta * rauschwert((k - 1) * PIXEL + i));
  }
  return x;
}

/** Anteil des Originalsignals, der nach diesen Schritten übrig bleibt (alpha quer). */
export function signalanteil(schritte: number): number {
  let anteil = 1;
  const stufen = Math.max(0, Math.min(SCHRITTE_MAX, Math.round(schritte)));
  for (let k = 1; k <= stufen; k += 1) anteil *= 1 - betaVon(k);
  return anteil;
}

/** Mittlerer Abstand zweier Bilder: Mittel aus den Beträgen der Unterschiede je Bildpunkt. */
export function abweichung(a: number[], b: number[]): number {
  if (a.length === 0) return 0;
  let summe = 0;
  for (let i = 0; i < a.length; i += 1) summe += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  return summe / a.length;
}

/** Zellenraster für die Zeichnung; die Reihenfolge ist zeilenweise (row * cols + col). */
export function bildZellen(bild: number[]): GridCell[] {
  const zellen: GridCell[] = [];
  for (let row = 0; row < SEITE; row += 1) {
    for (let col = 0; col < SEITE; col += 1) {
      zellen.push({ row, col, value: bild[row * SEITE + col] ?? 0 });
    }
  }
  return zellen;
}

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const wert = state[id];
  return typeof wert === "number" ? wert : fallback;
}

registerRules([
  {
    name: "rauschenZunahme",
    explain: (e) =>
      `Der Vorwärtsschritt hat das Bild verändert: die mittlere Abweichung liegt jetzt bei ${formatValue(e.value ?? 0, 3)}.`,
  },
  {
    name: "rauschenAbnahme",
    explain: (e) =>
      `Ein Schritt zurück: die mittlere Abweichung liegt wieder bei ${formatValue(e.value ?? 0, 3)}.`,
  },
  {
    name: "starkVerrauscht",
    explain: () =>
      "Das Bild ist fast nur noch Rauschen: das Originalsignal ist weitgehend überdeckt.",
  },
]);

export const diffusionVorwaerts: Experiment = {
  id: "exp-diffusion-vorwaerts",
  title: "Bild schrittweise verrauschen",
  learningGoal: "Den Vorwärtsprozess der Diffusion als Folge kleiner Rauschschritte lesen",
  instructions:
    "Ziehe den Regler für die Rauschschritte nach rechts und beobachte, wie das feste Bild Schritt für Schritt im Rauschen verschwindet. Die Zahlen nennen den Anteil des Originalsignals und die mittlere Abweichung.",
  spokenDescription:
    "Ein quadratisches Bild aus sechsunddreißig Bildpunkten, anfangs ein helles Muster aus Einsen " +
    "auf dunklem Grund. Mit dem Regler stellst du ein, wie viele Rauschschritte gerechnet werden. " +
    "Nach jedem Schritt werden die Bildpunkte ein Stück weiter in Richtung eines festen " +
    "Rauschfeldes gezogen. Die Zahlen darunter nennen den Anteil des Originalsignals und die " +
    "mittlere Abweichung vom Originalbild.",
  controls: [
    {
      kind: "slider",
      id: "schritte",
      label: "Rauschschritte",
      min: 0,
      max: SCHRITTE_MAX,
      step: 1,
      initial: 3,
    },
  ],
  initialState: { schritte: 3 },
  update(state, action) {
    if (action.type === "reset") return { schritte: 3 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const schritte = Math.max(0, Math.min(SCHRITTE_MAX, Math.round(zahl(state, "schritte", 3))));
    const bild = vorwaerts(schritte);
    const anteil = signalanteil(schritte);
    const mittel = abweichung(bild, ORIGINAL);

    const saetze: string[] = [
      `Nach ${schritte} Rauschschritten liegt die mittlere Abweichung vom Originalbild bei ${formatValue(mittel, 4)}.`,
      `Vom Originalsignal ist der Anteil ${formatValue(anteil, 4)} übrig geblieben.`,
    ];
    if (schritte === 0) {
      saetze.push("Der Regler steht auf null: das Bild ist unverändert.");
    } else if (anteil < 0.1) {
      saetze.push(
        "Der Anteil des Originalsignals ist unter ein Zehntel gefallen - das Bild ist fast nur noch Rauschen.",
      );
    } else {
      saetze.push(
        "Jeder weitere Schritt zieht die Bildpunkte ein Stück weiter zum festen Rauschfeld hin.",
      );
    }

    return {
      values: [
        { label: "Rauschschritte", value: schritte, digits: 0 },
        { label: "Signalanteil", value: anteil, digits: 4 },
        { label: "Mittlere Abweichung", value: mittel, digits: 4 },
      ],
      drawing: {
        kind: "grid",
        cols: SEITE,
        rows: SEITE,
        cells: bildZellen(bild),
        xRange: [0, SEITE],
        yRange: [0, SEITE],
        style: "grau",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = Math.round(zahl(before, "schritte", 3));
    const nachher = Math.round(zahl(after, "schritte", 3));
    if (vorher === nachher) return [];
    const ereignisse: SemanticEvent[] = [];
    const mittel = abweichung(vorwaerts(nachher), ORIGINAL);
    ereignisse.push({
      name: nachher > vorher ? "rauschenZunahme" : "rauschenAbnahme",
      severity: "info",
      value: mittel,
    });
    if (mittel > 0.4) {
      ereignisse.push({ name: "starkVerrauscht", severity: "notable", value: mittel });
    }
    return ereignisse;
  },
};
