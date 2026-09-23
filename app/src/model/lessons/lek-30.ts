import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek30: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-30",
  number: 30,
  chapterId: "kap-08",
  title: "Softmax",
  learningGoals: [
    "Logits mit der Exponentialfunktion in Wahrscheinlichkeiten umrechnen",
    "Die Temperatur als Regler zwischen scharfer und flacher Verteilung einordnen",
    "Die Entropie als Maß für die Unbestimmtheit einer Verteilung lesen",
  ],
  requiresPreviousKnowledge: [
    "Die Exponentialfunktion e hoch x wächst schneller als jede lineare Funktion",
    "Eine Verteilung ist eine Liste von Anteilen, die zusammen eins ergeben",
  ],
  prerequisites: ["lek-29"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-30/s01",
      kind: "heading",
      title: "Aus Rohwerten werden Wahrscheinlichkeiten",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Softmax" }],
    },
    {
      id: "lek-30/s02",
      kind: "paragraph",
      title: "Warum ein Sprachmodell keine Zahlen ausgeben darf",
      visual: {
        type: "text",
        text: "Im Inneren eines Sprachmodells stehen für jeden Kandidaten rohe Zahlen, die Logits. Sie können beliebig groß oder klein sein, auch negativ. Für die Vorhersage des nächsten Tokens braucht das Modell aber Anteile, die zusammen eins ergeben: eine Wahrscheinlichkeitsverteilung. Softmax ist der Übergang von den Logits zu dieser Verteilung. Nur die Unterschiede zwischen den Logits zählen - verschiebt man alle Logits um dieselbe Zahl, ändert sich die Verteilung nicht.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "In einem Sprachmodell stehen für jeden Kandidaten rohe Zahlen, die Logits. Sie dürfen beliebig groß oder klein sein, auch negativ. Für die Vorhersage braucht das Modell aber Anteile, die zusammen eins ergeben. Softmax ist der Übergang von den Logits zu diesen Anteilen. Wichtig: nur die Unterschiede zwischen den Logits zählen. Verschiebt man alle Logits um dieselbe Zahl, bleibt die Verteilung gleich.",
        },
      ],
    },
    {
      id: "lek-30/s03",
      kind: "equation",
      title: "Die Formel",
      visual: {
        type: "equation",
        latex: "p_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "p_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}",
          spoken:
            "p tief i ist gleich e hoch z tief i durch T, geteilt durch die Summe über alle j von e hoch z tief j durch T. Jeder Logit wird also erst durch die Temperatur T geteilt, dann in die Exponentialfunktion gesteckt, und zum Schluss teilt man jeden dieser Werte durch ihre Summe. Dadurch liegen alle p zwischen null und eins und ergeben zusammen eins.",
        },
      ],
    },
    {
      id: "lek-30/s04",
      kind: "experiment",
      title: "Logits und Temperatur verstellen",
      visual: { type: "experiment", experimentId: "exp-softmax" },
      experimentId: "exp-softmax",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-softmax",
          spokenDescription:
            "Drei Regler für die Logits der Klassen A, B und C, ein vierter Regler für die Temperatur. Darunter zeigt ein Säulendiagramm die drei Wahrscheinlichkeiten. Zieht man die Temperatur nach unten, wächst die größte Säule und die anderen schrumpfen. Zieht man sie nach oben, rücken alle drei Säulen auf gleiche Höhe zusammen. Die Summe der Wahrscheinlichkeiten bleibt dabei immer eins.",
        },
      ],
    },
    {
      id: "lek-30/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Logits: z = 2 | 1 | 0 bei Temperatur 1",
          "e² = 7,3891, e¹ = 2,7183, e⁰ = 1,0000 – Summe 11,1073",
          "p = 7,3891 / 11,1073 = 0,6652",
          "p = 2,7183 / 11,1073 = 0,2447",
          "p = 1,0000 / 11,1073 = 0,0900",
          "Summe der Wahrscheinlichkeiten: 1,000000",
          "Entropie dieser Verteilung: 0,8324 nat",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel mit den Logits zwei, eins und null bei Temperatur eins. e hoch zwei ist sieben Komma drei acht neun eins, e hoch eins ist zwei Komma sieben eins acht drei, e hoch null ist eins. Die Summe ist elf Komma eins null sieben drei. Geteilt durch diese Summe ergeben sich null Komma sechs sechs fünf zwei, null Komma zwei vier vier sieben und null Komma null neun. Die Summe ist eins, die Entropie dieser Verteilung beträgt null Komma acht drei zwei vier nat.",
        },
      ],
    },
    {
      id: "lek-30/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\ndef softmax(logits, temperatur=1.0):\n    m = max(z / temperatur for z in logits)\n    gewichte = [math.exp(z / temperatur - m) for z in logits]\n    summe = sum(gewichte)\n    return [g / summe for g in gewichte]\n\nprint(softmax([2, 1, 0]))       # [0.6652, 0.2447, 0.0900]\nprint(softmax([2, 1, 0], 0.5))  # [0.8668, 0.1173, 0.0159]\nprint(softmax([2, 1, 0], 2.0))  # [0.5065, 0.3072, 0.1863]",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import math\n\ndef softmax(logits, temperatur=1.0):\n    m = max(z / temperatur for z in logits)\n    gewichte = [math.exp(z / temperatur - m) for z in logits]\n    summe = sum(gewichte)\n    return [g / summe for g in gewichte]\n\nprint(softmax([2, 1, 0]))       # [0.6652, 0.2447, 0.0900]\nprint(softmax([2, 1, 0], 0.5))  # [0.8668, 0.1173, 0.0159]\nprint(softmax([2, 1, 0], 2.0))  # [0.5065, 0.3072, 0.1863]",
          spoken:
            "Der Code rechnet dasselbe wie das Experiment. Das Abziehen des größten Werts vor der Exponentialfunktion ist nur ein Rechentrick: die Ergebnisse werden dadurch kleiner und laufen nicht über, die Verteilung bleibt dieselbe. Mit der Temperatur null Komma fünf wird die Verteilung spitz: null Komma acht sechs sechs acht, null Komma eins eins sieben drei, null Komma null eins sechs. Mit der Temperatur zwei wird sie flach: null Komma fünf null sechs fünf, null Komma drei null sieben zwei, null Komma eins acht sechs drei.",
        },
      ],
    },
    {
      id: "lek-30/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Zwei Logits sind gleich groß. Was folgt daraus?",
        options: [
          "Ihre Wahrscheinlichkeiten sind gleich groß.",
          "Ihre Wahrscheinlichkeiten sind null.",
          "Die Summe der Wahrscheinlichkeiten ist dann zwei.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Zwei Logits sind gleich groß. Was folgt daraus?",
          options: [
            "Ihre Wahrscheinlichkeiten sind gleich groß.",
            "Ihre Wahrscheinlichkeiten sind null.",
            "Die Summe der Wahrscheinlichkeiten ist dann zwei.",
          ],
          answerIndex: 0,
          spoken:
            "Zwei Logits sind gleich groß. Was folgt daraus? Antwort eins: ihre Wahrscheinlichkeiten sind gleich groß. Antwort zwei: ihre Wahrscheinlichkeiten sind null. Antwort drei: die Summe der Wahrscheinlichkeiten ist dann zwei.",
          explanation:
            "Gleiche Logits ergeben gleiche Exponentialwerte und damit gleiche Wahrscheinlichkeiten. Null wären sie nur, wenn die Exponentialwerte null wären - das passiert nie, e hoch irgendetwas ist immer positiv. Und die Summe aller Wahrscheinlichkeiten bleibt eins, egal wie groß die Logits sind.",
        },
      ],
    },
    {
      id: "lek-30/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Softmax macht aus Logits eine Wahrscheinlichkeitsverteilung: jeden Logit durch die Temperatur teilen, die Exponentialfunktion anwenden und durch die Summe teilen. Die Temperatur steuert die Schärfe, die Entropie misst, wie unbestimmt die Verteilung ist. Im nächsten Schritt sehen wir, wo diese Verteilung im Sprachmodell herkommt: aus einem Kontext, der den nächsten Token nahelegt.",
        },
      ],
    },
  ],
};
