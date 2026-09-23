import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek24: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-24",
  number: 24,
  chapterId: "kap-07",
  title: "Sequenzen",
  learningGoals: [
    "Den rekurrenten Zustand als Kurzfassung der bisherigen Eingaben beschreiben",
    "Den Zustand Schritt für Schritt aus Gewicht und Eingabe neu rechnen",
    "Deuten, wann ein solcher Zustand abklingt, stehen bleibt oder davonläuft",
  ],
  requiresPreviousKnowledge: [
    "Gewichtete Summe und Aktivierungsfunktion eines Neurons",
    "Zahlenfolgen und wiederholte Multiplikation",
  ],
  prerequisites: ["lek-18"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-24/s01",
      kind: "heading",
      title: "Ein Netz mit Gedächtnis",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Sequenzen" }],
    },
    {
      id: "lek-24/s02",
      kind: "paragraph",
      title: "Derselbe Zustand, immer wieder gerechnet",
      visual: {
        type: "text",
        text: "Eine Sequenz ist eine Folge von Eingaben: Wörter eines Satzes, Werte einer Messreihe, Bildpunkte eines Textes. Ein rekurrentes Netz verarbeitet sie Schritt für Schritt. Es führt einen Zustand mit, in dem die bisherigen Eingaben stecken. Bei jedem Schritt entsteht der neue Zustand aus dem alten Zustand und der neuen Eingabe - dieselbe Rechnung, immer wieder.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine Sequenz ist eine Folge von Eingaben: Wörter eines Satzes, Werte einer Messreihe, Bildpunkte eines Textes. Ein rekurrentes Netz verarbeitet sie Schritt für Schritt. Es führt einen Zustand mit, in dem die bisherigen Eingaben stecken. Bei jedem Schritt entsteht der neue Zustand aus dem alten Zustand und der neuen Eingabe, dieselbe Rechnung immer wieder.",
        },
      ],
    },
    {
      id: "lek-24/s03",
      kind: "equation",
      title: "Der Schritt",
      visual: { type: "equation", latex: "h_t = w\\,h_{t-1} + x_t" },
      spoken: [
        {
          kind: "equation",
          latex: "h_t = w\\,h_{t-1} + x_t",
          spoken:
            "Der Zustand zum Zeitpunkt t ist das Gewicht mal dem Zustand davor, plus die neue Eingabe. Das Gewicht bestimmt, wie stark das Alte noch mitzählt: unter eins verblasst es, bei eins bleibt es stehen, über eins schaukelt sich der Zustand auf.",
        },
      ],
    },
    {
      id: "lek-24/s04",
      kind: "experiment",
      title: "Schritt für Schritt rechnen",
      visual: { type: "experiment", experimentId: "exp-sequenzen" },
      experimentId: "exp-sequenzen",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-sequenzen",
          spokenDescription:
            "Eine Eingabefolge aus sechs Werten, ein Gewicht und die Zahl der Schritte lassen sich einstellen. Die waagerechten Säulen zeigen den Zustand nach jedem Schritt; die letzte ist hervorgehoben. Daneben stehen der Zustand nach der eingestellten Zahl von Schritten, der Wert davor und die Summe der Eingaben.",
        },
      ],
    },
    {
      id: "lek-24/s05",
      kind: "example",
      title: "Nachgerechnet",
      visual: {
        type: "list",
        items: [
          "Eingabe: immer 1, Gewicht w = 0,8",
          "h₁ = 0,8 · 0 + 1 = 1",
          "h₂ = 0,8 · 1 + 1 = 1,8",
          "h₃ = 0,8 · 1,8 + 1 = 2,44",
          "h₄ = 0,8 · 2,44 + 1 = 2,952",
          "h₆ = 3,68928",
          "Endwert bei gleichbleibender Eingabe: 1 / (1 - 0,8) = 5",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Jede Eingabe ist eins, das Gewicht ist null Komma acht, der Zustand startet bei null. Nach dem ersten Schritt ist er eins, nach dem zweiten eins Komma acht, nach dem dritten zwei Komma vier vier, nach dem vierten zwei Komma neun fünf zwei. Nach sechs Schritten steht er bei drei Komma sechs acht neun zwei acht. Er nähert sich dem Endwert fünf, den die Formel eins durch eins minus null Komma acht ergibt. Der Zustand sammelt also die Eingaben, aber jede ältere zählt nur noch zu achtzig Prozent.",
        },
      ],
    },
    {
      id: "lek-24/s06",
      kind: "code",
      title: "In Python",
      visual: {
        type: "code",
        language: "python",
        code: "eingaben = [1, 1, 1, 1, 1, 1]\ngewicht = 0.8\n\nzustand = 0.0\nverlauf = []\nfor x in eingaben:\n    zustand = gewicht * zustand + x\n    verlauf.append(zustand)\n\nprint(verlauf)  # [1.0, 1.8, 2.44, 2.952, 3.3616, 3.68928]\nprint(zustand)  # 3.68928",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "eingaben = [1, 1, 1, 1, 1, 1]\ngewicht = 0.8\n\nzustand = 0.0\nverlauf = []\nfor x in eingaben:\n    zustand = gewicht * zustand + x\n    verlauf.append(zustand)\n\nprint(verlauf)  # [1.0, 1.8, 2.44, 2.952, 3.3616, 3.68928]\nprint(zustand)  # 3.68928",
          spoken:
            "Derselbe Rechenweg in Python. Der Zustand beginnt bei null. Die Schleife läuft über die sechs Eingaben und rechnet jedes Mal Gewicht mal Zustand plus Eingabe; der Zustand wird nach jedem Schritt in einer Liste gesammelt. Am Ende enthält die Liste die Werte eins, eins Komma acht, zwei Komma vier vier, zwei Komma neun fünf zwei, drei Komma drei sechs eins sechs und drei Komma sechs acht neun zwei acht.",
        },
      ],
    },
    {
      id: "lek-24/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Das Gewicht ist 1,2, und es kommt keine neue Eingabe mehr. Was macht der Zustand?",
        options: [
          "Er wächst mit jedem Schritt weiter, weil das Gewicht über eins liegt",
          "Er bleibt stehen, weil keine neue Eingabe kommt",
          "Er fällt sofort auf null",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Das Gewicht ist eins Komma zwei, und es kommt keine neue Eingabe mehr. Was macht der Zustand?",
          options: [
            "Er wächst mit jedem Schritt weiter, weil das Gewicht über eins liegt",
            "Er bleibt stehen, weil keine neue Eingabe kommt",
            "Er fällt sofort auf null",
          ],
          answerIndex: 0,
          spoken:
            "Das Gewicht ist eins Komma zwei, und es kommt keine neue Eingabe mehr. Was macht der Zustand? Er wächst mit jedem Schritt weiter, er bleibt stehen, oder er fällt sofort auf null?",
          explanation:
            "Ohne neue Eingabe ist der neue Zustand das Gewicht mal dem alten. Bei eins Komma zwei wird er bei jedem Schritt größer: aus eins wird eins Komma zwei, dann eins Komma vier vier, dann eins Komma sieben zwei acht. Nur bei einem Gewicht von genau eins bleibt er stehen.",
        },
      ],
    },
    {
      id: "lek-24/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein rekurrentes Netz führt einen Zustand mit, der bei jedem Schritt aus dem alten Zustand und der neuen Eingabe neu gerechnet wird. Das Gewicht entscheidet, ob die Erinnerung abklingt, stehen bleibt oder davonläuft. Genau hier liegen die beiden bekannten Schwächen: Bei kleinen Gewichten verblasst weit Zurückliegendes, bei großen wächst der Zustand über jede Grenze.",
        },
      ],
    },
  ],
};
