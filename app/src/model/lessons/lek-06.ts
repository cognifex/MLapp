import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek06: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-06",
  number: 6,
  chapterId: "kap-03",
  title: "Wahrscheinlichkeit",
  learningGoals: [
    "Eine Wahrscheinlichkeitsverteilung als Liste von Anteilen lesen, die sich zu eins summieren",
    "Erwartungswert und Streuung als Lage und Breite einer Verteilung deuten",
    "Eine gezogene Stichprobe von der Verteilung unterscheiden, aus der sie stammt",
  ],
  requiresPreviousKnowledge: [
    "Rechnen mit Anteilen und Brüchen",
    "Funktionsgraphen lesen (Lektion 1)",
  ],
  prerequisites: ["lek-01"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-06/s01",
      kind: "heading",
      title: "Zufall in Zahlen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Wahrscheinlichkeit" }],
    },
    {
      id: "lek-06/s02",
      kind: "paragraph",
      title: "Anteile, die sich zu eins summieren",
      visual: {
        type: "text",
        text: "Eine Wahrscheinlichkeit ist ein Anteil zwischen null und eins. Verteilt man die Anteile auf alle möglichen Ergebnisse, entsteht eine Verteilung; ihre Summe ist immer eins, denn irgendetwas passiert. Zwei Zahlen beschreiben sie: der Erwartungswert nennt den Wert, um den die Ergebnisse liegen, die Streuung sagt, wie weit sie streuen. Eine gezogene Stichprobe folgt dieser Verteilung, trifft sie aber nie genau.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine Wahrscheinlichkeit ist ein Anteil zwischen null und eins. Verteilt man die Anteile auf alle möglichen Ergebnisse, entsteht eine Verteilung. Ihre Summe ist immer eins, denn irgendetwas passiert. Zwei Zahlen beschreiben sie: der Erwartungswert nennt den Wert, um den die Ergebnisse liegen. Die Streuung sagt, wie weit sie streuen. Eine gezogene Stichprobe folgt dieser Verteilung, trifft sie aber nie genau.",
        },
      ],
    },
    {
      id: "lek-06/s03",
      kind: "equation",
      title: "Binomialverteilung mit Erwartungswert und Streuung",
      visual: {
        type: "equation",
        latex:
          "P(0) = (1-p)^{n}, \\quad P(k+1) = P(k)\\,\\frac{n-k}{k+1}\\,\\frac{p}{1-p}, \\quad E(k) = n\\,p, \\quad \\sigma = \\sqrt{n\\,p\\,(1-p)}",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "P(0) = (1-p)^{n}, \\quad P(k+1) = P(k)\\,\\frac{n-k}{k+1}\\,\\frac{p}{1-p}, \\quad E(k) = n\\,p, \\quad \\sigma = \\sqrt{n\\,p\\,(1-p)}",
          spoken:
            "P von null ist eins minus p hoch n. Von dort führt eine Rekursion Schritt für Schritt zu allen weiteren Wahrscheinlichkeiten. p ist die Trefferwahrscheinlichkeit, n die Zahl der Versuche. Der Erwartungswert ist n mal p. Die Streuung ist die Wurzel aus n mal p mal eins minus p.",
        },
      ],
    },
    {
      id: "lek-06/s04",
      kind: "experiment",
      title: "Verteilung einstellen und Stichproben ziehen",
      visual: { type: "experiment", experimentId: "exp-wahrscheinlichkeit" },
      experimentId: "exp-wahrscheinlichkeit",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-wahrscheinlichkeit",
          spokenDescription:
            "Ein Säulendiagramm über den Werten null bis acht. Die Säulen zeigen die Wahrscheinlichkeiten der eingestellten Verteilung. Der Regler Erwartungswert verschiebt die Verteilung, der Regler Streuung macht sie breiter oder schmaler. Mit der Stichprobengröße werden mehr oder weniger Werte gezogen, mit dem Startwert eine andere Stichprobe. Die gestrichelten Umrisse zeigen die Anteile der gezogenen Werte, und der Mittelwert der Stichprobe steht als Zahl daneben.",
        },
      ],
    },
    {
      id: "lek-06/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel: acht Münzwürfe",
      visual: {
        type: "list",
        items: [
          "n = 8 Versuche, p = 0,5 (fairer Münzwurf)",
          "Wahrscheinlichkeit für genau 4 Treffer: 70 · 0,5⁸ = 0,2734",
          "Erwartungswert: n · p = 8 · 0,5 = 4",
          "Streuung: √(8 · 0,5 · 0,5) = 1,414",
          "100 gezogene Stichproben: Mittelwert 4,05, häufigster Wert 4 (29 mal)",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel mit acht Münzwürfen, Trefferwahrscheinlichkeit null Komma fünf. Die Wahrscheinlichkeit für genau vier Treffer ist siebzig mal null Komma fünf hoch acht, also null Komma zwei sieben drei vier. Der Erwartungswert ist acht mal null Komma fünf gleich vier, die Streuung ist die Wurzel aus acht mal null Komma fünf mal null Komma fünf, also rund eins Komma vier eins vier. In hundert gezogenen Stichproben liegt der Mittelwert bei vier Komma null fünf, und der häufigste Wert ist vier - er kommt neunundzwanzig mal vor.",
        },
      ],
    },
    {
      id: "lek-06/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "from math import comb, sqrt\n\nn, p = 8, 0.5\nprint(comb(n, 4) * p**4 * (1 - p)**4)   # 0.2734375\nprint(n * p, sqrt(n * p * (1 - p)))      # 4.0 1.4142135623730951",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "from math import comb, sqrt\n\nn, p = 8, 0.5\nprint(comb(n, 4) * p**4 * (1 - p)**4)\nprint(n * p, sqrt(n * p * (1 - p)))",
          spoken:
            "Dieselbe Rechnung in Python. Die Funktion comb liefert den Binomialkoeffizienten, also die Zahl der Möglichkeiten. Das Programm gibt null Komma zwei sieben drei vier aus, danach den Erwartungswert vier Komma null und die Streuung eins Komma vier eins vier.",
        },
      ],
    },
    {
      id: "lek-06/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Zwei Verteilungen haben den Erwartungswert 4. Die erste hat die Streuung 0,5, die zweite die Streuung 2,0. Bei welcher liegen gezogene Werte weiter auseinander?",
        options: [
          "Bei der zweiten mit der Streuung 2,0",
          "Bei der ersten mit der Streuung 0,5",
          "Bei beiden gleich weit",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Zwei Verteilungen haben den Erwartungswert vier. Die erste hat die Streuung null Komma fünf, die zweite die Streuung zwei. Bei welcher liegen gezogene Werte weiter auseinander?",
          options: [
            "Bei der zweiten mit der Streuung zwei",
            "Bei der ersten mit der Streuung null Komma fünf",
            "Bei beiden gleich weit",
          ],
          answerIndex: 0,
          spoken:
            "Zwei Verteilungen haben den Erwartungswert vier. Die erste hat die Streuung null Komma fünf, die zweite die Streuung zwei. Bei welcher liegen gezogene Werte weiter auseinander? Bei der zweiten, bei der ersten oder bei beiden gleich weit?",
          explanation:
            "Die Streuung ist ein Maß für die Breite: Bei 2,0 liegt der größte Teil der Werte ein gutes Stück vom Erwartungswert entfernt, bei 0,5 drängen sie sich dicht um die vier. Der Erwartungswert sagt nur, wo die Mitte liegt.",
        },
      ],
    },
    {
      id: "lek-06/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Eine Verteilung ordnet jedem möglichen Ergebnis einen Anteil zu; die Anteile summieren sich zu eins. Der Erwartungswert nennt die Mitte, die Streuung die Breite. Eine Stichprobe wird aus der Verteilung gezogen und liegt mit ihrem Mittelwert umso näher am Erwartungswert, je größer sie ist. Im nächsten Schritt messen wir, wie unbestimmt eine Verteilung ist.",
        },
      ],
    },
  ],
};
