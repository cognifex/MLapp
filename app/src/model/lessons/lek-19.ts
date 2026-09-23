import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek19: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-19",
  number: 19,
  chapterId: "kap-05",
  title: "Optimizer",
  learningGoals: [
    "Den Unterschied zwischen SGD, Momentum und Adam beschreiben",
    "Die Rolle der Lernrate beim Abstieg auf einer Verlustfläche einschätzen",
    "Erkennen, wann ein Verfahren über das Minimum hinausschießt",
  ],
  requiresPreviousKnowledge: [
    "Gradienten als Richtung des steilsten Anstiegs",
    "Eine Verlustfläche mit einem Minimum",
  ],
  prerequisites: ["lek-18"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-19/s01",
      kind: "heading",
      title: "Wie die Gradienten zu Schritten werden",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Optimizer" }],
    },
    {
      id: "lek-19/s02",
      kind: "paragraph",
      title: "Drei Regeln, denselben Gradienten zu lesen",
      visual: {
        type: "text",
        text: "Backpropagation liefert den Gradienten. Was damit geschieht, entscheidet der Optimizer. SGD geht in jedem Schritt genau entgegen dem Gradienten. Momentum sammelt die bisherigen Schritte zu einer Geschwindigkeit und läuft dadurch in gleichbleibenden Richtungen schneller, kann aber über das Minimum hinausschießen. Adam normiert den Schritt je Koordinate mit einem laufenden Mittelwert und einer laufenden Streuung, braucht dafür aber eigene Konstanten: Beta eins 0,9, Beta zwei 0,999 und ein Epsilon von 10 hoch minus acht.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Backpropagation liefert den Gradienten. Was damit geschieht, entscheidet der Optimizer. SGD geht in jedem Schritt genau entgegen dem Gradienten. Momentum sammelt die bisherigen Schritte zu einer Geschwindigkeit und läuft in gleichbleibenden Richtungen schneller, kann aber über das Minimum hinausschießen. Adam normiert den Schritt je Koordinate mit einem laufenden Mittelwert und einer laufenden Streuung.",
        },
      ],
    },
    {
      id: "lek-19/s03",
      kind: "equation",
      title: "Die Grundform des Schrittes",
      visual: {
        type: "equation",
        latex: "\\theta \\leftarrow \\theta - \\eta \\, \\nabla L(\\theta)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "\\theta \\leftarrow \\theta - \\eta \\, \\nabla L(\\theta)",
          spoken:
            "Theta wird ersetzt durch Theta minus Eta mal dem Gradienten des Verlusts an der Stelle Theta. Theta steht für die Gesamtheit der Gewichte, Eta ist die Lernrate. SGD setzt genau diese Formel um, Momentum und Adam tauschen nur aus, was an der Stelle des Gradienten steht.",
        },
      ],
    },
    {
      id: "lek-19/s04",
      kind: "experiment",
      title: "Denselben Abhang hinabgehen",
      visual: { type: "experiment", experimentId: "exp-optimizer" },
      experimentId: "exp-optimizer",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-optimizer",
          spokenDescription:
            "Eine eingefärbte Verlustfläche mit einem Minimum. Mit der Auswahl wechselst du zwischen SGD, Momentum und Adam, mit zwei Reglern stellst du die Lernrate und die Anzahl der Schritte ein. Die Punkte zeigen den Weg, ein Pfeil den letzten Schritt. Startpunkt, Lernrate und Schrittzahl gelten für alle drei Verfahren gleich.",
        },
      ],
    },
    {
      id: "lek-19/s05",
      kind: "example",
      title: "Dieselben Schritte in Zahlen",
      visual: {
        type: "list",
        items: [
          "Verlustfläche: L(x, y) = (x - 0,8)² + 1,6·(y + 0,6)²",
          "Start (-2|-1,8): Gradient (-5,6|-3,84), Verlust 10,1440",
          "Ein SGD-Schritt mit Lernrate 0,1: (-1,44|-1,416), Verlust 6,0830",
          "SGD nach 12 Schritten: Endpunkt (0,608|-0,612), Verlust 0,0372",
          "Momentum nach 12 Schritten: Verlust 1,6586 - der beste Wert lag schon nach 3 Schritten bei 0,2909",
          "Adam geht im ersten Schritt in jeder Richtung fast genau die Lernrate: (-1,9|-1,7)",
          "Adam mit Lernrate 0,1 nach 12 Schritten: Verlust 2,6635",
          "SGD mit Lernrate 0,8 nach 12 Schritten: Verlust rund 99.420 - das Verfahren läuft davon",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein durchgerechnetes Beispiel auf der Mulde mit dem Minimum bei null Komma acht und minus null Komma sechs. Am Startpunkt ist der Gradient minus fünf Komma sechs und minus drei Komma acht vier, der Verlust zehn Komma eins vier vier. Ein SGD-Schritt mit Lernrate null Komma eins landet bei minus eins Komma vier vier und minus eins Komma vier eins sechs; der Verlust fällt auf sechs Komma null acht drei. Nach zwölf Schritten steht SGD bei null Komma null drei sieben zwei. Momentum ist nach drei Schritten schon bei null Komma zwei neun null neun, pendelt danach aber wieder auf eins Komma sechs fünf acht sechs. Adam geht im ersten Schritt in jeder Richtung fast genau die Lernrate. Mit Lernrate null Komma acht wächst der Verlust bei SGD auf rund neunundneunzigtausend: das Verfahren läuft davon.",
        },
      ],
    },
    {
      id: "lek-19/s06",
      kind: "code",
      title: "Der Abstieg in Python",
      visual: {
        type: "code",
        language: "python",
        code: "L = lambda p: (p[0] - 0.8) ** 2 + 1.6 * (p[1] + 0.6) ** 2\ngrad = lambda p: (2 * (p[0] - 0.8), 3.2 * (p[1] + 0.6))\n\np, v, eta, beta = (-2.0, -1.8), (0.0, 0.0), 0.1, 0.9\nfor schritt in range(12):\n    g = grad(p)\n    v = (beta * v[0] - eta * g[0], beta * v[1] - eta * g[1])   # Geschwindigkeit\n    p = (p[0] + v[0], p[1] + v[1])\n    print(schritt + 1, round(L(p), 4))\n\n# SGD ist dieselbe Schleife ohne v: p = p - eta * g",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "v = (beta * v[0] - eta * g[0], beta * v[1] - eta * g[1])\np = (p[0] + v[0], p[1] + v[1])",
          spoken:
            "Momentum merkt sich eine Geschwindigkeit. Sie setzt sich zusammen aus der alten Geschwindigkeit mal Beta minus der Lernrate mal dem Gradienten. Der Schritt ist dann diese Geschwindigkeit selbst und nicht mehr der Gradient. Bei SGD fehlt die Geschwindigkeit: dort ist der Schritt direkt minus Lernrate mal Gradient.",
        },
      ],
    },
    {
      id: "lek-19/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Worin unterscheiden sich SGD, Momentum und Adam auf derselben Verlustfläche?",
        options: [
          "Sie nutzen denselben Gradienten, rechnen ihn aber verschieden in einen Schritt um.",
          "Sie nutzen unterschiedliche Verlustfunktionen.",
          "Sie finden unterschiedliche Minima der Fläche.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Worin unterscheiden sich SGD, Momentum und Adam auf derselben Verlustfläche?",
          options: [
            "Sie nutzen denselben Gradienten, rechnen ihn aber verschieden in einen Schritt um.",
            "Sie nutzen unterschiedliche Verlustfunktionen.",
            "Sie finden unterschiedliche Minima der Fläche.",
          ],
          answerIndex: 0,
          spoken:
            "Worin unterscheiden sich SGD, Momentum und Adam auf derselben Verlustfläche? Erstens: sie nutzen denselben Gradienten, rechnen ihn aber verschieden in einen Schritt um. Zweitens: sie nutzen unterschiedliche Verlustfunktionen. Drittens: sie finden unterschiedliche Minima der Fläche.",
          explanation:
            "Der Gradient kommt in allen drei Fällen aus derselben Rückwärtsrechnung und die Fläche ist dieselbe. Der Unterschied liegt allein in der Schrittregel: SGD nimmt den Gradienten, Momentum eine aufgesammelte Geschwindigkeit, Adam einen je Koordinate normierten Mittelwert. Deshalb pendelt Momentum bei Lernrate 0,1 nach zwolf Schritten wieder auf 1,6586, während SGD bei 0,0372 steht.",
        },
      ],
    },
    {
      id: "lek-19/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Optimizer entscheidet, wie aus einem Gradienten ein Schritt wird. SGD geht direkt bergab, Momentum sammelt Fahrt und kann übers Ziel hinausschießen, Adam normiert den Schritt je Koordinate. Die Lernrate bleibt in allen Fällen die empfindlichste Einstellung: zu klein dauert es lange, zu groß läuft der Verlust davon. Bisher sind alle Beispiele wenige Zahlen breit - wie Modelle aus Wörtern Vektoren machen, zeigt die nächste Lektion.",
        },
      ],
    },
  ],
};
