/**
 * Referenzwerte und Schema-Pruefung fuer die Lektionen 42 bis 44.
 *
 * Die Werte in den Kommentaren sind mit python3 nachgerechnet und werden hier festgenagelt:
 * ein Actor-Critic-Schritt, acht Actor-Critic-Schritte, ein Praeferenz-Update, ein Durchlauf
 * durch den Mini-Transformer samt Softmax und Entropie. Aendert jemand die Rechenkerne, faellt
 * es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Bar, Calculated } from "../app/src/model/types.js";
import {
  actorCritic,
  politikwerte,
  softmax,
  verlauf,
} from "../app/src/experiment/exp-actor-critic.js";
import {
  bewertungsbalken,
  praeferenzen,
  rechnung,
  sigma,
} from "../app/src/experiment/exp-praeferenzen.js";
import {
  TOKENS,
  durchlauf,
  entropie,
  gewaehltesToken,
  miniTransformer,
  softmax as tokenSoftmax,
} from "../app/src/experiment/exp-mini-transformer.js";
import { checkExperimentContract } from "../app/src/experiment/contract.js";
import { lek42 } from "../app/src/model/lessons/lek-42.js";
import { lek43 } from "../app/src/model/lessons/lek-43.js";
import { lek44 } from "../app/src/model/lessons/lek-44.js";
import { formatIssues, validateLesson } from "../app/src/model/validate.js";

const EXPERIMENTE = ["exp-actor-critic", "exp-praeferenzen", "exp-mini-transformer"];

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

function balken(result: Calculated, label: string): Bar {
  assert.equal(result.drawing.kind, "bars", "Zeichnung sind Saeulen");
  if (result.drawing.kind !== "bars") throw new Error("keine Saeulen");
  const eintrag = result.drawing.items.find((i) => i.label === label);
  assert.ok(eintrag, `Saeule "${label}" fehlt`);
  return eintrag;
}

function fast(actual: number, expected: number, tolerance = 1e-9, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} erwartet ${expected}, erhalten ${actual}`,
  );
}

test("Actor-Critic: der erste Schritt ins Ziel", () => {
  // Handrechnung: delta = 1 + 0,9 * 0 - 0 = 1; V(1) = 0 + 0,2 * 1 = 0,2;
  // theta(1, weiter) = 0,1; softmax([0,1, -0,1]) = 0,549833997312478.
  const r = actorCritic.calculate({ lernrateKritiker: 0.2, lernrateActor: 0.2, schritte: 2 });
  fast(wert(r, "Wertschätzung V(Zustand 1)"), 0.2);
  fast(wert(r, "Verlust"), 0.25, 1e-12, "ein Schritt mit Fehler 1 und ein Schritt mit Fehler 0");
  fast(wert(r, "Bellman-Fehler zuletzt"), 1, 1e-12);
  fast(balken(r, "Zustand 1 · weiter").value, 0.549833997312478, 1e-12);
  fast(balken(r, "Zustand 0 · weiter").value, 0.5, 1e-12, "Zustand 0 wurde noch nicht verbessert");
  fast(balken(r, "Zustand 1 · weiter").ghost ?? 0, 0.5, 1e-12, "Umriss ist der Startwert");
});

test("Actor-Critic: ein Schritt ohne Wertvorwissen aendert nichts", () => {
  // Im ersten Schritt ist der Fehler null: V ist noch ueberall null.
  const r = actorCritic.calculate({ lernrateKritiker: 0.2, lernrateActor: 0.2, schritte: 1 });
  fast(wert(r, "Wertschätzung V(Zustand 0)"), 0, 1e-12);
  fast(wert(r, "Wertschätzung V(Zustand 1)"), 0, 1e-12);
  fast(wert(r, "Verlust"), 0, 1e-12);
  fast(wert(r, "Bellman-Fehler zuletzt"), 0, 1e-12);
  assert.deepEqual(politikwerte([0, 0]), [0.5, 0.5]);
  assert.deepEqual(softmax([0, 0]), [0.5, 0.5]);
});

test("Actor-Critic: acht Schritte mit beiden Lernraten 0,2", () => {
  const r = actorCritic.calculate({ lernrateKritiker: 0.2, lernrateActor: 0.2, schritte: 8 });
  fast(wert(r, "Wertschätzung V(Zustand 0)"), 0.16272, 1e-9);
  fast(wert(r, "Wertschätzung V(Zustand 1)"), 0.5904, 1e-9);
  fast(wert(r, "Verlust"), 0.15915796, 1e-9);
  fast(wert(r, "Bellman-Fehler zuletzt"), 0.512, 1e-9);
  fast(balken(r, "Zustand 0 · weiter").value, 0.5395389245559843, 1e-9);
  fast(balken(r, "Zustand 1 · weiter").value, 0.6294778358626882, 1e-9);
  // Der Rechenkern direkt: derselbe Verlauf, beide Teile von einer Zahl getrieben.
  const kern = verlauf(0.2, 0.2, 8);
  fast(kern.werte[1] ?? 0, 0.5904, 1e-9);
  fast(kern.letzterFehler, 0.512, 1e-9);
});

test("Praeferenzen: ein Update-Schritt", () => {
  // Bewertungen A: 4 und 5 (Mittel 4,5), B: 2 und 3 (Mittel 2,5), Abstand 2.
  // p = sigma(1 * 2) = 0,8807970779778823; Schub = 0,4; Abstand danach = 2,8.
  const r = praeferenzen.calculate({ staerke: 1 });
  fast(wert(r, "Abstand der Antworten vorher"), 2, 1e-12);
  fast(wert(r, "Abstand der Antworten nachher"), 2.8, 1e-12);
  fast(wert(r, "Präferenzwahrscheinlichkeit"), 0.8807970779778823, 1e-12);
  fast(wert(r, "Verschiebung je Antwort"), 0.4, 1e-12);
  fast(balken(r, "Antwort A · Bewertung 1").value, 4.4, 1e-12);
  fast(balken(r, "Antwort A · Bewertung 1").ghost ?? 0, 4, 1e-12, "Umriss ist der Stand vorher");
  fast(balken(r, "Antwort A · Bewertung 2").value, 5.4, 1e-12);
  fast(balken(r, "Antwort B · Bewertung 1").value, 1.6, 1e-12);
  fast(balken(r, "Antwort B · Bewertung 2").value, 2.6, 1e-12);
  fast(balken(r, "Antwort B · Bewertung 2").ghost ?? 0, 3, 1e-12);
  fast(sigma(2), 0.8807970779778823, 1e-12, "Sigma von 1 mal 2");
  assert.equal(sigma(0), 0.5);
  // Dieselbe Saeulenreihenfolge wie die Anzeige: A vor B, je Bewertung 1 vor 2.
  const labels = bewertungsbalken(rechnung(1)).map((b) => b.label);
  assert.deepEqual(labels, [
    "Antwort A · Bewertung 1",
    "Antwort A · Bewertung 2",
    "Antwort B · Bewertung 1",
    "Antwort B · Bewertung 2",
  ]);
});

test("Praeferenzen: ohne Staerke kein Update", () => {
  const r = praeferenzen.calculate({ staerke: 0 });
  fast(wert(r, "Abstand der Antworten nachher"), 2, 1e-12, "Abstand bleibt");
  fast(wert(r, "Präferenzwahrscheinlichkeit"), 0.5, 1e-12);
  fast(wert(r, "Verschiebung je Antwort"), 0, 1e-12);
  fast(balken(r, "Antwort A · Bewertung 1").value, 4, 1e-12);
  fast(balken(r, "Antwort B · Bewertung 1").value, 2, 1e-12);
});

test("Mini-Transformer: Softmax und Entropie", () => {
  assert.deepEqual(tokenSoftmax([0, 0]), [0.5, 0.5]);
  fast(tokenSoftmax([0, 0, 0, 0, 0])[0] ?? 0, 0.2, 1e-15, "fuenf gleiche Punktzahlen");
  fast(entropie([0.5, 0.5]), Math.log(2), 1e-12, "zwei gleiche Moeglichkeiten");
  fast(entropie([1, 0]), 0, 1e-12, "sichere Verteilung hat keine Entropie");
  fast(Math.log(5), 1.6094379124341003, 1e-12, "Gleichverteilung ueber fuenf Tokens");

  // Kontext "der kleine Hund": gelaufen mit den festen Gewichten aus dem Modul.
  const r = durchlauf([0, 1, 2], 1);
  fast(r.logits[3] ?? 0, 1.9774778218028795, 1e-9, "Punktzahl von laeuft");
  fast(r.logits[2] ?? 0, 0.4226029997361753, 1e-9, "Punktzahl von Hund");
  assert.equal(gewaehltesToken(r.wahrscheinlichkeiten), 3);
  assert.equal(TOKENS[3], "läuft");
  fast(r.wahrscheinlichkeiten[3] ?? 0, 0.5978527667533791, 1e-9);
  fast(entropie(r.wahrscheinlichkeiten), 1.22450742714374, 1e-9);
  // Die Aufmerksamkeit der letzten Position liegt am staerksten auf dem vorherigen Token.
  const letzte = r.aufmerksamkeit[2] ?? [];
  assert.equal(letzte.length, 3, "kausaler Blick: drei Positionen");
  fast(letzte[1] ?? 0, 0.4192490076747771, 1e-9);
  assert.ok((letzte[1] ?? 0) > (letzte[0] ?? 1), "das vorherige Token wiegt mehr als das erste");
});

test("Mini-Transformer: Temperatur und Kontext steuern die Verteilung", () => {
  const r = miniTransformer.calculate({ kontext: "der-kleine-hund", temperatur: 1 });
  fast(wert(r, "Wahrscheinlichkeit des gewählten Tokens"), 0.5978527667533791, 1e-9);
  fast(wert(r, "Entropie"), 1.22450742714374, 1e-9);
  fast(balken(r, "läuft").value, 0.5978527667533791, 1e-9);
  assert.ok(balken(r, "läuft").highlighted, "das wahrscheinlichste Token ist hervorgehoben");

  const kalt = miniTransformer.calculate({ kontext: "der-kleine-hund", temperatur: 0.2 });
  fast(wert(kalt, "Wahrscheinlichkeit des gewählten Tokens"), 0.9992641755031927, 1e-9);
  fast(wert(kalt, "Entropie"), 0.00681549954238702, 1e-9);

  const warm = miniTransformer.calculate({ kontext: "der-kleine-hund", temperatur: 2 });
  fast(wert(warm, "Wahrscheinlichkeit des gewählten Tokens"), 0.3797479589512979, 1e-9);
  fast(wert(warm, "Entropie"), 1.5211489793904942, 1e-9);

  assert.ok(
    wert(warm, "Entropie") > wert(r, "Entropie") && wert(r, "Entropie") > wert(kalt, "Entropie"),
    "hoehere Temperatur macht die Verteilung flacher",
  );

  // Alle vier Kontexte sagen den jeweils naechsten Token des Beispielsatzes voraus.
  const erwartet: [string, string][] = [
    ["der", "kleine"],
    ["der-kleine", "Hund"],
    ["der-kleine-hund", "läuft"],
    ["der-kleine-hund-laeuft", "."],
  ];
  for (const [kontext, token] of erwartet) {
    const lauf = miniTransformer.calculate({ kontext, temperatur: 1 });
    assert.ok(balken(lauf, token).highlighted, `Kontext ${kontext} waehlt ${token}`);
  }
});

test("Lektionen 42 bis 44: Schema ohne Beanstandung", () => {
  const dateien: [string, unknown][] = [
    ["app/src/model/lessons/lek-42.ts", lek42],
    ["app/src/model/lessons/lek-43.ts", lek43],
    ["app/src/model/lessons/lek-44.ts", lek44],
  ];
  for (const [datei, lektion] of dateien) {
    const issues = validateLesson(lektion, datei, EXPERIMENTE);
    assert.deepEqual(issues, [], `${datei}: ${formatIssues(issues)}`);
  }
  assert.equal(lek42.chapterId, "kap-10");
  assert.equal(lek43.chapterId, "kap-10");
  assert.equal(lek44.chapterId, "kap-11");
});

test("Lektionen 42 bis 44: Experimente halten den Vertrag", () => {
  for (const exp of [actorCritic, praeferenzen, miniTransformer]) {
    const issues = checkExperimentContract(exp);
    assert.deepEqual(issues, [], `${exp.id}: ${JSON.stringify(issues)}`);
  }
});
