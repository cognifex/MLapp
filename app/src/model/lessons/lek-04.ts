import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek04: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-04",
  number: 4,
  chapterId: "kap-02",
  title: "Ableitung",
  learningGoals: [
    "Die Steigung an einer Stelle eines Graphen bestimmen",
    "Sekantensteigung und Tangentensteigung unterscheiden",
    "Die Ableitung als Grenzwert des Differenzenquotienten erklaeren",
  ],
  requiresPreviousKnowledge: ["Funktionen (Lektion 1)", "Steigungsdreieck"],
  prerequisites: ["lek-01"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-04/s01",
      kind: "heading",
      title: "Wie steil geht es hier",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Ableitung" }],
    },
    {
      id: "lek-04/s02",
      kind: "paragraph",
      title: "Steigung als Verhaeltnis zweier Aenderungen",
      visual: {
        type: "text",
        text: "Die Steigung zwischen zwei Punkten ist der Hoehenunterschied geteilt durch den Abstand in x-Richtung. Ruecken die beiden Punkte zusammen, wird aus der mittleren Steigung die Steigung an einer einzigen Stelle.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Die Steigung zwischen zwei Punkten ist der Hoehenunterschied geteilt durch den Abstand in x-Richtung. Ruecken die beiden Punkte zusammen, wird aus der mittleren Steigung die Steigung an einer einzigen Stelle.",
        },
      ],
    },
    {
      id: "lek-04/s03",
      kind: "equation",
      title: "Differenzenquotient und Ableitung",
      visual: {
        type: "equation",
        latex: "\\frac{f(x+h)-f(x)}{h} \\;\\longrightarrow\\; f'(x) \\quad (h \\to 0)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "\\frac{f(x+h)-f(x)}{h} \\;\\longrightarrow\\; f'(x)",
          spoken:
            "Der Differenzenquotient ist f von x plus h, minus f von x, geteilt durch h. Laesst man h gegen null gehen, bleibt die Ableitung f Strich von x.",
        },
      ],
    },
    {
      id: "lek-04/s04",
      kind: "experiment",
      title: "Sekante wird zur Tangente",
      visual: { type: "experiment", experimentId: "exp-ableitung" },
      experimentId: "exp-ableitung",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-ableitung",
          spokenDescription:
            "Ein Funktionsgraph mit zwei Punkten P und Q. Die Gerade durch beide ist die Sekante. Mit dem Regler h rueckt Q naeher an P. Die Tangentensteigung steht als Vergleichswert daneben.",
        },
      ],
    },
    {
      id: "lek-04/s05",
      kind: "code",
      title: "Dasselbe in Zahlen",
      visual: {
        type: "code",
        language: "python",
        code: "def differenzenquotient(f, x, h):\n    return (f(x + h) - f(x)) / h\n\nf = lambda x: x * x\nprint(differenzenquotient(f, 1.0, 1.0))    # 3.0\nprint(differenzenquotient(f, 1.0, 0.1))    # 2.1\nprint(differenzenquotient(f, 1.0, 0.001))  # 2.001",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def differenzenquotient(f, x, h):\n    return (f(x + h) - f(x)) / h",
          spoken:
            "Eine kurze Funktion. Sie nimmt eine Funktion f, eine Stelle x und den Abstand h. Sie gibt f von x plus h minus f von x zurueck, geteilt durch h. Mit h gleich eins kommt drei heraus, mit h gleich null Komma eins zwei Komma eins, mit h gleich null Komma null null eins zwei Komma null null eins. Die Werte naehern sich der Zwei - der Ableitung von x Quadrat an der Stelle eins.",
        },
      ],
    },
    {
      id: "lek-04/s06",
      kind: "quiz",
      title: "Verstaendnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was bedeutet f'(x) = 0 an einer Stelle?",
        options: [
          "Die Tangente liegt waagerecht",
          "Der Funktionswert ist null",
          "Die Funktion ist unbrauchbar",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was bedeutet f Strich von x gleich null an einer Stelle?",
          options: [
            "Die Tangente liegt waagerecht",
            "Der Funktionswert ist null",
            "Die Funktion ist unbrauchbar",
          ],
          answerIndex: 0,
          spoken:
            "Was bedeutet f Strich von x gleich null an einer Stelle? Die Tangente liegt waagerecht, der Funktionswert ist null, oder die Funktion ist unbrauchbar?",
          explanation:
            "Die Ableitung beschreibt die Steigung, nicht den Wert. Ist sie null, liegt die Tangente waagerecht - dort liegt ein Hoch-, Tief- oder Sattelpunkt.",
        },
      ],
    },
    {
      id: "lek-04/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Ableitung ist die Steigung an einer Stelle. Sie entsteht, indem man zwei Punkte immer naeher zusammenrueckken laesst. Beim Trainieren von Modellen brauchen wir sie, um zu wissen, in welche Richtung sich ein Parameter bewegen muss.",
        },
      ],
    },
  ],
};
