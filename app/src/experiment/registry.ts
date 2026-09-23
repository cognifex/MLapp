/**
 * Verzeichnis aller Experimente. Der Validator prueft Lektionsverweise gegen dieses Verzeichnis -
 * ein Tippfehler in einer Experiment-ID faellt damit im Test auf, nicht erst im Browser.
 *
 * Diese Datei wird von tools/zusammenbau.py erzeugt.
 */
import type { ExperimentId } from "../model/types.js";
import type { Experiment } from "./contract.js";
import { ableitung } from "./exp-ableitung.js";
import { actorCritic } from "./exp-actor-critic.js";
import { aktivierungen } from "./exp-aktivierungen.js";
import { attention } from "./exp-attention.js";
import { autoencoder } from "./exp-autoencoder.js";
import { backpropagation } from "./exp-backpropagation.js";
import { conditioning } from "./exp-conditioning.js";
import { diffusionRueckwaerts } from "./exp-diffusion-rueckwaerts.js";
import { diffusionVorwaerts } from "./exp-diffusion-vorwaerts.js";
import { embeddings } from "./exp-embeddings.js";
import { entropie } from "./exp-entropie.js";
import { funktionen } from "./exp-funktionen.js";
import { gradient } from "./exp-gradient.js";
import { gradientDescent } from "./exp-gradient-descent.js";
import { klassifikation } from "./exp-klassifikation.js";
import { latentSpace } from "./exp-latent-space.js";
import { lineareRegression } from "./exp-lineare-regression.js";
import { logistischeRegression } from "./exp-logistische-regression.js";
import { loss } from "./exp-loss.js";
import { matrizen } from "./exp-matrizen.js";
import { miniTransformer } from "./exp-mini-transformer.js";
import { mlp } from "./exp-mlp.js";
import { multiHead } from "./exp-multi-head.js";
import { neuron } from "./exp-neuron.js";
import { optimizer } from "./exp-optimizer.js";
import { overfitting } from "./exp-overfitting.js";
import { policy } from "./exp-policy.js";
import { policyGradient } from "./exp-policy-gradient.js";
import { praeferenzen } from "./exp-praeferenzen.js";
import { qLearning } from "./exp-q-learning.js";
import { qkv } from "./exp-qkv.js";
import { regularisierung } from "./exp-regularisierung.js";
import { gridworld } from "./exp-rl-gridworld.js";
import { sampling } from "./exp-sampling.js";
import { sequenzen } from "./exp-sequenzen.js";
import { softmax } from "./exp-softmax.js";
import { sprachmodell } from "./exp-sprachmodell.js";
import { sprachmodelltraining } from "./exp-sprachmodelltraining.js";
import { tokenisierung } from "./exp-tokenisierung.js";
import { transformer } from "./exp-transformer.js";
import { vae } from "./exp-vae.js";
import { valueFunction } from "./exp-value-function.js";
import { vektoren } from "./exp-vektoren.js";
import { wahrscheinlichkeit } from "./exp-wahrscheinlichkeit.js";

export const experiments: Experiment[] = [
  ableitung,
  actorCritic,
  aktivierungen,
  attention,
  autoencoder,
  backpropagation,
  conditioning,
  diffusionRueckwaerts,
  diffusionVorwaerts,
  embeddings,
  entropie,
  funktionen,
  gradient,
  gradientDescent,
  klassifikation,
  latentSpace,
  lineareRegression,
  logistischeRegression,
  loss,
  matrizen,
  miniTransformer,
  mlp,
  multiHead,
  neuron,
  optimizer,
  overfitting,
  policy,
  policyGradient,
  praeferenzen,
  qLearning,
  qkv,
  regularisierung,
  gridworld,
  sampling,
  sequenzen,
  softmax,
  sprachmodell,
  sprachmodelltraining,
  tokenisierung,
  transformer,
  vae,
  valueFunction,
  vektoren,
  wahrscheinlichkeit,
];

export function experimentById(id: ExperimentId): Experiment | undefined {
  return experiments.find((e) => e.id === id);
}

export function experimentIds(): string[] {
  return experiments.map((e) => e.id);
}
