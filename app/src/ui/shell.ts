/**
 * App-Rumpf, Navigation und Ansichten (AND-02, AND-05, AND-06, AND-07, TTS-02).
 *
 * Navigation: Hash-Wege (#/, #/curriculum, #/lektion/lek-01/s03, #/einstellungen). Der Verlauf
 * des Browsers ist die einzige Quelle der Wahrheit - damit funktioniert die Android-Zurueck-Taste
 * ohne Sonderweg, und ein Lektionslink laesst sich teilen und wieder oeffnen.
 */
import type { Lesson, Section } from "../model/types.js";
import {
  catalogue,
  chapters,
  lessonById,
  lessons,
  nextLessonId,
  previousLessonId,
} from "../model/lessons/index.js";
import { experimentById } from "../experiment/registry.js";
import { createStore, type ExperimentStore } from "../experiment/contract.js";
import {
  bloeckeZuTexten,
  installiereFertigRueckruf,
  Lektionsplayer,
  waehleEngine,
} from "../tts/speech.js";
import { Fortschrittsspeicher } from "./progress.js";
import { montiereExperiment } from "./experiment-widget.js";
import { formelAnzeige } from "./formel.js";

export type ShellElemente = {
  inhalt: HTMLElement;
  kopfzeile: HTMLElement;
  zurueckKnopf: HTMLButtonElement;
  einstellungenKnopf: HTMLButtonElement;
  einstellungenDialog: HTMLDialogElement;
  einstellungenInhalt: HTMLElement;
  vollbild: HTMLElement;
  vollbildTitel: HTMLElement;
  vollbildInhalt: HTMLElement;
  vollbildZu: HTMLButtonElement;
  vorleser: HTMLElement;
  vorleserText: HTMLElement;
  vorleserZurueck: HTMLButtonElement;
  vorleserSpielen: HTMLButtonElement;
  vorleserVor: HTMLButtonElement;
  vorleserTempo: HTMLInputElement;
};

type Route =
  | { art: "start" }
  | { art: "curriculum" }
  | { art: "einstellungen" }
  | { art: "lektion"; lektionId: string; abschnittId?: string }
  | { art: "hoeren"; lektionId: string };

export function leseRoute(hash: string): Route {
  const teile = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter((t) => t.length > 0);
  if (teile.length === 0) return { art: "start" };
  if (teile[0] === "curriculum") return { art: "curriculum" };
  if (teile[0] === "einstellungen") return { art: "einstellungen" };
  if (teile[0] === "lektion" && teile[1]) {
    const abschnittId = teile[2] ? `${teile[1]}/${teile[2]}` : undefined;
    return abschnittId
      ? { art: "lektion", lektionId: teile[1], abschnittId }
      : { art: "lektion", lektionId: teile[1] };
  }
  if (teile[0] === "hoeren" && teile[1]) {
    return { art: "hoeren", lektionId: teile[1] };
  }
  return { art: "start" };
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  optionen: { klasse?: string; text?: string; attrs?: Record<string, string> } = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (optionen.klasse) node.className = optionen.klasse;
  if (optionen.text !== undefined) node.textContent = optionen.text;
  for (const [name, wert] of Object.entries(optionen.attrs ?? {})) node.setAttribute(name, wert);
  return node;
}

export function starteShell(elemente: ShellElemente): void {
  const fortschritt = new Fortschrittsspeicher(window.localStorage);
  installiereFertigRueckruf();
  const engine = waehleEngine();
  let aktuelleLektion: Lesson | null = null;
  let aufraeumen: (() => void)[] = [];
  let vollbildAufraeumen: (() => void) | null = null;

  const player = new Lektionsplayer(
    engine,
    () => ({ rate: fortschritt.einstellungen.rate, voiceUri: fortschritt.einstellungen.voiceUri }),
    {
      abschnittStart: (abschnittId) => {
        markiereAktivenAbschnitt(abschnittId);
      },
      blockStart: (abschnittId, blockIndex, text) => {
        elemente.vorleserText.textContent = text;
        if (fortschritt.einstellungen.highlightParagraph)
          markiereAktivenAbschnitt(abschnittId, blockIndex);
      },
      fertig: () => {
        elemente.vorleserSpielen.textContent = "▶";
        elemente.vorleserSpielen.setAttribute("aria-label", "Lesen starten");
      },
      fehler: (text) => {
        elemente.vorleserText.textContent = text;
      },
    },
  );

  function markiereAktivenAbschnitt(abschnittId: string, blockIndex = 0): void {
    for (const node of elemente.inhalt.querySelectorAll(".abschnitt")) {
      const aktiv = node.getAttribute("data-abschnitt") === abschnittId;
      node.classList.toggle("aktiv", aktiv);
    }
    if (fortschritt.einstellungen.autoScroll) {
      const ziel = elemente.inhalt.querySelector(`.abschnitt[data-abschnitt="${abschnittId}"]`);
      ziel?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const lektion = aktuelleLektion;
    if (lektion) fortschritt.merkePosition(lektion.id, abschnittId);
    void blockIndex;
  }

  function setzeKopf(text: string, zurueckSichtbar: boolean): void {
    elemente.kopfzeile.textContent = text;
    elemente.zurueckKnopf.hidden = !zurueckSichtbar;
  }

  function leereAnsicht(): void {
    aufraeumen.forEach((fn) => fn());
    aufraeumen = [];
    elemente.inhalt.textContent = "";
    elemente.vorleser.hidden = true;
  }

  function lektionAbschnittIds(lektion: Lesson): string[] {
    return lektion.sections.map((s) => s.id);
  }

  // --- Curriculum ---------------------------------------------------------

  function zeichneCurriculum(): void {
    const layout = el("div", { klasse: "app-layout" });
    layout.append(
      curriculumSpalte(undefined),
      el("div", {
        klasse: "hinweis",
        text: `${lessons.length} Lektionen in ${chapters.length} Kapiteln. Waehle links eine Lektion.`,
      }),
    );
    elemente.inhalt.append(layout);
  }

  function curriculumSpalte(aktiveLektionId: string | undefined): HTMLElement {
    const spalte = el("nav", {
      klasse: "curriculum-spalte",
      attrs: { "aria-label": "Curriculum" },
    });
    for (const kapitel of chapters) {
      const titel = el("p", { klasse: "kapitel-titel", text: kapitel.title });
      const liste = el("ul", { klasse: "lektionen-liste" });
      for (const lektion of lessons.filter((l) => l.chapterId === kapitel.id)) {
        const li = el("li");
        const link = el("a", { attrs: { href: `#/lektion/${lektion.id}` } });
        if (lektion.id === aktiveLektionId) link.setAttribute("aria-current", "page");
        const zeichen = el("span", {
          klasse: "fortschritt-zeichen",
          text: fortschritt.istLektionFertig(lektionAbschnittIds(lektion)) ? "✓" : "•",
          attrs: { "aria-hidden": "true" },
        });
        const anteil = Math.round(
          fortschritt.anteil(lektion.id, lektionAbschnittIds(lektion)) * 100,
        );
        link.append(zeichen, el("span", { text: `${lektion.number}. ${lektion.title}` }));
        link.setAttribute(
          "aria-label",
          `${lektion.number}. ${lektion.title}, ${anteil} Prozent fertig`,
        );
        li.append(link);
        liste.append(li);
      }
      spalte.append(titel, liste);
    }
    return spalte;
  }

  // --- Startseite ---------------------------------------------------------

  function zeichneStart(): void {
    const wrapper = el("div");
    wrapper.append(
      el("h2", { klasse: "lektion-titel", text: "Machine Learning verstehen" }),
      el("p", {
        klasse: "lektion-ziel",
        text: "Jeder Begriff mit einem Experiment, das sich bedienen laesst. Aufbauend von Funktionen bis zu Sprachmodellen.",
      }),
    );

    const knoepfe = el("p");
    const weiter = el("button", { klasse: "knopf", text: "Curriculum oeffnen" });
    weiter.addEventListener("click", () => {
      window.location.hash = "#/curriculum";
    });
    knoepfe.append(weiter);

    const letzte = letztePosition();
    if (letzte) {
      const weiterlesen = el("button", {
        klasse: "knopf-rand",
        text: `Weiter bei ${letzte.titel}`,
      });
      weiterlesen.style.marginLeft = "8px";
      weiterlesen.addEventListener("click", () => {
        window.location.hash = `#/lektion/${letzte.lektionId}`;
      });
      knoepfe.append(weiterlesen);
    }

    wrapper.append(knoepfe);
    wrapper.append(
      el("p", {
        klasse: "hinweis",
        text: `Sprachausgabe: ${engine.name}. Fortschritt, Experimentwerte und Leseposition werden auf diesem Geraet gespeichert.`,
      }),
    );
    elemente.inhalt.append(wrapper);
  }

  function letztePosition(): { lektionId: string; titel: string } | null {
    for (let i = lessons.length - 1; i >= 0; i -= 1) {
      const lektion = lessons[i];
      if (lektion && fortschritt.anteil(lektion.id, lektionAbschnittIds(lektion)) > 0) {
        return { lektionId: lektion.id, titel: lektion.title };
      }
    }
    return null;
  }

  // --- Lektion ------------------------------------------------------------

  function zeichneLektion(lektion: Lesson, abschnittId: string | undefined): void {
    aktuelleLektion = lektion;
    const layout = el("div", { klasse: "app-layout" });
    const inhaltSpalte = el("article");
    const titel = el("h2", {
      klasse: "lektion-titel",
      text: `${lektion.number}. ${lektion.title}`,
    });
    const ziel = el("p", { klasse: "lektion-ziel", text: lektion.learningGoals.join(" · ") });
    inhaltSpalte.append(titel, ziel);

    for (const abschnitt of lektion.sections) {
      inhaltSpalte.append(abschnittElement(abschnitt));
    }

    const blatt = el("p");
    const hoerfassung = el("button", { klasse: "knopf-rand", text: "Als Hoerfassung abspielen" });
    hoerfassung.addEventListener("click", () => {
      window.location.hash = `#/hoeren/${lektion.id}`;
    });
    blatt.append(hoerfassung);
    const vorherige = previousLessonId(lektion.id);
    const naechste = nextLessonId(lektion.id);
    if (vorherige) {
      const b = el("button", { klasse: "knopf-rand", text: "Vorherige Lektion" });
      b.addEventListener("click", () => {
        window.location.hash = `#/lektion/${vorherige}`;
      });
      blatt.append(b);
    }
    if (naechste) {
      const b = el("button", { klasse: "knopf", text: "Naechste Lektion" });
      b.style.marginLeft = "8px";
      b.addEventListener("click", () => {
        window.location.hash = `#/lektion/${naechste}`;
      });
      blatt.append(b);
    }
    inhaltSpalte.append(blatt);

    layout.append(curriculumSpalte(lektion.id), inhaltSpalte);
    elemente.inhalt.append(layout);

    // Leseposition oder uebergebener Abschnitt hervorheben.
    const zielAbschnitt = abschnittId ?? fortschritt.position(lektion.id);
    if (zielAbschnitt) {
      markiereAktivenAbschnitt(zielAbschnitt);
      if (!abschnittId) {
        elemente.inhalt
          .querySelector(`.abschnitt[data-abschnitt="${zielAbschnitt}"]`)
          ?.scrollIntoView({ block: "center" });
      }
    }

    // Vorleser bereitstellen, wenn Sprechbloecke vorhanden sind.
    const sprechabschnitte = lektion.sections
      .filter((s) => s.spoken.length > 0)
      .map((s) => ({ abschnittId: s.id, texte: bloeckeZuTexten(s.spoken) }));
    if (sprechabschnitte.length > 0) {
      player.setzeAbschnitte(sprechabschnitte);
      elemente.vorleser.hidden = false;
      const start = sprechabschnitte.findIndex((a) => a.abschnittId === zielAbschnitt);
      elemente.vorleserText.textContent = `Bereit: ${sprechabschnitte.length} Abschnitte. Abschnitt ${start + 1} wird beim Start gelesen.`;
      void start;
    }
  }

  function abschnittElement(abschnitt: Section): HTMLElement {
    const block = el("section", { klasse: "abschnitt" });
    block.setAttribute("data-abschnitt", abschnitt.id);
    block.append(el("h3", { text: abschnitt.title }));

    switch (abschnitt.visual.type) {
      case "none":
        break;
      case "text":
        block.append(el("p", { text: abschnitt.visual.text }));
        break;
      case "equation":
        block.append(el("div", { klasse: "formel", text: formelAnzeige(abschnitt.visual.latex) }));
        break;
      case "code": {
        const pre = el("pre", { klasse: "code" });
        pre.append(el("code", { text: abschnitt.visual.code }));
        block.append(pre);
        break;
      }
      case "list": {
        const liste = el("ul", { klasse: "liste" });
        for (const eintrag of abschnitt.visual.items) liste.append(el("li", { text: eintrag }));
        block.append(liste);
        break;
      }
      case "quiz":
        block.append(quizElement(abschnitt));
        break;
      case "experiment":
        block.append(experimentElement(abschnitt.visual.experimentId, abschnitt));
        break;
    }

    if (abschnitt.kind !== "experiment") {
      const fertig = el("button", { klasse: "knopf-rand", text: "Verstanden" });
      fertig.style.marginTop = "8px";
      fertig.addEventListener("click", () => {
        fortschritt.abschnittFertig(abschnitt.id);
        fertig.textContent = "✓ Verstanden";
        fertig.disabled = true;
      });
      if (fortschritt.istAbschnittFertig(abschnitt.id)) {
        fertig.textContent = "✓ Verstanden";
        fertig.disabled = true;
      }
      block.append(fertig);
    }
    return block;
  }

  function quizElement(abschnitt: Section): HTMLElement {
    const visual = abschnitt.visual;
    const quiz = el("div", { klasse: "quiz" });
    if (visual.type !== "quiz") return quiz;
    const frage = el("p", { text: visual.question });
    const antworten = el("ul", { klasse: "quiz-antworten" });
    const loesung = abschnitt.spoken.find((b) => b.kind === "quiz");
    const richtigIndex = loesung?.kind === "quiz" ? loesung.answerIndex : -1;
    const erklaerung = el("p", { klasse: "erklaerung" });
    erklaerung.setAttribute("aria-live", "polite");

    visual.options.forEach((option, index) => {
      const li = el("li");
      const knopf = el("button", { text: option, attrs: { type: "button" } });
      knopf.addEventListener("click", () => {
        const richtig = index === richtigIndex;
        knopf.classList.toggle("richtig", richtig);
        knopf.classList.toggle("falsch", !richtig);
        if (loesung?.kind === "quiz") erklaerung.textContent = loesung.explanation;
        if (!richtig) {
          const richtigerKnopf = antworten.querySelectorAll("button")[richtigIndex];
          richtigerKnopf?.classList.add("richtig");
        } else {
          fortschritt.abschnittFertig(abschnitt.id);
        }
      });
      li.append(knopf);
      antworten.append(li);
    });

    quiz.append(frage, antworten, erklaerung);
    return quiz;
  }

  function experimentElement(experimentId: string, abschnitt: Section): HTMLElement {
    const experiment = experimentById(experimentId);
    const huelle = el("div", { klasse: "experiment" });
    if (!experiment) {
      huelle.append(
        el("p", { klasse: "hinweis", text: `Experiment ${experimentId} ist nicht registriert.` }),
      );
      return huelle;
    }
    const store: ExperimentStore = createStore(experiment);
    const gespeichert = fortschritt.experimentZustand(experiment.id);
    if (gespeichert) store.restore(gespeichert);

    const aufraeumenWidget = montiereExperiment({
      host: huelle,
      experiment,
      store,
      onStateChange: (zustand) => fortschritt.merkeExperiment(experiment.id, zustand),
      onEvent: (saetze) => {
        if (!fortschritt.einstellungen.speakEvents) return;
        for (const satz of saetze)
          void engine.sprich({
            text: satz,
            rate: fortschritt.einstellungen.rate,
            voiceUri: fortschritt.einstellungen.voiceUri,
          });
      },
    });
    aufraeumen.push(aufraeumenWidget);

    const fertig = el("button", { klasse: "knopf-rand", text: "Verstanden" });
    fertig.style.marginTop = "8px";
    fertig.addEventListener("click", () => {
      fortschritt.abschnittFertig(abschnitt.id);
      fertig.textContent = "✓ Verstanden";
      fertig.disabled = true;
    });
    if (fortschritt.istAbschnittFertig(abschnitt.id)) {
      fertig.textContent = "✓ Verstanden";
      fertig.disabled = true;
    }
    huelle.append(fertig);
    return huelle;
  }

  // --- Hoerfassung (TTS-12) ----------------------------------------------

  /**
   * Fuehrt eine Lektion als reine Hoerfassung vor: Lernziel, Erklaerung, Beispiel, Beschreibung
   * des Experiments, Ergebnis und Zusammenfassung. Die Interaktionen werden uebersprungen - das
   * Experiment wird beschrieben, nicht bedient. Damit eignet sich die Fassung fuer Wege, auf denen
   * niemand auf den Bildschirm sehen kann.
   */
  function zeichneHoerfassung(lektion: Lesson): void {
    aktuelleLektion = lektion;
    const wrapper = el("div");
    wrapper.append(
      el("h2", { klasse: "lektion-titel", text: `Hoerfassung: ${lektion.title}` }),
      el("p", {
        klasse: "lektion-ziel",
        text: "Vorgelesen ohne Bedienung: Lernziel, Erklaerung, Beispiel, Beschreibung des Experiments, Ergebnis und Zusammenfassung.",
      }),
      el("h3", { text: "Lernziele" }),
    );
    const ziele = el("ul", { klasse: "liste" });
    for (const ziel of lektion.learningGoals) ziele.append(el("li", { text: ziel }));
    wrapper.append(ziele);

    const ablauf = el("ol", { klasse: "liste" });
    for (const abschnitt of lektion.sections) {
      ablauf.append(el("li", { text: `${abschnitt.title} (${abschnitt.kind})` }));
    }
    wrapper.append(el("h3", { text: "Ablauf" }), ablauf);

    const knoepfe = el("p");
    const start = el("button", { klasse: "knopf", text: "Hoerfassung starten" });
    start.addEventListener("click", () => {
      elemente.vorleser.hidden = false;
      void player.start(0);
    });
    const zurLektion = el("button", { klasse: "knopf-rand", text: "Zur Lektion mit Experiment" });
    zurLektion.style.marginLeft = "8px";
    zurLektion.addEventListener("click", () => {
      window.location.hash = `#/lektion/${lektion.id}`;
    });
    knoepfe.append(start, zurLektion);
    wrapper.append(knoepfe);
    wrapper.append(
      el("p", {
        klasse: "hinweis",
        text: `Sprachausgabe ueber ${engine.name}; Tempo und Stimme stehen in den Einstellungen.`,
      }),
    );
    elemente.inhalt.append(wrapper);

    const abschnitte = lektion.sections
      .filter((s) => s.spoken.length > 0)
      .map((s) => ({ abschnittId: s.id, texte: bloeckeZuTexten(s.spoken) }));
    player.setzeAbschnitte(abschnitte);
    elemente.vorleser.hidden = abschnitte.length === 0;
    elemente.vorleserText.textContent = `Hoerfassung bereit: ${abschnitte.length} Abschnitte, keine Bedienung noetig.`;
  }

  // --- Vollbild (AND-05) --------------------------------------------------

  document.addEventListener("mlapp-vollbild", (event) => {
    const detail = (event as CustomEvent<{ experimentId: string; titel: string }>).detail;
    const experiment = experimentById(detail.experimentId);
    if (!experiment) return;
    oeffneVollbild(experiment.id, detail.titel);
  });

  function oeffneVollbild(experimentId: string, titel: string): void {
    const experiment = experimentById(experimentId);
    if (!experiment) return;
    schliesseVollbild();
    elemente.vollbildTitel.textContent = titel;
    elemente.vollbild.hidden = false;
    window.history.pushState({ vollbild: experimentId }, "");
    const store = createStore(experiment);
    const gespeichert = fortschritt.experimentZustand(experiment.id);
    if (gespeichert) store.restore(gespeichert);
    const host = el("div", { klasse: "experiment" });
    elemente.vollbildInhalt.append(host);
    vollbildAufraeumen = montiereExperiment({
      host,
      experiment,
      store,
      onStateChange: (zustand) => fortschritt.merkeExperiment(experiment.id, zustand),
      onEvent: (saetze) => {
        if (!fortschritt.einstellungen.speakEvents) return;
        for (const satz of saetze)
          void engine.sprich({
            text: satz,
            rate: fortschritt.einstellungen.rate,
            voiceUri: fortschritt.einstellungen.voiceUri,
          });
      },
    });
  }

  function schliesseVollbild(): void {
    if (elemente.vollbild.hidden) return;
    vollbildAufraeumen?.();
    vollbildAufraeumen = null;
    elemente.vollbildInhalt.textContent = "";
    elemente.vollbild.hidden = true;
    // Nach dem Schliessen die Zeichnung der Lektionsansicht neu berechnen.
    window.dispatchEvent(new Event("resize"));
  }

  elemente.vollbildZu.addEventListener("click", () => {
    if (history.state && typeof history.state === "object" && "vollbild" in history.state)
      history.back();
    else schliesseVollbild();
  });

  // --- Einstellungen ------------------------------------------------------

  function zeichneEinstellungen(): void {
    const einstellungen = fortschritt.einstellungen;
    elemente.einstellungenInhalt.textContent = "";

    const stimmen = engine.stimmen();
    if (stimmen.length > 0) {
      const label = el("label");
      label.append(el("span", { text: "Stimme" }));
      const auswahl = el("select");
      auswahl.style.maxWidth = "60%";
      const keine = el("option", { text: "Standardstimme", attrs: { value: "" } });
      auswahl.append(keine);
      for (const stimme of stimmen) {
        const option = el("option", { text: stimme.label, attrs: { value: stimme.uri } });
        auswahl.append(option);
      }
      auswahl.value = einstellungen.voiceUri;
      auswahl.addEventListener("change", () =>
        fortschritt.setzeEinstellungen({ voiceUri: auswahl.value }),
      );
      label.append(auswahl);
      elemente.einstellungenInhalt.append(label);
    } else {
      elemente.einstellungenInhalt.append(
        el("p", {
          klasse: "hinweis",
          text: `Keine Stimmenliste verfuegbar (Engine: ${engine.name}).`,
        }),
      );
    }

    const tempo = el("label");
    tempo.append(el("span", { text: "Lesetempo" }));
    const tempoRegler = el("input");
    tempoRegler.type = "range";
    tempoRegler.min = "0.5";
    tempoRegler.max = "2";
    tempoRegler.step = "0.05";
    tempoRegler.value = String(einstellungen.rate);
    const tempoWert = el("span", { text: `${einstellungen.rate.toFixed(2).replace(".", ",")}x` });
    tempoRegler.addEventListener("input", () => {
      const wert = Number(tempoRegler.value);
      tempoWert.textContent = `${wert.toFixed(2).replace(".", ",")}x`;
      fortschritt.setzeEinstellungen({ rate: wert });
      elemente.vorleserTempo.value = String(wert);
    });
    tempo.append(tempoRegler, tempoWert);
    elemente.einstellungenInhalt.append(tempo);

    const schalter = (text: string, wert: boolean, setzen: (neu: boolean) => void): HTMLElement => {
      const label = el("label");
      label.append(el("span", { text }));
      const box = el("input");
      box.type = "checkbox";
      box.checked = wert;
      box.style.minWidth = "44px";
      box.style.minHeight = "44px";
      box.addEventListener("change", () => setzen(box.checked));
      label.append(box);
      return label;
    };

    elemente.einstellungenInhalt.append(
      schalter("Automatisch zum gelesenen Absatz scrollen", einstellungen.autoScroll, (neu) =>
        fortschritt.setzeEinstellungen({ autoScroll: neu }),
      ),
      schalter("Absatz beim Vorlesen hervorheben", einstellungen.highlightParagraph, (neu) =>
        fortschritt.setzeEinstellungen({ highlightParagraph: neu }),
      ),
      schalter("Experimentereignisse ansprechen", einstellungen.speakEvents, (neu) =>
        fortschritt.setzeEinstellungen({ speakEvents: neu }),
      ),
    );

    const loeschen = el("button", { klasse: "knopf-rand", text: "Fortschritt loeschen" });
    loeschen.addEventListener("click", () => {
      window.localStorage.removeItem("mlapp.fortschritt.v1");
      window.location.reload();
    });
    elemente.einstellungenInhalt.append(loeschen);

    elemente.einstellungenInhalt.append(
      el("p", {
        klasse: "hinweis",
        text: `Schema ${catalogue.schemaVersion} · ${catalogue.lessons.length} Lektionen · Sprachausgabe ueber ${engine.name}`,
      }),
    );
  }

  // --- Vorleser -----------------------------------------------------------

  elemente.vorleserSpielen.addEventListener("click", () => {
    const spielt = elemente.vorleserSpielen.textContent === "⏸";
    if (spielt) {
      player.pause();
      elemente.vorleserSpielen.textContent = "▶";
      elemente.vorleserSpielen.setAttribute("aria-label", "Weiterlesen");
    } else {
      elemente.vorleserSpielen.textContent = "⏸";
      elemente.vorleserSpielen.setAttribute("aria-label", "Lesen anhalten");
      const lektion = aktuelleLektion;
      const gemerkt = lektion ? fortschritt.position(lektion.id) : undefined;
      const index = lektion && gemerkt ? lektion.sections.findIndex((s) => s.id === gemerkt) : 0;
      void player.start(Math.max(0, index));
    }
  });

  elemente.vorleserZurueck.addEventListener("click", () => {
    void player.voriger();
  });
  elemente.vorleserVor.addEventListener("click", () => {
    void player.naechster();
  });
  elemente.vorleserTempo.addEventListener("input", () => {
    fortschritt.setzeEinstellungen({ rate: Number(elemente.vorleserTempo.value) });
  });
  elemente.vorleserTempo.value = String(fortschritt.einstellungen.rate);

  elemente.einstellungenKnopf.addEventListener("click", () => {
    zeichneEinstellungen();
    elemente.einstellungenDialog.showModal();
  });

  elemente.zurueckKnopf.addEventListener("click", () => {
    if (!elemente.vollbild.hidden) {
      schliesseVollbild();
      return;
    }
    window.location.hash = "#/curriculum";
  });

  // --- Wechsel ------------------------------------------------------------

  function zeige(): void {
    leereAnsicht();
    const route = leseRoute(window.location.hash);
    switch (route.art) {
      case "start":
        setzeKopf("MLapp", false);
        zeichneStart();
        break;
      case "curriculum":
        setzeKopf("Curriculum", true);
        zeichneCurriculum();
        break;
      case "einstellungen":
        setzeKopf("Einstellungen", true);
        zeichneEinstellungen();
        elemente.einstellungenDialog.showModal();
        window.location.hash = "#/";
        break;
      case "lektion": {
        const lektion = lessonById(route.lektionId);
        if (!lektion) {
          setzeKopf("Unbekannte Lektion", true);
          elemente.inhalt.append(
            el("p", { klasse: "hinweis", text: `Die Lektion ${route.lektionId} gibt es nicht.` }),
          );
          return;
        }
        setzeKopf(lektion.title, true);
        zeichneLektion(lektion, route.abschnittId);
        break;
      }
      case "hoeren": {
        const lektion = lessonById(route.lektionId);
        if (!lektion) {
          setzeKopf("Unbekannte Lektion", true);
          elemente.inhalt.append(
            el("p", { klasse: "hinweis", text: `Die Lektion ${route.lektionId} gibt es nicht.` }),
          );
          return;
        }
        setzeKopf(`Hoerfassung: ${lektion.title}`, true);
        zeichneHoerfassung(lektion);
        break;
      }
    }
  }

  window.addEventListener("hashchange", zeige);
  window.addEventListener("popstate", () => {
    if (!elemente.vollbild.hidden) schliesseVollbild();
    else zeige();
  });

  zeige();
}
