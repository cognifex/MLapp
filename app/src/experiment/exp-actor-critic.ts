/**
 * LEK-42 Actor-Critic: Politik und Wertschaetzung werden im selben Schritt verbessert.
 *
 * Rechenkern: eine kleine, im Code festgelegte Umgebung mit drei Zustaenden (Zustand 2 ist das
 * Ziel) und zwei Aktionen ("weiter" und "bleiben"). Der Kritiker schaetzt die Werte V, der Actor
 * haelt je Zustand zwei Politikwerte theta. Beide lernen aus demselben Bellman-Fehler - der eine
 * mit der Lernrate des Kritikers, der andere mit der Lernrate des Actors. Die Episode folgt immer
 * der wahrscheinlichsten Aktion; bei Gleichstand gewinnt "weiter". Alles ist rein, ohne Zufall.
 */
import type { Bar, Calculated } from "../model/types.js";
import { registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

/** Belohnungsabschwaechung je Schritt. */
export const GAMMA = 0.9;
/** Zustand 2 ist das Ziel: dort endet die Episode, sein Wert bleibt null. */
export const ZIEL = 2;
/** So viele Schritte darf eine Episode hoechstens dauern (Sicherung gegen Kreiseln). */
const MAX_SCHRITTE_JE_EPISODE = 5;
/** Die beiden Aktionen in fester Reihenfolge; bei Gleichstand gewinnt die erste. */
export const AKTIONEN = ["weiter", "bleiben"];
/** Die Zustaende, in denen gelernt wird (das Ziel selbst wird nicht mehr bewertet). */
const LERNZUSTAENDE = [0, 1];
const ZUSTANDSNAMEN = ["Zustand 0", "Zustand 1", "Ziel 2"];

type Wertepaar = [number, number];

export function softmax(werte: number[]): number[] {
  const groesste = Math.max(...werte);
  const hoch = werte.map((w) => Math.exp(w - groesste));
  const summe = hoch.reduce((a, b) => a + b, 0);
  return hoch.map((h) => h / summe);
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

function wert(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Aktionswahrscheinlichkeiten aus den beiden Politikwerten eines Zustands. */
export function politikwerte(theta: Wertepaar): Wertepaar {
  const p = softmax([theta[0], theta[1]]);
  return [p[0] ?? 0.5, p[1] ?? 0.5];
}

/** Die Aktion, die die aktuelle Politik in einem Zustand waehlt (erste bei Gleichstand). */
export function gewaehlteAktion(p: Wertepaar): number {
  return (p[1] ?? 0) > (p[0] ?? 0) ? 1 : 0;
}

export type Verlauf = {
  /** Wertschaetzung je Zustand; Zustand 2 ist das Ziel und bleibt null. */
  werte: number[];
  /** Aktionswahrscheinlichkeiten je Zustand. */
  politik: Wertepaar[];
  /** Mittelwert des Verlusts 0,5 mal Bellman-Fehler im Quadrat ueber alle Schritte. */
  verlust: number;
  /** Bellman-Fehler des letzten Schritts. */
  letzterFehler: number;
};

/**
 * Spielt `schritte` Lernschritte in der festen Umgebung durch und liefert den Endstand.
 * Nach dem Ziel beginnt eine neue Episode im Zustand 0.
 */
export function verlauf(
  lernrateKritiker: number,
  lernrateActor: number,
  schritte: number,
): Verlauf {
  const werte: number[] = [0, 0, 0];
  const theta: Wertepaar[] = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  let zustand = 0;
  let schritteInEpisode = 0;
  let summeVerlust = 0;
  let letzterFehler = 0;

  for (let schritt = 0; schritt < schritte; schritt += 1) {
    const t: Wertepaar = theta[zustand] ?? [0, 0];
    const p = politikwerte(t);
    const aktion = gewaehlteAktion(p);
    const naechster = aktion === 0 ? Math.min(zustand + 1, ZIEL) : zustand;
    const belohnung = naechster === ZIEL && zustand !== ZIEL ? 1 : 0;
    // Der Bellman-Fehler ist das, was beide Teile gemeinsam ausnutzen.
    const fehler = belohnung + GAMMA * (werte[naechster] ?? 0) - (werte[zustand] ?? 0);

    werte[zustand] = (werte[zustand] ?? 0) + lernrateKritiker * fehler;

    // Der Actor zieht die gewaehlte Aktion nach oben und die andere nach unten.
    const neu: Wertepaar = [t[0], t[1]];
    for (let k = 0; k < neu.length; k += 1) {
      const wahrscheinlichkeit = p[k] ?? 0.5;
      const richtung = k === aktion ? 1 - wahrscheinlichkeit : -wahrscheinlichkeit;
      neu[k] = (neu[k] ?? 0) + lernrateActor * fehler * richtung;
    }
    theta[zustand] = neu;

    summeVerlust += 0.5 * fehler * fehler;
    letzterFehler = fehler;

    schritteInEpisode += 1;
    if (naechster === ZIEL || schritteInEpisode >= MAX_SCHRITTE_JE_EPISODE) {
      zustand = 0;
      schritteInEpisode = 0;
    } else {
      zustand = naechster;
    }
  }

  return {
    werte,
    politik: theta.map((t) => politikwerte(t)),
    verlust: schritte > 0 ? summeVerlust / schritte : 0,
    letzterFehler,
  };
}

/** Groesste Aktionswahrscheinlichkeit unter den lernenden Zustaenden. */
function groessteWahrscheinlichkeit(politik: Wertepaar[]): number {
  let groesste = 0;
  for (const zustand of LERNZUSTAENDE) {
    const p: Wertepaar = politik[zustand] ?? [0.5, 0.5];
    for (const wahrscheinlichkeit of p) {
      if (wahrscheinlichkeit > groesste) groesste = wahrscheinlichkeit;
    }
  }
  return groesste;
}

/** Saeulen der Aktionswahrscheinlichkeiten; der Umriss zeigt den Startwert 0,5. */
function politikbalken(politik: Wertepaar[]): Bar[] {
  const balken: Bar[] = [];
  for (const zustand of LERNZUSTAENDE) {
    const p: Wertepaar = politik[zustand] ?? [0.5, 0.5];
    const aktion = gewaehlteAktion(p);
    for (let k = 0; k < AKTIONEN.length; k += 1) {
      balken.push({
        label: `${ZUSTANDSNAMEN[zustand] ?? "Zustand"} · ${AKTIONEN[k] ?? ""}`,
        value: p[k] ?? 0,
        ghost: 0.5,
        highlighted: k === aktion,
      });
    }
  }
  return balken;
}

registerRules([
  {
    name: "policySharpened",
    explain: (e) =>
      `Die Politik wird deutlicher: die wahrscheinlichste Aktion steht jetzt bei ${format(e.value ?? 0, 3)}.`,
  },
  {
    name: "learningUnstable",
    explain: (e) =>
      `Der Bellman-Fehler des letzten Schritts waechst auf ${format(e.value ?? 0, 3)}. Die Lernrate des Kritikers ist zu gross - die Wertschaetzung schwingt um ihr Ziel.`,
  },
]);

export const actorCritic: Experiment = {
  id: "exp-actor-critic",
  title: "Actor und Kritiker lernen gemeinsam",
  learningGoal: "Politik und Wertschaetzung aus demselben Bellman-Fehler verbessern",
  instructions:
    "Veraendere die Lernraten und die Anzahl der Schritte. Die Saeulen zeigen die Aktionswahrscheinlichkeiten in beiden Zustaenden, der Umriss den Startwert 0,5.",
  spokenDescription:
    "Eine kleine Umgebung mit zwei Zustaenden und dem Ziel in Zustand zwei. Rechts stehen zwei Regler fuer die Lernraten, " +
    "einer fuer die Anzahl der Schritte. Saeulen zeigen, mit welcher Wahrscheinlichkeit der Agent in jedem Zustand weitergeht oder bleibt; " +
    "der gestrichelte Umriss ist der Startwert. Darunter stehen die Wertschaetzung und der Verlust.",
  controls: [
    {
      kind: "slider",
      id: "lernrateKritiker",
      label: "Lernrate Kritiker",
      min: 0.05,
      max: 0.5,
      step: 0.05,
      initial: 0.2,
    },
    {
      kind: "slider",
      id: "lernrateActor",
      label: "Lernrate Actor",
      min: 0.05,
      max: 0.5,
      step: 0.05,
      initial: 0.2,
    },
    {
      kind: "slider",
      id: "schritte",
      label: "Anzahl Schritte",
      min: 0,
      max: 20,
      step: 1,
      initial: 8,
    },
  ],
  initialState: { lernrateKritiker: 0.2, lernrateActor: 0.2, schritte: 8 },
  update(state, action) {
    if (action.type === "reset") return { lernrateKritiker: 0.2, lernrateActor: 0.2, schritte: 8 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const schritte = Math.round(wert(state, "schritte", 8));
    const lernrateKritiker = wert(state, "lernrateKritiker", 0.2);
    const lernrateActor = wert(state, "lernrateActor", 0.2);
    const r = verlauf(lernrateKritiker, lernrateActor, schritte);

    const p0: Wertepaar = r.politik[0] ?? [0.5, 0.5];
    const p1: Wertepaar = r.politik[1] ?? [0.5, 0.5];
    const v0 = r.werte[0] ?? 0;
    const v1 = r.werte[1] ?? 0;

    return {
      values: [
        { label: "Wertschätzung V(Zustand 0)", value: v0, digits: 4 },
        { label: "Wertschätzung V(Zustand 1)", value: v1, digits: 4 },
        { label: "Verlust", value: r.verlust, digits: 4 },
        { label: "Bellman-Fehler zuletzt", value: r.letzterFehler, digits: 4 },
      ],
      drawing: {
        kind: "bars",
        items: politikbalken(r.politik),
        yMax: 1,
      },
      sentences: [
        `Nach ${schritte} Schritten schätzt der Kritiker den Wert von Zustand 0 auf ${format(v0, 3)} und von Zustand 1 auf ${format(v1, 3)}.`,
        `Der Verlust beträgt ${format(r.verlust, 4)}, der letzte Bellman-Fehler ${format(r.letzterFehler, 3)}.`,
        `Der Actor geht in Zustand 0 mit ${format((p0[0] ?? 0) * 100, 1)} Prozent weiter und in Zustand 1 mit ${format((p1[0] ?? 0) * 100, 1)} Prozent.`,
        Math.abs(v1 - 1) < 0.05
          ? "Die Wertschätzung von Zustand 1 liegt nahe bei eins: der Kritiker hat die Belohnung des Ziels gelernt."
          : "Mit mehr Schritten wandern die Werte gegen 0,9 in Zustand 0 und gegen 1 in Zustand 1 - die Politik wird dabei deutlicher.",
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const r0 = verlauf(
      wert(before, "lernrateKritiker", 0.2),
      wert(before, "lernrateActor", 0.2),
      Math.round(wert(before, "schritte", 8)),
    );
    const r1 = verlauf(
      wert(after, "lernrateKritiker", 0.2),
      wert(after, "lernrateActor", 0.2),
      Math.round(wert(after, "schritte", 8)),
    );
    const events: SemanticEvent[] = [];
    if (r1.verlust < r0.verlust - 1e-9) {
      events.push({ name: "lossDecreased", severity: "info", value: r1.verlust });
    } else if (r1.verlust > r0.verlust + 1e-9) {
      events.push({ name: "lossIncreased", severity: "info", value: r1.verlust });
    } else if (Math.round(wert(after, "schritte", 8)) > 0) {
      events.push({ name: "converged", severity: "info", value: r1.verlust });
    }
    if (groessteWahrscheinlichkeit(r1.politik) > groessteWahrscheinlichkeit(r0.politik) + 0.05) {
      events.push({
        name: "policySharpened",
        severity: "notable",
        value: groessteWahrscheinlichkeit(r1.politik),
      });
    }
    if (Math.abs(r1.letzterFehler) > Math.abs(r0.letzterFehler) + 0.05) {
      events.push({ name: "learningUnstable", severity: "warning", value: r1.letzterFehler });
    }
    return events;
  },
};
