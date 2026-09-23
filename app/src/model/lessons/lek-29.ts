import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lek29: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-29",
  number: 29,
  chapterId: "kap-08",
  title: "Tokenisierung",
  learningGoals: [
    "Erklären, warum ein Modell Text zuerst in Tokens zerlegt",
    "Die eigene Zerlegungsregel auf einen Satz anwenden und die Anzahl der Tokens begründen",
    "Die Nummern der Tokens lesen und unbekannte Wörter in Stücke zerlegen",
  ],
  requiresPreviousKnowledge: [
    "Dass ein Modell nur mit Zahlen rechnet",
    "Dass Text eine Folge von Zeichen ist",
  ],
  prerequisites: ["lek-24"],
  estimatedMinutes: 13,
  sections: [
    {
      id: "lek-29/s01",
      kind: "heading",
      title: "Aus Text werden Tokens",
      visual: { type: "none" },
      spoken: [{ kind: "heading", text: "Tokenisierung" }],
    },
    {
      id: "lek-29/s02",
      kind: "paragraph",
      title: "Warum ein Modell keine Buchstaben sieht",
      visual: {
        type: "text",
        text: "Ein Modell rechnet nur mit Zahlen. Vor der ersten Rechnung wird der Text deshalb in Tokens zerlegt: Wörter, Wortteile oder Satzzeichen. Jedes Token hat eine Nummer im Wörterbuch, und mit dieser Nummer geht es weiter zum Embedding. Wörter, die nicht im Wörterbuch stehen, werden in Stücke zerlegt - so bleibt kein Zeichen ohne Nummer. Die Zerlegung ist eine Regel, keine Schätzung: derselbe Text ergibt immer dieselbe Tokenfolge. Das Wörterbuch ist hier klein und fest; ein echter Tokenizer lernt seine Stückliste aus sehr großen Textmengen und kommt damit auf Zehntausende Tokens.",
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Ein Modell rechnet nur mit Zahlen. Vor der ersten Rechnung wird der Text deshalb in Tokens zerlegt: in Wörter, Wortteile oder Satzzeichen. Jedes Token hat eine Nummer im Wörterbuch, und mit dieser Nummer geht es weiter zum Embedding. Wörter, die nicht im Wörterbuch stehen, werden in Stücke zerlegt, so bleibt kein Zeichen ohne Nummer. Die Zerlegung ist eine Regel und keine Schätzung: derselbe Text ergibt immer dieselbe Tokenfolge. Das Wörterbuch ist hier klein und fest; ein echter Tokenizer lernt seine Stückliste aus sehr großen Textmengen und kommt damit auf Zehntausende Tokens.",
        },
      ],
    },
    {
      id: "lek-29/s03",
      kind: "equation",
      title: "Text wird zur Tokenfolge mit Nummern",
      visual: {
        type: "equation",
        latex:
          "Zerlegung(s) = (t_1, t_2, t_3, t_4) \\quad \\longrightarrow \\quad (w_1, w_2, w_3, w_4)",
      },
      spoken: [
        {
          kind: "equation",
          latex:
            "Zerlegung(s) = (t_1, t_2, t_3, t_4) \\quad \\longrightarrow \\quad (w_1, w_2, w_3, w_4)",
          spoken:
            "Die Zerlegung des Textes s ergibt die Tokenfolge t eins, t zwei, t drei, t vier. Zu jedem Token gehört eine Nummer w eins bis w vier. Diese Nummern stammen aus dem Wörterbuch; erst damit wird aus Text eine Zahlenfolge, mit der ein Modell rechnen kann.",
        },
      ],
    },
    {
      id: "lek-29/s04",
      kind: "experiment",
      title: "Sätze zerlegen und Nummern lesen",
      visual: { type: "experiment", experimentId: "exp-tokenisierung" },
      experimentId: "exp-tokenisierung",
      spoken: [
        {
          kind: "experiment",
          experimentId: "exp-tokenisierung",
          spokenDescription:
            "Ein waagerechtes Balkendiagramm. Jeder Balken ist ein Token des gewählten Satzes; seine Länge ist die Anzahl der Zeichen, und hinter dem Token steht seine Nummer. Die Auswahl Beispielsatz stellt einen von vier Sätzen ein. Daneben stehen die Anzahl der Tokens, die Anzahl der Wörter, die Tokens je Wort und der Anteil der Tokens, der erst durch das Zerlegen unbekannter Wörter entsteht.",
        },
      ],
    },
    {
      id: "lek-29/s05",
      kind: "example",
      title: "Vier Sätze, vier Ergebnisse",
      visual: {
        type: "list",
        items: [
          "Der Hund jagt die Katze. → 6 Tokens: 1, 4, 6, 2, 5, 100",
          "Das Kind spielt im Garten und läuft. → 8 Tokens, alle aus dem Wörterbuch",
          "Ein Modell liest den Text und zerlegt ihn in Tokens. → 13 Tokens; „ihn“ wird zu i, h, n",
          "Heute scheint die Sonne, und das Kind lernt. → 13 Tokens; „lernt“ wird zu l, er, n, t",
          "Regel: ein bekanntes Wort kostet ein Token, jedes Stück eines unbekannten Wortes eines, jedes Satzzeichen eines.",
        ],
      },
      spoken: [
        {
          kind: "paragraph",
          text: "Vier Beispiele. Der Satz Der Hund jagt die Katze ergibt sechs Tokens, nämlich die Nummern eins, vier, sechs, zwei, fünf und hundert für den Punkt. Das Kind spielt im Garten und läuft ergibt acht Tokens, denn jedes Wort steht im Wörterbuch und nur der Punkt kommt dazu. Der dritte Satz ergibt dreizehn Tokens: das Wort ihn steht nicht im Wörterbuch und wird in drei Stücke zerlegt, nämlich den Buchstaben i, h und n. Der vierte Satz ergibt ebenfalls dreizehn Tokens, dort wird das Wort lernt in l, er, n und t zerlegt. Die Regel dahinter: ein bekanntes Wort kostet ein Token, jedes Stück eines unbekannten Wortes eines, und jedes Satzzeichen eines.",
        },
      ],
    },
    {
      id: "lek-29/s06",
      kind: "code",
      title: "Dieselbe Zerlegung in Python",
      visual: {
        type: "code",
        language: "python",
        code: "WOERTER = ['der', 'die', 'das', 'hund', 'katze', 'jagt', 'läuft', 'kind', 'spielt', 'im',\n           'garten', 'und', 'ein', 'ball', 'ist', 'groß', 'klein', 'heute', 'sonne',\n           'scheint', 'modell', 'text', 'liest', 'mit', 'dem', 'satz', 'zerlegt',\n           'tokens', 'einem', 'wort', 'besteht', 'den', 'in']\nSTUECKE = ['keit', 'heit', 'lich', 'ung', 'ver', 'un', 'be', 'ge',\n           'en', 'er', 'es', 'in', 'te', 'st']\nSATZZEICHEN = ['.', ',', '!', '?', ':', ';']\n\n\ndef stuecke(wort):                 # unbekanntes Wort: längstes passendes Stück zuerst\n    teile, i = [], 0\n    while i < len(wort):\n        treffer = ''\n        for k in STUECKE:\n            if wort.startswith(k, i) and len(k) > len(treffer):\n                treffer = k\n        teile.append(treffer or wort[i])\n        i += len(treffer or wort[i])\n    return teile\n\n\ndef zerlege(text):\n    token = []\n    for stueck in text.split():\n        wort = stueck.rstrip(''.join(SATZZEICHEN))\n        ende = stueck[len(wort):]\n        token.append(wort) if wort.lower() in WOERTER else token.extend(stuecke(wort))\n        token.extend(ende)\n    return token\n\n\nprint(zerlege('Der Hund jagt die Katze.'))                            # 6 Tokens\nprint(zerlege('Ein Modell liest den Text und zerlegt ihn in Tokens.')) # 13 Tokens",
      },
      spoken: [
        {
          kind: "code",
          language: "python",
          code: 'def stuecke(wort):\n    teile, i = [], 0\n    while i < len(wort):\n        treffer = ""\n        for k in STUECKE:\n            if wort.startswith(k, i) and len(k) > len(treffer):\n                treffer = k\n        teile.append(treffer or wort[i])\n        i += len(treffer or wort[i])\n    return teile\n\n\ndef zerlege(text):\n    token = []\n    for stueck in text.split():\n        wort = stueck.rstrip("".join(SATZZEICHEN))\n        ende = stueck[len(wort):]\n        token.append(wort) if wort.lower() in WOERTER else token.extend(stuecke(wort))\n        token.extend(ende)\n    return token',
          spoken:
            "Zwei kurze Funktionen. Die erste Funktion stuecke zerlegt ein unbekanntes Wort: sie geht von links nach rechts und nimmt an jeder Stelle das längste Stück aus der Liste. Findet sie keines, nimmt sie einen einzelnen Buchstaben. Die zweite Funktion zerlege trennt den Text an den Leerzeichen, schneidet die Satzzeichen am Wortende ab, sammelt sie als eigene Tokens und schlägt das Wort im Wörterbuch nach. Steht es dort nicht, kommen die Stücke einzeln dazu. Die beiden Ausgaben am Ende zählen sechs und dreizehn Tokens - genau wie im Experiment.",
        },
      ],
    },
    {
      id: "lek-29/s07",
      kind: "quiz",
      title: "Verständnisaufgabe",
      visual: {
        type: "quiz",
        question: "Wie viele Tokens hat der Satz „Der Hund jagt die Katze.“?",
        options: ["6 Tokens", "5 Tokens", "7 Tokens"],
      },
      spoken: [
        {
          kind: "quiz",
          question: "Wie viele Tokens hat der Satz Der Hund jagt die Katze?",
          options: ["sechs Tokens", "fünf Tokens", "sieben Tokens"],
          answerIndex: 0,
          spoken:
            "Wie viele Tokens hat der Satz Der Hund jagt die Katze? Sechs Tokens, fünf Tokens oder sieben Tokens? Richtig sind sechs Tokens.",
          explanation:
            "Der Satz hat fünf Wörter, dazu kommt der Punkt als eigenes Token. Das sind sechs Tokens mit den Nummern 1, 4, 6, 2, 5 und 100. Wer nur die Wörter zählt, vergisst das Satzzeichen.",
        },
      ],
    },
    {
      id: "lek-29/s08",
      kind: "summary",
      title: "Zusammengefasst",
      visual: { type: "none" },
      spoken: [
        {
          kind: "summary",
          text: "Tokenisierung zerlegt Text nach einer festen Regel in Tokens und gibt jedem Token eine Nummer aus dem Wörterbuch. Bekannte Wörter kosten ein Token, unbekannte werden in Stücke zerlegt, und Satzzeichen zählen mit. Erst diese Zahlenfolge kann ein Modell verarbeiten - bei Sprachmodellen folgt als Nächstes das Embedding.",
        },
      ],
    },
  ],
};
