#!/usr/bin/env python3
"""Baut registry.ts und lessons/index.ts aus den vorhandenen Dateien zusammen.

Aufruf: python3 tools/zusammenbau.py   (aus dem Projektverzeichnis)
Damit muss niemand 40 Importzeilen von Hand pflegen, und die Reihenfolge kommt aus den
Lektionsnummern, nicht aus der Dateiliste.
"""
import os
import re
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LESSON_DIR = os.path.join(WURZEL, "app", "src", "model", "lessons")
EXP_DIR = os.path.join(WURZEL, "app", "src", "experiment")

KAPITEL = [
    ("kap-01", "Grundlagen: Funktionen, Vektoren, Matrizen"),
    ("kap-02", "Ableitung und Gradient"),
    ("kap-03", "Wahrscheinlichkeit, Entropie, Regression"),
    ("kap-04", "Klassifikation und Generalisierung"),
    ("kap-05", "Neuronale Netze"),
    ("kap-06", "Repraesentationen"),
    ("kap-07", "Sequenzen und Attention"),
    ("kap-08", "Sprachmodelle"),
    ("kap-09", "Diffusion"),
    ("kap-10", "Reinforcement Learning"),
    ("kap-11", "Gesamtsystem"),
]


def lese(pfad: str) -> str:
    with open(pfad, encoding="utf-8") as datei:
        return datei.read()


def schreibe(pfad: str, inhalt: str) -> None:
    with open(pfad, "w", encoding="utf-8") as datei:
        datei.write(inhalt)
    print(f"  geschrieben: {os.path.relpath(pfad, WURZEL)} ({len(inhalt)} Bytes)")


def sammle_lektonen():
    """Liest Nummer, Exportname und Experimentverweise je Lektionsdatei."""
    eintraege = []
    for name in sorted(os.listdir(LESSON_DIR)):
        treffer = re.fullmatch(r"lek-(\d+)\.ts", name)
        if not treffer:
            continue
        nummer = int(treffer.group(1))
        inhalt = lese(os.path.join(LESSON_DIR, name))
        export = re.search(r"export const (\w+): Lesson", inhalt)
        if not export:
            print(f"  WARNUNG: {name} hat keinen Export 'export const x: Lesson'")
            continue
        exp_ids = sorted(set(re.findall(r'"(exp-[a-z0-9-]+)"', inhalt)))
        kapitel = re.search(r'chapterId: "([^"]+)"', inhalt)
        eintraege.append(
            {
                "nummer": nummer,
                "datei": name,
                "basis": name[:-3],
                "export": export.group(1),
                "experimente": exp_ids,
                "kapitel": kapitel.group(1) if kapitel else "?",
            }
        )
    return sorted(eintraege, key=lambda e: e["nummer"])


def sammle_experimente():
    """Liest Experiment-ID, Exportname und Datei je Experimentdatei."""
    eintraege = []
    for name in sorted(os.listdir(EXP_DIR)):
        treffer = re.fullmatch(r"exp-[a-z0-9-]+\.ts", name)
        if not treffer:
            continue
        inhalt = lese(os.path.join(EXP_DIR, name))
        export = re.search(r"export const (\w+): Experiment", inhalt)
        id_treffer = re.search(r'id: "(exp-[a-z0-9-]+)"', inhalt)
        if not export or not id_treffer:
            print(f"  WARNUNG: {name} hat keinen Export 'export const x: Experiment' oder keine id")
            continue
        eintraege.append({"datei": name, "basis": name[:-3], "export": export.group(1), "id": id_treffer.group(1)})
    return sorted(eintraege, key=lambda e: e["id"])


def baue_registry(experimente):
    kopf = '''/**
 * Verzeichnis aller Experimente. Der Validator prueft Lektionsverweise gegen dieses Verzeichnis -
 * ein Tippfehler in einer Experiment-ID faellt damit im Test auf, nicht erst im Browser.
 *
 * Diese Datei wird von tools/zusammenbau.py erzeugt.
 */
import type { ExperimentId } from "../model/types.js";
import type { Experiment } from "./contract.js";
'''
    imports = "".join(f'import {{ {e["export"]} }} from "./{e["basis"]}.js";\n' for e in experimente)
    liste = ", ".join(e["export"] for e in experimente)
    rest = f'''
export const experiments: Experiment[] = [{liste}];

export function experimentById(id: ExperimentId): Experiment | undefined {{
  return experiments.find((e) => e.id === id);
}}

export function experimentIds(): string[] {{
  return experiments.map((e) => e.id);
}}
'''
    return kopf + imports + rest


def baue_lessons(lektionen):
    kopf = '''/**
 * Der Katalog: Kapitel und Lektionen in der Reihenfolge des Curriculums.
 * Die Zahlen in `number` muessen lueckenlos bei 1 beginnen - der Validator prueft das.
 *
 * Diese Datei wird von tools/zusammenbau.py erzeugt.
 */
import type { Catalogue, Chapter, Lesson } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";
'''
    imports = "".join(f'import {{ {l["export"]} }} from "./{l["basis"]}.js";\n' for l in lektionen)
    kapitel = "export const chapters: Chapter[] = [\n"
    for i, (kid, titel) in enumerate(KAPITEL, start=1):
        kapitel += f'  {{ id: "{kid}", title: "{titel}", order: {i} }},\n'
    kapitel += "];\n"
    liste = ", ".join(l["export"] for l in lektionen)
    rest = f'''
export const lessons: Lesson[] = [{liste}];

export const catalogue: Catalogue = {{
  schemaVersion: SCHEMA_VERSION,
  chapters,
  lessons,
}};

export function lessonById(id: string): Lesson | undefined {{
  return lessons.find((l) => l.id === id);
}}

export function nextLessonId(id: string): string | undefined {{
  const index = lessons.findIndex((l) => l.id === id);
  return index >= 0 ? lessons[index + 1]?.id : undefined;
}}

export function previousLessonId(id: string): string | undefined {{
  const index = lessons.findIndex((l) => l.id === id);
  return index > 0 ? lessons[index - 1]?.id : undefined;
}}
'''
    return kopf + imports + kapitel + rest


def main():
    lektionen = sammle_lektonen()
    experimente = sammle_experimente()
    if not lektionen or not experimente:
        print("Nichts zu tun - keine Dateien gefunden"); return 1
    print(f"== {len(lektionen)} Lektionen, {len(experimente)} Experimente")
    schreibe(os.path.join(EXP_DIR, "registry.ts"), baue_registry(experimente))
    schreibe(os.path.join(LESSON_DIR, "index.ts"), baue_lessons(lektionen))

    # Gegenprobe: jede Experiment-ID einer Lektion muss registriert sein, und die Nummern
    # muessen lueckenlos sein.
    bekannt = {e["id"] for e in experimente}
    fehler = []
    for l in lektionen:
        for exp in l["experimente"]:
            if exp not in bekannt:
                fehler.append(f"lek-{l['nummer']:02d} verweist auf unbekanntes Experiment {exp}")
        if str(l["nummer"]) not in lese(os.path.join(LESSON_DIR, l["datei"])):
            fehler.append(f"{l['datei']}: Nummer {l['nummer']} nicht gefunden")
    nummern = [l["nummer"] for l in lektionen]
    luecken = [n for n in range(1, max(nummern) + 1) if n not in nummern]
    if luecken:
        fehler.append(f"fehlende Lektionsnummern: {luecken}")
    if fehler:
        print("== Beanstandungen:")
        for f in fehler:
            print("  " + f)
        return 1
    print("== Zusammenbau ohne Beanstandung")
    return 0


if __name__ == "__main__":
    sys.exit(main())
