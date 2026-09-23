# Eine Lektion bauen – Anleitung

Diese Anleitung ist die verbindliche Vorlage fuer neue Lektionen. Sie ist so geschrieben, dass
sie ohne weiteres Vorwissen befolgt werden kann. Musterbeispiele im Repo: `lek-01.ts` (Lektion)
und `exp-funktionen.ts` (Experiment), `tests/mathematik.test.ts` (Referenzwerte).

## Was eine Lektion ausmacht

Eine Lektion verbindet **Erklaerung, bedienbares Experiment und Sprechfassung**. Alles drei
liegt in derselben Datei, damit es nicht auseinanderlaeuft. Eine Lektion ohne Experiment ist
keine Lektion dieses Kurses; ein Experiment ohne Sprechbeschreibung auch nicht.

Aufbau (7 bis 9 Abschnitte, diese Reihenfolge):

    s01 heading      Ueberschrift der Lektion
    s02 paragraph    Worum es geht, ohne Fachjargon am Anfang
    s03 equation     Die Formalie, mit ausgeschriebenem Sprechtext
    s04 experiment   Das bedienbare Experiment
    s05 example      Ein durchgerechnetes Beispiel (visual: list)
    s06 code         (optional) ein kurzes Stueck Python, das das Verfahren zeigt
    s07 quiz         Verstaendnisaufgabe mit Begruendung
    s08 summary      Zusammenfassung in zwei bis drei Saetzen

## Dateien und IDs

    app/src/model/lessons/lek-NN.ts     die Lektion            (id: "lek-NN", Abschnitte "lek-NN/sNN")
    app/src/experiment/exp-<name>.ts    das Experiment         (id: "exp-<name>", klein, mit Bindestrich)
    tests/lektionen-<name>.test.ts      Referenzwerte und Schema-Pruefung dieser Lektion

**Nicht anfassen** (das erledigt die Integration zentral): `registry.ts`, `lessons/index.ts`,
`tests/mathematik.test.ts`, `package.json`, `tsconfig.json`, irgendeine Datei unter `app/src/ui/`.
Neue Dateien anlegen, bestehende nur lesen.

## Die Lektion

```ts
import type { Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";

export const lekNN: Lesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "lek-NN",
  number: NN,                 // muss lueckenlos aufsteigen, NN = Curriculum-Nummer
  chapterId: "kap-NN",        // siehe Kapiteluebersicht unten
  title: "...",
  learningGoals: ["...", "..."],            // mindestens einer, aus Lernendensicht
  requiresPreviousKnowledge: ["..."],       // mindestens einer, umgangssprachlich
  prerequisites: ["lek-NN", ...],           // muessen existieren UND eine kleinere Nummer haben
  estimatedMinutes: 12,
  sections: [ /* ... */ ],
};
```

Jeder Abschnitt hat `id`, `kind`, `title`, `visual` und `spoken`. Regel: **jeder Block, der
gehoert wird, hat einen ausgeschriebenen Sprechtext** – Formeln nie als LaTeX vorlesen.

```ts
{
  id: "lek-NN/s03",
  kind: "equation",
  title: "Die Formel",
  visual: { type: "equation", latex: "\\hat{y} = w x + b" },
  spoken: [{
    kind: "equation",
    latex: "\\hat{y} = w x + b",
    spoken: "y Dach ist gleich w mal x plus b.",
  }],
}
```

Quizabschnitt: die Frage und die Antworten stehen **auch** im sichtbaren Teil, `answerIndex`
zeigt auf die richtige Antwort.

```ts
{
  id: "lek-NN/s07", kind: "quiz", title: "Verstaendnisaufgabe",
  visual: { type: "quiz", question: "...", options: ["...", "...", "..."] },
  spoken: [{ kind: "quiz", question: "...", options: ["...", "...", "..."],
             answerIndex: 1, spoken: "...", explanation: "..." }],
}
```

Experimentabschnitt: `visual` **und** `experimentId` setzen, dazu einen `experiment`-Sprechblock.

```ts
{
  id: "lek-NN/s04", kind: "experiment", title: "...",
  visual: { type: "experiment", experimentId: "exp-name" },
  experimentId: "exp-name",
  spoken: [{ kind: "experiment", experimentId: "exp-name", spokenDescription: "..." }],
}
```

## Das Experiment

```ts
import type { Calculated } from "../model/types.js";
import type { SemanticEvent } from "../semantic/events.js";
import type { Experiment } from "./contract.js";

export const name: Experiment = {
  id: "exp-name",
  title: "...",
  learningGoal: "...",
  instructions: "...",              // Bedienhinweis in einem Satz
  spokenDescription: "...",         // was man sieht und bedienen kann
  controls: [ /* ... */ ],
  initialState: { /* je Regler ein Wert */ },
  update(state, action) {
    if (action.type === "reset") return { /* Startwerte */ };
    return { ...state, [action.controlId]: action.value };
  },
  calculate(state): Calculated { /* Zahlen, Zeichnung, Saetze */ },
  semanticEvents(before, after) { /* optional */ return []; },
};
```

Reglerarten (aus `contract.ts`):

    { kind: "slider", id, label, min, max, step, initial, unit? }
    { kind: "toggle", id, label, initial }
    { kind: "select", id, label, options: [{value,label}], initial }
    { kind: "point",  id, label, bounds: {minX,maxX,minY,maxY}, initial: {x,y} }

**Pflicht:** `update` und `calculate` sind rein – gleicher Zustand ergibt gleiche Ausgabe, kein
Zugriff auf Fenstergroesse, Zeit oder Zufall. Zufall ist erlaubt, wenn er aus dem Zustand
abgeleitet wird (eigener Regler `seed`), nie aus `Math.random()`.

Rueckgabe von `calculate`: `values` (angezeigte Zahlen mit `label`, `value`, `digits`, `unit?`),
`drawing` (siehe unten) und `sentences` (zwei bis vier sachliche deutsche Saetze, die die
Ergebnisse nennen – sie sind Grundlage von Erklaerung und Vorlesen).

Erlaubte Zeichnungen (`DrawingSpec` in `app/src/model/types.ts`):

    function-plot   xRange, yRange, curves[{label, points:[[x,y]], dashed?, color?}], marks[{label,x,y}]
    plane           xRange, yRange, vectors[{label,from,to,color?}], points, curves?
    scatter         xRange, yRange, points, lines
    grid            cols, rows, cells[{row,col,value,label?}], xRange, yRange,
                    vectors?, points?, style?: "verlust" | "grau" | "anteil"
    bars            items[{label,value,highlighted?,ghost?,color?}], yMax?, unit?, horizontal?

Die Zeichnung entsteht **immer** aus derselben Rechnung wie die Zahlen. Keine handgezeichneten
Bilder, keine erfundenen Werte.

Semantische Ereignisse: vergleiche `before` und `after` und melde nur, was didaktisch traegt.
Vorhandene Regelnamen (aus `semantic/events.ts`) bitte wiederverwenden, wo sie passen:
`derivativePositive`, `derivativeNegative`, `derivativeNearZero`, `steepening`, `flattening`,
`lossDecreased`, `lossIncreased`, `converged`, `diverging`, `similarityHigh`, `similarityLow`,
`orthogonal`. Neue Namen sind erlaubt; dann `registerRules([...])` im eigenen Experiment-Modul
mit einem deutschen Erklaersatz aufrufen.

## Referenzwerte (der fachliche Nachweis)

Von Hand nachrechnen und als Test festnageln. Rechnen (nicht schaetzen) mit `python3`:

    python3 -c "import math; print(math.exp(1), 0.8**2 + 1.6*0.6**2)"

Testdatei nach diesem Muster (eigene Datei je Lektion, damit es keine Konflikte gibt):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { name } from "../app/src/experiment/exp-name.js";
import { lekNN } from "../app/src/model/lessons/lek-NN.js";
import { validateLesson } from "../app/src/model/validate.js";

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

test("exp-name: Referenzwerte", () => {
  const r = name.calculate({ /* Startwerte */ });
  assert.ok(Math.abs(wert(r, "Verlust") - 1.216) < 1e-12);
});

test("lek-NN: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lekNN, "app/src/model/lessons/lek-NN.ts", ["exp-name"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});
```

## Kapiteluebersicht (chapterId)

    kap-01 Funktionen, Vektoren, Matrizen            Lektionen 1-3
    kap-02 Ableitung und Gradient                    Lektionen 4-5
    kap-03 Wahrscheinlichkeit, Entropie, Regression   Lektionen 6-10
    kap-04 Klassifikation und Generalisierung         Lektionen 11-14
    kap-05 Neuronale Netze                            Lektionen 15-19
    kap-06 Repraesentationen                          Lektionen 20-23
    kap-07 Sequenzen und Attention                    Lektionen 24-28
    kap-08 Sprachmodelle                              Lektionen 29-33
    kap-09 Diffusion                                  Lektionen 34-36
    kap-10 Reinforcement Learning                     Lektionen 37-43
    kap-11 Gesamtsystem                               Lektion 44

## Sprachliche Regeln

* Deutsch mit Umlauten und scharfem S; keine erfundenen Fachwoerter, englische Fachbegriffe
  bleiben englisch (Embedding, Attention, Token).
* Sprechtexte werden **gehoert**, nicht gelesen: kurze Saetze, Zahlen ausgeschrieben wo es
  natuerlich klingt ("null Komma fuenf"), Formeln als Wort ("y Dach ist gleich w mal x plus b").
* Keine Behauptung ohne Rechnung: jeder Zahlenwert in Text und Sprechfassung muss aus
  `calculate()` stammen oder ein nachgerechnetes Beispiel sein.

## Pruefen

    npm run typecheck     # Typen
    npm test              # Tests (auch die eigenen Referenzwerte)
    npm run validate      # Katalog: IDs, Reihenfolge, Sprachtexte, Experimentverweise

Der Validator nennt bei jedem Verstoss Datei und Block-ID – danach richten, nicht raten.
