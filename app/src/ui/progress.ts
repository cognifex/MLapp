/**
 * Lernfortschritt und Einstellungen (AND-07).
 *
 * Der Speicher liegt als eine JSON-Zeile in localStorage. Alle Lesevorgaenge sind fehlertolerant:
 * ein beschaedigter Eintrag darf die App nicht unbrauchbar machen, er wird verworfen.
 * Die Speicher-Schnittstelle ist absichtlich schmal gehalten (nur getItem/setItem), damit sie sich
 * im Test durch eine Attrappe ersetzen laesst.
 */

export type Speicher = {
  getItem(schluessel: string): string | null;
  setItem(schluessel: string, wert: string): void;
};

export type Einstellungen = {
  voiceUri: string;
  rate: number;
  autoScroll: boolean;
  speakEvents: boolean;
  highlightParagraph: boolean;
};

export type Fortschritt = {
  version: number;
  /** Abgeschlossene Abschnitte als "lek-01/s03" -> true. */
  fertigeAbschnitte: Record<string, true>;
  /** Zuletzt gelesener Abschnitt je Lektion. */
  leseposition: Record<string, string>;
  /** Gespeicherter Experimentzustand je Experiment. */
  experimente: Record<string, string>;
  einstellungen: Einstellungen;
};

export const FORTSCHRITT_VERSION = 1;
export const SCHLUESSEL = "mlapp.fortschritt.v1";

export const standardEinstellungen: Einstellungen = {
  voiceUri: "",
  rate: 1,
  autoScroll: true,
  speakEvents: false,
  highlightParagraph: true,
};

function leererFortschritt(): Fortschritt {
  return {
    version: FORTSCHRITT_VERSION,
    fertigeAbschnitte: {},
    leseposition: {},
    experimente: {},
    einstellungen: { ...standardEinstellungen },
  };
}

export function parseFortschritt(text: string | null): Fortschritt {
  if (!text) return leererFortschritt();
  try {
    const raw = JSON.parse(text) as Partial<Fortschritt>;
    if (raw.version !== FORTSCHRITT_VERSION) return leererFortschritt();
    return {
      version: FORTSCHRITT_VERSION,
      fertigeAbschnitte:
        typeof raw.fertigeAbschnitte === "object" && raw.fertigeAbschnitte !== null
          ? raw.fertigeAbschnitte
          : {},
      leseposition:
        typeof raw.leseposition === "object" && raw.leseposition !== null ? raw.leseposition : {},
      experimente:
        typeof raw.experimente === "object" && raw.experimente !== null ? raw.experimente : {},
      einstellungen: { ...standardEinstellungen, ...(raw.einstellungen ?? {}) },
    };
  } catch {
    return leererFortschritt();
  }
}

export class Fortschrittsspeicher {
  private zustand: Fortschritt;

  constructor(private readonly speicher: Speicher | null) {
    this.zustand = parseFortschritt(speicher?.getItem(SCHLUESSEL) ?? null);
  }

  get einstellungen(): Einstellungen {
    return { ...this.zustand.einstellungen };
  }

  setzeEinstellungen(teil: Partial<Einstellungen>): void {
    this.zustand.einstellungen = { ...this.zustand.einstellungen, ...teil };
    this.sichern();
  }

  abschnittFertig(abschnittId: string): void {
    this.zustand.fertigeAbschnitte[abschnittId] = true;
    this.sichern();
  }

  istAbschnittFertig(abschnittId: string): boolean {
    return this.zustand.fertigeAbschnitte[abschnittId] === true;
  }

  merkePosition(lektionId: string, abschnittId: string): void {
    this.zustand.leseposition[lektionId] = abschnittId;
    this.sichern();
  }

  position(lektionId: string): string | undefined {
    return this.zustand.leseposition[lektionId];
  }

  merkeExperiment(experimentId: string, zustand: string): void {
    this.zustand.experimente[experimentId] = zustand;
    this.sichern();
  }

  experimentZustand(experimentId: string): string | undefined {
    return this.zustand.experimente[experimentId];
  }

  /** Anteil fertiger Abschnitte einer Lektion (0 bis 1). */
  anteil(_lektionId: string, abschnittIds: string[]): number {
    if (abschnittIds.length === 0) return 0;
    const fertig = abschnittIds.filter((id) => this.istAbschnittFertig(id)).length;
    return fertig / abschnittIds.length;
  }

  istLektionFertig(abschnittIds: string[]): boolean {
    return abschnittIds.length > 0 && abschnittIds.every((id) => this.istAbschnittFertig(id));
  }

  private sichern(): void {
    try {
      this.speicher?.setItem(SCHLUESSEL, JSON.stringify(this.zustand));
    } catch {
      // Ein voller oder gesperrter Speicher darf die Bedienung nicht unterbrechen.
    }
  }
}
