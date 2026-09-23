import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek07: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-07",
  number: 7,
  chapterId: "kap-03",
  title: "Entropie",
  learningGoals: [
    "Entropie als mittleren Überraschungsgehalt einer Verteilung deuten",
    "Die Entropie mit minus Summe p mal Logarithmus zur Basis zwei von p berechnen",
    "Den Höchstwert der Entropie bei gleich wahrscheinlichen Klassen erkennen",
  ],
  requiresPreviousKnowledge: [
    "Wahrscheinlichkeitsverteilung (Lektion 6)",
    "Logarithmus als Umkehrung der Hochzahl",
  ],
  prerequisites: ["lek-06"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-07/s01",
      kind: "heading",
      title: "Wie unbestimmt ist eine Verteilung?",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Entropie" }],
    },
    {
      id: "lek-07/s02",
      kind: "paragraph",
      title: "Überraschung hat ein Maß",
      visual: {
        type: "text",
        text: "Wer die Verteilung kennt und dann einen Wert zieht, ist umso überraschter, je unwahrscheinlicher dieser Wert war. Die Entropie ist der mittlere Überraschungsgehalt einer Verteilung. Sie ist null, wenn ein Ergebnis sicher ist, und am größten, wenn alle Ergebnisse gleich wahrscheinlich sind. Als Einheit dient das Bit, weil der Logarithmus zur Basis zwei zählt, wie oft sich die Zahl der Möglichkeiten verdoppelt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Wer die Verteilung kennt und dann einen Wert zieht, ist umso überraschter, je unwahrscheinlicher dieser Wert war. Die Entropie ist der mittlere Überraschungsgehalt einer Verteilung. Sie ist null, wenn ein Ergebnis sicher ist, und am größten, wenn alle Ergebnisse gleich wahrscheinlich sind. Die Einheit ist das Bit, denn der Logarithmus zur Basis zwei zählt, wie oft sich die Zahl der Möglichkeiten verdoppelt.",
        },
      ],
    },
    {
      id: "lek-07/s03",
      kind: "equation",
      title: "Die Formel der Entropie",
      visual: {
        type: "equation",
        latex: "H = -\\sum_{i} p_{i} \\log_{2} p_{i}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "H = -\\sum_{i} p_{i} \\log_{2} p_{i}",
          spoken:
            "H ist gleich minus der Summe über alle Klassen aus p mal Logarithmus zur Basis zwei von p. Jede Klasse trägt ihren Anteil multipliziert mit ihrer Überraschung bei. Klassen mit dem Anteil null zählen nicht mit.",
        },
      ],
    },
    {
      id: "lek-07/s04",
      kind: "experiment",
      title: "Wahrscheinlichkeiten verschieben und Entropie messen",
      visual: { type: "experiment", experimentId: "exp-entropie" },
      experimentId: "exp-entropie",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-entropie",
          spokenDescription:
            "Ein Säulendiagramm mit vier Klassen. Vier Regler verschieben die Rohgewichte; die angezeigten Anteile sind auf die Summe eins gebracht. Die Farbe der Säulen wird mit dem Anteil kräftiger. Die Entropie in Bit steht als Zahl daneben, ebenso die wirksamen Klassen. Zieht eine Klasse alles auf sich, sinkt die Entropie auf null; sind alle vier gleich groß, erreicht sie ihren Höchstwert.",
        },
      ],
    },
    {
      id: "lek-07/s05",
      kind: "example",
      title: "Nachgerechnete Beispiele",
      visual: {
        type: "list",
        items: [
          "Vier gleich wahrscheinliche Klassen: H = -(4 · 0,25 · log₂ 0,25) = 2 Bit",
          "Anteile (0,4 | 0,2 | 0,2 | 0,2): H = 0,4 · 1,3219 + 3 · 0,2 · 2,3219 = 1,9219 Bit",
          "Zwei gleich wahrscheinliche Klassen: H = 2 · 0,5 · 1 = 1 Bit",
          "Sichere Klasse (1 | 0 | 0 | 0): H = 0 Bit",
          "Höchstwert bei vier Klassen: log₂ 4 = 2 Bit",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Vier gleich wahrscheinliche Klassen haben die Entropie zwei Bit. Verschiebt man Anteil, sodass die Verteilung null Komma vier, null Komma zwei, null Komma zwei, null Komma zwei lautet, sinkt die Entropie auf eins Komma neun zwei eins neun Bit. Zwei gleich wahrscheinliche Klassen ergeben ein Bit, eine sichere Klasse null Bit. Der Höchstwert bei vier Klassen ist zwei Bit.",
        },
      ],
    },
    {
      id: "lek-07/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "from math import log2\n\ndef entropie(ps):\n    return -sum(p * log2(p) for p in ps if p > 0)\n\nprint(entropie([0.25, 0.25, 0.25, 0.25]))  # 2.0\nprint(entropie([0.4, 0.2, 0.2, 0.2]))      # 1.9219280948873623",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "from math import log2\n\ndef entropie(ps):\n    return -sum(p * log2(p) for p in ps if p > 0)\n\nprint(entropie([0.25, 0.25, 0.25, 0.25]))\nprint(entropie([0.4, 0.2, 0.2, 0.2]))",
          spoken:
            "Dieselbe Rechnung in Python. Die Funktion summiert für jede Klasse den Beitrag p mal Logarithmus zur Basis zwei von p und dreht das Vorzeichen um. Das Programm gibt zwei Komma null aus und danach eins Komma neun zwei eins neun.",
        },
      ],
    },
    {
      id: "lek-07/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Bei welcher der vier Klassen-Verteilungen ist die Entropie am größten?",
        options: [
          "Sichere Klasse (1 | 0 | 0 | 0)",
          "Gleichverteilung (0,25 | 0,25 | 0,25 | 0,25)",
          "(0,4 | 0,2 | 0,2 | 0,2)",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Bei welcher der vier Klassen-Verteilungen ist die Entropie am größten?",
          options: [
            "Sichere Klasse, ein Anteil ist eins",
            "Gleichverteilung mit gleichen Anteilen",
            "Verteilung mit den Anteilen null Komma vier, null Komma zwei, null Komma zwei, null Komma zwei",
          ],
          answerIndex: 1,
          spoken:
            "Bei welcher Verteilung ist die Entropie am größten? Bei der sicheren Klasse, bei der Gleichverteilung oder bei der Verteilung null Komma vier, null Komma zwei, null Komma zwei, null Komma zwei?",
          explanation:
            "Die Gleichverteilung hat zwei Bit, die Verteilung mit dem größeren Anteil noch eins Komma neun zwei eins neun Bit, die sichere Klasse null Bit. Je gleichmäßiger die Anteile, desto größer die Entropie; der Höchstwert bei vier Klassen ist Logarithmus zur Basis zwei von vier gleich zwei Bit.",
        },
      ],
    },
    {
      id: "lek-07/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Entropie misst in Bit, wie unbestimmt eine Verteilung ist. Sie ist die Summe aus Anteil mal Überraschung, mit umgedrehtem Vorzeichen gerechnet. Gleichverteilte Klassen treiben sie auf den Höchstwert Logarithmus zur Basis zwei von der Zahl der Klassen, eine sichere Klasse drückt sie auf null. Damit haben wir ein Maß dafür, wie viel Information in einer Verteilung steckt.",
        },
      ],
    },
  ],
};
