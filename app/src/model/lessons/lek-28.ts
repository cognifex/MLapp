import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek28: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-28",
  number: 28,
  chapterId: "kap-07",
  title: "Transformer",
  learningGoals: [
    "Die vier Schritte eines Blockes benennen: Normierung, Aufmerksamkeit, Vorwärtsnetz, Restverbindung",
    "Für einen Vektor durchrechnen, wie sich die Komponenten in jedem Schritt ändern",
    "Die Norm des Vektors als Maß für die Länge der Information deuten",
  ],
  requiresPreviousKnowledge: [
    "Was eine Aufmerksamkeitsmatrix über Tokens aussagt",
    "Was Mittelwert und Streuung einer Zahlenreihe sind",
  ],
  prerequisites: ["lek-27"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-28/s01",
      kind: "heading",
      title: "Ein Block, vier Schritte",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Transformer" }],
    },
    {
      id: "lek-28/s02",
      kind: "paragraph",
      title: "Warum ein Block und nicht ein einziges Rechenwerk",
      visual: {
        type: "text",
        text: "Ein Transformer besteht aus vielen gleichen Blöcken hintereinander. Jeder Block hat vier Schritte: erst wird der Vektor normiert, dann schaut die Aufmerksamkeit auf die anderen Tokens, danach rechnet ein Vorwärtsnetz jedes Merkmal weiter, und zuletzt holt die Restverbindung die ursprüngliche Eingabe zurück. Weil jeder Schritt den Vektor nur umformt, lässt sich der ganze Weg Schritt für Schritt nachrechnen. Im Beispiel ist der Block vereinfacht: die Aufmerksamkeit greift auf einen festen Speicher aus drei Vektoren zu, die Normierung verschiebt mit beta größer null, und alle Gewichte des Vorwärtsnetzes sind nicht negativ - so bleiben alle Werte sichtbar. Ein echter Block lernt diese Gewichte aus Daten.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Transformer besteht aus vielen gleichen Blöcken hintereinander. Jeder Block hat vier Schritte. Erst wird der Vektor normiert, dann schaut die Aufmerksamkeit auf die anderen Tokens, danach rechnet ein Vorwärtsnetz jedes Merkmal weiter, und zuletzt holt die Restverbindung die ursprüngliche Eingabe zurück. Weil jeder Schritt den Vektor nur umformt, lässt sich der ganze Weg Schritt für Schritt nachrechnen. Im Beispiel ist der Block vereinfacht: die Aufmerksamkeit greift auf einen festen Speicher aus drei Vektoren zu, und alle Gewichte sind nicht negativ, damit alle Werte im Diagramm sichtbar bleiben. Ein echter Block lernt diese Gewichte aus Daten.",
        },
      ],
    },
    {
      id: "lek-28/s03",
      kind: "equation",
      title: "Die zwei Teile eines Blockes",
      visual: {
        type: "equation",
        latex:
          "h = \\frac{x - \\mu}{\\sigma} \\quad x_1 = x + Attention(h) \\quad x_2 = x_1 + Netz(h_1)",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "h = \\frac{x - \\mu}{\\sigma} \\quad x_1 = x + Attention(h) \\quad x_2 = x_1 + Netz(h_1)",
          spoken:
            "Der Block rechnet in zwei Teilen. Zuerst wird der Vektor normiert: h ist gleich x minus Mittelwert, geteilt durch die Streuung. Dann kommt die Aufmerksamkeit hinzu, und ihre Ausgabe wird auf die Eingabe addiert: x eins ist gleich x plus Attention von h. Im zweiten Teil passiert dasselbe mit dem Vorwärtsnetz: x zwei ist gleich x eins plus Vorwärtsnetz von h eins.",
        },
      ],
    },
    {
      id: "lek-28/s04",
      kind: "experiment",
      title: "Schritt für Schritt durch den Block",
      visual: { type: "experiment", experimentId: "exp-transformer" },
      experimentId: "exp-transformer",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-transformer",
          spokenDescription:
            "Ein Säulendiagramm mit vier Merkmalen. Die Auswahl Schritt stellt einen von vier Schritten ein: Normierung, Aufmerksamkeit, Vorwärtsnetz oder Restverbindung. Die gefüllten Säulen zeigen den Vektor nach dem Schritt, die gestrichelten Umrisse den Vektor davor. Daneben stehen die Norm des Vektors, die Norm vor dem Schritt und die Änderung der Norm.",
        },
      ],
    },
    {
      id: "lek-28/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Eingabe: (2,0000 | 0,5000 | 1,0000 | 3,0000), Norm 3,7749",
          "nach der Normierung: (2,5858 | 0,2425 | 1,0236 | 4,1481), Norm 5,0000",
          "Aufmerksamkeitsgewichte über den Speicher: 0,7847 / 0,0605 / 0,1548",
          "nach der Aufmerksamkeit: (0,8681 | 0,1699 | 0,2198 | 0,8527), Norm 1,2481",
          "nach dem Vorwärtsnetz: (0,6411 | 0,3618 | 0,6145 | 0,8820), Norm 1,3029",
          "nach der Restverbindung: (2,6411 | 0,8618 | 1,6145 | 3,8820), Norm 5,0393",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein durchgerechnetes Beispiel. Die Eingabe ist zwei, null Komma fünf, eins und drei; ihre Norm ist drei Komma sieben sieben fünf. Nach der Normierung steht dort zwei Komma fünf acht sechs, null Komma zwei vier zwei, eins Komma null zwei vier und vier Komma eins vier acht; die Norm ist auf fünf gestiegen. Die Aufmerksamkeit verteilt ihr Gewicht null Komma sieben acht fünf, null Komma null sechs und null Komma eins fünf fünf auf die drei Speichervektoren. Danach ist der Vektor kurz: seine Norm fällt auf eins Komma zwei vier acht. Das Vorwärtsnetz mischt die Merkmale und hebt die Norm leicht auf eins Komma drei null drei. Die Restverbindung addiert die Eingabe auf die Blockausgabe; die Norm ist danach fünf Komma null drei neun.",
        },
      ],
    },
    {
      id: "lek-28/s06",
      kind: "code",
      title: "Die Normierung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "import numpy as np\n\n\ndef normieren(x, gamma=1.5, beta=2.0):\n    return beta + gamma * (x - x.mean()) / np.sqrt(x.var() + 1e-5)\n\n\nx = np.array([2.0, 0.5, 1.0, 3.0])\nh = normieren(x)\nprint(h.round(4))                  # [2.5858 0.2425 1.0236 4.1481]\nprint(round(float(np.linalg.norm(h)), 4))   # 5.0",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: "def normieren(x, gamma=1.5, beta=2.0):\n    return beta + gamma * (x - x.mean()) / np.sqrt(x.var() + 1e-5)",
          spoken:
            "Die Normierung als kurze Funktion. Sie bekommt den Vektor x und zwei feste Werte: den Streckfaktor gamma gleich eins Komma fünf und die Verschiebung beta gleich zwei. Sie zieht den Mittelwert ab, teilt durch die Wurzel aus der Streuung plus einer sehr kleinen Zahl und streckt das Ergebnis. Die kleine Zahl im Nenner verhindert eine Division durch null. Für den Beispielvektor kommt zwei Komma fünf acht sechs, null Komma zwei vier zwei, eins Komma null zwei vier und vier Komma eins vier acht heraus; die Länge dieses Vektors ist fünf.",
        },
      ],
    },
    {
      id: "lek-28/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Wozu dient die Restverbindung, die die Eingabe auf die Blockausgabe addiert?",
        options: [
          "Die ursprüngliche Information bleibt erhalten und der Gradient fließt leichter zurück.",
          "Der Vektor wird dadurch bei jedem Block länger.",
          "Sie ersetzt die Normierung des nächsten Blockes.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Wozu dient die Restverbindung, die die Eingabe auf die Blockausgabe addiert?",
          options: [
            "Die ursprüngliche Information bleibt erhalten und der Gradient fließt leichter zurück.",
            "Der Vektor wird dadurch bei jedem Block länger.",
            "Sie ersetzt die Normierung des nächsten Blockes.",
          ],
          answerIndex: 0,
          spoken:
            "Wozu dient die Restverbindung, die die Eingabe auf die Blockausgabe addiert? Erstens: die ursprüngliche Information bleibt erhalten und der Gradient fließt leichter zurück. Zweitens: der Vektor wird dadurch bei jedem Block länger. Drittens: sie ersetzt die Normierung des nächsten Blockes. Richtig ist die erste Antwort.",
          explanation:
            "Im Beispiel steigt die Norm des Vektors durch die Restverbindung tatsächlich von drei Komma sieben sieben fünf auf fünf Komma null drei neun. Entscheidend ist aber, dass die Eingabe unverändert weitergegeben wird: der Block kann etwas hinzufügen, statt alles zu ersetzen. Dadurch kann der Fehler beim Training leichter durch viele Schichten zurückfließen.",
        },
      ],
    },
    {
      id: "lek-28/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Ein Transformator-Block normiert den Vektor, lässt ihn über die Aufmerksamkeit mit anderen Tokens reden, schickt ihn durch ein Vorwärtsnetz und addiert die Eingabe wieder dazu. Jeder Schritt lässt sich einzeln nachrechnen, denn die Zahlen entstehen alle aus denselben vier Rechnungen. Viele solche Blöcke hintereinander ergeben den Transformer.",
        },
      ],
    },
  ],
};
