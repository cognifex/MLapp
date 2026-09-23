/**
 * Referenzwerte und Schema-Prüfung der Lektionen 34 bis 37 (Diffusion, Conditioning, RL).
 *
 * Alle Zahlen sind mit python3 nachgerechnet - mit derselben Reihenfolge der Operationen wie in
 * den Rechenkernen - und werden hier festgenagelt. Ändert jemand einen Rechenkern, fällt es hier
 * auf und nicht erst im Browser.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ORIGINAL,
  abweichung,
  diffusionVorwaerts,
  signalanteil,
  vorwaerts,
} from "../app/src/experiment/exp-diffusion-vorwaerts.js";
import {
  diffusionRueckwaerts,
  modellschaetzung,
  rauschbild,
  rueckwaerts,
} from "../app/src/experiment/exp-diffusion-rueckwaerts.js";
import {
  UNBEDINGT,
  abstandZumZiel,
  bedingtesBild,
  conditioning,
  zielbild,
} from "../app/src/experiment/exp-conditioning.js";
import { episode, gridworld } from "../app/src/experiment/exp-rl-gridworld.js";
import { validateLesson } from "../app/src/model/validate.js";
import type { GridCell } from "../app/src/model/types.js";
import { lek34 } from "../app/src/model/lessons/lek-34.js";
import { lek35 } from "../app/src/model/lessons/lek-35.js";
import { lek36 } from "../app/src/model/lessons/lek-36.js";
import { lek37 } from "../app/src/model/lessons/lek-37.js";

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

function zelle(cells: GridCell[], row: number, col: number): GridCell {
  const treffer = cells.find((c) => c.row === row && c.col === col);
  assert.ok(treffer, `Zelle (${row}|${col}) fehlt`);
  return treffer;
}

// ---------------------------------------------------------------- LEK-34

test("exp-diffusion-vorwaerts: drei Rauschschritte rechnen wie nachgerechnet", () => {
  const r = diffusionVorwaerts.calculate({ schritte: 3 });
  fast(wert(r, "Rauschschritte"), 3);
  // python3: mittlere Abweichung nach drei Schritten
  fast(wert(r, "Mittlere Abweichung"), 0.13167372307982686, 1e-12, "mittlere Abweichung");
  // 0,95 · 0,9 · 0,85 = 0,72675
  fast(wert(r, "Signalanteil"), 0.72675, 1e-12, "Signalanteil");
  fast(signalanteil(3), 0.95 * 0.9 * 0.85);
});

test("exp-diffusion-vorwaerts: nach zehn Schritten ist fast nur Rauschen übrig", () => {
  const r = diffusionVorwaerts.calculate({ schritte: 10 });
  fast(wert(r, "Mittlere Abweichung"), 0.47042247259282594, 1e-12);
  fast(wert(r, "Signalanteil"), 0.032736453750000005, 1e-12);
});

test("exp-diffusion-vorwaerts: ohne Schritt bleibt das Bild unverändert", () => {
  const r = diffusionVorwaerts.calculate({ schritte: 0 });
  fast(wert(r, "Mittlere Abweichung"), 0);
  fast(wert(r, "Signalanteil"), 1);
  assert.deepEqual(vorwaerts(0), ORIGINAL);
});

test("exp-diffusion-vorwaerts: Zeichnung und Zahlen stammen aus derselben Rechnung", () => {
  const r = diffusionVorwaerts.calculate({ schritte: 7 });
  assert.equal(r.drawing.kind, "grid");
  if (r.drawing.kind !== "grid") return;
  assert.equal(r.drawing.cols, 6);
  assert.equal(r.drawing.rows, 6);
  assert.equal(r.drawing.cells.length, 36, "sechs mal sechs Bildpunkte");
  assert.equal(r.drawing.style, "grau");
  const bild = vorwaerts(7);
  r.drawing.cells.forEach((c) => {
    fast(c.value, bild[c.row * 6 + c.col] ?? 0, 1e-15, `Bildpunkt ${c.row}|${c.col}`);
  });
  fast(wert(r, "Mittlere Abweichung"), abweichung(bild, ORIGINAL));
  assert.ok(
    r.values.every((v) => Number.isFinite(v.value)),
    "alle Zahlen sind endlich",
  );
});

test("exp-diffusion-vorwaerts: gleicher Zustand ergibt gleiche Ausgabe", () => {
  assert.deepEqual(
    diffusionVorwaerts.calculate({ schritte: 4 }),
    diffusionVorwaerts.calculate({ schritte: 4 }),
  );
  assert.deepEqual(diffusionVorwaerts.update({ schritte: 8 }, { type: "reset" }), {
    schritte: 3,
  });
});

// ---------------------------------------------------------------- LEK-35

test("exp-diffusion-rueckwaerts: Fehler je Schritt wie nachgerechnet", () => {
  const r = diffusionRueckwaerts.calculate({ schritte: 5, fehler: 0.2 });
  fast(wert(r, "Denoising-Schritte"), 5);
  fast(wert(r, "Fehler vor dem ersten Schritt"), 0.47042247259282594, 1e-12);
  fast(wert(r, "Fehler nach Schritt 1"), 0.26048436754702375, 1e-12);
  fast(wert(r, "Fehler nach Schritt 3"), 0.11938978968372156, 1e-12);
  fast(wert(r, "Fehler nach Schritt 5"), 0.0815312195051503, 1e-12);
  fast(wert(r, "Fehler am Ende"), 0.0815312195051503, 1e-12);
});

test("exp-diffusion-rueckwaerts: mehr Schritte verkleinern den Fehler", () => {
  const r = diffusionRueckwaerts.calculate({ schritte: 10, fehler: 0.2 });
  const verlauf = r.values
    .filter((v) => v.label.startsWith("Fehler nach Schritt"))
    .map((v) => v.value);
  assert.equal(verlauf.length, 10, "ein Wert je Schritt");
  for (let i = 1; i < verlauf.length; i += 1) {
    assert.ok(
      (verlauf[i] ?? 0) < (verlauf[i - 1] ?? 0),
      `Fehler nach Schritt ${i + 1} muss kleiner sein als nach Schritt ${i}`,
    );
  }
  fast(verlauf[verlauf.length - 1] ?? 0, 0.063677529343, 1e-9, "Boden bei Restfehler 0,2");
});

test("exp-diffusion-rueckwaerts: fehlerfreie Schätzung kommt fast ans Zielbild", () => {
  fast(rueckwaerts(10, 0).fehlerJeSchritt[9] ?? 0, 0.015399963516995678, 1e-12);
  fast(rueckwaerts(1, 0).fehlerJeSchritt[0] ?? 0, 0.23521123629641297, 1e-12);
});

test("exp-diffusion-rueckwaerts: Startbild und Beispielwerte der Lektion", () => {
  assert.deepEqual(rauschbild(), vorwaerts(10));
  fast(abweichung(rauschbild(), ORIGINAL), 0.47042247259282594, 1e-12);
  // Beispiel aus lek-35/s05: Schätzung und erster Schritt für den ersten Bildpunkt.
  const schaetzung = modellschaetzung(10, 0.2);
  fast(schaetzung[0] ?? 0, 0.8340148696675896, 1e-12);
  const nachSchritt = 0.5 * (rauschbild()[0] ?? 0) + 0.5 * (schaetzung[0] ?? 0);
  fast(nachSchritt, 0.748426955477792, 1e-12);
});

test("exp-diffusion-rueckwaerts: gleicher Zustand ergibt gleiche Ausgabe", () => {
  assert.deepEqual(
    diffusionRueckwaerts.calculate({ schritte: 6, fehler: 0.15 }),
    diffusionRueckwaerts.calculate({ schritte: 6, fehler: 0.15 }),
  );
  assert.deepEqual(diffusionRueckwaerts.update({ schritte: 9, fehler: 0 }, { type: "reset" }), {
    schritte: 5,
    fehler: 0.2,
  });
});

// ---------------------------------------------------------------- LEK-36

test("exp-conditioning: Abstände der Bedingung Kreuz wie nachgerechnet", () => {
  const r = conditioning.calculate({ bedingung: "kreuz", staerke: 0.5 });
  fast(wert(r, "Abstand zum Ziel Kreuz"), 0.3250455289866783, 1e-12);
  fast(wert(r, "Abstand zum Ziel Ring"), 0.6634726746348751, 1e-12);
  fast(wert(r, "Abstand ohne Bedingung"), 0.6500910579733566, 1e-12);
});

test("exp-conditioning: Abstände der Bedingung Ring wie nachgerechnet", () => {
  const r = conditioning.calculate({ bedingung: "ring", staerke: 0.75 });
  fast(wert(r, "Abstand zum Ziel Ring"), 0.1650696706507709, 1e-12);
  fast(wert(r, "Abstand zum Ziel Kreuz"), 0.6625227644933391, 1e-12);
});

test("exp-conditioning: bei voller Stärke ist das Bild genau das Zielbild", () => {
  fast(abstandZumZiel("kreuz", 1), 0, 1e-15);
  fast(abstandZumZiel("ring", 1), 0, 1e-15);
  // Bei voller Stärke fällt das unbedingte Bild ganz weg: x ist genau das Zielbild.
  assert.deepEqual(bedingtesBild("kreuz", 1), zielbild("kreuz"));
  assert.deepEqual(bedingtesBild("ring", 1), zielbild("ring"));
});

test("exp-conditioning: nur das eigene Ziel kommt näher", () => {
  let vorher = abstandZumZiel("kreuz", 0);
  for (const staerke of [0.25, 0.5, 0.75, 1]) {
    const jetzt = abstandZumZiel("kreuz", staerke);
    assert.ok(jetzt < vorher, `Abstand bei Stärke ${staerke} muss kleiner sein`);
    vorher = jetzt;
  }
  // Der Abstand zum anderen Ziel wächst dagegen: 0,6603 (ohne Bedingung) auf 0,6635 bei 0,5.
  const ohne = conditioning.calculate({ bedingung: "kreuz", staerke: 0 });
  const halb = conditioning.calculate({ bedingung: "kreuz", staerke: 0.5 });
  assert.ok(
    wert(halb, "Abstand zum Ziel Ring") > wert(ohne, "Abstand zum Ziel Ring"),
    "der Abstand zum Zielbild Ring wächst",
  );
  fast(abweichung(UNBEDINGT, ORIGINAL), 0.03953874642983944, 1e-12, "unbedingtes Bild");
  assert.equal(halb.drawing.kind, "grid");
});

// ---------------------------------------------------------------- LEK-37

test("exp-rl-gridworld: Zugfolge zum Ziel bringt 0,84", () => {
  const r = gridworld.calculate({ zug1: "rechts", zug2: "rechts", zug3: "oben", zug4: "oben" });
  fast(wert(r, "Belohnung der Folge"), 0.84, 1e-12, "vier Schritte, dann das Ziel");
  fast(wert(r, "Schritte"), 4);
  fast(wert(r, "Belohnung je Schritt"), 0.21, 1e-12);
  fast(wert(r, "Zeile am Ende"), 0);
  fast(wert(r, "Spalte am Ende"), 2);
});

test("exp-rl-gridworld: die Falle beendet die Folge mit -1,08", () => {
  const r = gridworld.calculate({ zug1: "oben", zug2: "rechts", zug3: "rechts", zug4: "rechts" });
  fast(wert(r, "Belohnung der Folge"), -1.08, 1e-12, "zwei Schritte, dann die Falle");
  fast(wert(r, "Schritte"), 2);
  fast(wert(r, "Zeile am Ende"), 1);
  fast(wert(r, "Spalte am Ende"), 1);
});

test("exp-rl-gridworld: ein Zug gegen die Wand kostet trotzdem", () => {
  const r = gridworld.calculate({
    zug1: "unten",
    zug2: "rechts",
    zug3: "rechts",
    zug4: "oben",
  });
  fast(wert(r, "Belohnung der Folge"), -0.16, 1e-12, "vier Schrittkosten, sonst nichts");
  fast(wert(r, "Schritte"), 4);
  assert.ok(
    r.sentences.some((s) => s.includes("Wand")),
    "die Wand wird im Satz genannt",
  );
});

test("exp-rl-gridworld: Belohnung eines Schrittes auf die Falle", () => {
  // Schrittpreis -0,04 plus Feldbelohnung -1 = -1,04; in der Beispielzugfolge sind es zwei
  // Schritte, deshalb dort 2 · (-0,04) + (-1) = -1,08.
  const verlauf = episode(["oben", "rechts"]);
  fast(verlauf.belohnung, -1.08, 1e-12);
  assert.equal(verlauf.schritte, 2);
  assert.ok(verlauf.falleErwischt, "die Falle wurde erwischt");
  assert.equal(verlauf.pfad.length, 3, "Startfeld plus zwei Schritte");
  fast(0.84 / 4, 0.21, 1e-15, "Belohnung je Schritt der Beispielzugfolge");
});

test("exp-rl-gridworld: Zellenbeschriftungen zeigen Pfeile und Belohnungen", () => {
  const r = gridworld.calculate({ zug1: "rechts", zug2: "rechts", zug3: "oben", zug4: "oben" });
  assert.equal(r.drawing.kind, "grid");
  if (r.drawing.kind !== "grid") return;
  assert.equal(r.drawing.cols, 3);
  assert.equal(r.drawing.rows, 3);
  assert.equal(r.drawing.cells.length, 9);
  assert.equal(zelle(r.drawing.cells, 2, 0).label, "→", "Startfeld: Zug nach rechts");
  assert.equal(zelle(r.drawing.cells, 2, 2).label, "↑", "unten rechts: Zug nach oben");
  assert.equal(zelle(r.drawing.cells, 0, 2).label, "+1", "Zielfeld trägt seine Belohnung");
  assert.equal(zelle(r.drawing.cells, 1, 1).label, "-1", "Falle trägt ihre Belohnung");
  assert.equal(zelle(r.drawing.cells, 0, 0).label, "0", "leeres Feld trägt null");
  assert.equal(r.drawing.vectors?.length, 4, "vier Pfeile für vier Züge");
  assert.equal(r.drawing.points?.length, 2, "Start und Ende sind markiert");
});

test("exp-rl-gridworld: gleicher Zustand ergibt gleiche Ausgabe", () => {
  const zustand = { zug1: "oben", zug2: "oben", zug3: "rechts", zug4: "rechts" };
  assert.deepEqual(gridworld.calculate(zustand), gridworld.calculate(zustand));
  assert.deepEqual(gridworld.update(zustand, { type: "reset" }), {
    zug1: "rechts",
    zug2: "rechts",
    zug3: "oben",
    zug4: "oben",
  });
});

// ---------------------------------------------------------------- Schema

test("lek-34: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek34, "app/src/model/lessons/lek-34.ts", [
    "exp-diffusion-vorwaerts",
  ]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-35: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek35, "app/src/model/lessons/lek-35.ts", [
    "exp-diffusion-rueckwaerts",
  ]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-36: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek36, "app/src/model/lessons/lek-36.ts", ["exp-conditioning"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-37: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek37, "app/src/model/lessons/lek-37.ts", ["exp-rl-gridworld"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("die vier Lektionen stehen in den richtigen Kapiteln", () => {
  assert.deepEqual(
    [lek34.chapterId, lek35.chapterId, lek36.chapterId],
    ["kap-09", "kap-09", "kap-09"],
  );
  assert.equal(lek37.chapterId, "kap-10");
  assert.deepEqual([lek34.number, lek35.number, lek36.number, lek37.number], [34, 35, 36, 37]);
  for (const lektion of [lek34, lek35, lek36, lek37]) {
    assert.ok(lektion.learningGoals.length > 0, `${lektion.id}: Lernziel fehlt`);
    assert.ok(lektion.requiresPreviousKnowledge.length > 0, `${lektion.id}: Vorwissen fehlt`);
    assert.ok(lektion.sections.length >= 7, `${lektion.id}: zu wenige Abschnitte`);
    for (const abschnitt of lektion.sections) {
      assert.ok(abschnitt.spoken.length > 0, `${abschnitt.id}: keine Sprechfassung`);
    }
  }
});
