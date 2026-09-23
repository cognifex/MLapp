import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek03: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-03",
  number: 3,
  chapterId: "kap-01",
  title: "Matrizen",
  learningGoals: [
    "Eine Matrix als Abbildung von Punkten lesen",
    "Die Determinante als Flaechenfaktor deuten",
    "Erkennen, wann eine Abbildung nicht umkehrbar ist",
  ],
  requiresPreviousKnowledge: ["Vektoren (Lektion 2)"],
  prerequisites: ["lek-02"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-03/s01",
      kind: "heading",
      title: "Eine Tabelle, die Punkte verschiebt",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Matrizen" }],
    },
    {
      id: "lek-03/s02",
      kind: "paragraph",
      title: "Vier Zahlen, eine Abbildung",
      visual: {
        type: "text",
        text: "Eine 2x2-Matrix ist eine Tabelle mit vier Zahlen. Sie nimmt einen Vektor und gibt einen neuen zurueck: jede Ausgabekoordinate ist eine gewichtete Summe der Eingabekoordinaten. Dieselbe Matrix wirkt auf jeden Punkt der Ebene gleich.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine zwei mal zwei Matrix ist eine Tabelle mit vier Zahlen. Sie nimmt einen Vektor und gibt einen neuen zurueck. Jede Ausgabekoordinate ist eine gewichtete Summe der Eingabekoordinaten.",
        },
      ],
    },
    {
      id: "lek-03/s03",
      kind: "equation",
      title: "Die Abbildung als Rechnung",
      visual: { type: "equation", latex: "p' = M p, \\quad \\det M = m_{11}m_{22} - m_{12}m_{21}" },
      spoken: [
        {
          kind: "equation",
          latex: "p' = M p, \\quad \\det M = m_{11}m_{22} - m_{12}m_{21}",
          spoken:
            "Der Bildpunkt ist das Produkt aus Matrix und Punkt. Die Determinante ist m eins eins mal m zwei zwei, minus m eins zwei mal m zwei eins.",
        },
      ],
    },
    {
      id: "lek-03/s04",
      kind: "experiment",
      title: "Die Figur durch die Matrix schicken",
      visual: { type: "experiment", experimentId: "exp-matrizen" },
      experimentId: "exp-matrizen",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-matrizen",
          spokenDescription:
            "Eine kleine Hausfigur aus fuenf Punkten. Vier Regler stellen die Matrix ein. Die gestrichelte Figur bleibt als Ausgangszustand stehen, die farbige zeigt das Bild. Daneben stehen Determinante und Flaechenfaktor.",
        },
      ],
    },
    {
      id: "lek-03/s05",
      kind: "example",
      title: "Nachgerechnet",
      visual: {
        type: "list",
        items: [
          "M = (2 0 | 0 0,5), p = (1 | 1)",
          "p' = (2 · 1 + 0 · 1 | 0 · 1 + 0,5 · 1) = (2 | 0,5)",
          "det M = 2 · 0,5 - 0 · 0 = 1",
          "Breite verdoppelt, Hoehe halbiert: Flaecheninhalt bleibt",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Die Matrix hat oben zwei und null, unten null und null Komma fuenf. Der Punkt eins eins wird zu zwei und null Komma fuenf. Die Determinante ist eins. Die Figur wird also in die Breite gezogen und in die Hoehe gestaucht, der Flaecheninhalt bleibt gleich.",
        },
      ],
    },
    {
      id: "lek-03/s06",
      kind: "quiz",
      title: "Verstaendnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was bedeutet eine Determinante von null?",
        options: [
          "Die Figur bleibt unveraendert",
          "Die Figur wird auf eine Linie zusammengedrueckt",
          "Die Figur wird gespiegelt",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was bedeutet eine Determinante von null?",
          options: [
            "Die Figur bleibt unveraendert",
            "Die Figur wird auf eine Linie zusammengedrueckt",
            "Die Figur wird gespiegelt",
          ],
          answerIndex: 1,
          spoken:
            "Was bedeutet eine Determinante von null? Die Figur bleibt unveraendert, wird auf eine Linie zusammengedrueckt, oder wird gespiegelt?",
          explanation:
            "Bei Determinante null ist der Flaechenfaktor null: die ganze Ebene landet auf einer Linie. Verschiedene Punkte haben dann dasselbe Bild, die Abbildung laesst sich nicht rueckgaengig machen.",
        },
      ],
    },
    {
      id: "lek-03/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Eine Matrix ist eine feste Vorschrift, die jeden Punkt der Ebene gleich behandelt. Die Determinante sagt, um welchen Faktor Flaechen wachsen und ob die Orientierung kippt. Ist sie null, geht Information verloren.",
        },
      ],
    },
  ],
};
