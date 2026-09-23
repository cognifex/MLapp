# ADR 0001 – Zielarchitektur der MLapp

**Stand:** 23. September 2026
**Status:** angenommen
**Bezug:** Issue #1 (AND-01), SPEZIFIKATION.md (Abschnitt „Plattform: Android und Desktop“)

## Kurzfassung der Entscheidung

Eine **gemeinsame Web-Fassung** (TypeScript, ohne Geruestbibliothek) ist die Anwendung. Auf
Android laeuft sie in einer **eigenen Huellen-App**: ein WebView, das die gebauten Dateien ueber
einen kleinen lokalen Server ausliefert, plus ein **Vordergrunddienst fuer die Sprachausgabe**
(TextToSpeech, MediaSession, Audio-Fokus, Aufwecken bei ausgeschaltetem Bildschirm).

Kein Capacitor, kein Tauri 2, keine reine PWA. Begruendung und Messungen unten.

## Gepruefte Grundlage (Messungen am 23.09.2026)

    Werkzeugkette auf dem Geraet (Termux):
      aapt 0.2-android-16.0.0_r4, apksigner 0.9, zipalign, javac/openjdk 21.0.12, d8 9.2.4
      Rahmenwerk-Jar mit Ressourcen: $HOME/android.jar (27 MB, API 35)
      node 24.18.0, npm 12.1.0 (ueber corepack), python3 3.12.12, Chromium unter $PREFIX/lib/chromium
      NICHT vorhanden: Gradle, Rust/cargo, Android-SDK-Verwaltung, Android NDK

Damit sind Capacitor und Tauri 2 auf diesem Geraet nicht baubar: beide verlangen fuer die
Android-Seite ein Gradle-Projekt, Tauri zusaetzlich Rust und das NDK. Ein Bau waere nur ueber
einen Rechner oder CI moeglich - dann aber liesse sich die App auf dem Geraet nicht mehr
selbst bauen und pruefen, und genau das ist hier die Bedingung.

## Warum keine reine PWA

Eine PWA allein darf laut Spezifikation nicht als Loesung fuer Hintergrundwiedergabe angenommen
werden. Zu Recht: Hintergrund-Audio, Sperrbildschirmsteuerung und Kopfloerertasten sind in
WebView/Chrome von der Heuristik des Browsers abhaengig, wenn keine laufende
Medienwiedergabe vorliegt. Die Anforderungen TTS-11 (Hintergrundwiedergabe, Mediensteuerung,
Audio-Fokus, Anruf-Verhalten) sind ohne eigenen Android-Dienst nicht verbindlich erfuellbar.

## Warum das WebView keine Nachteile kostet, die hier zaehlen

- **Offline:** Die Anlagen liegen im APK. Der lokale Server liefert sie ohne Netz aus.
- **Rotationsverlust:** Der WebView behaelt den Zustand (`configChanges` im Manifest), der
  Lernfortschritt liegt zusaetzlich in localStorage.
- **Zurueck-Taste:** Die Oberflaeche fuehrt einen Verlauf (Hash-Adressen); die Aktivitaet gibt
  „zurueck“ an den WebView weiter, solange dieser Verlauf hat.
- **Sprache:** laeuft ueber den Dienst, nicht ueber den WebView - deshalb ist Bildschirm-aus
  unproblematisch.

## Aufbau der Huelle

    android/java/net/mlapp/huelle/
      MainActivity.java   WebView, Zurueck-Taste, Bruecke window.MLappTTS, Rueckruf an die Seite
      TtsDienst.java      Vordergrunddienst: TextToSpeech, MediaSession, Audio-Fokus, WakeLock
      LokalerServer.java  liefert dist/ aus den Anlagen ueber 127.0.0.1 aus (ES-Module brauchen HTTP)

Der lokale Server ist kein Luxus: ueber `file://` verweigert der WebView das Nachladen von
ES-Modulen (CORS). Klartext-HTTP auf der Schleifenadresse ist im Manifest ausdruecklich erlaubt.

**Schnittstelle zwischen Seite und Huelle** (in `app/src/tts/speech.ts` als `AndroidSpeechEngine`
verdrahtet):

    window.MLappTTS.speak(text, rate, voice, kennung)   // kennung beliebig, pro Block eindeutig
    window.MLappTTS.stop() | .pause() | .resume()
    window.MLappTTS.voices()                            // JSON: [{uri,label,sprache}]
    window.__mlappTtsFertig(kennung)                    // ruft die Huelle nach jeder Aeusserung auf

Bewusst blockweise: Jeder Sprechblock der Lektion ist eine Aeusserung. Damit sind Hervorhebung,
„naechster Abschnitt“ und eine ehrliche Pause auf Blockgrenzen moeglich - Android-TTS kennt kein
Pausieren innerhalb eines Satzes.

## Folgen

- Inhalte werden **einmal** gepflegt (gemeinsame Lektionen), es gibt keine zweite Android-Fassung.
- Der Android-Anteil bleibt klein (drei Dateien) und mit aapt/javac/d8/apksigner baubar - ohne Gradle.
- Desktop laeuft ueber `npm run serve` im Browser; CI prueft Web und Android mit denselben Skripten.
- Offene Punkte: Die Installation auf dem Geraet braucht einen Tipp des Nutzers (Android laesst
  keinen stillen Einspielvorgang durch die App selbst zu), und die Sprachausgabe bei
  ausgeschaltetem Bildschirm muss am Geraet gehoert werden - Zahlen und Messwerte ersetzen kein Ohr.

## Verworfene Alternativen

| Variante                     | Warum verworfen                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Reine PWA                    | Hintergrundwiedergabe und Mediensteuerung nicht verbindlich; Spezifikation verbietet die Annahme ausdruecklich |
| Capacitor                    | Android-Seite ist ein Gradle-Projekt; Gradle fehlt auf dem Geraet, Selbstbau unmoeglich                        |
| Tauri 2                      | verlangt Rust, Android-NDK und Gradle - drei fehlende Werkzeugketten                                           |
| Native Android (Java/Kotlin) | zweite Inhaltsfassung; widerspricht „gemeinsame strukturierte Lektion“                                         |
| Flutter                      | eigene Sprache und Laufzeit, kein Vorteil bei Text-plus-Canvas, zusaetzliche Kette nicht vorhanden             |

## Nachvollziehen

    npm ci
    npm run build
    npm test                     # Schema, Vertrag, Mathematik, Formeln, Fortschritt
    npm run validate             # Katalogpruefung
    bash scripts/ui-smoke.sh     # Oberflaeche im Kopflosen Chromium (Messwerte + Bilder)
    bash scripts/build-android.sh   # Debug-APK ohne Gradle

Ergebnisse: `dist/` (Web), `android/build/mlapp-debug.apk` (Android).
