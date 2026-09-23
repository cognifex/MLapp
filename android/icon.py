#!/usr/bin/env python3
"""Erzeugt das Anwendungssymbol als PNG - ohne Bildbibliothek, nur zlib und struct.

Aufruf: python3 android/icon.py
Ergebnis: android/res/mipmap-xxhdpi/ic_launcher.png (144x144)
"""
import os
import struct
import zlib

BREITE = 144
HOEHE = 144

# Farben: dunkler Grund, hellblaue Kurve, roter Punkt (wie im Funktionsgraphen).
HINTERGRUND = (11, 15, 20)
GITTER = (36, 48, 64)
KURVE = (45, 212, 191)
PUNKT = (217, 48, 37)


def kurve_y(x: int) -> int:
    """Parabel im Symbol: y = a * (x - mitte)^2 + fuss."""
    mitte = BREITE / 2
    a = 0.012
    return int(HOEHE - 24 - a * (x - mitte) ** 2)


def farbe_fuer(x: int, y: int) -> tuple:
    for gitter_x in range(0, BREITE, 24):
        if abs(x - gitter_x) <= 1:
            return GITTER
    for gitter_y in range(0, HOEHE, 24):
        if abs(y - gitter_y) <= 1:
            return GITTER
    ky = kurve_y(x)
    if abs(y - ky) <= 2:
        return KURVE
    if abs(x - int(BREITE * 0.72)) <= 6 and abs(y - kurve_y(int(BREITE * 0.72))) <= 6:
        return PUNKT
    return HINTERGRUND


def baue_png(pfad: str) -> None:
    rohdaten = bytearray()
    for y in range(HOEHE):
        rohdaten.append(0)  # Filterart 0 je Zeile
        for x in range(BREITE):
            r, g, b = farbe_fuer(x, y)
            rohdaten.extend((r, g, b))

    def block(art: bytes, daten: bytes) -> bytes:
        return (struct.pack(">I", len(daten)) + art + daten
                + struct.pack(">I", zlib.crc32(art + daten) & 0xFFFFFFFF))

    kopf = struct.pack(">IIBBBBB", BREITE, HOEHE, 8, 2, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n" + block(b"IHDR", kopf)
           + block(b"IDAT", zlib.compress(bytes(rohdaten), 9)) + block(b"IEND", b""))

    os.makedirs(os.path.dirname(pfad), exist_ok=True)
    with open(pfad, "wb") as datei:
        datei.write(png)
    print(f"{pfad} geschrieben ({len(png)} Bytes, {BREITE}x{HOEHE})")


if __name__ == "__main__":
    ziel = os.path.join(os.path.dirname(os.path.abspath(__file__)), "res", "mipmap-xxhdpi", "ic_launcher.png")
    baue_png(ziel)
