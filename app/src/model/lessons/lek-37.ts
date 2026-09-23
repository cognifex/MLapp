import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek37: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-37",
  number: 37,
  chapterId: "kap-10",
  title: "Reinforcement Learning",
  learningGoals: [
    "Eine Zugfolge in einer Grid World als Folge von Zuständen, Aktionen und Belohnungen beschreiben",
    "Die Belohnungssumme einer Folge und die Zahl der Schritte berechnen",
    "Erklären, warum ein Schrittpreis nötig ist, damit der Agent nicht herumsteht",
  ],
  requiresPreviousKnowledge: [
    "Verlust und Lernrate aus dem Gradientenverfahren",
    "Vorzeichen und einfache Summen",
  ],
  prerequisites: ["lek-10"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-37/s01",
      kind: "heading",
      title: "Lernen aus Belohnung",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Reinforcement Learning" }],
    },
    {
      id: "lek-37/s02",
      kind: "paragraph",
      title: "Ein Agent, der handeln muss",
      visual: {
        type: "text",
        text: "Bisher gab es immer ein Modell und einen Verlust, der aus Daten kam. Beim Reinforcement Learning handelt ein Agent selbst: Er steht in einem Zustand, wählt eine Aktion, bekommt eine Belohnung und landet im nächsten Zustand. Die Grid World im Experiment macht das greifbar - drei mal drei Felder, ein Ziel mit Belohnung plus eins, eine Falle mit minus eins und jede Bewegung kostet einen kleinen Schrittpreis. Bewertet wird nicht ein einzelner Schritt, sondern die ganze Folge.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Bisher gab es immer ein Modell und einen Verlust, der aus Daten kam. Beim Reinforcement Learning handelt ein Agent selbst: Er steht in einem Zustand, wählt eine Aktion, bekommt eine Belohnung und landet im nächsten Zustand. Die Grid World im Experiment macht das greifbar: drei mal drei Felder, ein Ziel mit der Belohnung plus eins, eine Falle mit minus eins, und jede Bewegung kostet einen kleinen Schrittpreis. Bewertet wird nicht ein einzelner Schritt, sondern die ganze Folge.",
        },
      ],
    },
    {
      id: "lek-37/s03",
      kind: "equation",
      title: "Die Belohnung einer Folge",
      visual: {
        type: "equation",
        latex: "G = r_1 + r_2 + ... + r_T",
      },
      spoken: [
        {
          kind: "equation",
          latex: "G = r_1 + r_2 + ... + r_T",
          spoken:
            "G ist gleich r eins plus r zwei bis r T. G ist die Belohnung der ganzen Folge, r eins bis r T sind die Belohnungen der einzelnen Schritte und T ist die Zahl der Schritte bis zum Ende. Hier wird nichts abgezinst, gamma ist also eins. Jeder Schritt trägt den Schrittpreis, und nur die Felder mit Ziel oder Falle tragen zusätzlich eine Belohnung.",
        },
      ],
    },
    {
      id: "lek-37/s04",
      kind: "experiment",
      title: "Agent in der Grid World",
      visual: { type: "experiment", experimentId: "exp-rl-gridworld" },
      experimentId: "exp-rl-gridworld",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-rl-gridworld",
          spokenDescription:
            "Ein Raster aus drei mal drei Feldern. Der Agent startet unten links, das Ziel liegt oben rechts und trägt die Belohnung plus eins, die Falle in der Mitte trägt minus eins. Mit vier Auswahlen stellst du die Richtung der vier Züge ein. Die Pfeile im Raster zeigen den gelaufenen Weg, und die Zahlen nennen die Summe der Belohnungen, je Schritt umgerechnet, die Zahl der Schritte und das Feld, auf dem der Agent stehen geblieben ist. Die Folge endet, sobald Ziel oder Falle betreten wird.",
        },
      ],
    },
    {
      id: "lek-37/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Start in Zeile 2, Spalte 0; Ziel in Zeile 0, Spalte 2; Falle in Zeile 1, Spalte 1",
          "Zugfolge rechts, rechts, oben, oben: vier Schritte, jeder mit Schrittpreis -0,04",
          "Schrittpreis: 4 · (-0,04) = -0,16, dazu die Belohnung des Ziels +1",
          "Belohnung der Folge: -0,16 + 1 = 0,84, je Schritt 0,84 : 4 = 0,21",
          "Zugfolge oben, rechts: nach zwei Schritten auf der Falle: 2 · (-0,04) + (-1) = -1,08",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel. Der Agent startet in Zeile zwei, Spalte null; das Ziel liegt in Zeile null, Spalte zwei, die Falle in Zeile eins, Spalte eins. Die Zugfolge rechts, rechts, oben, oben führt in vier Schritten zum Ziel. Vier Schritte kosten vier mal minus null Komma null vier, also minus null Komma eins sechs, dazu kommt die Belohnung des Zieles von plus eins. Die Belohnung der Folge ist damit null Komma acht vier, je Schritt null Komma zwei eins. Die Zugfolge oben, rechts läuft dagegen nach zwei Schritten auf die Falle: zwei mal minus null Komma null vier plus minus eins ergibt minus eins Komma null acht.",
        },
      ],
    },
    {
      id: "lek-37/s06",
      kind: "code",
      title: "Dasselbe in Zahlen",
      visual: {
        type: "code",
        language: "python",
        code: 'felder = {"ziel": 1.0, "falle": -1.0}\nschrittpreis = -0.04\n\ndef folge(zuege, start=(2, 0)):\n    (zeile, spalte), summe = start, 0.0\n    for zug in zuege:\n        zeile, spalte = bewege(zeile, spalte, zug)\n        summe += schrittpreis + belohnung(zeile, spalte)\n    return summe\n\nprint(folge(["rechts", "rechts", "oben", "oben"]))  # 0.84',
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def folge(zuege, start=(2, 0)):\n    (zeile, spalte), summe = start, 0.0\n    for zug in zuege:\n        zeile, spalte = bewege(zeile, spalte, zug)\n        summe += schrittpreis + belohnung(zeile, spalte)\n    return summe",
          spoken:
            "Eine kurze Funktion. Sie startet beim Startfeld und geht die Züge der Reihe nach durch. Nach jedem Zug addiert sie den Schrittpreis und die Belohnung des neuen Feldes zur Summe. Für die Zugfolge rechts, rechts, oben, oben liefert sie null Komma acht vier. Die Folge endet in echten Lernverfahren beim Ziel oder an einer Abschlussbedingung, hier bricht sie beim Betreten der Falle ab.",
        },
      ],
    },
    {
      id: "lek-37/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Der Agent geht in einem einzigen Schritt von einem Nachbarfeld auf die Falle. Wie hoch ist die Belohnung dieses Schrittes?",
        options: ["-1,00", "-0,04", "-1,04"],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Der Agent geht in einem einzigen Schritt auf die Falle. Wie hoch ist die Belohnung dieses Schrittes?",
          options: ["minus eins", "minus null Komma null vier", "minus eins Komma null vier"],
          answerIndex: 2,
          spoken:
            "Der Agent geht in einem einzigen Schritt von einem Nachbarfeld auf die Falle. Wie hoch ist die Belohnung dieses Schrittes? Erstens: minus eins. Zweitens: minus null Komma null vier. Drittens: minus eins Komma null vier.",
          explanation:
            "Die Belohnung eines Schrittes ist der Schrittpreis plus die Belohnung des Feldes: minus null Komma null vier plus minus eins ergibt minus eins Komma null vier. In der Beispielzugfolge oben, rechts sind es zwei Schritte, deshalb dort zwei mal minus null Komma null vier plus minus eins gleich minus eins Komma null acht.",
        },
      ],
    },
    {
      id: "lek-37/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Beim Reinforcement Learning handelt ein Agent in einer Umgebung und sammelt Belohnungen. Bewertet wird die ganze Folge: jeder Schritt kostet den Schrittpreis, Ziel und Falle tragen ihre eigene Belohnung. Die Zugfolge rechts, rechts, oben, oben bringt null Komma acht vier, die Folge durch die Falle minus eins Komma null acht. Wie ein Agent diese Werte je Zustand lernt, zeigt die nächste Lektion mit der Wertefunktion.",
        },
      ],
    },
  ],
};
