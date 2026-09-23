import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek02: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-02",
  number: 2,
  chapterId: "kap-01",
  title: "Vektoren",
  learningGoals: [
    "Vektoren als Pfeile mit Laenge und Richtung beschreiben",
    "Vektoren addieren",
    "Das Skalarprodukt als Mass fuer Gleichrichtung deuten",
  ],
  requiresPreviousKnowledge: ["Funktionen (Lektion 1)", "Satz des Pythagoras"],
  prerequisites: ["lek-01"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-02/s01",
      kind: "heading",
      title: "Pfeile statt einzelner Zahlen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Vektoren" }],
    },
    {
      id: "lek-02/s02",
      kind: "paragraph",
      title: "Mehrere Zahlen, die zusammen gehoeren",
      visual: {
        type: "text",
        text: "Ein Vektor buendelt mehrere Zahlen zu einer Groesse mit Richtung. In der Ebene sind das zwei Zahlen: wie weit nach rechts, wie weit nach oben. Geschrieben als Spalte oder als Paar (x | y).",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Vektor buendelt mehrere Zahlen zu einer Groesse mit Richtung. In der Ebene sind das zwei Zahlen: wie weit nach rechts und wie weit nach oben.",
        },
      ],
    },
    {
      id: "lek-02/s03",
      kind: "equation",
      title: "Skalarprodukt und Laenge",
      visual: {
        type: "equation",
        latex: "a \\cdot b = a_1 b_1 + a_2 b_2, \\quad |a| = \\sqrt{a \\cdot a}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "a \\cdot b = a_1 b_1 + a_2 b_2, \\quad |a| = \\sqrt{a \\cdot a}",
          spoken:
            "Das Skalarprodukt von a und b ist a eins mal b eins, plus a zwei mal b zwei. Die Laenge eines Vektors ist die Wurzel aus seinem Skalarprodukt mit sich selbst.",
        },
      ],
    },
    {
      id: "lek-02/s04",
      kind: "experiment",
      title: "Zwei Pfeile ziehen",
      visual: { type: "experiment", experimentId: "exp-vektoren" },
      experimentId: "exp-vektoren",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-vektoren",
          spokenDescription:
            "Eine Zeichenebene mit zwei Pfeilen vom Ursprung. Beide Spitzen lassen sich ziehen. Daneben stehen Laengen, Skalarprodukt und Winkel. Die Summe der beiden Pfeile laesst sich ein- und ausblenden.",
        },
      ],
    },
    {
      id: "lek-02/s05",
      kind: "example",
      title: "Nachgerechnet",
      visual: {
        type: "list",
        items: [
          "a = (2 | 1), b = (0,5 | 2)",
          "a · b = 2 · 0,5 + 1 · 2 = 3",
          "|a| = √5 ≈ 2,24, |b| = √4,25 ≈ 2,06",
          "cos(Winkel) = 3 / (2,24 · 2,06) ≈ 0,65, Winkel ≈ 49°",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. a zeigt auf zwei und eins, b auf null Komma fuenf und zwei. Das Skalarprodukt ist zwei mal null Komma fuenf plus eins mal zwei, also drei. Beide Pfeile sind etwa zwei Einheiten lang. Der Winkel dazwischen ist ungefaehr neunundvierzig Grad.",
        },
      ],
    },
    {
      id: "lek-02/s06",
      kind: "quiz",
      title: "Verstaendnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was bedeutet ein Skalarprodukt von null?",
        options: [
          "Die Vektoren sind gleich lang",
          "Die Vektoren stehen senkrecht aufeinander",
          "Einer der Vektoren ist der Nullvektor",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was bedeutet ein Skalarprodukt von null?",
          options: [
            "Die Vektoren sind gleich lang",
            "Die Vektoren stehen senkrecht aufeinander",
            "Einer der Vektoren ist der Nullvektor",
          ],
          answerIndex: 1,
          spoken:
            "Was bedeutet ein Skalarprodukt von null? Die Vektoren sind gleich lang, stehen senkrecht aufeinander, oder einer ist der Nullvektor.",
          explanation:
            "Das Skalarprodukt ist null, wenn der Kosinus des Winkels null ist. Das ist bei neunzig Grad der Fall - die Pfeile stehen senkrecht aufeinander.",
        },
      ],
    },
    {
      id: "lek-02/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Vektor traegt mehrere Zahlen mit Richtung. Das Skalarprodukt misst, wie stark zwei Vektoren in dieselbe Richtung zeigen: gross und positiv bei Gleichrichtung, null bei Rechtwinkligkeit, negativ bei Gegenrichtung.",
        },
      ],
    },
  ],
};
