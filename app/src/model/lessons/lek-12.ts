import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek12: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-12",
  number: 12,
  chapterId: "kap-04",
  title: "Logistische Regression",
  learningGoals: [
    "Die Sigmoidfunktion als Abbildung auf Werte zwischen null und eins lesen",
    "Aus der gewichteten Summe eine Wahrscheinlichkeit berechnen",
    "Die Schwelle als Entscheidung deuten und ihre Lage bestimmen",
  ],
  requiresPreviousKnowledge: ["Entscheidungsgrenze als Gerade (Lektion 11)"],
  prerequisites: ["lek-11"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-12/s01",
      kind: "heading",
      title: "Von der Entscheidung zur Wahrscheinlichkeit",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Logistische Regression" }],
    },
    {
      id: "lek-12/s02",
      kind: "paragraph",
      title: "Eine Gerade, aber mit Grenzen",
      visual: {
        type: "text",
        text: "Eine Entscheidungsgrenze sagt nur, auf welcher Seite ein Punkt liegt. Wie sicher diese Entscheidung ist, verrät sie nicht. Die logistische Regression liefert stattdessen eine Wahrscheinlichkeit zwischen null und eins. Dazu wird die gewichtete Summe w mal x plus b durch eine Funktion geschickt, die jede reelle Zahl in diesen Bereich quetscht - und zwar in einer S-Kurve.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine Entscheidungsgrenze sagt nur, auf welcher Seite ein Punkt liegt. Wie sicher diese Entscheidung ist, verrät sie nicht. Die logistische Regression liefert stattdessen eine Wahrscheinlichkeit zwischen null und eins. Dazu wird die gewichtete Summe w mal x plus b durch eine Funktion geschickt, die jede reelle Zahl in diesen Bereich bringt.",
        },
      ],
    },
    {
      id: "lek-12/s03",
      kind: "equation",
      title: "Die Sigmoidfunktion",
      visual: {
        type: "equation",
        latex: "p = \\frac{1}{1 + \\exp(-z)}, \\quad z = w\\,x + b",
      },
      spoken: [
        {
          kind: "equation",
          latex: "p = \\frac{1}{1 + \\exp(-z)}, \\quad z = w\\,x + b",
          spoken:
            "p ist gleich eins geteilt durch eins plus e hoch minus z. Darin ist z die gewichtete Summe w mal x plus b. Diese Funktion heißt Sigmoid: sie steigt von null bis eins und ist in der Mitte am steilsten.",
        },
      ],
    },
    {
      id: "lek-12/s04",
      kind: "experiment",
      title: "Sigmoid, Wahrscheinlichkeit und Schwelle",
      visual: { type: "experiment", experimentId: "exp-logistische-regression" },
      experimentId: "exp-logistische-regression",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-logistische-regression",
          spokenDescription:
            "Ein Koordinatensystem mit einer S-förmigen Kurve zwischen null und eins. Ein roter Punkt sitzt an der eingestellten Stelle x, die waagerechte gestrichelte Linie ist die Schwelle. Die Regler Gewicht und Achsenabschnitt verschieben und kippen die Kurve, die Regler x und Schwelle bewegen den Punkt und die Entscheidungslinie. Angezeigt werden die gewichtete Summe, die Wahrscheinlichkeit und die Stelle, an der die Schwelle erreicht wird.",
        },
      ],
    },
    {
      id: "lek-12/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Gewicht w = 1,5, Achsenabschnitt b = -0,5, Merkmal x = 1,2",
          "Gewichtete Summe: z = 1,5 · 1,2 - 0,5 = 1,3",
          "Wahrscheinlichkeit: p = 1 / (1 + e hoch -1,3) = 0,7858",
          "Steigung: w · p · (1 - p) = 1,5 · 0,7858 · 0,2142 = 0,2524",
          "Schwelle 0,5 wird bei x = 0,333 erreicht, denn dort ist z = 0",
          "Schwelle 0,9 wird erst bei x = 1,798 erreicht",
          "Mit Gewicht 0 hängt die Wahrscheinlichkeit nicht von x ab: keine Grenze",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Das Gewicht ist eins Komma fünf, der Achsenabschnitt minus null Komma fünf, das Merkmal eins Komma zwei. Dann ist z gleich eins Komma drei, und die Sigmoidfunktion macht daraus die Wahrscheinlichkeit null Komma sieben acht fünf acht. Die Steigung der Kurve an dieser Stelle ist Gewicht mal p mal eins minus p, also null Komma zwei fünf zwei vier. Bei der Schwelle null Komma fünf liegt die Grenze bei x gleich null Komma drei drei drei, denn dort ist z gleich null. Bei der Schwelle null Komma neun wandert sie auf x gleich eins Komma sieben neun acht. Ohne Gewicht schließlich hängt die Wahrscheinlichkeit gar nicht von x ab.",
        },
      ],
    },
    {
      id: "lek-12/s06",
      kind: "code",
      title: "Die Sigmoidfunktion in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\ndef sigmoid(z):\n    return 1 / (1 + math.exp(-z))\n\nw, b = 1.5, -0.5\np = sigmoid(w * 1.2 + b)\ngrenze = (math.log(0.5 / 0.5) - b) / w",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import math\n\ndef sigmoid(z):\n    return 1 / (1 + math.exp(-z))\n\nw, b = 1.5, -0.5\np = sigmoid(w * 1.2 + b)\ngrenze = (math.log(0.5 / 0.5) - b) / w",
          spoken:
            "Die Funktion bildet jede Zahl auf einen Wert zwischen null und eins ab: eins geteilt durch eins plus e hoch minus z. Für die gewichtete Summe eins Komma drei kommt null Komma sieben acht fünf acht heraus. Die letzte Zeile rechnet die Stelle aus, an der die Wahrscheinlichkeit genau die Schwelle erreicht.",
        },
      ],
    },
    {
      id: "lek-12/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert, wenn die Schwelle von 0,5 auf 0,9 erhöht wird?",
        options: [
          "Die Grenze wandert zu größeren x-Werten: das Modell wird vorsichtiger",
          "Die Grenze bleibt, nur die Anzeige ändert sich",
          "Die Sigmoidkurve wird steiler",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert, wenn die Schwelle von 0,5 auf 0,9 erhöht wird?",
          options: [
            "Die Grenze wandert zu größeren x-Werten: das Modell wird vorsichtiger",
            "Die Grenze bleibt, nur die Anzeige ändert sich",
            "Die Sigmoidkurve wird steiler",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert, wenn die Schwelle von null Komma fünf auf null Komma neun erhöht wird? Die Grenze wandert zu größeren x-Werten und das Modell wird vorsichtiger, die Grenze bleibt und nur die Anzeige ändert sich, oder die Sigmoidkurve wird steiler?",
          explanation:
            "Die Schwelle legt fest, ab welcher Wahrscheinlichkeit die positive Klasse gilt. Bei null Komma neun muss das Modell fast sicher sein, deshalb liegt die Grenze weiter außen: in diesem Beispiel wandert sie von x gleich null Komma drei drei drei auf x gleich eins Komma sieben neun acht. Die Kurve selbst bleibt unverändert.",
        },
      ],
    },
    {
      id: "lek-12/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die logistische Regression schickt die gewichtete Summe durch die Sigmoidfunktion und erhält dadurch eine Wahrscheinlichkeit zwischen null und eins. Der Wert null Komma fünf bedeutet genau unsicher, größere Werte sprechen für die positive Klasse. Aus dieser Wahrscheinlichkeit wird eine Entscheidung, sobald eine Schwelle festgelegt ist; die Grenze liegt dort, wo p die Schwelle erreicht. Nun kommt das Gegenstück zu allem Gelernten: das Modell darf nicht auswendig lernen.",
        },
      ],
    },
  ],
};
