/**
 * Pruefungen der semantischen Ereignisse und der Drosselung (CONTENT-03).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EventThrottle,
  compareValues,
  explain,
  formatValue,
  registerRules,
  type SemanticEvent,
} from "../app/src/semantic/events.js";

const ctx = { experimentId: "exp-test" };

test("Verluststeigerung wird in einen deutschen Satz uebersetzt", () => {
  const events: SemanticEvent[] = [{ name: "lossIncreased", severity: "warning", value: 0.75 }];
  const sentences = explain(events, ctx);
  assert.equal(sentences.length, 1);
  assert.match(sentences[0]!, /Verlust steigt/);
  assert.match(sentences[0]!, /0,75/, "Zahlenwert in deutscher Schreibweise");
});

test("wiederholte gleiche Ereignisse ergeben nur einen Satz", () => {
  const events: SemanticEvent[] = [
    { name: "lossIncreased", severity: "info", value: 1 },
    { name: "lossIncreased", severity: "info", value: 1 },
  ];
  assert.equal(explain(events, ctx).length, 1);
});

test("unbekannte Ereignisse werden still uebergangen", () => {
  assert.deepEqual(explain([{ name: "gibtEsNicht", severity: "info" }], ctx), []);
});

test("angemeldete Regeln eines Experiments greifen", () => {
  registerRules([
    {
      name: "sattelpunkt",
      explain: () =>
        "Hier ist ein Sattelpunkt: in einer Richtung geht es hinauf, in der anderen hinab.",
    },
  ]);
  const sentences = explain([{ name: "sattelpunkt", severity: "notable" }], {
    experimentId: "exp-sattel",
  });
  assert.match(sentences[0]!, /Sattelpunkt/);
});

test("Drosselung laesst dasselbe Ereignis erst nach dem Zeitfenster wieder durch", () => {
  const throttle = new EventThrottle(900);
  const event: SemanticEvent = { name: "lossDecreased", severity: "info" };
  assert.equal(throttle.accept(event, 1000), true);
  assert.equal(throttle.accept(event, 1200), false, "innerhalb des Fensters gesperrt");
  assert.equal(throttle.accept(event, 1901), true, "nach 900 ms wieder erlaubt");
});

test("Drosselung trennt verschiedene Ereignisse", () => {
  const throttle = new EventThrottle(900);
  const kept = throttle.acceptAll(
    [
      { name: "lossDecreased", severity: "info" },
      { name: "gradientSteep", severity: "info" },
    ],
    500,
  );
  assert.equal(kept.length, 2, "verschiedene Ereignisse werden nicht gegeneinander gedrosselt");
});

test("Zahlenvergleich erkennt Anstieg, Abfall und Gleichstand", () => {
  assert.equal(compareValues(3, 4), "up");
  assert.equal(compareValues(4, 3), "down");
  assert.equal(compareValues(3, 3 + 1e-12), "equal");
});

test("Zahlen werden deutsch geschrieben", () => {
  assert.equal(formatValue(1.5), "1,50");
  assert.equal(formatValue(-0.25, 3), "-0,250");
});
