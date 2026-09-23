import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek41: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-41",
  number: 41,
  chapterId: "kap-10",
  title: "Policy Gradient",
  learningGoals: [
    "Eine Episode als Folge von Zuständen, Aktionen und Returns lesen",
    "Das Policy-Update als Anheben der gewählten Aktion berechnen",
    "Lernrate und Diskontfaktor als Stärke des Updates deuten",
  ],
  requiresPreviousKnowledge: [
    "Politik als Wahrscheinlichkeitsverteilung (Lektion 40)",
    "Gradient und Lernrate (Lektion 5)",
    "Abdiskontierte Returns (Lektion 38)",
  ],
  prerequisites: ["lek-40"],
  estimatedMinutes: 17,
  sections: [
    {
      id: "lek-41/s01",
      kind: "heading",
      title: "Die Politik direkt verbessern",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Policy Gradient" }],
    },
    {
      id: "lek-41/s02",
      kind: "paragraph",
      title: "Ohne Umweg über die Q-Werte",
      visual: {
        type: "text",
        text: "In der letzten Lektion entstand die Politik aus den Q-Werten - die Q-Werte waren der Umweg. Jetzt hat die Politik eigene Zahlen, die Logits, und wird selbst verbessert. Aus den Logits entstehen mit der Softmax-Funktion die Wahrscheinlichkeiten der vier Richtungen. Ist eine Episode gelaufen, steht fest, welche Aktionen gegangen wurden und welche Returns sie gebracht haben. Jeder besuchte Zustand wird danach nachgezogen: die gegangene Aktion bekommt einen Zuschlag, die anderen einen kleinen Abschlag, und wie groß der Zuschlag ausfällt, hängt am Return.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "In der letzten Lektion entstand die Politik aus den Q-Werten. Die Q-Werte waren der Umweg. Jetzt hat die Politik eigene Zahlen, die Logits, und wird selbst verbessert. Aus den Logits entstehen mit der Softmax-Funktion die Wahrscheinlichkeiten der vier Richtungen. Ist eine Episode gelaufen, steht fest, welche Aktionen gegangen wurden und welche Returns sie gebracht haben. Jeder besuchte Zustand wird danach nachgezogen: die gegangene Aktion bekommt einen Zuschlag, die anderen einen kleinen Abschlag. Wie groß der Zuschlag ausfällt, hängt am Return des Schrittes.",
        },
      ],
    },
    {
      id: "lek-41/s03",
      kind: "equation",
      title: "Das Update",
      visual: {
        type: "equation",
        latex:
          "\\theta_a \\leftarrow \\theta_a + \\alpha \\, G_t \\, (1 - p_a), \\quad \\theta_b \\leftarrow \\theta_b - \\alpha \\, G_t \\, p_b",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "\\theta_a \\leftarrow \\theta_a + \\alpha \\, G_t \\, (1 - p_a), \\quad \\theta_b \\leftarrow \\theta_b - \\alpha \\, G_t \\, p_b",
          spoken:
            "Theta von a wird ersetzt durch Theta von a plus die Lernrate mal dem Return des Schrittes mal eins minus der Wahrscheinlichkeit dieser Aktion. Für jede andere Aktion b wird Theta von b ersetzt durch Theta von b minus die Lernrate mal dem Return mal der Wahrscheinlichkeit dieser anderen Aktion. Der Faktor eins minus p für die gewählte Aktion und minus p für alle anderen sorgt dafür, dass die Summe der vier Wahrscheinlichkeiten eins bleibt: was eine Aktion dazubekommt, geben die anderen ab.",
        },
      ],
    },
    {
      id: "lek-41/s04",
      kind: "experiment",
      title: "Das Update nachvollziehen",
      visual: { type: "experiment", experimentId: "exp-policy-gradient" },
      experimentId: "exp-policy-gradient",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-policy-gradient",
          spokenDescription:
            "Vier Säulen für die vier Richtungen oben, rechts, unten und links. Die gefüllte Säule ist die Wahrscheinlichkeit nach dem Update, der gestrichelte Umriss zeigt den Stand davor. Ein Regler stellt die Lernrate ein, ein zweiter den Diskontfaktor, eine Auswahl bestimmt den Schritt der festen Episode. Die hervorgehobene Säule ist die Aktion, die in diesem Schritt gegangen wurde. Darunter stehen der Return des Schrittes, die Wahrscheinlichkeit vorher, die Wahrscheinlichkeit nachher und ihre Änderung.",
        },
      ],
    },
    {
      id: "lek-41/s05",
      kind: "example",
      title: "Nachgerechnet: der erste Schritt",
      visual: {
        type: "list",
        items: [
          "Feste Episode: Start Zeile 2, Spalte 1; Züge rechts, oben, oben; Ziel Zeile 0, Spalte 2",
          "Returns: G(3) = -0,04 + 0,9 · 1 = 0,86; G(2) = -0,04 + 0,9 · 0,86 = 0,734; G(1) = -0,04 + 0,9 · 0,734 = 0,6206",
          "Politik vorher, in jedem Zustand dieselben Logits: oben 0,3158 | rechts 0,2340 | unten 0,1916 | links 0,2586",
          "Erster Schritt, Aktion rechts: Theta(rechts) wächst um 0,5 · 0,6206 · (1 - 0,2340) = 0,2377",
          "Nach dem Update: rechts 0,2961 statt 0,2340; die Änderung ist 0,0621",
          "Die anderen drei Richtungen geben ein wenig ab: zusammen bleibt die Summe eins",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein nachgerechnetes Beispiel mit Lernrate null Komma fünf und Diskontfaktor null Komma neun. Die Episode startet in Zeile zwei, Spalte eins und geht mit rechts, oben, oben in drei Schritten ins Ziel. Der Return des dritten Schrittes ist minus null Komma null vier plus null Komma neun mal eins, also null Komma acht sechs. Der zweite Schritt hat den Return minus null Komma null vier plus null Komma neun mal null Komma acht sechs, also null Komma sieben drei vier, und der erste null Komma sechs zwei null sechs. Vor dem Update hat jede Richtung dieselben Logits, und daraus werden die Wahrscheinlichkeiten null Komma drei eins fünf acht, null Komma zwei drei vier null, null Komma eins neun eins sechs und null Komma zwei fünf acht sechs. Im ersten Schritt wurde rechts gegangen; der Logit dieser Aktion wächst um null Komma fünf mal null Komma sechs zwei null sechs mal eins minus null Komma zwei drei vier null, also um null Komma zwei drei sieben sieben. Nach dem Update hat rechts die Wahrscheinlichkeit null Komma zwei neun sechs eins statt null Komma zwei drei vier null; die Änderung beträgt null Komma null sechs zwei eins.",
        },
      ],
    },
    {
      id: "lek-41/s06",
      kind: "code",
      title: "Das Update in Python",
      visual: {
        type: "code",
        language: "python",
        code: "theta = [0.3, 0.0, -0.2, 0.1]\np = [0.3158, 0.2340, 0.1916, 0.2586]\naktion, return_g, alpha = 1, 0.6206, 0.5\n\nfor i in range(len(theta)):\n    faktor = (1 - p[i]) if i == aktion else -p[i]\n    theta[i] += alpha * return_g * faktor\n\nprint(theta)   # [0.20199, 0.23769, -0.25945, 0.01976]",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "theta = [0.3, 0.0, -0.2, 0.1]\np = [0.3158, 0.2340, 0.1916, 0.2586]\naktion, return_g, alpha = 1, 0.6206, 0.5\n\nfor i in range(len(theta)):\n    faktor = (1 - p[i]) if i == aktion else -p[i]\n    theta[i] += alpha * return_g * faktor",
          spoken:
            "Die Schleife geht die vier Aktionen durch. Für die gewählte Aktion ist der Faktor eins minus ihrer Wahrscheinlichkeit, für alle anderen ist es minus ihrer Wahrscheinlichkeit. Dann wächst der Logit dieser Aktion um die Lernrate mal den Return mal diesen Faktor. Weil sich die vier Faktoren zu null addieren, bleibt die Summe der Wahrscheinlichkeiten erhalten: was eine Aktion dazubekommt, geben die anderen ab. Im Rechenbeispiel wächst der Logit der Aktion rechts von null auf null Komma zwei drei sieben sieben.",
        },
      ],
    },
    {
      id: "lek-41/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question:
          "Warum wächst die Wahrscheinlichkeit im dritten Schritt der Episode stärker als im ersten?",
        options: [
          "Weil der Return des dritten Schrittes größer ist und als Gewicht im Update steht",
          "Weil die Lernrate im Laufe der Episode anwächst",
          "Weil die Temperatur mit jedem Schritt kleiner wird",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question:
            "Warum wächst die Wahrscheinlichkeit im dritten Schritt der Episode stärker als im ersten?",
          options: [
            "weil der Return des dritten Schrittes größer ist und als Gewicht im Update steht",
            "weil die Lernrate im Laufe der Episode anwächst",
            "weil die Temperatur mit jedem Schritt kleiner wird",
          ],
          answerIndex: 0,
          spoken:
            "Warum wächst die Wahrscheinlichkeit im dritten Schritt der Episode stärker als im ersten? Weil der Return des dritten Schrittes größer ist und als Gewicht im Update steht? Weil die Lernrate im Laufe der Episode anwächst? Oder weil die Temperatur mit jedem Schritt kleiner wird?",
          explanation:
            "Im Update stehen die Lernrate und der Return als Faktoren nebeneinander. Der Return des ersten Schrittes ist null Komma sechs zwei null sechs, der des dritten null Komma acht sechs; Lernrate und Temperatur bleiben dabei unverändert. Deshalb wächst die Wahrscheinlichkeit im dritten Schritt um null Komma null neun null vier und im ersten nur um null Komma null sechs zwei eins.",
        },
      ],
    },
    {
      id: "lek-41/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Policy Gradient verbessert die Politik ohne Umweg über die Q-Werte. Nach einer Episode bekommt jede gegangene Aktion einen Zuschlag, der an ihrem Return hängt; die Lernrate bestimmt die Größe des Schrittes, der Diskontfaktor die Gewichte der Returns. So wächst die Wahrscheinlichkeit guter Entscheidungen Schritt für Schritt. In der nächsten Lektion treffen Politik und Wertschätzung aufeinander: der Actor-Critic.",
        },
      ],
    },
  ],
};
