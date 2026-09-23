import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek42: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-42",
  number: 42,
  chapterId: "kap-10",
  title: "Actor-Critic",
  learningGoals: [
    "Politik und Wertschätzung als zwei Teile eines Verfahrens beschreiben",
    "Den Bellman-Fehler als gemeinsame Lernquelle beider Teile lesen",
    "Beobachten, wie beide Teile in kleinen Schritten zusammen besser werden",
  ],
  requiresPreviousKnowledge: ["Policy Gradient (Lektion 41)", "Value Function (Lektion 38)"],
  prerequisites: ["lek-41"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-42/s01",
      kind: "heading",
      title: "Zwei Schätzer, eine Zahl",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Actor-Critic" }],
    },
    {
      id: "lek-42/s02",
      kind: "paragraph",
      title: "Ein Handelnder und ein Bewerter",
      visual: {
        type: "text",
        text: "Der Actor hält für jeden Zustand die Wahrscheinlichkeiten der Aktionen: das ist die Politik. Der Kritiker schätzt für jeden Zustand die Belohnung, die von dort noch zu erwarten ist: das ist die Wertschätzung. Beide lernen aus derselben Zahl, dem Bellman-Fehler. Er sagt, um wie viel besser der Schritt ausfiel, als der Kritiker erwartet hatte.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Der Actor hält für jeden Zustand die Wahrscheinlichkeiten der Aktionen. Das ist die Politik. Der Kritiker schätzt für jeden Zustand die Belohnung, die von dort noch zu erwarten ist. Das ist die Wertschätzung. Beide lernen aus derselben Zahl: dem Bellman-Fehler. Er sagt, um wie viel besser der Schritt ausfiel, als der Kritiker erwartet hatte.",
        },
      ],
    },
    {
      id: "lek-42/s03",
      kind: "equation",
      title: "Der gemeinsame Lernschritt",
      visual: {
        type: "equation",
        latex:
          "\\delta = r + \\gamma \\, V(s') - V(s), \\quad V(s) \\leftarrow V(s) + \\alpha_K \\, \\delta, \\quad \\theta(s,a) \\leftarrow \\theta(s,a) + \\alpha_A \\, \\delta \\, (1 - \\pi(a|s))",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "\\delta = r + \\gamma \\, V(s') - V(s), \\quad V(s) \\leftarrow V(s) + \\alpha_K \\, \\delta, \\quad \\theta(s,a) \\leftarrow \\theta(s,a) + \\alpha_A \\, \\delta \\, (1 - \\pi(a|s))",
          spoken:
            "Der Bellman-Fehler delta ist gleich der Belohnung r, plus Gamma mal V von s Strich, minus V von s. Der Kritiker zieht seinen Wert ein Stück in Richtung dieser Zahl: V von s ist gleich V von s plus die Lernrate des Kritikers mal delta. Der Actor hebt die gewählte Aktion an: theta von s und a ist gleich theta von s und a, plus die Lernrate des Actors mal delta mal eins minus pi von a gegeben s. Der Faktor eins minus pi sorgt dafür, dass eine schon wahrscheinliche Aktion weniger dazulernt.",
        },
      ],
    },
    {
      id: "lek-42/s04",
      kind: "experiment",
      title: "Politik und Wertschätzung gleichzeitig beobachten",
      visual: { type: "experiment", experimentId: "exp-actor-critic" },
      experimentId: "exp-actor-critic",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-actor-critic",
          spokenDescription:
            "Eine kleine Umgebung mit dem Ziel in Zustand zwei. Zwei Regler bestimmen die Lernrate des Kritikers und die des Actors, ein dritter die Anzahl der Schritte. Säulen zeigen, mit welcher Wahrscheinlichkeit der Agent in Zustand null und in Zustand eins weitergeht oder bleibt; der gestrichelte Umriss ist der Startwert null Komma fünf. Daneben stehen die Wertschätzung, der Verlust und der letzte Bellman-Fehler.",
        },
      ],
    },
    {
      id: "lek-42/s05",
      kind: "example",
      title: "Nachgerechnet: der erste Schritt ins Ziel",
      visual: {
        type: "list",
        items: [
          "Zustand 1, Aktion weiter führt ins Ziel: Belohnung 1",
          "Bellman-Fehler: δ = 1 + 0,9 · 0 − 0 = 1",
          "Kritiker mit Lernrate 0,2: V(1) ← 0 + 0,2 · 1 = 0,2",
          "Actor mit Lernrate 0,2: θ(1, weiter) ← 0 + 0,2 · 1 · (1 − 0,5) = 0,1",
          "Neue Wahrscheinlichkeit für weiter: 0,5498 statt 0,5",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Aus Zustand eins führt die Aktion weiter ins Ziel und bringt die Belohnung eins. Vorher wusste der Kritiker nichts, also ist V von eins gleich null. Damit ist der Bellman-Fehler gleich eins plus null Komma neun mal null minus null, also eins. Der Kritiker mit Lernrate null Komma zwei hebt V von eins auf null Komma zwei. Der Actor mit Lernrate null Komma zwei hebt die gewählte Aktion um null Komma zwei mal eins mal eins minus null Komma fünf an, also auf null Komma eins. Aus den beiden Politikwerten null Komma eins und minus null Komma eins wird die Wahrscheinlichkeit null Komma fünf vier neun acht statt null Komma fünf. Der Schritt war also nützlich: beide Teile sind ein Stück in Richtung Ziel gewandert.",
        },
      ],
    },
    {
      id: "lek-42/s06",
      kind: "code",
      title: "Der Schritt in Python",
      visual: {
        type: "code",
        language: "python",
        code: "fehler = belohnung + 0.9 * wert[naechster] - wert[zustand]\nwert[zustand] += lernrate_kritiker * fehler\nfor k in range(2):\n    richtung = (1 - p[k]) if k == aktion else -p[k]\n    theta[zustand][k] += lernrate_actor * fehler * richtung",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "fehler = belohnung + 0.9 * wert[naechster] - wert[zustand]\nwert[zustand] += lernrate_kritiker * fehler\nfor k in range(2):\n    richtung = (1 - p[k]) if k == aktion else -p[k]\n    theta[zustand][k] += lernrate_actor * fehler * richtung",
          spoken:
            "Fünf Zeilen genügen. Zuerst wird der Fehler gerechnet: Belohnung plus null Komma neun mal der Wert des nächsten Zustands, minus der Wert des jetzigen Zustands. Dann zieht der Kritiker seinen Wert mit seiner Lernrate in Richtung dieser Zahl. Danach läuft eine Schleife über die beiden Aktionen: die gewählte Aktion bekommt den Faktor eins minus ihrer Wahrscheinlichkeit, die andere den Faktor minus ihrer Wahrscheinlichkeit. Beide Teile benutzen dabei dieselbe Zahl: den Fehler.",
        },
      ],
    },
    {
      id: "lek-42/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert, wenn die Lernrate des Kritikers sehr groß wird?",
        options: [
          "Die Wertschätzung schießt über das Ziel hinaus, der Verlust bleibt groß oder wächst",
          "Der Kritiker lernt langsamer, weil der Fehler kleiner wird",
          "Der Actor bekommt keine Belohnung mehr",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert, wenn die Lernrate des Kritikers sehr groß wird?",
          options: [
            "Die Wertschätzung schießt über das Ziel hinaus, der Verlust bleibt groß oder wächst",
            "Der Kritiker lernt langsamer, weil der Fehler kleiner wird",
            "Der Actor bekommt keine Belohnung mehr",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert, wenn die Lernrate des Kritikers sehr groß wird? Schießt die Wertschätzung über das Ziel hinaus, lernt der Kritiker langsamer, oder bekommt der Actor keine Belohnung mehr?",
          explanation:
            "Ein zu großer Schritt schießt über das Ziel hinaus. Dann wechselt der Bellman-Fehler das Vorzeichen, und die Wertschätzung schwingt um ihren Zielwert. Der Verlust bleibt groß oder wächst sogar. Der Actor folgt derselben unruhigen Zahl und wird ebenfalls unsicher.",
        },
      ],
    },
    {
      id: "lek-42/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Actor entscheidet, der Kritiker bewertet. Beide benutzen denselben Bellman-Fehler: der Kritiker als Korrektur seiner Schätzung, der Actor als Gewicht für seine Politik. Zwei Lernraten, ein Schritt. In der nächsten Lektion geht es nicht mehr um Belohnungen aus der Umgebung, sondern um menschliche Bewertungen.",
        },
      ],
    },
  ],
};
