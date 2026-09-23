import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek05: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-05",
  number: 5,
  chapterId: "kap-02",
  title: "Gradient",
  learningGoals: [
    "Den Gradienten als Richtung des steilsten Anstiegs deuten",
    "Verlustflaechen lesen: Farbe, Hoehenlinien, Gradient",
    "Die Abstiegsrichtung als Gegenrichtung des Gradienten verstehen",
  ],
  requiresPreviousKnowledge: ["Ableitung (Lektion 4)", "Vektoren (Lektion 2)"],
  prerequisites: ["lek-04", "lek-02"],
  estimatedMinutes: 16,
  sections: [
    {
      id: "lek-05/s01",
      kind: "heading",
      title: "Steigung in alle Richtungen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Gradient" }],
    },
    {
      id: "lek-05/s02",
      kind: "paragraph",
      title: "Von einer Stelle zu einem Ort in der Ebene",
      visual: {
        type: "text",
        text: "Eine Verlustfunktion mit zwei Parametern ist eine Landschaft: jedem Paar aus Parameterwerten ist eine Hoehe, der Verlust, zugeordnet. Der Gradient ist ein Vektor aus den beiden partiellen Ableitungen. Er zeigt dorthin, wo es am steilsten bergauf geht.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Eine Verlustfunktion mit zwei Parametern ist eine Landschaft. Jedem Paar aus Parameterwerten ist eine Hoehe zugeordnet: der Verlust. Der Gradient ist ein Vektor aus den beiden partiellen Ableitungen. Er zeigt dorthin, wo es am steilsten bergauf geht.",
        },
      ],
    },
    {
      id: "lek-05/s03",
      kind: "equation",
      title: "Gradient und Abstiegsschritt",
      visual: {
        type: "equation",
        latex:
          "\\nabla L = \\left(\\frac{\\partial L}{\\partial w}, \\frac{\\partial L}{\\partial b}\\right), \\quad w \\leftarrow w - \\eta \\, \\nabla L",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "\\nabla L = \\left(\\frac{\\partial L}{\\partial w}, \\frac{\\partial L}{\\partial b}\\right), \\quad w \\leftarrow w - \\eta \\, \\nabla L",
          spoken:
            "Der Gradient ist das Paar aus der partiellen Ableitung nach w und der partiellen Ableitung nach b. Beim Abstieg zieht man ein Vielfaches des Gradienten ab. Dieses Vielfache heisst Lernrate.",
        },
      ],
    },
    {
      id: "lek-05/s04",
      kind: "experiment",
      title: "Den Punkt ueber die Verlustflaeche ziehen",
      visual: { type: "experiment", experimentId: "exp-gradient" },
      experimentId: "exp-gradient",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-gradient",
          spokenDescription:
            "Eine eingefärbte Verlustflaeche: dunkel bedeutet hoher Verlust. Ein Punkt laesst sich ueber die Flaeche ziehen. Ein Pfeil zeigt den Gradienten an dieser Stelle, also bergauf. Drei verschiedene Flaechen stehen zur Auswahl.",
        },
      ],
    },
    {
      id: "lek-05/s05",
      kind: "example",
      title: "Nachgerechnet",
      visual: {
        type: "list",
        items: [
          "L(w, b) = (w - 0,8)² + 1,6 (b + 0,6)²",
          "Punkt: w = -1,5, b = -1,2",
          "∂L/∂w = 2 (-1,5 - 0,8) = -4,6",
          "∂L/∂b = 3,2 (-1,2 + 0,6) = -1,92",
          "Ein Schritt mit Lernrate 0,05: w waechst um 0,23, b um 0,096",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Beispiel. Der Verlust ist w minus null Komma acht zum Quadrat, plus eins Komma sechs mal b plus null Komma sechs zum Quadrat. Am Punkt minus eins Komma fuenf und minus eins Komma zwei ist die partielle Ableitung nach w gleich minus vier Komma sechs. Beide Werte sind negativ, also geht es bergauf nach links unten. Der Abstiegsschritt zieht die Werte in die Gegenrichtung, also nach rechts oben, zum Minimum.",
        },
      ],
    },
    {
      id: "lek-05/s06",
      kind: "quiz",
      title: "Verstaendnisaufgabe",
      visual: {
        type: "quiz",
        question: "Warum geht der Abstieg in Richtung des negativen Gradienten?",
        options: [
          "Weil der Gradient die Richtung des steilsten Anstiegs ist",
          "Weil der Gradient immer ins Minimum zeigt",
          "Weil negative Zahlen kleiner sind",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Warum geht der Abstieg in Richtung des negativen Gradienten?",
          options: [
            "Weil der Gradient die Richtung des steilsten Anstiegs ist",
            "Weil der Gradient immer ins Minimum zeigt",
            "Weil negative Zahlen kleiner sind",
          ],
          answerIndex: 0,
          spoken:
            "Warum geht der Abstieg in Richtung des negativen Gradienten? Weil der Gradient die Richtung des steilsten Anstiegs ist, weil er immer ins Minimum zeigt, oder weil negative Zahlen kleiner sind?",
          explanation:
            "Der Gradient zeigt bergauf. Wer den Verlust verkleinern will, geht genau andersherum. Der Gradient zeigt nur bei einfachen Mulden ungefaehr zum Minimum - bei Satteln und Rinnen kann er daneben greifen.",
        },
      ],
    },
    {
      id: "lek-05/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Der Gradient sammelt die Steigungen in alle Parameterrichtungen. Er zeigt bergauf, sein Negatives bergab. Damit wird aus einer Verlustflaeche ein Verfahren: immer einen kleinen Schritt in die Gegenrichtung, bis es nicht mehr weiter bergab geht.",
        },
      ],
    },
  ],
};
