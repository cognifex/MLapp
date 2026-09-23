/**
 * Fachliche Prüfungen der Lektionen 18 bis 21: nachgerechnete Referenzwerte und Schema-Prüfung.
 *
 * Alle Sollwerte stammen aus einer Handrechnung mit python3 (Sigmoid-Netz 2-2-1, Verlustmulde,
 * Kosinus der Wortvektoren, lineare Interpolation). Ändert jemand eine Rechnung, fällt es hier
 * auf - und die Rechenwege stehen in den Kommentaren.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExperimentState } from "../app/src/experiment/contract.js";
import { backpropagation, netzwerte } from "../app/src/experiment/exp-backpropagation.js";
import { abstieg, optimizer } from "../app/src/experiment/exp-optimizer.js";
import {
  embeddings,
  kosinus,
  winkelGrad,
  WORTVEKTOREN,
} from "../app/src/experiment/exp-embeddings.js";
import {
  DARSTELLUNG_A,
  DARSTELLUNG_B,
  latentSpace,
} from "../app/src/experiment/exp-latent-space.js";
import { lek18 } from "../app/src/model/lessons/lek-18.js";
import { lek19 } from "../app/src/model/lessons/lek-19.js";
import { lek20 } from "../app/src/model/lessons/lek-20.js";
import { lek21 } from "../app/src/model/lessons/lek-21.js";
import { validateLesson } from "../app/src/model/validate.js";

function wert(result: { values: { label: string; value: number }[] }, label: string): number {
  const eintrag = result.values.find((v) => v.label === label);
  assert.ok(eintrag, `Wert "${label}" fehlt`);
  return eintrag.value;
}

function almost(actual: number, expected: number, tolerance = 1e-12, message = ""): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message} erwartet ${expected}, erhalten ${actual}`,
  );
}

// ---------------------------------------------------------------- Lektion 18

/** Startzustand des Experiments: die Gewichte des nachgerechneten Beispiels. */
const BP_START: ExperimentState = {
  w11: 0.8,
  w12: -0.5,
  w21: -0.6,
  w22: 0.9,
  v1: 1.2,
  v2: -0.8,
  b1: -0.2,
  b2: 0.3,
  ziel: 1,
};

test("exp-backpropagation: Vorwärtswerte und Gradienten des Startzustands", () => {
  const r = backpropagation.calculate(BP_START);
  // z1 = 0,35 ; h1 = 1/(1+e^-0,35) ; z2 = 0,15 ; h2 = 1/(1+e^-0,15)
  almost(wert(r, "h1"), 0.5866175789173301);
  almost(wert(r, "h2"), 0.5374298453437496);
  // o = 1,2·0,5866 - 0,8·0,5374 = 0,2740 ; y = sigmoid(o) ; Verlust = 0,5·(y-1)²
  almost(wert(r, "Ausgabe"), 0.5680739518531566);
  almost(wert(r, "Verlust"), 0.09328005553387465);
  // dL/do = (y-1)·y·(1-y) = -0,10598 ; dL/dv1 = dL/do·h1 ; dL/dv2 = dL/do·h2
  almost(wert(r, "∂L/∂v1"), -0.06216969555404571);
  almost(wert(r, "∂L/∂v2"), -0.0569567825231971);
  // dL/dw11 = dL/do·v1·h1·(1-h1)·x1 mit x1 = 1 und x2 = 0,5
  almost(wert(r, "∂L/∂w11"), -0.03083983111932469);
  almost(wert(r, "∂L/∂w12"), -0.015419915559662345);
  almost(wert(r, "∂L/∂w21"), 0.021077206160382164);
  almost(wert(r, "∂L/∂w22"), 0.010538603080191082);
});

test("exp-backpropagation: der Gradient wird nach hinten kleiner", () => {
  const n = netzwerte(BP_START);
  // Ausgabeschicht: 0,0622 und 0,0570 gegen versteckte Schicht: 0,0308 und 0,0105
  assert.ok(Math.abs(n.gv1) > Math.abs(n.gw11), "Ausgabe vor versteckter Schicht");
  assert.ok(Math.abs(n.gv2) > Math.abs(n.gw12), "auch das kleinste Ausgabegewicht bleibt größer");
});

test("exp-backpropagation: Säulen zeigen je Schicht den Betrag des Gradienten", () => {
  const r = backpropagation.calculate(BP_START);
  assert.equal(r.drawing.kind, "bars");
  if (r.drawing.kind === "bars") {
    assert.equal(
      r.drawing.items.length,
      8,
      "zwei Ausgabe-, vier versteckte Gewichte, zwei Vorspannungen",
    );
    const v1 = r.drawing.items.find((i) => i.label === "v1");
    assert.ok(v1, "Säule für v1 fehlt");
    almost(v1.value, 0.06216969555404571);
    assert.equal(v1.highlighted, true, "der größte Gradient ist hervorgehoben");
    const w22 = r.drawing.items.find((i) => i.label === "w22");
    assert.ok(w22, "Säule für w22 fehlt");
    almost(w22.value, 0.010538603080191082);
    const b1 = r.drawing.items.find((i) => i.label === "b1");
    assert.ok(b1, "Säule für b1 fehlt");
    almost(b1.value, 0.03083983111932469);
  }
});

test("exp-backpropagation: gesättigtes Neuron hat fast keinen Gradienten", () => {
  const gesaettigt: ExperimentState = { ...BP_START, b1: 12 };
  const n = netzwerte(gesaettigt);
  // h1 = 1/(1+e^-12,35) = 0,99999646 ; dL/dw11 = -2,912e-7
  almost(n.h1, 0.999996455110414);
  almost(n.gw11, -2.9120621154100237e-7);
  const events = backpropagation.semanticEvents?.(BP_START, gesaettigt) ?? [];
  assert.ok(
    events.some((e) => e.name === "saettigung"),
    "Sättigung wird gemeldet",
  );
});

// ---------------------------------------------------------------- Lektion 19

const OPT_START = { x: -2, y: -1.8 };

test("exp-optimizer: ein SGD-Schritt von Hand", () => {
  const pfad = abstieg("sgd", OPT_START, 0.1, 1);
  assert.equal(pfad.length, 2, "Startpunkt plus ein Schritt");
  const ende = pfad[1];
  assert.ok(ende);
  // Gradient an (-2|-1,8): (2·(-2,8), 3,2·(-1,2)) = (-5,6|-3,84)
  almost(ende.x, -1.44, 1e-9);
  almost(ende.y, -1.416, 1e-9);

  const r = optimizer.calculate({ verfahren: "sgd", lernrate: 0.1, schritte: 1, start: OPT_START });
  almost(wert(r, "Verlust am Start"), 10.144, 1e-9, "2,8² + 1,6·1,2²");
  almost(wert(r, "Verlust am Ende"), 6.0829696, 1e-9, "2,24² + 1,6·0,816²");
});

test("exp-optimizer: SGD, Momentum und Adam nach zwölf Schritten", () => {
  const sgd = optimizer.calculate({
    verfahren: "sgd",
    lernrate: 0.1,
    schritte: 12,
    start: OPT_START,
  });
  almost(wert(sgd, "Endpunkt x"), 0.6075854651392001, 1e-9);
  almost(wert(sgd, "Endpunkt y"), -0.6117297349444883, 1e-9);
  almost(wert(sgd, "Verlust am Ende"), 0.03724349191668672, 1e-9);

  const adam = optimizer.calculate({
    verfahren: "adam",
    lernrate: 0.1,
    schritte: 12,
    start: OPT_START,
  });
  almost(wert(adam, "Verlust am Ende"), 2.663514960663435, 1e-9);
});

test("exp-optimizer: Adam geht im ersten Schritt fast genau die Lernrate", () => {
  const r = optimizer.calculate({
    verfahren: "adam",
    lernrate: 0.1,
    schritte: 1,
    start: OPT_START,
  });
  almost(wert(r, "Endpunkt x"), -1.9000000001785715, 1e-9);
  almost(wert(r, "Endpunkt y"), -1.7000000002604168, 1e-9);
});

test("exp-optimizer: Momentum läuft schneller und pendelt dann", () => {
  const frueh = optimizer.calculate({
    verfahren: "momentum",
    lernrate: 0.1,
    schritte: 3,
    start: OPT_START,
  });
  almost(wert(frueh, "Verlust am Ende"), 0.2909434394460164, 1e-9);

  const spaet = optimizer.calculate({
    verfahren: "momentum",
    lernrate: 0.1,
    schritte: 12,
    start: OPT_START,
  });
  almost(wert(spaet, "Verlust am Ende"), 1.6585781560350328, 1e-9);
  // Bester Wert 0,2909 gegen Ende 1,6586: das Verfahren schießt über das Minimum hinaus.
  assert.ok(
    wert(spaet, "Bester Verlust") < wert(spaet, "Verlust am Ende") / 3,
    "Momentum pendelt um das Minimum",
  );
});

test("exp-optimizer: große Lernrate lässt den Verlust davonlaufen", () => {
  const r = optimizer.calculate({
    verfahren: "sgd",
    lernrate: 0.8,
    schritte: 12,
    start: OPT_START,
  });
  almost(wert(r, "Verlust am Ende"), 99419.78861673531, 1e-6);
  assert.ok(wert(r, "Verlust am Ende") > wert(r, "Verlust am Start"), "der Verlust wächst");

  assert.equal(r.drawing.kind, "grid");
  if (r.drawing.kind === "grid") {
    assert.equal(r.drawing.style, "verlust", "Farbfläche als Verlustdarstellung");
    assert.equal(r.drawing.cells.length, 441, "21 mal 21 Zellen");
    assert.equal(r.drawing.points?.length, 13, "Startpunkt plus zwölf Schritte");
  }

  const events =
    optimizer.semanticEvents?.(
      { verfahren: "sgd", lernrate: 0.1, schritte: 12, start: OPT_START },
      { verfahren: "sgd", lernrate: 0.8, schritte: 12, start: OPT_START },
    ) ?? [];
  assert.ok(
    events.some((e) => e.name === "diverging"),
    "davonlaufender Verlust wird gemeldet",
  );
});

// ---------------------------------------------------------------- Lektion 20

const E_START: ExperimentState = { a: { x: 2, y: 1.1 }, b: { x: 1.6, y: 2 } };

test("exp-embeddings: Kosinus, Winkel und Längen des Startzustands", () => {
  const r = embeddings.calculate(E_START);
  // a·b = 3,2 + 2,2 = 5,4 ; |a| = √5,21 = 2,28254 ; |b| = √6,56 = 2,56125
  almost(wert(r, "Kosinus"), 0.9236830591215581);
  almost(wert(r, "Winkel"), 22.52939800293684, 1e-9);
  almost(wert(r, "Skalarprodukt"), 5.4);
  almost(wert(r, "Länge von a"), 2.2825424421026654);
  almost(wert(r, "Länge von b"), 2.5612496949731396);
  almost(wert(r, "Abstand der Spitzen"), 0.9848857801796104);
});

test("exp-embeddings: feste Wortvektoren und Grenzfälle", () => {
  const hund = WORTVEKTOREN.find((w) => w.wort === "Hund");
  const wolf = WORTVEKTOREN.find((w) => w.wort === "Wolf");
  const auto = WORTVEKTOREN.find((w) => w.wort === "Auto");
  const bahn = WORTVEKTOREN.find((w) => w.wort === "Bahn");
  assert.ok(hund, "Hund fehlt im festen Wortschatz");
  assert.ok(wolf, "Wolf fehlt im festen Wortschatz");
  assert.ok(auto, "Auto fehlt im festen Wortschatz");
  assert.ok(bahn, "Bahn fehlt im festen Wortschatz");
  // Hund = (2|1,1), Wolf = (2,3|1,5): 6,25 / (2,28254·2,74591) = 0,99718
  almost(kosinus(hund.vektor, wolf.vektor), 0.9971844160681184);
  almost(winkelGrad(hund.vektor, wolf.vektor), 4.300548217398842, 1e-9);
  almost(kosinus(hund.vektor, auto.vektor), -0.2527625917850105);
  almost(kosinus(hund.vektor, bahn.vektor), -0.5216697968426401);
  // Gleiche Richtung, rechter Winkel, Gegenrichtung
  almost(kosinus({ x: 1, y: 0.5 }, { x: 2, y: 1 }), 1);
  almost(kosinus({ x: 1, y: 0 }, { x: 0, y: 1 }), 0);
  almost(kosinus({ x: 1, y: 0 }, { x: -1, y: 0 }), -1);
  assert.ok(Number.isNaN(kosinus({ x: 0, y: 0 }, { x: 1, y: 0 })), "Nullvektor hat keinen Winkel");
});

test("exp-embeddings: Zeichnung und semantische Ereignisse", () => {
  const r = embeddings.calculate(E_START);
  assert.equal(r.drawing.kind, "plane");
  if (r.drawing.kind === "plane") {
    assert.equal(r.drawing.vectors.length, 6, "zwei gezogene und vier feste Wortvektoren");
    assert.equal(r.drawing.points.length, 2);
  }
  const hoch = embeddings.semanticEvents?.(E_START, E_START) ?? [];
  assert.ok(
    hoch.some((e) => e.name === "similarityHigh"),
    "Kosinus 0,92 gilt als große Ähnlichkeit",
  );
  const rechtwinklig =
    embeddings.semanticEvents?.(E_START, { a: { x: 1, y: 0 }, b: { x: 0, y: 1 } }) ?? [];
  assert.ok(
    rechtwinklig.some((e) => e.name === "orthogonal"),
    "rechter Winkel wird gemeldet",
  );
});

// ---------------------------------------------------------------- Lektion 21

test("exp-latent-space: Endpunkte sind genau A und B", () => {
  const a = latentSpace.calculate({ t: 0, zwischenstellen: true });
  almost(wert(a, "x"), DARSTELLUNG_A.x);
  almost(wert(a, "y"), DARSTELLUNG_A.y);
  almost(wert(a, "Abstand zu A"), 0);
  // |B - A| = |(3,8|2)| = 4,294182110716777
  almost(wert(a, "Abstand zu B"), 4.294182110716777);

  const b = latentSpace.calculate({ t: 1, zwischenstellen: true });
  almost(wert(b, "x"), DARSTELLUNG_B.x);
  almost(wert(b, "y"), DARSTELLUNG_B.y);
  almost(wert(b, "Abstand zu B"), 0);
  almost(wert(b, "Abstand zu A"), 4.294182110716777);
});

test("exp-latent-space: die Mitte liegt gleich weit von beiden Enden", () => {
  const r = latentSpace.calculate({ t: 0.5, zwischenstellen: true });
  almost(wert(r, "x"), 0.1);
  almost(wert(r, "y"), 0.4);
  almost(wert(r, "Abstand zu A"), 2.1470910553583886, 1e-9);
  almost(wert(r, "Abstand zu B"), 2.147091055358389, 1e-9);
  almost(wert(r, "Abstand zu A"), wert(r, "Abstand zu B"), 1e-9, "beide Abstände sind gleich groß");
  almost(wert(r, "Summe der Abstände"), 4.294182110716777, 1e-9);
});

test("exp-latent-space: Viertelstellen und die Summe der Abstände", () => {
  const viertel = latentSpace.calculate({ t: 0.25, zwischenstellen: false });
  almost(wert(viertel, "x"), -0.85);
  almost(wert(viertel, "y"), -0.1);
  almost(wert(viertel, "Abstand zu A"), 1.0735455276791943, 1e-9);
  almost(wert(viertel, "Abstand zu B"), 3.2206365830375834, 1e-9);

  const dreiViertel = latentSpace.calculate({ t: 0.75, zwischenstellen: true });
  almost(wert(dreiViertel, "x"), 1.05);
  almost(wert(dreiViertel, "y"), 0.9);
  almost(wert(dreiViertel, "Abstand zu A"), 3.220636583037583, 1e-9);
  almost(wert(dreiViertel, "Abstand zu B"), 1.0735455276791948, 1e-9);

  // Die Summe der Abstände ist bei jedem t so groß wie die Verbindungslinie.
  const beliebig = latentSpace.calculate({ t: 0.37, zwischenstellen: true });
  almost(wert(beliebig, "Summe der Abstände"), 4.294182110716777, 1e-9);

  assert.equal(dreiViertel.drawing.kind, "plane");
  if (dreiViertel.drawing.kind === "plane") {
    assert.equal(dreiViertel.drawing.points.length, 5, "A, B, eine Zwischenstelle und der Punkt");
    assert.equal(dreiViertel.drawing.vectors.length, 3);
    assert.equal(dreiViertel.drawing.curves?.length, 1, "die Verbindungslinie");
    assert.equal(dreiViertel.drawing.curves?.[0]?.points.length, 2);
  }
});

test("exp-latent-space: die Enden und die Mitte werden gemeldet", () => {
  const anfang =
    latentSpace.semanticEvents?.(
      { t: 0.5, zwischenstellen: true },
      { t: 0, zwischenstellen: true },
    ) ?? [];
  assert.ok(
    anfang.some((e) => e.name === "amEndpunktA"),
    "das linke Ende wird gemeldet",
  );
  const ende =
    latentSpace.semanticEvents?.(
      { t: 0.5, zwischenstellen: true },
      { t: 1, zwischenstellen: true },
    ) ?? [];
  assert.ok(
    ende.some((e) => e.name === "amEndpunktB"),
    "das rechte Ende wird gemeldet",
  );
  const mitte =
    latentSpace.semanticEvents?.(
      { t: 0.2, zwischenstellen: true },
      { t: 0.5, zwischenstellen: true },
    ) ?? [];
  assert.ok(
    mitte.some((e) => e.name === "halbwegs"),
    "die Mitte wird gemeldet",
  );
});

// ---------------------------------------------------------------- Reinheit

test("alle vier Experimente rechnen rein und unabhängig von der Reihenfolge", () => {
  const paare: [() => unknown, () => unknown][] = [
    [() => backpropagation.calculate(BP_START), () => backpropagation.calculate({ ...BP_START })],
    [
      () =>
        optimizer.calculate({ verfahren: "adam", lernrate: 0.3, schritte: 5, start: OPT_START }),
      () =>
        optimizer.calculate({ verfahren: "adam", lernrate: 0.3, schritte: 5, start: OPT_START }),
    ],
    [() => embeddings.calculate(E_START), () => embeddings.calculate({ ...E_START })],
    [
      () => latentSpace.calculate({ t: 0.42, zwischenstellen: true }),
      () => latentSpace.calculate({ t: 0.42, zwischenstellen: true }),
    ],
  ];
  for (const [erst, zweit] of paare) {
    assert.deepEqual(erst(), zweit(), "zwei Aufrufe mit gleichem Zustand sind gleich");
  }

  const geaendert = backpropagation.update(BP_START, {
    type: "set-value",
    controlId: "ziel",
    value: 0.4,
  });
  assert.equal(geaendert["ziel"], 0.4);
  assert.equal(BP_START["ziel"], 1, "der alte Zustand bleibt unberührt");
  assert.notEqual(geaendert, BP_START, "update liefert einen neuen Zustand");
});

// ---------------------------------------------------------------- Schema

test("lek-18: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek18, "app/src/model/lessons/lek-18.ts", ["exp-backpropagation"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-19: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek19, "app/src/model/lessons/lek-19.ts", ["exp-optimizer"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-20: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek20, "app/src/model/lessons/lek-20.ts", ["exp-embeddings"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-21: Schema ohne Beanstandung", () => {
  const issues = validateLesson(lek21, "app/src/model/lessons/lek-21.ts", ["exp-latent-space"]);
  assert.deepEqual(issues, [], JSON.stringify(issues));
});

test("lek-18 bis lek-21: Kapitel, Nummern und Experimentverweise passen zusammen", () => {
  assert.equal(lek18.chapterId, "kap-05");
  assert.equal(lek19.chapterId, "kap-05");
  assert.equal(lek20.chapterId, "kap-06");
  assert.equal(lek21.chapterId, "kap-06");
  assert.deepEqual([lek18.number, lek19.number, lek20.number, lek21.number], [18, 19, 20, 21]);
  assert.equal(lek18.sections.find((s) => s.experimentId)?.experimentId, "exp-backpropagation");
  assert.equal(lek19.sections.find((s) => s.experimentId)?.experimentId, "exp-optimizer");
  assert.equal(lek20.sections.find((s) => s.experimentId)?.experimentId, "exp-embeddings");
  assert.equal(lek21.sections.find((s) => s.experimentId)?.experimentId, "exp-latent-space");
});
