import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek34: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-34",
  number: 34,
  chapterId: "kap-09",
  title: "Diffusion: Vorwärtsprozess",
  learningGoals: [
    "Beschreiben, wie der Vorwärtsprozess ein Bild Schritt für Schritt in Rauschen überführt",
    "Signalanteil und mittlere Abweichung als Maß für den Rauschgrad lesen",
    "Erklären, warum der Vorwärtsprozess fest vorgegeben ist und nichts gelernt werden muss",
  ],
  requiresPreviousKnowledge: [
    "Was ein Bild als Zahlenraster ist",
    "Mittelwert und Streuung einer Zahlenfolge",
  ],
  prerequisites: ["lek-33"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-34/s01",
      kind: "heading",
      title: "Wie aus einem Bild Rauschen wird",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Diffusion: der Vorwärtsprozess" }],
    },
    {
      id: "lek-34/s02",
      kind: "paragraph",
      title: "Zerstören ist einfach",
      visual: {
        type: "text",
        text: "Ein Bild ist ein Raster von Zahlen, hier Werte zwischen 0 (schwarz) und 1 (weiß). Diffusion erzeugt Bilder, indem sie den umgekehrten Weg geht: vom reinen Rauschen zum Bild. Damit dieser Weg überhaupt auffindbar ist, legt man zuerst den leichten Weg fest - das schrittweise Zerstören. Bei jedem Schritt wird ein wenig Rauschen hineingemischt, bis nur noch Rauschen übrig ist. Dieser Vorwärtsprozess ist fest vorgegeben; es wird nichts dafür gelernt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Bild ist ein Raster von Zahlen. Hier liegen die Werte zwischen null für schwarz und eins für weiß. Diffusion erzeugt Bilder, indem sie den umgekehrten Weg geht: vom reinen Rauschen zum Bild. Damit dieser Weg auffindbar ist, legt man zuerst den leichten Weg fest, nämlich das schrittweise Zerstören. Bei jedem Schritt wird ein wenig Rauschen hineingemischt, bis nur noch Rauschen übrig ist. Dieser Vorwärtsprozess ist fest vorgegeben; es wird nichts dafür gelernt.",
        },
      ],
    },
    {
      id: "lek-34/s03",
      kind: "equation",
      title: "Ein Rauschschritt",
      visual: {
        type: "equation",
        latex: "x_t = (1 - \\beta_t)\\, x_{t-1} + \\beta_t\\, m_t",
      },
      spoken: [
        {
          kind: "equation",
          latex: "x_t = (1 - \\beta_t)\\, x_{t-1} + \\beta_t\\, m_t",
          spoken:
            "x t ist gleich eins minus beta t mal x t minus eins, plus beta t mal m t. x t ist das Bild nach dem Schritt t, x t minus eins das Bild davor. beta t ist die Rauschstärke dieses Schrittes und m t ein Rauschwert aus dem festen Feld. Je größer beta t, desto stärker wandert der Bildpunkt zum Rauschwert.",
        },
      ],
    },
    {
      id: "lek-34/s04",
      kind: "experiment",
      title: "Bild schrittweise verrauschen",
      visual: { type: "experiment", experimentId: "exp-diffusion-vorwaerts" },
      experimentId: "exp-diffusion-vorwaerts",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-diffusion-vorwaerts",
          spokenDescription:
            "Ein Raster aus sechs mal sechs Bildpunkten, anfangs ein helles Muster aus Einsen. Mit dem Regler stellst du ein, wie viele Rauschschritte gerechnet werden, von null bis zehn. Die Zahlen nennen den Anteil des Originalsignals und die mittlere Abweichung vom Originalbild. Nach zehn Schritten ist fast nur noch Rauschen zu sehen.",
        },
      ],
    },
    {
      id: "lek-34/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Ein Bildpunkt mit dem Wert 1, Rauschwert des ersten Schrittes m = 0,0000057, beta = 0,05",
          "0,95 · 1 + 0,05 · 0,0000057 = 0,9500003",
          "Nach drei Schritten hat dieser Bildpunkt den Wert 0,9189",
          "Nach drei Schritten: Signalanteil 0,7268, mittlere Abweichung 0,1317",
          "Nach zehn Schritten: Signalanteil 0,0327, mittlere Abweichung 0,4704",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel. Ein Bildpunkt hat den Wert eins, die Rauschstärke des ersten Schrittes ist null Komma null fünf, der Rauschwert ist fast null. Dann rechnet der Schritt null Komma neun fünf mal eins plus null Komma null fünf mal null Komma null null null null null fünf sieben. Das ergibt null Komma neun fünf null null null null drei. Nach drei Schritten steht dort null Komma neun eins acht neun, der Signalanteil ist auf null Komma sieben zwei sechs acht gefallen und die mittlere Abweichung auf null Komma eins drei eins sieben. Nach zehn Schritten sind vom Signal noch null Komma null drei zwei sieben übrig, die mittlere Abweichung liegt bei null Komma vier sieben null vier.",
        },
      ],
    },
    {
      id: "lek-34/s06",
      kind: "code",
      title: "Dasselbe in Zahlen",
      visual: {
        type: "code",
        language: "python",
        code: "def vorwaerts(bild, betas, feld):\n    x = list(bild)\n    for t, beta in enumerate(betas, start=1):\n        for i in range(len(x)):\n            x[i] = (1 - beta) * x[i] + beta * feld[(t - 1) * len(x) + i]\n    return x",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def vorwaerts(bild, betas, feld):\n    x = list(bild)\n    for t, beta in enumerate(betas, start=1):\n        for i in range(len(x)):\n            x[i] = (1 - beta) * x[i] + beta * feld[(t - 1) * len(x) + i]\n    return x",
          spoken:
            "Eine kurze Funktion. Sie nimmt das Bild, die Liste der Rauschstärken und das feste Rauschfeld. Für jeden Schritt t mischt sie jeden Bildpunkt mit seinem Rauschwert: eins minus beta mal der alte Wert, plus beta mal der Rauschwert. Der Index in das Rauschfeld wächst mit dem Schritt, damit jeder Schritt seine eigenen Rauschwerte bekommt. Am Ende gibt sie das verrauschte Bild zurück.",
        },
      ],
    },
    {
      id: "lek-34/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert, wenn beta_t im Vorwärtsprozess größer wird?",
        options: [
          "Das Bild wandert stärker zum Rauschwert, das Originalsignal wird schneller verdeckt",
          "Das Bild bleibt unverändert, weil beta_t nur eine Anzeige ist",
          "Das Rauschen wird wieder entfernt und das Bild wird schärfer",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert, wenn beta t im Vorwärtsprozess größer wird?",
          options: [
            "Das Bild wandert stärker zum Rauschwert, das Originalsignal wird schneller verdeckt",
            "Das Bild bleibt unverändert, weil beta t nur eine Anzeige ist",
            "Das Rauschen wird wieder entfernt und das Bild wird schärfer",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert, wenn beta t im Vorwärtsprozess größer wird? Erstens: das Bild wandert stärker zum Rauschwert, das Originalsignal wird schneller verdeckt. Zweitens: das Bild bleibt unverändert, weil beta t nur eine Anzeige ist. Drittens: das Rauschen wird wieder entfernt und das Bild wird schärfer.",
          explanation:
            "beta t ist das Gewicht des Rauschwertes. Bei null Komma fünf zählt der alte Bildpunkt nur noch zur Hälfte, das Originalsignal verschwindet also schneller. Im Experiment sinkt der Signalanteil entsprechend schneller auf null Komma null drei zwei sieben nach zehn Schritten.",
        },
      ],
    },
    {
      id: "lek-34/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Vorwärtsprozess mischt in jedem Schritt ein wenig Rauschen in das Bild, mit einer fest vorgegebenen Rauschstärke. Nach zehn Schritten ist vom Originalsignal nur noch ein Anteil von null Komma null drei übrig. Weil dieser Weg festgelegt ist und keine Entscheidungen enthält, kann man ihn zum Lernen benutzen: die nächste Lektion dreht ihn um.",
        },
      ],
    },
  ],
};
