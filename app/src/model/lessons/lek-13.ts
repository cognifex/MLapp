import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek13: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-13",
  number: 13,
  chapterId: "kap-04",
  title: "Overfitting",
  learningGoals: [
    "Trainings- und Testfehler als zwei verschiedene Messungen unterscheiden",
    "Sehen, dass zu viel Komplexität den Trainingsfehler senkt und den Testfehler hebt",
    "Den Grad mit dem geringsten Testfehler bestimmen",
  ],
  requiresPreviousKnowledge: ["Wahrscheinlichkeit und Schwelle (Lektion 12)"],
  prerequisites: ["lek-12"],
  estimatedMinutes: 17,
  sections: [
    {
      id: "lek-13/s01",
      kind: "heading",
      title: "Auswendig gelernt ist nicht verstanden",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Overfitting" }],
    },
    {
      id: "lek-13/s02",
      kind: "paragraph",
      title: "Zwei Messungen statt einer",
      visual: {
        type: "text",
        text: "Ein biegsames Modell kann seine Trainingspunkte fast genau treffen. Das ist kein Erfolg: es merkt sich dann auch die Störung jedes einzelnen Punktes statt der Funktion dahinter. Deshalb teilt man die Daten: aus einem Teil wird gelernt, am anderen wird gemessen. Der Fehler auf den eigenen Punkten heißt Trainingsfehler, der Fehler auf fremden Punkten Testfehler. Die Störung der Trainingspunkte ist in diesem Experiment ein festes Zahlenmuster statt echtem Zufall, damit die Anzeige reproduzierbar bleibt.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein biegsames Modell kann seine Trainingspunkte fast genau treffen. Das ist kein Erfolg: es merkt sich dann auch die Störung jedes einzelnen Punktes statt der Funktion dahinter. Deshalb teilt man die Daten: aus einem Teil wird gelernt, am anderen wird gemessen. Der Fehler auf den eigenen Punkten heißt Trainingsfehler, der Fehler auf fremden Punkten Testfehler. Die Störung der Trainingspunkte ist hier ein festes Zahlenmuster statt echtem Zufall, damit die Anzeige reproduzierbar bleibt.",
        },
      ],
    },
    {
      id: "lek-13/s03",
      kind: "equation",
      title: "Der mittlere quadratische Fehler",
      visual: { type: "equation", latex: "L = \\frac{1}{n} \\sum (y - f(x))^{2}" },
      spoken: [
        {
          kind: "equation",
          latex: "L = \\frac{1}{n} \\sum (y - f(x))^{2}",
          spoken:
            "Der Fehler ist der Mittelwert der quadrierten Abweichungen: eins durch n mal die Summe über alle Punkte von y minus f von x zum Quadrat. Quadriert wird, damit Abweichungen nach oben und nach unten nicht gegeneinander aufrechnen. Derselbe Fehler wird zweimal gerechnet, einmal auf den Trainingspunkten und einmal auf den Testpunkten.",
        },
      ],
    },
    {
      id: "lek-13/s04",
      kind: "experiment",
      title: "Polynomgrad und beide Fehler",
      visual: { type: "experiment", experimentId: "exp-overfitting" },
      experimentId: "exp-overfitting",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-overfitting",
          spokenDescription:
            "Ein Koordinatensystem mit roten Trainingspunkten und grünen Testpunkten entlang einer Sinuskurve. Die durchgezogene Kurve ist das angepasste Polynom, die gestrichelte die wahre Funktion. Der Regler Polynomgrad bestimmt, wie biegsam die Kurve ist, der Regler Streuung wie stark die Trainingspunkte abweichen. Angezeigt werden Trainingsfehler, Testfehler und der Grad mit dem geringsten Testfehler.",
        },
      ],
    },
    {
      id: "lek-13/s05",
      kind: "example",
      title: "Nachgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Elf Trainingspunkte zwischen x = -2,5 und 2,5 aus y = sin(x) mit fester Störung",
          "Einundzwanzig Testpunkte auf derselben Strecke ohne Störung",
          "Grad 1: Trainingsfehler 0,2023, Testfehler 0,1010",
          "Grad 3: Trainingsfehler 0,0652, Testfehler 0,0064 - der geringste Testfehler der Reihe",
          "Grad 9: Trainingsfehler 0,0094, Testfehler 0,3596",
          "Von Grad 3 auf Grad 9 sinkt der Trainingsfehler auf ein Siebtel, der Testfehler steigt auf das Sechsundfünfzigfache",
          "Ohne Störung passt auch Grad 9 sehr genau: Testfehler unter einem Billionstel",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Elf Trainingspunkte stammen aus dem Sinus, der Test aus der reinen Funktion. Bei Polynomgrad eins beträgt der Trainingsfehler null Komma zwei null zwei drei und der Testfehler null Komma eins null eins. Bei Grad drei sinken beide deutlich: null Komma null sechs fünf zwei im Training und null Komma null null sechs vier im Test, der geringste Wert der ganzen Reihe. Bei Grad neun schließlich sinkt der Trainingsfehler auf null Komma null null neun vier, während der Testfehler auf null Komma drei fünf neun sechs steigt. Der Trainingsfehler fällt also weiter, der Testfehler wird sechsundfünfzig mal so groß wie sein geringster Wert. Ohne Störung dagegen passt auch Grad neun sehr genau.",
        },
      ],
    },
    {
      id: "lek-13/s06",
      kind: "code",
      title: "Dieselbe Anpassung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\nx = np.linspace(-2.5, 2.5, 11)\nstoerung = np.array([0.55, 0.2, -0.6, 0.45, 0.1, -0.5, 0.6, -0.15, 0.35, -0.55, 0.4])\ny = np.sin(x) + 0.6 * stoerung\nkoeffizienten = np.polyfit(x, y, 9)",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "import numpy as np\n\nx = np.linspace(-2.5, 2.5, 11)\nstoerung = np.array([0.55, 0.2, -0.6, 0.45, 0.1, -0.5, 0.6, -0.15, 0.35, -0.55, 0.4])\ny = np.sin(x) + 0.6 * stoerung\nkoeffizienten = np.polyfit(x, y, 9)",
          spoken:
            "Das Stück legt elf Stellen zwischen minus zwei Komma fünf und zwei Komma fünf an, addiert das feste Störungsmuster zum Sinus und passt ein Polynom neunten Grades an. Mit elf Punkten und zehn Koeffizienten bleibt dem Modell kaum Freiheit: die Kurve trifft die Punkte fast genau und biegt zwischen ihnen aus.",
        },
      ],
    },
    {
      id: "lek-13/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Woran erkennt man Overfitting?",
        options: [
          "Der Trainingsfehler ist sehr klein, der Testfehler deutlich größer",
          "Beide Fehler sind gleich groß und groß",
          "Der Trainingsfehler wächst mit jedem Schritt",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Woran erkennt man Overfitting?",
          options: [
            "Der Trainingsfehler ist sehr klein, der Testfehler deutlich größer",
            "Beide Fehler sind gleich groß und groß",
            "Der Trainingsfehler wächst mit jedem Schritt",
          ],
          answerIndex: 0,
          spoken:
            "Woran erkennt man Overfitting? Daran, dass der Trainingsfehler sehr klein und der Testfehler deutlich größer ist, daran, dass beide Fehler gleich groß sind, oder daran, dass der Trainingsfehler mit jedem Schritt wächst?",
          explanation:
            "Beim Auswendiglernen sinkt der Fehler auf den Trainingspunkten immer weiter, während er auf fremden Punkten steigt. In diesem Beispiel liegen beide Werte bei Grad neun weit auseinander: null Komma null null neun vier im Training gegen null Komma drei fünf neun sechs im Test. Der geringste Testfehler der Reihe liegt bei Grad drei.",
        },
      ],
    },
    {
      id: "lek-13/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Modell muss auf fremden Daten bestehen, nicht auf seinen Trainingspunkten. Deshalb werden Trainings- und Testfehler getrennt gemessen: Ein zu einfaches Modell lässt beide groß, ein zu biegsames senkt den Trainingsfehler und hebt den Testfehler. Den geringsten Testfehler liefert in diesem Beispiel der Grad drei. Die nächste Lektion zeigt, wie man ein zu biegsames Modell wieder zähmt.",
        },
      ],
    },
  ],
};
