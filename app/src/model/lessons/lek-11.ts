import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek11: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-11",
  number: 11,
  chapterId: "kap-04",
  title: "Klassifikation",
  learningGoals: [
    "Zwei Gruppen durch eine Gerade trennen",
    "Die Seite der Geraden als Vorhersage lesen",
    "Die Genauigkeit und den kleinsten Abstand zur Grenze beurteilen",
  ],
  requiresPreviousKnowledge: ["Abstieg entlang des Gradienten (Lektion 10)"],
  prerequisites: ["lek-10"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-11/s01",
      kind: "heading",
      title: "Zwei Gruppen, eine Grenze",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Klassifikation" }],
    },
    {
      id: "lek-11/s02",
      kind: "paragraph",
      title: "Statt einer Zahl eine Seite",
      visual: {
        type: "text",
        text: "Bisher hat das Modell einen Zahlenwert vorhergesagt. Jetzt soll es sagen, zu welcher Gruppe ein Punkt gehört. Dazu legt es eine Gerade durch die Ebene: Punkte über der Geraden bekommen die eine Klasse, Punkte darunter die andere. Das Modell liefert also kein Ergebnis mehr, sondern eine Entscheidung - und dieselbe Gerade lässt sich verschieben und kippen.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Bisher hat das Modell einen Zahlenwert vorhergesagt. Jetzt soll es sagen, zu welcher Gruppe ein Punkt gehört. Dazu legt es eine Gerade durch die Ebene: Punkte über der Geraden bekommen die eine Klasse, Punkte darunter die andere. Das Modell liefert damit eine Entscheidung statt einer Zahl.",
        },
      ],
    },
    {
      id: "lek-11/s03",
      kind: "equation",
      title: "Die Entscheidungsgrenze",
      visual: { type: "equation", latex: "w\\,x + b = 0" },
      spoken: [
        {
          kind: "equation",
          latex: "w\\,x + b = 0",
          spoken:
            "w mal x plus b gleich null. Auf dieser Geraden liegt die Entscheidung genau auf der Kippe. Ist w mal x plus b positiv, liegt der Punkt oberhalb und gehört zur oberen Klasse; ist der Wert negativ, gehört er zur unteren.",
        },
      ],
    },
    {
      id: "lek-11/s04",
      kind: "experiment",
      title: "Die Grenze zwischen zwei Punktwolken verschieben",
      visual: { type: "experiment", experimentId: "exp-klassifikation" },
      experimentId: "exp-klassifikation",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-klassifikation",
          spokenDescription:
            "Eine Punktwolke aus zwei Gruppen: rot oben die Klasse A, blau unten die Klasse B. Eine grüne Gerade lässt sich mit den Reglern Steigung und Achsenabschnitt verschieben und kippen. Angezeigt werden die Zahl der richtig getrennten Punkte, die Genauigkeit und der kleinste Abstand eines Punktes zur Geraden.",
        },
      ],
    },
    {
      id: "lek-11/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Feste Punktwolke: je neun Punkte der Klasse A und der Klasse B an den Stellen x = -2,4 bis 2,4",
          "Gruppe A liegt im Mittel 0,55 über der Geraden y = 0,8 x, Gruppe B 0,55 darunter",
          "Mit Steigung 0,5 und Achsenabschnitt 0 liegen 16 von 18 Punkten richtig",
          "Der kleinste Abstand zur Grenze ist dabei 0,009",
          "Mit Steigung 0,8 und Achsenabschnitt 0 liegen alle 18 Punkte richtig, kleinster Abstand 0,195",
          "Dieselbe Steigung mit Achsenabschnitt 0,2 trennt ebenfalls alle Punkte, aber der kleinste Abstand sinkt auf 0,039",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Die Punktwolke besteht aus neun Punkten der Klasse A und neun Punkten der Klasse B; die Muster sind fest verdrahtet, es wird kein Zufall verwendet. Mit der Steigung null Komma fünf und dem Achsenabschnitt null liegen sechzehn von achtzehn Punkten richtig, der kleinste Abstand zur Geraden ist dabei nur null Komma null null neun. Mit der Steigung null Komma acht liegen alle achtzehn Punkte richtig, der kleinste Abstand ist null Komma eins neun fünf. Wird die Gerade dann um null Komma zwei nach oben geschoben, bleiben alle Punkte getrennt, aber der kleinste Abstand sinkt auf null Komma null drei neun: die Trennung wird knapp.",
        },
      ],
    },
    {
      id: "lek-11/s06",
      kind: "code",
      title: "Derselbe Vergleich in Python",
      visual: {
        type: "code",
        language: "python",
        code: 'w, b = 0.8, 0.0\npunkte = [(-2.4, -1.07, "A"), (0.6, 1.37, "A"), (-1.8, -1.83, "B")]\nrichtig = 0\nfor x, y, klasse in punkte:\n    oberhalb = y > w * x + b\n    if oberhalb == (klasse == "A"):\n        richtig += 1',
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: 'w, b = 0.8, 0.0\npunkte = [(-2.4, -1.07, "A"), (0.6, 1.37, "A"), (-1.8, -1.83, "B")]\nrichtig = 0\nfor x, y, klasse in punkte:\n    oberhalb = y > w * x + b\n    if oberhalb == (klasse == "A"):\n        richtig += 1',
          spoken:
            "Das Stück geht die Punkte der Reihe nach durch. Für jeden Punkt wird geprüft, ob er über der Geraden liegt, und dieses Ergebnis mit seiner Gruppe verglichen. Stimmen beide überein, wächst der Zähler der richtigen Vorhersagen um eins.",
        },
      ],
    },
    {
      id: "lek-11/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was sagt ein großer kleinster Abstand zur Entscheidungsgrenze?",
        options: [
          "Dass die Trennung auch bei kleinen Verschiebungen der Punkte hält",
          "Dass viele Punkte falsch klassifiziert sind",
          "Dass die Gerade besonders steil ist",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was sagt ein großer kleinster Abstand zur Entscheidungsgrenze?",
          options: [
            "Dass die Trennung auch bei kleinen Verschiebungen der Punkte hält",
            "Dass viele Punkte falsch klassifiziert sind",
            "Dass die Gerade besonders steil ist",
          ],
          answerIndex: 0,
          spoken:
            "Was sagt ein großer kleinster Abstand zur Entscheidungsgrenze? Dass die Trennung auch bei kleinen Verschiebungen der Punkte hält, dass viele Punkte falsch klassifiziert sind, oder dass die Gerade besonders steil ist?",
          explanation:
            "Der kleinste Abstand ist der Spielraum der Trennung. Ist er groß, kippt keine Vorhersage, wenn ein Punkt ein Stück wandert. Ist er klein, liegt die Genauigkeit von achtzehn richtigen Punkten dicht am Zufall: schon eine kleine Verschiebung bringt einen Punkt auf die falsche Seite.",
        },
      ],
    },
    {
      id: "lek-11/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Klassifikation beantwortet die Frage, zu welcher Gruppe ein Punkt gehört. Das einfachste Modell ist eine Gerade: ihre Seite entscheidet, ihre Lage lässt sich über Steigung und Achsenabschnitt einstellen. Die Genauigkeit sagt, wie viele Punkte richtig liegen, der kleinste Abstand sagt, wie sicher diese Trennung ist. Die nächste Lektion macht aus der Entscheidung eine Wahrscheinlichkeit.",
        },
      ],
    },
  ],
};
