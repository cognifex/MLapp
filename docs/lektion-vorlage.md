# Didaktische Lektionsvorlage und redaktionelle Pruefung

Diese Vorlage sagt, was eine Lektion enthalten muss, damit sie im Kurs bestehen kann. Die
maschinelle Fassung dieser Regeln steht in `tests/didaktik.test.ts` – was dort fehlschlaegt, ist
redaktionell nicht fertig.

## Aufbau einer Lektion

| Abschnitt  | Pflicht             | Inhalt                                                    |
| ---------- | ------------------- | --------------------------------------------------------- |
| heading    | ja                  | Ueberschrift der Lektion, ein Satz zum Einstieg           |
| paragraph  | ja                  | Worum es geht, ohne Fachjargon, mit Bezug auf Bekanntes   |
| equation   | bei formalen Themen | Die Formalie, plus ausgeschriebener Sprechtext            |
| experiment | ja                  | Bedienbares Experiment mit Sprechbeschreibung             |
| example    | ja (oder code)      | Durchgerechnetes Beispiel mit sichtbarem Rechenweg        |
| code       | optional            | Kurzes Python-Stueck, das dasselbe Verfahren zeigt        |
| quiz       | ja                  | Verstaendnisaufgabe mit richtiger Antwort und Begruendung |
| summary    | ja                  | Zusammenfassung in zwei bis drei Saetzen                  |

Reihenfolge: erst das Problem und die Anschauung, dann die Formalie, dann das Bedienen, dann das
Rechnen, zuletzt die Pruefung. Ein Beispiel vor der Formalie ist erlaubt; eine Formalie ohne
vorherigen Abschnitt nicht.

## Redaktionelle Regeln

1. **Jede Zahl ist nachgerechnet.** Werte in Text, Sprechtext und Quiz stammen aus `calculate()`
   oder aus einem von Hand nachgerechneten Beispiel. Keine Schaetzung, keine Beispielzahl aus dem
   Gefuehl.
2. **Kein Begriff ohne Anschauung.** Ein neuer Fachbegriff bekommt im selben Abschnitt ein Bild,
   eine Rechnung oder ein Experiment.
3. **Sprache ist gleichwertig.** Jeder sichtbare Inhalt hat eine Sprechfassung; Formeln werden
   ausgeschrieben ("y Dach ist gleich w mal x plus b"), nicht als LaTeX gesprochen.
4. **Englische Fachbegriffe bleiben englisch und bekommen eine Ausspracheregel** im Lexikon
   (`app/src/tts/lexicon.ts`), sobald sie im Sprechtext vorkommen.
5. **Fehler sind erlaubt, aber benannt.** Wer eine Vereinfachung benutzt (z. B. Zufall ohne echten
   Zufallsgenerator, damit die Anzeige reproduzierbar bleibt), schreibt das in einem Satz hin.
6. **Aufgaben pruefen Verstaendnis, nicht Gedaechtnis.** Die falschen Antworten sind typische
   Denkfehler, nicht Unsinn; die Begruendung sagt, warum die richtige Antwort stimmt.
7. **Gleichbehandlung der Bedienwege.** Was mit dem Finger geht, geht auch mit der Tastatur; Farbe
   traegt nie allein eine Information.

## Pruefung vor dem Einstellen

    npm run validate      # Schema, IDs, Reihenfolge, Sprachtexte, Experimentverweise
    npm test              # inklusive tests/didaktik.test.ts und tests/tts-regression.test.ts
    npm run smoke         # Oberflaeche messen und ansehen

Danach von Hand: Experiment einmal selbst bedienen (reagiert es nachvollziehbar?), die Lektion
vorlesen lassen (ist die Sprachfassung verstaendlich ohne Bild?) und die Rechnung des Beispiels
nachrechnen. Erst dann gehoert die Lektion in den Katalog.
