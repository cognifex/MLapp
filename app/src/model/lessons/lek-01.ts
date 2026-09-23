import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek01: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-01",
  number: 1,
  chapterId: "kap-01",
  title: "Funktionen",
  learningGoals: [
    "Eine Funktion als Zuordnung von Eingabe zu Ausgabe beschreiben",
    "Den Funktionswert an einer Stelle ablesen und berechnen",
    "Den Graphen als Bild dieser Zuordnung lesen",
  ],
  requiresPreviousKnowledge: ["Rechnen mit Vorzeichen und Klammern"],
  prerequisites: [],
  estimatedMinutes: 12,
  sections: [
    {
      id: "lek-01/s01",
      kind: "heading",
      title: "Was eine Funktion tut",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Funktionen" }],
    },
    {
      id: "lek-01/s02",
      kind: "paragraph",
      title: "Eine Regel, die eine Zahl in eine andere ueberfuehrt",
      visual: {
        type: "text",
        text: "Eine Funktion nimmt eine Zahl und gibt genau eine Zahl zurueck. Die Eingabe heisst Stelle x, die Ausgabe Funktionswert y = f(x). Zu jeder Stelle gehoert genau ein Wert - das ist der ganze Unterschied zu einer beliebigen Kurve.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine Funktion nimmt eine Zahl und gibt genau eine Zahl zurueck. Die Eingabe heisst Stelle x, die Ausgabe Funktionswert y gleich f von x. Zu jeder Stelle gehoert genau ein Wert.",
        },
      ],
    },
    {
      id: "lek-01/s03",
      kind: "equation",
      title: "Die Schreibweise",
      visual: { type: "equation", latex: "y = f(x) = a\\,x^{2} + b\\,x + c" },
      spoken: [
        {
          kind: "equation",
          latex: "y = f(x) = a\\,x^{2} + b\\,x + c",
          spoken:
            "y ist gleich f von x. Eine Parabel, aufgeschrieben als a mal x hoch zwei, plus b mal x, plus c.",
        },
      ],
    },
    {
      id: "lek-01/s04",
      kind: "experiment",
      title: "Den Punkt auf der Kurve bewegen",
      visual: { type: "experiment", experimentId: "exp-funktionen" },
      experimentId: "exp-funktionen",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-funktionen",
          spokenDescription:
            "Ein Koordinatensystem mit einer Parabel und einem Punkt darauf. Mit dem Regler x wandert der Punkt nach links und rechts. Die Werte x, y und die Steigung an dieser Stelle stehen daneben.",
        },
      ],
    },
    {
      id: "lek-01/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "f(x) = x² - 1",
          "f(0) = 0² - 1 = -1",
          "f(2) = 2² - 1 = 3",
          "f(-2) = (-2)² - 1 = 3",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. f von x ist x hoch zwei minus eins. An der Stelle null ergibt das minus eins. An der Stelle zwei ergibt es drei. Und an der Stelle minus zwei ebenfalls drei, weil das Quadrat das Vorzeichen verschluckt.",
        },
      ],
    },
    {
      id: "lek-01/s06",
      kind: "quiz",
      title: "Verstaendnisaufgabe",
      visual: {
        type: "quiz",
        question: "f(x) = 3 - x. Wie gross ist f(5)?",
        options: ["8", "-2", "2"],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Die Funktion ist f von x gleich drei minus x. Wie gross ist f von fünf?",
          options: ["acht", "minus zwei", "zwei"],
          answerIndex: 1,
          spoken:
            "Die Funktion ist f von x gleich drei minus x. Wie gross ist f von fuenf? Acht, minus zwei oder zwei.",
          explanation:
            "f von fuenf ist drei minus fuenf, also minus zwei. Der Wert liegt unter null, weil die Stelle groesser als drei ist.",
        },
      ],
    },
    {
      id: "lek-01/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Eine Funktion ist eine Regel, die jeder Stelle genau einen Wert gibt. Der Graph zeigt alle diese Paare als Punkt. Im naechsten Schritt betrachten wir nicht mehr einzelne Zahlen, sondern ganze Pfeile.",
        },
      ],
    },
  ],
};
