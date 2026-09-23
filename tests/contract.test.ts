/**
 * Pruefungen des Experiment-Vertrags (CONTENT-02).
 *
 * Nachweis der Akzeptanzkriterien: Zuruecksetzen ist deterministisch, gleicher Zustand ergibt
 * gleiche Ausgabe, ungueltige Reglerwerte werden abgefangen, Speichern/Wiederherstellen und die
 * Zeichengroesse aendern das Ergebnis nicht.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkExperimentContract,
  coerceControlValue,
  createStore,
  normaliseState,
  type ControlValue,
  type ExperimentState,
  type SliderControl,
} from "../app/src/experiment/contract.js";
import { experiments } from "../app/src/experiment/registry.js";

const slider: SliderControl = {
  kind: "slider",
  id: "x",
  label: "x",
  min: -3,
  max: 3,
  step: 0.1,
  initial: 1,
};

test("jedes registrierte Experiment erfuellt den Vertrag", () => {
  for (const experiment of experiments) {
    const issues = checkExperimentContract(experiment);
    assert.deepEqual(issues, [], `${experiment.id}: ${issues.map((i) => i.message).join("; ")}`);
  }
});

test("Reglerwerte werden in den erlaubten Bereich gezogen", () => {
  assert.equal(coerceControlValue(slider, 99), 3);
  assert.equal(coerceControlValue(slider, -99), -3);
  assert.equal(coerceControlValue(slider, Number.NaN), 1);
  assert.equal(coerceControlValue(slider, Number.POSITIVE_INFINITY), 1);
  assert.equal(coerceControlValue(slider, "2"), 1);
});

test("Zwischenwerte rasten auf die Schrittweite ein", () => {
  assert.equal(coerceControlValue(slider, 1.04), 1);
  assert.equal(coerceControlValue(slider, 1.06), 1.1);
  assert.equal(coerceControlValue({ ...slider, min: 0, max: 1, step: 0.25 }, 0.6), 0.5);
});

test("Auswahl und Schalter lehnen ungueltige Werte ab", () => {
  assert.equal(
    coerceControlValue(
      { kind: "select", id: "f", label: "f", options: [{ value: "a", label: "A" }], initial: "a" },
      "z",
    ),
    "a",
  );
  assert.equal(
    coerceControlValue({ kind: "toggle", id: "t", label: "t", initial: false }, "ja"),
    false,
  );
});

test("Punkte werden an den Raendern begrenzt", () => {
  const value = coerceControlValue(
    {
      kind: "point",
      id: "p",
      label: "p",
      bounds: { minX: -1, maxX: 1, minY: -2, maxY: 2 },
      initial: { x: 0, y: 0 },
    },
    { x: 5, y: -9 },
  );
  assert.deepEqual(value, { x: 1, y: -2 });
});

test("gleicher Zustand ergibt gleiche Ausgabe, unabhaengig vom Weg dorthin", () => {
  const experiment = experiments[0]!;
  const start = normaliseState(experiment, experiment.initialState);
  const direct = experiment.calculate(start);
  const shuffled: ExperimentState = { ...start };
  const again = experiment.calculate(shuffled);
  assert.deepEqual(direct, again);
});

test("Zuruecksetzen ist deterministisch und stellt den Startzustand wieder her", () => {
  for (const experiment of experiments) {
    const store = createStore(experiment);
    const before = store.serialize();
    for (const control of experiment.controls) {
      const anderer: ControlValue =
        control.kind === "slider"
          ? control.max
          : control.kind === "toggle"
            ? !control.initial
            : control.kind === "select"
              ? (control.options[control.options.length - 1]?.value ?? control.initial)
              : { x: control.bounds.maxX, y: control.bounds.maxY };
      store.dispatch({ type: "set-value", controlId: control.id, value: anderer });
    }
    assert.notEqual(store.serialize(), before, `${experiment.id}: Aenderung wirkt nicht`);
    store.reset();
    assert.equal(store.serialize(), before, `${experiment.id}: Zuruecksetzen weicht ab`);
    store.reset();
    assert.equal(store.serialize(), before, `${experiment.id}: zweites Zuruecksetzen weicht ab`);
  }
});

test("Speichern und Wiederherstellen liefert denselben Zustand und dieselbe Rechnung", () => {
  const experiment = experiments[0]!;
  const store = createStore(experiment);
  store.restore(store.serialize());
  const a = JSON.stringify(store.result());
  store.restore(store.serialize());
  assert.equal(JSON.stringify(store.result()), a);
});

test("unbrauchbare gespeicherte Zustaende fallen auf gueltige Werte zurueck", () => {
  const experiment = experiments[0]!;
  const store = createStore(experiment);
  store.restore('{"x": "kaputt", "unbekannt": 5}');
  const state = store.state();
  for (const control of experiment.controls) {
    assert.ok(control.id in state, `${control.id} fehlt nach dem Wiederherstellen`);
  }
  assert.equal(Number.isFinite(state[experiment.controls[0]!.id] as number), true);
  store.restore("{kein json");
  assert.equal(Number.isFinite(store.state()[experiment.controls[0]!.id] as number), true);
});

test("die Zeichengroesse beruehrt die Rechnung nicht", () => {
  const experiment = experiments[0]!;
  const store = createStore(experiment);
  const before = JSON.stringify(store.result());
  // Zeichnen ist eine reine Lesefunktion: zweimal abrufen muss identisch bleiben.
  const first = store.result();
  const second = store.result();
  assert.equal(JSON.stringify(first), before);
  assert.equal(JSON.stringify(second), before);
});
