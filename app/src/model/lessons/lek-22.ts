import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek22: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-22",
  number: 22,
  chapterId: "kap-06",
  title: "Autoencoder",
  learningGoals: [
    "Beschreiben, was eine enge Zwischenschicht von einem Bild behält",
    "Den Code eines Bildes als Zahlenreihe lesen, aus der das Bild wieder aufgebaut wird",
    "Den Rekonstruktionsfehler deuten und mit der Größe des Codes in Verbindung bringen",
  ],
  requiresPreviousKnowledge: [
    "Skalarprodukt zweier Vektoren",
    "Mittelwert und quadratischer Fehler",
  ],
  prerequisites: ["lek-21"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-22/s01",
      kind: "heading",
      title: "Ein Bild durch die Enge pressen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Autoencoder" }],
    },
    {
      id: "lek-22/s02",
      kind: "paragraph",
      title: "Wenige Zahlen statt vieler Bildpunkte",
      visual: {
        type: "text",
        text: "Ein Autoencoder ist ein Netz, das ein Bild zuerst auf wenige Zahlen zusammenzieht und daraus wieder ein Bild baut. Der erste Teil heißt Kodierer, die wenigen Zahlen bilden den Code, der zweite Teil heißt Dekodierer. Was nicht in die wenigen Zahlen passt, ist hinterher weg. Genau das ist beabsichtigt: Der Code soll das Wesentliche tragen, nicht jede Einzelheit.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Autoencoder ist ein Netz, das ein Bild zuerst auf wenige Zahlen zusammenzieht und daraus wieder ein Bild baut. Der erste Teil heißt Kodierer, die wenigen Zahlen bilden den Code, der zweite Teil heißt Dekodierer. Was nicht in die wenigen Zahlen passt, ist hinterher weg. Genau das ist beabsichtigt: Der Code soll das Wesentliche tragen, nicht jede Einzelheit.",
        },
      ],
    },
    {
      id: "lek-22/s03",
      kind: "equation",
      title: "Kodieren und rekonstruieren",
      visual: { type: "equation", latex: "c = W\\,x, \\quad x' = W^{T} c" },
      spoken: [
        {
          kind: "equation",
          latex: "c = W\\,x, \\quad x' = W^{T} c",
          spoken:
            "Der Code ist das Produkt aus der Kodierermatrix und dem Bild. Das rekonstruierte Bild ist das Produkt aus der transponierten Kodierermatrix und dem Code. Aus vielen Bildpunkten werden so wenige Zahlen und aus diesen wieder viele Bildpunkte.",
        },
      ],
    },
    {
      id: "lek-22/s04",
      kind: "experiment",
      title: "Die Engstelle einstellen",
      visual: { type: "experiment", experimentId: "exp-autoencoder" },
      experimentId: "exp-autoencoder",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-autoencoder",
          spokenDescription:
            "Ein kleines Bild aus vier mal vier Grauwerten in Form eines L. Mit dem Regler stellst du ein, wie viele Zahlen die Engstelle speichert. Eine Auswahl schaltet zwischen dem Eingabebild und dem wieder aufgebauten Bild um. Daneben stehen der mittlere Fehler und der größte Einzelfehler.",
        },
      ],
    },
    {
      id: "lek-22/s05",
      kind: "example",
      title: "Nachgerechnet an einem Bild",
      visual: {
        type: "list",
        items: [
          "Bild: 4 x 4 Werte, ein L (Summe aller 16 Werte: 7,3)",
          "Erstes Bildmuster ist das Mittelbild: 0,5 mal 7,3 = 1,825",
          "Zweites Muster (links gegen rechts): 0,525",
          "Drittes Muster (oben gegen unten): -0,525",
          "Viertes Muster (Schachbrett): 0,725",
          "Nach vier Zahlen: mittlerer Fehler 0,0914, größter Einzelfehler 0,625",
          "Nach allen 16 Zahlen: mittlerer Fehler 0",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Das Bild hat sechzehn Werte, ihre Summe ist sieben Komma drei. Das erste Muster ist das Mittelbild; sein Codewert ist ein Viertel der Summe, also eins Komma acht zwei fünf. Die nächsten drei Muster ergeben null Komma fünf zwei fünf, minus null Komma fünf zwei fünf und null Komma sieben zwei fünf. Mit diesen vier Zahlen liegt der mittlere Fehler bei null Komma null neun eins vier, der größte Einzelfehler bei null Komma sechs zwei fünf. Nimmt man alle sechzehn Zahlen, ist der Fehler null und das Bild kommt exakt zurück.",
        },
      ],
    },
    {
      id: "lek-22/s06",
      kind: "code",
      title: "In Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\nbild = np.array([\n    [0.9, 0.2, 0.0, 0.0],\n    [0.9, 0.2, 0.0, 0.0],\n    [0.9, 0.2, 0.2, 0.2],\n    [0.9, 0.9, 0.9, 0.9],\n])\n\n# Grundmuster einer Zeile, jedes von der Laenge eins\nh = 0.5 * np.array([\n    [1, 1, 1, 1],\n    [1, -1, 1, -1],\n    [1, 1, -1, -1],\n    [1, -1, -1, 1],\n])\n\n# Reihenfolge der Muster: erst grob, dann fein\nreihenfolge = [(0, 0), (0, 1), (1, 0), (0, 2), (1, 1), (2, 0), (0, 3), (1, 2),\n               (2, 1), (3, 0), (1, 3), (2, 2), (3, 1), (2, 3), (3, 2), (3, 3)]\nmuster = [np.outer(h[a], h[b]) for a, b in reihenfolge]\n\ncode = [np.sum(bild * m) for m in muster][:4]      # Engstelle: vier Zahlen\nrekonstruktion = sum(c * m for c, m in zip(code, muster))\nfehler = np.mean((bild - rekonstruktion) ** 2)     # 0,0914",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import numpy as np\n\nbild = np.array([\n    [0.9, 0.2, 0.0, 0.0],\n    [0.9, 0.2, 0.0, 0.0],\n    [0.9, 0.2, 0.2, 0.2],\n    [0.9, 0.9, 0.9, 0.9],\n])\n\n# Grundmuster einer Zeile, jedes von der Laenge eins\nh = 0.5 * np.array([\n    [1, 1, 1, 1],\n    [1, -1, 1, -1],\n    [1, 1, -1, -1],\n    [1, -1, -1, 1],\n])\n\n# Reihenfolge der Muster: erst grob, dann fein\nreihenfolge = [(0, 0), (0, 1), (1, 0), (0, 2), (1, 1), (2, 0), (0, 3), (1, 2),\n               (2, 1), (3, 0), (1, 3), (2, 2), (3, 1), (2, 3), (3, 2), (3, 3)]\nmuster = [np.outer(h[a], h[b]) for a, b in reihenfolge]\n\ncode = [np.sum(bild * m) for m in muster][:4]      # Engstelle: vier Zahlen\nrekonstruktion = sum(c * m for c, m in zip(code, muster))\nfehler = np.mean((bild - rekonstruktion) ** 2)     # 0,0914",
          spoken:
            "Derselbe Rechenweg in Python. Das Bild und die vier Grundmuster stehen als Zahlenfelder da. Aus je zwei Grundmustern entsteht ein Bildmuster; die Reihenfolge beginnt mit dem groben Mittelbild und endet beim feinen Schachbrett. Der Code sind die Skalarprodukte des Bildes mit den Mustern, hier die ersten vier. Das wiedergewonnene Bild ist die Summe der Muster, jedes mit seinem Codewert gewichtet. Der mittlere quadratische Fehler zwischen beiden liegt bei null Komma null neun eins vier.",
        },
      ],
    },
    {
      id: "lek-22/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Die Engstelle speichert nur eine einzige Zahl. Was zeigt die Rekonstruktion?",
        options: [
          "Ein gleichmäßig graues Bild mit dem Mittelwert aller Bildpunkte",
          "Das unveränderte Ausgangsbild",
          "Nur die hellen Bildpunkte des L",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Die Engstelle speichert nur eine einzige Zahl. Was zeigt die Rekonstruktion?",
          options: [
            "Ein gleichmäßig graues Bild mit dem Mittelwert aller Bildpunkte",
            "Das unveränderte Ausgangsbild",
            "Nur die hellen Bildpunkte des L",
          ],
          answerIndex: 0,
          spoken:
            "Die Engstelle speichert nur eine einzige Zahl. Was zeigt die Rekonstruktion? Ein gleichmäßig graues Bild mit dem Mittelwert aller Bildpunkte, das unveränderte Ausgangsbild oder nur die hellen Bildpunkte?",
          explanation:
            "Eine einzige Zahl kann nur eine Angabe tragen. Das erste Muster ist überall gleich groß, deshalb wird jeder Bildpunkt derselbe Wert: der Mittelwert null Komma vier fünf sechs zwei fünf. Die Form ist vollständig verloren.",
        },
      ],
    },
    {
      id: "lek-22/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Kodierer zieht das Bild auf wenige Zahlen zusammen, der Dekodierer baut es daraus wieder auf. Je enger die Stelle, desto mehr Information geht verloren und desto größer ist der Rekonstruktionsfehler. Der Code selbst ist die gelernte Beschreibung des Bildes - die Grundlage für alles, was mit Repräsentationen arbeitet.",
        },
      ],
    },
  ],
};
