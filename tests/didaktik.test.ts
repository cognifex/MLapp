/**
 * Redaktionelle Pruefung des Katalogs (CONTENT-04).
 *
 * Die didaktische Vorlage (docs/lektion-vorlage.md) beschreibt, was eine Lektion enthalten muss.
 * Hier wird sie maschinell eingefordert: Vollstaendigkeit, Reihenfolge der Abschnitte,
 * Lernziele, Beispiel, Uebungsaufgabe mit Begruendung und Zusammenfassung.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogue } from "../app/src/model/lessons/index.js";
import { experimentIds } from "../app/src/experiment/registry.js";
import { validateCatalogue } from "../app/src/model/validate.js";

const ABSCHNITTSFOLGE = [
  "heading",
  "paragraph",
  "equation",
  "experiment",
  "example",
  "code",
  "quiz",
  "summary",
];

test("der Katalog erfuellt die didaktische Vorlage", () => {
  const fehler: string[] = [];
  for (const lektion of catalogue.lessons) {
    const ids = lektion.sections.map((s) => s.id);
    const doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (doppelt.length > 0)
      fehler.push(`${lektion.id}: doppelte Abschnitts-IDs ${doppelt.join(", ")}`);

    const arten = lektion.sections.map((s) => s.kind);
    for (const pflicht of ["heading", "paragraph", "experiment", "quiz", "summary"]) {
      if (!arten.includes(pflicht as (typeof arten)[number])) {
        fehler.push(`${lektion.id}: Abschnittsart "${pflicht}" fehlt`);
      }
    }
    if (!arten.includes("example") && !arten.includes("code")) {
      fehler.push(`${lektion.id}: durchgerechnetes Beispiel fehlt (weder example noch code)`);
    }

    if (lektion.learningGoals.length === 0) fehler.push(`${lektion.id}: kein Lernziel`);
    if (lektion.requiresPreviousKnowledge.length === 0) {
      fehler.push(`${lektion.id}: benoetigtes Vorwissen nicht benannt`);
    }
    if (!(lektion.estimatedMinutes > 0)) fehler.push(`${lektion.id}: keine Zeitangabe`);

    // Reihenfolge: keine Art darf vor ihrer Einfuehrung stehen (Uebersicht vor Erklaerung, usw.).
    const gewichte = arten.map((art) => ABSCHNITTSFOLGE.indexOf(art));
    for (let i = 1; i < gewichte.length; i += 1) {
      const vorher = gewichte[i - 1];
      const jetzt = gewichte[i];
      if (vorher === undefined || jetzt === undefined) continue;
      // Nur die Hauptlinie pruefen; Beispiel und Code duerfen vor dem Quiz stehen.
      if (jetzt < vorher && artIndexOf(arten[i]!) < artIndexOf(arten[i - 1]!)) {
        fehler.push(
          `${lektion.id}: Abschnitt ${i + 1} (${arten[i]}) steht vor ${arten[i - 1]} und ist dort nicht vorgesehen`,
        );
      }
    }
  }
  assert.deepEqual(fehler, []);
});

function artIndexOf(art: string): number {
  return ABSCHNITTSFOLGE.indexOf(art);
}

test("jede Uebungsaufgabe hat eine Begruendung", () => {
  const fehler: string[] = [];
  for (const lektion of catalogue.lessons) {
    for (const abschnitt of lektion.sections) {
      if (abschnitt.kind !== "quiz") continue;
      for (const block of abschnitt.spoken) {
        if (block.kind !== "quiz") {
          fehler.push(`${abschnitt.id}: Sprechfassung der Uebungsaufgabe ist kein Quizblock`);
          continue;
        }
        if (block.explanation.trim().length < 30) {
          fehler.push(
            `${abschnitt.id}: Begruendung zu knapp (${block.explanation.trim().length} Zeichen)`,
          );
        }
        if (block.options.length < 2) fehler.push(`${abschnitt.id}: zu wenige Antworten`);
      }
    }
  }
  assert.deepEqual(fehler, []);
});

test("jedes Experiment wird beschrieben und ist im Verzeichnis", () => {
  const bekannt = new Set(experimentIds());
  const fehler: string[] = [];
  for (const lektion of catalogue.lessons) {
    for (const abschnitt of lektion.sections) {
      if (abschnitt.kind !== "experiment") continue;
      const id = abschnitt.experimentId;
      if (!id) {
        fehler.push(`${abschnitt.id}: kein Experimentverweis`);
        continue;
      }
      if (!bekannt.has(id)) fehler.push(`${abschnitt.id}: Experiment ${id} nicht registriert`);
      const beschreibung = abschnitt.spoken.find((b) => b.kind === "experiment");
      if (!beschreibung || beschreibung.kind !== "experiment") {
        fehler.push(`${abschnitt.id}: keine Sprechbeschreibung des Experiments`);
        continue;
      }
      if (beschreibung.spokenDescription.trim().length < 60) {
        fehler.push(`${abschnitt.id}: Sprechbeschreibung zu knapp`);
      }
    }
  }
  assert.deepEqual(fehler, []);
});

test("jede Lektion ist im Curriculum vollstaendig eingetragen", () => {
  const ergebnis = validateCatalogue(catalogue, "app/src/model/lessons/index.ts", experimentIds());
  assert.equal(ergebnis.ok, true, JSON.stringify(ergebnis.issues, null, 2));
  const nummern = catalogue.lessons.map((l) => l.number).sort((a, b) => a - b);
  assert.deepEqual(
    nummern,
    Array.from({ length: nummern.length }, (_, i) => i + 1),
    "Lektionsnummern muessen lueckenlos aufsteigen",
  );
  const kapitel = new Set(catalogue.chapters.map((c) => c.id));
  const ohneKapitel = catalogue.lessons.filter((l) => !kapitel.has(l.chapterId));
  assert.deepEqual(
    ohneKapitel.map((l) => l.id),
    [],
    "Lektionen ohne gueltiges Kapitel",
  );
});
