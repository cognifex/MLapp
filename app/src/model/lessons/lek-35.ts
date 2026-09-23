import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek35: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-35",
  number: 35,
  chapterId: "kap-09",
  title: "Diffusion: Rückwärtsprozess",
  learningGoals: [
    "Den Rückwärtsprozess als Folge von Denoising-Schritten beschreiben",
    "Den Fehler nach jedem Schritt messen und mit der Zahl der Schritte vergleichen",
    "Erklären, warum ein Restfehler der Schätzung als Boden stehen bleibt",
  ],
  requiresPreviousKnowledge: [
    "Der Vorwärtsprozess der Diffusion aus der vorigen Lektion",
    "Mittlere Abweichung zweier Zahlenraster",
  ],
  prerequisites: ["lek-34"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-35/s01",
      kind: "heading",
      title: "Zurück zum Bild",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Diffusion: der Rückwärtsprozess" }],
    },
    {
      id: "lek-35/s02",
      kind: "paragraph",
      title: "Der gelernte Teil der Diffusion",
      visual: {
        type: "text",
        text: "Der Vorwärtsprozess hat aus einem Bild ein Rauschbild gemacht. Der Rückwärtsprozess soll genau das rückgängig machen - und dieser Weg ist nicht vorgegeben, ihn muss das Modell lernen. In jedem Schritt schätzt das Modell, wie das unverrauschte Bild aussieht, und mischt den aktuellen Stand mit dieser Schätzung. Die Mischgewichte sind von stark verrauscht (0,5) bis fast sauber (0,05) gestaffelt: die frühen Schritte bewegen viel, die späten feilen nur noch.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Der Vorwärtsprozess hat aus einem Bild ein Rauschbild gemacht. Der Rückwärtsprozess soll das rückgängig machen, und dieser Weg ist nicht vorgegeben: ihn muss das Modell lernen. In jedem Schritt schätzt das Modell, wie das unverrauschte Bild aussieht, und mischt den aktuellen Stand mit dieser Schätzung. Die Mischgewichte sind von stark verrauscht bis fast sauber gestaffelt: die frühen Schritte bewegen viel, die späten feilen nur noch.",
        },
      ],
    },
    {
      id: "lek-35/s03",
      kind: "equation",
      title: "Ein Denoising-Schritt",
      visual: {
        type: "equation",
        latex: "x_{t-1} = (1 - \\beta_t)\\, x_t + \\beta_t\\, s_t",
      },
      spoken: [
        {
          kind: "equation",
          latex: "x_{t-1} = (1 - \\beta_t)\\, x_t + \\beta_t\\, s_t",
          spoken:
            "x t minus eins ist gleich eins minus beta t mal x t, plus beta t mal s t. x t ist der aktuelle, noch verrauschte Stand, s t die Schätzung des Modells für das unverrauschte Bild und beta t wieder die Rauschstärke des Schrittes, hier als Mischgewicht. Je kleiner beta t, desto weniger ändert der Schritt.",
        },
      ],
    },
    {
      id: "lek-35/s04",
      kind: "experiment",
      title: "Denoising Schritt für Schritt",
      visual: { type: "experiment", experimentId: "exp-diffusion-rueckwaerts" },
      experimentId: "exp-diffusion-rueckwaerts",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-diffusion-rueckwaerts",
          spokenDescription:
            "Dasselbe Raster aus sechs mal sechs Bildpunkten, jetzt voll verrauscht. Zwei Regler stellen die Zahl der Denoising-Schritte und den Restfehler der Modellschätzung ein. Die Zahlen nennen den Fehler vor dem ersten Schritt und nach jedem Schritt. Mit vielen Schritten nähert sich das Bild dem Muster, aber nicht beliebig genau: ein Restfehler der Schätzung bleibt stehen.",
        },
      ],
    },
    {
      id: "lek-35/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Startbild aus zehn Vorwärtsschritten: mittlere Abweichung 0,4704",
          "Ein Bildpunkt steht im Rauschbild auf 0,6628, die Schätzung des Modells lautet 0,8340",
          "0,5 · 0,6628 + 0,5 · 0,8340 = 0,7484",
          "Restfehler 0,2: Fehler nach Schritt 1: 0,2605, nach Schritt 3: 0,1194, nach Schritt 5: 0,0815",
          "Restfehler 0: nach zehn Schritten bleibt ein Fehler von 0,0154",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel. Das Startbild aus zehn Vorwärtsschritten weicht im Mittel null Komma vier sieben null vier vom Zielbild ab. Ein Bildpunkt steht dort auf null Komma sechs sechs zwei acht, das Modell schätzt null Komma acht drei vier null. Der erste Schritt rechnet null Komma fünf mal null Komma sechs sechs zwei acht plus null Komma fünf mal null Komma acht drei vier null und erhält null Komma sieben vier acht vier. Mit einem Restfehler von null Komma zwei liegt der Fehler nach dem ersten Schritt bei null Komma zwei sechs null fünf, nach dem dritten bei null Komma eins eins neun vier und nach dem fünften bei null Komma null acht eins fünf. Wäre die Schätzung fehlerfrei, bliebe nach zehn Schritten nur ein Fehler von null Komma null eins fünf vier.",
        },
      ],
    },
    {
      id: "lek-35/s06",
      kind: "code",
      title: "Dasselbe in Zahlen",
      visual: {
        type: "code",
        language: "python",
        code: "def rueckwaerts(rauschbild, betas, schaetzung):\n    x = list(rauschbild)\n    for t in range(len(betas), 0, -1):\n        beta = betas[t - 1]\n        x = [(1 - beta) * wert + beta * schaetzung(t, i)\n             for i, wert in enumerate(x)]\n    return x",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def rueckwaerts(rauschbild, betas, schaetzung):\n    x = list(rauschbild)\n    for t in range(len(betas), 0, -1):\n        beta = betas[t - 1]\n        x = [(1 - beta) * wert + beta * schaetzung(t, i)\n             for i, wert in enumerate(x)]\n    return x",
          spoken:
            "Eine kurze Funktion. Sie läuft von der höchsten Rauschstufe rückwärts bis zur ersten. In jedem Schritt holt sie die Schätzung des Modells für jeden Bildpunkt und mischt: eins minus beta mal der aktuelle Wert, plus beta mal die Schätzung. Weil beta ganz am Anfang groß ist und am Ende klein, sind die ersten Schritte die groben und die letzten die feinen.",
        },
      ],
    },
    {
      id: "lek-35/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Warum sinkt der Fehler, wenn mehr Denoising-Schritte gerechnet werden?",
        options: [
          "Weil die Schätzung des Modells mit jedem Schritt von selbst genauer wird",
          "Weil das Rauschen am Ende von allein verschwindet",
          "Weil jeder Schritt das Bild weiter in Richtung der Schätzung des unverrauschten Bildes zieht",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Warum sinkt der Fehler, wenn mehr Denoising-Schritte gerechnet werden?",
          options: [
            "Weil die Schätzung des Modells mit jedem Schritt von selbst genauer wird",
            "Weil das Rauschen am Ende von allein verschwindet",
            "Weil jeder Schritt das Bild weiter in Richtung der Schätzung des unverrauschten Bildes zieht",
          ],
          answerIndex: 2,
          spoken:
            "Warum sinkt der Fehler, wenn mehr Denoising-Schritte gerechnet werden? Erstens: weil die Schätzung des Modells mit jedem Schritt von selbst genauer wird. Zweitens: weil das Rauschen am Ende von allein verschwindet. Drittens: weil jeder Schritt das Bild weiter in Richtung der Schätzung des unverrauschten Bildes zieht.",
          explanation:
            "Der Restfehler der Schätzung ist im Experiment einstellbar und bleibt über alle Schritte gleich. Trotzdem sinkt der Abstand: nach Schritt eins null Komma zwei sechs null fünf, nach Schritt fünf null Komma null acht eins fünf. Der Boden bleibt aber stehen, denn mehr Schritte beheben einen systematischen Schätzfehler nicht.",
        },
      ],
    },
    {
      id: "lek-35/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Rückwärtsprozess dreht den Vorwärtsprozess um. Jeder Schritt mischt den aktuellen Stand mit der Schätzung des unverrauschten Bildes; das ist der Teil, den das Modell lernt. Mit mehr Schritten sinkt der Abstand zum Zielbild, aber nie ganz auf null, solange die Schätzung einen Restfehler hat. Die nächste Lektion zeigt, wie eine Bedingung diesen Weg in eine bestimmte Richtung lenkt.",
        },
      ],
    },
  ],
};
