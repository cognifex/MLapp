import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek20: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-20",
  number: 20,
  chapterId: "kap-06",
  title: "Embeddings",
  learningGoals: [
    "Wörter als Vektoren auffassen und ihre Richtung vergleichen",
    "Ähnlichkeit als Kosinus zwischen zwei Wortvektoren berechnen",
    "Erkennen, dass die Länge und die Richtung eines Vektors zwei verschiedene Aussagen sind",
  ],
  requiresPreviousKnowledge: [
    "Vektoren, Skalarprodukt und Längen von Pfeilen",
    "Ein neuronales Netz mit gelernten Gewichten",
  ],
  prerequisites: ["lek-02", "lek-17"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-20/s01",
      kind: "heading",
      title: "Wörter als Richtungen im Raum",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Embeddings" }],
    },
    {
      id: "lek-20/s02",
      kind: "paragraph",
      title: "Bedeutung als Lage im Vektorraum",
      visual: {
        type: "text",
        text: "Ein Embedding ordnet jedem Wort einen Vektor zu. Ähnliche Wörter bekommen Vektoren, die in eine ähnliche Richtung zeigen; der Kosinus zwischen ihnen ist dann nahe eins. Andere Richtungen bedeuten andere Bedeutung, gegenläufige Richtungen das Gegenteil. Für das Bild hier reichen zwei Dimensionen - ausgerechnet sind es dieselben Formeln, mit denen ein Modell mit vielen hundert Dimensionen arbeitet. Die Länge eines Wortvektors sagt dabei wenig über die Bedeutung; verglichen wird deshalb die Richtung, nicht die Länge.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Embedding ordnet jedem Wort einen Vektor zu. Ähnliche Wörter bekommen Vektoren, die in eine ähnliche Richtung zeigen; der Kosinus zwischen ihnen ist dann nahe eins. Für das Bild reichen zwei Dimensionen - gerechnet wird mit denselben Formeln wie bei einem Modell mit vielen hundert Dimensionen. Verglichen wird die Richtung, nicht die Länge.",
        },
      ],
    },
    {
      id: "lek-20/s03",
      kind: "equation",
      title: "Ähnlichkeit als Kosinus",
      visual: { type: "equation", latex: "\\cos(\\theta) = \\frac{a \\cdot b}{|a| \\, |b|}" },
      spoken: [
        {
          kind: "equation",
          latex: "\\cos(\\theta) = \\frac{a \\cdot b}{|a| \\, |b|}",
          spoken:
            "Der Kosinus des Winkels zwischen zwei Vektoren ist das Skalarprodukt geteilt durch das Produkt ihrer Längen. Eins bedeutet gleiche Richtung, null bedeutet rechter Winkel, minus eins bedeutet Gegenrichtung.",
        },
      ],
    },
    {
      id: "lek-20/s04",
      kind: "experiment",
      title: "Zwei Wortvektoren ziehen und vergleichen",
      visual: { type: "experiment", experimentId: "exp-embeddings" },
      experimentId: "exp-embeddings",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-embeddings",
          spokenDescription:
            "Eine Zeichenebene mit vier festen Wortvektoren: Hund, Wolf, Auto und Bahn. Zwei weitere Pfeile, a und b, lassen sich mit dem Finger ziehen. Daneben stehen der Kosinus, der Winkel in Grad, das Skalarprodukt, beide Längen und der Abstand der Spitzen. Zusätzlich wird genannt, welcher feste Wortvektor jeweils am nächsten liegt.",
        },
      ],
    },
    {
      id: "lek-20/s05",
      kind: "example",
      title: "Zwei Wortpaare nachgerechnet",
      visual: {
        type: "list",
        items: [
          "Hund = (2|1,1), Wolf = (2,3|1,5)",
          "Skalarprodukt: 2·2,3 + 1,1·1,5 = 6,25",
          "|Hund| = √(4 + 1,21) = 2,2825",
          "|Wolf| = √(5,29 + 2,25) = 2,7459",
          "Kosinus = 6,25 / (2,2825·2,7459) = 0,9972",
          "Winkel = 4,3 Grad - fast dieselbe Richtung",
          "Hund und Auto: Skalarprodukt -1,51, Kosinus -0,2528",
          "Hund und Bahn: Skalarprodukt -2,88, Kosinus -0,5217",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Hund steht bei zwei und eins Komma eins, Wolf bei zwei Komma drei und eins Komma fünf. Das Skalarprodukt ist sechs Komma zwei fünf, die Längen sind zwei Komma zwei acht zwei fünf und zwei Komma sieben vier fünf neun. Der Kosinus ist null Komma neun neun sieben zwei, der Winkel vier Komma drei Grad: fast dieselbe Richtung. Bei Hund und Auto ist der Kosinus minus null Komma zwei fünf zwei acht, bei Hund und Bahn minus null Komma fünf zwei eins sieben - deutlich andere Richtungen.",
        },
      ],
    },
    {
      id: "lek-20/s06",
      kind: "code",
      title: "Kosinus in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\nwoerter = {'Hund': (2.0, 1.1), 'Wolf': (2.3, 1.5), 'Auto': (-1.8, 1.9)}\n\ndef kosinus(a, b):\n    skalar = a[0] * b[0] + a[1] * b[1]\n    laengen = math.hypot(*a) * math.hypot(*b)\n    return skalar / laengen\n\nfor wort, vektor in woerter.items():\n    print(wort, round(kosinus(vektor, woerter['Hund']), 4))\n\n# In echten Modellen steht statt 2 eine Dimension wie 768 - die Formel bleibt dieselbe.",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "skalar = a[0] * b[0] + a[1] * b[1]\nlaengen = math.hypot(*a) * math.hypot(*b)\nreturn skalar / laengen",
          spoken:
            "Das Skalarprodukt multipliziert die Koordinaten paarweise und addiert die Produkte. Die Längen kommen aus der Wurzel der Quadratsumme. Der Kosinus ist das Skalarprodukt geteilt durch das Produkt der Längen. In einem echten Modell steht statt zwei eine Dimension wie siebenhundertachtundsechzig - die Formel bleibt dieselbe.",
        },
      ],
    },
    {
      id: "lek-20/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Der Kosinus zwischen zwei Wortvektoren ist null. Was bedeutet das?",
        options: [
          "Die Vektoren stehen senkrecht aufeinander: hier gibt es keine gemeinsame Richtung.",
          "Die beiden Wörter bedeuten genau dasselbe.",
          "Einer der beiden Vektoren ist der Nullvektor.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Der Kosinus zwischen zwei Wortvektoren ist null. Was bedeutet das?",
          options: [
            "Die Vektoren stehen senkrecht aufeinander: hier gibt es keine gemeinsame Richtung.",
            "Die beiden Wörter bedeuten genau dasselbe.",
            "Einer der beiden Vektoren ist der Nullvektor.",
          ],
          answerIndex: 0,
          spoken:
            "Der Kosinus zwischen zwei Wortvektoren ist null. Was bedeutet das? Erstens: die Vektoren stehen senkrecht aufeinander, hier gibt es keine gemeinsame Richtung. Zweitens: die beiden Wörter bedeuten genau dasselbe. Oder drittens: einer der beiden Vektoren ist der Nullvektor.",
          explanation:
            "Ein Kosinus von null heißt rechter Winkel: Skalarprodukt null. Gleiche Bedeutung wäre ein Kosinus nahe eins, wie bei Hund und Wolf mit null Komma neun neun sieben zwei. Ein Nullvektor hat gar keine Richtung - dort ist der Kosinus nicht definiert, nicht null.",
        },
      ],
    },
    {
      id: "lek-20/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Embedding übersetzt ein Wort in einen Vektor. Ähnlichkeit ist der Kosinus dieser Vektoren: nahe eins bedeutet verwandt, null bedeutet unbeteiligt, minus eins bedeutet entgegengesetzt. Die Länge bleibt dabei außen vor, verglichen wird die Richtung. Was geschieht, wenn man zwischen zwei solchen Vektoren wandert, klärt die nächste Lektion.",
        },
      ],
    },
  ],
};
