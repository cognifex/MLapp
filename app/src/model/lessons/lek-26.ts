import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek26: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-26",
  number: 26,
  chapterId: "kap-07",
  title: "Query, Key, Value",
  learningGoals: [
    "Die drei Rollen Abfrage, Schlüssel und Wert an einem Token unterscheiden",
    "Bewertungen als Skalarprodukte aus Abfrage und Schlüssel berechnen",
    "Die Softmax-Gewichte und den gewichteten Wert nachvollziehen",
  ],
  requiresPreviousKnowledge: [
    "Was das Skalarprodukt zweier Vektoren bedeutet",
    "Dass eine Softmax aus beliebigen Zahlen Anteile macht, die zusammen eins ergeben",
  ],
  prerequisites: ["lek-25"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-26/s01",
      kind: "heading",
      title: "Drei Rollen für jedes Token",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Query, Key, Value" }],
    },
    {
      id: "lek-26/s02",
      kind: "paragraph",
      title: "Fragen, passen, weitergeben",
      visual: {
        type: "text",
        text: "Jedes Token bekommt drei Vektoren: eine Abfrage (Query), einen Schlüssel (Key) und einen Wert (Value). Die Abfrage ist die Frage, die ein Token stellt. Der Schlüssel jedes anderen Tokens entscheidet, wie gut es zu dieser Frage passt. Der Wert ist das, was weitergegeben wird, wenn die Passung gut ist. Aus allen Passungen entstehen Gewichte, aus den Gewichten ein neuer Vektor für das fragende Token. Die drei Projektionen sind hier fest gewählt, damit sich jeder Schritt nachrechnen lässt; in einem echten Modell werden sie aus Daten gelernt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Jedes Token bekommt drei Vektoren. Die Abfrage, englisch Query, ist die Frage, die ein Token stellt. Der Schlüssel, englisch Key, entscheidet, wie gut ein anderes Token zu dieser Frage passt. Der Wert, englisch Value, ist das, was weitergegeben wird, wenn die Passung gut ist. Aus allen Passungen entstehen Gewichte, und aus den Gewichten entsteht ein neuer Vektor für das fragende Token. Die drei Projektionen sind hier fest gewählt, damit sich jeder Schritt nachrechnen lässt; in einem echten Modell werden sie aus Daten gelernt.",
        },
      ],
    },
    {
      id: "lek-26/s03",
      kind: "equation",
      title: "Die drei Projektionen und die Bewertung",
      visual: {
        type: "equation",
        latex:
          "Q = X\\,W_Q \\quad K = X\\,W_K \\quad V = X\\,W_V \\quad A = Q\\,K^{T} / \\sqrt{d_k}",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "Q = X\\,W_Q \\quad K = X\\,W_K \\quad V = X\\,W_V \\quad A = Q\\,K^{T} / \\sqrt{d_k}",
          spoken:
            "Die Tokenmatrix X wird dreimal mit einer eigenen Projektion multipliziert. So entsteht die Abfrage Q gleich X mal W Q, der Schlüssel K gleich X mal W K und der Wert V gleich X mal W V. Die Bewertung A eines Schlüssels ist das Skalarprodukt aus Abfrage und Schlüssel, geteilt durch die Wurzel der Merkmalszahl d k. Aus diesen Bewertungen macht die Softmax die Gewichte w.",
        },
      ],
    },
    {
      id: "lek-26/s04",
      kind: "experiment",
      title: "Eine Abfrage gegen alle Schlüssel",
      visual: { type: "experiment", experimentId: "exp-qkv" },
      experimentId: "exp-qkv",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-qkv",
          spokenDescription:
            "Ein Säulendiagramm über vier Tokens: Der, Hund, jagt und Katze. Der Regler Abfrage bestimmt, welches Token fragt; die hervorgehobene Säule ist dieses Token. Die Auswahl Ansicht schaltet zwischen den Bewertungen und den Gewichten nach der Softmax um. Daneben stehen die Summe der Gewichte, das größte Gewicht und der gewichtete Wert.",
        },
      ],
    },
    {
      id: "lek-26/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Abfrage: Token Hund, Vektor (0,60 | 0,80)",
          "Abfrage projiziert: (3,00 | 2,40)",
          "Skalarprodukte: 12,60 / 15,12 / 15,75 / 9,45",
          "geteilt durch die Wurzel aus zwei: 8,910 / 10,691 / 11,137 / 6,682",
          "Softmax: 0,0613 / 0,3639 / 0,5682 / 0,0066 (Summe 1,0000)",
          "gewichteter Wert: (0,3671 | 0,6387)",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein durchgerechnetes Beispiel. Die Abfrage ist das Token Hund mit dem Vektor null Komma sechs und null Komma acht. Nach der Projektion steht dort drei und zwei Komma vier. Die Skalarprodukte mit den vier Schlüsseln sind zwölf Komma sechs, fünfzehn Komma eins zwei, fünfzehn Komma sieben fünf und neun Komma vier fünf. Geteilt durch die Wurzel aus zwei ergibt das acht Komma neun eins, zehn Komma sechs neun eins, elf Komma eins drei sieben und sechs Komma sechs acht zwei. Die Softmax macht daraus die Gewichte null Komma null sechs eins drei, null Komma drei sechs drei neun, null Komma fünf sechs acht zwei und null Komma null null sechs sechs; zusammen ergeben sie eins. Der gewichtete Wert ist null Komma drei sechs sieben eins und null Komma sechs drei acht sieben.",
        },
      ],
    },
    {
      id: "lek-26/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\nX = np.array([[1.0, 0.0], [0.6, 0.8], [0.8, 0.6], [0.0, 1.0]])\nW_Q = np.array([[3.0, 1.5], [0.0, 3.0]])\nW_K = np.array([[3.0, 0.75], [1.5, 3.0]])\nW_V = np.array([[0.5, 0.0], [0.0, 1.0]])\n\nq = W_Q @ X[1]                      # Abfrage des Tokens Hund\nk = X @ W_K.T                       # Schluessel aller Tokens\nscores = (k @ q) / np.sqrt(2)       # Bewertungen, skaliert\nw = np.exp(scores - scores.max())\nw = w / w.sum()                     # Gewichte\nprint(w.round(4))                   # [0.0613 0.3639 0.5682 0.0066]\nprint((w @ (X @ W_V.T)).round(4))   # [0.3671 0.6387]",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "q = W_Q @ X[1]\nscores = (X @ W_K.T @ q) / np.sqrt(2)\nw = np.exp(scores - scores.max())\nw = w / w.sum()",
          spoken:
            "Ein kurzes Programm mit NumPy. Zuerst wird die Abfrage des Tokens Hund projiziert: q gleich W Q mal X eins. Danach werden alle Schlüssel projiziert und mit der Abfrage multipliziert; das geteilt durch die Wurzel aus zwei ergibt die Bewertungen. Für die Softmax wird das größte Element abgezogen, damit die Exponentialfunktion nicht überläuft, und anschließend durch die Summe geteilt. Zum Schluss wird jeder Wert mit seinem Gewicht multipliziert und aufsummiert. Die Ausgabe zeigt genau die Gewichte und den gewichteten Wert aus dem Beispiel.",
        },
      ],
    },
    {
      id: "lek-26/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Zwischen Abfrage und einem Schlüssel entsteht eine besonders große Bewertung. Was folgt daraus für dieses Token?",
        options: [
          "Sein Wert bekommt ein großes Gewicht und geht stark in den gewichteten Wert ein.",
          "Es wird aus der Sequenz entfernt, weil es zu ähnlich ist.",
          "Sein Schlüssel wird durch die Abfrage ersetzt.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Zwischen Abfrage und einem Schlüssel entsteht eine besonders große Bewertung. Was folgt daraus für dieses Token?",
          options: [
            "Sein Wert bekommt ein großes Gewicht und geht stark in den gewichteten Wert ein.",
            "Es wird aus der Sequenz entfernt, weil es zu ähnlich ist.",
            "Sein Schlüssel wird durch die Abfrage ersetzt.",
          ],
          answerIndex: 0,
          spoken:
            "Zwischen Abfrage und einem Schlüssel entsteht eine besonders große Bewertung. Was folgt daraus für dieses Token? Erstens: sein Wert bekommt ein großes Gewicht und geht stark in den gewichteten Wert ein. Zweitens: es wird aus der Sequenz entfernt, weil es zu ähnlich ist. Drittens: sein Schlüssel wird durch die Abfrage ersetzt.",
          explanation:
            "Die Bewertung geht durch die Softmax und wird dort zu einem Gewicht. Ein großes Gewicht heißt: der Wert dieses Tokens trägt viel zum gewichteten Wert bei. Das Token selbst bleibt natürlich in der Sequenz.",
        },
      ],
    },
    {
      id: "lek-26/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Abfrage bestimmt, wer fragt. Die Schlüssel liefern die Bewertungen, die Softmax macht daraus Gewichte, die sich zu eins summieren. Der gewichtete Wert ist eine Mischung der Werte aller Tokens, gesteuert von diesen Gewichten.",
        },
      ],
    },
  ],
};
