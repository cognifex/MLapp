/**
 * LEK-24 Sequenzen: einen rekurrenten Zustand Schritt für Schritt aktualisieren.
 *
 * Rechenkern: h(t) = w mal h(t-1) plus x(t), Startwert null. Der Zustand wird für jeden Schritt
 * gespeichert; die Säulen der Zeichnung und der Endwert kommen aus demselben Verlauf.
 */
import type { Bar, Calculated } from "../model/types.js";
import { formatValue, registerRules, type SemanticEvent } from "../semantic/events.js";
import type { Experiment, ExperimentState } from "./contract.js";

export type FolgeKey = "impuls" | "konstant" | "anlauf" | "puls";

/** Die wählbaren Eingabefolgen, je sechs Werte. */
export const FOLGEN: Record<FolgeKey, number[]> = {
  impuls: [1, 0, 0, 0, 0, 0],
  konstant: [1, 1, 1, 1, 1, 1],
  anlauf: [0.2, 0.4, 0.6, 0.8, 1, 1.2],
  puls: [1, 1, 0, 0, 1, 1],
};

export const SCHRITTE_MAX = 6;

function zahl(state: ExperimentState, id: string, fallback: number): number {
  const v = state[id];
  return typeof v === "number" ? v : fallback;
}

function folgeKey(state: ExperimentState): FolgeKey {
  const v = state["folge"];
  return typeof v === "string" && v in FOLGEN ? (v as FolgeKey) : "konstant";
}

export function folge(state: ExperimentState): number[] {
  return FOLGEN[folgeKey(state)];
}

function gewicht(state: ExperimentState): number {
  return zahl(state, "gewicht", 0.8);
}

function schritte(state: ExperimentState): number {
  const roh = Math.round(zahl(state, "schritte", SCHRITTE_MAX));
  return Math.min(SCHRITTE_MAX, Math.max(1, roh));
}

/** Der rekurrente Zustand nach jedem Schritt. */
export function verlauf(gewichtWert: number, eingaben: number[], anzahlSchritte: number): number[] {
  const n = Math.min(eingaben.length, Math.max(1, Math.round(anzahlSchritte)));
  const out: number[] = [];
  let h = 0;
  for (let t = 0; t < n; t += 1) {
    h = gewichtWert * h + (eingaben[t] ?? 0);
    out.push(h);
  }
  return out;
}

function format(n: number, digits = 2): string {
  return n.toFixed(digits).replace(".", ",");
}

export const sequenzen: Experiment = {
  id: "exp-sequenzen",
  title: "Gedächtnis in Schritten",
  learningGoal:
    "Verstehen, wie ein rekurrenter Zustand Eingaben sammelt, vergisst oder aufschaukelt",
  instructions:
    "Wähle eine Eingabefolge und ein Gewicht und verändere die Zahl der Schritte. Die waagerechten Säulen zeigen den Zustand nach jedem Schritt.",
  spokenDescription:
    "Eine Eingabefolge aus sechs Werten und ein Gewicht. Der Zustand startet bei null und wird Schritt für Schritt neu gerechnet: " +
    "neuer Zustand ist Gewicht mal alter Zustand plus neue Eingabe. Die waagerechten Säulen zeigen den Zustand nach jedem Schritt, " +
    "die hervorgehobene Säule gehört zum letzten Schritt. Daneben stehen der Zustand nach der eingestellten Zahl von Schritten und die Summe der Eingaben.",
  controls: [
    {
      kind: "select",
      id: "folge",
      label: "Eingabefolge",
      options: [
        { value: "impuls", label: "Einzelner Impuls" },
        { value: "konstant", label: "Gleichbleibend eins" },
        { value: "anlauf", label: "Anlaufend" },
        { value: "puls", label: "Zwei Pulse" },
      ],
      initial: "konstant",
    },
    {
      kind: "slider",
      id: "gewicht",
      label: "Gewicht w",
      min: 0.2,
      max: 1.4,
      step: 0.1,
      initial: 0.8,
    },
    {
      kind: "slider",
      id: "schritte",
      label: "Zahl der Schritte",
      min: 1,
      max: 6,
      step: 1,
      initial: 6,
    },
  ],
  initialState: { folge: "konstant", gewicht: 0.8, schritte: 6 },
  update(state, action) {
    if (action.type === "reset") return { folge: "konstant", gewicht: 0.8, schritte: 6 };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated {
    const w = gewicht(state);
    const eingaben = folge(state);
    const n = schritte(state);
    const zustaende = verlauf(w, eingaben, n);
    const zustand = zustaende[zustaende.length - 1] ?? 0;
    const davor = zustaende[zustaende.length - 2] ?? 0;
    let summe = 0;
    for (let t = 0; t < n; t += 1) summe += eingaben[t] ?? 0;

    const saeulen: Bar[] = zustaende.map((wert, i) => ({
      label: `Schritt ${i + 1}`,
      value: wert,
      highlighted: i === zustaende.length - 1,
    }));

    const urteil =
      w > 1.0000001
        ? "Das Gewicht liegt über eins: der Zustand wächst mit jedem Schritt, die Erinnerung schaukelt sich auf."
        : w < 0.9999999
          ? "Das Gewicht liegt unter eins: alte Eingaben verlieren an Wirkung, der Zustand strebt einem Endwert zu."
          : "Das Gewicht ist genau eins: jeder Eingabewert bleibt mit voller Stärke im Zustand stehen.";

    return {
      values: [
        { label: "Zustand nach n Schritten", value: zustand, digits: 4 },
        { label: "Zustand einen Schritt davor", value: davor, digits: 4 },
        { label: "Summe der Eingaben", value: summe, digits: 4 },
        { label: "Gewicht w", value: w, digits: 2 },
        { label: "Zahl der Schritte", value: n, digits: 0 },
      ],
      drawing: {
        kind: "bars",
        items: saeulen,
        horizontal: true,
      },
      sentences: [
        `Der Zustand startet bei null und wird ${n} mal neu gerechnet.`,
        `Nach ${n} Schritten ist er ${format(zustand, 4)}; im Schritt davor war er ${format(davor, 4)}.`,
        `Die Summe der Eingaben bis dahin ist ${format(summe, 4)}.`,
        urteil,
      ],
    };
  },
  semanticEvents(before, after): SemanticEvent[] {
    const wVorher = gewicht(before);
    const wNachher = gewicht(after);
    const vorher = verlauf(wVorher, folge(before), schritte(before));
    const nachher = verlauf(wNachher, folge(after), schritte(after));
    const vorherigerWert = vorher[vorher.length - 1] ?? 0;
    const nachherigerWert = nachher[nachher.length - 1] ?? 0;
    const events: SemanticEvent[] = [];
    if (nachherigerWert > vorherigerWert + 1e-9) {
      events.push({ name: "zustandWaechst", severity: "info", value: nachherigerWert });
    } else if (nachherigerWert < vorherigerWert - 1e-9) {
      events.push({ name: "zustandKlingtAb", severity: "info", value: nachherigerWert });
    }
    if (wVorher < 1 && wNachher >= 1) {
      events.push({ name: "ohneObergrenze", severity: "notable" });
    }
    return events;
  },
};

registerRules([
  {
    name: "zustandWaechst",
    explain: (e) =>
      `Der Zustand am Ende ist größer geworden: ${formatValue(e.value ?? 0, 4)}. Bei jedem Schritt kommt etwas hinzu.`,
  },
  {
    name: "zustandKlingtAb",
    explain: (e) =>
      `Der Zustand am Ende ist kleiner geworden: ${formatValue(e.value ?? 0, 4)}. Die alten Eingaben verblassen.`,
  },
  {
    name: "ohneObergrenze",
    explain: () =>
      "Das Gewicht ist auf eins oder darüber gestiegen. Ohne neue Eingabe bleibt der Zustand stehen, mit neuer Eingabe wächst er bei jedem Schritt weiter - es gibt keine Obergrenze mehr.",
  },
]);
