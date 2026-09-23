/**
 * Experiment-Vertrag und Zustandsspeicher (CONTENT-02).
 *
 * Regeln, die der Vertrag durchsetzt:
 *  - Der Zustand ist reine, serialisierbare Daten (Zahlen, Wahrheitswerte, Zeichenketten, Punkte).
 *  - update() ist eine reine Funktion: gleicher Zustand + gleiche Aktion = gleicher Folgezustand.
 *  - calculate() ist eine reine Funktion: gleicher Zustand = gleiche Ausgabe. Sie haengt weder an
 *    der Fenstergroesse noch an der Reihenfolge der Bedienung.
 *  - Unzulaessige Reglerwerte werden auf den erlaubten Bereich gezogen (nicht stillschweigend
 *    uebernommen), NaN und Unendlich fallen auf den Startwert zurueck.
 *  - Zuruecksetzen ist deterministisch: es wird eine tiefe Kopie des Startzustands gesetzt.
 */
import type { Calculated, ControlId, ExperimentId } from "../model/types.js";
import type { SemanticEvent } from "../semantic/events.js";

export type SliderControl = {
  kind: "slider";
  id: ControlId;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  initial: number;
};

export type ToggleControl = {
  kind: "toggle";
  id: ControlId;
  label: string;
  initial: boolean;
};

export type SelectControl = {
  kind: "select";
  id: ControlId;
  label: string;
  options: { value: string; label: string }[];
  initial: string;
};

export type PointControl = {
  kind: "point";
  id: ControlId;
  label: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  initial: { x: number; y: number };
};

export type ControlDefinition = SliderControl | ToggleControl | SelectControl | PointControl;

export type Point = { x: number; y: number };
export type ControlValue = number | boolean | string | Point;

/** Der gesamte Zustand eines Experiments - flach und serialisierbar. */
export type ExperimentState = Record<ControlId, ControlValue>;

export type ExperimentAction =
  { type: "set-value"; controlId: ControlId; value: ControlValue } | { type: "reset" };

export type Experiment = {
  id: ExperimentId;
  title: string;
  learningGoal: string;
  instructions: string;
  spokenDescription: string;
  controls: ControlDefinition[];
  initialState: ExperimentState;
  update(state: ExperimentState, action: ExperimentAction): ExperimentState;
  calculate(state: ExperimentState): Calculated;
  /** Bedeutungsvolle Zustandswechsel; nur anzeigen, was didaktisch traegt. */
  semanticEvents?(before: ExperimentState, after: ExperimentState): SemanticEvent[];
};

export function isPoint(v: unknown): v is Point {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Point).x === "number" &&
    typeof (v as Point).y === "number"
  );
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snapToStep(value: number, def: SliderControl): number {
  if (!(def.step > 0)) return value;
  const stepped = def.min + Math.round((value - def.min) / def.step) * def.step;
  // Rundung auf die Nachkommastellen des Schritts verhindert Anzeigefehler wie 0.30000000000004.
  const decimals = Math.max(0, (String(def.step).split(".")[1] ?? "").length);
  return Number(clampNumber(stepped, def.min, def.max).toFixed(decimals));
}

/**
 * Bringt einen Wert in die Form, die die Reglerdefinition zulaesst. Der Rueckgabewert ist immer
 * gueltig - notfalls der Startwert der Definition.
 */
export function coerceControlValue(def: ControlDefinition, value: unknown): ControlValue {
  switch (def.kind) {
    case "slider": {
      if (typeof value !== "number" || !Number.isFinite(value)) return def.initial;
      return snapToStep(value, def);
    }
    case "toggle":
      return typeof value === "boolean" ? value : def.initial;
    case "select":
      return typeof value === "string" && def.options.some((o) => o.value === value)
        ? value
        : def.initial;
    case "point": {
      if (!isPoint(value) || !Number.isFinite(value.x) || !Number.isFinite(value.y))
        return def.initial;
      return {
        x: clampNumber(value.x, def.bounds.minX, def.bounds.maxX),
        y: clampNumber(value.y, def.bounds.minY, def.bounds.maxY),
      };
    }
  }
}

export function normaliseState(exp: Experiment, state: ExperimentState): ExperimentState {
  const out: ExperimentState = {};
  for (const def of exp.controls) {
    out[def.id] = coerceControlValue(def, state[def.id] ?? def.initial);
  }
  return out;
}

export function cloneState(state: ExperimentState): ExperimentState {
  return JSON.parse(JSON.stringify(state)) as ExperimentState;
}

export type ExperimentStore = {
  readonly id: ExperimentId;
  state(): ExperimentState;
  result(): Calculated;
  subscribe(listener: (state: ExperimentState, result: Calculated) => void): () => void;
  dispatch(action: ExperimentAction): void;
  /** Setzt auf den Startzustand zurueck - deterministisch. */
  reset(): void;
  /** Serialisierter Zustand fuer die Wiederaufnahme. */
  serialize(): string;
  /** Uebernimmt einen gespeicherten Zustand; ungueltige Werte werden gezogen. */
  restore(serialized: string | null): void;
};

export function createStore(exp: Experiment): ExperimentStore {
  let state = normaliseState(exp, exactInitial());
  let result = exp.calculate(state);
  const listeners = new Set<(state: ExperimentState, result: Calculated) => void>();

  function exactInitial(): ExperimentState {
    const out: ExperimentState = {};
    for (const def of exp.controls) out[def.id] = cloneValue(def.initial);
    return out;
  }

  function cloneValue(v: ControlValue): ControlValue {
    return isPoint(v) ? { x: v.x, y: v.y } : v;
  }

  function notify(): void {
    result = exp.calculate(state);
    for (const listener of listeners) listener(state, result);
  }

  return {
    id: exp.id,
    state: () => state,
    result: () => result,
    subscribe(listener) {
      listeners.add(listener);
      listener(state, result);
      return () => listeners.delete(listener);
    },
    dispatch(action) {
      const next = exp.update(state, action);
      state = normaliseState(exp, next);
      notify();
    },
    reset() {
      state = exactInitial();
      notify();
    },
    serialize() {
      return JSON.stringify(state);
    },
    restore(serialized) {
      if (!serialized) {
        this.reset();
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(serialized);
      } catch {
        this.reset();
        return;
      }
      state = normaliseState(exp, (parsed ?? {}) as ExperimentState);
      notify();
    },
  };
}

export type ContractIssue = { experimentId: ExperimentId; message: string };

/**
 * Prueft einen Experiment-Vertrag: eindeutige Regler-IDs, Startzustand fuer jeden Regler,
 * reine Berechnung (zweimal aufrufen ergibt dasselbe), Determinismus von update() und ein
 * stabiler Serialisierungs-Umlauf. Wird im Test fuer jedes registrierte Experiment aufgerufen.
 */
export function checkExperimentContract(exp: Experiment): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const seen = new Set<string>();
  for (const def of exp.controls) {
    if (seen.has(def.id))
      issues.push({ experimentId: exp.id, message: `Regler-ID "${def.id}" doppelt` });
    seen.add(def.id);
    if (!(def.id in exp.initialState)) {
      issues.push({ experimentId: exp.id, message: `Startzustand fehlt fuer Regler "${def.id}"` });
    }
    if (def.kind === "slider") {
      if (!(def.max > def.min))
        issues.push({ experimentId: exp.id, message: `Regler "${def.id}": max <= min` });
      if (!(def.step > 0))
        issues.push({ experimentId: exp.id, message: `Regler "${def.id}": step <= 0` });
    }
    if (def.kind === "select" && def.options.length === 0) {
      issues.push({ experimentId: exp.id, message: `Auswahl "${def.id}" hat keine Optionen` });
    }
  }

  const start = normaliseState(exp, exactInitialOf(exp));
  if (!isCalculated(exp.calculate(start))) {
    issues.push({ experimentId: exp.id, message: "calculate() liefert keine gueltige Ausgabe" });
  }

  const a1 = exp.calculate(start);
  const a2 = exp.calculate(cloneState(start));
  if (JSON.stringify(a1) !== JSON.stringify(a2)) {
    issues.push({
      experimentId: exp.id,
      message: "calculate() ist nicht rein (zwei Aufrufe unterscheiden sich)",
    });
  }

  // Eine unzulaessige Reglereingabe darf den Zustand nicht unbrauchbar machen.
  const firstSlider = exp.controls.find((c) => c.kind === "slider");
  if (firstSlider && firstSlider.kind === "slider") {
    const out = normaliseState(
      exp,
      exp.update(start, {
        type: "set-value",
        controlId: firstSlider.id,
        value: Number.POSITIVE_INFINITY,
      }),
    );
    const value = out[firstSlider.id];
    if (
      typeof value !== "number" ||
      value < firstSlider.min ||
      value > firstSlider.max ||
      !Number.isFinite(value)
    ) {
      issues.push({
        experimentId: exp.id,
        message: `unzulaessiger Wert fuer "${firstSlider.id}" wird nicht auf den Bereich gezogen`,
      });
    }
  }

  const store = createStore(exp);
  const s1 = store.serialize();
  store.dispatch({
    type: "set-value",
    controlId: exp.controls[0]!.id,
    value: controlSample(exp.controls[0]!),
  });
  store.restore(s1);
  if (store.serialize() !== s1) {
    issues.push({
      experimentId: exp.id,
      message: "Zustand ueberlebt Speichern/Wiederherstellen nicht unveraendert",
    });
  }
  store.reset();
  if (store.serialize() !== s1) {
    issues.push({ experimentId: exp.id, message: "Zuruecksetzen ist nicht deterministisch" });
  }
  return issues;
}

function controlSample(def: ControlDefinition): ControlValue {
  switch (def.kind) {
    case "slider":
      return def.min + (def.max - def.min) * 0.5;
    case "toggle":
      return !def.initial;
    case "select":
      return def.options[def.options.length - 1]!.value;
    case "point":
      return { x: def.bounds.maxX, y: def.bounds.minY };
  }
}

function exactInitialOf(exp: Experiment): ExperimentState {
  const out: ExperimentState = {};
  for (const def of exp.controls) out[def.id] = def.initial;
  return out;
}

function isCalculated(v: Calculated | undefined): v is Calculated {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray(v.values) &&
    Array.isArray(v.sentences) &&
    typeof v.drawing === "object" &&
    v.drawing !== null
  );
}
