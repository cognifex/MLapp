#!/data/data/com.termux/files/usr/bin/bash
# Baut die Android-Debug-APK ohne Gradle.
#
# Ablauf: Ressourcen und Manifest nach aapt, Java nach javac, Klassen nach d8,
# Dex in das Paket, ausrichten, signieren, pruefen.
#
# Voraussetzungen (Werte ueber die Umgebung einstellbar):
#   ANDROID_JAR               Rahmenwerk-Jar mit Ressourcen (Vorgabe: $HOME/android.jar, API 35)
#   ANDROID_KEYSTORE          Pfad zum Schluesselspeicher (Vorgabe: $HOME/.android/mlapp-debug.keystore)
#   ANDROID_KEYSTORE_PASSWORT Vorgabe: mlapp-debug
#   ANDROID_KEY_ALIAS         Vorgabe: mlapp-debug
set -e

WURZEL="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$WURZEL/android"
BAU="$ANDROID/build"
ANLAGEN="$BAU/anlagen"
WEB="$WURZEL/dist"
ANDROID_JAR="${ANDROID_JAR:-$HOME/android.jar}"
KEYSTORE="${ANDROID_KEYSTORE:-$HOME/.android/mlapp-debug.keystore}"
PASSWORT="${ANDROID_KEYSTORE_PASSWORT:-mlapp-debug}"
ALIAS="${ANDROID_KEY_ALIAS:-mlapp-debug}"
MIN_API=26

if [ ! -f "$ANDROID_JAR" ]; then
  echo "FEHLER: Rahmenwerk-Jar $ANDROID_JAR fehlt (ANDROID_JAR setzen)"
  exit 1
fi
if [ ! -f "$WEB/index.html" ]; then
  echo "FEHLER: dist/ fehlt - zuerst 'npm run build' ausfuehren"
  exit 1
fi

echo "== Verzeichnisse"
rm -rf "$BAU"
mkdir -p "$BAU/klassen" "$BAU/dex" "$ANLAGEN"

echo "== Symbol erzeugen"
python3 "$ANDROID/icon.py"

echo "== Web-Fassung als Anlagen uebernehmen"
cp -r "$WEB/." "$ANLAGEN/"

echo "== Ressourcen und Manifest"
aapt package -f -M "$ANDROID/AndroidManifest.xml" -S "$ANDROID/res" -A "$ANLAGEN" \
  -I "$ANDROID_JAR" -F "$BAU/unsigned.apk"

echo "== Java uebersetzen"
find "$ANDROID/java" -name '*.java' > "$BAU/quellen.txt"
javac -source 8 -target 8 -nowarn -classpath "$ANDROID_JAR" -d "$BAU/klassen" @"$BAU/quellen.txt" 2>&1 | grep -v "bootstrap class path" || true

echo "== Klassen nach Dex"
find "$BAU/klassen" -name '*.class' > "$BAU/klassen.txt"
d8 --min-api "$MIN_API" --output "$BAU/dex" @"$BAU/klassen.txt"
cp "$BAU/dex/classes.dex" "$BAU/classes.dex"
(cd "$BAU" && aapt add unsigned.apk classes.dex > /dev/null)

echo "== Ausrichten und signieren"
zipalign -f 4 "$BAU/unsigned.apk" "$BAU/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  echo "-- Schluesselspeicher wird angelegt: $KEYSTORE"
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$PASSWORT" -keypass "$PASSWORT" \
    -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=MLapp Debug, O=MLapp"
  chmod 600 "$KEYSTORE"
fi
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$PASSWORT" --key-pass "pass:$PASSWORT" \
  --out "$BAU/mlapp-debug.apk" "$BAU/aligned.apk"

echo "== Pruefen"
apksigner verify --verbose "$BAU/mlapp-debug.apk" | head -6
echo "-- Kennung und Fassung:"
aapt dump badging "$BAU/mlapp-debug.apk" | grep -E "^package|^launchable-activity|^sdkVersion|^targetSdkVersion|application-label"
echo "-- Eigene Berechtigungen:"
aapt dump permissions "$BAU/mlapp-debug.apk" | grep -v "uses-permission: name='android.permission.INTERNET'" | head -8
echo "== Ergebnis: $BAU/mlapp-debug.apk ($(du -h "$BAU/mlapp-debug.apk" | cut -f1))"
echo ==ENDE
