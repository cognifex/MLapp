# MLapp

Deutschsprachige, interaktive Lernanwendung fuer die Theorie hinter Machine Learning und
moderner KI. Jeder Begriff bekommt ein bedienbares Experiment; Text, Grafik und Sprachausgabe
stammen aus **einer** strukturierten Lektion. Das vollstaendige Konzept steht in
[SPEZIFIKATION.md](SPEZIFIKATION.md).

## Voraussetzungen

- **Node 24** oder neuer (fuer Bau, Tests, Entwicklungsserver)
- **Fuer die Android-Debug-APK**: `aapt`, `javac` (JDK 17+), `d8`, `zipalign`, `apksigner`
  sowie ein Rahmenwerk-Jar `android.jar` (Vorgabe: `$HOME/android.jar`).
  Gradle wird **nicht** gebraucht.
- Fuer die Oberflaechenpruefung: Chromium oder Google Chrome.

## Befehle

    npm ci                    # Abhaengigkeiten (keine Laufzeitabhaengigkeiten, nur Werkzeuge)
    npm run typecheck         # TypeScript pruefen
    npm run lint              # ESLint
    npm run format:check      # Prettier (Schreibfassung: npm run format)
    npm test                  # Tests (baut vorher)
    npm run validate          # Lektionskatalog pruefen (IDs, Reihenfolge, Sprachtexte, Experimente)
    npm run ci                # alles hintereinander
    npm run build             # Web-Bau nach dist/
    npm run serve             # Entwicklungsserver auf http://127.0.0.1:8777
    npm run smoke             # Oberflaeche im Kopflosen Chromium messen und fotografieren
    npm run android:build     # Debug-APK nach android/build/mlapp-debug.apk

**Ausgabeorte:** `dist/` (Web-Fassung), `android/build/mlapp-debug.apk` (Android).
Der Pruefablauf mit allen Einzelheiten und den Eigenheiten auf Android steht in
[docs/pruefablauf.md](docs/pruefablauf.md).

## Aufbau

    app/index.html            Seite mit Kopfzeile, Ansichtsbereich, Vollbild, Vorleser, Einstellungen
    app/styles/app.css        Layout (einspaltig < 768 px, zweispaltig darueber, Safe Areas, dunkles Design)
    app/src/model/types.ts    Lektionsschema: unterscheidbare Vereinigungen statt unknown, versioniert
    app/src/model/validate.ts Laufzeit-Validator mit Datei- und Block-ID in jeder Meldung
    app/src/model/lessons/    Lektionen (lek-01 ...) und der Katalog
    app/src/experiment/       Vertrag (update/calculate), Zustandsspeicher, Experimente, Verzeichnis
    app/src/semantic/         Semantische Ereignisse, Erklaerungsregeln, Drosselung
    app/src/tts/              SpeechEngine (Huelle/Browser), Aussprachelexikon
    app/src/ui/               Rumpf, Ansichten, Touch-Bedienelemente, Zeichnung, Fortschritt, Formeln
    app/src/cli/validate.ts   Katalogpruefung fuer die Kommandozeile und CI
    android/                  Android-Huelle (WebView + Sprachdienst), ohne Gradle baubar
    tests/                    node:test-Pruefungen
    docs/adr/0001-...         Architekturentscheidung (AND-01)
    docs/lektion-bauen.md     Anleitung fuer neue Lektionen (Vertrag, Muster, IDs)
    docs/lektion-vorlage.md   didaktische Vorlage und redaktionelle Regeln (CONTENT-04)
    docs/pruefablauf.md       alle Pruefungen und die Eigenheiten auf Android
    docs/geraetepruefung.md   Handgriffe, die nur am Geraet zu pruefen sind
    tools/                    Entwicklungsserver, Kopieren der Anlagen, Zusammenbau des Katalogs

## Architektur in drei Saetzen

Die Inhalte sind TypeScript-Daten einer gemeinsamen Lektion; der sichtbare Text und die
Sprechfassung liegen nebeneinander im selben Abschnitt, damit nichts auseinanderlaeuft.
Jedes Experiment ist reine Mathematik: `update(zustand, aktion)` ist eine reine Funktion,
`calculate(zustand)` liefert Zahlen, Zeichnung und Saetze - die Oberflaeche rechnet nichts
selbst nach. Die Android-Huelle liefert nur aus und spricht: Details und die verworfenen
Alternativen in [docs/adr/0001-zielarchitektur.md](docs/adr/0001-zielarchitektur.md).

## Stand

* **Alle 44 Lektionen des Curriculums** sind umgesetzt: je ein bedienbares Experiment, ein
  durchgerechnetes Beispiel, eine Verstaendnisaufgabe mit Begruendung, eine Zusammenfassung und
  eine vollstaendige Sprechfassung. Dazu 44 Experimente und 19 Testdateien mit von Hand
  nachgerechneten Referenzwerten (264 Tests).
* Schema, Experiment-Vertrag, semantische Ereignisse, Fortschritt, Formelanzeige,
  Aussprachelexikon und Hoerfassung stehen; der Validator prueft jede Lektion mit Datei- und
  Block-ID.
* Die Android-Huelle baut eine signierte Debug-APK ohne Gradle und stellt die Sprachausgabe als
  Vordergrunddienst mit Mediensteuerung und Audio-Fokus bereit.
* Gemessen: Web-Bau 2,3 MB, 25.000 Zeilen TypeScript und Python, APK 554 KB mit allen Lektionen
  vollstaendig offline, Oberflaeche bereit nach rund 1 s, Zeichnen 3 bis 4 ms.

Offen sind neun Issues, die eine Pruefung am Geraet brauchen (Hoeren der Sprache, Bedienung mit
dem Finger, TalkBack, Geraetematrix). Die Handgriffe dafuer stehen in
[docs/geraetepruefung.md](docs/geraetepruefung.md).

Eine neue Lektion entsteht nach [docs/lektion-bauen.md](docs/lektion-bauen.md); die didaktischen
Anforderungen stehen in [docs/lektion-vorlage.md](docs/lektion-vorlage.md) und sind als Test
hinterlegt.
