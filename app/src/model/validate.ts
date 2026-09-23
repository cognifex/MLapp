/**
 * Laufzeit-Validator fuer das Lektionsschema.
 *
 * Er prueft bewusst ohne Abhaengigkeit (kein ajv, kein Netz): die App bringt damit im Browser
 * dieselbe Pruefung mit wie die Kommandozeile. Jede Beanstandung nennt Datei und Block-ID, damit
 * ein CI-Fehler ohne Suchen zuzuordnen ist.
 */
import { SCHEMA_VERSION, type Catalogue, type Lesson, type SpokenBlock } from "./types.js";

export type Issue = {
  file: string;
  /** Abschnitts-ID, Lektions-ID oder "<katalog>", wenn kein Block betroffen ist. */
  blockId: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: Issue[];
  lessonCount: number;
  sectionCount: number;
};

type Unknown = Record<string, unknown>;

const LESSON_ID = /^lek-\d{2,3}$/;
const SECTION_ID = /^lek-\d{2,3}\/s\d{2}$/;
const CHAPTER_ID = /^kap-\d{2}$/;
const EXPERIMENT_ID = /^exp-[a-z0-9-]+$/;

function isObject(v: unknown): v is Unknown {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function push(issues: Issue[], file: string, blockId: string, message: string): void {
  issues.push({ file, blockId, message });
}

function checkSpokenBlock(
  block: unknown,
  i: number,
  file: string,
  sectionId: string,
  issues: Issue[],
): void {
  const where = `${sectionId} Sprechblock ${i}`;
  if (!isObject(block)) {
    push(issues, file, sectionId, `${where}: kein Objekt`);
    return;
  }
  const kind = block["kind"];
  if (typeof kind !== "string") {
    push(issues, file, sectionId, `${where}: "kind" fehlt`);
    return;
  }
  const kinds = ["heading", "paragraph", "equation", "code", "experiment", "quiz", "summary"];
  if (!kinds.includes(kind)) {
    push(issues, file, sectionId, `${where}: unbekannte Art "${kind}"`);
    return;
  }
  // Fehlende Sprachtexte sind der haeufigste Fehler: jedes Feld, das gehoert wird, muss gefuellt sein.
  const requiredText: Record<string, string[]> = {
    heading: ["text"],
    paragraph: ["text"],
    equation: ["latex", "spoken"],
    code: ["code", "spoken"],
    experiment: ["experimentId", "spokenDescription"],
    quiz: ["question", "spoken", "explanation"],
    summary: ["text"],
  };
  for (const field of requiredText[kind] ?? []) {
    if (!isNonEmptyString(block[field])) {
      push(issues, file, sectionId, `${where}: "${field}" fehlt oder ist leer (Sprachtext)`);
    }
  }
  if (kind === "quiz") {
    const options = block["options"];
    const answer = block["answerIndex"];
    if (!Array.isArray(options) || options.length < 2 || !options.every(isNonEmptyString)) {
      push(
        issues,
        file,
        sectionId,
        `${where}: "options" braucht mindestens zwei gefuellte Antworten`,
      );
    } else if (
      typeof answer !== "number" ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer >= options.length
    ) {
      push(issues, file, sectionId, `${where}: "answerIndex" zeigt auf keine Antwort`);
    }
  }
}

function checkSection(section: unknown, file: string, lessonId: string, issues: Issue[]): void {
  if (!isObject(section)) {
    push(issues, file, lessonId, "Abschnitt ist kein Objekt");
    return;
  }
  const id = section["id"];
  if (!isNonEmptyString(id)) {
    push(issues, file, lessonId, `Abschnitt ohne "id" (Titel: ${String(section["title"] ?? "?")})`);
    return;
  }
  if (!SECTION_ID.test(id)) {
    push(issues, file, id, `ungueltige Abschnitts-ID "${id}" - erwartet lek-NN/sNN`);
  }
  if (!id.startsWith(`${lessonId}/`)) {
    push(issues, file, id, `Abschnitts-ID passt nicht zur Lektion ${lessonId}`);
  }
  const kinds = [
    "heading",
    "paragraph",
    "equation",
    "example",
    "code",
    "experiment",
    "quiz",
    "summary",
  ];
  if (!isNonEmptyString(section["kind"]) || !kinds.includes(section["kind"] as string)) {
    push(issues, file, id, `ungueltige Abschnittsart "${String(section["kind"])}"`);
  }
  if (!isNonEmptyString(section["title"])) {
    push(issues, file, id, "Titel fehlt");
  }

  const visual = section["visual"];
  if (!isObject(visual) || !isNonEmptyString(visual["type"])) {
    push(issues, file, id, `"visual" fehlt oder hat keine Art`);
  } else {
    const type = visual["type"] as string;
    const visualTypes = ["none", "text", "equation", "code", "list", "quiz", "experiment"];
    if (!visualTypes.includes(type)) {
      push(issues, file, id, `unbekannte visuelle Art "${type}"`);
    }
    if (type === "equation" && !isNonEmptyString(visual["latex"])) {
      push(issues, file, id, `visuelle Formel ohne "latex"`);
    }
    if (
      type === "code" &&
      (!isNonEmptyString(visual["code"]) || !isNonEmptyString(visual["language"]))
    ) {
      push(issues, file, id, `Codeblock ohne "code"/"language"`);
    }
    if (type === "quiz") {
      if (!isNonEmptyString(visual["question"]))
        push(issues, file, id, `Quizfrage fehlt im sichtbaren Teil`);
      const opts = visual["options"];
      if (!Array.isArray(opts) || opts.length < 2 || !opts.every(isNonEmptyString)) {
        push(issues, file, id, `Quizantworten fehlen im sichtbaren Teil`);
      }
    }
    if (type === "experiment" && !isNonEmptyString(visual["experimentId"])) {
      push(issues, file, id, `visueller Experimentverweis ohne "experimentId"`);
    }
  }

  const spoken = section["spoken"];
  if (!Array.isArray(spoken) || spoken.length === 0) {
    push(issues, file, id, "Sprechfassung fehlt (Abschnitt hat keinen Sprachtext)");
  } else {
    spoken.forEach((b, i) => checkSpokenBlock(b, i, file, id, issues));
  }

  if (section["kind"] === "experiment" && !isNonEmptyString(section["experimentId"])) {
    push(issues, file, id, `Abschnitt der Art "experiment" braucht "experimentId"`);
  }
}

function checkLesson(raw: unknown, file: string, issues: Issue[]): Lesson | null {
  if (!isObject(raw)) {
    push(issues, file, "<lektion>", "Lektion ist kein Objekt");
    return null;
  }
  const id = raw["id"];
  if (!isNonEmptyString(id)) {
    push(issues, file, "<lektion>", `"id" fehlt`);
    return null;
  }
  if (!LESSON_ID.test(id)) {
    push(issues, file, id, `ungueltige Lektions-ID "${id}" - erwartet lek-NN`);
  }
  if (raw["schemaVersion"] !== SCHEMA_VERSION) {
    push(
      issues,
      file,
      id,
      `Schemaversion ${String(raw["schemaVersion"])} unbekannt, erwartet ${SCHEMA_VERSION}`,
    );
  }
  if (!isFiniteNumber(raw["number"]) || (raw["number"] as number) < 1) {
    push(issues, file, id, `"number" fehlt oder ist keine positive Zahl`);
  }
  if (!isNonEmptyString(raw["chapterId"])) {
    push(issues, file, id, `"chapterId" fehlt`);
  }
  if (!isNonEmptyString(raw["title"])) {
    push(issues, file, id, `"title" fehlt`);
  }
  for (const field of ["learningGoals", "requiresPreviousKnowledge"]) {
    const v = raw[field];
    if (!Array.isArray(v) || v.length === 0 || !v.every(isNonEmptyString)) {
      push(issues, file, id, `"${field}" braucht mindestens einen Eintrag`);
    }
  }
  if (
    !Array.isArray(raw["prerequisites"]) ||
    !(raw["prerequisites"] as unknown[]).every(isNonEmptyString)
  ) {
    push(issues, file, id, `"prerequisites" fehlt (leere Liste ist erlaubt)`);
  }
  const sections = raw["sections"];
  if (!Array.isArray(sections) || sections.length === 0) {
    push(issues, file, id, "Lektion hat keine Abschnitte");
    return null;
  }
  const seen = new Set<string>();
  sections.forEach((s) => {
    if (isObject(s) && isNonEmptyString(s["id"])) {
      const sid = s["id"];
      if (seen.has(sid)) push(issues, file, sid, `doppelte Abschnitts-ID "${sid}"`);
      seen.add(sid);
    }
    checkSection(s, file, id, issues);
  });
  return raw as unknown as Lesson;
}

/** Prueft eine einzelne Lektion (z. B. direkt nach dem Laden). */
export function validateLesson(
  raw: unknown,
  file: string,
  knownExperiments: Iterable<string>,
): Issue[] {
  const issues: Issue[] = [];
  const lesson = checkLesson(raw, file, issues);
  if (!lesson) return issues;
  const known = new Set(knownExperiments);
  for (const section of lesson.sections) {
    const refs: string[] = [];
    if (section.experimentId) refs.push(section.experimentId);
    if (section.visual.type === "experiment") refs.push(section.visual.experimentId);
    for (const block of section.spoken as SpokenBlock[]) {
      if (block.kind === "experiment") refs.push(block.experimentId);
    }
    for (const ref of refs) {
      if (!EXPERIMENT_ID.test(ref)) {
        push(issues, file, section.id, `ungueltige Experiment-ID "${ref}"`);
      } else if (known.size > 0 && !known.has(ref)) {
        push(
          issues,
          file,
          section.id,
          `unbekanntes Experiment "${ref}" - nicht im Verzeichnis registriert`,
        );
      }
    }
  }
  return issues;
}

/**
 * Prueft den gesamten Katalog: IDs, Reihenfolge, Voraussetzungen, Experimentverweise,
 * Kapitelzuordnung.
 */
export function validateCatalogue(
  catalogue: unknown,
  file: string,
  knownExperiments: Iterable<string>,
): ValidationResult {
  const issues: Issue[] = [];
  if (!isObject(catalogue)) {
    push(issues, file, "<katalog>", "Katalog ist kein Objekt");
    return { ok: false, issues, lessonCount: 0, sectionCount: 0 };
  }

  const chaptersRaw = catalogue["chapters"];
  const chapterIds = new Set<string>();
  if (!Array.isArray(chaptersRaw) || chaptersRaw.length === 0) {
    push(issues, file, "<katalog>", "keine Kapitel vorhanden");
  } else {
    const orders: number[] = [];
    chaptersRaw.forEach((c: unknown) => {
      if (!isObject(c)) {
        push(issues, file, "<katalog>", "Kapitel ist kein Objekt");
        return;
      }
      const id = c["id"];
      if (!isNonEmptyString(id) || !CHAPTER_ID.test(id)) {
        push(
          issues,
          file,
          String(id ?? "<katalog>"),
          `ungueltige Kapitel-ID "${String(id)}" - erwartet kap-NN`,
        );
      } else {
        if (chapterIds.has(id)) push(issues, file, id, "Kapitel-ID doppelt");
        chapterIds.add(id);
      }
      if (!isNonEmptyString(c["title"])) push(issues, file, String(id), "Kapiteltitel fehlt");
      if (!isFiniteNumber(c["order"])) push(issues, file, String(id), "Kapitelreihenfolge fehlt");
      else orders.push(c["order"] as number);
    });
    for (let i = 1; i < orders.length; i += 1) {
      if (orders[i]! <= orders[i - 1]!) {
        push(
          issues,
          file,
          "<katalog>",
          `Kapitelreihenfolge nicht aufsteigend (${orders.join(", ")})`,
        );
        break;
      }
    }
  }

  const lessonsRaw = catalogue["lessons"];
  if (!Array.isArray(lessonsRaw) || lessonsRaw.length === 0) {
    push(issues, file, "<katalog>", "keine Lektionen vorhanden");
    return { ok: false, issues, lessonCount: 0, sectionCount: 0 };
  }

  const ids = new Set<string>();
  const numbers = new Map<string, number>();
  let sectionCount = 0;

  for (const raw of lessonsRaw) {
    const lessonId = isObject(raw) && isNonEmptyString(raw["id"]) ? raw["id"] : "<lektion>";
    issues.push(...validateLesson(raw, file, knownExperiments));
    if (!isObject(raw)) continue;
    const id = raw["id"];
    if (isNonEmptyString(id)) {
      if (ids.has(id)) push(issues, file, id, `Lektions-ID "${id}" doppelt`);
      ids.add(id);
    }
    if (isFiniteNumber(raw["number"]) && isNonEmptyString(id))
      numbers.set(id, raw["number"] as number);
    if (Array.isArray(raw["sections"])) sectionCount += raw["sections"].length;
    const chapterId = raw["chapterId"];
    if (isNonEmptyString(chapterId) && !chapterIds.has(chapterId)) {
      push(issues, file, lessonId, `"chapterId" ${chapterId} gibt es nicht`);
    }
    const prereq = raw["prerequisites"];
    if (Array.isArray(prereq)) {
      for (const p of prereq) {
        if (!isNonEmptyString(p)) continue;
        if (p === id) {
          push(issues, file, lessonId, "Lektion ist ihre eigene Voraussetzung");
        } else if (
          !Array.isArray(lessonsRaw) ||
          !lessonsRaw.some((l) => isObject(l) && l["id"] === p)
        ) {
          push(issues, file, lessonId, `Voraussetzung "${p}" existiert nicht`);
        }
      }
    }
  }

  // Reihenfolge: die Lektionsnummern muessen lueckenlos ab 1 aufsteigen, und eine Voraussetzung
  // muss vor der Lektion stehen.
  const byNumber = [...numbers.entries()].sort((a, b) => a[1] - b[1]);
  byNumber.forEach(([id, n], i) => {
    if (n !== i + 1) {
      push(
        issues,
        file,
        id,
        `Lektionsnummer ${n} erwartet ${i + 1} - Reihenfolge hat eine Luecke oder Dopplung`,
      );
    }
  });
  for (const raw of lessonsRaw) {
    if (!isObject(raw)) continue;
    const id = raw["id"];
    const prereq = raw["prerequisites"];
    if (!isNonEmptyString(id) || !Array.isArray(prereq)) continue;
    const own = numbers.get(id);
    for (const p of prereq) {
      if (!isNonEmptyString(p)) continue;
      const other = numbers.get(p);
      if (own !== undefined && other !== undefined && other >= own) {
        push(
          issues,
          file,
          id,
          `Voraussetzung "${p}" (Nr. ${other}) steht nicht vor dieser Lektion (Nr. ${own})`,
        );
      }
    }
  }

  return { ok: issues.length === 0, issues, lessonCount: ids.size, sectionCount };
}

export function formatIssues(issues: Issue[]): string {
  return issues.map((i) => `  ${i.file} [${i.blockId}] ${i.message}`).join("\n");
}

export function asCatalogue(value: Catalogue): Catalogue {
  return value;
}
