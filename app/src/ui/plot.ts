/**
 * Zeichnen der Rechenergebnisse (AND-04).
 *
 * Alle Zeichnungen entstehen aus der Rechenausgabe des Experiments - es gibt keine von Hand
 * gezeichneten Bilder. Die Farbwahl ist so gewaehlt, dass die Farbe nie allein die Information
 * traegt: Kurven haben Beschriftungen, Punkte haben Namen, Werte stehen als Zahlen daneben.
 */
import type { Curve, DrawingSpec, Mark } from "../model/types.js";

export type CanvasContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  xRange: [number, number];
  yRange: [number, number];
};

function setup(
  canvas: HTMLCanvasElement,
  xRange: [number, number],
  yRange: [number, number],
): CanvasContext | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, width: rect.width, height: rect.height, xRange, yRange };
}

function project(x: number, y: number, c: CanvasContext): { px: number; py: number } {
  const px = ((x - c.xRange[0]) / (c.xRange[1] - c.xRange[0])) * c.width;
  const py = c.height - ((y - c.yRange[0]) / (c.yRange[1] - c.yRange[0])) * c.height;
  return { px, py };
}

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function drawAxes(c: CanvasContext, labelX = "x", labelY = "y"): void {
  const { ctx } = c;
  ctx.save();
  ctx.strokeStyle = cssVar("--rand", "#d7dae0");
  ctx.fillStyle = cssVar("--text-schwach", "#5f6368");
  ctx.lineWidth = 1;
  ctx.font = "12px system-ui, sans-serif";

  const zero = project(0, 0, c);
  ctx.beginPath();
  ctx.moveTo(0, zero.py);
  ctx.lineTo(c.width, zero.py);
  ctx.moveTo(zero.px, 0);
  ctx.lineTo(zero.px, c.height);
  ctx.stroke();

  // Gitterlinien an ganzzahligen Stellen, damit Werte ablesbar bleiben.
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  for (let x = Math.ceil(c.xRange[0]); x <= c.xRange[1]; x += 1) {
    const p = project(x, 0, c);
    ctx.moveTo(p.px, 0);
    ctx.lineTo(p.px, c.height);
  }
  for (let y = Math.ceil(c.yRange[0]); y <= c.yRange[1]; y += 1) {
    const p = project(0, y, c);
    ctx.moveTo(0, p.py);
    ctx.lineTo(c.width, p.py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillText(labelX, c.width - 14, zero.py - 6);
  ctx.fillText(labelY, zero.px + 6, 14);
  ctx.restore();
}

function drawCurve(c: CanvasContext, curve: Curve): void {
  const { ctx } = c;
  ctx.save();
  ctx.strokeStyle = curve.color ?? cssVar("--akzent", "#1a73e8");
  ctx.lineWidth = 2;
  if (curve.dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath();
  curve.points.forEach(([x, y], i) => {
    const { px, py } = project(x, y, c);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

function drawMark(c: CanvasContext, mark: Mark): void {
  const { ctx } = c;
  const { px, py } = project(mark.x, mark.y, c);
  ctx.save();
  ctx.fillStyle = mark.color ?? cssVar("--warnung", "#b3261e");
  ctx.strokeStyle = cssVar("--hintergrund", "#ffffff");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = cssVar("--text", "#1f2328");
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(mark.label, px + 9, py - 6);
  ctx.restore();
}

function drawVector(
  c: CanvasContext,
  vector: { from: [number, number]; to: [number, number]; color?: string; label: string },
): void {
  const { ctx } = c;
  const from = project(vector.from[0], vector.from[1], c);
  const to = project(vector.to[0], vector.to[1], c);
  const dx = to.px - from.px;
  const dy = to.py - from.py;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;

  ctx.save();
  ctx.strokeStyle = vector.color ?? cssVar("--akzent", "#1a73e8");
  ctx.fillStyle = vector.color ?? cssVar("--akzent", "#1a73e8");
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(from.px, from.py);
  ctx.lineTo(to.px, to.py);
  ctx.stroke();

  const angle = Math.atan2(dy, dx);
  const head = 11;
  ctx.beginPath();
  ctx.moveTo(to.px, to.py);
  ctx.lineTo(to.px - head * Math.cos(angle - 0.4), to.py - head * Math.sin(angle - 0.4));
  ctx.lineTo(to.px - head * Math.cos(angle + 0.4), to.py - head * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();

  if (vector.label.length > 0) {
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(vector.label, to.px + 6, to.py - 6);
  }
  ctx.restore();
}

/** Kleine Farbtreppe fuer Verlustflaechen; Werte werden vorher auf 0..1 abgebildet. */
function lossColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const light = 96 - 46 * clamped;
  const saturation = 40 + 45 * clamped;
  return `hsl(214 ${saturation}% ${light}%)`;
}

/** Graustufen fuer Bilder (Diffusion, Autoencoder): 0 = schwarz, 1 = weiss. */
function grauColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const wert = Math.round(clamped * 255);
  return `rgb(${wert} ${wert} ${wert})`;
}

/** Anteile auf einer Farbe: hell bei 0, satt bei 1 (Wahrscheinlichkeiten, Attention). */
function anteilColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const light = 96 - 52 * clamped;
  const saturation = 25 + 60 * clamped;
  return `hsl(214 ${saturation}% ${light}%)`;
}

/** Zeichnet eine Rechenausgabe. Rueckgabe: Beschriftung fuer die Bildschirmleser. */
export function renderDrawing(
  canvas: HTMLCanvasElement,
  spec: DrawingSpec,
  description: string,
): void {
  switch (spec.kind) {
    case "function-plot":
    case "scatter": {
      const c = setup(canvas, spec.xRange, spec.yRange);
      if (!c) return;
      drawAxes(c);
      const curves: Curve[] = spec.kind === "function-plot" ? spec.curves : spec.lines;
      curves.forEach((curve) => drawCurve(c, curve));
      const marks: Mark[] = spec.kind === "function-plot" ? spec.marks : spec.points;
      marks.forEach((mark) => drawMark(c, mark));
      break;
    }
    case "plane": {
      const c = setup(canvas, spec.xRange, spec.yRange);
      if (!c) return;
      drawAxes(c);
      spec.curves?.forEach((curve) => drawCurve(c, curve));
      spec.vectors.forEach((vector) => drawVector(c, vector));
      spec.points.forEach((mark) => drawMark(c, mark));
      break;
    }
    case "grid": {
      const c = setup(canvas, spec.xRange, spec.yRange);
      if (!c) return;
      const values = spec.cells.map((cell) => cell.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min || 1;
      const cellW = c.width / spec.cols;
      const cellH = c.height / spec.rows;
      const skala = spec.style ?? "verlust";
      for (const cell of spec.cells) {
        const t = (cell.value - min) / span;
        c.ctx.fillStyle =
          skala === "grau" ? grauColor(t) : skala === "anteil" ? anteilColor(t) : lossColor(t);
        c.ctx.fillRect(
          cell.col * cellW,
          cell.row * cellH,
          Math.ceil(cellW) + 1,
          Math.ceil(cellH) + 1,
        );
      }
      // Hoehenlinien als feine Linien zwischen ungleichen Nachbarzellen.
      c.ctx.save();
      c.ctx.strokeStyle = "rgb(255 255 255 / 35%)";
      c.ctx.lineWidth = 1;
      for (let row = 0; row < spec.rows; row += 1) {
        for (let col = 0; col < spec.cols; col += 1) {
          const here = spec.cells[row * spec.cols + col];
          const right = spec.cells[row * spec.cols + col + 1];
          if (here && right && Math.abs(here.value - right.value) > span / 12) {
            c.ctx.beginPath();
            c.ctx.moveTo((col + 1) * cellW, row * cellH);
            c.ctx.lineTo((col + 1) * cellW, (row + 1) * cellH);
            c.ctx.stroke();
          }
        }
      }
      c.ctx.restore();
      // Beschriftungen in den Zellen (z. B. Zustaende einer Grid World, Attention-Gewichte).
      c.ctx.save();
      c.ctx.fillStyle = cssVar("--text", "#1f2328");
      c.ctx.font = `${Math.max(9, Math.min(13, cellH * 0.42))}px system-ui, sans-serif`;
      c.ctx.textAlign = "center";
      c.ctx.textBaseline = "middle";
      for (const cell of spec.cells) {
        if (!cell.label) continue;
        c.ctx.fillText(cell.label, (cell.col + 0.5) * cellW, (cell.row + 0.5) * cellH);
      }
      c.ctx.restore();
      // Pfeile und Punkte liegen in Datenkoordinaten ueber der Farbflaeche.
      spec.vectors?.forEach((vector) => drawVector(c, vector));
      spec.points?.forEach((mark) => drawMark(c, mark));
      break;
    }
    case "bars": {
      const c = setup(canvas, [0, 1], [0, 1]);
      if (!c) return;
      const werte = spec.items.map((item) => item.value);
      const obergrenze = spec.yMax ?? Math.max(1e-9, ...werte);
      const { ctx } = c;
      ctx.save();
      ctx.font = "12px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      if (spec.horizontal) {
        const zeilenhoehe = c.height / Math.max(1, spec.items.length);
        const balkenhoehe = Math.max(6, zeilenhoehe * 0.6);
        const linkeSpalte = Math.min(120, c.width * 0.34);
        spec.items.forEach((item, i) => {
          const y = i * zeilenhoehe + zeilenhoehe / 2;
          const breite = (Math.max(0, item.value) / obergrenze) * (c.width - linkeSpalte - 46);
          ctx.fillStyle = item.color ?? cssVar("--akzent", "#1a73e8");
          ctx.globalAlpha = item.highlighted ? 1 : 0.75;
          ctx.fillRect(linkeSpalte, y - balkenhoehe / 2, breite, balkenhoehe);
          ctx.globalAlpha = 1;
          if (item.ghost !== undefined) {
            const ghostBreite =
              (Math.max(0, item.ghost) / obergrenze) * (c.width - linkeSpalte - 46);
            ctx.strokeStyle = cssVar("--text-schwach", "#5f6368");
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(linkeSpalte, y - balkenhoehe / 2, ghostBreite, balkenhoehe);
            ctx.setLineDash([]);
          }
          ctx.fillStyle = cssVar("--text", "#1f2328");
          ctx.textAlign = "right";
          ctx.fillText(item.label.slice(0, 16), linkeSpalte - 6, y);
          ctx.textAlign = "left";
          ctx.fillText(
            `${item.value.toFixed(2).replace(".", ",")}${spec.unit ? ` ${spec.unit}` : ""}`,
            linkeSpalte + breite + 4,
            y,
          );
        });
        // Grundlinie
        ctx.strokeStyle = cssVar("--rand", "#d7dae0");
        ctx.beginPath();
        ctx.moveTo(linkeSpalte, 6);
        ctx.lineTo(linkeSpalte, c.height - 6);
        ctx.stroke();
      } else {
        const spaltenbreite = c.width / Math.max(1, spec.items.length);
        const grundlinie = c.height - 26;
        spec.items.forEach((item, i) => {
          const hoehe = (Math.max(0, item.value) / obergrenze) * (grundlinie - 22);
          const x = i * spaltenbreite + spaltenbreite * 0.15;
          const breite = spaltenbreite * 0.7;
          ctx.fillStyle = item.color ?? cssVar("--akzent", "#1a73e8");
          ctx.globalAlpha = item.highlighted ? 1 : 0.75;
          ctx.fillRect(x, grundlinie - hoehe, breite, hoehe);
          ctx.globalAlpha = 1;
          if (item.ghost !== undefined) {
            const ghostHoehe = (Math.max(0, item.ghost) / obergrenze) * (grundlinie - 22);
            ctx.strokeStyle = cssVar("--text-schwach", "#5f6368");
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(x, grundlinie - ghostHoehe, breite, ghostHoehe);
            ctx.setLineDash([]);
          }
          ctx.fillStyle = cssVar("--text", "#1f2328");
          ctx.textAlign = "center";
          ctx.fillText(
            item.value.toFixed(2).replace(".", ","),
            x + breite / 2,
            grundlinie - hoehe - 10,
          );
          ctx.fillStyle = cssVar("--text-schwach", "#5f6368");
          ctx.fillText(item.label.slice(0, 12), x + breite / 2, grundlinie + 12);
        });
        ctx.strokeStyle = cssVar("--rand", "#d7dae0");
        ctx.beginPath();
        ctx.moveTo(0, grundlinie);
        ctx.lineTo(c.width, grundlinie);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
  }
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", description);
}

/** Wandelt eine Rechenausgabe in einen Satz fuer Bildschirmleser und Vorlesen. */
export function describeDrawing(spec: DrawingSpec): string {
  switch (spec.kind) {
    case "function-plot":
      return `Funktionsgraph von ${spec.xRange[0]} bis ${spec.xRange[1]} mit ${spec.curves.length} Kurven und ${spec.marks.length} markierten Punkten.`;
    case "plane":
      return `Zeichenebene mit ${spec.vectors.length} Pfeilen und ${spec.points.length} markierten Punkten.`;
    case "scatter":
      return `Punktwolke mit ${spec.points.length} Punkten und ${spec.lines.length} Linien.`;
    case "grid":
      return `Farbflaeche aus ${spec.cols} mal ${spec.rows} Zellen; heller bedeutet kleinerer Wert.`;
    case "bars":
      return `Saeulendiagramm mit ${spec.items.length} Werten${spec.unit ? ` in ${spec.unit}` : ""}.`;
  }
}
