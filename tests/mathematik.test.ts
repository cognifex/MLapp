/**
 * Fachliche Pruefungen: nachgerechnete Referenzwerte fuer die ersten fuenf Experimente.
 * Die Werte in den Kommentaren stammen aus der Handrechnung und werden hier festgenagelt -
 * aendert jemand die Rechenkerne, faellt es hier auf.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { funktionen } from "../app/src/experiment/exp-funktionen.js";
import { dot, angleDegrees, length, vektoren } from "../app/src/experiment/exp-vektoren.js";
import { determinant, matrizen, transform } from "../app/src/experiment/exp-matrizen.js";
import { ableitung } from "../app/src/experiment/exp-ableitung.js";
import { gradientAt, lossAt } from "../app/src/experiment/exp-gradient.js";

function value(result: { values: { label: string; value: number }[] }, label: string): number {
  const entry = result.values.find((v) => v.label === label);
  assert.ok(entry, `Wert "${label}" fehlt`);
  return entry.value;
}

function almost(actual: number, expected: number, tolerance = 1e-9, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} erwartet ${expected}, erhalten ${actual}`,
  );
}

test("Funktionsgraph: y = x² an der Stelle 2", () => {
  const result = funktionen.calculate({ a: 1, b: 0, c: 0, x: 2 });
  almost(value(result, "y"), 4);
  almost(value(result, "Steigung dort"), 4);
});

test("Funktionsgraph: y = -x² + 4 an der Stelle 0", () => {
  const result = funktionen.calculate({ a: -1, b: 0, c: 4, x: 0 });
  almost(value(result, "y"), 4);
  almost(value(result, "Steigung dort"), 0);
});

test("Vektoren: Skalarprodukt, Laengen, rechte Winkel", () => {
  almost(dot({ x: 2, y: 1 }, { x: 0.5, y: 2 }), 3);
  almost(length({ x: 3, y: 4 }), 5);
  almost(angleDegrees({ x: 1, y: 0 }, { x: 0, y: 1 }), 90, 1e-9, "rechter Winkel");
  almost(angleDegrees({ x: 1, y: 0 }, { x: 1, y: 1 }), 45, 1e-9, "halber rechter Winkel");
  // Referenz aus der Handrechnung: a = (2|1), b = (0,5|2) -> rund 49,399 Grad.
  almost(angleDegrees({ x: 2, y: 1 }, { x: 0.5, y: 2 }), 49.3987, 0.01, "Winkel im Beispiel");
});

test("Vektoren: Nullvektor hat keinen Winkel", () => {
  assert.ok(Number.isNaN(angleDegrees({ x: 0, y: 0 }, { x: 1, y: 0 })));
});

test("Vektoren: Zahlen und Zeichnung stammen aus derselben Rechnung", () => {
  const result = vektoren.calculate({ a: { x: 2, y: 1 }, b: { x: 0.5, y: 2 }, summe: true });
  almost(value(result, "Skalarprodukt"), 3);
  assert.equal(result.drawing.kind, "plane");
  if (result.drawing.kind === "plane") {
    assert.equal(result.drawing.vectors.length, 5, "zwei Pfeile plus Summe und zwei Hilfslinien");
  }
});

test("Matrizen: Einheitsmatrix laesst alles stehen", () => {
  const identity = { m11: 1, m12: 0, m21: 0, m22: 1 };
  almost(determinant(identity), 1);
  assert.deepEqual(transform(identity, { x: 1.5, y: -0.5 }), { x: 1.5, y: -0.5 });
});

test("Matrizen: Determinante und Spiegelung", () => {
  const swap = { m11: 0, m12: 1, m21: 1, m22: 0 };
  almost(determinant(swap), -1, 1e-12, "Determinante der Vertauschung");
  assert.deepEqual(transform(swap, { x: 1, y: 0 }), { x: 0, y: 1 });

  const stretch = { m11: 2, m12: 0, m21: 0, m22: 0.5 };
  almost(determinant(stretch), 1, 1e-12, "Flaeche bleibt beim Strecken und Stauchen");

  const squashed = { m11: 1, m12: 1, m21: 1, m22: 1 };
  almost(determinant(squashed), 0, 1e-12, "plattgedrueckte Abbildung");
});

test("Matrizen: Ereignis meldet das Kippen der Orientierung", () => {
  const before = { m11: 1, m12: 0, m21: 0, m22: 1 };
  const after = { m11: 0, m12: 1, m21: 1, m22: 0 };
  const events = matrizen.semanticEvents?.(before, after) ?? [];
  assert.ok(
    events.some((e) => e.name === "orientationFlipped"),
    "Orientierungswechsel wird gemeldet",
  );
  const singular = matrizen.semanticEvents?.(before, { m11: 1, m12: 1, m21: 1, m22: 1 }) ?? [];
  assert.ok(
    singular.some((e) => e.name === "singular"),
    "plattgedrueckte Abbildung wird gemeldet",
  );
});

test("Ableitung: Sekantensteigung naehert sich der Tangentensteigung", () => {
  const coarse = ableitung.calculate({ funktion: "quadrat", x: 1, h: 1 });
  almost(value(coarse, "f(x)"), 1);
  almost(value(coarse, "Tangentensteigung f'(x)"), 2);
  almost(value(coarse, "Sekantensteigung"), 3, 1e-12, "Differenzenquotient mit h = 1");
  almost(value(coarse, "Abweichung"), 1);

  const fine = ableitung.calculate({ funktion: "quadrat", x: 1, h: 0.05 });
  almost(value(fine, "Sekantensteigung"), 2.05, 1e-12, "mit h = 0,05");
  almost(value(fine, "Abweichung"), 0.05, 1e-12);
  assert.ok(
    value(fine, "Abweichung") < value(coarse, "Abweichung"),
    "kleineres h liegt naeher an der Tangente",
  );
});

test("Ableitung: sin und e^x stimmen an ausgezeichneten Stellen", () => {
  const sinus = ableitung.calculate({ funktion: "sinus", x: 0, h: 0.05 });
  almost(value(sinus, "f(x)"), 0, 1e-12);
  almost(value(sinus, "Tangentensteigung f'(x)"), 1, 1e-12, "cos(0) = 1");

  const exponential = ableitung.calculate({ funktion: "exponential", x: 1, h: 0.05 });
  almost(value(exponential, "f(x)"), Math.E, 1e-12);
  almost(
    value(exponential, "Tangentensteigung f'(x)"),
    Math.E,
    1e-12,
    "e^x ist ihre eigene Ableitung",
  );
});

test("Gradient: Minimum der Mulde hat Verlust null und Gradient null", () => {
  almost(lossAt("mulde", { x: 0.8, y: -0.6 }), 0, 1e-12);
  const g = gradientAt("mulde", { x: 0.8, y: -0.6 });
  almost(g.x, 0, 1e-12);
  almost(g.y, 0, 1e-12);
});

test("Gradient: Werte der Mulde an der Stelle null", () => {
  almost(lossAt("mulde", { x: 0, y: 0 }), 1.216, 1e-12, "0,64 + 1,6 · 0,36");
  const g = gradientAt("mulde", { x: 0, y: 0 });
  almost(g.x, -1.6, 1e-12);
  almost(g.y, 1.92, 1e-12);
  almost(Math.hypot(g.x, g.y), 2.4993, 0.001, "Laenge des Gradienten");
});

test("Gradient: Sattel und Rinne rechnen wie angegeben", () => {
  almost(lossAt("sattel", { x: 1, y: 0 }), 0.8, 1e-12);
  almost(lossAt("sattel", { x: 0, y: 1 }), -0.8, 1e-12);
  almost(lossAt("rinne", { x: 0, y: 0.2 }), 0, 1e-12, "Rinne hat ihre Tiefpunkte bei y = 0,2");
});
