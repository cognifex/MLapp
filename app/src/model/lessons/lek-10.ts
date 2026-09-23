import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek10: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-10",
  number: 10,
  chapterId: "kap-03",
  title: "Gradient Descent",
  learningGoals: [
    "Den Abstiegsschritt als Verschiebung entgegen dem Gradienten beschreiben",
    "Die Lernrate als Schrittweite deuten und ihre Grenzen sehen",
    "Die Zahl der Schritte bis zur Ruhe aus der Fläche abschätzen",
  ],
  requiresPreviousKnowledge: ["Gradient als Richtung des steilsten Anstiegs (Lektion 5)"],
  prerequisites: ["lek-05"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-10/s01",
      kind: "heading",
      title: "Von der Richtung zum Verfahren",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Gradient Descent" }],
    },
    {
      id: "lek-10/s02",
      kind: "paragraph",
      title: "Immer einen kleinen Schritt bergab",
      visual: {
        type: "text",
        text: "Der Gradient zeigt bergauf. Wer einen Fehler verkleinern will, geht genau andersherum: einen kleinen Schritt in Richtung des negativen Gradienten, dann dort wieder den Gradienten bestimmen und erneut einen Schritt gehen. Dieses Verfahren heißt Gradient Descent, zu Deutsch Abstieg entlang des Gradienten. Wie groß ein Schritt ist, legt die Lernrate fest.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Der Gradient zeigt bergauf. Wer einen Fehler verkleinern will, geht genau andersherum: einen kleinen Schritt in Richtung des negativen Gradienten, dann dort erneut den Gradienten bestimmen und wieder einen Schritt gehen. Dieses Verfahren heißt Gradientenverfahren. Wie groß ein Schritt ist, legt die Lernrate fest.",
        },
      ],
    },
    {
      id: "lek-10/s03",
      kind: "equation",
      title: "Der Abstiegsschritt",
      visual: { type: "equation", latex: "w \\leftarrow w - \\eta\\,\\nabla L(w, b)" },
      spoken: [
        {
          kind: "equation",
          latex: "w \\leftarrow w - \\eta\\,\\nabla L(w, b)",
          spoken:
            "w wird ersetzt durch w minus Lernrate mal Gradient. Bei zwei Parametern steht für w das Paar aus w und b, für den Gradienten das Paar seiner beiden partiellen Ableitungen. Die Lernrate ist das Vielfache, mit dem der Gradient abgezogen wird.",
        },
      ],
    },
    {
      id: "lek-10/s04",
      kind: "experiment",
      title: "Lernrate und Startpunkt einstellen",
      visual: { type: "experiment", experimentId: "exp-gradient-descent" },
      experimentId: "exp-gradient-descent",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-gradient-descent",
          spokenDescription:
            "Eine eingefärbte Verlustfläche mit einem Tiefpunkt rechts unten. Der Startpunkt lässt sich mit dem Finger verschieben. Von ihm läuft ein Pfad mit Pfeilen bergab, ein Punkt je Schritt. Die Regler Lernrate und Schritte bestimmen Schrittweite und Anzahl der Schritte; angezeigt werden der Verlust nach den Schritten und die Zahl der Schritte bis zur Ruhe.",
        },
      ],
    },
    {
      id: "lek-10/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Verlustfläche: L(w, b) = (w - 0,8)² + 1,6 · (b + 0,6)²",
          "Startpunkt: w = -1,5, b = -1,2, Verlust dort 5,866",
          "Ableitung nach w: 2 · (-1,5 - 0,8) = -4,6",
          "Ableitung nach b: 3,2 · (-1,2 + 0,6) = -1,92",
          "Ein Schritt mit Lernrate 0,2: w wird -1,5 + 0,92 = -0,58, b wird -1,2 + 0,384 = -0,816",
          "Nach sechs Schritten: Verlust 0,0115 (Start: 5,866)",
          "Bis zur Ruhe: 13 Schritte bei Lernrate 0,2, 59 Schritte bei Lernrate 0,05",
          "Mit Lernrate 1,0 läuft der Verlust dagegen auf 7409,8 hoch",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Der Verlust ist w minus null Komma acht zum Quadrat plus eins Komma sechs mal b plus null Komma sechs zum Quadrat. Am Startpunkt minus eins Komma fünf und minus eins Komma zwei beträgt er fünf Komma acht sechs sechs. Die Ableitung nach w ist dort minus vier Komma sechs, die nach b minus eins Komma neun zwei. Mit der Lernrate null Komma zwei wächst w um null Komma neun zwei und b um null Komma drei acht vier. Nach sechs Schritten ist der Verlust auf null Komma null eins eins fünf gesunken, nach dreizehn Schritten steht das Verfahren still. Mit der Lernrate eins dagegen wächst der Verlust schon nach sechs Schritten auf über siebentausendvierhundert.",
        },
      ],
    },
    {
      id: "lek-10/s06",
      kind: "code",
      title: "Derselbe Schritt in Python",
      visual: {
        type: "code",
        language: "python",
        code: "w, b = -1.5, -1.2\nlernrate = 0.2\nfor _ in range(6):\n    ableitung_w = 2 * (w - 0.8)\n    ableitung_b = 3.2 * (b + 0.6)\n    w = w - lernrate * ableitung_w\n    b = b - lernrate * ableitung_b\nverlust = (w - 0.8) ** 2 + 1.6 * (b + 0.6) ** 2",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "w, b = -1.5, -1.2\nlernrate = 0.2\nfor _ in range(6):\n    ableitung_w = 2 * (w - 0.8)\n    ableitung_b = 3.2 * (b + 0.6)\n    w = w - lernrate * ableitung_w\n    b = b - lernrate * ableitung_b\nverlust = (w - 0.8) ** 2 + 1.6 * (b + 0.6) ** 2",
          spoken:
            "Das Stück rechnet sechs Schritte des Abstiegs. In jeder Runde werden beide partiellen Ableitungen neu bestimmt und die Parameter um die Lernrate mal Ableitung verschoben. Am Ende steht der Verlust der neuen Stelle - hier null Komma null eins eins fünf.",
        },
      ],
    },
    {
      id: "lek-10/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert, wenn die Lernrate zu groß gewählt wird?",
        options: [
          "Die Schritte schießen über das Minimum hinaus, der Verlust kann wachsen",
          "Der Abstieg wird langsamer, bleibt aber stabil",
          "Der Gradient wird automatisch verkleinert",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert, wenn die Lernrate zu groß gewählt wird?",
          options: [
            "Die Schritte schießen über das Minimum hinaus, der Verlust kann wachsen",
            "Der Abstieg wird langsamer, bleibt aber stabil",
            "Der Gradient wird automatisch verkleinert",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert, wenn die Lernrate zu groß gewählt wird? Schießen die Schritte über das Minimum hinaus und der Verlust kann wachsen, wird der Abstieg langsamer und bleibt stabil, oder verkleinert sich der Gradient von selbst?",
          explanation:
            "Bei einer zu großen Lernrate wird der Schritt länger als der Abstand zum Tiefpunkt. Der Faktor, mit dem der Abstand in b-Richtung multipliziert wird, wächst dann über eins hinaus, und der Verlust nimmt von Schritt zu Schritt zu. Bei dieser Fläche liegt die Grenze bei der Lernrate null Komma sechs zwei fünf.",
        },
      ],
    },
    {
      id: "lek-10/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Gradient Descent wiederholt denselben Rechenschritt: Gradient bestimmen, ein Stück in die Gegenrichtung gehen, von vorn. Die Lernrate steuert die Schrittweite - zu klein wird es langsam, zu groß schaukelt sich der Verlust auf. Mit der Fläche und der Lernrate lässt sich sogar ausrechnen, wie viele Schritte bis zur Ruhe nötig sind. In der nächsten Lektion geht es darum, aus Zahlen Entscheidungen zu machen.",
        },
      ],
    },
  ],
};
