import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek32: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-32",
  number: 32,
  chapterId: "kap-08",
  title: "Sampling",
  learningGoals: [
    "Temperatur, Top-k und Top-p als Schnitte an einer Verteilung unterscheiden",
    "Beschreiben, welche Tokens nach dem Schnitt noch zur Wahl stehen",
    "Die Umskalierung der behaltenen Wahrscheinlichkeiten nachvollziehen",
  ],
  requiresPreviousKnowledge: [
    "Softmax und die Temperatur als Schärferegler",
    "Die Verteilung des nächsten Tokens als Ausgabe eines Sprachmodells",
  ],
  prerequisites: ["lek-31"],
  estimatedMinutes: 15,
  sections: [
    {
      id: "lek-32/s01",
      kind: "heading",
      title: "Aus der Verteilung ein Token wählen",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Sampling" }],
    },
    {
      id: "lek-32/s02",
      kind: "paragraph",
      title: "Nicht immer das Wahrscheinlichste nehmen",
      visual: {
        type: "text",
        text: "Mit der Verteilung allein ist noch nicht entschieden, welches Token ausgegeben wird. Nimmt man immer das wahrscheinlichste, wiederholt sich das Modell und klingt steif. Zieht man dagegen blind nach der Verteilung, kommen zu oft sehr unwahrscheinliche Tokens zum Zug und der Text entgleist. Deshalb wird die Verteilung vor dem Ziehen beschnitten: Top-k lässt nur die k wahrscheinlichsten Tokens stehen, Top-p nur die kleinste Gruppe, die zusammen mindestens die Masse p trägt. Die kleinen Wahrscheinlichkeiten der behaltenen Tokens werden danach so angehoben, dass sie zusammen wieder eins ergeben.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Mit der Verteilung allein ist noch nicht entschieden, welches Token ausgegeben wird. Nimmt man immer das wahrscheinlichste, wiederholt sich das Modell und klingt steif. Zieht man blind nach der Verteilung, kommen zu oft sehr unwahrscheinliche Tokens zum Zug. Deshalb wird die Verteilung vor dem Ziehen beschnitten. Top-k lässt nur die k wahrscheinlichsten Tokens stehen. Top-p lässt nur die kleinste Gruppe stehen, die zusammen mindestens die Masse p trägt. Die kleinen Wahrscheinlichkeiten der behaltenen Tokens werden danach so angehoben, dass sie zusammen wieder eins ergeben.",
        },
      ],
    },
    {
      id: "lek-32/s03",
      kind: "equation",
      title: "Die Umskalierung",
      visual: {
        type: "equation",
        latex: "q_i = p_i / M \\quad mit \\quad M = \\sum_j p_j \\quad (j behalten)",
      },
      spoken: [
        {
          kind: "equation",
          latex: "q_i = p_i / M \\quad mit \\quad M = \\sum_j p_j \\quad (j behalten)",
          spoken:
            "q tief i ist gleich p tief i geteilt durch M. Dabei ist M die Summe der Wahrscheinlichkeiten aller behaltenen Tokens. Durch das Teilen wachsen die behaltenen Wahrscheinlichkeiten an, bis sie zusammen eins ergeben. Ein Token mit der Wahrscheinlichkeit null Komma fünf sieben wird bei Top-k gleich eins umskaliert auf eins: es bleibt als einziges übrig.",
        },
      ],
    },
    {
      id: "lek-32/s04",
      kind: "experiment",
      title: "Temperatur, Top-k und Top-p",
      visual: { type: "experiment", experimentId: "exp-sampling" },
      experimentId: "exp-sampling",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-sampling",
          spokenDescription:
            "Ein Säulendiagramm mit sechs Tokens für den nächsten Schritt und drei Regler: Temperatur, Top-k als Anzahl und Top-p als Massenanteil. Behaltene Tokens haben eine gefüllte, hervorgehobene Säule, abgeschnittene Tokens nur einen gestrichelten Umriss. Daneben stehen die Anzahl der behaltenen und der abgeschnittenen Tokens, die Wahrscheinlichkeitssumme der behaltenen Tokens vor der Umskalierung und die Summe nach der Umskalierung. Zieht man Top-k auf eins, bleibt nur noch ein Token übrig.",
        },
      ],
    },
    {
      id: "lek-32/s05",
      kind: "example",
      title: "Durchgerechnetes Beispiel",
      visual: {
        type: "list",
        items: [
          "Verteilung bei Temperatur 1: hund 0,5743 | katze 0,2113 | regen 0,1281 | sonne 0,0471 | baum 0,0286 | haus 0,0105",
          "Top-k 3, Top-p 0,90: behalten bleiben hund, katze und regen",
          "ihre Masse vor der Umskalierung: 0,5743 + 0,2113 + 0,1281 = 0,9137",
          "nach der Umskalierung: 0,6285 | 0,2312 | 0,1402, Summe 1,000000",
          "Top-k 1: es bleibt nur hund, Masse 0,5743, umskaliert 1,0000",
          "abgeschnitten sind dabei sonne, baum und haus mit zusammen 0,0863",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Im Beispiel stehen bei Temperatur eins sechs Tokens zur Wahl. Der Hund führt mit null Komma fünf sieben vier drei, dann folgen katze mit null Komma zwei eins eins drei und regen mit null Komma eins zwei acht eins. Mit Top-k gleich drei und Top-p gleich null Komma neun bleiben hund, katze und regen übrig. Zusammen tragen sie null Komma neun eins drei sieben. Nach der Umskalierung sind es null Komma sechs zwei acht fünf, null Komma zwei drei eins zwei und null Komma eins vier null zwei, zusammen eins. Bei Top-k gleich eins bleibt nur der Hund mit der umskalierten Wahrscheinlichkeit eins.",
        },
      ],
    },
    {
      id: "lek-32/s06",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Sie setzen Top-k auf eins. Was bedeutet das für die Ausgabe?",
        options: [
          "Es wird immer dasselbe Token gewählt, nämlich das wahrscheinlichste.",
          "Es wird gar kein Token mehr gewählt.",
          "Alle Tokens bleiben gleich wahrscheinlich.",
        ],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Sie setzen Top-k auf eins. Was bedeutet das für die Ausgabe?",
          options: [
            "Es wird immer dasselbe Token gewählt, nämlich das wahrscheinlichste.",
            "Es wird gar kein Token mehr gewählt.",
            "Alle Tokens bleiben gleich wahrscheinlich.",
          ],
          answerIndex: 0,
          spoken:
            "Sie setzen Top-k auf eins. Was bedeutet das für die Ausgabe? Antwort eins: es wird immer dasselbe Token gewählt, nämlich das wahrscheinlichste. Antwort zwei: es wird gar kein Token mehr gewählt. Antwort drei: alle Tokens bleiben gleich wahrscheinlich.",
          explanation:
            "Nach dem Schnitt ist nur noch ein Token übrig, und seine umskalierte Wahrscheinlichkeit ist eins. Das Ziehen liefert damit immer dieses Token - dasselbe Ergebnis wie bei der Temperatur nahe null. Nur ein Token zu behalten ist also der Gegensatz zum freien Ziehen aus der ganzen Verteilung.",
        },
      ],
    },
    {
      id: "lek-32/s07",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Temperatur formt die Verteilung, Top-k und Top-p schneiden sie ab. Behaltene Tokens werden auf die Summe eins umskaliert, abgeschnittene fallen ganz weg. So lässt sich zwischen vorhersehbarer und vielfältiger Ausgabe wählen. Im nächsten Schritt wird das Modell selbst trainiert: mit Kreuzentropie und einem Gradientenschritt auf den Logits.",
        },
      ],
    },
  ],
};
