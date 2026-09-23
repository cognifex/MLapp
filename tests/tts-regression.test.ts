/**
 * Regressionssuite fuer die Sprachfassung (QA-03).
 *
 * Geprueft wird ueber den ganzen Katalog, nicht an Einzelbeispielen:
 *  - Formeln werden nie als LaTeX vorgelesen.
 *  - Codebloecke haben eine verstaendliche Erklaerung, keinen Code.
 *  - Englische Fachbegriffe, die im Sprechtext vorkommen, stehen im Aussprachelexikon.
 *  - Die Ersetzungen des Lexikons sind stabil (laengste Wendung zuerst, keine Doppelersetzung).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogue } from "../app/src/model/lessons/index.js";
import { applyLexicon, DEFAULT_LEXICON } from "../app/src/tts/lexicon.js";
import type { SpokenBlock } from "../app/src/model/types.js";

function alleSprechbloecke(): { stelle: string; block: SpokenBlock }[] {
  const liste: { stelle: string; block: SpokenBlock }[] = [];
  for (const lektion of catalogue.lessons) {
    for (const abschnitt of lektion.sections) {
      for (const block of abschnitt.spoken) {
        liste.push({ stelle: `${abschnitt.id} (${block.kind})`, block });
      }
    }
  }
  return liste;
}

function textVon(block: SpokenBlock): string {
  switch (block.kind) {
    case "heading":
    case "paragraph":
    case "summary":
      return block.text;
    case "equation":
      return block.spoken;
    case "code":
      return block.spoken;
    case "experiment":
      return block.spokenDescription;
    case "quiz":
      return `${block.question} ${block.spoken} ${block.explanation}`;
  }
}

const LATEX_SPUREN = ["\\", "^{", "_{", "\\frac", "\\sqrt", "\\cdot", "\\nabla", "\\partial"];

test("kein Sprechtext enthaelt LaTeX", () => {
  const verstoesse: string[] = [];
  for (const { stelle, block } of alleSprechbloecke()) {
    const text = textVon(block);
    for (const spur of LATEX_SPUREN) {
      if (text.includes(spur)) verstoesse.push(`${stelle}: "${spur}" in "${text.slice(0, 60)}"`);
    }
  }
  assert.deepEqual(verstoesse, []);
});

test("Codebloecke werden erklaert, nicht vorgelesen", () => {
  const verstoesse: string[] = [];
  for (const { stelle, block } of alleSprechbloecke()) {
    if (block.kind !== "code") continue;
    const erklaerung = block.spoken;
    if (erklaerung.trim().length < 40) {
      verstoesse.push(`${stelle}: Erklaerung zu kurz (${erklaerung.trim().length} Zeichen)`);
    }
    for (const spur of ["def ", "return ", "()", "==", " = ", "print("]) {
      if (erklaerung.includes(spur)) verstoesse.push(`${stelle}: Code in der Erklaerung ("${spur}")`);
    }
  }
  assert.deepEqual(verstoesse, []);
});

test("jeder Sprechblock hat einen Mindestinhalt", () => {
  // Ueberschriften duerfen kurz sein ("Funktionen"), alles andere muss einen Satz tragen.
  const mindestlaenge: Record<string, number> = { heading: 3 };
  const verstoesse: string[] = [];
  for (const { stelle, block } of alleSprechbloecke()) {
    const grenze = mindestlaenge[block.kind] ?? 12;
    if (textVon(block).trim().length < grenze) {
      verstoesse.push(`${stelle}: zu kurz (${textVon(block).trim().length} Zeichen, erwartet ${grenze})`);
    }
  }
  assert.deepEqual(verstoesse, []);
});

test("englische Fachbegriffe im Sprechtext stehen im Lexikon", () => {
  const begriffe = [
    "Embedding",
    "Attention",
    "Token",
    "Tokens",
    "Softmax",
    "Gradient",
    "Loss",
    "Feature",
    "Layer",
    "Transformer",
    "Batch",
    "Overfitting",
    "ReLU",
  ];
  const vorhanden = new Set(DEFAULT_LEXICON.map((e) => e.word));
  const sprechtexte = alleSprechbloecke().map(({ block }) => textVon(block));
  const fehlend: string[] = [];
  for (const begriff of begriffe) {
    const kommtVor = sprechtexte.some((text) => new RegExp(`\\b${begriff}\\b`).test(text));
    if (kommtVor && !vorhanden.has(begriff)) fehlend.push(begriff);
  }
  assert.deepEqual(fehlend, [], "Begriffe ohne Ausspracheregel");
});

test("Lexikonersetzung ist stabil und ersetzt nicht doppelt", () => {
  for (const eintrag of DEFAULT_LEXICON) {
    const einmal = applyLexicon(eintrag.word);
    const zweimal = applyLexicon(einmal);
    assert.equal(zweimal, einmal, `"${eintrag.word}" wird bei zweimaliger Anwendung veraendert`);
  }
});

test("Ersetzungen lassen Zahlen und Satzzeichen unberuehrt", () => {
  const text = "Der Gradient ist 0,75 gross; das Loss sinkt.";
  const ersetzt = applyLexicon(text);
  assert.match(ersetzt, /0,75/, "Zahl bleibt stehen");
  assert.ok(ersetzt.includes(";"), "Satzzeichen bleibt stehen");
  assert.ok(ersetzt.includes("."), "Punkt bleibt stehen");
});

test("die Suite deckt alle Lektionen ab", () => {
  const bloecke = alleSprechbloecke();
  assert.ok(
    bloecke.length >= catalogue.lessons.length * 5,
    `zu wenige Sprechbloecke: ${bloecke.length} fuer ${catalogue.lessons.length} Lektionen`,
  );
  const ohne = catalogue.lessons.filter((l) => l.sections.every((s) => s.spoken.length === 0));
  assert.deepEqual(ohne.map((l) => l.id), [], "Lektionen ohne Sprechfassung");
});
