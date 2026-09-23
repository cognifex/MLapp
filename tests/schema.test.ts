/**
 * Pruefungen des Lektionsschemas (CONTENT-01).
 *
 * Jede der vier geforderten Fehlerarten muss mit Datei und Block-ID scheitern:
 * ungueltige ID, fehlender Sprachtext, unbekannter Experimentverweis, falsche Reihenfolge.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatIssues, validateCatalogue, validateLesson } from "../app/src/model/validate.js";
import { catalogue } from "../app/src/model/lessons/index.js";
import { experimentIds } from "../app/src/experiment/registry.js";
import { SCHEMA_VERSION, type Lesson } from "../app/src/model/types.js";

const FILE = "app/src/model/lessons/lek-01.ts";

function lessonCopy(): Lesson {
  return JSON.parse(JSON.stringify(catalogue.lessons[0])) as Lesson;
}

test("der echte Katalog ist gueltig", () => {
  const result = validateCatalogue(catalogue, "app/src/model/lessons/index.ts", experimentIds());
  assert.equal(result.ok, true, `Beanstandungen:\n${formatIssues(result.issues)}`);
  assert.ok(result.lessonCount >= 5, "mindestens fuenf Lektionen erwartet");
  assert.ok(result.sectionCount >= 30, "Abschnitte werden gezaehlt");
});

test("ungueltige Lektions-ID scheitert mit Datei und ID", () => {
  const broken = lessonCopy();
  broken.id = "lektion-1";
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(issues.length > 0, "wird beanstandet");
  assert.ok(
    issues.every((i) => i.file === FILE),
    "Datei steht in jeder Meldung",
  );
  assert.ok(
    issues.some((i) => i.blockId === "lektion-1" && /ungueltige Lektions-ID/.test(i.message)),
    `Meldung nennt die ID: ${formatIssues(issues)}`,
  );
});

test("fehlender Sprachtext scheitert mit Block-ID", () => {
  const broken = lessonCopy();
  const section = broken.sections.find((s) => s.kind === "equation");
  assert.ok(section, "Beispiellektion hat einen Formelabschnitt");
  section.spoken = [];
  const issues = validateLesson(broken, FILE, experimentIds());
  const hit = issues.find((i) => i.blockId === section.id);
  assert.ok(hit, `Beanstandung fehlt: ${formatIssues(issues)}`);
  assert.match(hit.message, /Sprechfassung/);
});

test("Formel ohne ausgeschriebenen Sprechtext scheitert", () => {
  const broken = lessonCopy();
  const section = broken.sections.find((s) => s.kind === "equation");
  assert.ok(section);
  section.spoken = [{ kind: "equation", latex: "y = x", spoken: "   " }];
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => i.blockId === section.id && /"spoken"/.test(i.message)),
    `Beanstandung fehlt: ${formatIssues(issues)}`,
  );
});

test("unbekannter Experimentverweis scheitert", () => {
  const broken = lessonCopy();
  const section = broken.sections.find((s) => s.experimentId !== undefined);
  assert.ok(section, "Beispiellektion hat einen Experimentabschnitt");
  section.experimentId = "exp-gibts-nicht";
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => i.blockId === section.id && /unbekanntes Experiment/.test(i.message)),
    `Beanstandung fehlt: ${formatIssues(issues)}`,
  );
});

test("Experiment-ID mit falschem Muster scheitert", () => {
  const broken = lessonCopy();
  const section = broken.sections.find((s) => s.experimentId !== undefined);
  assert.ok(section);
  section.experimentId = "Funktionen";
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => /ungueltige Experiment-ID/.test(i.message)),
    formatIssues(issues),
  );
});

test("falsche Reihenfolge und Voraussetzung nach der Lektion scheitern", () => {
  const broken = JSON.parse(JSON.stringify(catalogue)) as typeof catalogue;
  const first = broken.lessons[0]!;
  first.number = 3;
  first.prerequisites = [broken.lessons[1]!.id];
  const result = validateCatalogue(broken, "app/src/model/lessons/index.ts", experimentIds());
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((i) => /Reihenfolge hat eine Luecke oder Dopplung/.test(i.message)),
    `Nummerierung beanstandet: ${formatIssues(result.issues)}`,
  );
  assert.ok(
    result.issues.some((i) => /steht nicht vor dieser Lektion/.test(i.message)),
    `Voraussetzungsreihenfolge beanstandet: ${formatIssues(result.issues)}`,
  );
});

test("fehlende Voraussetzung scheitert", () => {
  const broken = JSON.parse(JSON.stringify(catalogue)) as typeof catalogue;
  broken.lessons[1]!.prerequisites = ["lek-99"];
  const result = validateCatalogue(broken, "app/src/model/lessons/index.ts", experimentIds());
  assert.ok(
    result.issues.some((i) => /Voraussetzung "lek-99" existiert nicht/.test(i.message)),
    formatIssues(result.issues),
  );
});

test("unbekannte Schemaversion scheitert", () => {
  const broken = lessonCopy();
  broken.schemaVersion = SCHEMA_VERSION + 1;
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => /Schemaversion/.test(i.message)),
    formatIssues(issues),
  );
});

test("doppelte Abschnitts-ID scheitert", () => {
  const broken = lessonCopy();
  broken.sections[1]!.id = broken.sections[0]!.id;
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => /doppelte Abschnitts-ID/.test(i.message)),
    formatIssues(issues),
  );
});

test("Quiz mit unbrauchbarem answerIndex scheitert", () => {
  const broken = lessonCopy();
  const quiz = broken.sections.find((s) => s.kind === "quiz");
  assert.ok(quiz);
  quiz.spoken = [
    {
      kind: "quiz",
      question: "Frage?",
      options: ["a", "b"],
      answerIndex: 5,
      spoken: "Frage?",
      explanation: "Weil.",
    },
  ];
  const issues = validateLesson(broken, FILE, experimentIds());
  assert.ok(
    issues.some((i) => /"answerIndex" zeigt auf keine Antwort/.test(i.message)),
    formatIssues(issues),
  );
});
