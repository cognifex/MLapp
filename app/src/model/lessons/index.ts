/**
 * Der Katalog: Kapitel und Lektionen in der Reihenfolge des Curriculums.
 * Die Zahlen in `number` muessen lueckenlos bei 1 beginnen - der Validator prueft das.
 *
 * Diese Datei wird von tools/zusammenbau.py erzeugt.
 */
import type { Catalogue, Chapter, Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";
import { lek01 } from "./lek-01.js";
import { lek02 } from "./lek-02.js";
import { lek03 } from "./lek-03.js";
import { lek04 } from "./lek-04.js";
import { lek05 } from "./lek-05.js";
import { lek06 } from "./lek-06.js";
import { lek07 } from "./lek-07.js";
import { lek08 } from "./lek-08.js";
import { lek09 } from "./lek-09.js";
import { lek10 } from "./lek-10.js";
import { lek11 } from "./lek-11.js";
import { lek12 } from "./lek-12.js";
import { lek13 } from "./lek-13.js";
import { lek14 } from "./lek-14.js";
import { lek15 } from "./lek-15.js";
import { lek16 } from "./lek-16.js";
import { lek17 } from "./lek-17.js";
import { lek18 } from "./lek-18.js";
import { lek19 } from "./lek-19.js";
import { lek20 } from "./lek-20.js";
import { lek21 } from "./lek-21.js";
import { lek22 } from "./lek-22.js";
import { lek23 } from "./lek-23.js";
import { lek24 } from "./lek-24.js";
import { lek25 } from "./lek-25.js";
import { lek26 } from "./lek-26.js";
import { lek27 } from "./lek-27.js";
import { lek28 } from "./lek-28.js";
import { lek29 } from "./lek-29.js";
import { lek30 } from "./lek-30.js";
import { lek31 } from "./lek-31.js";
import { lek32 } from "./lek-32.js";
import { lek33 } from "./lek-33.js";
import { lek34 } from "./lek-34.js";
import { lek35 } from "./lek-35.js";
import { lek36 } from "./lek-36.js";
import { lek37 } from "./lek-37.js";
import { lek38 } from "./lek-38.js";
import { lek39 } from "./lek-39.js";
import { lek40 } from "./lek-40.js";
import { lek41 } from "./lek-41.js";
import { lek42 } from "./lek-42.js";
import { lek43 } from "./lek-43.js";
import { lek44 } from "./lek-44.js";
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

export const lessons: Lesson[] = [
  lek01,
  lek02,
  lek03,
  lek04,
  lek05,
  lek06,
  lek07,
  lek08,
  lek09,
  lek10,
  lek11,
  lek12,
  lek13,
  lek14,
  lek15,
  lek16,
  lek17,
  lek18,
  lek19,
  lek20,
  lek21,
  lek22,
  lek23,
  lek24,
  lek25,
  lek26,
  lek27,
  lek28,
  lek29,
  lek30,
  lek31,
  lek32,
  lek33,
  lek34,
  lek35,
  lek36,
  lek37,
  lek38,
  lek39,
  lek40,
  lek41,
  lek42,
  lek43,
  lek44,
];

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
