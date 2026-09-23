import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek21: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-21",
  number: 21,
  chapterId: "kap-06",
  title: "Latent Space",
  learningGoals: [
    "Den latenten Raum als Raum der gelernten Darstellungen beschreiben",
    "Zwischen zwei Darstellungen interpolieren und den Punkt berechnen",
    "Die Abstände des Zwischenpunktes zu beiden Enden deuten",
  ],
  requiresPreviousKnowledge: [
    "Vektoren und ihre Längen",
    "Wortvektoren als gelernte Darstellungen",
  ],
  prerequisites: ["lek-20"],
  estimatedMinutes: 13,
  sections: [
    {
      id: "lek-21/s01",
      kind: "heading",
      title: "Zwischen zwei gelernten Darstellungen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Latent Space" }],
    },
    {
      id: "lek-21/s02",
      kind: "paragraph",
      title: "Der Raum hinter den Zahlen",
      visual: {
        type: "text",
        text: "Nach dem Training stehen im Netz keine Wörter oder Bilder mehr, sondern Vektoren: die gelernten Darstellungen. Der Raum, in dem diese Vektoren liegen, heißt latenter Raum. Zwei bekannte Punkte darin lassen sich verbinden, und jeder Punkt auf dieser Verbindung ist eine Mischung aus beiden. Interpoliert wird Koordinate für Koordinate mit demselben Faktor t: bei t gleich null ist das Ergebnis genau die erste Darstellung, bei t gleich eins genau die zweite.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Nach dem Training stehen im Netz keine Wörter oder Bilder mehr, sondern Vektoren: die gelernten Darstellungen. Der Raum, in dem diese Vektoren liegen, heißt latenter Raum. Zwei bekannte Punkte darin lassen sich verbinden, und jeder Punkt auf dieser Verbindung ist eine Mischung aus beiden. Interpoliert wird Koordinate für Koordinate mit demselben Faktor t.",
        },
      ],
    },
    {
      id: "lek-21/s03",
      kind: "equation",
      title: "Die Zwischenstellung",
      visual: { type: "equation", latex: "z(t) = (1 - t) \\, z_A + t \\, z_B" },
      spoken: [
        {
          kind: "equation",
          latex: "z(t) = (1 - t) \\, z_A + t \\, z_B",
          spoken:
            "Der interpolierte Vektor z von t ist eins minus t mal der Darstellung A plus t mal der Darstellung B. Bei t gleich null bleibt A übrig, bei t gleich eins B, und dazwischen liegt der Punkt auf der geraden Verbindung.",
        },
      ],
    },
    {
      id: "lek-21/s04",
      kind: "experiment",
      title: "Den Regler zwischen A und B schieben",
      visual: { type: "experiment", experimentId: "exp-latent-space" },
      experimentId: "exp-latent-space",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-latent-space",
          spokenDescription:
            "Eine Zeichenebene mit zwei festen Punkten A und B und einer gestrichelten Verbindungslinie. Der Regler t von null bis eins bewegt einen dritten Punkt von A nach B; optional werden Zwischenstellen bei null Komma zwei fünf, null Komma fünf und null Komma sieben fünf markiert. Daneben stehen t, die Koordinaten und die Abstände zu A und zu B.",
        },
      ],
    },
    {
      id: "lek-21/s05",
      kind: "example",
      title: "Vier Stellen nachgerechnet",
      visual: {
        type: "list",
        items: [
          "A = (-1,8|-0,6), B = (2|1,4)",
          "Länge der Verbindungslinie: |B - A| = 4,2942",
          "t = 0,25: Punkt (-0,85|-0,1), Abstand zu A 1,0735, zu B 3,2206",
          "t = 0,5: Punkt (0,1|0,4), Abstand zu beiden Enden je 2,1471",
          "t = 0,75: Punkt (1,05|0,9), Abstand zu A 3,2206, zu B 1,0735",
          "Die Summe der beiden Abstände ist bei jedem t gleich 4,2942",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "A steht bei minus eins Komma acht und minus null Komma sechs, B bei zwei und eins Komma vier; die Verbindungslinie ist vier Komma zwei neun vier zwei lang. Bei t gleich null Komma zwei fünf liegt der Punkt bei minus null Komma acht fünf und minus null Komma eins, eins Komma null sieben drei fünf von A und drei Komma zwei zwei null sechs von B entfernt. Bei t gleich null Komma fünf sind beide Abstände gleich groß, nämlich zwei Komma eins vier sieben eins. Die Summe der beiden Abstände bleibt bei jedem t gleich der Länge der Verbindungslinie.",
        },
      ],
    },
    {
      id: "lek-21/s06",
      kind: "code",
      title: "Die Interpolation in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import math\n\nA, B = (-1.8, -0.6), (2.0, 1.4)\n\ninterpoliere = lambda t: tuple(a + t * (b - a) for a, b in zip(A, B))\nabstand = lambda p, q: math.hypot(p[0] - q[0], p[1] - q[1])\n\nfor t in (0.0, 0.25, 0.5, 0.75, 1.0):\n    p = interpoliere(t)\n    print(t, p, round(abstand(p, A), 4), round(abstand(p, B), 4))",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "interpoliere = lambda t: tuple(a + t * (b - a) for a, b in zip(A, B))",
          spoken:
            "Die Interpolation läuft Koordinate für Koordinate: jede Koordinate von A plus t mal der Differenz zur entsprechenden Koordinate von B. In einem echten latenten Raum stehen statt zwei Koordinaten viele hunderte, und die Schleife läuft über alle.",
        },
      ],
    },
    {
      id: "lek-21/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was gilt für den interpolierten Punkt bei t = 0,5?",
        options: [
          "Er liegt genau in der Mitte: der Abstand zu A und zu B ist gleich groß.",
          "Er liegt näher an A, weil A die erste Darstellung ist.",
          "Er ist ein Beispiel, das im Training vorkam.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was gilt für den interpolierten Punkt bei t gleich null Komma fünf?",
          options: [
            "Er liegt genau in der Mitte: der Abstand zu A und zu B ist gleich groß.",
            "Er liegt näher an A, weil A die erste Darstellung ist.",
            "Er ist ein Beispiel, das im Training vorkam.",
          ],
          answerIndex: 0,
          spoken:
            "Was gilt für den interpolierten Punkt bei t gleich null Komma fünf? Erstens: er liegt genau in der Mitte, der Abstand zu A und zu B ist gleich groß. Zweitens: er liegt näher an A, weil A die erste Darstellung ist. Oder drittens: er ist ein Beispiel, das im Training vorkam.",
          explanation:
            "Bei t gleich null Komma fünf steht in der Formel zweimal der Faktor null Komma fünf: z ist der Mittelwert von A und B. Beide Abstände sind dann gleich groß, nämlich zwei Komma eins vier sieben eins. Ein Trainingsbeispiel ist dieser Punkt nicht - er entsteht erst durch die Interpolation.",
        },
      ],
    },
    {
      id: "lek-21/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der latente Raum ist der Raum der gelernten Darstellungen. Zwischen zwei Darstellungen lässt sich mit einem einzigen Faktor t interpolieren: die Formel ist eine gewichtete Summe, und die Abstände zu den beiden Enden verhalten sich wie t und eins minus t. So entstehen Zwischendarstellungen, die so nie im Training vorkamen. Der nächste Schritt kehrt das um: aus einer Darstellung wieder eine Eingabe machen.",
        },
      ],
    },
  ],
};
