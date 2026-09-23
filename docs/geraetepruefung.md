# Pruefliste am Geraet

Alles, was ich selbst messen kann, ist gemessen: Tests, Katalogpruefung, Oberflaechenmessung im
Kopflosen Chromium, Bau der APK, CI. Diese Liste enthaelt genau das, wozu Augen und Ohren am
Geraet noetig sind. Sie deckt die noch offenen Issues ab: #1 (AND-01), #2 (AND-02), #3 (AND-03),
#5 (AND-06), #7 (AND-05), #14 (TTS-04), #20 (TTS-11), #25 (QA-01), #26 (QA-02).

## Vorbereiten

1. `mlapp-debug.apk` im Download-Ordner antappen und installieren (Android verlangt einen Tipp).
2. App starten. Erwartet: Kopfzeile "MLapp", Titel "Machine Learning verstehen", Knopf
   "Curriculum oeffnen", Hinweis auf die Sprachausgabe (in der Huelle: "Android-Huelle").
3. Benachrichtigung erlauben, wenn danach gefragt wird (fuer das Vorlesen im Hintergrund).

## Bedienung mit dem Finger (#3, AND-03)

4. Lektion 1 oeffnen, Regler "x" ziehen: der rote Punkt wandert auf der Kurve, y und Steigung
   aendern sich mit.
5. Im Experiment der Lektion 5 den Punkt ziehen: der Farbverlauf bleibt stehen, der Pfeil am
   Punkt dreht sich mit; der Punkt laesst sich nicht aus der Flaeche ziehen.
6. Waehrend des Ziehens darf die Seite **nicht** mitscrollen. Ausserhalb der Zeichenflaeche muss
   das Scrollen weiter funktionieren.
7. Regler mit der Tastatur aendern (Tab bis zum Regler, dann Pfeiltasten) - geht nur mit
   angeschlossener Tastatur oder am Desktop; im Browser pruefen.

## Vorlesen (#14, #20, TTS-04 und TTS-11)

8. In Lektion 1 "Als Hoerfassung abspielen" waehlen, dann "Hoerfassung starten".
   Erwartet: Abschnitte werden der Reihe nach gesprochen, der laufende Abschnitt ist im Text
   hervorgehoben, die Vorleserleiste zeigt den aktuellen Satz.
9. Tempo im Vorleser aendern (Regler) - die naechsten Bloecke werden schneller/langsamer.
10. **Bildschirm ausschalten** (Seitentaste), waehrend gelesen wird: das Vorlesen laeuft weiter.
11. Am Sperrbildschirm Pause und Fortsetzen ausprobieren.
12. Kopfhoerer anschliessen: die Taste am Kopfhoerer soll pausieren und wieder fortsetzen.
13. Einen Anruf annehmen oder eine andere App mit Ton starten: das Vorlesen haelt an und
    laeuft danach nicht von selbst wieder los.

## Navigation und Rotation (#5, #7, AND-06, AND-05)

14. Eine Lektion oeffnen, dann die Systemtaste "zurueck": zuerst schliesst sich das Vollbild
    (falls offen), danach geht es im Verlauf zurueck, und aus der Lektion heraus ins Curriculum.
15. Im Vollbild (Symbol oben rechts im Experiment) das Geraet drehen: Zeichnung und Regler
    bleiben erhalten, nichts wird abgeschnitten.
16. App komplett schliessen (aus dem Umschalter wischen) und neu starten: Fortschritt,
    Experimentwerte und Leseposition sind noch da.

## Darstellung (#2, QA-01, AND-02)

17. Kleines Smartphone und Tablet (falls vorhanden): Lerntext ohne waagerechtes Scrollen,
    auf grossen Bildschirmen Curriculum links und Lektion rechts.
18. Helles und dunkles Systemdesign umstellen: Text bleibt lesbar, Farbe traegt nie allein die
    Information (Kurven und Punkte sind beschriftet, Werte stehen als Zahlen daneben).
19. Lautsprecher und Bluetooth-Headset: Sprache kommt verstaendlich an, keine Verzerrung.

## Bildschirmleser (#26, QA-02)

20. TalkBack einschalten und Lektion 1 durchgehen: jede Schaltflaeche wird angesagt, die
    Zeichenflaeche hat eine Beschreibung ("Funktionsgraph von ... mit ... Kurven"), Regler nennen
    ihren Wert ("1,5"), die Reihenfolge der Fokussierung ist lesbar.
21. Kontrast im dunklen Design pruefen (Einstellungen des Systems).

## Was zurueckzumelden ist

Kurz und konkret, je Punkt: "geht" oder "geht nicht, und zwar so: ...". Bei Sprache und Ton
zusaetzlich, ob die Aussprache verstaendlich ist - Fachbegriffe wie Gradient, Attention,
Embedding sind im Aussprachelexikon (`app/src/tts/lexicon.ts`) hinterlegt und dort aenderbar.
