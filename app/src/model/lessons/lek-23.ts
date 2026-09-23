import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek23: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-23",
  number: 23,
  chapterId: "kap-06",
  title: "VAE",
  learningGoals: [
    "Erklären, was der Unterschied zwischen einem festen Punkt und einer Verteilung im Latentraum ist",
    "Aus Mittel und Streuung der Latentverteilung Stichproben erzeugen",
    "Mittel und Streuung einer Stichprobe mit ihrer Vorgabe vergleichen",
  ],
  requiresPreviousKnowledge: [
    "Mittelwert und Streuung einer Zahlenreihe",
    "Autoencoder (Lektion 22)",
  ],
  prerequisites: ["lek-22"],
  estimatedMinutes: 18,
  sections: [
    {
      id: "lek-23/s01",
      kind: "heading",
      title: "Kein Punkt, sondern eine Verteilung",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "V A E" }],
    },
    {
      id: "lek-23/s02",
      kind: "paragraph",
      title: "Der Autoencoder wird zum Erzeuger",
      visual: {
        type: "text",
        text: "Ein Autoencoder legt jedes Bild auf genau einen Punkt im Latentraum. Ein VAE, ein variationaler Autoencoder, legt es stattdessen auf eine ganze Verteilung: einen Mittelwert und eine Streuung. Beim Dekodieren wird aus dieser Verteilung eine Stichprobe gezogen und daraus ein Bild gebaut. Weil auch die Nachbarschaft eines Punktes etwas Sinnvolles ergeben muss, entstehen zwischen den gelernten Punkten keine sinnlosen Bilder - und man kann neue Bilder erzeugen, indem man einfach Stichproben zieht.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Autoencoder legt jedes Bild auf genau einen Punkt im Latentraum. Ein V A E, ein variationaler Autoencoder, legt es stattdessen auf eine ganze Verteilung: einen Mittelwert und eine Streuung. Beim Dekodieren wird aus dieser Verteilung eine Stichprobe gezogen und daraus ein Bild gebaut. Weil auch die Nachbarschaft eines Punktes etwas Sinnvolles ergeben muss, entstehen zwischen den gelernten Punkten keine sinnlosen Bilder, und man kann neue Bilder erzeugen, indem man einfach Stichproben zieht.",
        },
      ],
    },
    {
      id: "lek-23/s03",
      kind: "equation",
      title: "Die Stichprobe",
      visual: { type: "equation", latex: "z = \\mu + \\sigma \\cdot q" },
      spoken: [
        {
          kind: "equation",
          latex: "z = \\mu + \\sigma \\cdot q",
          spoken:
            "Die Stichprobe ist das Mittel plus die Streuung mal einem Tabellenwert. Der Tabellenwert kommt aus einer festen Zahlenfolge, die einer Glockenkurve mit Mittel null und Streuung eins entspricht. Das Mittel verschiebt die ganze Verteilung, die Streuung dehnt sie.",
        },
      ],
    },
    {
      id: "lek-23/s04",
      kind: "experiment",
      title: "Latentverteilung einstellen",
      visual: { type: "experiment", experimentId: "exp-vae" },
      experimentId: "exp-vae",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-vae",
          spokenDescription:
            "Zwei Regler stellen Mittel und Streuung der Latentverteilung ein, ein dritter die Zahl der Stichproben. Die acht Säulen zeigen, wie viele Stichproben in jedes Intervall fallen. Daneben stehen Mittel und Streuung der Stichproben und die Vorgaben, aus denen sie gezogen wurden.",
        },
      ],
    },
    {
      id: "lek-23/s05",
      kind: "example",
      title: "Nachgerechnet mit der festen Zahlenfolge",
      visual: {
        type: "list",
        items: [
          "Tabelle q: -1,28  -0,86  -0,54  -0,16  0,22  0,61  1,02  1,49",
          "Vorgabe: Mittel 0,5, Streuung 1,0",
          "Erste Stichprobe: 0,5 + 1,0 · (-1,28) = -0,78",
          "Letzte Stichprobe: 0,5 + 1,0 · 1,49 = 1,99",
          "Mittel der acht Stichproben: 0,5625 (Vorgabe 0,5)",
          "Streuung der acht Stichproben: 0,8906 (Vorgabe 1,0)",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Die Tabelle beginnt bei minus eins Komma zwei acht und endet bei eins Komma vier neun. Bei Mittel null Komma fünf und Streuung eins wird daraus die erste Stichprobe minus null Komma sieben acht und die letzte eins Komma neun neun. Das Mittel der acht Stichproben ist null Komma fünf sechs zwei fünf, also etwas über der Vorgabe. Die Streuung der acht Stichproben ist null Komma acht neun null sechs, also unter der Vorgabe eins. Acht Werte treffen die Verteilung eben nur ungefähr.",
        },
      ],
    },
    {
      id: "lek-23/s06",
      kind: "code",
      title: "In Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\n# feste Zahlenfolge statt Zufallsgenerator: dieselbe Eingabe, dieselbe Stichprobe\ntabelle = np.array([-1.28, -0.86, -0.54, -0.16, 0.22, 0.61, 1.02, 1.49])\nmu, sigma = 0.5, 1.0\n\nstichproben = mu + sigma * tabelle\nprint(stichproben)                 # [-0.78 -0.36 -0.04  0.34  0.72  1.11  1.52  1.99]\nprint(stichproben.mean())          # 0.5625\nprint(stichproben.std())           # 0.8905721475545931\n\n# zur Kontrolle: Mittel verschiebt, Streuung dehnt\nprint((mu + 2.0 * tabelle).std())  # 1.7811442951091863",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import numpy as np\n\n# feste Zahlenfolge statt Zufallsgenerator: dieselbe Eingabe, dieselbe Stichprobe\ntabelle = np.array([-1.28, -0.86, -0.54, -0.16, 0.22, 0.61, 1.02, 1.49])\nmu, sigma = 0.5, 1.0\n\nstichproben = mu + sigma * tabelle\nprint(stichproben)                 # [-0.78 -0.36 -0.04  0.34  0.72  1.11  1.52  1.99]\nprint(stichproben.mean())          # 0.5625\nprint(stichproben.std())           # 0.8905721475545931\n\n# zur Kontrolle: Mittel verschiebt, Streuung dehnt\nprint((mu + 2.0 * tabelle).std())  # 1.7811442951091863",
          spoken:
            "Derselbe Rechenweg in Python. Statt eines Zufallsgenerators steht eine feste Zahlenfolge im Programm: dieselbe Eingabe ergibt immer dieselben Stichproben. Aus Mittel und Streuung entstehen acht Werte von minus null Komma sieben acht bis eins Komma neun neun. Ihr Mittel ist null Komma fünf sechs zwei fünf, ihre Streuung null Komma acht neun null sechs. Verdoppelt man die Streuung auf zwei, wächst die Streuung der Stichproben auf das Doppelte: eins Komma sieben acht eins eins.",
        },
      ],
    },
    {
      id: "lek-23/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Der Tabellenwert ist 1,49. Wie groß ist die Stichprobe bei Mittel 0,5 und Streuung 1,0?",
        options: ["1,99", "0,99", "2,49"],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Der Tabellenwert ist eins Komma vier neun. Wie groß ist die Stichprobe bei Mittel null Komma fünf und Streuung eins?",
          options: ["eins Komma neun neun", "null Komma neun neun", "zwei Komma vier neun"],
          answerIndex: 0,
          spoken:
            "Der Tabellenwert ist eins Komma vier neun. Wie groß ist die Stichprobe bei Mittel null Komma fünf und Streuung eins? Eins Komma neun neun, null Komma neun neun oder zwei Komma vier neun?",
          explanation:
            "Die Stichprobe ist Mittel plus Streuung mal Tabellenwert, also null Komma fünf plus eins mal eins Komma vier neun gleich eins Komma neun neun. Bei Mittel null entstünde eins Komma vier neun, bei Streuung zwei entstünde drei Komma vier acht.",
        },
      ],
    },
    {
      id: "lek-23/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Das VAE legt jedes Bild nicht auf einen Punkt, sondern auf eine Verteilung aus Mittel und Streuung. Eine Stichprobe daraus wird dekodiert. Mittel und Streuung der Stichprobe nähern sich den Vorgaben an, je mehr Werte man zieht. Weil die Nachbarschaft eines Punktes ebenfalls etwas Sinnvolles bedeuten muss, kann das Netz anschließend neue Bilder erzeugen.",
        },
      ],
    },
  ],
};
