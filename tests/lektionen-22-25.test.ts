/**
 * Fachliche Pruefungen der Lektionen 22 bis 25.
 *
 * Die Referenzwerte sind von Hand nachgerechnet (python3) und hier festgenagelt: der
 * Rekonstruktionsfehler des Beispielbildes, Stichproben, Mittel und Streuung der
 * Latentverteilung, der Verlauf des rekurrenten Zustands und die Gewichte der
 * Attention-Matrix. Dazu je Lektion eine Schemapruefung mit validateLesson.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  autoencoder,
  BILD,
  groessterFehler,
  mittlererFehler,
  rekonstruiere,
} from "../app/src/experiment/exp-autoencoder.js";
import { stichproben, vae } from "../app/src/experiment/exp-vae.js";
import { sequenzen, verlauf } from "../app/src/experiment/exp-sequenzen.js";
import { attention, gewichteZeile } from "../app/src/experiment/exp-attention.js";
import { lek22 } from "../app/src/model/lessons/lek-22.js";
import { lek23 } from "../app/src/model/lessons/lek-23.js";
import { lek24 } from "../app/src/model/lessons/lek-24.js";
import { lek25 } from "../app/src/model/lessons/lek-25.js";
import { validateLesson } from "../app/src/model/validate.js";

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

function almost(actual: number, expected: number, tolerance = 1e-9, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: erwartet ${expected}, erhalten ${actual}`,
  );
}

test("exp-autoencoder: Referenzwerte des Beispielbildes mit vier Zahlen", () => {
  const r = autoencoder.calculate({ ansicht: "eingabe", engpass: 4 });
  almost(wert(r, "Mittlerer Fehler"), 0.09140625, 1e-12, "vier gespeicherte Zahlen");
  almost(wert(r, "Größter Einzelfehler"), 0.625, 1e-12);
  almost(wert(r, "Gespeicherte Zahlen"), 4, 1e-12);
  almost(wert(r, "Werte im Bild"), 16, 1e-12);
  // Der Code sind die Skalarprodukte mit den ersten vier Mustern.
  almost(mittlererFehler(BILD, 2), 0.141484375, 1e-12, "zwei Zahlen");
  almost(mittlererFehler(BILD, 8), 0.0375, 1e-12, "acht Zahlen");
});

test("exp-autoencoder: eine einzige Zahl ergibt den Mittelwert des Bildes", () => {
  const r = autoencoder.calculate({ ansicht: "rekonstruktion", engpass: 1 });
  almost(wert(r, "Mittlerer Fehler"), 0.1587109375, 1e-12, "Summe 7,3 geteilt durch 16 Bildpunkte");
  almost(wert(r, "Größter Einzelfehler"), 0.45625, 1e-12);
  for (const punkt of rekonstruiere(BILD, 1)) {
    almost(punkt, 0.45625, 1e-12, "jeder Bildpunkt traegt den Mittelwert");
  }
});

test("exp-autoencoder: alle sechzehn Zahlen rekonstruieren das Bild", () => {
  almost(mittlererFehler(BILD, 16), 0, 1e-15, "Restfehler ist nur Rundung");
  almost(groessterFehler(BILD, 16), 0, 1e-12);
  const zurueck = rekonstruiere(BILD, 16);
  zurueck.forEach((punkt, i) => almost(punkt, BILD[i] ?? Number.NaN, 1e-12, `Bildpunkt ${i}`));
});

test("exp-autoencoder: die Zeichnung folgt der gewaehlten Ansicht", () => {
  const eingabe = autoencoder.calculate({ ansicht: "eingabe", engpass: 4 });
  assert.equal(eingabe.drawing.kind, "grid");
  if (eingabe.drawing.kind === "grid") {
    assert.equal(eingabe.drawing.style, "grau");
    assert.equal(eingabe.drawing.cells.length, 16);
    almost(eingabe.drawing.cells[0]?.value ?? -1, 0.9, 1e-12, "erster Bildpunkt");
  }
  const rekonstruktion = autoencoder.calculate({ ansicht: "rekonstruktion", engpass: 1 });
  assert.equal(rekonstruktion.drawing.kind, "grid");
  if (rekonstruktion.drawing.kind === "grid") {
    assert.equal(rekonstruktion.drawing.cells.length, 16);
    for (const zelle of rekonstruktion.drawing.cells) {
      almost(zelle.value, 0.45625, 1e-12, `Zelle ${zelle.row}/${zelle.col}`);
    }
  }
});

test("exp-vae: Referenzwerte der acht Stichproben", () => {
  const r = vae.calculate({ mu: 0.5, sigma: 1, anzahl: 8 });
  almost(wert(r, "Mittel der Stichproben"), 0.5625, 1e-12);
  almost(wert(r, "Streuung der Stichproben"), 0.8905721475545931, 1e-12);
  almost(wert(r, "Vorgabe Mittel"), 0.5, 1e-12);
  almost(wert(r, "Vorgabe Streuung"), 1, 1e-12);
  almost(wert(r, "Abweichung des Mittels"), 0.0625, 1e-12);

  const erwartet = [-0.78, -0.36, -0.04, 0.34, 0.72, 1.11, 1.52, 1.99];
  const gezogen = stichproben(0.5, 1, 8);
  assert.equal(gezogen.length, erwartet.length);
  gezogen.forEach((v, i) => almost(v, erwartet[i] ?? Number.NaN, 1e-12, `Stichprobe ${i + 1}`));
});

test("exp-vae: die Saeulen zaehlen die Stichproben je Intervall", () => {
  const r = vae.calculate({ mu: 0.5, sigma: 1, anzahl: 8 });
  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    assert.deepEqual(
      r.drawing.items.map((i) => i.value),
      [0, 0, 0, 3, 4, 1, 0, 0],
    );
    assert.deepEqual(
      r.drawing.items.map((i) => i.label),
      ["-5,0", "-3,5", "-2,0", "-0,5", "1,0", "2,5", "4,0", "5,5"],
    );
    assert.ok(
      r.drawing.items.some((i) => i.highlighted === true),
      "das volle Intervall ist hervorgehoben",
    );
  }
});

test("exp-vae: doppelte Streuung dehnt die Stichproben", () => {
  const einfach = vae.calculate({ mu: 0.5, sigma: 1, anzahl: 8 });
  const doppelt = vae.calculate({ mu: 0.5, sigma: 2, anzahl: 8 });
  almost(wert(doppelt, "Streuung der Stichproben"), 1.7811442951091863, 1e-12);
  almost(wert(doppelt, "Mittel der Stichproben"), 0.625, 1e-12);
  assert.ok(
    wert(doppelt, "Streuung der Stichproben") > wert(einfach, "Streuung der Stichproben"),
    "die Streuung waechst mit dem Regler",
  );
  if (doppelt.drawing.kind === "bars" && einfach.drawing.kind === "bars") {
    assert.notDeepEqual(
      doppelt.drawing.items.map((i) => i.value),
      einfach.drawing.items.map((i) => i.value),
      "die Verteilung auf die Intervalle aendert sich",
    );
  }
  // Mittel -3 und Streuung 2 schieben alle acht Stichproben nach links.
  const links = vae.calculate({ mu: -3, sigma: 2, anzahl: 8 });
  almost(wert(links, "Mittel der Stichproben"), -2.875, 1e-12);
  if (links.drawing.kind === "bars") {
    assert.deepEqual(
      links.drawing.items.map((i) => i.value),
      [2, 2, 2, 2, 0, 0, 0, 0],
    );
  }
});

test("exp-sequenzen: Verlauf und Endwert nach sechs Schritten", () => {
  const r = sequenzen.calculate({ folge: "konstant", gewicht: 0.8, schritte: 6 });
  almost(wert(r, "Zustand nach n Schritten"), 3.68928, 1e-12, "h6 bei w = 0,8");
  almost(wert(r, "Zustand einen Schritt davor"), 3.3616, 1e-12, "h5 bei w = 0,8");
  almost(wert(r, "Summe der Eingaben"), 6, 1e-12);
  almost(wert(r, "Gewicht w"), 0.8, 1e-12);

  const erwartet = [1, 1.8, 2.44, 2.952, 3.3616, 3.68928];
  const gerechnet = verlauf(0.8, [1, 1, 1, 1, 1, 1], 6);
  assert.equal(gerechnet.length, erwartet.length);
  gerechnet.forEach((v, i) => almost(v, erwartet[i] ?? Number.NaN, 1e-12, `Schritt ${i + 1}`));
});

test("exp-sequenzen: die Saeulen zeigen den Zustand je Schritt", () => {
  const r = sequenzen.calculate({ folge: "impuls", gewicht: 0.2, schritte: 6 });
  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    assert.equal(r.drawing.horizontal, true);
    assert.equal(r.drawing.items.length, 6);
    const saeulen = r.drawing.items;
    assert.deepEqual(
      saeulen.map((i) => i.label),
      ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4", "Schritt 5", "Schritt 6"],
    );
    [1, 0.2, 0.04, 0.008, 0.0016, 0.00032].forEach((v, i) =>
      almost(saeulen[i]?.value ?? Number.NaN, v, 1e-12, `Saeule ${i + 1}`),
    );
    assert.equal(saeulen[5]?.highlighted, true, "der letzte Schritt ist hervorgehoben");
  }
});

test("exp-sequenzen: Gewicht eins haelt jede Eingabe fest", () => {
  const konstanteEins = sequenzen.calculate({ folge: "konstant", gewicht: 1, schritte: 6 });
  almost(wert(konstanteEins, "Zustand nach n Schritten"), 6, 1e-12, "sechs Einsen summieren sich");
  const impuls = sequenzen.calculate({ folge: "impuls", gewicht: 1, schritte: 6 });
  almost(wert(impuls, "Zustand nach n Schritten"), 1, 1e-12, "der Impuls bleibt stehen");
  // Ueber eins waechst der Zustand ohne neue Eingabe weiter.
  const aufschaukeln = sequenzen.calculate({ folge: "puls", gewicht: 1.4, schritte: 6 });
  almost(wert(aufschaukeln, "Zustand nach n Schritten"), 11.61984, 1e-12);
});

test("exp-attention: Gewichte der Zeile bellt", () => {
  const r = attention.calculate({ abfrage: 3 });
  almost(wert(r, "Größtes Gewicht"), 0.5011809601713797, 1e-12, "Hund");
  almost(wert(r, "Kleinstes Gewicht"), 0.0745870749246064, 1e-12, "der");
  almost(wert(r, "Gewicht auf sich selbst"), 0.23733371569463188, 1e-12);
  almost(wert(r, "Summe der Gewichte"), 1, 1e-12);

  const zeile = gewichteZeile(2);
  [
    0.5011809601713797, 0.09064649160600685, 0.23733371569463188, 0.09625175760337526,
    0.0745870749246064,
  ].forEach((v, j) => almost(zeile[j] ?? Number.NaN, v, 1e-12, `Spalte ${j + 1}`));
});

test("exp-attention: jede Zeile ist eine Verteilung", () => {
  for (let i = 0; i < 5; i += 1) {
    const zeile = gewichteZeile(i);
    const summe = zeile.reduce((a, b) => a + b, 0);
    almost(summe, 1, 1e-12, `Zeilensumme ${i + 1}`);
    assert.ok(
      zeile.every((p) => p > 0),
      `Zeile ${i + 1} hat nur positive Gewichte`,
    );
  }
  // Eigene Einbettung ist sich selbst am aehnlichsten: das groesste Gewicht zeigt auf das Token.
  const hund = attention.calculate({ abfrage: 1 });
  almost(wert(hund, "Größtes Gewicht"), 0.7053421367262703, 1e-12);
  almost(wert(hund, "Gewicht auf sich selbst"), 0.7053421367262703, 1e-12);
});

test("exp-attention: ein Funktionswort verteilt seine Gewichte", () => {
  const r = attention.calculate({ abfrage: 5 });
  almost(wert(r, "Größtes Gewicht"), 0.2066461127360684, 1e-11, "der");
  almost(wert(r, "Kleinstes Gewicht"), 0.18683161000520643, 1e-11);
  assert.ok(
    wert(r, "Größtes Gewicht") - wert(r, "Kleinstes Gewicht") < 0.05,
    "die Gewichte liegen dicht beieinander",
  );
});

test("exp-attention: die Zeichnung traegt die Gewichte als Zellbeschriftungen", () => {
  const r = attention.calculate({ abfrage: 3 });
  assert.equal(r.drawing.kind, "grid");
  if (r.drawing.kind === "grid") {
    assert.equal(r.drawing.style, "anteil");
    assert.equal(r.drawing.cols, 5);
    assert.equal(r.drawing.rows, 5);
    assert.equal(r.drawing.cells.length, 25);
    const zelle = r.drawing.cells.find((c) => c.row === 2 && c.col === 0);
    assert.ok(zelle, "Zelle der Abfrage bellt auf Hund fehlt");
    almost(zelle.value, 0.5011809601713797, 1e-12);
    assert.equal(zelle.label, "0,50");
    assert.ok(
      r.drawing.cells.every((c) => typeof c.label === "string" && c.label.length > 0),
      "jede Zelle traegt ihr Gewicht",
    );
    const punkt = r.drawing.points?.[0];
    assert.ok(punkt, "Markierung der Abfragezeile fehlt");
    almost(punkt.y, 2.5, 1e-12, "Zeile der Abfrage bellt");
  }
});

test("lek-22: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek22, "app/src/model/lessons/lek-22.ts", ["exp-autoencoder"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-23: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek23, "app/src/model/lessons/lek-23.ts", ["exp-vae"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-24: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek24, "app/src/model/lessons/lek-24.ts", ["exp-sequenzen"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-25: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek25, "app/src/model/lessons/lek-25.ts", ["exp-attention"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-22 bis lek-25: jeder Abschnitt hat sichtbaren Inhalt und Sprechfassung", () => {
  for (const lektion of [lek22, lek23, lek24, lek25]) {
    assert.ok(lektion.sections.length >= 7, `${lektion.id}: zu wenige Abschnitte`);
    for (const abschnitt of lektion.sections) {
      assert.ok(abschnitt.visual, `${abschnitt.id}: visual fehlt`);
      assert.ok(abschnitt.spoken.length > 0, `${abschnitt.id}: Sprechfassung fehlt`);
    }
    const experimente = lektion.sections.filter((s) => s.kind === "experiment");
    assert.equal(experimente.length, 1, `${lektion.id}: genau ein Experiment erwartet`);
    const erster = lektion.sections.find((s) => s.kind === "experiment");
    assert.ok(erster, `${lektion.id}: kein Experimentabschnitt`);
    const visual = erster.visual;
    assert.ok(
      visual.type === "experiment",
      `${lektion.id}: die Zeichnung verweist nicht auf das Experiment`,
    );
    assert.equal(
      erster.experimentId,
      visual.experimentId,
      `${lektion.id}: Abschnitt und Zeichnung nennen dasselbe Experiment`,
    );
  }
});
