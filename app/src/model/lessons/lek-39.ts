import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek39: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-39",
  number: 39,
  chapterId: "kap-10",
  title: "Q-Learning",
  learningGoals: [
    "Die Bellman-Regel als Lernschritt für einen Q-Wert lesen",
    "Verfolgen, wie sich die Q-Werte mit der Zahl der Schritte ändern",
    "Erklären, warum Aktionen ohne Ausprobieren bei null bleiben",
  ],
  requiresPreviousKnowledge: [
    "Wert eines Zustands und Diskontfaktor (Lektion 38)",
    "Klammern und Vorzeichen in einer Rechnung",
  ],
  prerequisites: ["lek-38"],
  estimatedMinutes: 17,
  sections: [
    {
      id: "lek-39/s01",
      kind: "heading",
      title: "Lernen aus Erfahrung",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Q-Learning" }],
    },
    {
      id: "lek-39/s02",
      kind: "paragraph",
      title: "Vom Wissen zum Lernschritt",
      visual: {
        type: "text",
        text: "Die Wertfunktion der letzten Lektion wurde ausgerechnet, weil die Welt bekannt war. Ein Agent, der lernt, kennt sie nicht: er probiert Züge aus und verbessert seine Schätzung nach jedem Schritt. Diese Schätzung heißt Q: zu jedem Feld gehören vier Zahlen, eine je Aktion. Der Lernschritt vergleicht den gespeicherten Q-Wert mit dem Zielwert aus Schrittpreis und Wert des Folgefeldes und zieht ihn ein Stück in dessen Richtung. Das Stück ist die Lernrate.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Die Wertfunktion der letzten Lektion wurde ausgerechnet, weil die Welt bekannt war. Ein Agent, der lernt, kennt sie nicht: er probiert Züge aus und verbessert seine Schätzung nach jedem Schritt. Diese Schätzung heißt Q. Zu jedem Feld gehören vier Zahlen, eine für jede Aktion. Der Lernschritt vergleicht den gespeicherten Q-Wert mit einem Zielwert aus Schrittpreis und Wert des Folgefeldes und zieht ihn ein Stück in dessen Richtung. Dieses Stück ist die Lernrate: null Komma fünf heißt, der Wert geht auf halbem Weg zum Zielwert.",
        },
      ],
    },
    {
      id: "lek-39/s03",
      kind: "equation",
      title: "Die Bellman-Regel",
      visual: {
        type: "equation",
        latex:
          "Q(s,a) \\leftarrow Q(s,a) + \\alpha \\, \\left( r + \\gamma \\max_{a'} Q(s',a') - Q(s,a) \\right)",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "Q(s,a) \\leftarrow Q(s,a) + \\alpha \\, \\left( r + \\gamma \\max_{a'} Q(s',a') - Q(s,a) \\right)",
          spoken:
            "Q von s und a wird ersetzt durch Q von s und a plus die Lernrate mal der Klammer. In der Klammer steht der Zielwert minus dem alten Q-Wert. Der Zielwert ist der Schrittpreis r plus gamma mal dem größten Q-Wert des Folgefeldes. Die Klammer ist also der Fehler, um den die Schätzung daneben liegt. Am Abschlussfeld gibt es kein Folgefeld mehr; dort ist der Zielwert der Schrittpreis plus das, was das Abschlussfeld selbst mitbringt: plus eins am Ziel, minus eins an der Falle.",
        },
      ],
    },
    {
      id: "lek-39/s04",
      kind: "experiment",
      title: "Die Q-Werte wachsen sehen",
      visual: { type: "experiment", experimentId: "exp-q-learning" },
      experimentId: "exp-q-learning",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-q-learning",
          spokenDescription:
            "Vier Säulen für die vier Richtungen oben, rechts, unten und links. Ein Regler stellt die Lernrate ein, ein zweiter die Anzahl der Schritte, eine Auswahl bestimmt das Feld. Die hervorgehobene Säule gehört der Aktion mit dem größten Q-Wert. Darunter stehen der größte Q-Wert der ganzen Tabelle, der beste Q-Wert des gewählten Feldes und der beste Q-Wert im Startfeld.",
        },
      ],
    },
    {
      id: "lek-39/s05",
      kind: "example",
      title: "Nachgerechnet: der erste Rundgang",
      visual: {
        type: "list",
        items: [
          "Fester Rundgang des Agenten: rechts, oben, oben, oben, rechts, rechts",
          "Nach Ziel oder Falle steht er wieder im Startfeld; der Rundgang läuft im Kreis",
          "Aktion ins Ziel: Zielwert r + gamma · V = -0,04 + 0,9 · 1 = 0,86",
          "Erster Durchgang, Lernrate 0,5: Q = 0 + 0,5 · (0,86 - 0) = 0,43",
          "Zweiter Durchgang: Q = 0,43 + 0,5 · (0,86 - 0,43) = 0,645",
          "Nach 30 Schritten steht diese Aktion bei 0,833; die Aktion in die Falle bei -0,911",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel mit Lernrate null Komma fünf. Der Agent folgt einem festen Rundgang: rechts, oben, oben, oben, rechts, rechts. Nach jedem Abschlussfeld steht er wieder im Startfeld, sodass der Rundgang in jedem Zyklus einmal in die Falle und einmal ins Ziel läuft. Am Anfang stehen alle Q-Werte bei null. Für die Aktion ins Ziel ist der Zielwert minus null Komma null vier plus null Komma neun mal eins, also null Komma acht sechs. Mit Lernrate null Komma fünf wächst der Q-Wert im ersten Durchgang auf null Komma vier drei, im zweiten auf null Komma sechs vier fünf. Nach dreißig Schritten steht er bei null Komma acht drei drei. Die Aktion, die in die Falle führt, hat den Zielwert minus null Komma neun vier und fällt im selben Takt auf minus null Komma neun eins eins.",
        },
      ],
    },
    {
      id: "lek-39/s06",
      kind: "code",
      title: "Der Lernschritt in Python",
      visual: {
        type: "code",
        language: "python",
        code: "# q hat neun Zeilen (Felder) und vier Spalten (Aktionen)\nq = [[0.0] * 4 for _ in range(9)]\n\ndef lernschritt(feld, aktion, folgewert, alpha, gamma=0.9):\n    zielwert = -0.04 + gamma * folgewert\n    q[feld][aktion] += alpha * (zielwert - q[feld][aktion])\n\nlernschritt(1, 1, 1.0, 0.5)   # Feld Zeile 0, Spalte 1, Aktion rechts, Ziel im Folgefelt\nprint(q[1][1])                 # 0.43",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "# q hat neun Zeilen (Felder) und vier Spalten (Aktionen)\nq = [[0.0] * 4 for _ in range(9)]\n\ndef lernschritt(feld, aktion, folgewert, alpha, gamma=0.9):\n    zielwert = -0.04 + gamma * folgewert\n    q[feld][aktion] += alpha * (zielwert - q[feld][aktion])",
          spoken:
            "Der Kern sind drei Zeilen. In der Tabelle steht für jedes der neun Felder eine Zeile mit vier Q-Werten. Ein Lernschritt rechnet zuerst den Zielwert: Schrittpreis minus null Komma null vier plus null Komma neun mal der Wert des Folgefeldes. Dann zieht er den gespeicherten Q-Wert mit der Lernrate ein Stück in Richtung dieses Zielwertes. Für die Aktion ins Ziel heißt das null plus null Komma fünf mal null Komma acht sechs, also null Komma vier drei. Mit null Komma fünf ist der Wert nach einem Schritt schon halb am Zielwert.",
        },
      ],
    },
    {
      id: "lek-39/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Der Agent hat ein Feld nie betreten. Was steht dann in den Q-Werten dieses Feldes?",
        options: [
          "Für alle vier Aktionen null - es gab keine Aktualisierung",
          "Der Wert des Feldes aus der Wertfunktion",
          "Für alle vier Aktionen minus 0,04",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Der Agent hat ein Feld nie betreten. Was steht dann in den Q-Werten dieses Feldes?",
          options: [
            "für alle vier Aktionen null, weil es keine Aktualisierung gab",
            "der Wert des Feldes aus der Wertfunktion",
            "für alle vier Aktionen minus null Komma null vier",
          ],
          answerIndex: 0,
          spoken:
            "Der Agent hat ein Feld nie betreten. Was steht dann in den Q-Werten dieses Feldes? Für alle vier Aktionen null, weil es keine Aktualisierung gab? Der Wert des Feldes aus der Wertfunktion? Oder für alle vier Aktionen minus null Komma null vier?",
          explanation:
            "Ein Q-Wert ändert sich nur durch einen Lernschritt. Wo der Rundgang nie hinkommt, bleibt der Startwert null stehen. Genau darum muss ein Agent ausprobieren: gelernt wird nur, was auch gegangen wurde. Mehr Schritte lassen die Werte außerdem vom Ziel rückwärts über die ganze Fläche wandern.",
        },
      ],
    },
    {
      id: "lek-39/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Q-Learning schätzt für jedes Feld und jede Aktion den erwarteten Return. Der Lernschritt zieht den gespeicherten Wert mit der Lernrate in Richtung des Zielwertes aus Schrittpreis und Folgefeld. Mit genügend Schritten stehen auf den begangenen Wegen die Werte, die die Wertfunktion vorhersagt; die Aktion in die Falle fällt ins Negative. Damit weiß der Agent, welche Aktion auf jedem Feld die beste ist - wie daraus eine Wahrscheinlichkeitsverteilung wird, zeigt die nächste Lektion.",
        },
      ],
    },
  ],
};
