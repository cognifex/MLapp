# Pruefablauf

Alle Befehle laufen aus dem Projektverzeichnis. Voraussetzung: Node 24 (und fuer die
Android-Debug-APK die Bauwerkzeuge aapt, javac, d8, zipalign, apksigner sowie ein
Rahmenwerk-Jar `android.jar`).

## Einmalig

    npm ci            # oder: npm install

## Regelpruefung (das, was CI bei jedem Push fahrt)

    npm run typecheck     # TypeScript ohne Ausgabe
    npm run lint          # ESLint
    npm run format:check  # Prettier
    npm test              # node:test - Schema, Experiment-Vertrag, Mathematik, Formeln, Fortschritt
    npm run validate      # Katalogpruefung: IDs, Reihenfolge, Sprachtexte, Experimentverweise
    npm run ci            # alles hintereinander

Der Katalog-Validator nennt bei jedem Verstoss **Datei und Block-ID**, zum Beispiel:

    app/src/model/lessons/index.ts [lek-04/s03] Sprechblock 1: "spoken" fehlt oder ist leer (Sprachtext)

## Oberflaeche pruefen (nicht behaupten, messen)

    npm run build
    bash scripts/ui-smoke.sh

Das Skript startet den Entwicklungsserver, laedt die Seite im Kopflosen Chromium und liest die
**Selbstauskunft** der App aus (Element `#selbstauskunft`, von `app/src/main.ts` gefuellt):

    Fensterbreite, Inhaltsbreite  -> waagerechtes Ueberlaufen wird gemessen, nicht geschaetzt
    Anzahl Abschnitte, Regler     -> die Ansicht ist wirklich aufgebaut
    Anzahl Farben in der Zeichnung-> eine leere Zeichenflaeche faellt auf (1 Farbe = leer)
    rohe Formel: true/false       -> im Text steht kein LaTeX

Es legt Bildschirmfotos unter dem angezeigten Arbeitsverzeichnis ab (500 und 1280 px breit).
**Diese Bilder ansehen** - Layoutfehler sieht man nur im Bild.

## Android-Debug-APK

    npm run android:build
    # Ergebnis: android/build/mlapp-debug.apk (signiert, ausgerichtet)

Der Bau legt beim ersten Mal einen Schluesselspeicher an
(`$HOME/.android/mlapp-debug.keystore`, Vorgabe-Passwort `mlapp-debug`). In CI wird ein eigener
Schluessel unter `$RUNNER_TEMP` erzeugt; privat bleibt er aus dem Repo heraus (`.gitignore`).

Einspielen auf dem Geraet: APK in den Download-Ordner legen und im Dateimanager antippen.
Ein stiller Einspielvorgang durch die App selbst ist auf diesem Android nicht moeglich.

## Besonderheiten auf Android/Termux (gemessen)

- **Shebangs fehlen:** `node_modules/.bin/tsc` beginnt mit `#!/usr/bin/env node`, und `/usr/bin/env`
  gibt es dort nicht (`bad interpreter`). Alle Skripte rufen die Werkzeuge deshalb ueber
  `node node_modules/<paket>/...` auf - das laeuft auf Android **und** in CI.
- **Kein `/tmp`:** Skripte legen ihre Zwischendateien unter `$TMPDIR`/`$HOME` an.
- **Chromium erzwingt 500 CSS-px Mindestbreite:** Breiten unter 500 lassen sich auf dem Geraet nicht
  messen. Die einspaltige Regel greift per `max-width: 767px` und deckt 360/412 mit ab; in CI
  (google-chrome) sind auch diese Breiten messbar.
- **`npx` findet lokale Werkzeuge nicht:** `npx tsc` endet mit `sh: 1: tsc: not found`. Deshalb
  immer die Pfadform aus `package.json` benutzen.

## Was die Tests abdecken (Bezug zu den Issues)

    tests/schema.test.ts      CONTENT-01: ungueltige IDs, fehlende Sprachtexte, unbekannter
                              Experimentverweis, falsche Reihenfolge - je mit Datei und Block-ID
    tests/contract.test.ts    CONTENT-02: Determinismus, Zuruecksetzen, Wertebereiche, Persistenz
    tests/mathematik.test.ts  nachgerechnete Referenzwerte der ersten fuenf Experimente
    tests/semantik.test.ts    CONTENT-03: Erklaerungen, Drosselung wiederholter Ereignisse
    tests/formel.test.ts      Formeln: kein rohes LaTeX im sichtbaren Text
    tests/progress.test.ts    AND-07: Fortschritt, Leseposition, robuste Speicherfehler
    tests/lexikon.test.ts     TTS-09 (Grundlage): Aussprachelexikon, Sprechtexte je Block
