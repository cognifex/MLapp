import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek31: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-31",
  number: 31,
  chapterId: "kap-08",
  title: "Sprachmodell",
  learningGoals: [
    "Die Ausgabe eines Sprachmodells als bedingte Verteilung des nächsten Tokens beschreiben",
    "Wahrscheinlichkeiten für den nächsten Token aus Zählungen im Korpus herleiten",
    "Die wahrscheinlichste Fortsetzung und die ganze Verteilung auseinanderhalten",
  ],
  requiresPreviousKnowledge: [
    "Softmax als Weg von Logits zu Wahrscheinlichkeiten",
    "Anteile auf eine Teilmenge beziehen: von allen Fällen bleiben nur die passenden übrig",
  ],
  prerequisites: ["lek-30"],
  estimatedMinutes: 13,
  sections: [
    {
      id: "lek-31/s01",
      kind: "heading",
      title: "Was kommt als Nächstes?",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Sprachmodell" }],
    },
    {
      id: "lek-31/s02",
      kind: "paragraph",
      title: "Ein Modell gibt keine Antwort, sondern eine Verteilung",
      visual: {
        type: "text",
        text: "Ein Sprachmodell sagt nicht „das nächste Token ist bellen“, sondern gibt für jeden Kandidaten eine Wahrscheinlichkeit aus. Grundlage ist der bisherige Text, der Kontext. Gefragt ist also die bedingte Wahrscheinlichkeit: wie wahrscheinlich ist ein Token, wenn der Kontext schon feststeht? In einem ganz kleinen Modell zählt man dafür einfach nach, wie oft welches Token auf welchen Anfang gefolgt ist: die Anzahl des Paares geteilt durch die Anzahl des Anfangs. Die Verteilung, die dabei herauskommt, ist genau das, was Softmax in einem großen Modell aus den Logits macht.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Sprachmodell sagt nicht, das nächste Token ist bellen. Es gibt für jeden Kandidaten eine Wahrscheinlichkeit aus. Grundlage ist der bisherige Text, der Kontext. Gefragt ist also die bedingte Wahrscheinlichkeit: wie wahrscheinlich ist ein Token, wenn der Kontext schon feststeht? In einem ganz kleinen Modell zählt man dafür einfach nach, wie oft welches Token auf welchen Anfang gefolgt ist: die Anzahl des Paares geteilt durch die Anzahl des Anfangs.",
        },
      ],
    },
    {
      id: "lek-31/s03",
      kind: "equation",
      title: "Die Formel",
      visual: {
        type: "equation",
        latex: "P(w_t) = Anzahl(w_t, K) / Anzahl(K)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "P(w_t) = Anzahl(w_t, K) / Anzahl(K)",
          spoken:
            "P von w tief t ist gleich Anzahl von w tief t und dem Kontext K, geteilt durch Anzahl von K. Gezählt wird also, wie oft das Token zusammen mit diesem Kontext vorkommt, und wie oft der Kontext überhaupt vorkommt. Der Quotient ist die bedingte Wahrscheinlichkeit des Tokens. Über alle Kandidaten summiert ergibt sie eins.",
        },
      ],
    },
    {
      id: "lek-31/s04",
      kind: "experiment",
      title: "Drei Anfänge, drei Verteilungen",
      visual: { type: "experiment", experimentId: "exp-sprachmodell" },
      experimentId: "exp-sprachmodell",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-sprachmodell",
          spokenDescription:
            "Ein Auswahlfeld mit drei Satzanfängen: der Hund, die Katze, der Regen. Nach jedem Wechsel ordnet sich das liegende Säulendiagramm neu: jede Säule ist ein mögliches nächstes Token, ihre Länge die Wahrscheinlichkeit. Die wahrscheinlichste Fortsetzung ist hervorgehoben. Daneben stehen die Anzahl der Beobachtungen im Korpus, die Anzahl der Kandidaten, die größte Wahrscheinlichkeit und die Entropie der Verteilung.",
        },
      ],
    },
    {
      id: "lek-31/s05",
      kind: "example",
      title: "Durchgezähltes Beispiel",
      visual: {
        type: "list",
        items: [
          "Anfang „der Hund“ kommt in 100 Sätzen vor",
          "bellen: 45 von 100 → 0,4500",
          "laufen: 25 von 100 → 0,2500",
          "fressen: 18 von 100 → 0,1800",
          "schlafen: 12 von 100 → 0,1200",
          "Summe der vier Wahrscheinlichkeiten: 1,000000, Entropie 1,2690 nat",
          "die Katze: schlafen 40 von 100 → 0,4000, Entropie 1,2799 nat",
          "der Regen: fällt 55 von 100 → 0,5500, Entropie 1,1655 nat",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Im Beispiel kommt der Anfang der Hund in hundert Sätzen vor. Fünfundvierzigmal folgt bellen, also null Komma vier fünf. Fünfundzwanzigmal folgt laufen, das sind null Komma zwei fünf. Achtzehnmal folgt fressen und zwölfmal schlafen. Die vier Wahrscheinlichkeiten ergeben zusammen eins, die Entropie beträgt eins Komma zwei sechs neun null nat. Bei die Katze ist die Verteilung am offensten, dort ist die Entropie mit eins Komma zwei sieben neun neun nat am größten. Bei der Regen ist sie am kleinsten, weil fällt mit null Komma fünf fünf die Hälfte der Masse trägt.",
        },
      ],
    },
    {
      id: "lek-31/s06",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Der Anfang „der Regen“ kommt 100-mal vor, 55-mal davon folgt „fällt“. Wie groß ist die bedingte Wahrscheinlichkeit von „fällt“?",
        options: ["0,55", "0,45", "5,5"],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Der Anfang der Regen kommt hundertmal vor, fünfundfünfzigmal davon folgt fällt. Wie groß ist die bedingte Wahrscheinlichkeit von fällt?",
          options: ["null Komma fünf fünf", "null Komma vier fünf", "fünf Komma fünf"],
          answerIndex: 0,
          spoken:
            "Der Anfang der Regen kommt hundertmal vor, fünfundfünfzigmal davon folgt fällt. Wie groß ist die bedingte Wahrscheinlichkeit von fällt? Antwort eins: null Komma fünf fünf. Antwort zwei: null Komma vier fünf. Antwort drei: fünf Komma fünf.",
          explanation:
            "Gerechnet wird Anzahl von Paar geteilt durch Anzahl des Anfangs, also 55 geteilt durch 100, das sind 0,55. Der Wert 0,45 wäre der Rest, also die Wahrscheinlichkeit, dass etwas anderes folgt. Eine Wahrscheinlichkeit über eins ist unmöglich.",
        },
      ],
    },
    {
      id: "lek-31/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Sprachmodell gibt für einen Kontext eine Verteilung über den nächsten Token aus. In diesem Modell entsteht sie aus Zählungen: Anzahl des Paares geteilt durch Anzahl des Kontexts. Die Verteilung sagt, was plausibel ist, nicht was kommt. Wie daraus tatsächlich ein Token gewählt wird, klärt der nächste Schritt mit Temperatur, Top-k und Top-p.",
        },
      ],
    },
  ],
};
