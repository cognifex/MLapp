/**
 * Referenzwerte und Schema-Prüfung für die Lektionen 14 bis 17 (Regularisierung, Neuron, MLP,
 * Aktivierungen).
 *
 * Alle Zahlen in den Kommentaren sind von Hand nachgerechnet und mit python3 nachgeprüft; die
 * Rechenkerne der Experimente rechnen in derselben Reihenfolge, deshalb reicht eine Toleranz von
 * 1e-12. Ändert jemand einen Rechenkern, fällt es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkExperimentContract } from "../app/src/experiment/contract.js";
import { DATEN, regularisierung, ridge } from "../app/src/experiment/exp-regularisierung.js";
import { START, neuron } from "../app/src/experiment/exp-neuron.js";
import { B1, W1, mlp, vorwaerts } from "../app/src/experiment/exp-mlp.js";
import {
  aktivierungen,
  aktivierungAbleitung,
  gelu,
  relu,
  sigmoid,
  tanh,
} from "../app/src/experiment/exp-aktivierungen.js";
import { lek14 } from "../app/src/model/lessons/lek-14.js";
import { lek15 } from "../app/src/model/lessons/lek-15.js";
import { lek16 } from "../app/src/model/lessons/lek-16.js";
import { lek17 } from "../app/src/model/lessons/lek-17.js";
import type { DrawingSpec } from "../app/src/model/types.js";
import { validateLesson } from "../app/src/model/validate.js";

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

function fast(actual: number, expected: number, tolerance = 1e-12, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} erwartet ${expected}, erhalten ${actual}`,
  );
}

/** Zeichnung als Säulendiagramm – mit klarer Meldung, wenn das Experiment etwas anderes liefert. */
function saeulen(drawing: DrawingSpec): Extract<DrawingSpec, { kind: "bars" }> {
  if (drawing.kind !== "bars") throw new Error("Säulendiagramm erwartet");
  return drawing;
}

/** Zeichnung als Funktionsgraph. */
function graph(drawing: DrawingSpec): Extract<DrawingSpec, { kind: "function-plot" }> {
  if (drawing.kind !== "function-plot") throw new Error("Funktionsgraph erwartet");
  return drawing;
}

// ---------------------------------------------------------------- Regularisierung (LEK-14)

test("exp-regularisierung: ohne Strafe gilt die Lösung der kleinsten Quadrate", () => {
  const r = regularisierung.calculate({ lambda: 0, biasStrafe: false });
  // Handrechnung: die Eingaben haben den Mittelwert null, der Bias ist deshalb y-Mittel = 11,5/6.
  const b = 11.5 / 6;
  fast(wert(r, "b"), b, 1e-12, "Bias");
  fast(wert(r, "w₁"), 992 / 495, 1e-12, "w₁");
  fast(wert(r, "w₂"), 772 / 495, 1e-12, "w₂");
  fast(wert(r, "Fehler auf den Daten (MSE)"), 0.04202861952861953, 1e-12, "MSE");
  fast(wert(r, "Strafe"), 0, 1e-12, "ohne Strafe keine Strafe");
  fast(wert(r, "Gesamtverlust"), 0.04202861952861953, 1e-12, "Gesamtverlust");
  fast(wert(r, "Anteil der Strafe"), 0, 1e-12, "Anteil");
});

test("exp-regularisierung: λ = 0,5 und λ = 2 verkleinern die Gewichte", () => {
  const halb = regularisierung.calculate({ lambda: 0.5, biasStrafe: false });
  fast(wert(halb, "w₁"), 47 / 30, 1e-12, "w₁ bei λ = 0,5");
  fast(wert(halb, "w₂"), 37 / 30, 1e-12, "w₂ bei λ = 0,5");
  fast(wert(halb, "Fehler auf den Daten (MSE)"), 0.5858333333333333, 1e-12, "MSE bei λ = 0,5");
  fast(wert(halb, "Strafe"), 1.9877777777777779, 1e-12, "Strafe bei λ = 0,5");
  fast(wert(halb, "Gesamtverlust"), 2.573611111111111, 1e-12, "Gesamtverlust bei λ = 0,5");
  fast(wert(halb, "Anteil der Strafe"), 77.2369131138694, 1e-9, "Anteil bei λ = 0,5");

  const zwei = regularisierung.calculate({ lambda: 2, biasStrafe: false });
  fast(wert(zwei, "w₁"), 0.9474120082815735, 1e-12, "w₁ bei λ = 2");
  fast(wert(zwei, "w₂"), 0.7569358178053832, 1e-12, "w₂ bei λ = 2");
  fast(wert(zwei, "Fehler auf den Daten (MSE)"), 3.259277902087111, 1e-12, "MSE bei λ = 2");
  fast(wert(zwei, "Strafe"), 2.941082691425657, 1e-12, "Strafe bei λ = 2");
  fast(wert(zwei, "Gesamtverlust"), 6.200360593512768, 1e-12, "Gesamtverlust bei λ = 2");
});

test("exp-regularisierung: mehr Strafe, kleinere Gewichte, größerer Datenfehler", () => {
  const leiter = [0, 0.5, 1, 2, 5, 10];
  let letzteLaenge = Number.POSITIVE_INFINITY;
  let letzterFehler = -1;
  for (const lam of leiter) {
    const l = ridge(lam, false);
    const laenge = Math.hypot(l.w1, l.w2);
    assert.ok(laenge < letzteLaenge, `Gewichte sinken bei λ = ${lam}`);
    assert.ok(l.mse > letzterFehler, `Datenfehler steigt bei λ = ${lam}`);
    fast(l.strafe, lam * (l.w1 * l.w1 + l.w2 * l.w2), 1e-12, `Strafe bei λ = ${lam}`);
    fast(l.gesamt, l.mse + l.strafe, 1e-12, `Gesamtverlust bei λ = ${lam}`);
    letzteLaenge = laenge;
    letzterFehler = l.mse;
  }
  // Referenzwerte der Leiter: 2,0040 → 0,3050; Fehler 0,0420 → 8,4676.
  fast(ridge(10, false).w1, 0.30504184527454586, 1e-12, "w₁ bei λ = 10");
  fast(ridge(10, false).mse, 8.467551914356884, 1e-12, "MSE bei λ = 10");
});

test("exp-regularisierung: der Bias bleibt unberührt, solange die Eingaben Mittel null haben", () => {
  const summeX1 = DATEN.reduce((a, [x1]) => a + x1, 0);
  const summeX2 = DATEN.reduce((a, [, x2]) => a + x2, 0);
  fast(summeX1, 0, 1e-12, "Summe der ersten Eingabe");
  fast(summeX2, 0, 1e-12, "Summe der zweiten Eingabe");

  fast(ridge(0, false).b, 11.5 / 6, 1e-12, "Bias wie im y-Mittel");
  fast(ridge(10, false).b, 11.5 / 6, 1e-12, "Bias bleibt ohne Bias-Strafe");
  fast(ridge(1, true).b, 11.5 / 12, 1e-12, "mit Bias-Strafe: 11,5 durch 6 + 6");
  fast(ridge(2, true).b, 11.5 / 18, 1e-12, "mit Bias-Strafe bei λ = 2");
});

test("exp-regularisierung: die Zeichnung zeigt die Gewichte und den Wert ohne Strafe", () => {
  const drawing = saeulen(regularisierung.calculate({ lambda: 2, biasStrafe: false }).drawing);
  assert.equal(drawing.items.length, 3, "w₁, w₂ und Bias");
  const ohne = ridge(0, false);
  const jetzt = ridge(2, false);
  fast(drawing.items[0]?.value ?? Number.NaN, jetzt.w1, 1e-12, "w₁ mit Strafe");
  fast(drawing.items[0]?.ghost ?? Number.NaN, ohne.w1, 1e-12, "Umriss ohne Strafe");
  assert.ok(
    (drawing.items[0]?.value ?? 0) < (drawing.items[0]?.ghost ?? 0),
    "die Säule ist kürzer als der Umriss",
  );
  fast(drawing.items[2]?.value ?? Number.NaN, ohne.b, 1e-12, "Bias unverändert");
});

// ------------------------------------------------------------------------- Neuron (LEK-15)

test("exp-neuron: Standardfall mit ReLU", () => {
  const r = neuron.calculate({ ...START });
  fast(wert(r, "Beitrag w₁ · x₁"), 3, 1e-12, "2 · 1,5");
  fast(wert(r, "Beitrag w₂ · x₂"), -0.75, 1e-12, "-1,5 · 0,5");
  fast(wert(r, "Bias b"), 0.5, 1e-12, "Bias");
  fast(wert(r, "Gewichtete Summe z"), 2.75, 1e-12, "3 - 0,75 + 0,5");
  fast(wert(r, "Ausgabe a"), 2.75, 1e-12, "ReLU lässt positive Werte stehen");
  fast(wert(r, "Steigung der Aktivierung"), 1, 1e-12, "ReLU ist hier durchlässig");
});

test("exp-neuron: dieselbe Summe durch die anderen Aktivierungen", () => {
  const s = wert(neuron.calculate({ ...START, aktivierung: "sigmoid" }), "Ausgabe a");
  fast(s, 0.9399133498259924, 1e-12, "Sigmoid von 2,75");
  const t = wert(neuron.calculate({ ...START, aktivierung: "tanh" }), "Ausgabe a");
  fast(t, 0.9918597245682077, 1e-12, "Tanh von 2,75");
  const g = wert(neuron.calculate({ ...START, aktivierung: "gelu" }), "Ausgabe a");
  fast(g, 2.742276855926382, 1e-12, "GELU von 2,75");
});

test("exp-neuron: eine negative Summe wird von ReLU gesperrt", () => {
  // x1 = -1, x2 = 1: z = 2 · (-1) + (-1,5) · 1 + 0,5 = -2 - 1,5 + 0,5 = -3
  const r = neuron.calculate({ ...START, x1: -1, x2: 1 });
  fast(wert(r, "Gewichtete Summe z"), -3, 1e-12, "-2 - 1,5 + 0,5");
  fast(wert(r, "Ausgabe a"), 0, 1e-12, "ReLU sperrt");
  fast(wert(r, "Steigung der Aktivierung"), 0, 1e-12, "dort kommt kein Signal an");
});

test("exp-neuron: die Beiträge addieren sich genau zur gewichteten Summe", () => {
  const r = neuron.calculate({ x1: 0.7, x2: -1.3, w1: 1.4, w2: 2.2, b: -0.6, aktivierung: "tanh" });
  const drawing = saeulen(r.drawing);
  assert.equal(drawing.items.length, 4, "zwei Beiträge, Bias und Summe");
  const beitraege = drawing.items.slice(0, 3).reduce((a, i) => a + i.value, 0);
  fast(beitraege, drawing.items[3]?.value ?? Number.NaN, 1e-12, "Beiträge ergeben die Summe");
  fast(wert(r, "Gewichtete Summe z"), 1.4 * 0.7 + 2.2 * -1.3 - 0.6, 1e-12, "z");
});

// ---------------------------------------------------------------------------- MLP (LEK-16)

test("exp-mlp: Vorwärtslauf durch zwei versteckte Schichten", () => {
  const v = vorwaerts(1, 0.5);
  // Handrechnung mit den Gewichten aus dem Modul: die erste Einheit rechnet W₁ · x + b₁.
  const ersterWert = (W1[0]?.[0] ?? 0) * 1 + (W1[0]?.[1] ?? 0) * 0.5 + (B1[0] ?? 0);
  fast(ersterWert, 0.30000000000000004, 1e-12, "0,8 · 1 - 1,2 · 0,5 + 0,1");
  fast(v.z1[0] ?? Number.NaN, ersterWert, 1e-12, "Vorwärtslauf und Handrechnung stimmen überein");
  fast(v.z1[1] ?? Number.NaN, -0.8999999999999999, 1e-12, "-1,0 · 1 + 0,6 · 0,5 - 0,2");
  fast(v.z1[2] ?? Number.NaN, 0.35, 1e-12, "0,5 · 1 - 0,9 · 0,5 + 0,3");
  fast(v.a1[1] ?? Number.NaN, 0, 1e-12, "ReLU schneidet die negative Summe ab");
  fast(v.a1[0] ?? Number.NaN, 0.30000000000000004, 1e-12, "positive Summe bleibt");
  fast(v.z2[0] ?? Number.NaN, 0.5950000000000001, 1e-12, "1,0 · 0,3 - 0,5 · 0 + 0,7 · 0,35 + 0,05");
  fast(v.z2[1] ?? Number.NaN, -0.26, 1e-12, "-0,6 · 0,3 + 0,9 · 0 + 0,2 · 0,35 - 0,15");
  fast(v.a2[1] ?? Number.NaN, 0, 1e-12, "zweite Schicht schneidet ebenfalls ab");
  fast(v.y, 0.8545, 1e-12, "1,1 · 0,595 - 0,8 · 0 + 0,2");

  const r = mlp.calculate({ x1: 1, x2: 0.5, schicht: "versteckt1" });
  fast(wert(r, "Ausgabe y"), 0.8545, 1e-12, "Ausgabe der letzten Schicht");
  fast(wert(r, "Einheiten in der Schicht"), 3, 1e-12, "erste versteckte Schicht");
  fast(wert(r, "Summe der Beträge in der Schicht"), 0.30000000000000004 + 0.35, 1e-12, "Beträge");
  fast(wert(r, "Größte Aktivierung in der Schicht"), 0.35, 1e-12, "größte Aktivierung");
});

test("exp-mlp: der Umriss zeigt die gewichtete Summe vor der Aktivierung", () => {
  const r = mlp.calculate({ x1: 1, x2: 0.5, schicht: "versteckt1" });
  const drawing = saeulen(r.drawing);
  assert.equal(drawing.items.length, 3, "drei Einheiten");
  fast(drawing.items[1]?.value ?? Number.NaN, 0, 1e-12, "Aktivierung der zweiten Einheit");
  fast(
    drawing.items[1]?.ghost ?? Number.NaN,
    -0.8999999999999999,
    1e-12,
    "Summe davor ist negativ",
  );
});

test("exp-mlp: die Auswahl zeigt jede Schicht mit ihren Einheiten", () => {
  const erwartet: [string, number][] = [
    ["eingabe", 2],
    ["versteckt1", 3],
    ["versteckt2", 2],
    ["ausgabe", 1],
  ];
  for (const [schicht, anzahl] of erwartet) {
    const drawing = saeulen(mlp.calculate({ x1: 0.4, x2: -0.2, schicht }).drawing);
    assert.equal(drawing.items.length, anzahl, `Einheiten in ${schicht}`);
    const r = mlp.calculate({ x1: 0.4, x2: -0.2, schicht });
    fast(wert(r, "Einheiten in der Schicht"), anzahl, 1e-12, `Einheiten laut Zahlen in ${schicht}`);
  }
  const v = vorwaerts(0.4, -0.2);
  const out = saeulen(mlp.calculate({ x1: 0.4, x2: -0.2, schicht: "ausgabe" }).drawing);
  fast(out.items[0]?.value ?? Number.NaN, v.y, 1e-12, "Säule der Ausgabeschicht ist y");
});

// -------------------------------------------------------------------- Aktivierungen (LEK-17)

test("exp-aktivierungen: ReLU(-1) = 0, Sigmoid(0) = 0,5, Tanh(0) = 0, GELU(0) = 0", () => {
  assert.equal(relu(-1), 0);
  assert.equal(sigmoid(0), 0.5);
  assert.equal(tanh(0), 0);
  assert.equal(gelu(0), 0);
  // ReLU sperrt alle negativen Stellen, auch bei -12.
  assert.equal(relu(-12), 0);
  assert.equal(relu(0), 0);
});

test("exp-aktivierungen: Werte an der Stelle 1 und an der Stelle -2", () => {
  const eins = aktivierungen.calculate({ funktion: "relu", x: 1 });
  fast(wert(eins, "x"), 1, 1e-12, "x");
  fast(wert(eins, "ReLU(x)"), 1, 1e-12, "ReLU(1)");
  fast(wert(eins, "Sigmoid(x)"), 0.7310585786300049, 1e-12, "Sigmoid(1)");
  fast(wert(eins, "Tanh(x)"), 0.7615941559557649, 1e-12, "Tanh(1)");
  fast(wert(eins, "GELU(x)"), 0.8411919906082768, 1e-12, "GELU(1) näherungsweise");

  const minus = aktivierungen.calculate({ funktion: "tanh", x: -2 });
  fast(wert(minus, "ReLU(x)"), 0, 1e-12, "ReLU(-2)");
  fast(wert(minus, "Sigmoid(x)"), 0.11920292202211755, 1e-12, "Sigmoid(-2)");
  fast(wert(minus, "Tanh(x)"), -0.9640275800758169, 1e-12, "Tanh(-2)");
  fast(wert(minus, "GELU(x)"), -0.04540230591222494, 1e-12, "GELU(-2)");
});

test("exp-aktivierungen: Steigungen stimmen mit den Formeln überein", () => {
  fast(aktivierungAbleitung("relu", -1), 0, 1e-12, "ReLU links");
  fast(aktivierungAbleitung("relu", 2), 1, 1e-12, "ReLU rechts");
  fast(aktivierungAbleitung("sigmoid", 0), 0.25, 1e-12, "Sigmoid bei 0");
  fast(aktivierungAbleitung("tanh", 0), 1, 1e-12, "Tanh bei 0");
  fast(aktivierungAbleitung("gelu", 0), 0.5, 1e-12, "GELU bei 0");
  fast(aktivierungAbleitung("sigmoid", 1), 0.19661193324148185, 1e-12, "Sigmoid bei 1");
  fast(aktivierungAbleitung("tanh", 1), 0.41997434161402614, 1e-12, "Tanh bei 1");
  fast(aktivierungAbleitung("gelu", 1), 1.0829640838457826, 1e-12, "GELU bei 1");
  fast(aktivierungAbleitung("sigmoid", 2), 0.10499358540350662, 1e-12, "Sigmoid bei 2");
  fast(aktivierungAbleitung("tanh", 2), 0.07065082485316443, 1e-12, "Tanh bei 2 gesättigt");

  // Die Steigung, die das Experiment anzeigt, ist dieselbe wie hier gerechnet.
  const r = aktivierungen.calculate({ funktion: "gelu", x: 1 });
  fast(
    wert(r, "Steigung der gewählten Funktion"),
    1.0829640838457826,
    1e-12,
    "Steigung im Experiment",
  );
  // Rechts von null wächst ReLU mit der Steigung 1: von 1 auf 2 legt sie genau 1 zu.
  const reluEins = aktivierungen.calculate({ funktion: "relu", x: 1 });
  const reluZwei = aktivierungen.calculate({ funktion: "relu", x: 2 });
  fast(
    wert(reluZwei, "ReLU(x)") - wert(reluEins, "ReLU(x)"),
    1,
    1e-12,
    "ReLU wächst mit der Steigung 1",
  );
});

test("exp-aktivierungen: die Zeichnung zeigt alle vier Kurven und einen Punkt", () => {
  const drawing = graph(aktivierungen.calculate({ funktion: "sigmoid", x: 0.5 }).drawing);
  assert.equal(drawing.curves.length, 4, "ReLU, Sigmoid, Tanh und GELU");
  assert.equal(drawing.marks.length, 1, "ein Punkt an der Stelle x");
  const mark = drawing.marks[0];
  fast(mark?.x ?? Number.NaN, 0.5, 1e-12, "Punkt sitzt bei x");
  fast(mark?.y ?? Number.NaN, sigmoid(0.5), 1e-12, "Punkt sitzt auf der gewählten Kurve");
  // Die gewählte Kurve ist durchgezogen, die anderen sind gestrichelt.
  const durchgezogen = drawing.curves.filter((c) => c.dashed !== true);
  assert.equal(durchgezogen.length, 1, "genau eine durchgezogene Kurve");
  assert.equal(durchgezogen[0]?.label, "Sigmoid");
});

// ------------------------------------------------------------------- Schema der Lektionen

test("die vier Experimente erfüllen den Experiment-Vertrag", () => {
  for (const experiment of [regularisierung, neuron, mlp, aktivierungen]) {
    const issues = checkExperimentContract(experiment);
    assert.deepEqual(issues, [], `${experiment.id}: ${issues.map((i) => i.message).join("; ")}`);
  }
});

test("lek-14: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek14, "app/src/model/lessons/lek-14.ts", ["exp-regularisierung"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-15: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek15, "app/src/model/lessons/lek-15.ts", ["exp-neuron"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-16: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek16, "app/src/model/lessons/lek-16.ts", ["exp-mlp"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-17: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek17, "app/src/model/lessons/lek-17.ts", ["exp-aktivierungen"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("die vier Lektionen verweisen auf ihre Experimente", () => {
  const paare = [
    [lek14, regularisierung.id],
    [lek15, neuron.id],
    [lek16, mlp.id],
    [lek17, aktivierungen.id],
  ] as const;
  for (const [lektion, experimentId] of paare) {
    const abschnitt = lektion.sections.find((s) => s.kind === "experiment");
    assert.ok(abschnitt, `${lektion.id}: Experimentabschnitt fehlt`);
    assert.equal(abschnitt.experimentId, experimentId, `${lektion.id}: falscher Verweis`);
    assert.equal(abschnitt.visual.type, "experiment");
  }
  assert.equal(lek14.number, 14);
  assert.equal(lek14.chapterId, "kap-04");
  assert.equal(lek15.chapterId, "kap-05");
  assert.equal(lek16.number, 16);
  assert.equal(lek17.number, 17);
});
