/**
 * Experiment-Widget: verbindet Vertrag, Bedienung, Zeichnung, Erklaerung und Vorlesen.
 *
 * Die Anzeige haengt allein an calculate(state) - es gibt keinen zweiten Rechenweg in der
 * Oberflaeche. Bedeutungsvolle Ereignisse werden gedrosselt und als deutsche Saetze angezeigt
 * (und auf Wunsch gesprochen).
 */
import type { Calculated, ExperimentId } from "../model/types.js";
import { EventThrottle, explain, type SemanticEvent } from "../semantic/events.js";
import {
  type ControlDefinition,
  type ControlValue,
  type Experiment,
  type ExperimentStore,
} from "../experiment/contract.js";
import {
  createDragPad,
  createSelect,
  createSlider,
  createToggle,
  type ControlHandle,
} from "./controls.js";
import { describeDrawing, renderDrawing } from "./plot.js";

export type ExperimentHost = {
  host: HTMLElement;
  experiment: Experiment;
  store: ExperimentStore;
  onStateChange?(zustand: string): void;
  onEvent?: (saetze: string[], ereignisse: SemanticEvent[]) => void;
  vollbildKnopf?: boolean;
};

function wertAnzeigen(result: Calculated): HTMLElement {
  const liste = document.createElement("ul");
  liste.className = "werte";
  for (const wert of result.values) {
    const li = document.createElement("li");
    const bez = document.createElement("span");
    bez.className = "bez";
    bez.textContent = wert.label;
    const zahl = document.createElement("span");
    zahl.className = "zahl";
    const stellen = wert.digits ?? 2;
    const text = Number.isFinite(wert.value)
      ? wert.value.toFixed(stellen).replace(".", ",")
      : "nicht definiert";
    zahl.textContent = wert.unit ? `${text} ${wert.unit}` : text;
    li.append(bez, zahl);
    liste.append(li);
  }
  return liste;
}

function controlElement(
  def: ControlDefinition,
  wert: ControlValue,
  canvas: HTMLCanvasElement | null,
  onChange: (controlId: string, value: ControlValue) => void,
): ControlHandle | null {
  switch (def.kind) {
    case "slider":
      return createSlider(def, typeof wert === "number" ? wert : def.initial, (v) =>
        onChange(def.id, v),
      );
    case "toggle":
      return createToggle(def, typeof wert === "boolean" ? wert : def.initial, (v) =>
        onChange(def.id, v),
      );
    case "select":
      return createSelect(def, typeof wert === "string" ? wert : def.initial, (v) =>
        onChange(def.id, v),
      );
    case "point":
      if (!canvas) return null;
      return createDragPad(
        def,
        canvas,
        typeof wert === "object" && wert !== null ? wert : def.initial,
        (v) => onChange(def.id, v),
      );
  }
}

/** Baut das Widget in den uebergebenen Host. Rueckgabe: Aufraeumfunktion. */
export function montiereExperiment(host: ExperimentHost): () => void {
  const { host: container, experiment } = host;
  const store = host.store;
  const throttles = new Map<string, EventThrottle>();
  let vorher = store.state();
  let abraeumen: (() => void)[] = [];

  const kopf = document.createElement("div");
  kopf.className = "experiment-kopf";
  const titel = document.createElement("h4");
  titel.textContent = experiment.title;
  kopf.append(titel);

  const vollbild = document.createElement("button");
  vollbild.type = "button";
  vollbild.className = "icon-button";
  vollbild.textContent = "⤢";
  vollbild.setAttribute("aria-label", `${experiment.title} im Vollbild zeigen`);
  kopf.append(vollbild);

  const zuruecksetzen = document.createElement("button");
  zuruecksetzen.type = "button";
  zuruecksetzen.className = "knopf-rand";
  zuruecksetzen.textContent = "Zuruecksetzen";
  kopf.append(zuruecksetzen);

  const hinweis = document.createElement("p");
  hinweis.textContent = experiment.instructions;

  const canvas = document.createElement("canvas");
  canvas.className = "zeichnung";

  const steuerung = document.createElement("div");
  const erklaerung = document.createElement("p");
  erklaerung.className = "erklaerung";
  erklaerung.setAttribute("aria-live", "polite");

  container.append(kopf, hinweis, canvas, steuerung, erklaerung);

  function zeichne(): void {
    const result = store.result();
    renderDrawing(canvas, result.drawing, describeDrawing(result.drawing));
    const erklaerungAlt = container.querySelector(".werte");
    erklaerungAlt?.replaceWith(wertAnzeigen(result));
  }

  function baueSteuerung(): void {
    steuerung.textContent = "";
    const handles: ControlHandle[] = [];
    const state = store.state();
    for (const def of experiment.controls) {
      const handle = controlElement(
        def,
        state[def.id] ?? def.initial,
        canvas,
        (controlId, value) => {
          store.dispatch({ type: "set-value", controlId, value });
        },
      );
      if (handle) {
        steuerung.append(handle.element);
        handles.push(handle);
      }
    }
    abraeumen.push(...handles.map((h) => () => h.destroy()));
  }

  const abmelden = store.subscribe(() => {
    zeichne();
    const nachher = store.state();
    const ereignisse = experiment.semanticEvents?.(vorher, nachher) ?? [];
    vorher = { ...nachher };
    const durchgelassen: SemanticEvent[] = [];
    for (const ereignis of ereignisse) {
      let throttle = throttles.get(ereignis.name);
      if (!throttle) {
        throttle = new EventThrottle(900);
        throttles.set(ereignis.name, throttle);
      }
      if (throttle.accept(ereignis, Date.now())) durchgelassen.push(ereignis);
    }
    const saetze = explain(durchgelassen, { experimentId: experiment.id });
    erklaerung.textContent = saetze.join(" ");
    if (saetze.length > 0) host.onEvent?.(saetze, durchgelassen);
    host.onStateChange?.(store.serialize());
  });

  zuruecksetzen.addEventListener("click", (event) => {
    event.stopPropagation();
    store.reset();
    baueSteuerung();
    vorher = store.state();
  });

  vollbild.addEventListener("click", (event) => {
    event.stopPropagation();
    document.dispatchEvent(
      new CustomEvent("mlapp-vollbild", {
        detail: { experimentId: experiment.id, titel: experiment.title },
      }),
    );
  });

  // Zeichnung neu berechnen, wenn sich die Groesse aendert; die Rechnung selbst bleibt gleich.
  const groessenBeobachter = new ResizeObserver(() => zeichne());
  groessenBeobachter.observe(canvas);
  window.addEventListener("resize", zeichne);

  baueSteuerung();
  zeichne();

  return () => {
    abmelden();
    groessenBeobachter.disconnect();
    window.removeEventListener("resize", zeichne);
    abraeumen.forEach((fn) => fn());
    abraeumen = [];
    container.textContent = "";
  };
}

export function experimentIdOf(wert: ExperimentId): string {
  return wert;
}

/** Kurzbeschreibung fuer Listen und Vorlesen. */
export function experimentKurzbeschreibung(experiment: Experiment): string {
  return `${experiment.title}: ${experiment.learningGoal}`;
}
