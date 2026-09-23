import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek15: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-15",
  number: 15,
  chapterId: "kap-05",
  title: "Neuron",
  learningGoals: [
    "Die gewichtete Summe als Skalarprodukt aus Eingaben und Gewichten lesen",
    "Den Bias als Verschiebung der Summe deuten",
    "Die Rolle der Aktivierung zwischen Summe und Ausgabe beschreiben",
  ],
  requiresPreviousKnowledge: [
    "Skalarprodukt zweier Vektoren (Lektion 2)",
    "Sigmoid als Wahrscheinlichkeit (Lektion 12)",
  ],
  prerequisites: ["lek-12", "lek-02"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-15/s01",
      kind: "heading",
      title: "Aus Eingaben wird eine Ausgabe",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Neuron" }],
    },
    {
      id: "lek-15/s02",
      kind: "paragraph",
      title: "Zwei Schritte hintereinander",
      visual: {
        type: "text",
        text: "Ein Neuron rechnet zwei Schritte hintereinander. Erst wird jede Eingabe mit ihrem Gewicht multipliziert und alles zusammengezählt; dazu kommt der Bias. Diese Summe heißt gewichtete Summe. Danach schiebt die Aktivierung den Wert in den Bereich, den das Netz braucht. Gewichte sagen, wie stark eine Eingabe zählt, der Bias verschiebt die Summe, ohne an eine Eingabe gekoppelt zu sein.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Neuron rechnet zwei Schritte hintereinander. Erst wird jede Eingabe mit ihrem Gewicht multipliziert und alles zusammengezählt; dazu kommt der Bias. Diese Summe heißt gewichtete Summe. Danach schiebt die Aktivierung den Wert in den Bereich, den das Netz braucht. Die Gewichte sagen, wie stark eine Eingabe zählt. Der Bias verschiebt die Summe, ohne an eine Eingabe gekoppelt zu sein.",
        },
      ],
    },
    {
      id: "lek-15/s03",
      kind: "equation",
      title: "Gewichtete Summe und Aktivierung",
      visual: {
        type: "equation",
        latex: "z = w_{1}x_{1} + w_{2}x_{2} + b, \\qquad a = \\varphi(z)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "z = w_{1}x_{1} + w_{2}x_{2} + b, \\qquad a = \\varphi(z)",
          spoken:
            "z ist gleich w eins mal x eins, plus w zwei mal x zwei, plus b. Die Ausgabe a ist die Aktivierung von z. Das Zeichen phi steht für die gewählte Aktivierungsfunktion, zum Beispiel ReLU oder Sigmoid.",
        },
      ],
    },
    {
      id: "lek-15/s04",
      kind: "experiment",
      title: "Beiträge, Summe und Aktivierung verfolgen",
      visual: { type: "experiment", experimentId: "exp-neuron" },
      experimentId: "exp-neuron",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-neuron",
          spokenDescription:
            "Zwei Regler für die Eingaben, zwei für die Gewichte, einer für den Bias und eine Auswahl der Aktivierung. " +
            "Das Säulendiagramm zeigt den Beitrag der ersten Eingabe, den Beitrag der zweiten Eingabe und den Bias; " +
            "die letzte Säule ist die gewichtete Summe aus diesen drei Beiträgen. Darunter stehen die gewichtete Summe z, " +
            "die Ausgabe a und die Steigung der Aktivierung.",
        },
      ],
    },
    {
      id: "lek-15/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "x₁ = 1,5, x₂ = 0,5, w₁ = 2, w₂ = -1,5, b = 0,5",
          "w₁ · x₁ = 2 · 1,5 = 3",
          "w₂ · x₂ = -1,5 · 0,5 = -0,75",
          "z = 3 - 0,75 + 0,5 = 2,75",
          "ReLU(2,75) = 2,75, Sigmoid(2,75) = 0,9399",
          "Tanh(2,75) = 0,9919, GELU(2,75) = 2,7423",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Die erste Eingabe ist eins Komma fünf, die zweite null Komma fünf. Das erste Gewicht ist zwei, das zweite minus eins Komma fünf, der Bias null Komma fünf. Der erste Beitrag ist zwei mal eins Komma fünf, also drei. Der zweite Beitrag ist minus eins Komma fünf mal null Komma fünf, also minus null Komma sieben fünf. Mit dem Bias ergibt das die gewichtete Summe zwei Komma sieben fünf. ReLU lässt diesen positiven Wert stehen, Sigmoid macht daraus null Komma neun drei neun neun, Tanh null Komma neun neun eins neun und GELU zwei Komma sieben vier zwei drei.",
        },
      ],
    },
    {
      id: "lek-15/s06",
      kind: "code",
      title: "Ein Neuron in Python",
      visual: {
        type: "code",
        language: "python",
        code:
          "import numpy as np\n\n" +
          "x = np.array([1.5, 0.5])\n" +
          "w = np.array([2.0, -1.5])\n" +
          "b = 0.5\n" +
          "\n" +
          "z = w @ x + b          # 2.75, das Skalarprodukt plus Bias\n" +
          "a = max(0.0, z)        # ReLU\n" +
          "print(z, a)            # 2.75 2.75",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "z = w @ x + b\na = max(0.0, z)",
          spoken:
            "In Python ist die gewichtete Summe das Skalarprodukt aus w und x plus b. Das Zeichen @ bedeutet Skalarprodukt. Die Aktivierung ReLU ist das Maximum aus null und z, hier also zwei Komma sieben fünf.",
        },
      ],
    },
    {
      id: "lek-15/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Wofür ist der Bias im Neuron zuständig?",
        options: [
          "Er verschiebt die gewichtete Summe, unabhängig von den Eingaben",
          "Er gewichtet die erste Eingabe",
          "Er begrenzt die Ausgabe auf den Bereich null bis eins",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Wofür ist der Bias im Neuron zuständig?",
          options: [
            "Er verschiebt die gewichtete Summe, unabhängig von den Eingaben",
            "Er gewichtet die erste Eingabe",
            "Er begrenzt die Ausgabe auf den Bereich null bis eins",
          ],
          answerIndex: 0,
          spoken:
            "Wofür ist der Bias im Neuron zuständig? Verschiebt er die gewichtete Summe unabhängig von den Eingaben, gewichtet er die erste Eingabe, oder begrenzt er die Ausgabe auf den Bereich null bis eins?",
          explanation:
            "Der Bias wird zur Summe addiert, ohne an eine Eingabe gekoppelt zu sein: er verschiebt die Grenze, ab der ein Neuron anfängt zu reagieren. Wie stark eine Eingabe zählt, bestimmt dagegen ihr Gewicht. Auf null bis eins begrenzt nur Sigmoid.",
        },
      ],
    },
    {
      id: "lek-15/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Neuron multipliziert jede Eingabe mit ihrem Gewicht, zählt alles zusammen und addiert den Bias. Aus dieser gewichteten Summe macht die Aktivierung die Ausgabe. Mit zwei Eingaben ist das ein Skalarprodukt plus Bias - die kleinste Einheit, aus der ein Netz aufgebaut wird.",
        },
      ],
    },
  ],
};
