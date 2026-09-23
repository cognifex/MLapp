/**
 * Sprachausgabe (TTS-01) mit austauschbarer Engine.
 *
 * Zwei Wege:
 *  - AndroidSpeechEngine: spricht ueber die Huelle. Die Huelle stellt window.MLappTTS bereit und
 *    ruft nach dem Ende window.__mlappTtsFertig(kennung) auf. Nur so laufen Bildschirm-aus-Sprache,
 *    Sperrbildschirmsteuerung und Audio-Fokus ueberhaupt in Android.
 *  - WebSpeechEngine: spricht ueber speechSynthesis des Browsers - fuer Desktop und als Rueckfall.
 *
 * Der Player arbeitet auf Sprechbloecken, nicht auf freiem Text: damit kann die Oberflaeche
 * hervorheben, was gerade gehoert wird.
 */
import type { SpokenBlock } from "../model/types.js";
import { applyLexicon, type LexiconEntry } from "./lexicon.js";

export type Stimme = { uri: string; label: string; sprache?: string };

export type SprechAuftrag = { text: string; rate: number; voiceUri: string };

export interface SpeechEngine {
  readonly name: string;
  verfuegbar(): boolean;
  sprich(auftrag: SprechAuftrag): Promise<void>;
  halt(): void;
  pause(): void;
  fortsetzen(): void;
  stimmen(): Stimme[];
}

type AndroidBruecke = {
  speak(text: string, rate: number, voice: string, kennung: string): void;
  stop(): void;
  pause(): void;
  resume(): void;
  voices(): string;
};

declare global {
  interface Window {
    MLappTTS?: AndroidBruecke;
    __mlappTtsFertig?: (kennung: string) => void;
  }
}

const wartende = new Map<string, () => void>();
let zaehler = 0;

export function ttsFertig(kennung: string): void {
  const aufloesen = wartende.get(kennung);
  if (aufloesen) {
    wartende.delete(kennung);
    aufloesen();
  }
}

export function installiereFertigRueckruf(): void {
  window.__mlappTtsFertig = ttsFertig;
}

export class AndroidSpeechEngine implements SpeechEngine {
  readonly name = "Android-Huelle";

  verfuegbar(): boolean {
    return typeof window.MLappTTS?.speak === "function";
  }

  sprich(auftrag: SprechAuftrag): Promise<void> {
    const bruecke = window.MLappTTS;
    if (!bruecke) return Promise.resolve();
    const kennung = `mlapp-${(zaehler += 1)}`;
    return new Promise<void>((resolve) => {
      const mitZeitgrenze = window.setTimeout(() => {
        wartende.delete(kennung);
        resolve();
      }, 120000);
      wartende.set(kennung, () => {
        window.clearTimeout(mitZeitgrenze);
        resolve();
      });
      bruecke.speak(auftrag.text, auftrag.rate, auftrag.voiceUri, kennung);
    });
  }

  halt(): void {
    window.MLappTTS?.stop();
  }

  pause(): void {
    window.MLappTTS?.pause();
  }

  fortsetzen(): void {
    window.MLappTTS?.resume();
  }

  stimmen(): Stimme[] {
    const roh = window.MLappTTS?.voices();
    if (!roh) return [];
    try {
      const liste = JSON.parse(roh) as Stimme[];
      return Array.isArray(liste) ? liste : [];
    } catch {
      return [];
    }
  }
}

export class WebSpeechEngine implements SpeechEngine {
  readonly name = "Browser";

  verfuegbar(): boolean {
    return typeof window.speechSynthesis !== "undefined";
  }

  stimmen(): Stimme[] {
    const synth = window.speechSynthesis;
    if (!synth) return [];
    return synth
      .getVoices()
      .map((v) => ({ uri: v.voiceURI, label: `${v.name} (${v.lang})`, sprache: v.lang }));
  }

  sprich(auftrag: SprechAuftrag): Promise<void> {
    const synth = window.speechSynthesis;
    if (!synth) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const aeußerung = new SpeechSynthesisUtterance(auftrag.text);
      aeußerung.rate = auftrag.rate;
      const stimme = synth.getVoices().find((v) => v.voiceURI === auftrag.voiceUri);
      if (stimme) aeußerung.voice = stimme;
      aeußerung.onend = () => resolve();
      aeußerung.onerror = () => resolve();
      synth.speak(aeußerung);
    });
  }

  halt(): void {
    window.speechSynthesis?.cancel();
  }

  pause(): void {
    window.speechSynthesis?.pause();
  }

  fortsetzen(): void {
    window.speechSynthesis?.resume();
  }
}

/** Waehlt die Huelle, wenn vorhanden - sonst den Browser. */
export function waehleEngine(): SpeechEngine {
  const android = new AndroidSpeechEngine();
  if (android.verfuegbar()) return android;
  return new WebSpeechEngine();
}

export type Sprechabschnitt = { abschnittId: string; texte: string[] };

/**
 * Der Lektionsplayer: liest Abschnitt fuer Abschnitt, meldet jeden Block zurueck, damit die
 * Oberflaeche hervorheben kann. Mehr Tempo oder Stimmwechsel wirken ab dem naechsten Block.
 */
export class Lektionsplayer {
  private abschnitte: Sprechabschnitt[] = [];
  private aktuellerAbschnitt = 0;
  private aktuellerBlock = 0;
  private laeuft = false;
  private abbruch = false;

  constructor(
    private readonly engine: SpeechEngine,
    private readonly einstellungen: () => {
      rate: number;
      voiceUri: string;
      lexicon?: LexiconEntry[];
    },
    private readonly meldung: {
      abschnittStart?: (abschnittId: string, index: number) => void;
      blockStart?: (abschnittId: string, blockIndex: number, text: string) => void;
      fertig?: () => void;
      fehler?: (text: string) => void;
    } = {},
  ) {}

  setzeAbschnitte(abschnitte: Sprechabschnitt[]): void {
    this.abschnitte = abschnitte;
    this.aktuellerAbschnitt = 0;
    this.aktuellerBlock = 0;
  }

  get spielt(): boolean {
    return this.laeuft;
  }

  get position(): { abschnitt: number; block: number } {
    return { abschnitt: this.aktuellerAbschnitt, block: this.aktuellerBlock };
  }

  async start(abschnittIndex = this.aktuellerAbschnitt): Promise<void> {
    if (!this.engine.verfuegbar()) {
      this.meldung.fehler?.("Keine Sprachausgabe verfuegbar");
      return;
    }
    this.aktuellerAbschnitt = Math.max(0, Math.min(abschnittIndex, this.abschnitte.length - 1));
    this.aktuellerBlock = 0;
    this.laeuft = true;
    this.abbruch = false;
    await this.schleife();
  }

  private async schleife(): Promise<void> {
    while (this.laeuft && !this.abbruch && this.aktuellerAbschnitt < this.abschnitte.length) {
      const abschnitt = this.abschnitte[this.aktuellerAbschnitt];
      if (!abschnitt) break;
      this.meldung.abschnittStart?.(abschnitt.abschnittId, this.aktuellerAbschnitt);
      for (
        this.aktuellerBlock = 0;
        this.aktuellerBlock < abschnitt.texte.length;
        this.aktuellerBlock += 1
      ) {
        if (this.abbruch || !this.laeuft) return;
        const einstellungen = this.einstellungen();
        const text = applyLexicon(
          abschnitt.texte[this.aktuellerBlock] ?? "",
          einstellungen.lexicon,
        );
        this.meldung.blockStart?.(abschnitt.abschnittId, this.aktuellerBlock, text);
        await this.engine.sprich({
          text,
          rate: einstellungen.rate,
          voiceUri: einstellungen.voiceUri,
        });
      }
      this.aktuellerAbschnitt += 1;
    }
    this.laeuft = false;
    if (!this.abbruch) this.meldung.fertig?.();
  }

  pause(): void {
    this.engine.pause();
  }

  fortsetzen(): void {
    this.engine.fortsetzen();
  }

  async naechster(): Promise<void> {
    this.abbrechen();
    this.aktuellerAbschnitt += 1;
    await this.start(this.aktuellerAbschnitt);
  }

  async voriger(): Promise<void> {
    this.abbrechen();
    this.aktuellerAbschnitt -= 1;
    await this.start(this.aktuellerAbschnitt);
  }

  stopp(): void {
    this.abbrechen();
    this.laeuft = false;
  }

  private abbrechen(): void {
    this.abbruch = true;
    this.engine.halt();
  }

  /** Baut die Sprechabschnitte aus einer Lektion. */
  static ausLektion(abschnitte: { id: string; texte: string[] }[]): Sprechabschnitt[] {
    return abschnitte.map((a) => ({ abschnittId: a.id, texte: a.texte }));
  }
}

export function bloeckeZuTexten(bloecke: SpokenBlock[], lexicon?: LexiconEntry[]): string[] {
  return bloecke.map((block) => {
    switch (block.kind) {
      case "heading":
      case "paragraph":
      case "summary":
        return applyLexicon(block.text, lexicon);
      case "equation":
        return applyLexicon(block.spoken, lexicon);
      case "code":
        return applyLexicon(block.spoken, lexicon);
      case "experiment":
        return applyLexicon(block.spokenDescription, lexicon);
      case "quiz":
        return applyLexicon(block.question, lexicon);
    }
  });
}
