import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek38: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-38",
  number: 38,
  chapterId: "kap-10",
  title: "Value Function",
  learningGoals: [
    "Den Wert eines Zustands als abdiskontierte Summe der künftigen Belohnungen lesen",
    "Den Diskontfaktor als Gewicht für die Zukunft deuten",
    "Die Farbfläche der Grid World als Wertkarte lesen",
  ],
  requiresPreviousKnowledge: [
    "Belohnung einer Zugfolge in der Grid World (Lektion 37)",
    "Addieren und Multiplizieren von Zahlen mit Vorzeichen",
  ],
  prerequisites: ["lek-37"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-38/s01",
      kind: "heading",
      title: "Was ein Feld wert ist",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Value Function" }],
    },
    {
      id: "lek-38/s02",
      kind: "paragraph",
      title: "Von der Zugfolge zum einzelnen Zustand",
      visual: {
        type: "text",
        text: "Lektion 37 hat eine ganze Zugfolge bewertet. Jetzt bekommt jeder einzelne Zustand eine Zahl: der Wert eines Feldes ist die Belohnungssumme, die von dort aus bei bestem Spiel noch anfällt, jeder Schritt mit dem Diskontfaktor abgezinst. Die Welt ist dieselbe wie in Lektion 37: drei mal drei Felder, das Ziel oben rechts trägt den festen Wert plus eins, die Falle in der Mitte minus eins, jeder Schritt kostet 0,04. Wer das Ziel betritt, ist fertig; wer in die Falle läuft, bekommt minus eins und die Folge ist zu Ende.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Bisher wurde eine ganze Zugfolge bewertet. Jetzt bekommt jeder einzelne Zustand eine Zahl. Der Wert eines Feldes ist die Belohnungssumme, die von dort aus bei bestem Spiel noch anfällt, jeder Schritt mit dem Diskontfaktor abgezinst. Die Welt ist dieselbe wie in der vorigen Lektion: drei mal drei Felder, das Ziel oben rechts mit dem festen Wert plus eins, die Falle in der Mitte mit minus eins, und jeder Schritt kostet null Komma null vier. Wer das Ziel betritt, ist fertig; wer in die Falle läuft, bekommt minus eins und die Folge ist zu Ende.",
        },
      ],
    },
    {
      id: "lek-38/s03",
      kind: "equation",
      title: "Die Bellman-Gleichung",
      visual: {
        type: "equation",
        latex: "V(s) = \\max_{a} \\left( -0,04 + \\gamma \\, V(s') \\right)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "V(s) = \\max_{a} \\left( -0,04 + \\gamma \\, V(s') \\right)",
          spoken:
            "V von s ist gleich dem größten Wert über die vier Aktionen von minus null Komma null vier plus gamma mal V von s Strich. V von s Strich ist der Wert des Feldes, auf dem der Agent nach dem Zug steht. An den Abschlussfeldern Ziel und Falle ist dieser Wert der feste Feldwert plus eins oder minus eins. Der Diskontfaktor gamma liegt zwischen null und eins und bestimmt, wie stark eine Belohnung an Gewicht verliert, je später sie kommt.",
        },
      ],
    },
    {
      id: "lek-38/s04",
      kind: "experiment",
      title: "Den Diskontfaktor ziehen",
      visual: { type: "experiment", experimentId: "exp-value-function" },
      experimentId: "exp-value-function",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-value-function",
          spokenDescription:
            "Eine Fläche aus drei mal drei Feldern, nach dem Wert der Felder eingefärbt: dunkel heißt großer Wert, hell heißt kleiner Wert. Oben rechts liegt das Ziel, in der Mitte die Falle. In jedem Feld steht sein Wert als Zahl, und ein Regler stellt den Diskontfaktor von null bis null Komma neun neun ein. Darunter stehen der Wert des Startfelds, der Wert des Zieles, der Wert der Falle und die Zahl der Schritte bis zum Ziel.",
        },
      ],
    },
    {
      id: "lek-38/s05",
      kind: "example",
      title: "Nachgerechnet: der Wert des Startfelds",
      visual: {
        type: "list",
        items: [
          "Startfeld Zeile 2, Spalte 0; Ziel Zeile 0, Spalte 2; Falle Zeile 1, Spalte 1",
          "Kürzester Weg ins Ziel: vier Schritte, jeder kostet 0,04",
          "Schrittkosten abgezinst: 0,04 · (1 + 0,9 + 0,81 + 0,729) = 0,13756",
          "Zielbelohnung abgezinst: 0,9 hoch 4 · 1 = 0,6561",
          "Wert des Startfelds: 0,6561 - 0,13756 = 0,51854",
          "Feld links neben dem Ziel: ein Schritt, also 0,9 · 1 - 0,04 = 0,86",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel mit dem Diskontfaktor null Komma neun. Der Agent steht im Startfeld unten links, das Ziel liegt oben rechts. Der kürzeste Weg hat vier Schritte, und jeder kostet null Komma null vier. Die vier Schrittkosten werden mit eins, null Komma neun, null Komma acht eins und null Komma sieben zwei neun abgezinst; zusammen sind das null Komma eins drei sieben fünf sechs. Die Belohnung des Zieles zählt nach vier Schritten nur noch mit null Komma neun hoch vier, also mit null Komma sechs fünf sechs eins. Der Wert des Startfelds ist die Differenz: null Komma fünf eins acht fünf vier. Das Feld links neben dem Ziel kommt in einem Schritt dorthin; sein Wert ist null Komma neun mal eins minus null Komma null vier, also null Komma acht sechs.",
        },
      ],
    },
    {
      id: "lek-38/s06",
      kind: "code",
      title: "Der Wert in Python",
      visual: {
        type: "code",
        language: "python",
        code: "schrittpreis = -0.04\nzielwert = 1.0\ngamma = 0.9\n\ndef wert(zeile, spalte):\n    schritte = abs(zeile - 0) + abs(spalte - 2)\n    summe = sum(gamma ** k for k in range(schritte))\n    return schrittpreis * summe + gamma ** schritte * zielwert\n\nprint(wert(2, 0))   # 0.51854",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "schrittpreis = -0.04\nzielwert = 1.0\ngamma = 0.9\n\ndef wert(zeile, spalte):\n    schritte = abs(zeile - 0) + abs(spalte - 2)\n    summe = sum(gamma ** k for k in range(schritte))\n    return schrittpreis * summe + gamma ** schritte * zielwert",
          spoken:
            "Diese Zeilen rechnen den Wert geschlossen aus. Der Schrittpreis ist minus null Komma null vier, der feste Wert des Zieles plus eins, der Diskontfaktor null Komma neun. Die Funktion zählt zuerst die Schritte bis zum Ziel: Zeilenabstand plus Spaltenabstand. Dann summiert sie die Abzinsungen, also eins, null Komma neun, null Komma acht eins und null Komma sieben zwei neun, multipliziert die Summe mit dem Schrittpreis und addiert die abgezinste Zielbelohnung. Für das Startfeld kommt null Komma fünf eins acht fünf vier heraus.",
        },
      ],
    },
    {
      id: "lek-38/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Mit welchem Diskontfaktor zählt nur noch der nächste Schritt, sodass jedes Feld außer Ziel und Falle genau minus 0,04 wert ist?",
        options: ["Mit gamma = 0", "Mit gamma = 1", "Mit gamma = 0,9"],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Mit welchem Diskontfaktor zählt nur noch der nächste Schritt, sodass jedes Feld außer Ziel und Falle genau minus null Komma null vier wert ist?",
          options: [
            "mit gamma gleich null",
            "mit gamma gleich eins",
            "mit gamma gleich null Komma neun",
          ],
          answerIndex: 0,
          spoken:
            "Mit welchem Diskontfaktor zählt nur noch der nächste Schritt, sodass jedes Feld außer Ziel und Falle genau minus null Komma null vier wert ist? Mit gamma gleich null, mit gamma gleich eins oder mit gamma gleich null Komma neun?",
          explanation:
            "Mit gamma null wird jede Belohnung nach dem ersten Schritt mit null gewichtet. Übrig bleibt nur der Schrittpreis von minus null Komma null vier; genau das zeigen die Zahlen in der Fläche. Mit gamma gleich eins bliebe die Belohnung des Zieles voll erhalten, und das Startfeld wäre null Komma acht vier wert.",
        },
      ],
    },
    {
      id: "lek-38/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Jedes Feld hat jetzt eine Zahl: seinen Wert. Er entsteht aus der Belohnung am Ende, abgezinst über die Schritte davor, und aus dem Schrittpreis. Je näher am Ziel, desto größer der Wert; die Falle hat den kleinsten Wert. Ein Agent, der diese Werte kennt, weiß, wie gut jeder Zustand ist - aber noch nicht, welche Aktion er dort wählen soll. Das leisten die Q-Werte der nächsten Lektion.",
        },
      ],
    },
  ],
};
