/**
 * Pruefungen des Fortschrittsspeichers (AND-07).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Fortschrittsspeicher,
  SCHLUESSEL,
  parseFortschritt,
  type Speicher,
} from "../app/src/ui/progress.js";

function attrape(anfang: Record<string, string> = {}): Speicher & { daten: Map<string, string> } {
  const daten = new Map<string, string>(Object.entries(anfang));
  return {
    daten,
    getItem: (k) => daten.get(k) ?? null,
    setItem: (k, v) => {
      daten.set(k, v);
    },
  };
}

test("beschaedigter Speicherinhalt faellt auf den Leerzustand zurueck", () => {
  assert.equal(parseFortschritt("{kein json").version, 1);
  assert.equal(parseFortschritt('{"version":99}').version, 1);
  assert.deepEqual(parseFortschritt(null).fertigeAbschnitte, {});
});

test("Abschnitte und Positionen werden gemerkt und wieder gelesen", () => {
  const speicher = attrape();
  const fortschritt = new Fortschrittsspeicher(speicher);
  fortschritt.abschnittFertig("lek-01/s01");
  fortschritt.abschnittFertig("lek-01/s02");
  fortschritt.merkePosition("lek-01", "lek-01/s02");
  fortschritt.merkeExperiment("exp-funktionen", '{"a":1}');

  const zweiterStart = new Fortschrittsspeicher(speicher);
  assert.equal(zweiterStart.istAbschnittFertig("lek-01/s01"), true);
  assert.equal(zweiterStart.istAbschnittFertig("lek-01/s03"), false);
  assert.equal(zweiterStart.position("lek-01"), "lek-01/s02");
  assert.equal(zweiterStart.experimentZustand("exp-funktionen"), '{"a":1}');
});

test("Anteil und Fertigstellung rechnen richtig", () => {
  const fortschritt = new Fortschrittsspeicher(attrape());
  const abschnitte = ["lek-01/s01", "lek-01/s02", "lek-01/s03", "lek-01/s04"];
  assert.equal(fortschritt.anteil("lek-01", abschnitte), 0);
  fortschritt.abschnittFertig("lek-01/s01");
  fortschritt.abschnittFertig("lek-01/s02");
  assert.equal(fortschritt.anteil("lek-01", abschnitte), 0.5);
  assert.equal(fortschritt.istLektionFertig(abschnitte), false);
  fortschritt.abschnittFertig("lek-01/s03");
  fortschritt.abschnittFertig("lek-01/s04");
  assert.equal(fortschritt.istLektionFertig(abschnitte), true);
});

test("Einstellungen werden ergaenzt, nicht verloren", () => {
  const speicher = attrape();
  const fortschritt = new Fortschrittsspeicher(speicher);
  fortschritt.setzeEinstellungen({ rate: 1.4 });
  fortschritt.setzeEinstellungen({ speakEvents: true });
  assert.equal(fortschritt.einstellungen.rate, 1.4);
  assert.equal(fortschritt.einstellungen.speakEvents, true);
  assert.equal(fortschritt.einstellungen.autoScroll, true, "Vorgabe bleibt erhalten");
  assert.ok(speicher.daten.has(SCHLUESSEL));
});

test("ein gesperrter Speicher wirft nicht", () => {
  const gesperrt: Speicher = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Speicher voll");
    },
  };
  const fortschritt = new Fortschrittsspeicher(gesperrt);
  assert.doesNotThrow(() => fortschritt.abschnittFertig("lek-01/s01"));
});
