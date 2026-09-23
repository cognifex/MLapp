/**
 * LEK-41 Policy Gradient: das Policy-Update nach einer Episode nachvollziehen.
 *
 * Die Episode liegt fest im Code: sie beginnt auf dem Feld Zeile 2, Spalte 1 und geht in drei
 * Schritten ins Ziel (rechts, oben, oben). Belohnt wird mit dem Schrittpreis; wer das Ziel
 * erreicht, bekommt dort den festen Feldwert plus eins. Der Return eines Schrittes ist
 *
 *   G(t) = -0,04 + gamma · G(t+1)
 *
 * Die Politik hat eigene Zahlen, die Logits theta; die Wahrscheinlichkeiten entstehen mit der
 * Softmax-Funktion über theta. Nach der Episode wird jeder besuchte Zustand mit seinem Return
 * nachgezogen:
 *
 *   theta(a)  <-  theta(a) + alpha · G(t) · (1 - p(a))     für die gewählte Aktion
 *   theta(b)  <-  theta(b) - alpha · G(t) · p(b)           für alle anderen
 *
 * Alles ist reine Rechnung aus dem Zustand: gleicher Zustand, gleiche Wahrscheinlichkeiten.
 */
import type { Bar, Calculated } from "../model/types.js";
import {
  compareValues,
  formatValue,
  registerRules,
  type SemanticEvent,
} from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";
import {
  GAMMA,
  RICHTUNGEN,
  SCHRITTPREIS,
  ZIEL,
  feldName,
  feldwert,
  type Feld,
} from "./exp-value-function.js";

/** Feste Episode: drei Schritte von unten Mitte über rechts unten nach oben ins Ziel. */
export const EPISODE: { zustaende: Feld[]; aktionen: number[] } = {
  zustaende: [
    { zeile: 2, spalte: 1 },
    { zeile: 2, spalte: 2 },
    { zeile: 1, spalte: 2 },
  ],
  aktionen: [1, 0, 0],
};

/** Startwerte der Politik: dieselbe Vorliebe in jedem Zustand. */
export const LOGITS: number[] = [0.3, 0.0, -0.2, 0.1];

export function softmax(x: number[]): number[] {
  const groesster = Math.max(...x);
  const gewichte = x.map((eintrag) => Math.exp(eintrag - groesster));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  return summe > 0 ? gewichte.map((gewicht) => gewicht / summe) : [];
}

/** Returns der drei Schritte; nach dem letzten Schritt zählt der Feldwert des Ziels. */
export function returns(gamma: number): number[] {
  const anzahl = EPISODE.aktionen.length;
  const g: number[] = new Array<number>(anzahl).fill(0);
  let naechster = feldwert(ZIEL);
  for (let t = anzahl - 1; t >= 0; t -= 1) {
    const hier = SCHRITTPREIS + gamma * naechster;
    g[t] = hier;
    naechster = hier;
  }
  return g;
}

/** Wahrscheinlichkeiten vor und nach dem Update für einen Schritt der Episode. */
export function updateSchritt(
  schritt: number,
  alpha: number,
  gamma: number,
): { vorher: number[]; nachher: number[]; returnDesSchritts: number; aktion: number } {
  const t = Math.min(Math.max(0, Math.floor(schritt)), EPISODE.aktionen.length - 1);
  const aktion = EPISODE.aktionen[t] ?? 0;
  const vorher = softmax(LOGITS);
  const g = returns(gamma);
  const returnDesSchritts = g[t] ?? 0;
  const nachher = softmax(
    LOGITS.map((theta, i) => {
      const ziel = i === aktion ? 1 : 0;
      return theta + alpha * returnDesSchritts * (ziel - (vorher[i] ?? 0));
    }),
  );
  return { vorher, nachher, returnDesSchritts, aktion };
}

function lernrateVon(state: ExperimentState): number {
  const v = state["lernrate"];
  return typeof v === "number" && Number.isFinite(v) ? v : 0.5;
}

function diskontfaktorVon(state: ExperimentState): number {
  const v = state["diskontfaktor"];
  return typeof v === "number" && Number.isFinite(v) ? v : GAMMA;
}

function schrittVon(state: ExperimentState): number {
  const v = state["schritt"];
  const zahl = typeof v === "string" ? Number(v) : Number.NaN;
  return Number.isInteger(zahl) && zahl >= 1 ? zahl - 1 : 0;
}

function richtungName(richtung: number): string {
  return RICHTUNGEN[richtung]?.name ?? "unbekannt";
}

function schrittBeschriftung(index: number): string {
  const aktion = EPISODE.aktionen[index] ?? 0;
  return `${index + 1}. Schritt: ${richtungName(aktion)}`;
}

registerRules([
  {
    name: "updateStaerker",
    explain: (e) =>
      "Das Update fällt stärker aus: die Wahrscheinlichkeit der Aktion steigt jetzt um " +
      `${formatValue(e.value ?? 0, 4)}. Ein größerer Return oder eine größere Lernrate verstärkt ` +
      "das Update.",
  },
  {
    name: "updateSchwaecher",
    explain: (e) =>
      "Das Update fällt schwächer aus: die Wahrscheinlichkeit der Aktion steigt jetzt nur um " +
      `${formatValue(e.value ?? 0, 4)}. Ein kleinerer Return oder eine kleinere Lernrate dämpft ` +
      "das Update.",
  },
]);

export const policyGradient: Experiment = {
  id: "exp-policy-gradient",
  title: "Policy-Update nach einer Episode",
  learningGoal: "Das Policy-Update als Schritt in Richtung der gewählten Aktion lesen",
  instructions:
    "Stelle Lernrate und Diskontfaktor ein und wähle den Schritt der Episode. Die Säulen zeigen die Wahrscheinlichkeiten nach dem Update, der gestrichelte Umriss den Wert davor.",
  spokenDescription:
    "Vier Säulen für die vier Richtungen oben, rechts, unten und links. Die gefüllte Säule ist " +
    "die Wahrscheinlichkeit nach dem Update, der gestrichelte Umriss davor. Ein Regler stellt " +
    "die Lernrate ein, ein zweiter den Diskontfaktor, und eine Auswahl bestimmt den Schritt der " +
    "festen Episode. Die hervorgehobene Säule ist die Aktion, die in diesem Schritt gegangen " +
    "wurde. Darunter stehen der Return des Schrittes, die Wahrscheinlichkeit vorher, die " +
    "Wahrscheinlichkeit nachher und ihre Änderung.",
  controls: [
    {
      kind: "slider",
      id: "lernrate",
      label: "Lernrate alpha",
      min: 0.05,
      max: 1,
      step: 0.05,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "diskontfaktor",
      label: "Diskontfaktor gamma",
      min: 0,
      max: 0.99,
      step: 0.01,
      initial: GAMMA,
    },
    {
      kind: "select",
      id: "schritt",
      label: "Schritt der Episode",
      options: EPISODE.aktionen.map((_, index) => ({
        value: String(index + 1),
        label: schrittBeschriftung(index),
      })),
      initial: "1",
    },
  ],
  initialState: { lernrate: 0.5, diskontfaktor: GAMMA, schritt: "1" },
  update(state, action) {
    if (action.type === "reset") {
      return { lernrate: 0.5, diskontfaktor: GAMMA, schritt: "1" };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const alpha = lernrateVon(state);
    const gamma = diskontfaktorVon(state);
    const index = schrittVon(state);
    const { vorher, nachher, returnDesSchritts, aktion } = updateSchritt(index, alpha, gamma);
    const feld = EPISODE.zustaende[index] ?? EPISODE.zustaende[0];
    const vorherAktion = vorher[aktion] ?? 0;
    const nachherAktion = nachher[aktion] ?? 0;
    const aenderung = nachherAktion - vorherAktion;

    const items: Bar[] = RICHTUNGEN.map((r, i) => ({
      label: r.name,
      value: nachher[i] ?? 0,
      ghost: vorher[i] ?? 0,
      highlighted: i === aktion,
    }));

    const saetze: string[] = [];
    if (feld) {
      saetze.push(
        `Der ${index + 1}. Schritt der festen Episode geht von ${feldName(feld)} nach ` +
          `${richtungName(aktion)}; der Return dieses Schrittes ist ` +
          `${formatValue(returnDesSchritts, 3)}.`,
      );
    }
    saetze.push(
      `Die Wahrscheinlichkeit dieser Aktion war ${formatValue(vorherAktion, 4)} und ist nach dem ` +
        `Update ${formatValue(nachherAktion, 4)}; die Änderung beträgt ` +
        `${formatValue(aenderung, 4)}.`,
    );
    if (aenderung < 0) {
      saetze.push(
        "Der Return ist negativ: in dieser Episode trug der Schritt nichts ein, deshalb geht die " +
          "Wahrscheinlichkeit seiner Aktion zurück.",
      );
    } else {
      saetze.push(
        "Der Return ist positiv: die Aktion war besser als der Durchschnitt, deshalb wächst ihre " +
          "Wahrscheinlichkeit. Je größer der Return, desto größer der Schritt.",
      );
    }
    saetze.push(
      "Der gestrichelte Umriss in der Zeichnung ist der Stand vor dem Update, die gefüllte Säule " +
        "der Stand danach.",
    );

    return {
      values: [
        { label: "Return des Schritts", value: returnDesSchritts, digits: 3 },
        { label: "Wahrscheinlichkeit vorher", value: vorherAktion, digits: 4 },
        { label: "Wahrscheinlichkeit nachher", value: nachherAktion, digits: 4 },
        { label: "Änderung der Wahrscheinlichkeit", value: aenderung, digits: 4 },
      ],
      drawing: {
        kind: "bars",
        items,
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const alt = updateSchritt(schrittVon(before), lernrateVon(before), diskontfaktorVon(before));
    const neu = updateSchritt(schrittVon(after), lernrateVon(after), diskontfaktorVon(after));
    const aenderungAlt = (alt.nachher[alt.aktion] ?? 0) - (alt.vorher[alt.aktion] ?? 0);
    const aenderungNeu = (neu.nachher[neu.aktion] ?? 0) - (neu.vorher[neu.aktion] ?? 0);
    const vergleich = compareValues(aenderungAlt, aenderungNeu, 1e-9);
    if (vergleich === "up") {
      return [{ name: "updateStaerker", severity: "info", value: aenderungNeu }];
    }
    if (vergleich === "down") {
      return [{ name: "updateSchwaecher", severity: "info", value: aenderungNeu }];
    }
    return [];
  },
};
