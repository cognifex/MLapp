/**
 * Touch-Interaktionssystem (AND-03).
 *
 * Grundsaetze:
 *  - Alles laeuft ueber Pointer Events; damit funktionieren Finger, Stift und Maus gleich.
 *  - Waehrend eines Zugs wird der Zeiger eingefangen (setPointerCapture), damit die Bewegung
 *    nicht abbricht, wenn der Finger den Bereich verlaesst.
 *  - touch-action: none auf den Ziehflaechen verhindert, dass die Seite mitscrollt; ausserhalb
 *    bleibt das Scrollen unberuehrt.
 *  - Jedes Element ist mit der Tastatur bedienbar und mindestens 44x44 CSS-px gross.
 */
import type { ControlDefinition, ControlValue, Point } from "../experiment/contract.js";

export type ControlHandle = {
  element: HTMLElement;
  setValue(value: ControlValue): void;
  destroy(): void;
};

function formatNumber(value: number, step: number): string {
  const decimals = Math.max(0, (String(step).split(".")[1] ?? "").length);
  return value.toFixed(decimals).replace(".", ",");
}

export function createSlider(
  def: Extract<ControlDefinition, { kind: "slider" }>,
  value: number,
  onChange: (value: number) => void,
): ControlHandle {
  const wrap = document.createElement("div");
  wrap.className = "regler";

  const head = document.createElement("div");
  head.className = "regler-kopf";
  const label = document.createElement("label");
  const id = `regler-${def.id}`;
  label.htmlFor = id;
  label.textContent = def.label;
  const readout = document.createElement("output");
  readout.htmlFor = id;
  readout.textContent = unitText(def, value);
  head.append(label, readout);

  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = String(def.min);
  input.max = String(def.max);
  input.step = String(def.step);
  input.value = String(value);
  input.setAttribute("aria-valuetext", unitText(def, value));
  input.addEventListener("input", () => {
    const next = Number(input.value);
    readout.textContent = unitText(def, next);
    input.setAttribute("aria-valuetext", unitText(def, next));
    onChange(next);
  });

  wrap.append(head, input);
  return {
    element: wrap,
    setValue(next) {
      if (typeof next !== "number") return;
      input.value = String(next);
      readout.textContent = unitText(def, next);
      input.setAttribute("aria-valuetext", unitText(def, next));
    },
    destroy() {
      wrap.remove();
    },
  };
}

function unitText(def: Extract<ControlDefinition, { kind: "slider" }>, value: number): string {
  return `${formatNumber(value, def.step)}${def.unit ? ` ${def.unit}` : ""}`;
}

export function createToggle(
  def: Extract<ControlDefinition, { kind: "toggle" }>,
  value: boolean,
  onChange: (value: boolean) => void,
): ControlHandle {
  const wrap = document.createElement("label");
  wrap.className = "regler";
  const text = document.createElement("span");
  text.textContent = def.label;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = value;
  input.style.minWidth = "44px";
  input.style.minHeight = "44px";
  input.addEventListener("change", () => onChange(input.checked));
  wrap.append(text, input);
  return {
    element: wrap,
    setValue(next) {
      if (typeof next === "boolean") input.checked = next;
    },
    destroy() {
      wrap.remove();
    },
  };
}

export function createSelect(
  def: Extract<ControlDefinition, { kind: "select" }>,
  value: string,
  onChange: (value: string) => void,
): ControlHandle {
  const wrap = document.createElement("div");
  wrap.className = "regler";
  const label = document.createElement("label");
  const id = `auswahl-${def.id}`;
  label.htmlFor = id;
  label.textContent = def.label;
  const select = document.createElement("select");
  select.id = id;
  select.style.minHeight = "44px";
  select.style.width = "100%";
  for (const option of def.options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    select.append(el);
  }
  select.value = value;
  select.addEventListener("change", () => onChange(select.value));
  wrap.append(label, select);
  return {
    element: wrap,
    setValue(next) {
      if (typeof next === "string") select.value = next;
    },
    destroy() {
      wrap.remove();
    },
  };
}

export type Projection = {
  toScreen(point: Point): { x: number; y: number };
  toData(clientX: number, clientY: number): Point;
};

export function createProjection(
  canvas: HTMLCanvasElement,
  xRange: [number, number],
  yRange: [number, number],
): Projection {
  const rectOf = (): DOMRect => canvas.getBoundingClientRect();
  return {
    toScreen(point) {
      const rect = rectOf();
      const width = rect.width || 1;
      const height = rect.height || 1;
      return {
        x: ((point.x - xRange[0]) / (xRange[1] - xRange[0])) * width,
        y: height - ((point.y - yRange[0]) / (yRange[1] - yRange[0])) * height,
      };
    },
    toData(clientX, clientY) {
      const rect = rectOf();
      const width = rect.width || 1;
      const height = rect.height || 1;
      const x = xRange[0] + ((clientX - rect.left) / width) * (xRange[1] - xRange[0]);
      const y = yRange[0] + ((rect.bottom - clientY) / height) * (yRange[1] - yRange[0]);
      return { x, y };
    },
  };
}

/**
 * Ziehflaeche fuer einen Punkt. Zeiger werden eingefangen, die Tastatur verschiebt den Punkt in
 * Schritten; die Flaeche meldet jeden neuen Wert ueber onChange.
 */
export function createDragPad(
  def: Extract<ControlDefinition, { kind: "point" }>,
  canvas: HTMLCanvasElement,
  value: Point,
  onChange: (value: Point) => void,
): ControlHandle {
  let current = { ...value };
  const { bounds } = def;
  const projection = createProjection(
    canvas,
    [bounds.minX, bounds.maxX],
    [bounds.minY, bounds.maxY],
  );
  const step = (bounds.maxX - bounds.minX) / 40;

  const clamp = (p: Point): Point => ({
    x: Math.min(bounds.maxX, Math.max(bounds.minX, p.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, p.y)),
  });

  const send = (p: Point): void => {
    current = clamp(p);
    onChange({ ...current });
  };

  canvas.style.touchAction = "none";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", `${def.label}: mit den Pfeiltasten verschiebbar`);

  let activePointer: number | null = null;

  const onPointerDown = (event: PointerEvent): void => {
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    send(projection.toData(event.clientX, event.clientY));
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (activePointer !== event.pointerId) return;
    event.preventDefault();
    send(projection.toData(event.clientX, event.clientY));
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (activePointer !== event.pointerId) return;
    activePointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    send({ x: current.x + move.x, y: current.y + move.y });
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("keydown", onKeyDown);

  return {
    element: canvas,
    setValue(next) {
      if (typeof next === "object" && next !== null && "x" in next && "y" in next) {
        current = { ...(next as Point) };
      }
    },
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKeyDown);
    },
  };
}
