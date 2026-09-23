/**
 * LEK-39 Q-Learning: Q-Werte während des Lernens verfolgen.
 *
 * Dieselbe Grid World wie in den Lektionen 37 und 38. Der Agent folgt einem festen Muster aus
 * sechs Zügen: rechts, oben, oben, oben, rechts, rechts. Nach jedem beendeten Lauf (Falle oder
 * Ziel) steht er wieder auf dem Startfeld und macht mit dem nächsten Zug des Musters weiter. So
 * läuft der Rundgang in jedem Zyklus einmal in die Falle und einmal ins Ziel.
 *
 * Gelernt wird nach der Bellman-Regel; r ist der Schrittpreis, V(s') ist der Wert des Folgefeldes
 * (am Abschlussfeld der feste Feldwert, sonst der größte Q-Wert dort):
 *
 *   Q(s, a)  <-  Q(s, a) + alpha · (r + gamma · V(s') - Q(s, a))
 *
 * Alles ist reine Rechnung aus dem Zustand: gleicher Zustand, gleiche Q-Werte. Kein Zufall, keine
 * Zeit, keine Fenstergröße.
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
  ALLE_FELDER,
  GAMMA,
  RICHTUNGEN,
  SCHRITTPREIS,
  SPALTEN,
  START,
  ZEILEN,
  feldBeschriftung,
  feldIndex,
  feldKennung,
  feldName,
  feldVonKennung,
  feldwert,
  istAbschluss,
  wert,
  ziehe,
  type Feld,
} from "./exp-value-function.js";

/** Fester Rundgang in Aktionen: rechts, oben, oben, oben, rechts, rechts. */
export const MUSTER: number[] = [1, 0, 0, 0, 1, 1];

/** Ein leerer Q-Speicher: neun Felder, je vier Aktionen, alle null. */
function leereTabellen(): number[][] {
  const q: number[][] = [];
  for (let i = 0; i < ZEILEN * SPALTEN; i += 1) q.push([0, 0, 0, 0]);
  return q;
}

function besteQ(q: number[][], feld: Feld): number {
  const zeile = q[feldIndex(feld)];
  return zeile ? Math.max(...zeile) : 0;
}

function qZeile(q: number[][], feld: Feld): number[] {
  return q[feldIndex(feld)] ?? [0, 0, 0, 0];
}

/** Ein Lernlauf: feste Züge, nach jedem Abschlussfeld zurück auf das Startfeld. */
export function lernlauf(alpha: number, schritte: number): number[][] {
  const q = leereTabellen();
  let feld: Feld = START;
  for (let t = 0; t < schritte; t += 1) {
    const richtung = MUSTER[t % MUSTER.length] ?? 1;
    const folge = ziehe(feld, richtung);
    const folgewert = istAbschluss(folge) ? feldwert(folge) : besteQ(q, folge);
    const zeile = q[feldIndex(feld)];
    if (zeile) {
      const alt = zeile[richtung] ?? 0;
      zeile[richtung] = alt + alpha * (SCHRITTPREIS + GAMMA * folgewert - alt);
    }
    feld = istAbschluss(folge) ? START : folge;
  }
  return q;
}

export function groessterQ(q: number[][]): number {
  let groesster = 0;
  for (const zeile of q) {
    for (const wertDerAktion of zeile) {
      if (wertDerAktion > groesster) groesster = wertDerAktion;
    }
  }
  return groesster;
}

/** Feld und Richtung des größten Q-Wertes; für den Satz "dort steht der größte Wert". */
export function ortDesGroessten(q: number[][]): { feld: Feld; richtung: number } {
  let bester: { feld: Feld; richtung: number } = { feld: START, richtung: 0 };
  let groesster = Number.NEGATIVE_INFINITY;
  for (const feld of ALLE_FELDER) {
    const zeile = qZeile(q, feld);
    for (let richtung = 0; richtung < zeile.length; richtung += 1) {
      const wertDerAktion = zeile[richtung] ?? 0;
      if (wertDerAktion > groesster) {
        groesster = wertDerAktion;
        bester = { feld, richtung };
      }
    }
  }
  return bester;
}

function richtungName(richtung: number): string {
  return RICHTUNGEN[richtung]?.name ?? "unbekannt";
}

function lernrateVon(state: ExperimentState): number {
  const v = state["alpha"];
  return typeof v === "number" && Number.isFinite(v) ? v : 0.5;
}

function schritteVon(state: ExperimentState): number {
  const v = state["schritte"];
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 30;
}

function feldVon(state: ExperimentState): Feld {
  const v = state["feld"];
  return typeof v === "string" ? feldVonKennung(v) : feldVonKennung("0-1");
}

registerRules([
  {
    name: "qGestiegen",
    explain: (e) =>
      `Der größte Q-Wert ist auf ${formatValue(e.value ?? 0, 3)} gestiegen: der Rundgang hat ` +
      "eine Aktion näher am Ziel verbessert.",
  },
  {
    name: "qKonvergiert",
    explain: () =>
      "Die Q-Werte ändern sich kaum noch. Nach genügend Schritten stehen sie auf ihren " +
      "Endwerten: dort trifft die Bellman-Regel sich selbst.",
  },
]);

export const qLearning: Experiment = {
  id: "exp-q-learning",
  title: "Q-Werte beim Lernen",
  learningGoal: "Die Bellman-Regel als Schritt-für-Schritt-Verbesserung der Q-Werte lesen",
  instructions:
    "Wähle ein Feld und stelle Lernrate und Schrittzahl ein. Die Säulen zeigen die Q-Werte der vier Aktionen auf diesem Feld; hervorgehoben ist der größte. Bei gleichen Werten gilt die Reihenfolge oben, rechts, unten, links.",
  spokenDescription:
    "Vier Säulen für die vier Aktionen eines Feldes: oben, rechts, unten und links. Ein Regler " +
    "stellt die Lernrate ein, ein zweiter die Anzahl der Schritte, und eine Auswahl bestimmt das " +
    "Feld. Die hervorgehobene Säule gehört der Aktion mit dem größten Q-Wert. Darunter stehen der " +
    "größte Q-Wert der ganzen Tabelle, der beste Q-Wert des gewählten Feldes und der beste Q-Wert " +
    "im Startfeld.",
  controls: [
    {
      kind: "slider",
      id: "alpha",
      label: "Lernrate alpha",
      min: 0.05,
      max: 1,
      step: 0.05,
      initial: 0.5,
    },
    {
      kind: "slider",
      id: "schritte",
      label: "Anzahl Schritte",
      min: 0,
      max: 300,
      step: 1,
      initial: 30,
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
  initialState: { alpha: 0.5, schritte: 30, feld: feldKennung({ zeile: 0, spalte: 1 }) },
  update(state, action) {
    if (action.type === "reset") {
      return { alpha: 0.5, schritte: 30, feld: feldKennung({ zeile: 0, spalte: 1 }) };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const alpha = lernrateVon(state);
    const schritte = schritteVon(state);
    const feld = feldVon(state);
    const q = lernlauf(alpha, schritte);
    const zeile = qZeile(q, feld);
    const bester = Math.max(...zeile);
    const richtung = zeile.indexOf(bester);
    const gesamtGroesster = groessterQ(q);
    const ort = ortDesGroessten(q);
    const startBester = besteQ(q, START);

    const items: Bar[] = RICHTUNGEN.map((r, i) => ({
      label: r.name,
      value: zeile[i] ?? 0,
      highlighted: i === richtung,
    }));

    const saetze: string[] = [
      `Nach ${schritte} Schritten mit der Lernrate ${formatValue(alpha, 2)} ist der größte ` +
        `Q-Wert der Tabelle ${formatValue(gesamtGroesster, 3)}; er steht auf dem Feld ` +
        `${feldName(ort.feld)} für die Aktion ${richtungName(ort.richtung)}.`,
      istAbschluss(feld)
        ? `Das gewählte Feld (${feldName(feld)}) ist ein Abschlussfeld: dort endet jede Folge, ` +
          `und sein fester Wert ist ${formatValue(wert(feld, GAMMA), 3)}. Auf ihm wird nicht ` +
          "gewählt, deshalb stehen seine Q-Werte bei null."
        : `Im gewählten Feld (${feldName(feld)}) liegt die Aktion ${richtungName(richtung)} mit ` +
          `${formatValue(bester, 3)} vorne; der Wert dieses Feldes aus der Wertfunktion ist ` +
          `${formatValue(wert(feld, GAMMA), 3)}.`,
      `Der beste Q-Wert im Startfeld ist ${formatValue(startBester, 3)}. Die Werte wachsen vom ` +
        "Ziel rückwärts: je weiter ein Feld vom Ziel entfernt liegt, desto später bekommt es " +
        "einen Wert.",
    ];
    const kleinster = Math.min(...zeile);
    if (kleinster < -1e-9) {
      const richtungSchlecht = zeile.indexOf(kleinster);
      saetze.push(
        `Die Aktion ${richtungName(richtungSchlecht)} hat den Q-Wert ${formatValue(kleinster, 3)}: ` +
          "sie führt in die Falle, und dort gibt es minus eins. Negative Werte zeichnet die " +
          "Säulendarstellung nicht.",
      );
    } else {
      saetze.push(
        "Aktionen, die der Rundgang nicht ausprobiert hat, stehen noch bei null: gelernt wird " +
          "nur, was auch gegangen wurde.",
      );
    }

    return {
      values: [
        { label: "Größter Q-Wert", value: gesamtGroesster, digits: 3 },
        { label: "Bester Q-Wert im gewählten Feld", value: bester, digits: 3 },
        { label: "Bester Q-Wert im Startfeld", value: startBester, digits: 3 },
      ],
      drawing: {
        kind: "bars",
        items,
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const alt = groessterQ(lernlauf(lernrateVon(before), schritteVon(before)));
    const neu = groessterQ(lernlauf(lernrateVon(after), schritteVon(after)));
    const vergleich = compareValues(alt, neu, 1e-9);
    if (vergleich === "up") {
      return [{ name: "qGestiegen", severity: "info", value: neu }];
    }
    if (vergleich === "equal" && schritteVon(after) > schritteVon(before)) {
      return [{ name: "qKonvergiert", severity: "info", value: neu }];
    }
    return [];
  },
};
