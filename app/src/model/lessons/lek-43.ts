import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek43: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-43",
  number: 43,
  chapterId: "kap-10",
  title: "Präferenzbasiertes Posttraining",
  learningGoals: [
    "Bewertungen zweier Antworten in eine Präferenz übersetzen",
    "Die Präferenzstärke als Regler für die Stärke des Updates deuten",
    "Den vereinfachten Update-Schritt einem echten Posttraining zuordnen",
  ],
  requiresPreviousKnowledge: [
    "Sprachmodell und Wahrscheinlichkeit des nächsten Tokens (Lektion 31)",
    "Sigmoid und Wahrscheinlichkeit (Lektion 12)",
  ],
  prerequisites: ["lek-42"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-43/s01",
      kind: "heading",
      title: "Aus Bewertungen wird eine Vorliebe",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Präferenzbasiertes Posttraining" }],
    },
    {
      id: "lek-43/s02",
      kind: "paragraph",
      title: "Menschen bewerten, das Modell lernt daraus",
      visual: {
        type: "text",
        text: "Ein Sprachmodell liefert zu einer Frage mehrere Antworten. Menschen bewerten diese Antworten, zum Beispiel mit Punkten von eins bis fünf. Aus den Bewertungen entsteht eine Vorliebe: die besser bewertete Antwort soll wahrscheinlicher werden. Die Präferenzstärke gibt an, wie deutlich diese Vorliebe in ein Update eingeht. Das Verfahren heißt Posttraining, weil es erst nach dem Vortraining auf den vorhandenen Gewichten arbeitet.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Sprachmodell liefert zu einer Frage mehrere Antworten. Menschen bewerten diese Antworten, zum Beispiel mit Punkten von eins bis fünf. Aus den Bewertungen entsteht eine Vorliebe: die besser bewertete Antwort soll wahrscheinlicher werden. Die Präferenzstärke gibt an, wie deutlich diese Vorliebe in ein Update eingeht. Das Verfahren heißt Posttraining, weil es erst nach dem Vortraining auf den vorhandenen Gewichten arbeitet.",
        },
      ],
    },
    {
      id: "lek-43/s03",
      kind: "equation",
      title: "Präferenzwahrscheinlichkeit und Update",
      visual: {
        type: "equation",
        latex:
          "p = \\sigma(\\beta \\, \\Delta), \\quad \\Delta = r_A - r_B, \\quad s_A \\leftarrow s_A + \\eta \\, \\beta, \\quad s_B \\leftarrow s_B - \\eta \\, \\beta",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "p = \\sigma(\\beta \\, \\Delta), \\quad \\Delta = r_A - r_B, \\quad s_A \\leftarrow s_A + \\eta \\, \\beta, \\quad s_B \\leftarrow s_B - \\eta \\, \\beta",
          spoken:
            "Die Präferenzwahrscheinlichkeit p ist gleich Sigma von Präferenzstärke beta mal Abstand Delta. Der Abstand Delta ist der Mittelwert der Bewertungen von Antwort A minus dem Mittelwert von Antwort B. Das Update hebt die bevorzugte Antwort an: s von A ist gleich s von A plus Eta mal beta. Die andere Antwort wird gesenkt: s von B ist gleich s von B minus Eta mal beta. Eta ist die feste Schrittweite, beta die Präferenzstärke.",
        },
      ],
    },
    {
      id: "lek-43/s04",
      kind: "experiment",
      title: "Bewertungen, Präferenz und Update untersuchen",
      visual: { type: "experiment", experimentId: "exp-praeferenzen" },
      experimentId: "exp-praeferenzen",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-praeferenzen",
          spokenDescription:
            "Zwei Antworten mit je zwei Bewertungen. Ein Regler bestimmt die Präferenzstärke. Säulen zeigen die Bewertungen nach dem Update, der gestrichelte Umriss den Stand davor; hervorgehoben sind die beiden Säulen der bevorzugten Antwort. Darunter stehen der Abstand der Antworten vor und nach dem Update, die Präferenzwahrscheinlichkeit und die Verschiebung je Antwort.",
        },
      ],
    },
    {
      id: "lek-43/s05",
      kind: "example",
      title: "Nachgerechnet: ein Update-Schritt",
      visual: {
        type: "list",
        items: [
          "Antwort A: Bewertungen 4 und 5, Mittel 4,5",
          "Antwort B: Bewertungen 2 und 3, Mittel 2,5",
          "Abstand: Δ = 4,5 − 2,5 = 2",
          "Präferenzstärke 1: p = σ(1 · 2) = 0,8808",
          "Schub: 0,4 · 1 = 0,4",
          "Nachher: A hat 4,4 und 5,4, B hat 1,6 und 2,6; Abstand 2,8",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Antwort A wird mit vier und fünf bewertet, im Mittel also vier Komma fünf. Antwort B wird mit zwei und drei bewertet, im Mittel zwei Komma fünf. Der Abstand ist zwei. Bei Präferenzstärke eins ist die Präferenzwahrscheinlichkeit Sigma von zwei, also null Komma acht acht null acht. Die Verschiebung je Antwort ist null Komma vier mal eins, also null Komma vier. Danach steht A bei vier Komma vier und fünf Komma vier, B bei eins Komma sechs und zwei Komma sechs. Der Abstand ist von zwei auf zwei Komma acht gewachsen.",
        },
      ],
    },
    {
      id: "lek-43/s06",
      kind: "code",
      title: "Der Schritt in Python",
      visual: {
        type: "code",
        language: "python",
        code: "abstand = r_A - r_B\np = 1 / (1 + math.exp(-staerke * abstand))\nschub = 0.4 * staerke\ns_A += schub\ns_B -= schub",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "abstand = r_A - r_B\np = 1 / (1 + math.exp(-staerke * abstand))\nschub = 0.4 * staerke\ns_A += schub\ns_B -= schub",
          spoken:
            "Auch hier genügen wenige Zeilen. Zuerst der Abstand der beiden Mittelwerte. Dann die Präferenzwahrscheinlichkeit: eins durch eins plus e hoch minus Präferenzstärke mal Abstand. Die Verschiebung ist null Komma vier mal die Präferenzstärke, fest im Code. Zum Schluss wird die bevorzugte Antwort um diesen Betrag angehoben und die andere gesenkt. In einem echten Verfahren wie DPO wird der Schritt zusätzlich mit der Wahrscheinlichkeit gewichtet, sodass er kleiner wird, wenn das Modell der Vorliebe schon folgt; hier ist er absichtlich geradlinig.",
        },
      ],
    },
    {
      id: "lek-43/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert bei einer Präferenzstärke von null?",
        options: [
          "Es gibt kein Update: beide Antworten bleiben gleich wahrscheinlich",
          "Die bevorzugte Antwort wird doppelt so stark angehoben",
          "Der Abstand der Antworten wird negativ",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert bei einer Präferenzstärke von null?",
          options: [
            "Es gibt kein Update: beide Antworten bleiben gleich wahrscheinlich",
            "Die bevorzugte Antwort wird doppelt so stark angehoben",
            "Der Abstand der Antworten wird negativ",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert bei einer Präferenzstärke von null? Gibt es kein Update, wird die bevorzugte Antwort doppelt so stark angehoben, oder wird der Abstand negativ?",
          explanation:
            "Bei Präferenzstärke null ist die Präferenzwahrscheinlichkeit genau null Komma fünf und die Verschiebung null. Ohne Vorliebe gibt es nichts zu lernen, das Modell bleibt unverändert. Der Abstand kann nur wachsen, wenn die Stärke positiv ist - negativ wird er nie.",
        },
      ],
    },
    {
      id: "lek-43/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Präferenzbasiertes Posttraining macht aus Bewertungen einen Abstand, aus dem Abstand eine Wahrscheinlichkeit und aus beidem einen Update-Schritt: die bevorzugte Antwort wird angehoben, die andere gesenkt. Die Präferenzstärke bestimmt, wie deutlich das geschieht. Damit ist der Weg von menschlicher Rückmeldung zu geänderten Gewichten beschrieben - im nächsten Kapitel laufen alle Bausteine des Kurses in einem kleinen Modell zusammen.",
        },
      ],
    },
  ],
};
