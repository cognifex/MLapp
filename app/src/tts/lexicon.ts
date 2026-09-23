/**
 * Aussprachelexikon und Sprachmarkierungen (Grundlage fuer TTS-09).
 *
 * Die App spricht Fachbegriffe so aus, wie sie im Deutschen verstanden werden. Englische Woerter
 * bekommen eine deutsche Sprechweise, Formeln werden ausgeschrieben. Alles, was hier steht, ist
 * ersetzbar: das Lexikon ist Datenbestand und keine im Code verstreute Einzelfallregel.
 */
import type { SpokenBlock } from "../model/types.js";

export type LexiconEntry = {
  /** Wort oder Wendung, wie sie im Text steht. */
  word: string;
  /** Wie es gesprochen werden soll. */
  spoken: string;
  /** Kurze Begruendung, damit spaeter nachvollziehbar bleibt, warum der Eintrag existiert. */
  note?: string;
};

/** Grundstock. Wird von den Lektionen ueber `applyLexicon` benutzt. */
export const DEFAULT_LEXICON: LexiconEntry[] = [
  { word: "Gradient", spoken: "Gradi-EHNT", note: "Betonung auf der letzten Silbe" },
  { word: "Gradienten", spoken: "Gradi-EHN-ten" },
  { word: "Skalarprodukt", spoken: "Skal-AHR-produkt" },
  {
    word: "Loss-Fläche",
    spoken: "Loss-Fläsche",
    note: "ss statt sz, damit die Stimme nicht stolpert",
  },
  { word: "Loss", spoken: "Loss", note: "eingedeutscht, wie im Kurs gesprochen" },
  { word: "Feature", spoken: "Fietscher" },
  { word: "Features", spoken: "Fietschers" },
  { word: "Layer", spoken: "Leier" },
  { word: "Token", spoken: "Tohken" },
  { word: "Tokens", spoken: "Tohkens" },
  { word: "Attention", spoken: "At-TEN-schen" },
  { word: "Transformer", spoken: "Trans-FOR-ma" },
  { word: "Embedding", spoken: "Em-BÄ-ding" },
  { word: "Batch", spoken: "Bätsch" },
  { word: "Dropout", spoken: "Drópp-aut" },
  { word: "ReLU", spoken: "Reh-LU" },
  { word: "Softmax", spoken: "Sóft-mäx" },
  { word: "Overfitting", spoken: "Ouwer-FI-ting" },
  { word: "Regularisierung", spoken: "Regu-lah-ri-ZIE-rung" },
  { word: "Vektor", spoken: "WECK-tor" },
  { word: "Vektoren", spoken: "WECK-toh-ren" },
  { word: "Matrix", spoken: "MAH-trix" },
  { word: "Matrizen", spoken: "ma-TRIH-zen" },
];

/** Formeln als Sprechtext - rohes LaTeX wird nie vorgelesen. */
export function formulaToSpeech(expr: string, spoken: string): { latex: string; spoken: string } {
  const trimmed = spoken.trim();
  return { latex: expr, spoken: trimmed.length > 0 ? trimmed : expr };
}

export function applyLexicon(text: string, entries: LexiconEntry[] = DEFAULT_LEXICON): string {
  let out = text;
  // Laengste Wendungen zuerst, damit "Gradienten" nicht als "Gradi-EHN-Ten" endet.
  const sorted = [...entries].sort((a, b) => b.word.length - a.word.length);
  for (const entry of sorted) {
    const pattern = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    out = out.replace(pattern, entry.spoken);
  }
  return out;
}

/** Wendet das Lexikon auf alle Bloecke an, die gehoert werden. */
export function speakableText(
  blocks: SpokenBlock[],
  entries: LexiconEntry[] = DEFAULT_LEXICON,
): string[] {
  return blocks.map((block) => {
    switch (block.kind) {
      case "heading":
      case "paragraph":
      case "summary":
        return applyLexicon(block.text, entries);
      case "equation":
        return applyLexicon(block.spoken, entries);
      case "code":
        return applyLexicon(block.spoken, entries);
      case "experiment":
        return applyLexicon(block.spokenDescription, entries);
      case "quiz":
        return applyLexicon(`${block.question} ${block.spoken}`, entries);
    }
  });
}

export function addLexiconEntry(entries: LexiconEntry[], entry: LexiconEntry): LexiconEntry[] {
  return [...entries.filter((e) => e.word !== entry.word), entry];
}
