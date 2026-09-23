/**
 * Pruefungen der Formeldarstellung: im sichtbaren Text darf kein rohes LaTeX stehen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formelAnzeige } from "../app/src/ui/formel.js";
import { catalogue } from "../app/src/model/lessons/index.js";

test("Hochzahlen und Abstaende werden lesbar", () => {
  assert.equal(formelAnzeige("y = f(x) = a\\,x^{2} + b\\,x + c"), "y = f(x) = a x² + b x + c");
});

test("Bruch wird zu einer Klammerrechnung", () => {
  const angezeigt = formelAnzeige(
    "\\frac{f(x+h)-f(x)}{h} \\;\\longrightarrow\\; f'(x) \\quad (h \\to 0)",
  );
  assert.match(angezeigt, /\(f\(x\+h\)-f\(x\)\) \/ \(h\)/);
  assert.match(angezeigt, /→/);
  assert.ok(!angezeigt.includes("\\"), `kein Rueckstrich mehr: ${angezeigt}`);
});

test("Gradient und partielle Ableitung", () => {
  const angezeigt = formelAnzeige(
    "\\nabla L = \\left(\\frac{\\partial L}{\\partial w}, \\frac{\\partial L}{\\partial b}\\right)",
  );
  assert.equal(angezeigt, "∇ L = ((∂ L) / (∂ w), (∂ L) / (∂ b))");
});

test("Tiefzahlen bleiben erkennbar", () => {
  assert.equal(
    formelAnzeige("\\det M = m_{11}m_{22} - m_{12}m_{21}"),
    "det M = m(11)m(22) - m(12)m(21)",
  );
});

test("kein Rueckstrich bleibt uebrig - auch bei unbekannten Befehlen", () => {
  assert.equal(formelAnzeige("\\unbekannterbefehl x"), "unbekannterbefehl x");
  assert.equal(formelAnzeige("w \\leftarrow w - \\eta \\, \\nabla L"), "w ← w - η ∇ L");
});

test("Wurzel und Punkt", () => {
  assert.equal(formelAnzeige("|a| = \\sqrt{a \\cdot a}"), "|a| = √(a · a)");
});

test("Skalarprodukt mit Tiefzahlen und Punkt", () => {
  assert.equal(formelAnzeige("a \\cdot b = a_1 b_1 + a_2 b_2"), "a · b = a(1) b(1) + a(2) b(2)");
});

test("keine Formel des Katalogs enthaelt danach rohes LaTeX", () => {
  const stellen: string[] = [];
  for (const lektion of catalogue.lessons) {
    for (const abschnitt of lektion.sections) {
      if (abschnitt.visual.type === "equation")
        stellen.push(`${abschnitt.id}: ${formelAnzeige(abschnitt.visual.latex)}`);
      for (const block of abschnitt.spoken) {
        if (block.kind === "equation")
          stellen.push(`${abschnitt.id}: ${formelAnzeige(block.latex)}`);
      }
    }
  }
  assert.ok(stellen.length >= 5, `Formeln gefunden: ${stellen.length}`);
  const mitRueckstrich = stellen.filter((text) => text.includes("\\"));
  assert.deepEqual(mitRueckstrich, [], "Formeln mit Rueckstrich");
});
