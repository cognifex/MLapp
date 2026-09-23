import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek27: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-27",
  number: 27,
  chapterId: "kap-07",
  title: "Multi-Head Attention",
  learningGoals: [
    "Erklären, warum mehrere Köpfe dieselben Tokens unterschiedlich gewichten",
    "Die Gewichtsmatrix eines Kopfes als Farbfläche lesen",
    "Das größte Gewicht einer Zeile und die Entropie der Zeile als Maß für Schärfe deuten",
  ],
  requiresPreviousKnowledge: [
    "Wie aus Abfrage und Schlüssel eine Bewertung und daraus ein Gewicht wird",
    "Dass sich die Gewichte einer Abfragetoken zu eins summieren",
  ],
  prerequisites: ["lek-26"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-27/s01",
      kind: "heading",
      title: "Mehrere Köpfe, mehrere Blickwinkel",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Multi-Head Attention" }],
    },
    {
      id: "lek-27/s02",
      kind: "paragraph",
      title: "Warum ein einzelner Blickwinkel zu wenig ist",
      visual: {
        type: "text",
        text: "Ein einziger Satz von Projektionen kann nur eine Art von Beziehung betonen. Deshalb rechnet Attention mehrfach parallel: jeder Kopf (Head) hat eigene Projektionen für Abfrage, Schlüssel und Wert. Ein Kopf kann auf das Verb schauen, ein anderer auf das Subjekt, ein dritter breit über alle Tokens verteilen. Die Ergebnisse der Köpfe werden danach zusammengeführt. Die Projektionen der drei Köpfe sind hier fest gewählt und unterscheiden sich in ihrer Struktur, damit der Vergleich nachrechenbar bleibt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein einziger Satz von Projektionen kann nur eine Art von Beziehung betonen. Deshalb rechnet Attention mehrfach parallel. Jeder Kopf, englisch Head, hat eigene Projektionen für Abfrage, Schlüssel und Wert. Ein Kopf kann auf das Verb schauen, ein anderer auf das Subjekt, ein dritter breit über alle Tokens verteilen. Die Ergebnisse der Köpfe werden danach zusammengeführt, meist durch Aneinanderhängen und eine weitere Projektion. Die Projektionen der drei Köpfe sind hier fest gewählt und unterscheiden sich in ihrer Struktur, damit der Vergleich nachrechenbar bleibt.",
        },
      ],
    },
    {
      id: "lek-27/s03",
      kind: "equation",
      title: "Jeder Kopf rechnet für sich",
      visual: {
        type: "equation",
        latex: "A_k = Q_k\\,K_k^{T} / \\sqrt{d_k} \\quad k = 1, 2, 3",
      },
      spoken: [
        {
          kind: "equation",
          latex: "A_k = Q_k\\,K_k^{T} / \\sqrt{d_k} \\quad k = 1, 2, 3",
          spoken:
            "Für jeden Kopf k entstehen eigene Abfragen und Schlüssel. Die Bewertungen A k sind das Skalarprodukt von Abfrage und Schlüssel des Kopfes, geteilt durch die Wurzel der Merkmalszahl d k. Die Softmax dieser Bewertungen ergibt die Gewichte w k. Im Beispiel rechnen drei Köpfe über dieselben vier Tokens.",
        },
      ],
    },
    {
      id: "lek-27/s04",
      kind: "experiment",
      title: "Die Gewichtsmatrix eines Kopfes",
      visual: { type: "experiment", experimentId: "exp-multi-head" },
      experimentId: "exp-multi-head",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-multi-head",
          spokenDescription:
            "Eine Farbfläche aus vier mal vier Zellen. Die Zeilen sind die Abfragetokens Der, Hund, jagt und Katze, die Spalten sind dieselben Tokens als Schlüssel. Je größer das Gewicht, desto dunkler die Zelle; in jeder Zelle steht der Zahlenwert. Die Auswahl Kopf schaltet zwischen drei Köpfen mit eigenen Projektionen um, der Regler Zeile wählt die Abfragetoken. Die Zahlen nennen das größte Gewicht der Zeile, die Entropie der Zeile und ihre Summe.",
        },
      ],
    },
    {
      id: "lek-27/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Kopf 1, Abfrage Hund: Vektor (0,10 | 1,00 | 0,20)",
          "projizierte Abfrage: (0,20 | 2,00)",
          "projizierte Schlüssel: (0,60|0,20) (2,00|0,40) (0,40|2,00) (1,60|0,60)",
          "Bewertungen: 0,368 / 0,849 / 2,885 / 1,075",
          "Gewichte: 0,0587 / 0,0949 / 0,7274 / 0,1190 (Summe 1,0000)",
          "größtes Gewicht 0,7274 bei „jagt“, Entropie der Zeile 0,8748",
          "Kopf 3 verteilt breiter: größtes Gewicht 0,3364, Entropie 1,3529",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein durchgerechnetes Beispiel für Kopf eins. Die Abfrage ist das Token Hund mit dem Vektor null Komma eins, eins und null Komma zwei. Nach der Projektion bleibt davon null Komma zwei und zwei. Die projizierten Schlüssel sind null Komma sechs und null Komma zwei, zwei und null Komma vier, null Komma vier und zwei sowie eins Komma sechs und null Komma sechs. Die Bewertungen sind null Komma drei sechs acht, null Komma acht vier neun, zwei Komma acht acht fünf und eins Komma null sieben fünf. Daraus werden die Gewichte null Komma null fünf acht sieben, null Komma null neun vier neun, null Komma sieben zwei sieben vier und null Komma eins eins neun. Das größte Gewicht liegt mit null Komma sieben zwei sieben vier beim Token jagt; die Entropie dieser Zeile ist null Komma acht sieben vier acht. Kopf drei verteilt breiter: dort ist das größte Gewicht null Komma drei drei sechs vier und die Entropie eins Komma drei fünf zwei neun.",
        },
      ],
    },
    {
      id: "lek-27/s06",
      kind: "code",
      title: "Dieselbe Rechnung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\nX = np.array([[1.0, 0.3, 0.1], [0.1, 1.0, 0.2], [0.1, 0.2, 1.0], [0.1, 0.8, 0.3]])\n\n\ndef gewichte(W_Q, W_K):                 # Gewichtsmatrix eines Kopfes\n    q = X @ W_Q.T                       # Abfragen\n    k = X @ W_K.T                       # Schlüssel\n    s = (q @ k.T) / np.sqrt(2)          # Bewertungen\n    e = np.exp(s - s.max(axis=1, keepdims=True))\n    return e / e.sum(axis=1, keepdims=True)\n\n\nkopf1 = gewichte(np.array([[2.0, 0.0, 0.0], [0.0, 2.0, 0.0]]),\n                 np.array([[0.0, 2.0, 0.0], [0.0, 0.0, 2.0]]))\nprint(kopf1.round(3))\nprint(-(kopf1 * np.log(kopf1)).sum(axis=1).round(4))   # Entropie je Zeile",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "q = X @ W_Q.T\nk = X @ W_K.T\ns = (q @ k.T) / np.sqrt(2)\ne = np.exp(s - s.max(axis=1, keepdims=True))\nw = e / e.sum(axis=1, keepdims=True)",
          spoken:
            "Ein kurzes Programm mit NumPy. Die Funktion gewichte bekommt zwei Projektionen. Sie projiziert die Tokenmatrix zweimal, bildet alle Bewertungen als Matrixprodukt und teilt durch die Wurzel aus zwei. Für die Softmax wird in jeder Zeile das größte Element abgezogen - die Achse eins bedeutet: zeilenweise. Danach wird jede Zeile durch ihre eigene Summe geteilt. Die letzte Zeile des Programms rechnet die Entropie jeder Zeile aus: minus die Summe aus Gewicht mal natürlichem Logarithmus des Gewichts.",
        },
      ],
    },
    {
      id: "lek-27/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Zwei Köpfe liefern für dieselbe Zeile verschiedene Entropien. Was bedeutet dieser Unterschied?",
        options: [
          "Die beiden Köpfe gewichten die Tokens unterschiedlich stark.",
          "Einer der beiden Köpfe rechnet falsch, weil nur eine Entropie stimmen kann.",
          "Die Summe der Gewichte ist in einem der Köpfe nicht mehr eins.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Zwei Köpfe liefern für dieselbe Zeile verschiedene Entropien. Was bedeutet dieser Unterschied?",
          options: [
            "Die beiden Köpfe gewichten die Tokens unterschiedlich stark.",
            "Einer der beiden Köpfe rechnet falsch, weil nur eine Entropie stimmen kann.",
            "Die Summe der Gewichte ist in einem der Köpfe nicht mehr eins.",
          ],
          answerIndex: 0,
          spoken:
            "Zwei Köpfe liefern für dieselbe Zeile verschiedene Entropien. Was bedeutet dieser Unterschied? Erstens: die beiden Köpfe gewichten die Tokens unterschiedlich stark. Zweitens: einer der beiden Köpfe rechnet falsch, weil nur eine Entropie stimmen kann. Drittens: die Summe der Gewichte ist in einem der Köpfe nicht mehr eins. Die richtige Antwort ist die erste.",
          explanation:
            "Verschiedene Projektionen erzeugen verschiedene Bewertungen und damit verschiedene Gewichte. Die Entropie beschreibt nur, wie breit eine Zeile verteilt ist. Sie ist in beiden Köpfen erlaubt, denn jede Zeile summiert sich weiterhin zu eins.",
        },
      ],
    },
    {
      id: "lek-27/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Multi-Head Attention rechnet mehrere Kopfzeilen parallel, jeder mit eigenen Projektionen. Jeder Kopf erzeugt seine eigene Gewichtsmatrix über dieselben Tokens. Das größte Gewicht einer Zeile und ihre Entropie zeigen, wie scharf oder breit ein Kopf hinsieht. Zusammengeführt ergeben die Köpfe ein reicheres Bild als ein einzelner.",
        },
      ],
    },
  ],
};
