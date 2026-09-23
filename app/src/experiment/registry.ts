/**
 * Verzeichnis aller Experimente. Der Validator prueft Lektionsverweise gegen dieses Verzeichnis -
 * ein Tippfehler in einer Experiment-ID faellt damit im Test auf, nicht erst im Browser.
 */
import type { ExperimentId } from "../model/types.js";
import type { Experiment } from "./contract.js";
import { funktionen } from "./exp-funktionen.js";
import { vektoren } from "./exp-vektoren.js";
import { matrizen } from "./exp-matrizen.js";
import { ableitung } from "./exp-ableitung.js";
import { gradient } from "./exp-gradient.js";

export const experiments: Experiment[] = [funktionen, vektoren, matrizen, ableitung, gradient];

export function experimentById(id: ExperimentId): Experiment | undefined {
  return experiments.find((e) => e.id === id);
}

export function experimentIds(): string[] {
  return experiments.map((e) => e.id);
}
