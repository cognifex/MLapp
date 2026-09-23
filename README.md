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
    tools/                    Entwicklungsserver und Kopieren der Anlagen

## Architektur in drei Saetzen

Die Inhalte sind TypeScript-Daten einer gemeinsamen Lektion; der sichtbare Text und die
Sprechfassung liegen nebeneinander im selben Abschnitt, damit nichts auseinanderlaeuft.
Jedes Experiment ist reine Mathematik: `update(zustand, aktion)` ist eine reine Funktion,
`calculate(zustand)` liefert Zahlen, Zeichnung und Saetze - die Oberflaeche rechnet nichts
selbst nach. Die Android-Huelle liefert nur aus und spricht: Details und die verworfenen
Alternativen in [docs/adr/0001-zielarchitektur.md](docs/adr/0001-zielarchitektur.md).

## Stand

- Lektionen 1 bis 5 aus dem Curriculum sind umgesetzt (Funktionen, Vektoren, Matrizen,
  Ableitung, Gradient) - mit Experiment, Quiz, Zusammenfassung und Sprechfassung.
- Schema, Experiment-Vertrag, semantische Ereignisse, Fortschritt, Formelanzeige und
  Aussprachelexikon stehen; der Validator prueft jede Lektion mit Datei- und Block-ID.
- Die Android-Huelle baut eine signierte Debug-APK ohne Gradle und stellt die Sprachausgabe als
  Vordergrunddienst mit Mediensteuerung und Audio-Fokus bereit.

Die Lehren 6 bis 44 sind noch offen; das Muster fuer eine neue Lektion steht fest:
Lektion nach `lek-NN`, Experiment nach `exp-name`, Regler nach dem Vertrag, Sprechtexte fuer
jeden Block - dann `npm run validate` und `npm test` laufen lassen.
