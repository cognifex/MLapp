import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek08: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-08",
  number: 8,
  chapterId: "kap-03",
  title: "Lineare Regression",
  learningGoals: [
    "Eine Gerade y = w x + b aus Steigung und Achsenabschnitt aufstellen",
    "Den Abstand zwischen Punkt und Geraden als Messwert minus Vorhersage berechnen",
    "Beurteilen, wie gut eine Gerade in einer Punktwolke liegt",
  ],
  requiresPreviousKnowledge: ["Wahrscheinlichkeitsverteilung (Lektion 6)", "Gradient (Lektion 5)"],
  prerequisites: ["lek-06", "lek-05"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-08/s01",
      kind: "heading",
      title: "Von Punkten zu einer Geraden",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Lineare Regression" }],
    },
    {
      id: "lek-08/s02",
      kind: "paragraph",
      title: "Zwei Regler für eine ganze Punktwolke",
      visual: {
        type: "text",
        text: "Bei einer Regression liegen Messpunkte vor, und gesucht ist eine Gerade, die sie beschreibt. Eine Gerade hat zwei Regler: die Steigung w und den Achsenabschnitt b. w sagt, wie stark die Gerade steigt, b sagt, wo sie die y-Achse schneidet. Zu jedem Punkt gehört ein Paar aus gemessenem y und vorhergesagtem Wert auf der Geraden; die Differenz heißt Abstand. Eine gute Gerade hält die Beträge dieser Abstände klein.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Bei einer Regression liegen Messpunkte vor, und gesucht ist eine Gerade, die sie beschreibt. Eine Gerade hat zwei Regler: die Steigung w und den Achsenabschnitt b. w sagt, wie stark die Gerade steigt, b sagt, wo sie die y-Achse schneidet. Zu jedem Punkt gehört ein Paar aus gemessenem y und vorhergesagtem Wert auf der Geraden; die Differenz ist der Abstand. Eine gute Gerade hält die Beträge dieser Abstände klein.",
        },
      ],
    },
    {
      id: "lek-08/s03",
      kind: "equation",
      title: "Die Gerade und ihre Steigung",
      visual: {
        type: "equation",
        latex: "y = w\\,x + b, \\quad w = \\frac{y_2 - y_1}{x_2 - x_1}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "y = w\\,x + b, \\quad w = \\frac{y_2 - y_1}{x_2 - x_1}",
          spoken:
            "y ist gleich w mal x plus b. b ist der Wert an der Stelle x gleich null, also der Achsenabschnitt. Die Steigung w ist der Höhenunterschied zweier Punkte geteilt durch ihren Abstand in x-Richtung.",
        },
      ],
    },
    {
      id: "lek-08/s04",
      kind: "experiment",
      title: "Punkte verschieben und die Gerade einstellen",
      visual: { type: "experiment", experimentId: "exp-lineare-regression" },
      experimentId: "exp-lineare-regression",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-lineare-regression",
          spokenDescription:
            "Eine Punktwolke aus fünf Punkten und eine Gerade. Mit der Auswahl wird ein Punkt gewählt, mit dem Finger lässt er sich verschieben. Die Regler w und b neigen und heben die Gerade. Der mittlere Abstand der Punkte zur Geraden steht als Zahl daneben; ein Punkt über der Geraden zählt positiv, ein Punkt darunter negativ.",
        },
      ],
    },
    {
      id: "lek-08/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Punkte: (-2|-2), (-1|-1), (0|0), (1|1), (2|2)",
          "Gerade y = 1 · x + 0: Abstände 0 / 0 / 0 / 0 / 0, mittlerer Abstand 0",
          "Gerade y = 2 · x + 1: Abstände 1 / 0 / -1 / -2 / -3, mittlerer Abstand 1,4",
          "Gerade y = 0 · x + 1: Abstände -3 / -2 / -1 / 0 / 1, mittlerer Abstand 1,4",
          "Zwei verschiedene Geraden können denselben mittleren Abstand haben",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel mit fünf Punkten, die auf der Geraden y gleich x liegen. Die Gerade mit w gleich eins und b gleich null trifft alle fünf, der mittlere Abstand ist null. Die steilere Gerade mit w gleich zwei und b gleich eins hat die Abstände eins, null, minus eins, minus zwei und minus drei; der mittlere Betrag ist eins Komma vier. Die waagerechte Gerade mit w gleich null und b gleich eins hat dieselbe Zahl, nämlich ebenfalls eins Komma vier - der mittlere Abstand allein verrät also noch nicht, welche Gerade gemeint ist.",
        },
      ],
    },
    {
      id: "lek-08/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "punkte = [(-2, -2), (-1, -1), (0, 0), (1, 1), (2, 2)]\nw, b = 2, 1\nabstaende = [y - (w * x + b) for x, y in punkte]\nprint(abstaende)                                        # [1, 0, -1, -2, -3]\nprint(sum(abs(a) for a in abstaende) / len(abstaende))  # 1.4",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "punkte = [(-2, -2), (-1, -1), (0, 0), (1, 1), (2, 2)]\nw, b = 2, 1\nabstaende = [y - (w * x + b) for x, y in punkte]\nprint(abstaende)\nprint(sum(abs(a) for a in abstaende) / len(abstaende))",
          spoken:
            "Dieselbe Rechnung in Python. Für jeden Punkt wird der Messwert minus der Vorhersage gerechnet; das ergibt eins, null, minus eins, minus zwei und minus drei. Der mittlere Betrag dieser Abstände ist eins Komma vier.",
        },
      ],
    },
    {
      id: "lek-08/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was sagt b in der Geradengleichung y = w x + b?",
        options: [
          "Den Wert der Geraden an der Stelle x = 0",
          "Wie stark die Gerade steigt",
          "Wie weit die Punkte streuen",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was sagt b in der Geradengleichung y gleich w mal x plus b?",
          options: [
            "Den Wert der Geraden an der Stelle x gleich null",
            "Wie stark die Gerade steigt",
            "Wie weit die Punkte streuen",
          ],
          answerIndex: 0,
          spoken:
            "Was sagt b in der Geradengleichung y gleich w mal x plus b? Den Wert der Geraden an der Stelle x gleich null, wie stark die Gerade steigt, oder wie weit die Punkte streuen?",
          explanation:
            "An der Stelle x gleich null fällt der Term w mal x weg, und es bleibt y gleich b. b ist also der Schnittpunkt mit der y-Achse. Wie stark die Gerade steigt, sagt dagegen die Steigung w.",
        },
      ],
    },
    {
      id: "lek-08/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Eine Gerade wird von zwei Zahlen festgelegt: der Steigung w und dem Achsenabschnitt b. Zu jedem Punkt gehört der Abstand zwischen Messwert und Vorhersage. Wie gut eine Gerade liegt, erkennt man daran, wie klein diese Abstände sind - im nächsten Schritt fassen wir sie zu einer einzigen Verlustzahl zusammen.",
        },
      ],
    },
  ],
};
