import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek33: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-33",
  number: 33,
  chapterId: "kap-08",
  title: "Sprachmodelltraining",
  learningGoals: [
    "Die Kreuzentropie eines Ziel-Tokens aus seiner Wahrscheinlichkeit berechnen",
    "Den Gradienten der Kreuzentropie nach den Logits als p minus y deuten",
    "Die Wirkung von Lernrate und Anzahl der Schritte auf den Verlust einschätzen",
  ],
  requiresPreviousKnowledge: [
    "Softmax als Weg von Logits zu Wahrscheinlichkeiten",
    "Der Gradientenschritt: in die Gegenrichtung des Gradienten gehen",
  ],
  prerequisites: ["lek-32"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-33/s01",
      kind: "heading",
      title: "Wie das Modell besser wird",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Sprachmodelltraining" }],
    },
    {
      id: "lek-33/s02",
      kind: "paragraph",
      title: "Ein Schritt besteht aus drei Zeilen",
      visual: {
        type: "text",
        text: "Beim Training steht der richtige nächste Token fest - er kommt aus dem Text selbst. Das Modell rechnet zuerst seine Verteilung aus, dann bewertet man sie: die Kreuzentropie des richtigen Tokens ist der negative Logarithmus seiner Wahrscheinlichkeit. Ist das Modell unsicher, ist die Kreuzentropie groß; sagt es das richtige Token fast sicher voraus, geht sie gegen null. Aus dieser Bewertung entsteht ein Gradient, und ein Schritt verschiebt die Logits ein wenig in die richtige Richtung. Wie weit, bestimmt die Lernrate.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Beim Training steht der richtige nächste Token fest, er kommt aus dem Text selbst. Das Modell rechnet zuerst seine Verteilung aus. Dann bewertet man sie: die Kreuzentropie des richtigen Tokens ist der negative Logarithmus seiner Wahrscheinlichkeit. Ist das Modell unsicher, ist die Kreuzentropie groß. Sagt es das richtige Token fast sicher voraus, geht sie gegen null. Aus dieser Bewertung entsteht ein Gradient, und ein Schritt verschiebt die Logits ein wenig in die richtige Richtung. Wie weit, bestimmt die Lernrate.",
        },
      ],
    },
    {
      id: "lek-33/s03",
      kind: "equation",
      title: "Verlust und ein Schritt",
      visual: {
        type: "equation",
        latex: "L = -ln\\, p_{ziel} \\quad und \\quad z_i \\leftarrow z_i - \\eta\\,(p_i - y_i)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "L = -ln\\, p_{ziel} \\quad und \\quad z_i \\leftarrow z_i - \\eta\\,(p_i - y_i)",
          spoken:
            "L ist gleich minus Logarithmus naturalis der Wahrscheinlichkeit des Ziel-Tokens. Und die Logits werden nachgeführt: z tief i wird zu z tief i minus eta mal Klammer auf p tief i minus y tief i Klammer zu. Eta heißt Lernrate und bestimmt die Schrittweite. y tief i ist eins am Ziel-Token und null sonst. Am Ziel-Logit zieht man also p minus eins ab - der Logit wächst, weil dieser Ausdruck negativ ist.",
        },
      ],
    },
    {
      id: "lek-33/s04",
      kind: "experiment",
      title: "Ein Update durchlaufen",
      visual: { type: "experiment", experimentId: "exp-sprachmodelltraining" },
      experimentId: "exp-sprachmodelltraining",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-sprachmodelltraining",
          spokenDescription:
            "Ein Säulendiagramm mit drei Tokens. Die gefüllte Säule ist die Verteilung nach dem Update, der gestrichelte Umriss darunter die Verteilung davor. Das Ziel-Token ist hervorgehoben. Drei Regler: die Lernrate, die Anzahl der Schritte und ein Auswahlfeld für das Ziel-Token. Daneben stehen die Kreuzentropie vor und nach dem Update und die Verringerung dazwischen. Wird das Ziel gewechselt, wandert die hervorgehobene Säule und ihre Umrissmarke zeigt, wie viel dazugewonnen wurde.",
        },
      ],
    },
    {
      id: "lek-33/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Logits vorher: 1,0000 | 0,5000 | 0,0000 für bellen | laufen | schlafen",
          "Wahrscheinlichkeiten vorher: 0,5065 | 0,3072 | 0,1863",
          "Ziel-Token bellen: Kreuzentropie vorher = -ln 0,5064804 = 0,6803 nat",
          "Gradient p - y: -0,4935 | 0,3072 | 0,1863",
          "Lernrate 0,50: Logits danach 1,2468 | 0,3464 | -0,0932",
          "Wahrscheinlichkeiten nachher: 0,5994 | 0,2436 | 0,1570",
          "Kreuzentropie nachher = -ln 0,5994 = 0,5118 nat",
          "Verringerung: 0,6803 − 0,5118 = 0,1685 nat",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Das Beispiel beginnt mit den Logits eins, null Komma fünf und null. Daraus folgen die Wahrscheinlichkeiten null Komma fünf null sechs fünf, null Komma drei null sieben zwei und null Komma eins acht sechs drei. Ziel-Token ist bellen. Seine Kreuzentropie vorher beträgt null Komma sechs acht null drei nat. Der Gradient p minus y ist minus null Komma vier neun drei fünf, null Komma drei null sieben zwei und null Komma eins acht sechs drei. Mit der Lernrate null Komma fünf werden daraus die Logits eins Komma zwei vier sechs acht, null Komma drei vier sechs vier und minus null Komma null neun drei zwei. Die Wahrscheinlichkeiten nachher sind null Komma fünf neun neun vier, null Komma zwei vier drei sechs und null Komma eins fünf sieben null. Die Kreuzentropie sinkt damit auf null Komma fünf eins eins acht nat, die Verringerung beträgt null Komma eins sechs acht fünf nat.",
        },
      ],
    },
    {
      id: "lek-33/s06",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Die Lernrate wird verdoppelt. Was ändert sich an einem einzelnen Schritt?",
        options: [
          "Der Schritt fällt doppelt so groß aus: die Logits ändern sich stärker.",
          "Der Gradient wird nur halb so groß gerechnet, der Schritt bleibt gleich.",
          "Die Kreuzentropie kann danach nicht mehr fallen.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Die Lernrate wird verdoppelt. Was ändert sich an einem einzelnen Schritt?",
          options: [
            "Der Schritt fällt doppelt so groß aus: die Logits ändern sich stärker.",
            "Der Gradient wird nur halb so groß gerechnet, der Schritt bleibt gleich.",
            "Die Kreuzentropie kann danach nicht mehr fallen.",
          ],
          answerIndex: 0,
          spoken:
            "Die Lernrate wird verdoppelt. Was ändert sich an einem einzelnen Schritt? Antwort eins: der Schritt fällt doppelt so groß aus, die Logits ändern sich stärker. Antwort zwei: der Gradient wird nur halb so groß gerechnet, der Schritt bleibt gleich. Antwort drei: die Kreuzentropie kann danach nicht mehr fallen.",
          explanation:
            "Der Gradient hängt nur von der Vorhersage ab, nicht von der Lernrate. Die Lernrate skaliert den Schritt: doppelte Lernrate, doppelte Verschiebung der Logits. Der Verlust am Ziel-Token sinkt dabei weiter, weil die Wahrscheinlichkeit des Ziel-Tokens zunimmt.",
        },
      ],
    },
    {
      id: "lek-33/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Training heißt: Verteilung ausrechnen, mit der Kreuzentropie des richtigen Tokens bewerten und die Logits einen Schritt in die richtige Richtung schieben. Der Gradient ist dabei einfach p minus y, die Lernrate bestimmt die Schrittweite. Über viele Schritte sammelt sich so aus unsicheren Logits eine sichere Vorhersage. Damit ist der Weg vom Rohwert zur Ausgabe des Sprachmodells vollständig.",
        },
      ],
    },
  ],
};
