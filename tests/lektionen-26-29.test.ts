/**
 * Referenzwerte und Schemaprüfung für die Lektionen 26 bis 29.
 *
 * Alle Zahlen sind mit python3 nachgerechnet (Softmax der Bewertungen, Entropie einer Zeile,
 * Normen der Transformationskette, Tokenanzahl der Beispielsätze) und werden hier festgenagelt.
 * Ändert jemand einen Rechenkern, fällt es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { bewertungen, gewichte, gewichteterWert, qkv } from "../app/src/experiment/exp-qkv.js";
import {
  entropie,
  gewichteZeile,
  kopfZu,
  multiHead,
} from "../app/src/experiment/exp-multi-head.js";
import { durchlauf, norm, transformer } from "../app/src/experiment/exp-transformer.js";
import { anteilStuecke, tokenisierung, zerlege } from "../app/src/experiment/exp-tokenisierung.js";
import { lek26 } from "../app/src/model/lessons/lek-26.js";
import { lek27 } from "../app/src/model/lessons/lek-27.js";
import { lek28 } from "../app/src/model/lessons/lek-28.js";
import { lek29 } from "../app/src/model/lessons/lek-29.js";
import { validateLesson } from "../app/src/model/validate.js";

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

test("exp-qkv: Bewertungen der Abfrage Hund", () => {
  // Handrechnung: Abfrage (0,60|0,80) -> projiziert (3,00|2,40);
  // Skalarprodukte 12,60 / 15,12 / 15,75 / 9,45, geteilt durch Wurzel aus zwei.
  const erwartet = [8.90954544295, 10.691454531541, 11.136931803688, 6.682159082213];
  const werte = bewertungen(1);
  assert.equal(werte.length, 4);
  erwartet.forEach((e, i) => almost(werte[i] ?? 0, e, 1e-9, `Bewertung ${i}`));
});

test("exp-qkv: Softmax-Gewichte summieren sich zu eins", () => {
  // Referenz: Softmax über 8,9095 / 10,6915 / 11,1369 / 6,6822.
  const erwartet = [0.061257284901, 0.363941036948, 0.568197540174, 0.006604137977];
  const werte = gewichte(1);
  erwartet.forEach((e, i) => almost(werte[i] ?? 0, e, 1e-9, `Gewicht ${i}`));
  almost(
    werte.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    "Summe der Gewichte",
  );
});

test("exp-qkv: gewichteter Wert ist die Mischung der Werte", () => {
  // Werte: Der (0,50|0,00), Hund (0,30|0,80), jagt (0,40|0,60), Katze (0,00|1,00).
  almost(gewichteterWert(1)[0], 0.367089969605, 1e-9, "Merkmal 1");
  almost(gewichteterWert(1)[1], 0.638675491639, 1e-9, "Merkmal 2");
});

test("exp-qkv: die Abfrage Katze schaut auf Hund und jagt", () => {
  const werte = gewichte(3);
  almost(werte[1] ?? 0, 0.503431498965, 1e-9, "Gewicht auf Hund");
  almost(werte[2] ?? 0, 0.42938271355, 1e-9, "Gewicht auf jagt");
  almost(
    werte.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    "Summe der Gewichte",
  );
});

test("exp-qkv: Zahlen und Zeichnung stammen aus derselben Rechnung", () => {
  const result = qkv.calculate({ abfrage: 1, ansicht: "gewichte" });
  almost(wert(result, "Größtes Gewicht"), 0.568197540174, 1e-9, "größtes Gewicht");
  almost(wert(result, "Summe der Gewichte"), 1, 1e-12, "Summe der Gewichte");
  almost(wert(result, "Gewichteter Wert 1"), 0.367089969605, 1e-9, "gewichteter Wert 1");
  almost(wert(result, "Gewichteter Wert 2"), 0.638675491639, 1e-9, "gewichteter Wert 2");
  assert.equal(result.drawing.kind, "bars");
  if (result.drawing.kind === "bars") {
    assert.equal(result.drawing.items.length, 4, "vier Tokens als Säulen");
    // In der Gewichte-Ansicht gilt die Achse bis eins.
    assert.equal(result.drawing.yMax, 1);
    const gewichtJagt = result.drawing.items[2];
    assert.ok(gewichtJagt, "Säule fehlt");
    assert.equal(gewichtJagt.label, "jagt");
    almost(gewichtJagt.value, 0.568197540174, 1e-9, "Säule des Tokens jagt");
    assert.equal(result.drawing.items[1]?.highlighted, true, "Abfragetoken ist hervorgehoben");
  }

  // In der Bewertungsansicht stehen dort die Skalarprodukte, ohne feste Obergrenze.
  const sicht = qkv.calculate({ abfrage: 1, ansicht: "bewertungen" });
  if (sicht.drawing.kind === "bars") {
    assert.equal(sicht.drawing.yMax, undefined, "Bewertungen haben keine feste Obergrenze");
    almost(sicht.drawing.items[2]?.value ?? 0, 11.136931803688, 1e-9, "Bewertung auf jagt");
  }
});

test("exp-multi-head: Entropie einer Zeile, Kopf 1 und Kopf 3", () => {
  // Handrechnung für Kopf 1, Zeile Hund: Bewertungen 0,3677 / 0,8485 / 2,8850 / 1,0748.
  const kopf1 = kopfZu("kopf-1");
  const zeile1 = gewichteZeile(kopf1, 1);
  const erwartet = [0.058683304042, 0.094915580383, 0.727384627476, 0.119016488099];
  erwartet.forEach((e, i) => almost(zeile1[i] ?? 0, e, 1e-9, `Gewicht ${i} in Kopf 1`));
  almost(entropie(zeile1), 0.874758723707, 1e-9, "Entropie Kopf 1");
  almost(
    zeile1.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    "Summe der Zeile",
  );

  // Derselbe Zeilenindex im breiten Kopf 3: kleineres Maximum, größere Entropie.
  const kopf3 = kopfZu("kopf-3");
  const zeile3 = gewichteZeile(kopf3, 1);
  almost(Math.max(...zeile3), 0.336381633069, 1e-9, "größtes Gewicht in Kopf 3");
  almost(entropie(zeile3), 1.352899374725, 1e-9, "Entropie Kopf 3");
  assert.ok(entropie(zeile3) > entropie(zeile1), "der breite Kopf hat die größere Entropie");
});

test("exp-multi-head: Farbfläche und Zahlen passen zusammen", () => {
  const result = multiHead.calculate({ kopf: "kopf-1", zeile: 1 });
  almost(wert(result, "Größtes Gewicht der Zeile"), 0.727384627476, 1e-9, "größtes Gewicht");
  almost(wert(result, "Entropie der Zeile"), 0.874758723707, 1e-9, "Entropie");
  almost(wert(result, "Summe der Zeile"), 1, 1e-12, "Summe der Zeile");
  assert.equal(result.drawing.kind, "grid");
  if (result.drawing.kind === "grid") {
    assert.equal(result.drawing.cols, 4);
    assert.equal(result.drawing.rows, 4);
    assert.equal(result.drawing.style, "anteil");
    assert.equal(result.drawing.cells.length, 16, "vier mal vier Zellen");
    // Zeilenreihenfolge: Zeile 1, Spalte 2 muss das größte Gewicht tragen.
    const zelle = result.drawing.cells.find((c) => c.row === 1 && c.col === 2);
    assert.ok(zelle, "Zelle (1|2) fehlt");
    almost(zelle.value, 0.727384627476, 1e-9, "Zellwert");
  }
});

test("exp-transformer: die Normen der vier Schritte", () => {
  // Nachgerechnet: 3,7749 / 5,0000 / 1,2481 / 1,3029 / 5,0393.
  const d = durchlauf();
  almost(norm(d.eingabe), 3.774917217635, 1e-9, "Norm der Eingabe");
  almost(norm(d.nachNorm), 4.999990237385, 1e-9, "Norm nach der Normierung");
  almost(norm(d.nachAufmerksamkeit), 1.248147848156, 1e-9, "Norm nach der Aufmerksamkeit");
  almost(norm(d.nachVorwaertsnetz), 1.302869584528, 1e-9, "Norm nach dem Vorwärtsnetz");
  almost(norm(d.nachRestverbindung), 5.039311027155, 1e-9, "Norm nach der Restverbindung");
});

test("exp-transformer: Zahlen und Säulen des gewählten Schrittes", () => {
  const normierung = transformer.calculate({ schritt: "norm" });
  almost(wert(normierung, "Norm des Vektors"), 4.999990237385, 1e-9, "Norm danach");
  almost(wert(normierung, "Norm vor dem Schritt"), 3.774917217635, 1e-9, "Norm davor");
  almost(wert(normierung, "Änderung der Norm"), 1.225073019749, 1e-9, "Änderung");
  assert.equal(normierung.drawing.kind, "bars");
  if (normierung.drawing.kind === "bars") {
    assert.equal(normierung.drawing.items.length, 4, "vier Merkmale als Säulen");
    const viertes = normierung.drawing.items[3];
    assert.ok(viertes, "Säule fehlt");
    almost(viertes.value, 4.148105380474, 1e-9, "Merkmal 4 nach der Normierung");
    almost(viertes.ghost ?? 0, 3, 1e-12, "Merkmal 4 vor der Normierung");
  }

  const aufmerksamkeit = transformer.calculate({ schritt: "attention" });
  almost(wert(aufmerksamkeit, "Norm des Vektors"), 1.248147848156, 1e-9, "Norm danach");
  almost(wert(aufmerksamkeit, "Änderung der Norm"), -3.751842389229, 1e-9, "Änderung");

  const rest = transformer.calculate({ schritt: "rest" });
  almost(wert(rest, "Norm des Vektors"), 5.039311027155, 1e-9, "Norm danach");
  almost(wert(rest, "Norm vor dem Schritt"), 3.774917217635, 1e-9, "Norm davor");

  // Die Gewichte der Aufmerksamkeit über den festen Speicher.
  const d = durchlauf();
  const gewichteErwartet = [0.784676489848, 0.060482592688, 0.154840917464];
  gewichteErwartet.forEach((e, i) => almost(d.gewichte[i] ?? 0, e, 1e-9, `Gewicht ${i}`));
  almost(
    d.gewichte.reduce((a, b) => a + b, 0),
    1,
    1e-12,
    "Summe der Aufmerksamkeitsgewichte",
  );

  // Alle Komponenten bleiben positiv, damit die Säulen sichtbar sind.
  for (const v of [d.eingabe, d.nachNorm, d.nachAufmerksamkeit, d.nachVorwaertsnetz]) {
    assert.ok(Math.min(...v) >= 0, `Komponente ist negativ: ${v.join(", ")}`);
  }
});

test("exp-tokenisierung: Zerlegung eines Satzes mit Nummern", () => {
  const tokens = zerlege("Der Hund jagt die Katze.");
  assert.deepEqual(
    tokens.map((t) => t.text),
    ["Der", "Hund", "jagt", "die", "Katze", "."],
  );
  assert.deepEqual(
    tokens.map((t) => t.id),
    [1, 4, 6, 2, 5, 100],
    "Nummern aus Wörterbuch und Satzzeichen",
  );
  assert.equal(tokens.filter((t) => t.stueck).length, 0, "kein Wort muss zerlegt werden");
});

test("exp-tokenisierung: unbekannte Wörter werden in Stücke zerlegt", () => {
  const tokens = zerlege("Ein Modell liest den Text und zerlegt ihn in Tokens.");
  assert.equal(tokens.length, 13, "13 Tokens");
  const stuecke = tokens.filter((t) => t.stueck);
  assert.deepEqual(
    stuecke.map((t) => t.text),
    ["i", "h", "n"],
    "ihn wird zu i, h und n",
  );
  almost(anteilStuecke("s3"), (3 / 13) * 100, 1e-12, "Anteil der Stücke");

  const vierter = zerlege("Heute scheint die Sonne, und das Kind lernt.");
  assert.equal(vierter.length, 13, "13 Tokens");
  assert.deepEqual(
    vierter.filter((t) => t.stueck).map((t) => t.text),
    ["l", "er", "n", "t"],
    "lernt wird zu l, er, n und t",
  );
});

test("exp-tokenisierung: Zahlen und Balken des Beispielsatzes", () => {
  const result = tokenisierung.calculate({ satz: "s1" });
  almost(wert(result, "Anzahl Tokens"), 6, 1e-12, "Anzahl Tokens");
  almost(wert(result, "Anzahl Wörter"), 5, 1e-12, "Anzahl Wörter");
  almost(wert(result, "Tokens je Wort"), 1.2, 1e-12, "Tokens je Wort");
  almost(wert(result, "Anteil aus Stücken"), 0, 1e-12, "Anteil aus Stücken");
  assert.equal(result.drawing.kind, "bars");
  if (result.drawing.kind === "bars") {
    assert.equal(result.drawing.horizontal, true, "waagerechte Balken");
    assert.equal(result.drawing.items.length, 6, "ein Balken je Token");
    const katze = result.drawing.items[4];
    assert.ok(katze, "Balken fehlt");
    assert.equal(katze.label, "Katze (5)", "Token mit Nummer beschriftet");
    assert.equal(katze.value, 5, "Länge in Zeichen");
  }

  const dritter = tokenisierung.calculate({ satz: "s3" });
  almost(wert(dritter, "Anzahl Tokens"), 13, 1e-12, "Anzahl Tokens");
  almost(wert(dritter, "Anteil aus Stücken"), (3 / 13) * 100, 1e-12, "Anteil aus Stücken");
});

test("lek-26: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek26, "app/src/model/lessons/lek-26.ts", ["exp-qkv"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-27: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek27, "app/src/model/lessons/lek-27.ts", ["exp-multi-head"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-28: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek28, "app/src/model/lessons/lek-28.ts", ["exp-transformer"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-29: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek29, "app/src/model/lessons/lek-29.ts", ["exp-tokenisierung"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});
