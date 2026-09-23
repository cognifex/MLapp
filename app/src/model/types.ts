/**
 * Lektions- und Experiment-Schema der MLapp.
 *
 * Alles, was im Schema frueher `unknown` war, ist hier eine unterscheidbare Vereinigung
 * (discriminated union). Damit kann der Validator (model/validate.ts) jeden Block pruefen und
 * jede Fehlermeldung eine Datei- und Block-ID nennen.
 *
 * Versionierung: SCHEMA_VERSION steht in jeder Lektion. Der Validator lehnt Lektionen ab,
 * deren Schemaversion er nicht kennt - so kann ein Formatwechsel nicht stillschweigend
 * durchrutschen.
 */

/** Fassung des Lektionsschemas. Erhoehen, wenn sich die Struktur inkompatibel aendert. */
export const SCHEMA_VERSION = 1;

export type LessonId = string;
export type SectionId = string;
export type ExperimentId = string;
export type ControlId = string;

/** Sichtbarer Inhalt eines Abschnitts. */
export type VisualContent =
  | { type: "none" }
  | { type: "text"; text: string }
  | { type: "equation"; latex: string }
  | { type: "code"; language: string; code: string }
  | { type: "list"; items: string[] }
  | { type: "quiz"; question: string; options: string[] }
  | { type: "experiment"; experimentId: ExperimentId };

/** Sprechbloecke: was im Vorlesemodus gehoert wird. */
export type SpokenBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  /** Formeln brauchen einen ausgeschriebenen Sprechtext - rohes LaTeX wird nie vorgelesen. */
  | { kind: "equation"; latex: string; spoken: string }
  | { kind: "code"; language: string; code: string; spoken: string }
  | { kind: "experiment"; experimentId: ExperimentId; spokenDescription: string }
  | {
      kind: "quiz";
      question: string;
      options: string[];
      answerIndex: number;
      spoken: string;
      explanation: string;
    }
  | { kind: "summary"; text: string };

export type SectionKind =
  "heading" | "paragraph" | "equation" | "example" | "code" | "experiment" | "quiz" | "summary";

/** Ein Abschnitt verbindet sichtbaren Inhalt mit seiner Sprechfassung. */
export type Section = {
  id: SectionId;
  kind: SectionKind;
  title: string;
  visual: VisualContent;
  spoken: SpokenBlock[];
  /** Nur bei kind = "experiment": Verweis auf ein registriertes Experiment. */
  experimentId?: ExperimentId;
};

export type Lesson = {
  schemaVersion: number;
  id: LessonId;
  number: number;
  chapterId: string;
  title: string;
  learningGoals: string[];
  requiresPreviousKnowledge: string[];
  /** Lektionen, die vorher verstanden sein sollten. Muessen im Katalog existieren. */
  prerequisites: LessonId[];
  estimatedMinutes: number;
  sections: Section[];
};

export type Chapter = {
  id: string;
  title: string;
  /** Kapitelnummer im Curriculum, aufsteigend. */
  order: number;
};

export type Catalogue = {
  schemaVersion: number;
  chapters: Chapter[];
  lessons: Lesson[];
};

/** Ergebnis eines Experiments - reine Daten, damit es serialisierbar und pruefbar bleibt. */
export type Calculated = {
  /** Zahlenwerte, die angezeigt werden, mit Einheit. */
  values: { label: string; value: number; unit?: string; digits?: number }[];
  /** Freier Zeichenvorrat fuer die Zeichnung (Kurven, Punkte, Vektoren ...). */
  drawing: DrawingSpec;
  /** Sachliche Beschreibung des Ergebnisses fuer Erklaerung und Vorlesen. */
  sentences: string[];
};

export type DrawingSpec =
  | {
      kind: "function-plot";
      xRange: [number, number];
      yRange: [number, number];
      curves: Curve[];
      marks: Mark[];
    }
  | {
      kind: "plane";
      xRange: [number, number];
      yRange: [number, number];
      vectors: Vector[];
      points: Mark[];
      curves?: Curve[];
    }
  | {
      kind: "scatter";
      xRange: [number, number];
      yRange: [number, number];
      points: Mark[];
      lines: Curve[];
    }
  | {
      kind: "grid";
      cols: number;
      rows: number;
      cells: GridCell[];
      xRange: [number, number];
      yRange: [number, number];
      vectors?: Vector[];
      points?: Mark[];
      /** Farbskala: Verlustflaeche, Graustufen (Bilder) oder Anteile auf einer Farbe. */
      style?: "verlust" | "grau" | "anteil";
    }
  | {
      /** Saeulen: Verteilungen, Wahrscheinlichkeiten, Softmax, Entropie, Attention-Gewichte. */
      kind: "bars";
      items: Bar[];
      /** Obere Grenze der Achse; ohne Angabe zaehlt die groesste Saeule. */
      yMax?: number;
      unit?: string;
      /** Waagerechte Saeulen fuer lange Beschriftungen (z. B. Tokens). */
      horizontal?: boolean;
    };

export type Bar = {
  label: string;
  value: number;
  color?: string;
  /** Hervorhebung, z. B. die gewaehlte Klasse. */
  highlighted?: boolean;
  /** Optionaler zweiter Wert als Umriss (z. B. Sollwert oder vorheriger Wert). */
  ghost?: number;
};

export type Curve = { label: string; points: [number, number][]; dashed?: boolean; color?: string };
export type Mark = { label: string; x: number; y: number; color?: string };
export type Vector = {
  label: string;
  from: [number, number];
  to: [number, number];
  color?: string;
};
export type GridCell = { row: number; col: number; value: number; label?: string };
