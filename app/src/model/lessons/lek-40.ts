import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek40: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-40",
  number: 40,
  chapterId: "kap-10",
  title: "Policy",
  learningGoals: [
    "Eine Politik als Wahrscheinlichkeitsverteilung über die Aktionen lesen",
    "Die Softmax-Funktion über die Q-Werte berechnen",
    "Die Temperatur als Schärfe der Wahl deuten",
  ],
  requiresPreviousKnowledge: [
    "Q-Werte einer Grid World (Lektion 39)",
    "Softmax und Wahrscheinlichkeiten (Lektion 30)",
  ],
  prerequisites: ["lek-39"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-40/s01",
      kind: "heading",
      title: "Wahrscheinlichkeiten statt fester Wahl",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Policy" }],
    },
    {
      id: "lek-40/s02",
      kind: "paragraph",
      title: "Was der Agent tatsächlich tut",
      visual: {
        type: "text",
        text: "Die Q-Werte sagen, welche Aktion auf einem Feld die beste ist. Ein Agent, der immer nur die beste nimmt, probiert nie etwas anderes aus und bleibt auf Wegen hängen, die er zufällig zuerst gefunden hat. Deshalb steht über den Q-Werten eine Wahrscheinlichkeitsverteilung: die Politik. Auf jedem Feld wird jede der vier Richtungen mit einer eigenen Wahrscheinlichkeit gewählt, und die vier Zahlen ergeben zusammen eins. Die Softmax-Funktion macht aus den Q-Werten diese Verteilung; die Temperatur bestimmt, wie scharf sie wird.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Die Q-Werte sagen, welche Aktion auf einem Feld die beste ist. Ein Agent, der immer nur die beste nimmt, probiert nie etwas anderes aus. Deshalb legt man über die Q-Werte eine Wahrscheinlichkeitsverteilung: die Politik. Auf jedem Feld wird jede der vier Richtungen mit einer eigenen Wahrscheinlichkeit gewählt, und die vier Zahlen ergeben zusammen eins. Die Softmax-Funktion macht aus den Q-Werten diese Verteilung, und die Temperatur bestimmt, wie scharf sie wird.",
        },
      ],
    },
    {
      id: "lek-40/s03",
      kind: "equation",
      title: "Softmax über die Q-Werte",
      visual: {
        type: "equation",
        latex: "p(a|s) = \\frac{\\exp(Q(s,a)/T)}{\\sum_{b} \\exp(Q(s,b)/T)}, \\quad T > 0",
      },
      spoken: [
        {
          kind: "equation",
          latex: "p(a|s) = \\frac{\\exp(Q(s,a)/T)}{\\sum_{b} \\exp(Q(s,b)/T)}, \\quad T > 0",
          spoken:
            "p von a gegeben s ist gleich der Exponentialfunktion von Q von s und a geteilt durch die Temperatur, geteilt durch die Summe derselben Ausdrücke über alle vier Aktionen b. Die Temperatur T muss größer als null sein. Ist T klein, liegen die Wahrscheinlichkeiten weit auseinander und die beste Aktion bekommt fast alles. Ist T groß, rücken die Wahrscheinlichkeiten zusammen und die Wahl wird fast zufällig.",
        },
      ],
    },
    {
      id: "lek-40/s04",
      kind: "experiment",
      title: "Die Temperatur drehen",
      visual: { type: "experiment", experimentId: "exp-policy" },
      experimentId: "exp-policy",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-policy",
          spokenDescription:
            "Ein Raster aus drei mal drei Feldern. In jedem Feld steht die Richtung mit der größten Wahrscheinlichkeit, und die Farbe zeigt, wie deutlich diese Wahl ist: satt heißt deutlich, hell heißt unentschieden. Auf Ziel und Falle wird nicht gewählt, dort steht der Name des Feldes. Ein Regler stellt die Temperatur ein, eine Auswahl bestimmt das Feld, dessen vier Richtungswahrscheinlichkeiten als Säulen erscheinen. Darunter stehen die Wahrscheinlichkeit der besten Richtung, die Entropie der Verteilung und zwei Vergleichszahlen.",
        },
      ],
    },
    {
      id: "lek-40/s05",
      kind: "example",
      title: "Nachgerechnet: das Feld links neben dem Ziel",
      visual: {
        type: "list",
        items: [
          "Feld Zeile 0, Spalte 1; Q-Werte: oben 0,734 | rechts 0,860 | unten -0,940 | links 0,6206",
          "Temperatur 0,25: jeder Q-Wert minus dem größten, dann durch T geteilt: -0,504 | 0 | -7,2 | -0,9576",
          "Exponentialfunktion davon: 0,6041 | 1 | 0,0007 | 0,3838",
          "Summe der Zählwerte: 1,9887",
          "Wahrscheinlichkeiten: oben 0,3038 | rechts 0,5028 | unten 0,0004 | links 0,1930",
          "Die Richtung in die Falle bekommt nur 0,0004 - sie bleibt fast unberücksichtigt",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel für das Feld links neben dem Ziel mit der Temperatur null Komma zwei fünf. Seine Q-Werte sind null Komma sieben drei vier nach oben, null Komma acht sechs nach rechts, minus null Komma neun vier nach unten und null Komma sechs zwei null sechs nach links. Zuerst wird von jedem Q-Wert der größte abgezogen; das ändert die Verhältnisse nicht und hält die Zahlen klein. Es bleibt minus null Komma eins zwei sechs, null, minus eins Komma acht und minus null Komma neun fünf sieben sechs. Geteilt durch die Temperatur und in die Exponentialfunktion gesetzt entstehen die Zählwerte null Komma sechs null vier eins, eins, null Komma null null null sieben und null Komma drei acht drei acht. Ihre Summe ist eins Komma neun acht acht sieben. Geteilt durch diese Summe sind die Wahrscheinlichkeiten null Komma drei null drei acht, null Komma fünf null zwei acht, null Komma null null null vier und null Komma eins neun drei null. Die Richtung in die Falle bekommt nur null Komma null null null vier.",
        },
      ],
    },
    {
      id: "lek-40/s06",
      kind: "code",
      title: "Die Politik in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\ndef politik(q, temperatur):\n    groesster = max(q)\n    zaehler = [math.exp(wert - groesster) / temperatur for wert in q]\n    summe = sum(zaehler)\n    return [anteil / summe for anteil in zaehler]\n\nprint(politik([0.734, 0.86, -0.94, 0.6206], 0.25))\n# [0.3038, 0.5028, 0.0004, 0.1930]",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import math\n\ndef politik(q, temperatur):\n    groesster = max(q)\n    zaehler = [math.exp(wert - groesster) / temperatur for wert in q]\n    summe = sum(zaehler)\n    return [anteil / summe for anteil in zaehler]",
          spoken:
            "Die Funktion bekommt die vier Q-Werte eines Feldes und die Temperatur. Zuerst zieht sie den größten Q-Wert ab; das ändert die Verhältnisse der Zahlen zueinander nicht, hält sie aber klein. Dann bildet sie für jeden Wert die Exponentialfunktion, teilt durch die Temperatur und summiert die vier Zählwerte. Am Ende teilt sie jeden Zählwert durch diese Summe. So entstehen vier Zahlen zwischen null und eins, die zusammen eins ergeben; für das Feld links neben dem Ziel und die Temperatur null Komma zwei fünf sind es null Komma drei null drei acht, null Komma fünf null zwei acht, null Komma null null null vier und null Komma eins neun drei null.",
        },
      ],
    },
    {
      id: "lek-40/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert mit der Politik, wenn die Temperatur sehr groß wird?",
        options: [
          "Die Verteilung wird gleichmäßiger: alle vier Richtungen bekommen fast dieselbe Wahrscheinlichkeit",
          "Die Verteilung wird schärfer: die beste Richtung bekommt fast die ganze Wahrscheinlichkeit",
          "Die Q-Werte werden ebenfalls größer",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert mit der Politik, wenn die Temperatur sehr groß wird?",
          options: [
            "die Verteilung wird gleichmäßiger, alle vier Richtungen bekommen fast dieselbe Wahrscheinlichkeit",
            "die Verteilung wird schärfer, die beste Richtung bekommt fast die ganze Wahrscheinlichkeit",
            "die Q-Werte werden ebenfalls größer",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert mit der Politik, wenn die Temperatur sehr groß wird? Wird die Verteilung gleichmäßiger, weil alle vier Richtungen fast dieselbe Wahrscheinlichkeit bekommen? Wird sie schärfer, weil die beste Richtung fast die ganze Wahrscheinlichkeit bekommt? Oder werden die Q-Werte ebenfalls größer?",
          explanation:
            "Geteilt wird durch die Temperatur. Bei großer Temperatur rücken die Q-Werte im Verhältnis enger zusammen, deshalb werden die Unterschiede geglättet: bei Temperatur zwei bekommt die beste Richtung nur noch rund null Komma drei eins. Umgekehrt macht eine sehr kleine Temperatur die Wahl fast sicher. Die Temperatur ist damit der Regler zwischen Ausprobieren und Ausnutzen; die Q-Werte selbst ändern sich dabei nicht.",
        },
      ],
    },
    {
      id: "lek-40/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Politik macht aus den Q-Werten Wahrscheinlichkeiten: gute Aktionen bekommen viel, schlechte wenig, aber keine Aktion fällt ganz heraus. Die Softmax-Funktion erzeugt diese Verteilung, die Temperatur stellt die Schärfe ein. Damit kann ein Agent auch einmal einen Umweg versuchen. Wie eine solche Politik ohne Q-Werte direkt gelernt wird, zeigt die nächste Lektion: der Policy Gradient.",
        },
      ],
    },
  ],
};
