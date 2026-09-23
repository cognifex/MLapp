import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek16: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-16",
  number: 16,
  chapterId: "kap-05",
  title: "MLP",
  learningGoals: [
    "Den Vorwärtslauf durch mehrere Schichten Schritt für Schritt verfolgen",
    "Erklären, warum eine Schicht zwischen Eingabe und Ausgabe nötig ist",
    "Beschreiben, was ReLU mit den versteckten Einheiten macht",
  ],
  requiresPreviousKnowledge: [
    "Das einzelne Neuron mit gewichteter Summe und Aktivierung (Lektion 15)",
  ],
  prerequisites: ["lek-15"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-16/s01",
      kind: "heading",
      title: "Mehrere Neuronen hintereinander",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Mehrschichtiges Netz" }],
    },
    {
      id: "lek-16/s02",
      kind: "paragraph",
      title: "Von der geraden Grenze zur Kombination",
      visual: {
        type: "text",
        text: "Ein einzelnes Neuron zieht nur eine gerade Grenze durch die Daten. Ein mehrschichtiges Netz setzt mehrere Neuronen hintereinander: Die erste Schicht bildet aus den Eingaben Zwischenwerte, die nächste Schicht rechnet mit diesen Zwischenwerten weiter. Jede Schicht ist wieder gewichtete Summe plus Aktivierung. Versteckte Schichten heißen sie, weil man ihre Werte beim Anwenden nicht sieht - sie sind nur Zwischenschritte.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein einzelnes Neuron zieht nur eine gerade Grenze durch die Daten. Ein mehrschichtiges Netz setzt mehrere Neuronen hintereinander. Die erste Schicht bildet aus den Eingaben Zwischenwerte, die nächste Schicht rechnet mit diesen Zwischenwerten weiter. Jede Schicht ist wieder eine gewichtete Summe plus Aktivierung. Versteckte Schichten heißen sie, weil man ihre Werte beim Anwenden nicht sieht: sie sind nur Zwischenschritte.",
        },
      ],
    },
    {
      id: "lek-16/s03",
      kind: "equation",
      title: "Der Vorwärtslauf",
      visual: {
        type: "equation",
        latex:
          "h_1 = ReLU(W_1 x + b_1), \\quad h_2 = ReLU(W_2 h_1 + b_2), \\quad y = W_3 h_2 + b_3",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "h_1 = ReLU(W_1 x + b_1), \\quad h_2 = ReLU(W_2 h_1 + b_2), \\quad y = W_3 h_2 + b_3",
          spoken:
            "h eins ist ReLU von W eins mal x plus b eins. Dieselbe Rechnung passiert mit h eins noch einmal und ergibt h zwei. Die Ausgabe y ist W drei mal h zwei plus b drei. W eins ist eine Matrix: jede ihrer Zeilen ist ein Neuron mit einem Gewicht je Eingabe.",
        },
      ],
    },
    {
      id: "lek-16/s04",
      kind: "experiment",
      title: "Datenfluss durch die Schichten verfolgen",
      visual: { type: "experiment", experimentId: "exp-mlp" },
      experimentId: "exp-mlp",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-mlp",
          spokenDescription:
            "Ein kleines Netz mit zwei Eingaben, zwei versteckten Schichten und einer Ausgabe. " +
            "Mit dem Schalter wählt man die Schicht, deren Werte als Säulen erscheinen: Eingabe, erste versteckte Schicht, " +
            "zweite versteckte Schicht oder Ausgabe. Der gestrichelte Umriss einer Säule zeigt die gewichtete Summe vor der Aktivierung; " +
            "wird sie negativ, steht die Säule auf null, weil ReLU den Wert abschneidet. Rechts stehen immer die Zahl der Ausgabeschicht " +
            "und die Summe der Beträge in der gewählten Schicht.",
        },
      ],
    },
    {
      id: "lek-16/s05",
      kind: "example",
      title: "Nachgerechneter Durchlauf",
      visual: {
        type: "list",
        items: [
          "Eingabe: x₁ = 1,0, x₂ = 0,5",
          "Erste Einheit: 0,8 · 1,0 - 1,2 · 0,5 + 0,1 = 0,30",
          "Schicht 1, Summen: 0,30 / -0,90 / 0,35",
          "Nach ReLU: 0,30 / 0 / 0,35 - die negative Summe wird abgeschnitten",
          "Schicht 2, Summen: 0,595 / -0,26, nach ReLU: 0,595 / 0",
          "Ausgabe: 1,1 · 0,595 - 0,8 · 0 + 0,2 = 0,8545",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechneter Durchlauf. Die Eingabe ist eins Komma null und null Komma fünf. Die erste Einheit rechnet null Komma acht mal eins, minus eins Komma zwei mal null Komma fünf, plus null Komma eins, das ergibt null Komma drei null. Die drei Summen der ersten Schicht sind null Komma drei null, minus null Komma neun und null Komma drei fünf. ReLU schneidet die negative Summe ab, übrig bleiben null Komma drei null, null und null Komma drei fünf. Die zweite Schicht rechnet daraus null Komma fünf neun fünf und minus null Komma zwei sechs; die negative Summe wird wieder abgeschnitten. Die Ausgabe ist eins Komma eins mal null Komma fünf neun fünf, minus null Komma acht mal null, plus null Komma zwei, also null Komma acht fünf vier fünf.",
        },
      ],
    },
    {
      id: "lek-16/s06",
      kind: "code",
      title: "Der Vorwärtslauf in Python",
      visual: {
        type: "code",
        language: "python",
        code:
          "import numpy as np\n\n" +
          "W1 = np.array([[0.8, -1.2], [-1.0, 0.6], [0.5, -0.9]])\n" +
          "b1 = np.array([0.1, -0.2, 0.3])\n" +
          "W2 = np.array([[1.0, -0.5, 0.7], [-0.6, 0.9, 0.2]])\n" +
          "b2 = np.array([0.05, -0.15])\n" +
          "W3 = np.array([1.1, -0.8])\n" +
          "b3 = 0.2\n" +
          "\n" +
          "x = np.array([1.0, 0.5])\n" +
          "h1 = np.maximum(0.0, W1 @ x + b1)   # [0.3  0.   0.35]\n" +
          "h2 = np.maximum(0.0, W2 @ h1 + b2)  # [0.595 0.  ]\n" +
          "y = W3 @ h2 + b3                    # 0.8545",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "h1 = np.maximum(0.0, W1 @ x + b1)\nh2 = np.maximum(0.0, W2 @ h1 + b2)\ny = W3 @ h2 + b3",
          spoken:
            "In Python ist eine Schicht eine Matrix mal den Eingabevektor plus Bias, danach das Maximum mit null, also ReLU. Dieselben drei Zeilen wiederholen sich für jede Schicht. Die letzte Schicht rechnet ohne Aktivierung.",
        },
      ],
    },
    {
      id: "lek-16/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Wozu braucht ein Netz eine zweite versteckte Schicht?",
        options: [
          "Weil eine einzelne Schicht nur eine gerade Grenze bilden kann",
          "Weil damit der Vorwärtslauf schneller wird",
          "Weil ReLU sonst nicht funktioniert",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Wozu braucht ein Netz eine zweite versteckte Schicht?",
          options: [
            "Weil eine einzelne Schicht nur eine gerade Grenze bilden kann",
            "Weil damit der Vorwärtslauf schneller wird",
            "Weil ReLU sonst nicht funktioniert",
          ],
          answerIndex: 0,
          spoken:
            "Wozu braucht ein Netz eine zweite versteckte Schicht? Weil eine einzelne Schicht nur eine gerade Grenze bilden kann, weil der Vorwärtslauf dadurch schneller wird, oder weil ReLU sonst nicht funktioniert?",
          explanation:
            "Eine Schicht aus Neuronen ohne Aktivierung wäre wieder nur eine Matrix, also eine gerade Abbildung. Erst die Aktivierung zwischen den Schichten macht daraus gekrümmte Grenzen. Schneller wird der Vorwärtslauf durch mehr Schichten nicht, sondern langsamer.",
        },
      ],
    },
    {
      id: "lek-16/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein mehrschichtiges Netz rechnet Schicht für Schicht: Matrix mal Eingabe plus Bias, dann die Aktivierung. Die Zwischenwerte heißen versteckte Schichten. ReLU setzt negative Summen auf null, deshalb tragen einige Einheiten in einem Durchlauf gar nichts bei.",
        },
      ],
    },
  ],
};
