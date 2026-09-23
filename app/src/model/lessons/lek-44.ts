import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek44: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-44",
  number: 44,
  chapterId: "kap-11",
  title: "Gesamtsystem",
  learningGoals: [
    "Den Weg von Tokens über Aufmerksamkeit bis zur Token-Verteilung beschreiben",
    "Feste Gewichte und ihre Rolle im Modell lesen",
    "Die Temperatur als Regler zwischen Sicherheit und Entropie deuten",
  ],
  requiresPreviousKnowledge: [
    "Attention (Lektion 25)",
    "Softmax (Lektion 30)",
    "Tokenisierung (Lektion 29)",
  ],
  prerequisites: ["lek-28", "lek-32"],
  estimatedMinutes: 18,
  sections: [
    {
      id: "lek-44/s01",
      kind: "heading",
      title: "Alle Bausteine in einem Modell",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Gesamtsystem" }],
    },
    {
      id: "lek-44/s02",
      kind: "paragraph",
      title: "Von Tokens bis zur Wahrscheinlichkeit des nächsten Tokens",
      visual: {
        type: "text",
        text: "Der Weg läuft in festen Stationen: Text wird in Tokens zerlegt, jedes Token bekommt einen Vektor und einen Positionsanteil. Die Selbstaufmerksamkeit mischt die Vektoren der früheren Positionen dazu, eine Rest-Verbindung hält den eigenen Vektor, eine kleine Zwischenschicht verstärkt ihn. Aus dem Vektor der letzten Position entstehen je Token eine Punktzahl und über die Softmax eine Wahrscheinlichkeit. In diesem Experiment sind die Gewichte von Hand gesetzt und fest: es wird nicht trainiert, und es gibt keinen Zufall. Das wahrscheinlichste Token ist das gewählte.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Der Weg läuft in festen Stationen. Text wird in Tokens zerlegt. Jedes Token bekommt einen Vektor und einen Positionsanteil. Die Selbstaufmerksamkeit mischt die Vektoren der früheren Positionen dazu. Eine Rest-Verbindung hält den eigenen Vektor, eine kleine Zwischenschicht verstärkt ihn. Aus dem Vektor der letzten Position entstehen je Token eine Punktzahl und über die Softmax eine Wahrscheinlichkeit. In diesem Experiment sind die Gewichte von Hand gesetzt und fest: es wird nicht trainiert, und es gibt keinen Zufall. Das wahrscheinlichste Token gilt als gewähltes Token.",
        },
      ],
    },
    {
      id: "lek-44/s03",
      kind: "equation",
      title: "Softmax mit Temperatur und Entropie",
      visual: {
        type: "equation",
        latex:
          "p_j = \\exp(\\ell_j / T) / \\sum_i \\exp(\\ell_i / T), \\quad H = -\\sum_j p_j \\, \\log p_j",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "p_j = \\exp(\\ell_j / T) / \\sum_i \\exp(\\ell_i / T), \\quad H = -\\sum_j p_j \\, \\log p_j",
          spoken:
            "Die Wahrscheinlichkeit des Tokens j ist e hoch Punktzahl von j durch Temperatur T, geteilt durch die Summe von e hoch Punktzahl i durch Temperatur über alle Tokens i. Die Punktzahlen werden also vorher durch die Temperatur geteilt. Die Entropie H ist minus der Summe über alle Tokens von p mal Logarithmus von p. Sie ist ein Maß dafür, wie unsicher die Verteilung ist: bei einer Gleichverteilung über fünf Tokens beträgt sie rund eins Komma sechs null neun Nat.",
        },
      ],
    },
    {
      id: "lek-44/s04",
      kind: "experiment",
      title: "Kontext wählen und Temperatur ziehen",
      visual: { type: "experiment", experimentId: "exp-mini-transformer" },
      experimentId: "exp-mini-transformer",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-mini-transformer",
          spokenDescription:
            "Ein kleines Transformer-Modell mit festen Gewichten und fünf Tokens: der, kleine, Hund, läuft und ein Punkt. Ein Auswahlfeld bestimmt den Kontext, ein Regler die Temperatur. Waagerechte Säulen zeigen die Wahrscheinlichkeit jedes Tokens; hervorgehoben ist das wahrscheinlichste. Darunter stehen seine Wahrscheinlichkeit, die Entropie der Verteilung und das Gewicht, das die Aufmerksamkeit der letzten Position auf das vorherige Token legt.",
        },
      ],
    },
    {
      id: "lek-44/s05",
      kind: "example",
      title: "Nachgerechnet: der kleine Hund",
      visual: {
        type: "list",
        items: [
          "Kontext: der kleine Hund (drei Positionen)",
          "Punktzahlen: läuft 1,9775, Hund 0,4226, kleine 0,2879, der und . je 0",
          "Softmax bei Temperatur 1: läuft 0,598, Hund 0,126, kleine 0,110, der und . je 0,083",
          "Entropie: 1,2245 Nat",
          "Temperatur 0,2: läuft 0,9993, Entropie 0,0068",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Der Kontext ist der kleine Hund. Die Rechnung liefert für das nächste Token die Punktzahlen eins Komma neun sieben sieben fünf für läuft, null Komma vier zwei zwei sechs für Hund, null Komma zwei acht sieben neun für kleine und null für der und den Punkt. Bei Temperatur eins macht die Softmax daraus null Komma fünf neun acht für läuft, null Komma eins zwei sechs für Hund, null Komma eins eins null für kleine und je null Komma null acht drei für der und den Punkt. Die Entropie beträgt eins Komma zwei zwei vier fünf Nat. Mit Temperatur null Komma zwei wird die Verteilung spitz: läuft kommt auf null Komma neun neun neun drei, die Entropie fällt auf null Komma null null sechs acht.",
        },
      ],
    },
    {
      id: "lek-44/s06",
      kind: "code",
      title: "Der Block in Python",
      visual: {
        type: "code",
        language: "python",
        code: "scores = [q[-1] @ k[j] / math.sqrt(6) for j in range(len(k))]\na = softmax(scores)\nh = x[-1] + sum(a[j] * v[j] for j in range(len(v)))\nh = h + 0.2 * np.maximum(0, h)\np = softmax(W_OUT @ h / T)",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "scores = [q[-1] @ k[j] / math.sqrt(6) for j in range(len(k))]\na = softmax(scores)\nh = x[-1] + sum(a[j] * v[j] for j in range(len(v)))\nh = h + 0.2 * np.maximum(0, h)\np = softmax(W_OUT @ h / T)",
          spoken:
            "Fünf Zeilen für den ganzen Block. Zuerst werden die Bewertungen der Aufmerksamkeit gerechnet: die Abfrage der letzten Position mal jeder Schlüssel, geteilt durch die Wurzel aus der Achsenzahl. Daraus macht die Softmax die Gewichte. Der gemischte Vektor ist der eigene Vektor plus die gewichtete Summe aller Wertvektoren. Danach verstärkt die Zwischenschicht positive Einträge um den Faktor null Komma zwei. Zuletzt entstehen aus dem Vektor über die Ausgabematrix die Punktzahlen, geteilt durch die Temperatur, und daraus die Wahrscheinlichkeiten.",
        },
      ],
    },
    {
      id: "lek-44/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was macht eine Temperatur unter eins mit der Verteilung?",
        options: [
          "Sie wird spitzer: das gewählte Token wird wahrscheinlicher, die Entropie sinkt",
          "Sie wird flacher, weil die Punktzahlen kleiner werden",
          "Das Modell rechnet mit mehr Tokens als vorher",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was macht eine Temperatur unter eins mit der Verteilung?",
          options: [
            "Sie wird spitzer: das gewählte Token wird wahrscheinlicher, die Entropie sinkt",
            "Sie wird flacher, weil die Punktzahlen kleiner werden",
            "Das Modell rechnet mit mehr Tokens als vorher",
          ],
          answerIndex: 0,
          spoken:
            "Was macht eine Temperatur unter eins mit der Verteilung? Wird sie spitzer und die Entropie sinkt, wird sie flacher, weil die Punktzahlen kleiner werden, oder rechnet das Modell mit mehr Tokens?",
          explanation:
            "Beim Teilen durch eine Temperatur unter eins werden die Unterschiede zwischen den Punktzahlen größer. Das größte Feld gewinnt deutlicher, die Entropie sinkt. Die Zahl der Tokens bleibt gleich; nur ihre Verteilung ändert sich. Bei einer Temperatur über eins passiert das Gegenteil.",
        },
      ],
    },
    {
      id: "lek-44/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "In diesem Modell steckt der ganze Kurs: Tokens, Einbettungen, Position, Aufmerksamkeit, Rest-Verbindungen, eine Zwischenschicht, Punktzahlen und die Softmax mit Temperatur. Die Gewichte sind von Hand gesetzt, deshalb sagt das Modell nur den einen Beispielsatz fort. Trainiert würde es, indem dieselben Schritte mit vielen Sätzen wiederholt und die Gewichte über die Fehler angepasst werden - genau das haben Training, Loss und Gradient in diesem Kurs gezeigt.",
        },
      ],
    },
  ],
};
