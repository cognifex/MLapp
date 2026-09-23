import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek14: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-14",
  number: 14,
  chapterId: "kap-04",
  title: "Regularisierung",
  learningGoals: [
    "Erklären, warum große Gewichte ein Modell anfällig für Zufall in den Daten machen",
    "Die L2-Strafe als Zuschlag zum Verlust lesen",
    "Die Wirkung der Stärke λ auf Gewichte, Datenfehler und Strafe beschreiben",
  ],
  requiresPreviousKnowledge: [
    "Überanpassung: Trainings- und Testfehler (Lektion 13)",
    "Der Gradient als Abstiegsrichtung (Lektion 5)",
  ],
  prerequisites: ["lek-13", "lek-05"],
  estimatedMinutes: 14,
  sections: [
    {
      id: "lek-14/s01",
      kind: "heading",
      title: "Strafe gegen zu große Gewichte",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Regularisierung" }],
    },
    {
      id: "lek-14/s02",
      kind: "paragraph",
      title: "Warum ein Modell freiwillig kleiner werden soll",
      visual: {
        type: "text",
        text: "Ein Modell mit großen Gewichten reagiert heftig auf kleine Änderungen der Eingabe. Es kann sich damit an jede Schwankung der Trainingsdaten hängen, auch an den Zufall darin. Die Regularisierung setzt einen Zuschlag auf große Gewichte: Wer viel Gewicht braucht, zahlt mehr. Das Verfahren sucht dann eine Anpassung, die etwas schlechter zu den Trainingsdaten passt und dafür ruhiger reagiert.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Modell mit großen Gewichten reagiert heftig auf kleine Änderungen der Eingabe. Damit kann es sich an jede Schwankung der Trainingsdaten hängen, auch an den Zufall darin. Die Regularisierung setzt einen Zuschlag auf große Gewichte: Wer viel Gewicht braucht, zahlt mehr. Das Verfahren sucht dann eine Anpassung, die etwas schlechter zu den Trainingsdaten passt und dafür ruhiger reagiert.",
        },
      ],
    },
    {
      id: "lek-14/s03",
      kind: "equation",
      title: "Der Verlust mit Strafe",
      visual: {
        type: "equation",
        latex:
          "L = \\frac{1}{n}\\sum_{i=1}^{n}\\left(y_i - \\hat{y}_i\\right)^{2} + \\lambda \\sum_{k} w_k^{2}",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "L = \\frac{1}{n}\\sum_{i=1}^{n}\\left(y_i - \\hat{y}_i\\right)^{2} + \\lambda \\sum_{k} w_k^{2}",
          spoken:
            "Der Gesamtverlust ist der mittlere quadratische Fehler plus lambda mal die Summe der Gewichtsquadrate. Der erste Teil misst den Fehler auf den Daten, der zweite die Größe der Gewichte. Lambda ist die Stärke der Strafe: ist lambda null, gibt es keine Strafe, und das Verfahren sucht nur den kleinsten Fehler auf den Daten.",
        },
      ],
    },
    {
      id: "lek-14/s04",
      kind: "experiment",
      title: "Die Stärke der Strafe einstellen",
      visual: { type: "experiment", experimentId: "exp-regularisierung" },
      experimentId: "exp-regularisierung",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-regularisierung",
          spokenDescription:
            "Ein Säulendiagramm mit den beiden Gewichten und dem Bias eines linearen Modells, das zu sechs Datenpunkten passt. " +
            "Der Regler lambda stellt die Stärke der L2-Strafe ein. Mit wachsendem lambda werden die Säulen der Gewichte kleiner; " +
            "der gestrichelte Umriss zeigt weiter den Wert ohne Strafe. Daneben stehen Fehler auf den Daten, Strafe und Gesamtverlust. " +
            "Mit dem Schalter lässt sich der Bias von der Strafe ausnehmen.",
        },
      ],
    },
    {
      id: "lek-14/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Sechs Datenpunkte, zwei Eingaben, lineares Modell mit Bias",
          "λ = 0: w₁ = 2,0040, w₂ = 1,5596, MSE = 0,0420, Strafe = 0",
          "λ = 0,5: w₁ = 1,5667, w₂ = 1,2333, MSE = 0,5858, Strafe = 1,9878",
          "λ = 2: w₁ = 0,9474, w₂ = 0,7569, MSE = 3,2593, Strafe = 2,9411",
          "λ = 10: w₁ = 0,3050, w₂ = 0,2471, MSE = 8,4676, Strafe = 1,5409",
          "Der Bias bleibt bei 1,9167, weil beide Eingaben den Mittelwert null haben",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel mit sechs Datenpunkten. Ohne Strafe sind die Gewichte zwei Komma null null vier null und eins Komma fünf fünf neun sechs; der Fehler auf den Daten ist dann null Komma null vier zwei null. Mit lambda gleich zwei sinken die Gewichte auf null Komma neun vier sieben vier und null Komma sieben fünf sechs neun, der Fehler steigt auf drei Komma zwei fünf neun drei. Mit lambda gleich zehn bleiben von den Gewichten nur null Komma drei null fünf null und null Komma zwei vier sieben eins übrig, der Fehler wächst auf acht Komma vier sechs sieben sechs. Der Bias bleibt in allen Fällen eins Komma neun eins sechs sieben, weil beide Eingaben den Mittelwert null haben und die Strafe ihn deshalb nicht trifft.",
        },
      ],
    },
    {
      id: "lek-14/s06",
      kind: "code",
      title: "Ridge in Python",
      visual: {
        type: "code",
        language: "python",
        code:
          "import numpy as np\n\n" +
          "X = np.array([[-2.0, 0.0], [-1.0, 1.0], [0.0, -1.0], [1.0, 2.0], [2.0, 0.0], [0.0, -2.0]])\n" +
          "y = np.array([-2.3, 1.6, 0.2, 7.2, 5.7, -0.9])\n" +
          "A = np.hstack([np.ones((6, 1)), X])   # Bias als erste Spalte\n" +
          "\n" +
          "lam = 2.0\n" +
          "P = np.diag([0.0, 1.0, 1.0])          # der Bias wird nicht bestraft\n" +
          "w = np.linalg.solve(A.T @ A + len(y) * lam * P, A.T @ y)\n" +
          "print(w)                              # [1.9167 0.9474 0.7569]",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "w = np.linalg.solve(A.T @ A + len(y) * lam * P, A.T @ y)",
          spoken:
            "In Python löst man das Gleichungssystem direkt. Zu A transponiert mal A addiert man die Anzahl der Datenpunkte mal lambda mal P, die rechte Seite ist A transponiert mal y. Die Matrix P hat Nullen und Einsen auf der Diagonalen: mit einer Null an der ersten Stelle bleibt der Bias von der Strafe ausgenommen.",
        },
      ],
    },
    {
      id: "lek-14/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Was passiert mit den Gewichten, wenn λ wächst?",
        options: [
          "Sie werden kleiner und der Fehler auf den Daten steigt",
          "Sie werden größer und der Fehler auf den Daten sinkt",
          "Sie bleiben gleich, nur die Anzeige ändert sich",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Was passiert mit den Gewichten, wenn lambda wächst?",
          options: [
            "Sie werden kleiner und der Fehler auf den Daten steigt",
            "Sie werden größer und der Fehler auf den Daten sinkt",
            "Sie bleiben gleich, nur die Anzeige ändert sich",
          ],
          answerIndex: 0,
          spoken:
            "Was passiert mit den Gewichten, wenn lambda wächst? Werden sie kleiner und der Fehler auf den Daten steigt, werden sie größer und der Fehler sinkt, oder bleiben sie gleich und nur die Anzeige ändert sich?",
          explanation:
            "Die Strafe wächst mit den Gewichtsquadraten, deshalb weicht das Verfahren ihr mit kleineren Gewichten aus. Der Fehler auf den Daten steigt dabei - das ist der Preis für das ruhigere Modell. Im Experiment sinken die Gewichte von zwei Komma null null vier auf null Komma drei null fünf, während der Fehler von null Komma null vier zwei auf acht Komma vier sechs sieben sechs wächst.",
        },
      ],
    },
    {
      id: "lek-14/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Die Regularisierung addiert eine Strafe auf die Größe der Gewichte zum Verlust. Lambda stellt ein, wie schwer diese Strafe wiegt. Mehr Strafe bedeutet kleinere Gewichte und einen größeren Fehler auf den Daten - dieser Tausch hilft, wenn ein Modell sich vorher an den Zufall der Trainingsdaten gehängt hat.",
        },
      ],
    },
  ],
};
