#!/data/data/com.termux/files/usr/bin/bash
# Oberflaechenpruefung mit dem Kopflosen Chromium: JS-Fehler, Messwerte aus dem DOM, Bilder.
#
# Aufruf: bash scripts/ui-smoke.sh [verzeichnis] [port]
# Auf dem Geraet liegt Chromium unter $PREFIX/lib/chromium/chrome; in CI heisst die Datei
# google-chrome oder chromium.
#
# Geprueft wird, was die App selbst misst (Element #selbstauskunft): Fensterbreite,
# Inhaltsbreite und ob ein Bereich waagerecht ueberlaeuft. Damit ist "kein waagerechtes Scrollen"
# eine Messung und keine Behauptung.
set -e
DIR=${1:-dist}
PORT=${2:-8788}
BREITEN="500 768 1280"
# Hinweis: das Chromium auf diesem Geraet erzwingt eine Mindestfensterbreite von 500 CSS-px.
# Kleinere Werte (360, 412) lassen sich damit nicht messen; die einspaltige Regel gilt per
# max-width: 767px und deckt diese Breiten ab. In CI (google-chrome) sind 360/412 messbar.

finde_browser() {
  for kandidat in "$PREFIX/lib/chromium/chrome" google-chrome chromium chromium-browser; do
    if command -v "$kandidat" >/dev/null 2>&1; then echo "$kandidat"; return 0; fi
    if [ -x "$kandidat" ]; then echo "$kandidat"; return 0; fi
  done
  echo ""
}

BROWSER=$(finde_browser)
if [ -z "$BROWSER" ]; then
  echo "Kein Chromium gefunden - Pruefung uebersprungen"
  exit 0
fi

cd "$(dirname "$0")/.."
ARBEIT=$(mktemp -d "${TMPDIR:-$HOME}/mlapp-smoke.XXXXXX")
node tools/serve.mjs "$DIR" "$PORT" > "$ARBEIT/serve.log" 2>&1 &
SERVE_PID=$!
trap 'kill $SERVE_PID 2>/dev/null || true' EXIT
sleep 2

rufe() {
  "$BROWSER" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --force-device-scale-factor=1 --virtual-time-budget=6000 "$@" 2>>"$ARBEIT/chrome.log"
}

echo "== Browsername: $BROWSER"
echo "== Startseite"
rufe --window-size=412,900 --dump-dom "http://127.0.0.1:$PORT/" > "$ARBEIT/start.html" || true
echo "-- Kopfzeile:"; grep -o 'class="app-header"' "$ARBEIT/start.html" | wc -l
echo "-- Knopf:"; grep -o "Curriculum oeffnen" "$ARBEIT/start.html" | head -1 || true
echo "-- Startfehler:"; grep -o "konnte nicht starten[^<]*" "$ARBEIT/start.html" | head -1 || true

echo "== Lektion bei mehreren Breiten"
for B in $BREITEN; do
  rufe --window-size="$B,900" --dump-dom "http://127.0.0.1:$PORT/#/lektion/lek-01" > "$ARBEIT/l-$B.html" || true
  ZEILE=$(grep -o 'id="selbstauskunft"[^>]*' "$ARBEIT/l-$B.html" | head -1)
  BREITE=$(echo "$ZEILE" | grep -o 'data-breite="[0-9]*"' | cut -d'"' -f2)
  SCROLL=$(echo "$ZEILE" | grep -o 'data-scrollbreite="[0-9]*"' | cut -d'"' -f2)
  UEBERLAUF=$(echo "$ZEILE" | grep -o 'data-ueberlauf="[^"]*"' | cut -d'"' -f2)
  ABSCHNITTE=$(echo "$ZEILE" | grep -o 'data-abschnitte="[0-9]*"' | cut -d'"' -f2)
  REGLER=$(echo "$ZEILE" | grep -o 'data-regler="[0-9]*"' | cut -d'"' -f2)
  ZEICHNUNG=$(echo "$ZEILE" | grep -o 'data-zeichnung="[0-9]*"' | cut -d'"' -f2)
  ANZEIGE=$(echo "$ZEILE" | grep -o 'data-zweispaltig="[^"]*"' | cut -d'"' -f2)
  FARBEN=$(echo "$ZEILE" | grep -o 'data-zeichnungfarben="[0-9]*"' | cut -d'"' -f2)
  FORMELROH=$(echo "$ZEILE" | grep -o 'data-formelroh="[a-z]*"' | cut -d'"' -f2)
  echo "  ${B}px: Fenster ${BREITE}px, Inhalt ${SCROLL}px, Abschnitte ${ABSCHNITTE}, Regler ${REGLER}, Zeichnungen ${ZEICHNUNG} (${FARBEN} Farben), rohe Formel: ${FORMELROH}, Anzeigeart ${ANZEIGE}"
  if [ "$SCROLL" -gt "$BREITE" ]; then
    echo "     UEBERLAUF: Inhalt ist breiter als das Fenster -> $UEBERLAUF"
    FEHLER=1
  fi
  if [ "$FARBEN" -lt 3 ]; then
    echo "     ZEICHNUNG: zu wenige Farben - die Zeichenflaeche ist offenbar leer"
    FEHLER=1
  fi
  if [ "$FORMELROH" = "true" ]; then
    echo "     FORMEL: im Text steht noch rohes LaTeX"
    FEHLER=1
  fi
done

echo "== Bilder"
rufe --window-size=500,900 --screenshot="$ARBEIT/telefon.png" "http://127.0.0.1:$PORT/#/lektion/lek-01" > /dev/null || true
rufe --window-size=1280,900 --screenshot="$ARBEIT/gross.png" "http://127.0.0.1:$PORT/#/lektion/lek-01" > /dev/null || true
ls -l "$ARBEIT/telefon.png" "$ARBEIT/gross.png" 2>/dev/null | awk '{print "  " $5 " Bytes " $9}'

echo "== Konsolenfehler"
grep -iE "error|exception|failed" "$ARBEIT/chrome.log" | grep -viE "gpu|sandbox|dbus|GLES|vulkan|Fontconfig|inotify|NETLINK" | head -10 || true

if [ -n "$FEHLER" ]; then
  echo "== ERGEBNIS: Ueberlauf festgestellt"
  echo "== Arbeitsverzeichnis: $ARBEIT"
  exit 1
fi
echo "== ERGEBNIS: kein waagerechter Ueberlauf, Abschnitte und Zeichnungen vorhanden"
echo "== Arbeitsverzeichnis: $ARBEIT"
echo ==ENDE
