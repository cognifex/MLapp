/**
 * Referenzwerte und Schemaprüfung der Lektionen 30 bis 33 (Softmax, Sprachmodell, Sampling,
 * Sprachmodelltraining).
 *
 * Alle Erwartungswerte stammen aus der Handrechnung, nachgerechnet mit python3 (Softmax mit
 * Temperatur, Entropie, Kreuzentropie und die Wirkung eines Gradientenschritts) und hier
 * festgenagelt. Ändert jemand einen Rechenkern, fällt es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  entropie,
  softmax,
  softmaxMitTemperatur,
  summe,
} from "../app/src/experiment/exp-softmax.js";
import {
  entropie as entropieSprachmodell,
  sprachmodell,
  verteilung,
  wahrscheinlichster,
} from "../app/src/experiment/exp-sprachmodell.js";
import { auswahl, sampling, wahrscheinlichkeiten } from "../app/src/experiment/exp-sampling.js";
import {
  TOKENS,
  einSchritt,
  kreuzentropie,
  mehrereSchritte,
  sprachmodelltraining,
  verteilungAus,
} from "../app/src/experiment/exp-sprachmodelltraining.js";
import { lek30 } from "../app/src/model/lessons/lek-30.js";
import { lek31 } from "../app/src/model/lessons/lek-31.js";
import { lek32 } from "../app/src/model/lessons/lek-32.js";
import { lek33 } from "../app/src/model/lessons/lek-33.js";
import { validateLesson } from "../app/src/model/validate.js";

const EXPERIMENTE = ["exp-softmax", "exp-sprachmodell", "exp-sampling", "exp-sprachmodelltraining"];

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

function summeVon(werte: number[]): number {
  return werte.reduce((a, b) => a + b, 0);
}

test("Softmax: Referenzwerte mit Temperatur", () => {
  // Nachgerechnet: softmax([2,1,0]) = 7,3891 / 11,1073 usw.
  const p1 = softmaxMitTemperatur([2, 1, 0], 1);
  fast(p1[0] ?? 0, 0.6652409557748218);
  fast(p1[1] ?? 0, 0.24472847105479764);
  fast(p1[2] ?? 0, 0.09003057317038046);
  fast(summe(p1), 1, 1e-12, "Summe der Verteilung");

  // Temperatur 0,5 schärft: 0,8668 / 0,1173 / 0,0159
  const scharf = softmaxMitTemperatur([2, 1, 0], 0.5);
  fast(scharf[0] ?? 0, 0.8668133321973347);
  fast(scharf[1] ?? 0, 0.11731042782619835);
  fast(scharf[2] ?? 0, 0.015876239976466762);

  // Temperatur 2 flacht ab: 0,5065 / 0,3072 / 0,1863
  const flach = softmaxMitTemperatur([2, 1, 0], 2);
  fast(flach[0] ?? 0, 0.506480391055654);
  fast(flach[1] ?? 0, 0.3071958857184984);
  fast(flach[2] ?? 0, 0.1863237232258476);

  // Verschieben aller Logits ändert die Verteilung nicht.
  const verschoben = softmaxMitTemperatur([4, 3, 2], 1);
  fast(verschoben[0] ?? 0, p1[0] ?? 0);

  // Gleiche Logits ergeben die Gleichverteilung.
  const gleich = softmaxMitTemperatur([1, 1, 1], 1);
  fast(gleich[0] ?? 0, 1 / 3);
  fast(summe(gleich), 1, 1e-12);
});

test("Entropie: Referenzwerte in nat", () => {
  fast(entropie(softmaxMitTemperatur([2, 1, 0], 1)), 0.8323955818399389);
  fast(entropie(softmaxMitTemperatur([2, 1, 0], 0.5)), 0.44105744405816344);
  fast(entropie(softmaxMitTemperatur([2, 1, 0], 2)), 1.0201913367268314);
  // Gleichverteilung über drei Klassen: ln 3 = 1,0986
  fast(entropie(softmaxMitTemperatur([1, 1, 1], 1)), Math.log(3));
});

test("exp-softmax: Zahlen und Säulen stammen aus derselben Rechnung", () => {
  const r = softmax.calculate({ z1: 2, z2: 1, z3: 0, temperatur: 1 });
  fast(wert(r, "Summe der Wahrscheinlichkeiten"), 1, 1e-12, "Summe muss eins ergeben");
  fast(wert(r, "Entropie"), 0.8323955818399389);
  fast(wert(r, "Größte Wahrscheinlichkeit"), 0.6652409557748218);

  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    assert.equal(r.drawing.items.length, 3);
    const ersteSaeule = r.drawing.items[0];
    assert.ok(ersteSaeule, "erste Säule fehlt");
    fast(ersteSaeule.value, wert(r, "Größte Wahrscheinlichkeit"));
    assert.equal(ersteSaeule.highlighted, true, "die größte Klasse ist hervorgehoben");
    assert.equal(r.drawing.items.filter((i) => i.highlighted).length, 1);
  }

  const scharf = softmax.calculate({ z1: 2, z2: 1, z3: 0, temperatur: 0.2 });
  fast(wert(scharf, "Entropie"), 0.04067412954243116);
  fast(wert(scharf, "Summe der Wahrscheinlichkeiten"), 1, 1e-12);

  const flach = softmax.calculate({ z1: 2, z2: 1, z3: 0, temperatur: 2 });
  fast(wert(flach, "Entropie"), 1.0201913367268314);
  assert.ok(
    wert(flach, "Entropie") > wert(r, "Entropie"),
    "höhere Temperatur ergibt höhere Entropie",
  );

  const gleich = softmax.calculate({ z1: 1, z2: 1, z3: 1, temperatur: 1 });
  fast(wert(gleich, "Entropie"), Math.log(3));
  fast(wert(gleich, "Summe der Wahrscheinlichkeiten"), 1, 1e-12);
});

test("exp-sprachmodell: bedingte Verteilungen aus dem Korpus", () => {
  const hund = sprachmodell.calculate({ kontext: "hund" });
  fast(wert(hund, "Summe der Wahrscheinlichkeiten"), 1, 1e-12);
  fast(wert(hund, "Beobachtungen im Korpus"), 100);
  fast(wert(hund, "Anzahl der Kandidaten"), 4);
  fast(wert(hund, "Größte Wahrscheinlichkeit"), 0.45);
  fast(wert(hund, "Entropie"), 1.2689973949785274);

  const katze = sprachmodell.calculate({ kontext: "katze" });
  fast(wert(katze, "Größte Wahrscheinlichkeit"), 0.4);
  fast(wert(katze, "Entropie"), 1.2798542258336674);
  fast(wert(katze, "Summe der Wahrscheinlichkeiten"), 1, 1e-12);

  const regen = sprachmodell.calculate({ kontext: "regen" });
  fast(wert(regen, "Größte Wahrscheinlichkeit"), 0.55);
  fast(wert(regen, "Entropie"), 1.165524439934698);

  // 55 von 100 beziehungsweise 45 von 100 - die Verteilung entsteht aus Zählungen.
  const regenVerteilt = verteilung("regen");
  fast(regenVerteilt[0]?.wahrscheinlichkeit ?? 0, 0.55);
  fast(verteilung("hund")[0]?.wahrscheinlichkeit ?? 0, 0.45);
  assert.equal(wahrscheinlichster("regen").token, "fällt");
  assert.equal(wahrscheinlichster("katze").token, "schlafen");
  fast(entropieSprachmodell("regen"), 1.165524439934698);

  assert.equal(regen.drawing.kind, "bars");
  if (regen.drawing.kind === "bars") {
    assert.equal(regen.drawing.items.length, 4);
    assert.equal(regen.drawing.items[0]?.label, "fällt");
    assert.equal(regen.drawing.items[0]?.highlighted, true);
  }
});

test("exp-sampling: Temperatur formt die Verteilung, die Summe bleibt eins", () => {
  const p1 = wahrscheinlichkeiten(1);
  fast(p1[0] ?? 0, 0.5743174514827828);
  fast(p1[1] ?? 0, 0.21127958310649309);
  fast(p1[2] ?? 0, 0.1281475449253914);
  fast(p1[3] ?? 0, 0.04714284721464529);
  fast(p1[4] ?? 0, 0.028593582221830692);
  fast(p1[5] ?? 0, 0.01051899104885676);
  fast(summeVon(p1), 1, 1e-12, "Summe der Verteilung");

  const p05 = wahrscheinlichkeiten(0.5);
  fast(p05[0] ?? 0, 0.8370480735771543);
  fast(p05[1] ?? 0, 0.11328213812022521);
  fast(p05[2] ?? 0, 0.04167416966637459);
  fast(p05[4] ?? 0, 0.0020748347343537534);
  fast(summeVon(p05), 1, 1e-12);

  const p2 = wahrscheinlichkeiten(2);
  fast(p2[0] ?? 0, 0.36712505926423594);
  fast(p2[5] ?? 0, 0.049684973878783595);
});

test("exp-sampling: Top-k und Top-p schneiden ab und skalieren um", () => {
  const p = wahrscheinlichkeiten(1);

  const nurEins = auswahl(p, 1, 1);
  assert.deepEqual(nurEins.behalten, [0]);
  fast(nurEins.masse, 0.5743174514827828);
  fast(nurEins.umskaliert[0] ?? 0, 1);

  const drei = auswahl(p, 3, 0.9);
  assert.deepEqual(drei.behalten, [0, 1, 2]);
  fast(drei.masse, 0.9137445795146673);
  fast(drei.umskaliert[0] ?? 0, 0.6285317192117624);
  fast(drei.umskaliert[1] ?? 0, 0.2312238976221491);
  fast(drei.umskaliert[2] ?? 0, 0.14024438316608848);
  fast(summeVon(drei.umskaliert), 1, 1e-12, "umskalierte Summe");

  const alles = auswahl(p, 6, 1);
  assert.equal(alles.behalten.length, 6);
  fast(alles.masse, 1, 1e-12, "ohne Schnitt ist die Masse eins");

  // Bei Temperatur 0,5 trägt der erste Token schon mehr als 0,9 der Masse.
  const scharf = auswahl(wahrscheinlichkeiten(0.5), 3, 0.9);
  assert.deepEqual(scharf.behalten, [0, 1]);
  fast(scharf.masse, 0.9503302116973795);
  fast(scharf.umskaliert[0] ?? 0, 0.8807970779778824);
});

test("exp-sampling: Zeichnung trennt behaltene von abgeschnittenen Tokens", () => {
  const r = sampling.calculate({ temperatur: 1, topK: 3, topP: 0.9 });
  fast(wert(r, "Behaltene Tokens"), 3);
  fast(wert(r, "Abgeschnittene Tokens"), 3);
  fast(wert(r, "Wahrscheinlichkeitssumme der behaltenen Tokens"), 0.9137445795146673);
  fast(wert(r, "Summe nach der Umskalierung"), 1, 1e-12);

  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    const behalten = r.drawing.items.filter((item) => item.highlighted === true);
    assert.equal(behalten.length, 3);
    if (behalten[0]) fast(behalten[0].value, 0.6285317192117624);
    if (behalten[1]) fast(behalten[1].value, 0.2312238976221491);

    const abgeschnitten = r.drawing.items.filter((item) => item.value === 0);
    assert.equal(abgeschnitten.length, 3);
    if (abgeschnitten[0]) {
      fast(abgeschnitten[0].ghost ?? 0, 0.04714284721464529, 1e-12, "Geistwert sonne");
      assert.equal(abgeschnitten[0].label, "sonne");
    }
    if (abgeschnitten[2]) fast(abgeschnitten[2].ghost ?? 0, 0.01051899104885676, 1e-12);
  }

  const ohneSchnitt = sampling.calculate({ temperatur: 1, topK: 6, topP: 1 });
  fast(wert(ohneSchnitt, "Behaltene Tokens"), 6);
  fast(wert(ohneSchnitt, "Abgeschnittene Tokens"), 0);
  fast(wert(ohneSchnitt, "Summe nach der Umskalierung"), 1, 1e-12);
});

test("Sprachmodelltraining: Kreuzentropie und ein Gradientenschritt", () => {
  assert.deepEqual(TOKENS, ["bellen", "laufen", "schlafen"]);
  const vorher = verteilungAus([1, 0.5, 0]);
  fast(vorher[0] ?? 0, 0.506480391055654);
  fast(vorher[1] ?? 0, 0.3071958857184984);
  fast(vorher[2] ?? 0, 0.1863237232258476);
  fast(kreuzentropie(vorher, 0), 0.6802696706417346, 1e-12, "Ziel bellen");
  fast(kreuzentropie(vorher, 1), 1.1802696706417346, 1e-12, "Ziel laufen");
  fast(kreuzentropie(vorher, 2), 1.6802696706417346, 1e-12, "Ziel schlafen");

  // Ein Schritt mit Lernrate 0,5: z_i - 0,5 · (p_i - y_i)
  const nachher = einSchritt([1, 0.5, 0], 0, 0.5);
  fast(nachher[0] ?? 0, 1.246759804472173);
  fast(nachher[1] ?? 0, 0.3464020571407508);
  fast(nachher[2] ?? 0, -0.0931618616129238);

  const p1 = verteilungAus(nachher);
  fast(p1[0] ?? 0, 0.599416018707452);
  fast(p1[1] ?? 0, 0.2436171977752529);
  fast(p1[2] ?? 0, 0.15696678351729523);
  fast(kreuzentropie(p1, 0), 0.5117993998863456);
  assert.ok(kreuzentropie(p1, 0) < kreuzentropie(vorher, 0), "der Verlust sinkt");

  // Die Lernrate skaliert den Schritt: halbe Lernrate, halbe Verschiebung.
  const schwach = einSchritt([1, 0.5, 0], 0, 0.25);
  fast(schwach[0] ?? 0, 1.1233799022360864);
  fast(mehrereSchritte([1, 0.5, 0], 0, 0.5, 1)[0] ?? 0, 1.246759804472173);
  fast(mehrereSchritte([1, 0.5, 0], 0, 0.5, 20)[0] ?? 0, 2.738705223071059, 1e-9);
});

test("exp-sprachmodelltraining: Kreuzentropie vorher und nachher", () => {
  const r = sprachmodelltraining.calculate({ ziel: "bellen", lernrate: 0.5, schritte: 1 });
  fast(wert(r, "Kreuzentropie vorher"), 0.6802696706417346);
  fast(wert(r, "Kreuzentropie nachher"), 0.5117993998863456);
  fast(wert(r, "Verringerung"), 0.168470270755389);
  fast(wert(r, "Wahrscheinlichkeit des Ziel-Tokens nachher"), 0.599416018707452);

  const klein = sprachmodelltraining.calculate({ ziel: "bellen", lernrate: 0.05, schritte: 1 });
  fast(wert(klein, "Kreuzentropie nachher"), 0.6618174785750202);
  assert.ok(
    wert(klein, "Verringerung") < wert(r, "Verringerung"),
    "kleinere Lernrate, kleinerer Schritt",
  );

  const viele = sprachmodelltraining.calculate({ ziel: "bellen", lernrate: 1, schritte: 20 });
  fast(wert(viele, "Kreuzentropie nachher"), 0.032810255765, 1e-9, "20 Schritte");
  fast(wert(viele, "Kreuzentropie vorher"), 0.6802696706417346);

  const zielHinten = sprachmodelltraining.calculate({
    ziel: "schlafen",
    lernrate: 0.5,
    schritte: 1,
  });
  fast(wert(zielHinten, "Kreuzentropie vorher"), 1.6802696706417346);
  fast(wert(zielHinten, "Kreuzentropie nachher"), 1.2078228265982212);
});

test("exp-sprachmodelltraining: die Zeichnung zeigt vorher als Geist", () => {
  const r = sprachmodelltraining.calculate({ ziel: "laufen", lernrate: 0.5, schritte: 1 });
  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    assert.equal(r.drawing.items.length, 3);
    assert.equal(r.drawing.items.filter((item) => item.highlighted === true).length, 1);
    const ziel = r.drawing.items[1];
    assert.ok(ziel, "Ziel-Säule fehlt");
    assert.equal(ziel.highlighted, true, "das Ziel-Token ist hervorgehoben");
    fast(ziel.ghost ?? 0, 0.3071958857184984, 1e-12, "Wahrscheinlichkeit vorher");
    assert.ok(ziel.value > (ziel.ghost ?? 0), "das Ziel-Token gewinnt Masse");
    const andere = r.drawing.items[0];
    assert.ok(andere, "erste Säule fehlt");
    assert.ok(andere.value < (andere.ghost ?? 0), "die anderen Tokens verlieren Masse");
  }
});

test("lek-30: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek30, "app/src/model/lessons/lek-30.ts", EXPERIMENTE);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-31: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek31, "app/src/model/lessons/lek-31.ts", EXPERIMENTE);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-32: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek32, "app/src/model/lessons/lek-32.ts", EXPERIMENTE);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-33: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek33, "app/src/model/lessons/lek-33.ts", EXPERIMENTE);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});
