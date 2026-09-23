/**
 * LEK-38 Value Function: erwarteter Return jedes Feldes einer kleinen Grid World.
 *
 * Dieselbe Welt wie in Lektion 37 (exp-rl-gridworld): drei mal drei Felder, das Ziel oben rechts
 * trägt den festen Feldwert plus eins, die Falle in der Mitte minus eins, jeder Schritt kostet
 * 0,04. Wird ein Abschlussfeld betreten, endet die Folge. Vier Richtungen stehen zur Wahl; ein
 * Zug gegen die Wand bleibt auf dem Feld stehen und kostet trotzdem einen Schritt.
 *
 * Der Wert eines Feldes ist die abdiskontierte Summe auf dem kürzesten Weg zum Ziel, mit d
 * Schritten bis zum Ziel:
 *
 *   V(s) = -0,04 · (1 + gamma + ... + gamma hoch d-1) + gamma hoch d · 1
 *
 * Genau dieselbe Zahl liefert die Bellman-Gleichung V(s) = max über a von -0,04 + gamma · V(s').
 * Die Testdatei rechnet beide Wege gegeneinander (tests/lektionen-38-41.test.ts).
 *
 * Diese Datei hält die Welt fest; die Experimente der Lektionen 39 bis 41 lesen sie von hier.
 * Alle Zahlen und die Farbfläche entstehen aus derselben Rechnung.
 */
import type { Calculated, GridCell } from "../model/types.js";
import {
  compareValues,
  formatValue,
  registerRules,
  type SemanticEvent,
} from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Feld = { zeile: number; spalte: number };

export const ZEILEN = 3;
export const SPALTEN = 3;

/** Fester Feldwert, zeilenweise gelesen: Ziel oben rechts +1, Falle in der Mitte -1. */
export const FELDBELOHNUNG: number[] = [0, 0, 1, 0, -1, 0, 0, 0, 0];

/** Jeder Schritt kostet diesen Betrag - sonst wäre Herumstehen so gut wie das Ziel. */
export const SCHRITTPREIS = -0.04;

/** Abzinsung: 0,9 ist der Startwert des Reglers (wie in Lektion 37 ohne Abzinsung, dort gamma = 1). */
export const GAMMA = 0.9;

export const START: Feld = { zeile: 2, spalte: 0 };
export const ZIEL: Feld = { zeile: 0, spalte: 2 };
export const FALLE: Feld = { zeile: 1, spalte: 1 };

/** Die vier Aktionen in fester Reihenfolge: oben, rechts, unten, links. */
export const RICHTUNGEN: { name: string; dzeile: number; dspalte: number }[] = [
  { name: "oben", dzeile: -1, dspalte: 0 },
  { name: "rechts", dzeile: 0, dspalte: 1 },
  { name: "unten", dzeile: 1, dspalte: 0 },
  { name: "links", dzeile: 0, dspalte: -1 },
];

export function feldIndex(f: Feld): number {
  return f.zeile * SPALTEN + f.spalte;
}

export function aufDemGitter(f: Feld): boolean {
  return f.zeile >= 0 && f.zeile < ZEILEN && f.spalte >= 0 && f.spalte < SPALTEN;
}

/** Fester Feldwert eines Feldes. */
export function feldwert(f: Feld): number {
  return FELDBELOHNUNG[feldIndex(f)] ?? 0;
}

/** Ist das Feld ein Abschlussfeld? Dort endet die Folge. */
export function istAbschluss(f: Feld): boolean {
  return feldwert(f) !== 0;
}

/** Ein Zug: gegen die Wand bleibt der Agent stehen. */
export function ziehe(f: Feld, richtung: number): Feld {
  const r = RICHTUNGEN[richtung];
  if (!r) return f;
  const nachbar = { zeile: f.zeile + r.dzeile, spalte: f.spalte + r.dspalte };
  return aufDemGitter(nachbar) ? nachbar : f;
}

/** Zahl der Schritte auf dem kürzesten Weg zum Ziel. */
export function schritteZumZiel(f: Feld): number {
  return Math.abs(f.zeile - ZIEL.zeile) + Math.abs(f.spalte - ZIEL.spalte);
}

/**
 * Wert eines Feldes: fester Feldwert am Abschlussfeld, sonst abdiskontierte Summe auf dem
 * kürzesten Weg zum Ziel. Der kürzeste Weg führt nie über die Falle.
 */
export function wert(f: Feld, gamma: number): number {
  if (istAbschluss(f)) return feldwert(f);
  const d = schritteZumZiel(f);
  let schritte = 0;
  for (let k = 0; k < d; k += 1) schritte += gamma ** k;
  return SCHRITTPREIS * schritte + gamma ** d * feldwert(ZIEL);
}

export function feldName(f: Feld): string {
  return `Zeile ${f.zeile}, Spalte ${f.spalte}`;
}

export function feldKennung(f: Feld): string {
  return `${f.zeile}-${f.spalte}`;
}

/** Alle neun Felder, zeilenweise gelesen. */
export const ALLE_FELDER: Feld[] = (() => {
  const liste: Feld[] = [];
  for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
    for (let spalte = 0; spalte < SPALTEN; spalte += 1) liste.push({ zeile, spalte });
  }
  return liste;
})();

/** Kurze Beschriftung für Auswahllisten. */
export function feldBeschriftung(f: Feld): string {
  const name = feldName(f);
  if (f.zeile === ZIEL.zeile && f.spalte === ZIEL.spalte) return `${name} (Ziel)`;
  if (f.zeile === FALLE.zeile && f.spalte === FALLE.spalte) return `${name} (Falle)`;
  if (f.zeile === START.zeile && f.spalte === START.spalte) return `${name} (Start)`;
  return name;
}

/** Feld aus einer Kennung wie "0-1"; unbrauchbare Kennungen fallen auf das Startfeld zurück. */
export function feldVonKennung(kennung: string, fallback: Feld = START): Feld {
  const teile = kennung.split("-");
  const zeile = Number(teile[0]);
  const spalte = Number(teile[1]);
  if (!Number.isInteger(zeile) || !Number.isInteger(spalte)) return fallback;
  const feld = { zeile, spalte };
  return aufDemGitter(feld) ? feld : fallback;
}

function gammaVon(state: ExperimentState): number {
  const wertDesReglers = state["gamma"];
  return typeof wertDesReglers === "number" && Number.isFinite(wertDesReglers)
    ? wertDesReglers
    : GAMMA;
}

/** Alle neun Felder als Zellen für die Zeichnung; Wert und Beschriftung sind dieselbe Zahl. */
export function zellen(gamma: number): GridCell[] {
  const liste: GridCell[] = [];
  for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
    for (let spalte = 0; spalte < SPALTEN; spalte += 1) {
      const feld = { zeile, spalte };
      const v = wert(feld, gamma);
      liste.push({ row: zeile, col: spalte, value: v, label: formatValue(v, 2) });
    }
  }
  return liste;
}

registerRules([
  {
    name: "startwertGestiegen",
    explain: (e) =>
      `Der Wert des Startfelds ist auf ${formatValue(e.value ?? 0, 3)} gestiegen: ein größerer ` +
      "Diskontfaktor macht die entferntere Belohnung wichtiger.",
  },
  {
    name: "startwertGesunken",
    explain: (e) =>
      `Der Wert des Startfelds ist auf ${formatValue(e.value ?? 0, 3)} gesunken: mit kleinerem ` +
      "Diskontfaktor zählt die Belohnung am Ende weniger.",
  },
]);

export const valueFunction: Experiment = {
  id: "exp-value-function",
  title: "Wert der Felder",
  learningGoal: "Erwarteten Return eines Zustands als abdiskontierte Summe lesen",
  instructions:
    "Ziehe den Diskontfaktor. Die Farbfläche zeigt den Wert jedes Feldes: dunkel heißt großer Wert. Die Zahlen in den Feldern sind dieselben Werte.",
  spokenDescription:
    "Ein Raster aus drei mal drei Feldern. Oben rechts liegt das Ziel mit dem festen Wert plus " +
    "eins, in der Mitte die Falle mit minus eins. Jeder Schritt kostet null Komma null vier. Ein " +
    "Regler stellt den Diskontfaktor von null bis null Komma neun neun ein. Die Fläche ist nach " +
    "dem Wert der Felder eingefärbt: dunkel bedeutet großer Wert, hell bedeutet kleiner Wert. In " +
    "jedem Feld steht der Wert als Zahl, und darunter stehen der Wert des Startfelds, der Wert " +
    "des Zieles und der Wert der Falle.",
  controls: [
    {
      kind: "slider",
      id: "gamma",
      label: "Diskontfaktor gamma",
      min: 0,
      max: 0.99,
      step: 0.01,
      initial: GAMMA,
    },
  ],
  initialState: { gamma: GAMMA },
  update(state, action) {
    if (action.type === "reset") return { gamma: GAMMA };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const gamma = gammaVon(state);
    const startwert = wert(START, gamma);
    const zielwertVonFeld = wert(ZIEL, gamma);
    const fallenwert = wert(FALLE, gamma);
    const schritte = schritteZumZiel(START);

    const saetze: string[] = [
      `Bei einem Diskontfaktor von ${formatValue(gamma, 2)} ist das Startfeld ` +
        `${formatValue(startwert, 3)} wert, das Ziel ${formatValue(zielwertVonFeld, 2)} und die ` +
        `Falle ${formatValue(fallenwert, 2)}.`,
      `Vom Startfeld sind es ${schritte} Schritte bis zum Ziel. Jeder Schritt kostet ` +
        "0,04 und wird mit jedem Schritt davor ein Stück kleiner.",
    ];
    if (gamma === 0) {
      saetze.push(
        "Mit Diskontfaktor null zählt nur der nächste Schritt: jedes Feld außer Ziel und Falle " +
          "ist dann genau minus 0,04 wert.",
      );
    } else if (gamma > 0.95) {
      saetze.push(
        "Ein hoher Diskontfaktor rechnet weit voraus: fast alle Felder liegen nahe am Zielwert, " +
          "die Abstände zwischen den Feldern werden klein.",
      );
    } else {
      saetze.push(
        "Je näher am Ziel, desto größer der Wert: die Nachbarn des Zieles stehen bei " +
          `${formatValue(wert({ zeile: 0, spalte: 1 }, gamma), 3)}.`,
      );
    }
    saetze.push(
      "Die Falle hat den kleinsten Wert im ganzen Raster: wer sie betritt, bekommt minus eins " +
        "und die Folge ist zu Ende.",
    );

    return {
      values: [
        { label: "Wert des Startfelds", value: startwert, digits: 3 },
        { label: "Wert des Ziels", value: zielwertVonFeld, digits: 2 },
        { label: "Wert der Falle", value: fallenwert, digits: 2 },
        { label: "Schritte vom Start zum Ziel", value: schritte, digits: 0 },
      ],
      drawing: {
        kind: "grid",
        cols: SPALTEN,
        rows: ZEILEN,
        cells: zellen(gamma),
        xRange: [0, SPALTEN],
        yRange: [0, ZEILEN],
        style: "verlust",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const vorher = wert(START, gammaVon(before));
    const nachher = wert(START, gammaVon(after));
    const vergleich = compareValues(vorher, nachher);
    if (vergleich === "up") {
      return [{ name: "startwertGestiegen", severity: "info", value: nachher }];
    }
    if (vergleich === "down") {
      return [{ name: "startwertGesunken", severity: "info", value: nachher }];
    }
    return [];
  },
};
