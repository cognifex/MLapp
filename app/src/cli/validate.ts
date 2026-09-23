/**
 * Kommandozeilen-Pruefung des Katalogs (CONTENT-01).
 *
 * Aufruf: node dist/app/src/cli/validate.js
 * Rueckgabewert: 0 = alles gueltig, 1 = Beanstandungen (Ausgabe nennt Datei und Block-ID).
 */
import { catalogue } from "../model/lessons/index.js";
import { experimentIds } from "../experiment/registry.js";
import { formatIssues, validateCatalogue } from "../model/validate.js";
import { checkExperimentContract } from "../experiment/contract.js";
import { experiments } from "../experiment/registry.js";

const FILE = "app/src/model/lessons/index.ts";

const catalogueResult = validateCatalogue(catalogue, FILE, experimentIds());
const contractIssues = experiments.flatMap((e) => checkExperimentContract(e));

console.log(
  `Katalog: ${catalogueResult.lessonCount} Lektionen, ${catalogueResult.sectionCount} Abschnitte, ` +
    `${experiments.length} Experimente`,
);

if (contractIssues.length > 0) {
  console.log("Beanstandungen im Experiment-Vertrag:");
  for (const issue of contractIssues) console.log(`  ${issue.experimentId}: ${issue.message}`);
}

if (catalogueResult.issues.length > 0) {
  console.log("Beanstandungen im Lektionsschema:");
  console.log(formatIssues(catalogueResult.issues));
}

if (!catalogueResult.ok || contractIssues.length > 0) {
  console.error(
    `FEHLGESCHLAGEN: ${catalogueResult.issues.length + contractIssues.length} Beanstandungen`,
  );
  process.exit(1);
}

console.log("OK: Schema und Experiment-Vertraege sind gueltig");
