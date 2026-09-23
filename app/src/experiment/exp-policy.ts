/**
 * LEK-40 Policy: aus Q-Werten werden Aktionswahrscheinlichkeiten.
 *
 * Die Q-Werte kommen aus der Wertfunktion der Lektion 38:
 *
 *   Q(s, a) = -0,04 + gamma · V(s')
 *
 * Aus ihnen wird mit der Softmax-Funktion und der Temperatur T eine Verteilung über die vier
 * Aktionen:
 *
 *   p(a) = exp(Q(s, a) / T) / Summe über a' von exp(Q(s, a') / T)
 *
 * Kleine Temperatur macht aus den Q-Werten eine scharfe Wahl, große Temperatur eine fast
 * gleichverteilte. Auf den Abschlussfeldern wird nicht gewählt: dort gibt es keine Aktionen.
 * Alles ist reine Rechnung aus dem Zustand.
 */
import type { Calculated, GridCell } from "../model/types.js";
import {
  compareValues,
  formatValue,
  registerRules,
  type SemanticEvent,
} from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";
import {
  ALLE_FELDER,
  GAMMA,
  RICHTUNGEN,
  SCHRITTPREIS,
  SPALTEN,
  ZEILEN,
  feldBeschriftung,
  feldKennung,
  feldName,
  feldVonKennung,
  feldwert,
  istAbschluss,
  wert,
  ziehe,
  type Feld,
} from "./exp-value-function.js";

/** Q-Werte der vier Aktionen eines Feldes; an Abschlussfeldern keine. */
export function qWerte(feld: Feld, gamma: number = GAMMA): number[] | null {
  if (istAbschluss(feld)) return null;
  return RICHTUNGEN.map((_, richtung) => SCHRITTPREIS + gamma * wert(ziehe(feld, richtung), gamma));
}

/** Softmax über die Q-Werte: kleinere Temperatur ergibt die schärfere Verteilung. */
export function richtungsWahrscheinlichkeiten(q: number[], temperatur: number): number[] {
  const t = temperatur > 0 ? temperatur : 0.05;
  const groesster = Math.max(...q);
  const gewichte = q.map((wertDerAktion) => Math.exp((wertDerAktion - groesster) / t));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  return summe > 0 ? gewichte.map((gewicht) => gewicht / summe) : [0.25, 0.25, 0.25, 0.25];
}

/** Entropie der Verteilung: null heißt "eine Richtung sicher", log 4 heißt "alle gleich". */
export function entropie(p: number[]): number {
  return p.reduce((summe, anteil) => (anteil > 0 ? summe - anteil * Math.log(anteil) : summe), 0);
}

function richtungName(richtung: number): string {
  return RICHTUNGEN[richtung]?.name ?? "unbekannt";
}

function temperaturVon(state: ExperimentState): number {
  const v = state["temperatur"];
  return typeof v === "number" && Number.isFinite(v) ? v : 0.25;
}

function feldVon(state: ExperimentState): Feld {
  const v = state["feld"];
  return typeof v === "string" ? feldVonKennung(v) : feldVonKennung("0-1");
}

registerRules([
  {
    name: "policyScharf",
    explain: (e) =>
      "Die Wahl ist entschiedener geworden: die beste Richtung hat jetzt die Wahrscheinlichkeit " +
      `${formatValue(e.value ?? 0, 4)}. Eine kleinere Temperatur verstärkt die Unterschiede der ` +
      "Q-Werte.",
  },
  {
    name: "policyFlach",
    explain: (e) =>
      "Die Wahl ist unentschiedener geworden: die beste Richtung hat jetzt nur die " +
      `Wahrscheinlichkeit ${formatValue(e.value ?? 0, 4)}. Eine größere Temperatur verwischt die ` +
      "Unterschiede der Q-Werte.",
  },
]);

export const policy: Experiment = {
  id: "exp-policy",
  title: "Politik aus Q-Werten",
  learningGoal: "Aktionswahrscheinlichkeiten als Softmax über die Q-Werte verstehen",
  instructions:
    "Stelle die Temperatur ein und wähle ein Feld. Das Raster zeigt je Feld die bevorzugte Richtung, die Säulen zeigen die Wahrscheinlichkeiten der vier Richtungen des gewählten Feldes.",
  spokenDescription:
    "Ein Raster aus drei mal drei Feldern. In jedem Feld steht die Richtung mit der größten " +
    "Wahrscheinlichkeit, und die Farbe zeigt, wie deutlich diese Wahl ist: satt heißt deutlich, " +
    "hell heißt unentschieden. Ein Regler stellt die Temperatur ein, eine Auswahl bestimmt das " +
    "Feld, dessen vier Wahrscheinlichkeiten als Säulen erscheinen. Die hervorgehobene Säule " +
    "gehört der bevorzugten Richtung. Darunter stehen diese Wahrscheinlichkeit, die Entropie der " +
    "Verteilung und zwei Vergleichszahlen.",
  controls: [
    {
      kind: "slider",
      id: "temperatur",
      label: "Temperatur",
      min: 0.05,
      max: 2,
      step: 0.05,
      initial: 0.25,
    },
    {
      kind: "select",
      id: "feld",
      label: "Feld",
      options: ALLE_FELDER.map((feld) => ({
        value: feldKennung(feld),
        label: feldBeschriftung(feld),
      })),
      initial: feldKennung({ zeile: 0, spalte: 1 }),
    },
  ],
  initialState: { temperatur: 0.25, feld: feldKennung({ zeile: 0, spalte: 1 }) },
  update(state, action) {
    if (action.type === "reset") {
      return { temperatur: 0.25, feld: feldKennung({ zeile: 0, spalte: 1 }) };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const temperatur = temperaturVon(state);
    const feld = feldVon(state);
    const q = qWerte(feld, GAMMA);
    const p = q ? richtungsWahrscheinlichkeiten(q, temperatur) : [0, 0, 0, 0];
    const beste = p.indexOf(Math.max(...p));
    const besteWahrscheinlichkeit = p[beste] ?? 0;
    const entropieWert = entropie(p);
    const gleichverteilt = 1 / RICHTUNGEN.length;
    const hoechsteEntropie = Math.log(RICHTUNGEN.length);

    // Rasterzellen: bevorzugte Richtung je Feld. Auf den Abschlussfeldern wird nicht gewählt.
    const zellen: GridCell[] = [];
    for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
      for (let spalte = 0; spalte < SPALTEN; spalte += 1) {
        const hier: Feld = { zeile, spalte };
        const qHier = qWerte(hier, GAMMA);
        if (!qHier) {
          const name = feldwert(hier) > 0 ? "Ziel" : "Falle";
          zellen.push({ row: zeile, col: spalte, value: 0, label: name });
          continue;
        }
        const pHier = richtungsWahrscheinlichkeiten(qHier, temperatur);
        const besteHier = pHier.indexOf(Math.max(...pHier));
        zellen.push({
          row: zeile,
          col: spalte,
          value: pHier[besteHier] ?? 0,
          label: richtungName(besteHier),
        });
      }
    }

    const saetze: string[] = [];
    if (q) {
      saetze.push(
        `Auf dem gewählten Feld (${feldName(feld)}) ist ${richtungName(beste)} die bevorzugte ` +
          `Richtung: bei der Temperatur ${formatValue(temperatur, 2)} hat sie die ` +
          `Wahrscheinlichkeit ${formatValue(besteWahrscheinlichkeit, 4)}.`,
      );
      const zweitbeste = [...p].sort((a, b) => b - a)[1] ?? 0;
      if (Math.abs(besteWahrscheinlichkeit - zweitbeste) < 1e-9) {
        saetze.push(
          "Zwei Richtungen sind gleich gut: sie teilen sich die Wahrscheinlichkeit, und mehr als " +
            `die Hälfte bekommt keine. Die übrigen Richtungen liegen bei ` +
            `${formatValue(Math.min(...p), 4)}.`,
        );
      } else {
        saetze.push(
          `Die Richtung mit dem kleinsten Q-Wert bekommt nur ${formatValue(Math.min(...p), 4)}. ` +
            "Eine kleinere Temperatur macht die Wahl schärfer, eine größere glättet sie.",
        );
      }
    } else {
      saetze.push(
        `Das gewählte Feld (${feldName(feld)}) ist ein Abschlussfeld: dort endet die Folge und ` +
          "es wird nicht gewählt. Alle vier Säulen stehen deshalb bei null.",
      );
    }
    saetze.push(
      `Die Entropie der Verteilung ist ${formatValue(entropieWert, 4)}; völlig gleichverteilt ` +
        `wären alle vier Richtungen bei ${formatValue(gleichverteilt, 4)} und die Entropie bei ` +
        `${formatValue(hoechsteEntropie, 4)}.`,
    );
    saetze.push(
      "Im Raster steht für jedes Feld die bevorzugte Richtung; die Farbe zeigt, wie deutlich " +
        "diese Wahl ist.",
    );

    return {
      values: [
        {
          label: "Wahrscheinlichkeit der besten Richtung",
          value: besteWahrscheinlichkeit,
          digits: 4,
        },
        { label: "Entropie der Verteilung", value: entropieWert, digits: 4 },
        { label: "Höchstwert der Entropie", value: hoechsteEntropie, digits: 4 },
        { label: "Wahrscheinlichkeit ohne Vorliebe", value: gleichverteilt, digits: 4 },
      ],
      drawing: {
        kind: "grid",
        cols: SPALTEN,
        rows: ZEILEN,
        cells: zellen,
        xRange: [0, SPALTEN],
        yRange: [0, ZEILEN],
        style: "anteil",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const feld = feldVon(after);
    const q = qWerte(feld, GAMMA);
    if (!q) return [];
    const alt = Math.max(...richtungsWahrscheinlichkeiten(q, temperaturVon(before)));
    const neu = Math.max(...richtungsWahrscheinlichkeiten(q, temperaturVon(after)));
    const vergleich = compareValues(alt, neu, 1e-9);
    if (vergleich === "up") return [{ name: "policyScharf", severity: "info", value: neu }];
    if (vergleich === "down") return [{ name: "policyFlach", severity: "info", value: neu }];
    return [];
  },
};
