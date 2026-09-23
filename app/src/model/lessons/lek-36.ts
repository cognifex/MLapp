import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek36: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-36",
  number: 36,
  chapterId: "kap-09",
  title: "Conditioning",
  learningGoals: [
    "Beschreiben, wie eine Bedingung den Denoising-Prozess in eine Richtung lenkt",
    "Den Abstand zu zwei möglichen Zielbildern messen und vergleichen",
    "Erklären, warum nur das Ziel der gewählten Bedingung näher kommt",
  ],
  requiresPreviousKnowledge: [
    "Der Rückwärtsprozess der Diffusion",
    "Abstand zweier Zahlenraster als Mittel der Beträge",
  ],
  prerequisites: ["lek-35"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-36/s01",
      kind: "heading",
      title: "Sagen, was entstehen soll",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Conditioning: eine Bedingung steuert das Denoising" }],
    },
    {
      id: "lek-36/s02",
      kind: "paragraph",
      title: "Die Bedingung als Zugkraft",
      visual: {
        type: "text",
        text: "Ohne Bedingung liefert der Rückwärtsprozess irgendein Bild. Erst eine Bedingung entscheidet, was entstehen soll - zum Beispiel Kreuz oder Ring. In den bekannten Bildmodellen geschieht das über zwei Schätzungen des Rauschens: einmal mit Bedingung, einmal ohne, und die Richtung der Bedingung wird verstärkt. Das Experiment zeigt dieselbe Wirkung in einer vereinfachten Fassung: das unbedingte Ergebnis wird mit dem Zielbild der Bedingung gemischt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ohne Bedingung liefert der Rückwärtsprozess irgendein Bild. Erst eine Bedingung entscheidet, was entstehen soll, zum Beispiel ein Kreuz oder ein Ring. In den bekannten Bildmodellen geschieht das über zwei Schätzungen des Rauschens: einmal mit Bedingung, einmal ohne, und dann wird die Richtung der Bedingung verstärkt. Das Experiment zeigt dieselbe Wirkung in einer vereinfachten Fassung: das unbedingte Ergebnis wird mit dem Zielbild der Bedingung gemischt.",
        },
      ],
    },
    {
      id: "lek-36/s03",
      kind: "equation",
      title: "Bedingtes Ergebnis",
      visual: {
        type: "equation",
        latex: "x = (1 - w)\\, x_{ohne} + w\\, x_{Ziel}",
      },
      spoken: [
        {
          kind: "equation",
          latex: "x = (1 - w)\\, x_{ohne} + w\\, x_{Ziel}",
          spoken:
            "x ist gleich eins minus w mal x ohne, plus w mal x Ziel. x ohne ist das unbedingte Ergebnis des Denoisings, x Ziel das Zielbild der gewählten Bedingung und w die Stärke zwischen null und eins. Bei w gleich null bleibt das unbedingte Bild stehen, bei w gleich eins ist das Ergebnis genau das Zielbild.",
        },
      ],
    },
    {
      id: "lek-36/s04",
      kind: "experiment",
      title: "Bedingung steuert das Denoising",
      visual: { type: "experiment", experimentId: "exp-conditioning" },
      experimentId: "exp-conditioning",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-conditioning",
          spokenDescription:
            "Ein Graustufenbild aus sechs mal sechs Bildpunkten. Mit der Auswahl wählst du die Bedingung Kreuz oder Ring, mit dem Regler die Stärke zwischen null und eins. Zwei Zahlen nennen den Abstand zum Zielbild des Kreuzes und zum Zielbild des Ringes. Nur eine der beiden Zahlen wird kleiner, wenn du die Stärke erhöhst.",
        },
      ],
    },
    {
      id: "lek-36/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Unbedingtes Bild: Abstand zum Zielbild Kreuz 0,6501, zum Zielbild Ring 0,6603",
          "Bedingung Kreuz, Stärke 0,5: Abstand zum Kreuz 0,3250",
          "Bedingung Kreuz, Stärke 0,5: Abstand zum Ring 0,6635 - er wächst leicht",
          "Bedingung Kreuz, Stärke 1: Abstand zum Kreuz 0,0000, zum Ring 0,6667",
          "Der Abstand halbiert sich hier fast: 0,6501 auf 0,3250 bei halber Stärke",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel. Das unbedingte Bild hat zum Zielbild des Kreuzes den Abstand null Komma sechs fünf null eins, zum Zielbild des Ringes null Komma sechs sechs null drei. Mit der Bedingung Kreuz und der Stärke null Komma fünf sinkt der Abstand zum Kreuz auf null Komma drei zwei fünf null, der Abstand zum Ring steigt dagegen leicht auf null Komma sechs sechs drei fünf. Bei voller Stärke ist der Abstand zum Kreuz genau null, der zum Ring null Komma sechs sechs sechs sieben.",
        },
      ],
    },
    {
      id: "lek-36/s06",
      kind: "code",
      title: "Dasselbe in Zahlen",
      visual: {
        type: "code",
        language: "python",
        code: "def bedingt(unbedingt, ziel, w):\n    return [(1 - w) * a + w * b for a, b in zip(unbedingt, ziel)]\n\ndef abstand(bild, ziel):\n    return sum(abs(a - b) for a, b in zip(bild, ziel)) / len(bild)\n\nkreuz = bedingt(unbedingt, ziel_kreuz, 0.5)\nprint(abstand(kreuz, ziel_kreuz))  # 0.3250\nprint(abstand(kreuz, ziel_ring))   # 0.6635",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def bedingt(unbedingt, ziel, w):\n    return [(1 - w) * a + w * b for a, b in zip(unbedingt, ziel)]\n\ndef abstand(bild, ziel):\n    return sum(abs(a - b) for a, b in zip(bild, ziel)) / len(bild)",
          spoken:
            "Zwei kurze Funktionen. Die erste mischt das unbedingte Bild mit dem Zielbild: eins minus w mal der unbedingte Wert, plus w mal der Zielwert. Die zweite rechnet den Abstand zweier Bilder als Mittel der Beträge der Unterschiede. Für die Bedingung Kreuz mit der Stärke null Komma fünf liefert der Abstand zum Kreuz null Komma drei zwei fünf null und zum Ring null Komma sechs sechs drei fünf.",
        },
      ],
    },
    {
      id: "lek-36/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Die Bedingung Kreuz wirkt mit der Stärke 0,5. Was macht der Abstand zum Zielbild des Ringes?",
        options: [
          "Er sinkt genauso stark wie der Abstand zum Kreuz",
          "Er wächst leicht, weil nur das Ziel der gewählten Bedingung näher kommt",
          "Er bleibt genau gleich, weil beide Ziele im selben Bild liegen",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Die Bedingung Kreuz wirkt mit der Stärke null Komma fünf. Was macht der Abstand zum Zielbild des Ringes?",
          options: [
            "Er sinkt genauso stark wie der Abstand zum Kreuz",
            "Er wächst leicht, weil nur das Ziel der gewählten Bedingung näher kommt",
            "Er bleibt genau gleich, weil beide Ziele im selben Bild liegen",
          ],
          answerIndex: 1,
          spoken:
            "Die Bedingung Kreuz wirkt mit der Stärke null Komma fünf. Was macht der Abstand zum Zielbild des Ringes? Erstens: er sinkt genauso stark wie der Abstand zum Kreuz. Zweitens: er wächst leicht, weil nur das Ziel der gewählten Bedingung näher kommt. Drittens: er bleibt genau gleich.",
          explanation:
            "Von null Komma sechs sechs null drei steigt der Abstand auf null Komma sechs sechs drei fünf, während der Abstand zum Kreuz von null Komma sechs fünf null eins auf null Komma drei zwei fünf null fällt. Die Bedingung zieht das Bild zu ihrem eigenen Ziel hin - der Abstand zum anderen Ziel kann dabei nur größer werden.",
        },
      ],
    },
    {
      id: "lek-36/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Eine Bedingung lenkt das Denoising in Richtung eines bestimmten Zielbildes. Im Experiment geschieht das über eine Mischung aus unbedingtem Ergebnis und Zielbild; die Stärke steuert, wie weit das geht. Bei voller Stärke ist das Ergebnis genau das Zielbild, bei Stärke null bleibt das unbedingte Bild. Damit ist der Weg frei für die zweite große Familie: Systeme, die aus Belohnung lernen.",
        },
      ],
    },
  ],
};
