/**
 * Der Katalog: Kapitel und Lektionen in der Reihenfolge des Curriculums.
 * Die Zahlen in `number` muessen lueckenlos bei 1 beginnen - der Validator prueft das.
 */
import type { Catalogue, Chapter, Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";
import { lek01 } from "./lek-01.js";
import { lek02 } from "./lek-02.js";
import { lek03 } from "./lek-03.js";
import { lek04 } from "./lek-04.js";
import { lek05 } from "./lek-05.js";

export const chapters: Chapter[] = [
  { id: "kap-01", title: "Grundlagen: Funktionen, Vektoren, Matrizen", order: 1 },
  { id: "kap-02", title: "Ableitung und Gradient", order: 2 },
  { id: "kap-03", title: "Wahrscheinlichkeit, Entropie, Regression", order: 3 },
  { id: "kap-04", title: "Klassifikation und Generalisierung", order: 4 },
  { id: "kap-05", title: "Neuronale Netze", order: 5 },
  { id: "kap-06", title: "Repraesentationen", order: 6 },
  { id: "kap-07", title: "Sequenzen und Attention", order: 7 },
  { id: "kap-08", title: "Sprachmodelle", order: 8 },
  { id: "kap-09", title: "Diffusion", order: 9 },
  { id: "kap-10", title: "Reinforcement Learning", order: 10 },
  { id: "kap-11", title: "Gesamtsystem", order: 11 },
];

export const lessons: Lesson[] = [lek01, lek02, lek03, lek04, lek05];

export const catalogue: Catalogue = {
  schemaVersion: SCHEMA_VERSION,
  chapters,
  lessons,
};

export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function nextLessonId(id: string): string | undefined {
  const index = lessons.findIndex((l) => l.id === id);
  return index >= 0 ? lessons[index + 1]?.id : undefined;
}

export function previousLessonId(id: string): string | undefined {
  const index = lessons.findIndex((l) => l.id === id);
  return index > 0 ? lessons[index - 1]?.id : undefined;
}

export { lek01, lek02, lek03, lek04, lek05 };
