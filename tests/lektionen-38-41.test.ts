/**
 * Referenzwerte und Schemaprüfung der Lektionen 38 bis 41 (Value Function, Q-Learning, Policy,
 * Policy Gradient).
 *
 * Alle Werte sind mit python3 nachgerechnet und hier festgenagelt: ändert jemand die Rechenkerne,
 * fällt es hier auf. Jede Lektion wird zusätzlich gegen das Schema geprüft, jedes Experiment
 * gegen den Vertrag (reine Rechnung, deterministisches Zurücksetzen).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkExperimentContract } from "../app/src/experiment/contract.js";
import {
  SCHRITTPREIS,
  ZEILEN,
  SPALTEN,
  START,
  istAbschluss,
  valueFunction,
  wert as feldWert,
  ziehe,
  type Feld,
} from "../app/src/experiment/exp-value-function.js";
import { qLearning, lernlauf, groessterQ } from "../app/src/experiment/exp-q-learning.js";
import {
  entropie,
  policy,
  qWerte,
  richtungsWahrscheinlichkeiten,
} from "../app/src/experiment/exp-policy.js";
import {
  EPISODE,
  LOGITS,
  policyGradient,
  returns,
  softmax,
  updateSchritt,
} from "../app/src/experiment/exp-policy-gradient.js";
import { lek38 } from "../app/src/model/lessons/lek-38.js";
import { lek39 } from "../app/src/model/lessons/lek-39.js";
import { lek40 } from "../app/src/model/lessons/lek-40.js";
import { lek41 } from "../app/src/model/lessons/lek-41.js";
import { validateLesson } from "../app/src/model/validate.js";

const EXPERIMENT_IDS = [
  "exp-value-function",
  "exp-q-learning",
  "exp-policy",
  "exp-policy-gradient",
];

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

function almost(actual: number, expected: number, tolerance = 1e-9, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} erwartet ${expected}, erhalten ${actual}`,
  );
}

function alleFelder(): Feld[] {
  const liste: Feld[] = [];
  for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
    for (let spalte = 0; spalte < SPALTEN; spalte += 1) liste.push({ zeile, spalte });
  }
  return liste;
}

/**
 * Unabhängiger Gegencheck zur geschlossenen Formel: Wertiteration nach der Bellman-Gleichung,
 * ohne jede Abstandsförmel. Sie muss dieselben Werte liefern.
 */
function wertIteration(gamma: number, runden: number): Map<string, number> {
  let v = new Map<string, number>();
  for (const feld of alleFelder()) v.set(`${feld.zeile}-${feld.spalte}`, 0);
  for (let runde = 0; runde < runden; runde += 1) {
    const neu = new Map<string, number>();
    for (const feld of alleFelder()) {
      const schluessel = `${feld.zeile}-${feld.spalte}`;
      if (istAbschluss(feld)) {
        neu.set(schluessel, feldWert(feld, gamma));
        continue;
      }
      let bester = Number.NEGATIVE_INFINITY;
      for (let richtung = 0; richtung < 4; richtung += 1) {
        const folge = ziehe(feld, richtung);
        const folgewert = v.get(`${folge.zeile}-${folge.spalte}`) ?? 0;
        bester = Math.max(bester, SCHRITTPREIS + gamma * folgewert);
      }
      neu.set(schluessel, bester);
    }
    v = neu;
  }
  return v;
}

test("LEK-38: Wert des Startfelds bei Diskontfaktor 0,9", () => {
  // Handrechnung: 0,9 hoch 4 = 0,6561; 0,04 · (1 + 0,9 + 0,81 + 0,729) = 0,13756;
  // 0,6561 - 0,13756 = 0,51854.
  almost(feldWert(START, 0.9), 0.51854, 1e-12);
  const result = valueFunction.calculate({ gamma: 0.9 });
  almost(wert(result, "Wert des Startfelds"), 0.51854, 1e-12);
  almost(wert(result, "Wert des Ziels"), 1, 1e-12);
  almost(wert(result, "Wert der Falle"), -1, 1e-12);
  almost(wert(result, "Schritte vom Start zum Ziel"), 4, 1e-12);
});

test("LEK-38: Wertkarte bei Diskontfaktor 0,9", () => {
  const erwartet = [
    [0.734, 0.86, 1],
    [0.6206, -1, 0.86],
    [0.51854, 0.6206, 0.734],
  ];
  for (let zeile = 0; zeile < ZEILEN; zeile += 1) {
    for (let spalte = 0; spalte < SPALTEN; spalte += 1) {
      almost(
        feldWert({ zeile, spalte }, 0.9),
        erwartet[zeile]?.[spalte] ?? Number.NaN,
        1e-12,
        `Feld ${zeile}-${spalte}`,
      );
    }
  }
});

test("LEK-38: kleine und große Diskontfaktoren", () => {
  // gamma 0: nur der nächste Schritt zählt, jedes Nicht-Abschlussfeld ist -0,04 wert.
  almost(feldWert(START, 0), -0.04, 1e-12);
  // gamma 0,5: 0,5 hoch 4 = 0,0625; 0,04 · (1 + 0,5 + 0,25 + 0,125) = 0,075;
  // 0,0625 - 0,075 = -0,0125.
  almost(feldWert(START, 0.5), -0.0125, 1e-12);
  // gamma 0,99: 0,99 hoch 4 = 0,96059601; 0,04 · 3,940399 = 0,15761596; Differenz 0,80298005.
  almost(feldWert(START, 0.99), 0.80298005, 1e-12);
});

test("LEK-38: geschlossene Formel stimmt mit der Wertiteration überein", () => {
  for (const gamma of [0, 0.5, 0.9, 0.99]) {
    const iteriert = wertIteration(gamma, 6000);
    for (const feld of alleFelder()) {
      almost(
        feldWert(feld, gamma),
        iteriert.get(`${feld.zeile}-${feld.spalte}`) ?? Number.NaN,
        1e-9,
        `gamma ${gamma}, Feld ${feld.zeile}-${feld.spalte}`,
      );
    }
  }
});

test("LEK-38: die Zeichnung ist eine Wertkarte mit Zahlen in den Zellen", () => {
  const result = valueFunction.calculate({ gamma: 0.9 });
  assert.equal(result.drawing.kind, "grid");
  if (result.drawing.kind !== "grid") return;
  assert.equal(result.drawing.style, "verlust");
  assert.equal(result.drawing.cells.length, ZEILEN * SPALTEN);
  const startzelle = result.drawing.cells.find(
    (c) => c.row === START.zeile && c.col === START.spalte,
  );
  assert.ok(startzelle, "Zelle des Startfelds fehlt");
  almost(startzelle.value, 0.51854, 1e-12);
  assert.equal(startzelle.label, "0,52");
});

test("LEK-39: nach vielen Schritten stehen die gelernten Q-Werte auf ihren Endwerten", () => {
  // 300 Schritte, Lernrate 0,5: die Werte der begangenen Wege sind die Werte aus der
  // Wertfunktion: Q(0-1, rechts) = 0,86, Q(0-0, rechts) = 0,734, Q(1-0, oben) = 0,6206,
  // Q(2-0, oben) = 0,51854, Q(2-1, oben) = -0,94 (Weg in die Falle).
  const q = lernlauf(0.5, 300);
  almost(q[1]?.[1] ?? Number.NaN, 0.86, 1e-9, "Aktion ins Ziel");
  almost(q[0]?.[1] ?? Number.NaN, 0.734, 1e-9, "Feld 0-0");
  almost(q[3]?.[0] ?? Number.NaN, 0.6206, 1e-9, "Feld 1-0");
  almost(q[6]?.[0] ?? Number.NaN, 0.51854, 1e-9, "Startfeld");
  almost(q[7]?.[0] ?? Number.NaN, -0.94, 1e-9, "Weg in die Falle");
  almost(q[6]?.[1] ?? Number.NaN, -0.04, 1e-9, "Aktion ohne gelernten Folgewert");
  almost(groessterQ(q), 0.86, 1e-9);
});

test("LEK-39: nach 30 Schritten mit Lernrate 0,5", () => {
  // 0,86 · (1 - 0,5 hoch 5) = 0,833125 und -0,94 · (1 - 0,5 hoch 5) = -0,910625.
  const q = lernlauf(0.5, 30);
  almost(q[1]?.[1] ?? Number.NaN, 0.833125, 1e-12, "Aktion ins Ziel");
  almost(q[7]?.[0] ?? Number.NaN, -0.910625, 1e-12, "Weg in die Falle");
  almost(groessterQ(q), 0.833125, 1e-12);

  const result = qLearning.calculate({ alpha: 0.5, schritte: 30, feld: "0-1" });
  almost(wert(result, "Größter Q-Wert"), 0.833125, 1e-12);
  almost(wert(result, "Bester Q-Wert im gewählten Feld"), 0.833125, 1e-12);
  almost(wert(result, "Bester Q-Wert im Startfeld"), 0.04088875, 1e-12);
  assert.equal(result.drawing.kind, "bars");
  if (result.drawing.kind !== "bars") return;
  assert.equal(result.drawing.items.length, 4, "vier Aktionen");
  const hervorgehoben = result.drawing.items.filter((item) => item.highlighted);
  assert.equal(hervorgehoben.length, 1, "genau eine Aktion ist hervorgehoben");
  assert.equal(hervorgehoben[0]?.label, "rechts");
  almost(hervorgehoben[0]?.value ?? Number.NaN, 0.833125, 1e-12);
});

test("LEK-39: ohne Schritte bleibt alles bei null", () => {
  const q = lernlauf(0.5, 0);
  assert.equal(groessterQ(q), 0);
  const result = qLearning.calculate({ alpha: 0.5, schritte: 0, feld: "0-1" });
  assert.equal(wert(result, "Größter Q-Wert"), 0);
});

test("LEK-40: Q-Werte und Softmax des Feldes links neben dem Ziel", () => {
  const q = qWerte({ zeile: 0, spalte: 1 }, 0.9);
  assert.ok(q, "das Feld muss vier Q-Werte haben");
  if (!q) return;
  almost(q[0] ?? Number.NaN, 0.734, 1e-12, "oben");
  almost(q[1] ?? Number.NaN, 0.86, 1e-12, "rechts");
  almost(q[2] ?? Number.NaN, -0.94, 1e-12, "unten");
  almost(q[3] ?? Number.NaN, 0.6206, 1e-12, "links");

  // Nachgerechnet mit Temperatur 0,25: Zählwerte 0,6041 | 1 | 0,0007 | 0,3838, Summe 1,9887.
  const p = richtungsWahrscheinlichkeiten(q, 0.25);
  almost(p[0] ?? Number.NaN, 0.303775748, 1e-9, "oben");
  almost(p[1] ?? Number.NaN, 0.502848915, 1e-9, "rechts");
  almost(p[2] ?? Number.NaN, 0.00037542, 1e-9, "unten");
  almost(p[3] ?? Number.NaN, 0.192999917, 1e-9, "links");
  almost(
    p.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    "die Summe ist eins",
  );
  almost(entropie(p), 1.0280882413782002, 1e-9);
});

test("LEK-40: die Temperatur steuert die Schärfe", () => {
  const q = qWerte({ zeile: 0, spalte: 1 }, 0.9) ?? [];
  const kalt = richtungsWahrscheinlichkeiten(q, 0.05);
  const heiss = richtungsWahrscheinlichkeiten(q, 2);
  almost(kalt[1] ?? Number.NaN, 0.9184518490880293, 1e-9, "kalte Wahl");
  almost(heiss[1] ?? Number.NaN, 0.3093389727078409, 1e-9, "heiße Wahl");
  assert.ok(
    (kalt[1] ?? 0) > (heiss[1] ?? 0),
    "kleinere Temperatur ergibt die schärfere Verteilung",
  );
  // Der Gleichverteilungswert ist ein Viertel; die Entropie kann höchstens log 4 werden.
  almost(1 / 4, 0.25, 1e-12);
  almost(Math.log(4), 1.3862943611198906, 1e-12);
});

test("LEK-40: Zahlen und Verteilung des gewählten Feldes", () => {
  // Gleiche Rechnung wie oben, jetzt über die Werte der Experimentausgabe.
  const result = policy.calculate({ temperatur: 0.25, feld: "0-1" });
  almost(wert(result, "Wahrscheinlichkeit der besten Richtung"), 0.5028489153758469, 1e-9);
  almost(wert(result, "Entropie der Verteilung"), 1.0280882413782002, 1e-9);
  almost(wert(result, "Höchstwert der Entropie"), 1.3862943611198906, 1e-12);
  almost(wert(result, "Wahrscheinlichkeit ohne Vorliebe"), 0.25, 1e-12);
});

test("LEK-40: bevorzugte Richtung je Feld", () => {
  const erwartet: Record<string, string> = {
    "0-0": "rechts",
    "0-1": "rechts",
    "1-0": "oben",
    "1-2": "oben",
    "2-1": "rechts",
    "2-2": "oben",
  };
  for (const [schluessel, richtung] of Object.entries(erwartet)) {
    const [zeile, spalte] = schluessel.split("-").map(Number);
    const q = qWerte({ zeile: zeile ?? 0, spalte: spalte ?? 0 }, 0.9);
    assert.ok(q, `Feld ${schluessel} braucht Q-Werte`);
    if (!q) continue;
    const p = richtungsWahrscheinlichkeiten(q, 0.25);
    const beste = p.indexOf(Math.max(...p));
    assert.equal(["oben", "rechts", "unten", "links"][beste], richtung, `Feld ${schluessel}`);
  }

  const result = policy.calculate({ temperatur: 0.25, feld: "0-1" });
  if (result.drawing.kind !== "grid") throw new Error("Zeichnung muss ein Raster sein");
  const zelle = (zeile: number, spalte: number) =>
    result.drawing.kind === "grid"
      ? result.drawing.cells.find((c) => c.row === zeile && c.col === spalte)
      : undefined;
  assert.equal(zelle(0, 1)?.label, "rechts");
  assert.equal(zelle(2, 1)?.label, "rechts");
  assert.equal(zelle(1, 1)?.label, "Falle");
  assert.equal(zelle(0, 2)?.label, "Ziel");
  assert.equal(result.drawing.style, "anteil");
});

test("LEK-41: Returns der festen Episode", () => {
  // gamma 0,9: G(3) = -0,04 + 0,9 · 1 = 0,86; G(2) = -0,04 + 0,9 · 0,86 = 0,734;
  // G(1) = -0,04 + 0,9 · 0,734 = 0,6206.
  const g = returns(0.9);
  almost(g[0] ?? Number.NaN, 0.6206, 1e-12, "erster Schritt");
  almost(g[1] ?? Number.NaN, 0.734, 1e-12, "zweiter Schritt");
  almost(g[2] ?? Number.NaN, 0.86, 1e-12, "dritter Schritt");
  // Die Returns sind genau die Werte der Felder aus der Wertfunktion (Lektion 38).
  almost(g[0] ?? Number.NaN, feldWert(EPISODE.zustaende[0] ?? START, 0.9), 1e-12);
  almost(g[1] ?? Number.NaN, feldWert(EPISODE.zustaende[1] ?? START, 0.9), 1e-12);
  almost(g[2] ?? Number.NaN, feldWert(EPISODE.zustaende[2] ?? START, 0.9), 1e-12);

  const ohne = returns(0);
  almost(ohne[2] ?? Number.NaN, -0.04, 1e-12, "ohne Abzinsung bleibt nur der Schrittpreis");
  const halb = returns(0.5);
  almost(halb[0] ?? Number.NaN, 0.055, 1e-12);
  almost(halb[1] ?? Number.NaN, 0.19, 1e-12);
  almost(halb[2] ?? Number.NaN, 0.46, 1e-12);
});

test("LEK-41: Startpolitik und Update des ersten Schrittes", () => {
  const p0 = softmax(LOGITS);
  almost(p0[0] ?? Number.NaN, 0.3158480252447948, 1e-12, "oben");
  almost(p0[1] ?? Number.NaN, 0.23398597206768315, 1e-12, "rechts");
  almost(p0[2] ?? Number.NaN, 0.19157151112065787, 1e-12, "unten");
  almost(p0[3] ?? Number.NaN, 0.2585944915668642, 1e-12, "links");

  // Lernrate 0,5: Logit(rechts) wächst um 0,5 · 0,6206 · (1 - 0,2340) = 0,2377.
  const mitte = updateSchritt(0, 0.5, 0.9);
  assert.equal(mitte.aktion, 1, "der erste Schritt geht nach rechts");
  almost(mitte.returnDesSchritts, 0.6206, 1e-12);
  almost(mitte.nachher[1] ?? Number.NaN, 0.2960880748905547, 1e-9);
  almost(
    (mitte.nachher[1] ?? 0) - (mitte.vorher[1] ?? 0),
    0.06210210282287157,
    1e-9,
    "Änderung der Wahrscheinlichkeit",
  );

  const klein = updateSchritt(0, 0.2, 0.9);
  almost(klein.nachher[1] ?? Number.NaN, 0.2577044739842021, 1e-9, "kleinere Lernrate");
  assert.ok(
    (klein.nachher[1] ?? 0) < (mitte.nachher[1] ?? 0),
    "größere Lernrate ergibt den größeren Schritt",
  );

  const dritter = updateSchritt(2, 0.5, 0.9);
  almost(dritter.returnDesSchritts, 0.86, 1e-12);
  almost(dritter.nachher[0] ?? Number.NaN, 0.4062971506541981, 1e-9);
  almost(
    (dritter.nachher[0] ?? 0) - (dritter.vorher[0] ?? 0),
    0.09044912540940331,
    1e-9,
    "Änderung im dritten Schritt",
  );
  assert.ok(
    (dritter.nachher[0] ?? 0) - (dritter.vorher[0] ?? 0) >
      (mitte.nachher[1] ?? 0) - (mitte.vorher[1] ?? 0),
    "größerer Return ergibt den größeren Schritt",
  );

  const result = policyGradient.calculate({ lernrate: 0.5, diskontfaktor: 0.9, schritt: "1" });
  almost(wert(result, "Return des Schritts"), 0.6206, 1e-12);
  almost(wert(result, "Wahrscheinlichkeit vorher"), 0.23398597206768315, 1e-12);
  almost(wert(result, "Wahrscheinlichkeit nachher"), 0.2960880748905547, 1e-9);
  almost(wert(result, "Änderung der Wahrscheinlichkeit"), 0.06210210282287157, 1e-9);
  assert.equal(result.drawing.kind, "bars");
  if (result.drawing.kind !== "bars") return;
  assert.equal(result.drawing.items.length, 4);
  const rechts = result.drawing.items.find((item) => item.label === "rechts");
  assert.ok(rechts, "Säule der Aktion rechts fehlt");
  almost(rechts.value, 0.2960880748905547, 1e-9, "gefüllte Säule ist der Zustand danach");
  almost(rechts.ghost ?? Number.NaN, 0.23398597206768315, 1e-12, "Umriss ist der Zustand davor");
  assert.equal(rechts.highlighted, true);
});

test("LEK-41: ohne Abzinsung sinkt die Wahrscheinlichkeit der gegangenen Aktion", () => {
  const ohne = updateSchritt(0, 0.5, 0);
  assert.ok(
    (ohne.nachher[1] ?? 0) < (ohne.vorher[1] ?? 0),
    "der Return ist negativ, also fällt die Wahrscheinlichkeit",
  );
});

test("die vier Experimente erfüllen den Vertrag", () => {
  for (const experiment of [valueFunction, qLearning, policy, policyGradient]) {
    const issues = checkExperimentContract(experiment);
    assert.deepEqual(issues, [], `${experiment.id}: ${issues.map((i) => i.message).join("; ")}`);
  }
});

test("lek-38: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek38, "app/src/model/lessons/lek-38.ts", EXPERIMENT_IDS);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-39: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek39, "app/src/model/lessons/lek-39.ts", EXPERIMENT_IDS);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-40: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek40, "app/src/model/lessons/lek-40.ts", EXPERIMENT_IDS);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-41: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek41, "app/src/model/lessons/lek-41.ts", EXPERIMENT_IDS);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});
