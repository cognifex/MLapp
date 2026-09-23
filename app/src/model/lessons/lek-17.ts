import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek17: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-17",
  number: 17,
  chapterId: "kap-05",
  title: "Aktivierungen",
  learningGoals: [
    "ReLU, Sigmoid, Tanh und GELU in Form, Wertebereich und Steigung unterscheiden",
    "Die Steigung als Voraussetzung dafür deuten, dass beim Lernen etwas ankommt",
    "Sättigung und gesperrte ReLU als Grenzen der Aktivierung erkennen",
  ],
  requiresPreviousKnowledge: [
    "Gewichtete Summe und Aktivierung im Neuron (Lektion 15)",
    "Die Steigung einer Funktion (Lektion 4)",
  ],
  prerequisites: ["lek-15"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-17/s01",
      kind: "heading",
      title: "Welche Krümmung ins Netz kommt",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Aktivierungen" }],
    },
    {
      id: "lek-17/s02",
      kind: "paragraph",
      title: "Ohne Aktivierung bleibt alles gerade",
      visual: {
        type: "text",
        text: "Zwei Schichten ohne Aktivierung dazwischen sind zusammen wieder nur eine Matrix: Hintereinandergelegte gerade Abbildungen bleiben gerade. Erst die Aktivierung zwischen den Schichten bringt Krümmung ins Netz. Außerdem legt sie fest, in welchem Bereich die Ausgabe liegen darf: Sigmoid und Tanh bleiben beschränkt, ReLU und GELU wachsen nach oben unbeschränkt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Zwei Schichten ohne Aktivierung dazwischen sind zusammen wieder nur eine Matrix: Hintereinandergelegte gerade Abbildungen bleiben gerade. Erst die Aktivierung zwischen den Schichten bringt Krümmung ins Netz. Außerdem legt sie fest, in welchem Bereich die Ausgabe liegen darf. Sigmoid und Tanh bleiben beschränkt, ReLU und GELU wachsen nach oben unbeschränkt.",
        },
      ],
    },
    {
      id: "lek-17/s03",
      kind: "equation",
      title: "ReLU, Sigmoid und Tanh",
      visual: {
        type: "equation",
        latex:
          "ReLU(z) = \\max(0, z), \\quad \\sigma(z) = \\frac{1}{1 + \\exp(-z)}, \\quad \\tanh(z) = \\frac{\\exp(z) - \\exp(-z)}{\\exp(z) + \\exp(-z)}",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "ReLU(z) = \\max(0, z), \\quad \\sigma(z) = \\frac{1}{1 + \\exp(-z)}, \\quad \\tanh(z) = \\frac{\\exp(z) - \\exp(-z)}{\\exp(z) + \\exp(-z)}",
          spoken:
            "ReLU von z ist das Maximum aus null und z, gibt also negative Werte als null zurück. Sigmoid von z ist eins durch eins plus e hoch minus z und liegt zwischen null und eins. Tangens hyperbolicus von z ist e hoch z minus e hoch minus z, geteilt durch e hoch z plus e hoch minus z; er liegt zwischen minus eins und eins.",
        },
      ],
    },
    {
      id: "lek-17/s04",
      kind: "equation",
      title: "GELU als glatte Variante",
      visual: {
        type: "equation",
        latex:
          "GELU(z) \\approx \\frac{z}{2}\\left(1 + \\tanh\\left(\\sqrt{\\frac{2}{\\pi}}\\left(z + 0,044715\\,z^{3}\\right)\\right)\\right)",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "GELU(z) \\approx \\frac{z}{2}\\left(1 + \\tanh\\left(\\sqrt{\\frac{2}{\\pi}}\\left(z + 0,044715\\,z^{3}\\right)\\right)\\right)",
          spoken:
            "GELU wird hier über den Tangens hyperbolicus genähert: z halbe mal, eins plus Tangens hyperbolicus von, Wurzel aus zwei durch pi mal, z plus null Komma null vier vier sieben eins fünf mal z hoch drei. Die Näherung ist bei null exakt null und weicht von der genauen GELU um höchstens null Komma null null null fünf ab.",
        },
      ],
    },
    {
      id: "lek-17/s05",
      kind: "experiment",
      title: "Die vier Funktionen vergleichen",
      visual: { type: "experiment", experimentId: "exp-aktivierungen" },
      experimentId: "exp-aktivierungen",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-aktivierungen",
          spokenDescription:
            "Ein Koordinatensystem mit vier Kurven: ReLU, Sigmoid, Tanh und GELU. Die ausgewählte Kurve ist durchgezogen, " +
            "die anderen sind gestrichelt. Der Regler x verschiebt einen Punkt auf der ausgewählten Kurve. " +
            "Daneben stehen die Werte aller vier Funktionen an dieser Stelle und die Steigung der ausgewählten Funktion.",
        },
      ],
    },
    {
      id: "lek-17/s06",
      kind: "example",
      title: "Nachgerechnete Stellen",
      visual: {
        type: "list",
        items: [
          "ReLU(-1) = 0, Sigmoid(0) = 0,5, Tanh(0) = 0, GELU(0) = 0",
          "An der Stelle 1: ReLU = 1, Sigmoid = 0,7311, Tanh = 0,7616, GELU = 0,8412",
          "An der Stelle -2: ReLU = 0, Sigmoid = 0,1192, Tanh = -0,9640, GELU = -0,0454",
          "Steigungen an der Stelle 0: Sigmoid 0,25, Tanh 1, GELU 0,5",
          "Steigungen an der Stelle 2: Sigmoid 0,1050, Tanh 0,0707, GELU 1,0861",
          "ReLU hat rechts von null immer die Steigung 1, links davon 0",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Nachgerechnete Stellen. ReLU von minus eins ist null, weil der Wert negativ ist. Sigmoid von null ist null Komma fünf, Tanh von null und GELU von null sind beide null. An der Stelle eins ist ReLU eins, Sigmoid null Komma sieben drei eins eins, Tanh null Komma sieben sechs eins sechs und GELU null Komma acht vier eins zwei. Bei x gleich null hat Sigmoid die Steigung null Komma zwei fünf, Tanh eins und GELU null Komma fünf. Bei x gleich zwei sind die Steigungen von Sigmoid und Tanh schon auf null Komma eins null fünf null und null Komma null sieben null sieben gefallen: dort ist die Ausgabe fast gesättigt.",
        },
      ],
    },
    {
      id: "lek-17/s07",
      kind: "code",
      title: "Die vier Funktionen in Python",
      visual: {
        type: "code",
        language: "python",
        code:
          "import math\n\n" +
          "def relu(z):\n" +
          "    return max(0.0, z)\n" +
          "\n" +
          "def sigmoid(z):\n" +
          "    return 1.0 / (1.0 + math.exp(-z))\n" +
          "\n" +
          "def gelu(z):\n" +
          "    k = math.sqrt(2.0 / math.pi)\n" +
          "    return 0.5 * z * (1.0 + math.tanh(k * (z + 0.044715 * z ** 3)))\n" +
          "\n" +
          "print(relu(-1.0), sigmoid(0.0), math.tanh(0.0), gelu(0.0))\n" +
          "# 0.0 0.5 0.0 0.0",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def relu(z):\n    return max(0.0, z)\n\ndef sigmoid(z):\n    return 1.0 / (1.0 + math.exp(-z))",
          spoken:
            "In Python ist ReLU das Maximum aus null und z, Sigmoid eins durch eins plus e hoch minus z. Aufgerufen mit minus eins, null, null und null liefert das den Wert null, dann null Komma fünf, dann null und wieder null.",
        },
      ],
    },
    {
      id: "lek-17/s08",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was bedeutet es fürs Lernen, wenn die Steigung einer Aktivierung fast null ist?",
        options: [
          "Änderungen an der gewichteten Summe bewegen die Ausgabe kaum, dort kommt kein Lernsignal an",
          "Das Neuron rechnet dann besonders genau",
          "Die Ausgabe wird dadurch immer null",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Was bedeutet es für das Lernen, wenn die Steigung einer Aktivierung fast null ist?",
          options: [
            "Änderungen an der gewichteten Summe bewegen die Ausgabe kaum, dort kommt kein Lernsignal an",
            "Das Neuron rechnet dann besonders genau",
            "Die Ausgabe wird dadurch immer null",
          ],
          answerIndex: 0,
          spoken:
            "Was bedeutet es für das Lernen, wenn die Steigung einer Aktivierung fast null ist? Bewegen Änderungen an der gewichteten Summe die Ausgabe kaum, rechnet das Neuron dann besonders genau, oder wird die Ausgabe dadurch immer null?",
          explanation:
            "Beim Rückwärtsrechnen wird mit dieser Steigung multipliziert. Ist sie fast null, kommt bei den Gewichten kaum noch ein Signal an: das ist die Sättigung bei Sigmoid und Tanh und der gesperrte Bereich bei ReLU. Bei x gleich zwei liegt die Steigung von Tanh nur noch bei null Komma null sieben null sieben.",
        },
      ],
    },
    {
      id: "lek-17/s09",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Aktivierung entscheidet, in welchem Bereich die Ausgabe eines Neurons liegt und wie die Steigung aussieht. ReLU ist einfach und sperrt alles Negative, Sigmoid und Tanh bleiben beschränkt und werden außen flach, GELU geht glatt durch den Nullpunkt. Wichtig ist die Steigung: ist sie null, kommt beim Lernen kein Signal mehr an.",
        },
      ],
    },
  ],
};
