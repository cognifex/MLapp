/**
 * Fachliche Prüfungen zu den Lektionen 6 bis 9: nachgerechnete Referenzwerte und die
 * Schema-Prüfung der vier Lektionen.
 *
 * Alle Referenzwerte sind von Hand nachgerechnet und mit python3 geprüft, zum Beispiel:
 *   python3 -c "from math import comb, sqrt; print(comb(8,4) * 0.5**8, sqrt(8*0.5*0.5))"
 *   python3 -c "from math import log2; print(-(0.4*log2(0.4) + 3*0.2*log2(0.2)))"
 * Ändert jemand einen Rechenkern, fällt es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { wahrscheinlichkeit } from "../app/src/experiment/exp-wahrscheinlichkeit.js";
import { entropie } from "../app/src/experiment/exp-entropie.js";
import { lineareRegression } from "../app/src/experiment/exp-lineare-regression.js";
import { loss } from "../app/src/experiment/exp-loss.js";
import { checkExperimentContract } from "../app/src/experiment/contract.js";
import { lek06 } from "../app/src/model/lessons/lek-06.js";
import { lek07 } from "../app/src/model/lessons/lek-07.js";
import { lek08 } from "../app/src/model/lessons/lek-08.js";
import { lek09 } from "../app/src/model/lessons/lek-09.js";
import { validateLesson } from "../app/src/model/validate.js";
import type { Calculated } from "../app/src/model/types.js";

function wert(result: Calculated, label: string): number {
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

function stab(result: Calculated): Extract<Calculated["drawing"], { kind: "bars" }> {
  const zeichnung = result.drawing;
  assert.equal(zeichnung.kind, "bars");
  if (zeichnung.kind !== "bars") throw new Error("keine Säulenzeichnung");
  return zeichnung;
}

function punktwolke(result: Calculated): Extract<Calculated["drawing"], { kind: "scatter" }> {
  const zeichnung = result.drawing;
  assert.equal(zeichnung.kind, "scatter");
  if (zeichnung.kind !== "scatter") throw new Error("keine Punktwolke");
  return zeichnung;
}

// --- LEK-06 Wahrscheinlichkeit -------------------------------------------------------------

test("Wahrscheinlichkeit: n und p entstehen aus Erwartungswert und Streuung", () => {
  const r = wahrscheinlichkeit.calculate({
    verteilung: "binomial",
    mu: 4,
    sigma: 1.4,
    stichprobe: 100,
    seed: 7,
  });
  // p = 1 - 1,4²/4 = 0,51, n = 4/0,51 gerundet 8, danach p = 4/8 = 0,5.
  fast(wert(r, "n"), 8, 1e-12, "n");
  fast(wert(r, "p"), 0.5, 1e-12, "p");
  fast(wert(r, "Erwartungswert"), 4, 1e-12, "n p");
  fast(wert(r, "Streuung"), Math.sqrt(2), 1e-12, "Wurzel aus 8 · 0,5 · 0,5");
});

test("Wahrscheinlichkeit: die Stichprobe aus dem Startwert 7 ist reproduzierbar", () => {
  // Zähler der Werte 0 bis 8: 1, 0, 9, 27, 29, 19, 11, 3, 1; Mittelwert 405/100 = 4,05.
  const r = wahrscheinlichkeit.calculate({
    verteilung: "binomial",
    mu: 4,
    sigma: 1.4,
    stichprobe: 100,
    seed: 7,
  });
  fast(wert(r, "Mittel der Stichprobe"), 4.05, 1e-12, "Mittelwert");
  fast(wert(r, "Häufigster Wert"), 4, 1e-12, "häufigster Wert");
  const z = stab(r);
  assert.equal(z.items.length, 9, "Werte 0 bis 8");
  fast(z.items[0]!.value, 0.00390625, 1e-12, "P(0) = 0,5⁸");
  fast(z.items[2]!.value, 0.109375, 1e-12, "P(2) = 28 · 0,5⁸");
  fast(z.items[4]!.value, 0.2734375, 1e-12, "P(4) = 70 · 0,5⁸");
  fast(z.items[4]!.ghost ?? 0, 0.29, 1e-12, "29 von 100 gezogenen Werten");
});

test("Wahrscheinlichkeit: größere Stichprobe liegt näher am Erwartungswert", () => {
  // 500 Werte, Startwert 7: Zähler 2, 18, 53, 108, 137, 107, 56, 16, 3; Mittelwert 4,006.
  const gross = wahrscheinlichkeit.calculate({
    verteilung: "binomial",
    mu: 4,
    sigma: 1.4,
    stichprobe: 500,
    seed: 7,
  });
  fast(wert(gross, "Mittel der Stichprobe"), 4.006, 1e-12, "Mittelwert bei 500 Werten");
  const klein = wahrscheinlichkeit.calculate({
    verteilung: "binomial",
    mu: 4,
    sigma: 1.4,
    stichprobe: 100,
    seed: 7,
  });
  assert.ok(
    Math.abs(wert(gross, "Mittel der Stichprobe") - 4) <
      Math.abs(wert(klein, "Mittel der Stichprobe") - 4),
    "die größere Stichprobe liegt näher am Erwartungswert",
  );
});

test("Wahrscheinlichkeit: nicht darstellbare Streuung fällt auf die breiteste Verteilung", () => {
  // Erwartungswert 1 und Streuung 2 gibt es nicht: breiteste Form mit p = 0,1, also n = 10.
  const r = wahrscheinlichkeit.calculate({
    verteilung: "binomial",
    mu: 1,
    sigma: 2,
    stichprobe: 100,
    seed: 7,
  });
  fast(wert(r, "n"), 10, 1e-12, "n");
  fast(wert(r, "p"), 0.1, 1e-12, "p");
  fast(wert(r, "Erwartungswert"), 1, 1e-12, "n p");
  fast(wert(r, "Streuung"), Math.sqrt(0.9), 1e-12, "Wurzel aus 10 · 0,1 · 0,9");
});

test("Wahrscheinlichkeit: die Glockenform folgt Erwartungswert und Streuung", () => {
  const r = wahrscheinlichkeit.calculate({
    verteilung: "normal",
    mu: 4,
    sigma: 1.4,
    stichprobe: 100,
    seed: 7,
  });
  fast(wert(r, "Erwartungswert"), 4, 1e-12, "Erwartungswert");
  fast(wert(r, "Streuung"), 1.4, 1e-12, "Streuung");
  fast(wert(r, "Anzahl Werte"), 9, 1e-12, "Werte 0 bis 8");
  const z = stab(r);
  assert.equal(z.items.length, 9);
  fast(z.items[4]!.value, 0.2852523396966627, 1e-12, "Wahrscheinlichkeit an der Stelle 4");
  let summe = 0;
  for (const item of z.items) summe += item.value;
  fast(summe, 1, 1e-12, "die Wahrscheinlichkeiten summieren sich zu eins");
});

test("Wahrscheinlichkeit: gleicher Zustand ergibt dieselbe Ausgabe", () => {
  const zustand = { verteilung: "binomial", mu: 4, sigma: 1.4, stichprobe: 100, seed: 7 };
  assert.deepEqual(
    wahrscheinlichkeit.calculate({ ...zustand }),
    wahrscheinlichkeit.calculate({ ...zustand }),
  );
  const andere = wahrscheinlichkeit.calculate({ ...zustand, seed: 3 });
  assert.notDeepEqual(andere.values, wahrscheinlichkeit.calculate({ ...zustand }).values);
});

test("Wahrscheinlichkeit: update ist rein, das Zurücksetzen stellt den Start her", () => {
  const start = { ...wahrscheinlichkeit.initialState };
  const anders = wahrscheinlichkeit.update(start, {
    type: "set-value",
    controlId: "seed",
    value: 3,
  });
  assert.equal(anders["seed"], 3);
  assert.equal(start["seed"], 7, "der übergebene Zustand bleibt unverändert");
  assert.deepEqual(wahrscheinlichkeit.update(anders, { type: "reset" }), start);
});

// --- LEK-07 Entropie -----------------------------------------------------------------------

test("Entropie: vier gleich wahrscheinliche Klassen ergeben zwei Bit", () => {
  const r = entropie.calculate({ p1: 0.25, p2: 0.25, p3: 0.25, p4: 0.25 });
  fast(wert(r, "Anteil Klasse 1"), 0.25, 1e-12, "Anteil");
  fast(wert(r, "Entropie"), 2, 1e-12, "H = -(4 · 0,25 · log2 0,25)");
  fast(wert(r, "Wirksame Klassen"), 4, 1e-12, "2 hoch H");
  fast(wert(r, "Höchstwert"), 2, 1e-12, "log2 4");
});

test("Entropie: ungleiche Anteile senken die Entropie", () => {
  // Rohgewichte 0,5 / 0,25 / 0,25 / 0,25 werden zu 0,4 / 0,2 / 0,2 / 0,2.
  const r = entropie.calculate({ p1: 0.5, p2: 0.25, p3: 0.25, p4: 0.25 });
  fast(wert(r, "Anteil Klasse 1"), 0.4, 1e-12, "Anteil der ersten Klasse");
  fast(wert(r, "Anteil Klasse 4"), 0.2, 1e-12, "Anteil der vierten Klasse");
  // H = 0,4 · 1,3219280948873622 + 3 · 0,2 · 2,321928094887362 = 1,9219280948873623
  fast(wert(r, "Entropie"), 1.9219280948873623, 1e-12, "Entropie");
  fast(wert(r, "Wirksame Klassen"), 3.789291416275995, 1e-12, "2 hoch H");
  assert.ok(wert(r, "Entropie") < 2, "weniger als der Höchstwert");
});

test("Entropie: zwei Klassen ergeben ein Bit, eine sichere Klasse null Bit", () => {
  const zwei = entropie.calculate({ p1: 1, p2: 1, p3: 0, p4: 0 });
  fast(wert(zwei, "Anteil Klasse 1"), 0.5, 1e-12, "halber Anteil");
  fast(wert(zwei, "Entropie"), 1, 1e-12, "ein Bit");
  fast(wert(zwei, "Wirksame Klassen"), 2, 1e-12, "zwei wirksame Klassen");

  const sicher = entropie.calculate({ p1: 1, p2: 0, p3: 0, p4: 0 });
  fast(wert(sicher, "Entropie"), 0, 1e-12, "null Bit");
  fast(wert(sicher, "Wirksame Klassen"), 1, 1e-12, "eine wirksame Klasse");
});

test("Entropie: die Zeichnung nutzt die Anteilsskala", () => {
  const r = entropie.calculate({ p1: 0.25, p2: 0.25, p3: 0.25, p4: 0.25 });
  const z = stab(r);
  assert.equal(z.items.length, 4);
  assert.equal(z.yMax, 1, "die Säulen stehen auf der Anteilsskala");
  fast(z.items[0]!.value, 0.25, 1e-12, "Anteil der ersten Säule");
  assert.equal(z.items[0]!.color, "hsl(214 40% 83%)", "helle Farbe bei kleinem Anteil");
  assert.equal(z.items[0]!.highlighted, false, "bei Gleichstand wird nichts hervorgehoben");

  const schief = stab(entropie.calculate({ p1: 1, p2: 0, p3: 0, p4: 0 }));
  assert.equal(schief.items[0]!.highlighted, true, "die größte Säule ist hervorgehoben");
  fast(schief.items[0]!.value, 1, 1e-12, "Anteil eins");
});

// --- LEK-08 Lineare Regression -------------------------------------------------------------

test("Regression: die Startgerade trifft alle fünf Punkte", () => {
  const r = lineareRegression.calculate({
    punkt: "p3",
    position: { x: 0, y: 0 },
    w: 1,
    b: 0,
  });
  fast(wert(r, "Steigung w"), 1, 1e-12, "Steigung");
  fast(wert(r, "Achsenabschnitt b"), 0, 1e-12, "Achsenabschnitt");
  fast(wert(r, "y bei x = 1"), 1, 1e-12, "w + b");
  fast(wert(r, "Mittlerer Abstand"), 0, 1e-12, "alle Abstände null");
  fast(wert(r, "Anzahl Punkte"), 5, 1e-12, "fünf Punkte");

  const z = punktwolke(r);
  assert.equal(z.points.length, 5, "fünf Punkte in der Zeichnung");
  assert.equal(z.lines.length, 1, "eine Gerade");
  assert.deepEqual(
    z.lines[0]!.points,
    [
      [-3, -3],
      [3, 3],
    ],
    "die Gerade y = x",
  );
});

test("Regression: w = 2 und b = 1 ergeben den mittleren Abstand 1,4", () => {
  // Abstände 1, 0, -1, -2, -3; mittlerer Betrag (1 + 0 + 1 + 2 + 3) / 5 = 1,4.
  const r = lineareRegression.calculate({
    punkt: "p3",
    position: { x: 0, y: 0 },
    w: 2,
    b: 1,
  });
  fast(wert(r, "Mittlerer Abstand"), 1.4, 1e-12, "mittlerer Abstand");
  const z = punktwolke(r);
  assert.deepEqual(
    z.lines[0]!.points,
    [
      [-2, -3],
      [1, 3],
    ],
    "sichtbarer Teil der Geraden",
  );
});

test("Regression: eine waagerechte Gerade kann denselben Abstand haben", () => {
  // w = 0, b = 1: Abstände -3, -2, -1, 0, 1; mittlerer Betrag ebenfalls 1,4.
  const r = lineareRegression.calculate({
    punkt: "p3",
    position: { x: 0, y: 0 },
    w: 0,
    b: 1,
  });
  fast(wert(r, "Mittlerer Abstand"), 1.4, 1e-12, "mittlerer Abstand");
  const z = punktwolke(r);
  assert.deepEqual(
    z.lines[0]!.points,
    [
      [-3, 1],
      [3, 1],
    ],
    "waagerechte Gerade",
  );
});

test("Regression: ein verschobener Punkt ändert den mittleren Abstand", () => {
  // Punkt 5 liegt bei (2|3), die Gerade y = x hat dort den Abstand 3 - 2 = 1; 1 / 5 = 0,2.
  const r = lineareRegression.calculate({
    punkt: "p5",
    position: { x: 2, y: 3 },
    w: 1,
    b: 0,
  });
  fast(wert(r, "Mittlerer Abstand"), 0.2, 1e-12, "mittlerer Abstand");
  const z = punktwolke(r);
  assert.deepEqual(z.points[4]!, { label: "P5", x: 2, y: 3, color: "#d93025" });
});

test("Regression: die Auswahl holt den Punkt auf seine Ausgangslage", () => {
  const start = { ...lineareRegression.initialState };
  const verschoben = lineareRegression.update(start, {
    type: "set-value",
    controlId: "position",
    value: { x: 1.5, y: 2.5 },
  });
  assert.deepEqual(verschoben["position"], { x: 1.5, y: 2.5 });
  const gewechselt = lineareRegression.update(verschoben, {
    type: "set-value",
    controlId: "punkt",
    value: "p5",
  });
  assert.deepEqual(
    gewechselt["position"],
    { x: 2, y: 2 },
    "Punkt 5 steht wieder an seiner Ausgangslage",
  );
  assert.equal(start["punkt"], "p3", "der übergebene Zustand bleibt unverändert");
  assert.deepEqual(lineareRegression.update(gewechselt, { type: "reset" }), start);
});

// --- LEK-09 Loss ---------------------------------------------------------------------------

test("Loss: Residuen und MSE der Startgeraden y = x", () => {
  // Residuen 1, 1, -0,5, 0,5, 0; Summe der Quadrate 2,5; MSE 2,5 / 5 = 0,5.
  const r = loss.calculate({ w: 1, b: 0 });
  fast(wert(r, "MSE"), 0.5, 1e-12, "mittlerer quadratischer Fehler");
  fast(wert(r, "Summe der Quadrate"), 2.5, 1e-12, "Summe der Quadrate");
  fast(wert(r, "Mittlerer Fehler"), 0.4, 1e-12, "2 / 5");
  fast(wert(r, "Größtes Residuum"), 1, 1e-12, "größtes Residuum");
});

test("Loss: die günstigste Gerade hat den kleinsten Verlust", () => {
  // w = 0,75 und b = 0,9: Residuen 0,1 / 0,35 / -0,9 / 0,35 / 0,1; MSE 1,075 / 5 = 0,215.
  const best = loss.calculate({ w: 0.75, b: 0.9 });
  fast(wert(best, "MSE"), 0.215, 1e-12, "MSE der günstigsten Geraden");
  fast(wert(best, "Bestes w"), 0.75, 1e-12, "günstigste Steigung");
  fast(wert(best, "Bestes b"), 0.9, 1e-12, "günstigster Achsenabschnitt");
  fast(wert(best, "Kleinster erreichbarer MSE"), 0.215, 1e-12, "kleinster erreichbarer Wert");

  const start = loss.calculate({ w: 1, b: 0 });
  fast(wert(start, "Bestes w"), 0.75, 1e-12, "dieselbe günstigste Steigung");
  fast(wert(start, "Kleinster erreichbarer MSE"), 0.215, 1e-12, "derselbe kleinste Wert");
  assert.ok(wert(best, "MSE") < wert(start, "MSE"), "die günstigste Gerade liegt besser");
});

test("Loss: ein Paar dazwischen senkt den Verlust schon", () => {
  // w = 0,8 und b = 0,5: Residuen 0,5 / 0,7 / -0,6 / 0,6 / 0,3; MSE 1,55 / 5 = 0,31.
  const r = loss.calculate({ w: 0.8, b: 0.5 });
  fast(wert(r, "MSE"), 0.31, 1e-12, "mittlerer quadratischer Fehler");
  assert.ok(
    wert(r, "MSE") < wert(loss.calculate({ w: 1, b: 0 }), "MSE"),
    "kleiner als an der Startgeraden",
  );
});

test("Loss: die Zeichnung zeigt die Geraden und die senkrechten Residuen", () => {
  const r = loss.calculate({ w: 1, b: 0 });
  const z = punktwolke(r);
  assert.equal(z.points.length, 5, "fünf Messpunkte");
  assert.equal(z.lines.length, 6, "eine Gerade und fünf Residuen");
  assert.deepEqual(
    z.lines[0]!.points,
    [
      [-0.5, -0.5],
      [4.5, 4.5],
    ],
    "die Gerade y = x",
  );
  const erstesResiduum = z.lines[1]!;
  assert.equal(erstesResiduum.dashed, true, "Residuen sind gestrichelt");
  assert.deepEqual(
    erstesResiduum.points,
    [
      [0, 1],
      [0, 0],
    ],
    "senkrecht von (0|1) auf die Gerade",
  );
  assert.deepEqual(
    z.lines[4]!.points,
    [
      [3, 3.5],
      [3, 3],
    ],
    "Residuum von (3|3,5)",
  );
});

test("Loss: Ereignisse melden steigenden und fallenden Verlust", () => {
  const flach = { w: 0.8, b: 0.5 };
  const steil = { w: 1, b: 0 };
  const besser = loss.semanticEvents?.(steil, flach) ?? [];
  const schlechter = loss.semanticEvents?.(flach, steil) ?? [];
  assert.ok(
    besser.some((e) => e.name === "lossDecreased"),
    "sinkender Verlust wird gemeldet",
  );
  assert.ok(
    schlechter.some((e) => e.name === "lossIncreased"),
    "steigender Verlust wird gemeldet",
  );
  const ereignis = besser.find((e) => e.name === "lossDecreased");
  assert.ok(ereignis, "Ereignis vorhanden");
  fast(ereignis?.value ?? 0, 0.31, 1e-12, "der neue Wert steht im Ereignis");
  const amZiel = loss.semanticEvents?.(steil, { w: 0.75, b: 0.9 }) ?? [];
  assert.ok(
    amZiel.some((e) => e.name === "lossMinimal"),
    "der kleinste Wert wird gemeldet",
  );
});

// --- Vertrag und Schema --------------------------------------------------------------------

test("Lektionen 6 bis 9: die Experimente erfüllen den Vertrag", () => {
  const alle = [wahrscheinlichkeit, entropie, lineareRegression, loss];
  for (const experiment of alle) {
    const issues = checkExperimentContract(experiment);
    assert.deepEqual(issues, [], `${experiment.id}: ${issues.map((i) => i.message).join("; ")}`);
  }
});

test("lek-06: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek06, "app/src/model/lessons/lek-06.ts", [
    "exp-wahrscheinlichkeit",
  ]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-07: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek07, "app/src/model/lessons/lek-07.ts", ["exp-entropie"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-08: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek08, "app/src/model/lessons/lek-08.ts", [
    "exp-lineare-regression",
  ]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-09: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek09, "app/src/model/lessons/lek-09.ts", ["exp-loss"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});
