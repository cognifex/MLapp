/**
 * Referenzwerte und Schema-Prüfung der Lektionen 10 bis 13.
 *
 * Alle Zahlen sind von Hand mit `python3` nachgerechnet (siehe die Kommentare an den Stellen).
 * Die Rechenkerne der Experimente benutzen ausschließlich IEEE-754-Operationen in einer festen
 * Reihenfolge, deshalb sind die Werte bis auf die letzten Stellen reproduzierbar; hochgradige
 * Polynome (Grad 8 und 9) sind schlecht konditioniert und werden mit gröberer Toleranz geprüft.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LERNGRENZE,
  MINIMUM,
  bisZurRuhe,
  gradient,
  gradientDescent,
  pfad,
  verlust,
} from "../app/src/experiment/exp-gradient-descent.js";
import { PUNKTE, auswertung, klassifikation } from "../app/src/experiment/exp-klassifikation.js";
import {
  logistischeRegression,
  sigmoid,
} from "../app/src/experiment/exp-logistische-regression.js";
import {
  TEST_X,
  TRAIN_X,
  besterGrad,
  koeffizienten,
  mittlererFehler,
  overfitting,
  testwerte,
  trainingswerte,
} from "../app/src/experiment/exp-overfitting.js";
import { validateLesson } from "../app/src/model/validate.js";
import type { Lesson } from "../app/src/model/types.js";
import { lek10 } from "../app/src/model/lessons/lek-10.js";
import { lek11 } from "../app/src/model/lessons/lek-11.js";
import { lek12 } from "../app/src/model/lessons/lek-12.js";
import { lek13 } from "../app/src/model/lessons/lek-13.js";

const START = { x: -1.5, y: -1.2 };

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

/* ------------------------------------------------------------------ LEK-10 Gradient Descent */

test("Abstieg: Verlustfläche, erster Schritt und Startpunkt", () => {
  // L(w, b) = (w - 0,8)² + 1,6 · (b + 0,6)² an der Stelle (-1,5 | -1,2): 5,29 + 1,6 · 0,36 = 5,866
  almost(verlust(START), 5.866, 1e-12, "Startverlust");
  almost(verlust(MINIMUM), 0, 1e-12, "im Tiefpunkt ist der Verlust null");

  // ∂L/∂w = 2 · (-1,5 - 0,8) = -4,6 und ∂L/∂b = 3,2 · (-1,2 + 0,6) = -1,92
  const g = gradient(START);
  almost(g.x, -4.6, 1e-9, "Ableitung nach w");
  almost(g.y, -1.92, 1e-9, "Ableitung nach b");

  // Ein Schritt mit Lernrate 0,2: -1,5 + 0,92 = -0,58 und -1,2 + 0,384 = -0,816
  const erster = pfad(START, 0.2, 1)[1]!;
  almost(erster.x, -0.58, 1e-9, "w nach einem Schritt");
  almost(erster.y, -0.816, 1e-9, "b nach einem Schritt");

  // Stabilitätsgrenze dieser Fläche: 2 / 3,2 = 0,625
  almost(LERNGRENZE, 0.625, 1e-12, "Stabilitätsgrenze");
});

test("Abstieg: Verlust nach sechs Schritten und Schritte bis zur Ruhe", () => {
  const r = gradientDescent.calculate({ start: START, lernrate: 0.2, schritte: 6 });
  almost(wert(r, "Startverlust"), 5.866, 1e-12, "Startverlust");
  almost(
    wert(r, "Verlust nach n Schritten"),
    0.01151790786509087,
    1e-9,
    "Verlust nach sechs Schritten",
  );
  almost(wert(r, "Länge des Gradienten am Ende"), 0.21465829077565482, 1e-9);
  almost(wert(r, "Abstand zum Minimum"), 0.10731674787619028, 1e-9);
  assert.equal(wert(r, "Schritte bis zur Ruhe"), 13, "dreizehn Schritte bis zur Ruhe");
});

test("Abstieg: die Zeichnung ist der gerechnete Pfad", () => {
  const r = gradientDescent.calculate({ start: START, lernrate: 0.2, schritte: 6 });
  assert.equal(r.drawing.kind, "grid");
  if (r.drawing.kind !== "grid") return;
  assert.equal(r.drawing.cells.length, 21 * 21, "21 mal 21 Zellen");
  assert.equal(r.drawing.style, "verlust");
  assert.equal(r.drawing.points?.length, 7, "Startpunkt plus sechs Schritte");
  assert.equal(r.drawing.vectors?.length, 6, "ein Pfeil je Schritt");

  const erster = r.drawing.points?.[0];
  assert.ok(erster, "Startpunkt fehlt");
  assert.equal(erster.x, START.x);
  assert.equal(erster.y, START.y);
  const letzter = r.drawing.points?.[6];
  assert.ok(letzter, "letzter Punkt fehlt");
  almost(letzter.x, 0.6926912000000001, 1e-9, "w nach sechs Schritten");
  almost(letzter.y, -0.6013060694015999, 1e-9, "b nach sechs Schritten");

  // Der letzte gezeichnete Punkt ist derselbe wie der letzte gerechnete.
  const punkte = pfad(START, 0.2, 6);
  assert.equal(punkte.length, 7);
  almost(verlust(punkte[6]!), 0.01151790786509087, 1e-9, "Verlust am letzten Punkt");
});

test("Abstieg: kleine Lernrate braucht länger, große schaukelt sich auf", () => {
  // Ruheschwelle: Gradientenlänge unter 0,01
  assert.deepEqual(bisZurRuhe(START, 0.05), { schritte: 59, ruhig: true });
  assert.deepEqual(bisZurRuhe(START, 0.2), { schritte: 13, ruhig: true });
  assert.deepEqual(bisZurRuhe(START, 0.6), { schritte: 64, ruhig: true });
  assert.deepEqual(bisZurRuhe(START, 1), { schritte: 200, ruhig: false }, "keine Ruhe");

  const zuGross = gradientDescent.calculate({ start: START, lernrate: 1, schritte: 6 });
  almost(
    wert(zuGross, "Verlust nach n Schritten"),
    7409.771515484352,
    1e-6,
    "der Verlust wächst mit jedem Schritt",
  );
  assert.ok(
    wert(zuGross, "Verlust nach n Schritten") > wert(zuGross, "Startverlust"),
    "bei zu großer Lernrate steigt der Verlust",
  );
  assert.equal(wert(zuGross, "Schritte bis zur Ruhe"), 200, "ohne Ruhe: Horizont");

  const zuKlein = gradientDescent.calculate({ start: START, lernrate: 0.05, schritte: 6 });
  const passend = gradientDescent.calculate({ start: START, lernrate: 0.2, schritte: 6 });
  almost(wert(zuKlein, "Verlust nach n Schritten"), 1.5651365848264405, 1e-9);
  assert.ok(
    wert(zuKlein, "Verlust nach n Schritten") > wert(passend, "Verlust nach n Schritten"),
    "mit kleiner Lernrate kommt der Abstieg langsamer voran",
  );
});

/* ------------------------------------------------------------------ LEK-11 Klassifikation */

test("Klassifikation: Genauigkeit und kleinster Abstand", () => {
  // Punktwolke: je neun Punkte der Klasse A und B, festes Muster statt Zufall
  const schwach = klassifikation.calculate({ steigung: 0.5, achsenabschnitt: 0 });
  assert.equal(wert(schwach, "Richtig klassifiziert"), 16);
  assert.equal(wert(schwach, "Falsch klassifiziert"), 2);
  almost(wert(schwach, "Genauigkeit"), 0.8888888888888888, 1e-12, "16 von 18");
  almost(
    wert(schwach, "Kleinster Abstand zur Grenze"),
    0.008944271909999166,
    1e-9,
    "sehr knappe Trennung",
  );

  const gut = klassifikation.calculate({ steigung: 0.8, achsenabschnitt: 0 });
  assert.equal(wert(gut, "Richtig klassifiziert"), 18);
  assert.equal(wert(gut, "Falsch klassifiziert"), 0);
  almost(wert(gut, "Genauigkeit"), 1, 1e-12);
  almost(wert(gut, "Kleinster Abstand zur Grenze"), 0.19521720236075762, 1e-9);

  const knapp = klassifikation.calculate({ steigung: 0.8, achsenabschnitt: 0.2 });
  assert.equal(wert(knapp, "Richtig klassifiziert"), 18);
  almost(wert(knapp, "Kleinster Abstand zur Grenze"), 0.03904344047215155, 1e-9);

  const schief = klassifikation.calculate({ steigung: 1, achsenabschnitt: 0 });
  assert.equal(wert(schief, "Richtig klassifiziert"), 17);
  almost(wert(schief, "Genauigkeit"), 17 / 18, 1e-12);
});

test("Klassifikation: Punktwolke, Grenze und Zeichnung", () => {
  assert.equal(PUNKTE.length, 18);
  assert.equal(PUNKTE.filter((p) => p.klasse === "A").length, 9);
  assert.equal(PUNKTE.filter((p) => p.klasse === "B").length, 9);

  // Die Muster liegen so, dass y = 0,8 x die Gruppen wirklich trennt.
  for (const punkt of PUNKTE) {
    const oberhalb = punkt.y > 0.8 * punkt.x;
    assert.equal(oberhalb, punkt.klasse === "A", `Punkt ${punkt.klasse}${punkt.nummer}`);
  }

  const r = klassifikation.calculate({ steigung: 0.8, achsenabschnitt: 0 });
  assert.equal(r.drawing.kind, "scatter");
  if (r.drawing.kind !== "scatter") return;
  assert.equal(r.drawing.points.length, 18, "je ein Punkt pro Datensatz");
  assert.equal(r.drawing.lines.length, 1, "genau eine Entscheidungsgrenze");
  const grenze = r.drawing.lines[0]!;
  assert.equal(grenze.points.length, 2);
  almost(grenze.points[0]![1], 0.8 * -3, 1e-9, "linker Rand der Grenze");
  almost(grenze.points[1]![1], 0.8 * 3, 1e-9, "rechter Rand der Grenze");

  const gerechnet = auswertung(0.8, 0);
  assert.equal(gerechnet.richtig, 18);
  assert.equal(gerechnet.genauigkeit, 1);
});

/* ------------------------------------------------------ LEK-12 Logistische Regression */

test("Logistische Regression: Sigmoid an ausgezeichneten Stellen", () => {
  almost(sigmoid(0), 0.5, 1e-15, "die Mitte ist ein halb");
  almost(sigmoid(1), 0.7310585786300049, 1e-12);
  almost(sigmoid(2), 0.8807970779778823, 1e-12);
  almost(sigmoid(-2), 0.11920292202211755, 1e-12);
  assert.ok(sigmoid(40) > 0.9999, "große Werte gehen gegen eins");
  assert.ok(sigmoid(-40) < 0.0001, "kleine Werte gehen gegen null");
});

test("Logistische Regression: gewichtete Summe, Wahrscheinlichkeit und Grenze", () => {
  const r = logistischeRegression.calculate({
    gewicht: 1.5,
    achsenabschnitt: -0.5,
    x: 1.2,
    schwelle: 0.5,
  });
  // z = 1,5 · 1,2 - 0,5 = 1,3 und p = 1 / (1 + e^-1,3) = 0,78583498...
  almost(wert(r, "z: gewichtete Summe"), 1.2999999999999998, 1e-12);
  almost(wert(r, "Wahrscheinlichkeit p"), 0.7858349830425586, 1e-12);
  // Steigung: w · p · (1 - p) = 1,5 · 0,7858 · 0,2142 = 0,2524475...
  almost(wert(r, "Steigung von p bei x"), 0.25244754370359035, 1e-12);
  // Schwelle 0,5 heißt z = 0, also x = (0 - b) / w = 0,5 / 1,5 = 0,333...
  almost(wert(r, "Grenze bei x"), 0.3333333333333333, 1e-12);
  almost(wert(r, "Schwelle"), 0.5, 1e-12);

  assert.equal(r.drawing.kind, "function-plot");
  if (r.drawing.kind !== "function-plot") return;
  assert.equal(r.drawing.curves.length, 3, "Sigmoidkurve, Schwelle, Grenze");
  assert.equal(r.drawing.marks.length, 2, "eingestellte Stelle und Grenze");
  assert.equal(r.drawing.curves[0]!.points.length, 241);
});

test("Logistische Regression: höhere Schwelle verschiebt die Grenze nach außen", () => {
  const r = logistischeRegression.calculate({
    gewicht: 1.5,
    achsenabschnitt: -0.5,
    x: 1.2,
    schwelle: 0.9,
  });
  almost(wert(r, "Wahrscheinlichkeit p"), 0.7858349830425586, 1e-12, "p bleibt gleich");
  // (ln(0,9 / 0,1) - (-0,5)) / 1,5 = 1,7981497182241464
  almost(wert(r, "Grenze bei x"), 1.7981497182241464, 1e-9);
  const beiHalber = logistischeRegression.calculate({
    gewicht: 1.5,
    achsenabschnitt: -0.5,
    x: 1.2,
    schwelle: 0.5,
  });
  assert.ok(
    wert(r, "Grenze bei x") > wert(beiHalber, "Grenze bei x"),
    "eine höhere Schwelle liegt weiter außen",
  );
});

test("Logistische Regression: ohne Gewicht gibt es keine Grenze", () => {
  const r = logistischeRegression.calculate({
    gewicht: 0,
    achsenabschnitt: 0.4,
    x: 1.2,
    schwelle: 0.5,
  });
  assert.equal(
    r.values.some((v) => v.label === "Grenze bei x"),
    false,
    "ohne Gewicht gibt es keine Stelle, an der die Entscheidung kippt",
  );
  almost(wert(r, "Wahrscheinlichkeit p"), sigmoid(0.4), 1e-12);
  almost(wert(r, "Steigung von p bei x"), 0, 1e-12, "die Kurve ist waagerecht");
  assert.equal(r.drawing.kind, "function-plot");
  if (r.drawing.kind !== "function-plot") return;
  assert.equal(r.drawing.curves.length, 2, "Sigmoidkurve und Schwelle");
  assert.equal(r.drawing.marks.length, 1);
});

/* -------------------------------------------------------------- LEK-13 Overfitting */

test("Overfitting: Trainings- und Testfehler über dem Polynomgrad", () => {
  const grad1 = overfitting.calculate({ grad: 1, rauschen: 0.6 });
  almost(wert(grad1, "Trainingsfehler (MSE)"), 0.20234809316511712, 1e-9);
  almost(wert(grad1, "Testfehler (MSE)"), 0.10104339440144522, 1e-9);

  const grad3 = overfitting.calculate({ grad: 3, rauschen: 0.6 });
  almost(wert(grad3, "Trainingsfehler (MSE)"), 0.0651689518255065, 1e-9);
  almost(wert(grad3, "Testfehler (MSE)"), 0.006378431898720808, 1e-9);
  almost(wert(grad3, "Geringster Testfehler"), 0.006378431898720808, 1e-9);
  assert.equal(wert(grad3, "Grad mit dem geringsten Testfehler"), 3);
  assert.equal(wert(grad3, "Polynomgrad"), 3);

  // Grad 9: schlecht konditioniert, deshalb gröbere Toleranz (der Wert ist 0,35963374811606574).
  const grad9 = overfitting.calculate({ grad: 9, rauschen: 0.6 });
  almost(wert(grad9, "Trainingsfehler (MSE)"), 0.009386898860710422, 1e-3);
  almost(wert(grad9, "Testfehler (MSE)"), 0.35963374811606574, 1e-3);
  assert.ok(
    wert(grad9, "Testfehler (MSE)") > 20 * wert(grad9, "Trainingsfehler (MSE)"),
    "bei Grad 9 liegt der Testfehler weit über dem Trainingsfehler",
  );
});

test("Overfitting: mehr Komplexität senkt das Training und hebt den Test", () => {
  const ysTest = testwerte();
  const testFehler = (grad: number): number =>
    mittlererFehler(koeffizienten(grad, 0.6), TEST_X, ysTest);
  const trainFehler = (grad: number): number =>
    mittlererFehler(koeffizienten(grad, 0.6), TRAIN_X, trainingswerte(0.6));

  assert.equal(TRAIN_X.length, 11, "elf Trainingspunkte");
  assert.equal(TEST_X.length, 21, "einundzwanzig Testpunkte");
  assert.equal(trainingswerte(0.6).length, 11);
  assert.equal(ysTest.length, 21);

  assert.ok(trainFehler(9) < trainFehler(3), "der Trainingsfehler sinkt weiter");
  assert.ok(trainFehler(3) < trainFehler(1), "auch von Grad 1 auf 3 sinkt er");
  assert.ok(testFehler(9) > testFehler(3), "der Testfehler steigt wieder");
  assert.ok(testFehler(9) > 20 * testFehler(3), "deutliches Anzeichen für Overfitting");

  const beste = besterGrad(0.6);
  assert.equal(beste.grad, 3);
  almost(beste.fehler, 0.006378431898720808, 1e-9);
  // Dieselbe Stelle liefert die Anzeige des Experiments.
  assert.equal(
    wert(overfitting.calculate({ grad: 9, rauschen: 0.6 }), "Grad mit dem geringsten Testfehler"),
    3,
  );
});

test("Overfitting: ohne Störung passt auch ein hoher Grad", () => {
  const ohneStoerung = overfitting.calculate({ grad: 9, rauschen: 0 });
  // Trainingsfehler 3,2e-14, Testfehler 3,8e-13: die reine Sinusfunktion wird fast getroffen.
  assert.ok(
    wert(ohneStoerung, "Testfehler (MSE)") < 1e-9,
    "ohne Störung bleibt der Testfehler winzig",
  );
  const mitStoerung = overfitting.calculate({ grad: 9, rauschen: 0.8 });
  assert.ok(
    wert(mitStoerung, "Testfehler (MSE)") > 0.5,
    "mit starker Störung wächst der Testfehler auf über 0,5 (gemessen: 0,6393)",
  );
  assert.ok(
    wert(mitStoerung, "Testfehler (MSE)") > 20 * wert(mitStoerung, "Trainingsfehler (MSE)"),
    "Overfitting wird mit der Störung deutlicher",
  );
});

test("Overfitting: Zeichnung enthält Modell, wahre Funktion und alle Punkte", () => {
  const r = overfitting.calculate({ grad: 3, rauschen: 0.6 });
  assert.equal(r.drawing.kind, "function-plot");
  if (r.drawing.kind !== "function-plot") return;
  assert.equal(r.drawing.curves.length, 2, "Modell und wahre Funktion");
  assert.equal(r.drawing.curves[0]!.points.length, 201);
  assert.equal(r.drawing.curves[1]!.dashed, true, "die wahre Funktion ist gestrichelt");
  assert.equal(r.drawing.marks.length, 11 + 21, "elf Trainings- und einundzwanzig Testpunkte");
  assert.equal(r.drawing.xRange[0], -2.5);
  assert.equal(r.drawing.xRange[1], 2.5);
});

/* ------------------------------------------------------------------ Schema der Lektionen */

test("lek-10: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek10, "app/src/model/lessons/lek-10.ts", ["exp-gradient-descent"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-11: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek11, "app/src/model/lessons/lek-11.ts", ["exp-klassifikation"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-12: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek12, "app/src/model/lessons/lek-12.ts", [
    "exp-logistische-regression",
  ]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-13: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek13, "app/src/model/lessons/lek-13.ts", ["exp-overfitting"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-10 bis lek-13 haben je ein Experiment mit Sprechbeschreibung", () => {
  const paare: [Lesson, string, number][] = [
    [lek10, "exp-gradient-descent", 10],
    [lek11, "exp-klassifikation", 11],
    [lek12, "exp-logistische-regression", 12],
    [lek13, "exp-overfitting", 13],
  ];
  for (const [lektion, experimentId, nummer] of paare) {
    assert.equal(lektion.id, `lek-${nummer}`);
    assert.equal(lektion.number, nummer);
    assert.equal(lektion.chapterId, nummer === 10 ? "kap-03" : "kap-04");

    const abschnitt = lektion.sections.find((s) => s.kind === "experiment");
    assert.ok(abschnitt, `${lektion.id}: Experimentabschnitt fehlt`);
    assert.equal(abschnitt.experimentId, experimentId);
    assert.equal(
      abschnitt.visual.type === "experiment" ? abschnitt.visual.experimentId : "",
      experimentId,
    );
    const beschreibung = abschnitt.spoken.find((b) => b.kind === "experiment");
    const beschreibungOk =
      beschreibung !== undefined &&
      beschreibung.kind === "experiment" &&
      beschreibung.spokenDescription.length >= 60;
    assert.ok(beschreibungOk, `${lektion.id}: Sprechbeschreibung des Experiments zu knapp`);

    for (const art of ["heading", "paragraph", "equation", "example", "code", "quiz", "summary"]) {
      assert.ok(
        lektion.sections.some((s) => s.kind === art),
        `${lektion.id}: Abschnittsart "${art}" fehlt`,
      );
    }
    for (const s of lektion.sections) {
      assert.ok(s.spoken.length > 0, `${s.id}: Sprechfassung fehlt`);
    }
  }
});

test("die Quizantworten stehen auch im sichtbaren Teil und passen zum Sprechblock", () => {
  for (const lektion of [lek10, lek11, lek12, lek13]) {
    for (const abschnitt of lektion.sections) {
      if (abschnitt.kind !== "quiz") continue;
      const block = abschnitt.spoken.find((b) => b.kind === "quiz");
      if (abschnitt.visual.type !== "quiz" || !block || block.kind !== "quiz") {
        assert.fail(`${abschnitt.id}: sichtbare Frage oder Sprechfassung fehlt`);
      }
      assert.deepEqual(
        block.options,
        abschnitt.visual.options,
        `${abschnitt.id}: die Antworten weichen ab`,
      );
      assert.ok(
        block.answerIndex >= 0 && block.answerIndex < block.options.length,
        `${abschnitt.id}: answerIndex zeigt auf keine Antwort`,
      );
      assert.ok(block.explanation.length >= 30, `${abschnitt.id}: Begründung zu knapp`);
    }
  }
});
