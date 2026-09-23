/**
 * Pruefungen des Aussprachelexikons (Grundlage fuer TTS-09).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addLexiconEntry,
  applyLexicon,
  DEFAULT_LEXICON,
  formulaToSpeech,
  speakableText,
} from "../app/src/tts/lexicon.js";
import type { SpokenBlock } from "../app/src/model/types.js";

test("Fachwoerter werden ersetzt, laengste Wendung zuerst", () => {
  assert.match(applyLexicon("Der Gradient zeigt bergauf."), /Gradi-EHNT/);
  assert.match(applyLexicon("Die Gradienten zeigen bergauf."), /Gradi-EHN-ten/);
  assert.ok(
    !applyLexicon("Die Gradienten zeigen bergauf.").includes("Gradi-EHN-ten-ten"),
    "keine doppelte Ersetzung",
  );
});

test("Woerter in anderen Woertern bleiben unberuehrt", () => {
  // "Gradientenverfahren" ist kein eigener Eintrag; die Wortgrenze verhindert wilde Treffer.
  const text = applyLexicon("Das Gradientenverfahren");
  assert.match(text, /^Das Gradientenverfahren$/);
});

test("eigene Eintraege ueberschreiben die Vorgabe", () => {
  const entries = addLexiconEntry(DEFAULT_LEXICON, { word: "Loss", spoken: "Los" });
  assert.equal(applyLexicon("Loss", entries), "Los");
  assert.ok(!entries.some((e) => e.spoken === "Loss"), "alter Eintrag ist ersetzt, nicht doppelt");
});

test("Formeln brauchen einen Sprechtext", () => {
  const ok = formulaToSpeech("y = w x + b", "y ist gleich w mal x plus b");
  assert.equal(ok.spoken, "y ist gleich w mal x plus b");
  const missing = formulaToSpeech("y = w x + b", "   ");
  assert.equal(missing.spoken, "y = w x + b", "leerer Sprechtext faellt auf die Formel zurueck");
});

test("Sprechtexte decken jeden Block ab", () => {
  const blocks: SpokenBlock[] = [
    { kind: "heading", text: "Überschrift" },
    { kind: "paragraph", text: "Ein Gradient ist ein Vektor." },
    { kind: "equation", latex: "a\\cdot b", spoken: "a mal b" },
    { kind: "code", language: "python", code: "x = 1", spoken: "x ist gleich eins" },
    { kind: "experiment", experimentId: "exp-funktionen", spokenDescription: "Ein Regler." },
    {
      kind: "quiz",
      question: "Wie gross ist x?",
      options: ["eins", "zwei"],
      answerIndex: 0,
      spoken: "Wie gross ist x?",
      explanation: "x ist eins.",
    },
    { kind: "summary", text: "Zusammenfassung" },
  ];
  const texts = speakableText(blocks);
  assert.equal(texts.length, blocks.length);
  assert.ok(texts.every((t) => typeof t === "string" && t.trim().length > 0));
  assert.match(texts[5]!, /Wie gross ist x/);
});
