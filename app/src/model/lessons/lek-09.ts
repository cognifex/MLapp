import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek09: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-09",
  number: 9,
  chapterId: "kap-03",
  title: "Loss",
  learningGoals: [
    "Residuen als Messwert minus Vorhersage berechnen",
    "Den mittleren quadratischen Fehler aus den Residuen aufbauen",
    "Den kleinsten Wert des Verlustmaßes als Ziel der Anpassung deuten",
  ],
  requiresPreviousKnowledge: ["Gerade y = w x + b (Lektion 8)", "Mittelwert mehrerer Zahlen"],
  prerequisites: ["lek-08"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-09/s01",
      kind: "heading",
      title: "Aus vielen Abständen eine Zahl",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Loss" }],
    },
    {
      id: "lek-09/s02",
      kind: "paragraph",
      title: "Ein Verlust macht Güte messbar",
      visual: {
        type: "text",
        text: "Ein Loss, deutsch Verlust, fasst die Abstände zwischen Vorhersage und Messwert zu einer einzigen Zahl zusammen. Je kleiner diese Zahl, desto besser passt das Modell. Beim mittleren quadratischen Fehler wird jeder Abstand zuerst quadriert und dann gemittelt. Das Quadrat macht alle Beiträge positiv und lässt große Fehler stärker ins Gewicht fallen als kleine. Ohne ein solches Maß gäbe es kein Ziel, auf das ein Lernverfahren zusteuern könnte.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Loss, deutsch Verlust, fasst die Abstände zwischen Vorhersage und Messwert zu einer einzigen Zahl zusammen. Je kleiner diese Zahl, desto besser passt das Modell. Beim mittleren quadratischen Fehler wird jeder Abstand zuerst quadriert und dann gemittelt. Das Quadrat macht alle Beiträge positiv und lässt große Fehler stärker ins Gewicht fallen als kleine. Ohne ein solches Maß gäbe es kein Ziel, auf das ein Lernverfahren zusteuern könnte.",
        },
      ],
    },
    {
      id: "lek-09/s03",
      kind: "equation",
      title: "Residuum und mittlerer quadratischer Fehler",
      visual: {
        type: "equation",
        latex: "r_{i} = y_{i} - ŷ_{i}, \\quad MSE = \\frac{1}{n}\\sum_{i} (y_{i} - ŷ_{i})^{2}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "r_{i} = y_{i} - ŷ_{i}, \\quad MSE = \\frac{1}{n}\\sum_{i} (y_{i} - ŷ_{i})^{2}",
          spoken:
            "Das Residuum eines Punktes ist der Messwert y minus der Vorhersage y Dach. Der mittlere quadratische Fehler ist eins durch n mal der Summe über alle Punkte aus dem Residuum zum Quadrat. n ist die Zahl der Punkte.",
        },
      ],
    },
    {
      id: "lek-09/s04",
      kind: "experiment",
      title: "Residuen und mittleren quadratischen Fehler beobachten",
      visual: { type: "experiment", experimentId: "exp-loss" },
      experimentId: "exp-loss",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-loss",
          spokenDescription:
            "Fünf feste Messpunkte und eine Gerade. Die Regler w und b neigen und heben die Gerade. Von jedem Punkt geht eine senkrechte gestrichelte Linie zur Geraden; ihre Länge ist das Residuum. Der mittlere quadratische Fehler steht als Zahl daneben und wird kleiner, wenn die Gerade besser liegt. Als Vergleich stehen die günstigste Steigung, der günstigste Achsenabschnitt und der kleinste erreichbare Wert daneben.",
        },
      ],
    },
    {
      id: "lek-09/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Punkte: (0|1), (1|2), (2|1,5), (3|3,5), (4|4)",
          "Gerade y = 1 · x + 0: Residuen 1 / 1 / -0,5 / 0,5 / 0, Summe der Quadrate 2,5",
          "Mittlerer quadratischer Fehler: 2,5 / 5 = 0,5",
          "Gerade y = 0,8 · x + 0,5: Summe der Quadrate 1,55, MSE 0,31",
          "Günstigste Gerade: w = 0,75, b = 0,9, MSE 0,215",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel mit fünf Messpunkten. Die Gerade y gleich eins mal x plus null hat die Residuen eins, eins, minus null Komma fünf, null Komma fünf und null. Die Summe der Quadrate ist zwei Komma fünf, geteilt durch fünf Punkte ergibt das einen mittleren quadratischen Fehler von null Komma fünf. Die Gerade mit w gleich null Komma acht und b gleich null Komma fünf kommt auf null Komma drei eins. Am besten liegt w gleich null Komma sieben fünf und b gleich null Komma neun; dort ist der mittlere quadratische Fehler nur noch null Komma zwei eins fünf.",
        },
      ],
    },
    {
      id: "lek-09/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "daten = [(0, 1), (1, 2), (2, 1.5), (3, 3.5), (4, 4)]\n\ndef mse(w, b):\n    return sum((y - (w * x + b)) ** 2 for x, y in daten) / len(daten)\n\nprint(mse(1, 0), mse(0.8, 0.5), mse(0.75, 0.9))   # 0.5 0.31 0.215",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "daten = [(0, 1), (1, 2), (2, 1.5), (3, 3.5), (4, 4)]\n\ndef mse(w, b):\n    return sum((y - (w * x + b)) ** 2 for x, y in daten) / len(daten)\n\nprint(mse(1, 0), mse(0.8, 0.5), mse(0.75, 0.9))",
          spoken:
            "Dieselbe Rechnung in Python. Die Funktion summiert für jeden Punkt das quadrierte Residuum und teilt durch die Zahl der Punkte. Das Programm gibt null Komma fünf aus, dann null Komma drei eins und zuletzt null Komma zwei eins fünf.",
        },
      ],
    },
    {
      id: "lek-09/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Eine Gerade liegt über allen Messpunkten. Was gilt dann für die Residuen der Punkte?",
        options: ["Sie sind alle positiv", "Sie sind alle negativ", "Ihre Summe ist immer null"],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Eine Gerade liegt über allen Messpunkten. Was gilt dann für die Residuen der Punkte?",
          options: ["Sie sind alle positiv", "Sie sind alle negativ", "Ihre Summe ist immer null"],
          answerIndex: 1,
          spoken:
            "Eine Gerade liegt über allen Messpunkten. Was gilt dann für die Residuen der Punkte? Sie sind alle positiv, sie sind alle negativ, oder ihre Summe ist immer null?",
          explanation:
            "Das Residuum ist Messwert minus Vorhersage. Liegt die Gerade über den Punkten, ist die Vorhersage größer als der Messwert, das Residuum also negativ. Die Summe der Residuen ist nur dann null, wenn sich Fehler nach oben und nach unten ausgleichen.",
        },
      ],
    },
    {
      id: "lek-09/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Loss verwandelt die Abstände zwischen Vorhersage und Messwert in eine einzige Zahl. Beim mittleren quadratischen Fehler wird jedes Residuum quadriert und gemittelt; große Fehler wiegen dadurch schwerer als kleine. Die günstigste Gerade ist die mit dem kleinsten Verlust - genau solch eine Zahl braucht ein Lernverfahren als Ziel.",
        },
      ],
    },
  ],
};
