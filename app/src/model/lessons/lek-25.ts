import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek25: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-25",
  number: 25,
  chapterId: "kap-07",
  title: "Attention",
  learningGoals: [
    "Token zueinander in Beziehung setzen: Ähnlichkeit über das Skalarprodukt",
    "Die Zeilen einer Attention-Matrix als Verteilung lesen und ihre Summe prüfen",
    "Erklären, warum Attention gerichtet ist: die Zeile fragt, die Spalte antwortet",
  ],
  requiresPreviousKnowledge: [
    "Skalarprodukt und Länge eines Vektors",
    "Softmax als weiche Maximalfunktion",
  ],
  prerequisites: ["lek-24"],
  estimatedMinutes: 18,
  sections: [
    {
      id: "lek-25/s01",
      kind: "heading",
      title: "Wer schaut auf wen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Attention" }],
    },
    {
      id: "lek-25/s02",
      kind: "paragraph",
      title: "Tokens, die einander ansehen",
      visual: {
        type: "text",
        text: "In einem Satz hängt die Bedeutung eines Wortes davon ab, welche anderen Wörter dazugehören. Attention gibt jedem Token die Möglichkeit, sich bei allen anderen Token umzusehen. Jedes Token vergleicht dazu seine Einbettung mit denen der anderen. Je ähnlicher zwei Einbettungen sind, desto größer das Gewicht, das sie einander zusprechen. Aus diesen Gewichten entsteht eine Matrix: Zeile ist das fragende Token, Spalte das Token, auf das sich die Frage richtet.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "In einem Satz hängt die Bedeutung eines Wortes davon ab, welche anderen Wörter dazugehören. Attention gibt jedem Token die Möglichkeit, sich bei allen anderen Token umzusehen. Jedes Token vergleicht dazu seine Einbettung mit denen der anderen. Je ähnlicher zwei Einbettungen sind, desto größer das Gewicht, das sie einander zusprechen. Aus diesen Gewichten entsteht eine Matrix: die Zeile ist das fragende Token, die Spalte das Token, auf das sich die Frage richtet.",
        },
      ],
    },
    {
      id: "lek-25/s03",
      kind: "equation",
      title: "Gewichte aus Ähnlichkeit",
      visual: {
        type: "equation",
        latex: "p_{ij} = \\frac{\\exp(e_i \\cdot e_j)}{\\sum_k \\exp(e_i \\cdot e_k)}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "p_{ij} = \\frac{\\exp(e_i \\cdot e_j)}{\\sum_k \\exp(e_i \\cdot e_k)}",
          spoken:
            "Das Gewicht von Token i auf Token j ist die e-Funktion des Skalarprodukts der beiden Einbettungen, geteilt durch die Summe dieser e-Funktion über alle Token. Die e-Funktion verstärkt große Werte und drückt kleine herunter. Nach dem Teilen ist jede Zeile eine Verteilung: alle Gewichte sind positiv und summieren sich zu eins.",
        },
      ],
    },
    {
      id: "lek-25/s04",
      kind: "experiment",
      title: "Die Matrix untersuchen",
      visual: { type: "experiment", experimentId: "exp-attention" },
      experimentId: "exp-attention",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-attention",
          spokenDescription:
            "Fünf Tokens bilden eine Matrix aus fünf mal fünf Gewichten. Jede Zelle trägt ihre Zahl; je dunkler die Zelle, desto größer das Gewicht. Mit dem Regler wählst du, welche Zeile gefragt ist: ein roter Punkt markiert sie. Daneben stehen das größte und das kleinste Gewicht dieser Zeile, das Gewicht auf das Token selbst und die Zeilensumme.",
        },
      ],
    },
    {
      id: "lek-25/s05",
      kind: "example",
      title: "Nachgerechnet: die Zeile von bellt",
      visual: {
        type: "list",
        items: [
          "Tokens: Hund, Katze, bellt, miaut, der",
          "Einbettungen: Hund (1,80 | 0,00), Katze (0,00 | 1,80), bellt (1,10 | 0,15)",
          "Skalarprodukte der Abfrage bellt: 1,98 (Hund), 0,27 (Katze), 1,2325 (bellt), 0,33 (miaut), 0,075 (der)",
          "Nach e-Funktion und Teilen durch die Summe: 0,501 / 0,091 / 0,237 / 0,096 / 0,075",
          "Die Zeile summiert sich zu 1",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Die Abfrage ist das Wort bellt. Sein Skalarprodukt mit Hund ist eins Komma neun acht, mit Katze null Komma zwei sieben, mit bellt selbst eins Komma zwei drei zwei fünf, mit miaut null Komma drei drei und mit der null Komma null sieben fünf. Nach der e-Funktion und dem Teilen durch die Summe bleiben die Gewichte null Komma fünf null eins, null Komma null neun eins, null Komma zwei drei sieben, null Komma null neun sechs und null Komma null sieben fünf. Sie summieren sich zu eins. Die Abfrage bellt bezieht sich also am stärksten auf Hund.",
        },
      ],
    },
    {
      id: "lek-25/s06",
      kind: "code",
      title: "In Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\neinbettungen = np.array([\n    [1.8, 0.0],    # Hund\n    [0.0, 1.8],    # Katze\n    [1.1, 0.15],   # bellt\n    [0.15, 1.1],   # miaut\n    [0.06, 0.06],  # der\n])\n\nabfrage = einbettungen[2]                       # bellt\npunktzahlen = einbettungen @ abfrage            # Skalarprodukte\new = np.exp(punktzahlen)\ngewichte = ew / ew.sum()\n\nprint(punktzahlen)  # [1.98   0.27   1.2325 0.33   0.075 ]\nprint(gewichte)     # [0.5012 0.0906 0.2373 0.0963 0.0746]\nprint(gewichte.sum())  # 1.0",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import numpy as np\n\neinbettungen = np.array([\n    [1.8, 0.0],    # Hund\n    [0.0, 1.8],    # Katze\n    [1.1, 0.15],   # bellt\n    [0.15, 1.1],   # miaut\n    [0.06, 0.06],  # der\n])\n\nabfrage = einbettungen[2]                       # bellt\npunktzahlen = einbettungen @ abfrage            # Skalarprodukte\new = np.exp(punktzahlen)\ngewichte = ew / ew.sum()\n\nprint(punktzahlen)  # [1.98   0.27   1.2325 0.33   0.075 ]\nprint(gewichte)     # [0.5012 0.0906 0.2373 0.0963 0.0746]\nprint(gewichte.sum())  # 1.0",
          spoken:
            "Derselbe Rechenweg in Python. Die fünf Einbettungen stehen als Zahlenfeld da. Als Abfrage wird die dritte Zeile gewählt, das Wort bellt. Ein einziges Mal Zahlenfeld mal Abfrage ergibt die fünf Skalarprodukte. Danach werden sie durch die e-Funktion geschickt und durch ihre eigene Summe geteilt. Die Gewichte liegen bei null Komma fünf, null Komma null neun, null Komma zwei vier, null Komma eins und null Komma null sieben; zusammen ergeben sie eins.",
        },
      ],
    },
    {
      id: "lek-25/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Die Zeile von Hund hat 0,71 auf Hund und 0,20 auf bellt. Was heißt das?",
        options: [
          "Hund bezieht sich am stärksten auf sich selbst und deutlich auf bellt",
          "Hund und bellt sind dasselbe Token",
          "Die Zeile ist falsch, weil sie sich zu mehr als eins addiert",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Die Zeile von Hund hat null Komma sieben eins auf Hund und null Komma zwei auf bellt. Was heißt das?",
          options: [
            "Hund bezieht sich am stärksten auf sich selbst und deutlich auf bellt",
            "Hund und bellt sind dasselbe Token",
            "Die Zeile ist falsch, weil sie sich zu mehr als eins addiert",
          ],
          answerIndex: 0,
          spoken:
            "Die Zeile von Hund hat null Komma sieben eins auf Hund und null Komma zwei auf bellt. Was heißt das? Hund bezieht sich am stärksten auf sich selbst und deutlich auf bellt, Hund und bellt sind dasselbe Token, oder die Zeile ist falsch, weil sie sich zu mehr als eins addiert?",
          explanation:
            "Ein Token hat zu seiner eigenen Einbettung das größte Skalarprodukt, deshalb ist das Gewicht auf sich selbst oft am größten. Das zweitgrößte Gewicht zeigt, mit wem es sonst zu tun hat: Hier ist das bellt. Alle Gewichte der Zeile sind zusammen eins, denn sie sind eine Verteilung.",
        },
      ],
    },
    {
      id: "lek-25/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Attention vergleicht jedes Token mit allen anderen und verwandelt die Ähnlichkeiten in Gewichte, die sich zu eins summieren. Die Gewichtsmatrix ist gerichtet: die Zeile fragt, die Spalte antwortet, deshalb ist sie nicht symmetrisch. In der nächsten Lektion wird daraus die Rechnung mit Abfrage, Schlüssel und Wert.",
        },
      ],
    },
  ],
};
