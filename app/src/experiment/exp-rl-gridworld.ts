/**
 * LEK-37 Reinforcement Learning: Ein Agent in einer kleinen Grid World.
 *
 * Rechenkern: Die Grid World hat drei mal drei Felder mit festen Belohnungen im Code (Ziel +1,
 * Falle -1, sonst 0) und einen festen Schrittpreis von -0,04. Der Agent startet unten links. Vier
 * Auswahlen bestimmen die Zugfolge; die Folge endet, sobald ein Feld mit Belohnung betreten wird
 * oder alle vier Züge gemacht sind. Ein Zug gegen die Wand bleibt auf dem Feld stehen und kostet
 * trotzdem einen Schritt.
 *
 *   G = r_1 + r_2 + ... + r_T        (hier ohne Abzinsung, gamma = 1)
 *
 * Alles ist reine Rechnung aus dem Zustand: gleicher Zustand, gleiche Belohnungssumme.
 */
import type { Calculated, GridCell, Vector } from "../model/types.js";
import {
  compareValues,
  formatValue,
  registerRules,
  type SemanticEvent,
} from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type Richtung = "oben" | "unten" | "links" | "rechts";

export const RICHTUNGEN: { value: Richtung; label: string }[] = [
  { value: "oben", label: "nach oben" },
  { value: "unten", label: "nach unten" },
  { value: "links", label: "nach links" },
  { value: "rechts", label: "nach rechts" },
];

export const ZEILEN = 3;
export const SPALTEN = 3;

/** Belohnung je Feld, zeilenweise gelesen (row * SPALTEN + col). */
export const FELDBELOHNUNG: number[] = [0, 0, 1, 0, -1, 0, 0, 0, 0];

/** Jeder Schritt kostet diesen Betrag - sonst wäre Herumstehen gleich gut wie das Ziel. */
export const SCHRITTPREIS = -0.04;

export const START = { zeile: 2, spalte: 0 };

/** Höchstzahl der Züge in einer Folge (so viele Auswahlen gibt es). */
export const ZUEGE_MAX = 4;

const PFEILE: Record<Richtung, string> = {
  oben: "↑",
  unten: "↓",
  links: "←",
  rechts: "→",
};

function feldIndex(zeile: number, spalte: number): number {
  return zeile * SPALTEN + spalte;
}

/** Belohnung des Feldes. */
export function feldBelohnung(zeile: number, spalte: number): number {
  return FELDBELOHNUNG[feldIndex(zeile, spalte)] ?? 0;
}

/** Ist das Feld ein Abschlussfeld (Ziel oder Falle)? */
export function istAbschluss(zeile: number, spalte: number): boolean {
  return feldBelohnung(zeile, spalte) !== 0;
}

export type Episode = {
  /** Feldfolge einschließlich Startfeld. */
  pfad: { zeile: number; spalte: number }[];
  /** Tatsächlich ausgeführte Züge. */
  zuege: Richtung[];
  belohnung: number;
  schritte: number;
  ende: { zeile: number; spalte: number };
  zielErreicht: boolean;
  falleErwischt: boolean;
  wandAnstoss: boolean;
};

/** Eine Folge abspielen: Züge anwenden, Belohnungen aufsummieren, am Abschlussfeld abbrechen. */
export function episode(zuege: Richtung[]): Episode {
  let zeile = START.zeile;
  let spalte = START.spalte;
  let belohnung = 0;
  let wandAnstoss = false;
  let zielErreicht = false;
  let falleErwischt = false;
  const ausgefuehrt: Richtung[] = [];
  const pfad = [{ zeile, spalte }];

  for (const zug of zuege.slice(0, ZUEGE_MAX)) {
    const vorher = { zeile, spalte };
    if (zug === "oben") zeile = Math.max(0, zeile - 1);
    else if (zug === "unten") zeile = Math.min(ZEILEN - 1, zeile + 1);
    else if (zug === "links") spalte = Math.max(0, spalte - 1);
    else spalte = Math.min(SPALTEN - 1, spalte + 1);

    if (zeile === vorher.zeile && spalte === vorher.spalte) wandAnstoss = true;
    ausgefuehrt.push(zug);
    belohnung += SCHRITTPREIS + feldBelohnung(zeile, spalte);
    pfad.push({ zeile, spalte });

    if (istAbschluss(zeile, spalte)) {
      zielErreicht = feldBelohnung(zeile, spalte) > 0;
      falleErwischt = feldBelohnung(zeile, spalte) < 0;
      break;
    }
  }

  return {
    pfad,
    zuege: ausgefuehrt,
    belohnung,
    schritte: ausgefuehrt.length,
    ende: { zeile, spalte },
    zielErreicht,
    falleErwischt,
    wandAnstoss,
  };
}

/** Mitte eines Feldes in Zeichenkoordinaten (Zeile 0 ist die oberste Zeile). */
function feldMitte(zeile: number, spalte: number): [number, number] {
  return [spalte + 0.5, ZEILEN - 1 - zeile + 0.5];
}

function richtungstext(wert: number): string {
  if (wert > 0) return `+${wert}`;
  if (wert < 0) return `-${Math.abs(wert)}`;
  return "0";
}

function richtungVon(state: ExperimentState, id: string, fallback: Richtung): Richtung {
  const wert = state[id];
  if (typeof wert === "string" && RICHTUNGEN.some((r) => r.value === wert)) {
    return wert as Richtung;
  }
  return fallback;
}

registerRules([
  {
    name: "zielErreicht",
    explain: (e) =>
      `Das Ziel ist erreicht: die Folge bringt ${formatValue(e.value ?? 0, 2)} an Belohnung.`,
  },
  {
    name: "falleErwischt",
    explain: (e) =>
      `Die Falle wurde erwischt. Die Folge endet mit ${formatValue(e.value ?? 0, 2)} an Belohnung.`,
  },
  {
    name: "wandAnstoss",
    explain: () =>
      "Ein Zug ging gegen die Wand: der Agent bleibt stehen, der Schritt kostet trotzdem.",
  },
  {
    name: "belohnungGestiegen",
    explain: (e) =>
      `Diese Zugfolge bringt mehr Belohnung als die vorige, nämlich ${formatValue(e.value ?? 0, 2)}.`,
  },
  {
    name: "belohnungGesunken",
    explain: (e) =>
      `Diese Zugfolge bringt weniger Belohnung als die vorige, nämlich ${formatValue(e.value ?? 0, 2)}.`,
  },
]);

export const gridworld: Experiment = {
  id: "exp-rl-gridworld",
  title: "Agent in der Grid World",
  learningGoal: "Belohnung einer Zugfolge in einer Grid World ausrechnen und vergleichen",
  instructions:
    "Stelle die vier Züge ein. Der Agent startet unten links, das Ziel liegt oben rechts. Jeder Schritt kostet 0,04, das Ziel gibt 1, die Falle in der Mitte kostet 1. Die Folge endet, sobald ein solches Feld betreten wird.",
  spokenDescription:
    "Ein Raster aus drei mal drei Feldern. Das Ziel oben rechts trägt die Belohnung plus eins, " +
    "die Falle in der Mitte minus eins, alle anderen Felder null. Vier Auswahlen bestimmen die " +
    "Richtung der vier Züge. Die Pfeile im Raster zeigen den gelaufenen Weg, die Zahlen darunter " +
    "nennen die Summe der Belohnungen, die Zahl der Schritte und das Feld, auf dem der Agent " +
    "stehen geblieben ist.",
  controls: [
    { kind: "select", id: "zug1", label: "1. Zug", options: RICHTUNGEN, initial: "rechts" },
    { kind: "select", id: "zug2", label: "2. Zug", options: RICHTUNGEN, initial: "rechts" },
    { kind: "select", id: "zug3", label: "3. Zug", options: RICHTUNGEN, initial: "oben" },
    { kind: "select", id: "zug4", label: "4. Zug", options: RICHTUNGEN, initial: "oben" },
  ],
  initialState: { zug1: "rechts", zug2: "rechts", zug3: "oben", zug4: "oben" },
  update(state, action) {
    if (action.type === "reset") {
      return { zug1: "rechts", zug2: "rechts", zug3: "oben", zug4: "oben" };
    }
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const zuege = [
      richtungVon(state, "zug1", "rechts"),
      richtungVon(state, "zug2", "rechts"),
      richtungVon(state, "zug3", "oben"),
      richtungVon(state, "zug4", "oben"),
    ];
    const verlauf = episode(zuege);
    const jeSchritt = verlauf.schritte > 0 ? verlauf.belohnung / verlauf.schritte : 0;

    // Zellbeschriftung: Pfeil der Richtung, die von hier aus gegangen wurde; sonst die Belohnung.
    const pfeil = new Map<string, string>();
    for (let i = 0; i < verlauf.schritte; i += 1) {
      const von = verlauf.pfad[i];
      const zug = verlauf.zuege[i];
      if (von && zug) pfeil.set(`${von.zeile}-${von.spalte}`, PFEILE[zug]);
    }
    const zellen: GridCell[] = [];
    for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
      for (let spalte = 0; spalte < SPALTEN; spalte += 1) {
        const beschriftung =
          pfeil.get(`${zeile}-${spalte}`) ?? richtungstext(feldBelohnung(zeile, spalte));
        zellen.push({
          row: zeile,
          col: spalte,
          value: feldBelohnung(zeile, spalte),
          label: beschriftung,
        });
      }
    }

    const punkte = [
      {
        label: "Start",
        x: feldMitte(START.zeile, START.spalte)[0],
        y: feldMitte(START.zeile, START.spalte)[1],
        color: "#1a73e8",
      },
      {
        label: "Ende",
        x: feldMitte(verlauf.ende.zeile, verlauf.ende.spalte)[0],
        y: feldMitte(verlauf.ende.zeile, verlauf.ende.spalte)[1],
        color: "#d93025",
      },
    ];

    const pfeileImBild: Vector[] = [];
    for (let i = 0; i < verlauf.schritte; i += 1) {
      const von = verlauf.pfad[i];
      const nach = verlauf.pfad[i + 1];
      if (!von || !nach) continue;
      if (von.zeile === nach.zeile && von.spalte === nach.spalte) continue;
      pfeileImBild.push({
        label: "",
        from: feldMitte(von.zeile, von.spalte),
        to: feldMitte(nach.zeile, nach.spalte),
        color: "#1a73e8",
      });
    }

    const saetze: string[] = [];
    saetze.push(
      `Die Zugfolge bringt in ${verlauf.schritte} Schritten die Belohnung ` +
        `${formatValue(verlauf.belohnung, 2)}.`,
    );
    saetze.push(
      `Je Schritt sind das ${formatValue(jeSchritt, 3)}; der Agent steht am Ende in Zeile ` +
        `${verlauf.ende.zeile} und Spalte ${verlauf.ende.spalte}.`,
    );
    if (verlauf.zielErreicht) {
      saetze.push("Das Ziel oben rechts ist erreicht: dort gibt es die Belohnung plus eins.");
    } else if (verlauf.falleErwischt) {
      saetze.push("Die Falle in der Mitte wurde erwischt: die Folge endet dort mit minus eins.");
    } else {
      saetze.push(
        "In diesen Zügen wurde weder Ziel noch Falle erreicht; es bleibt bei den Schrittkosten " +
          "von 0,04 je Zug.",
      );
    }
    if (verlauf.wandAnstoss) {
      saetze.push(
        "Ein Zug ging gegen die Wand: der Agent blieb auf seinem Feld stehen und zahlte den " +
          "Schrittpreis.",
      );
    }

    return {
      values: [
        { label: "Belohnung der Folge", value: verlauf.belohnung, digits: 2 },
        { label: "Schritte", value: verlauf.schritte, digits: 0 },
        { label: "Belohnung je Schritt", value: jeSchritt, digits: 3 },
        { label: "Zeile am Ende", value: verlauf.ende.zeile, digits: 0 },
        { label: "Spalte am Ende", value: verlauf.ende.spalte, digits: 0 },
      ],
      drawing: {
        kind: "grid",
        cols: SPALTEN,
        rows: ZEILEN,
        cells: zellen,
        xRange: [0, SPALTEN],
        yRange: [0, ZEILEN],
        vectors: pfeileImBild,
        points: punkte,
        style: "verlust",
      },
      sentences: saetze,
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const zuegeVon = (state: ExperimentState): Richtung[] => [
      richtungVon(state, "zug1", "rechts"),
      richtungVon(state, "zug2", "rechts"),
      richtungVon(state, "zug3", "oben"),
      richtungVon(state, "zug4", "oben"),
    ];
    const alt = episode(zuegeVon(before));
    const neu = episode(zuegeVon(after));
    const ereignisse: SemanticEvent[] = [];
    if (neu.zielErreicht) {
      ereignisse.push({ name: "zielErreicht", severity: "notable", value: neu.belohnung });
    }
    if (neu.falleErwischt) {
      ereignisse.push({ name: "falleErwischt", severity: "warning", value: neu.belohnung });
    }
    if (neu.wandAnstoss) ereignisse.push({ name: "wandAnstoss", severity: "info" });

    const vergleich = compareValues(alt.belohnung, neu.belohnung, 1e-9);
    if (vergleich === "up") {
      ereignisse.push({ name: "belohnungGestiegen", severity: "info", value: neu.belohnung });
    } else if (vergleich === "down") {
      ereignisse.push({ name: "belohnungGesunken", severity: "info", value: neu.belohnung });
    }
    return ereignisse;
  },
};
