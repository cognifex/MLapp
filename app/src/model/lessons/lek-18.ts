import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek18: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-18",
  number: 18,
  chapterId: "kap-05",
  title: "Backpropagation",
  learningGoals: [
    "Den Rechengraphen eines kleinen Netzes vorwärts verfolgen",
    "Die Kettenregel als Rückwärtsdurchlauf durch die Schichten beschreiben",
    "Erklären, warum die Gradienten nach hinten kleiner werden",
  ],
  requiresPreviousKnowledge: [
    "Ein Neuron mit Gewichten, Vorspannung und Aktivierung",
    "Die Kettenregel als Produkt der Ableitungen entlang eines Weges",
  ],
  prerequisites: ["lek-05", "lek-17"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-18/s01",
      kind: "heading",
      title: "Wie ein Netz aus seinem Fehler lernt",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Backpropagation" }],
    },
    {
      id: "lek-18/s02",
      kind: "paragraph",
      title: "Erst vorwärts rechnen, dann rückwärts rechnen",
      visual: {
        type: "text",
        text: "Vorwärts läuft die Rechnung von den Eingaben bis zur Ausgabe: jede Schicht bildet eine gewichtete Summe und schickt sie durch eine Aktivierung. Rückwärts läuft die Frage nach der Schuld: wie stark hat jedes einzelne Gewicht zum Verlust beigetragen? Die Antwort ist ein Gradient je Gewicht. Dafür wird die Ausgabe mit dem Sollwert verglichen; dieser Fehler wird Schicht für Schicht nach hinten getragen, wobei jede Schicht die Ableitung ihrer Aktivierung mitmultipliziert.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Vorwärts läuft die Rechnung von den Eingaben bis zur Ausgabe. Jede Schicht bildet eine gewichtete Summe und schickt sie durch eine Aktivierung. Rückwärts läuft die Frage nach der Schuld: wie stark hat jedes Gewicht zum Verlust beigetragen? Die Antwort ist ein Gradient je Gewicht.",
        },
      ],
    },
    {
      id: "lek-18/s03",
      kind: "equation",
      title: "Die Kettenregel entlang des Weges",
      visual: {
        type: "equation",
        latex:
          "\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial o} \\cdot \\frac{\\partial o}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w}",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial o} \\cdot \\frac{\\partial o}{\\partial h} \\cdot \\frac{\\partial h}{\\partial w}",
          spoken:
            "Partiell L nach partiell w ist gleich partiell L nach partiell o, mal partiell o nach partiell h, mal partiell h nach partiell w. Der Beitrag eines Gewichts ist also das Produkt der Ableitungen auf dem Weg vom Gewicht bis zum Verlust.",
        },
      ],
    },
    {
      id: "lek-18/s04",
      kind: "experiment",
      title: "Gewichte drehen und die Gradienten verfolgen",
      visual: { type: "experiment", experimentId: "exp-backpropagation" },
      experimentId: "exp-backpropagation",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-backpropagation",
          spokenDescription:
            "Ein Netz mit zwei Eingaben, zwei versteckten Neuronen und einer Ausgabe. Regler bestimmen die Gewichte, die Vorspannungen und den Sollwert. Oben stehen die Werte aus dem Vorwärtsdurchlauf, die Säulen zeigen die Gradienten aus dem Rückwärtsdurchlauf - geordnet von der Ausgabeschicht zur versteckten Schicht.",
        },
      ],
    },
    {
      id: "lek-18/s05",
      kind: "example",
      title: "Ein Schritt von Hand nachgerechnet",
      visual: {
        type: "list",
        items: [
          "Eingaben: x1 = 1, x2 = 0,5",
          "z1 = 0,8·1 - 0,5·0,5 - 0,2 = 0,35",
          "h1 = sigmoid(0,35) = 0,5866",
          "z2 = -0,6·1 + 0,9·0,5 + 0,3 = 0,15",
          "h2 = sigmoid(0,15) = 0,5374",
          "o = 1,2·0,5866 - 0,8·0,5374 = 0,2740",
          "Ausgabe y = sigmoid(0,2740) = 0,5681",
          "Verlust = 0,5·(0,5681 - 1)² = 0,0933",
          "∂L/∂v1 = (0,5681 - 1)·0,5681·(1 - 0,5681)·0,5866 = -0,0622",
          "∂L/∂o = (0,5681 - 1)·0,5681·(1 - 0,5681) = -0,1060",
          "∂L/∂w11 = -0,1060 · 1,2 · 0,5866·(1 - 0,5866) · 1 = -0,0308",
          "Ein Schritt mit Lernrate 0,1: v1 = 1,2 - 0,1·(-0,0622) = 1,2062",
          "Neuer Verlust: 0,0923 statt 0,0933",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein durchgerechnetes Beispiel mit den Startgewichten. Die versteckten Summen sind null Komma dreifünf und null Komma eins fünf. Daraus werden die Aktivierungen null Komma fünf acht sechs sechs und null Komma fünf drei sieben vier. Die Ausgabe ist null Komma fünf sechs acht eins, der Verlust null Komma null neun drei drei. Rückwärts ist der Gradient an der Ausgabe minus null Komma null sechs zwei zwei; in der versteckten Schicht bleiben nur minus null Komma null drei null acht übrig. Mit Lernrate null Komma eins steigt das Gewicht v eins auf eins Komma zwei null sechs zwei, und der Verlust sinkt auf null Komma null neun zwei drei. Die Zwischenwerte sind gerundet dargestellt.",
        },
      ],
    },
    {
      id: "lek-18/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\nx = (1.0, 0.5)\nw1, w2, v = (0.8, -0.5), (-0.6, 0.9), (1.2, -0.8)\nb1, b2, soll = -0.2, 0.3, 1.0\nsig = lambda z: 1.0 / (1.0 + math.exp(-z))\n\nh1, h2 = sig(w1[0] * x[0] + w1[1] * x[1] + b1), sig(w2[0] * x[0] + w2[1] * x[1] + b2)\ny = sig(v[0] * h1 + v[1] * h2)\nverlust = 0.5 * (y - soll) ** 2\n\nfehler = (y - soll) * y * (1.0 - y)      # Ableitung nach der Ausgabe\nd_v1 = fehler * h1\nd_h1 = fehler * v[0]\nd_w11 = d_h1 * h1 * (1.0 - h1) * x[0]    # eine Kette mehr fuer die versteckte Schicht\nprint(round(y, 4), round(verlust, 4), round(d_v1, 4), round(d_w11, 4))",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "fehler = (y - soll) * y * (1.0 - y)\nd_v1 = fehler * h1\nd_w11 = fehler * v[0] * h1 * (1.0 - h1) * x[0]",
          spoken:
            "Der Fehler an der Ausgabe ist die Differenz zwischen Ausgabe und Sollwert, mal der Ableitung des Sigmoids. Der Gradient nach dem Ausgabegewicht ist dieser Fehler mal der Aktivierung des versteckten Neurons. Für ein Gewicht in der versteckten Schicht kommt auf dem Weg nach hinten ein Faktor mehr dazu: das Ausgabegewicht und die Ableitung der versteckten Aktivierung.",
        },
      ],
    },
    {
      id: "lek-18/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Warum ist der Gradient eines versteckten Gewichts kleiner als der eines Gewichts an der Ausgabe?",
        options: [
          "Weil auf dem Weg nach hinten jede Schicht einen Faktor kleiner als eins beisteuert.",
          "Weil versteckte Gewichte immer kleiner gewählt werden als Ausgabegewichte.",
          "Weil die Lernrate in der versteckten Schicht nicht wirkt.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Warum ist der Gradient eines versteckten Gewichts kleiner als der eines Gewichts an der Ausgabe?",
          options: [
            "Weil auf dem Weg nach hinten jede Schicht einen Faktor kleiner als eins beisteuert.",
            "Weil versteckte Gewichte immer kleiner gewählt werden als Ausgabegewichte.",
            "Weil die Lernrate in der versteckten Schicht nicht wirkt.",
          ],
          answerIndex: 0,
          spoken:
            "Warum ist der Gradient eines versteckten Gewichts kleiner als der eines Gewichts an der Ausgabe? Erstens: weil auf dem Weg nach hinten jede Schicht einen Faktor kleiner als eins beisteuert. Zweitens: weil versteckte Gewichte immer kleiner gewählt werden. Oder drittens: weil die Lernrate in der versteckten Schicht nicht wirkt.",
          explanation:
            "Die Kettenregel multipliziert die Ableitungen auf dem Weg. Die Ableitung des Sigmoids liegt zwischen null und einem Viertel, das Ausgabegewicht kommt als weiterer Faktor dazu. Mehrere Faktoren kleiner als eins verkleinern das Produkt - deshalb zum Beispiel minus null Komma null sechs zwei zwei an der Ausgabe gegen minus null Komma null drei null acht in der versteckten Schicht.",
        },
      ],
    },
    {
      id: "lek-18/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Backpropagation rechnet den Fehler einmal rückwärts durch das Netz und liefert dabei für jedes Gewicht einen Gradienten. Die Rechnung ist nichts Neues: es ist die Kettenregel, einmal durch die Schichten angewandt. Der Einfluss eines Gewichts wird nach hinten kleiner, weil jeder Schritt einen Faktor kleiner als eins mitbringt. Was mit diesen Gradienten geschieht, zeigt die nächste Lektion.",
        },
      ],
    },
  ],
};
