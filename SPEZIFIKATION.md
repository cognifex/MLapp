# MLapp – Produktspezifikation

**Stand:** 23. September 2026  
**Status:** Entwurf für die Umsetzung

## Ziel

MLapp ist eine deutschsprachige, interaktive Lernanwendung für die Theorie hinter Machine Learning und moderner KI. Sie führt ohne vorausgesetzte ML-Kenntnisse von Funktionen, Vektoren und Ableitungen über Regression und neuronale Netze bis zu Transformern, Sprachmodellen, Diffusion und Reinforcement Learning.

Jeder wesentliche Begriff erhält ein **programmiertes, veränderbares visuelles Experiment**. Lernende verändern Eingaben oder Parameter und sehen die Auswirkungen auf Berechnung, Grafik und Erklärung. Dieselben Lektionen funktionieren auf Android und im Vorlesemodus.

## Lernprinzipien

1. Konzepte werden in Abhängigkeitsreihenfolge erklärt. Mathematik wird eingeführt, sobald ein Beispiel sie benötigt.
2. Jede Lektion verbindet eine kurze Erklärung, ein selbst bedienbares Experiment und eine gesprochene Fassung.
3. Visualisierungen zeigen tatsächliche Berechnungen; illustrative Vereinfachungen werden als solche bezeichnet.
4. Kleine Implementierungen mit Python und NumPy machen die Mechanik sichtbar. Später werden dieselben Schritte mit PyTorch verglichen.
5. Jede Lektion endet mit einer kurzen Verständnisaufgabe und einer nachvollziehbaren Lösung.

## Curriculum und visuelle Experimente

Die folgende Reihenfolge ist ein Arbeitsplan. Zusammengehörige Themen können in einzelne Lektionen aufgeteilt werden.

| Nr. | Thema                           | Interaktives Experiment                                            |
| --: | ------------------------------- | ------------------------------------------------------------------ |
|   1 | Funktionen                      | x verändern und y im Funktionsgraphen verfolgen                    |
|   2 | Vektoren                        | Vektoren ziehen, addieren und Skalarprodukt beobachten             |
|   3 | Matrizen                        | Punktewolke durch eine Matrix transformieren                       |
|   4 | Ableitung                       | Tangente entlang eines Graphen bewegen                             |
|   5 | Gradient                        | Richtung des stärksten Anstiegs auf einer Loss-Fläche erkunden     |
|   6 | Wahrscheinlichkeit              | Verteilungen einstellen und Stichproben ziehen                     |
|   7 | Entropie                        | Wahrscheinlichkeiten ändern und Entropie vergleichen               |
|   8 | Lineare Regression              | Datenpunkte bewegen und eine Gerade anpassen                       |
|   9 | Loss                            | Residuen und mittleren quadratischen Fehler anzeigen               |
|  10 | Gradient Descent                | Lernrate ändern und Parameterupdates verfolgen                     |
|  11 | Klassifikation                  | Entscheidungsgrenze zwischen Datenpunkten verschieben              |
|  12 | Logistische Regression          | Sigmoid, Wahrscheinlichkeit und Schwelle einstellen                |
|  13 | Overfitting                     | Modellkomplexität und Trainings-/Testfehler vergleichen            |
|  14 | Regularisierung                 | Stärke der Regularisierung verändern                               |
|  15 | Neuron                          | Eingaben, Gewichte, Bias, Summe und Aktivierung verfolgen          |
|  16 | MLP                             | Datenfluss durch mehrere Schichten schrittweise anzeigen           |
|  17 | Aktivierungen                   | ReLU, Sigmoid und GELU als Funktionen vergleichen                  |
|  18 | Backpropagation                 | Rechengraph vorwärts und Gradienten rückwärts durchlaufen          |
|  19 | Optimizer                       | SGD, Momentum und Adam auf derselben Loss-Fläche vergleichen       |
|  20 | Embeddings                      | Vektoren und Ähnlichkeit im niedrigdimensionalen Beispiel erkunden |
|  21 | Latent Space                    | Zwischen gelernten Repräsentationen interpolieren                  |
|  22 | Autoencoder                     | Eingabe, Bottleneck und Rekonstruktion vergleichen                 |
|  23 | VAE                             | Latentverteilung verändern und Stichproben erzeugen                |
|  24 | Sequenzen                       | Rekurrenten Zustand Schritt für Schritt aktualisieren              |
|  25 | Attention                       | Tokenbeziehungen und Attention-Matrix untersuchen                  |
|  26 | Query, Key, Value               | Scores, Softmax-Gewichte und gewichtete Werte berechnen            |
|  27 | Multi-Head Attention            | Verschiedene Heads und ihre Ausgaben vergleichen                   |
|  28 | Transformer                     | Datenfluss durch einen vereinfachten Block verfolgen               |
|  29 | Tokenisierung                   | Text in Tokens zerlegen und IDs ansehen                            |
|  30 | Softmax                         | Logits verändern und Wahrscheinlichkeiten beobachten               |
|  31 | Sprachmodell                    | Bedingte Verteilung des nächsten Tokens untersuchen                |
|  32 | Sampling                        | Temperatur, Top-k und Top-p vergleichen                            |
|  33 | Sprachmodelltraining            | Vorhersage, Cross-Entropy und Update durchlaufen                   |
|  34 | Diffusion: Vorwärtsprozess      | Bild schrittweise verrauschen                                      |
|  35 | Diffusion: Rückwärtsprozess     | Denoising-Schritte und Fehler sichtbar machen                      |
|  36 | Conditioning                    | Einfluss einer Bedingung auf den Denoising-Prozess erkunden        |
|  37 | Reinforcement Learning          | Agenten in einer Grid World steuern                                |
|  38 | Value Function                  | Erwartete Returns der Zustände einfärben                           |
|  39 | Q-Learning                      | Q-Werte während des Lernens verfolgen                              |
|  40 | Policy                          | Aktionswahrscheinlichkeiten je Zustand anzeigen                    |
|  41 | Policy Gradient                 | Policy-Update nach einer Episode nachvollziehen                    |
|  42 | Actor-Critic                    | Policy und Wertschätzung gemeinsam beobachten                      |
|  43 | Präferenzbasiertes Posttraining | Antworten, Präferenzen und vereinfachtes Update untersuchen        |
|  44 | Gesamtsystem                    | Kleines autoregressives Transformer-Modell von Tokens bis Ausgabe  |

**Abschlussprojekt:** Ein kleines Zeichenmodell mit Tokenisierung, Embeddings, Self-Attention, Transformer-Block, Cross-Entropy, Training und autoregressiver Generierung selbst programmieren. Die genaue Trainingsimplementierung darf PyTorch für automatische Differentiation verwenden; die zuvor erklärten Rechenschritte bleiben separat nachvollziehbar.

## Plattform: Android und Desktop

Die Zielarchitektur wird vor der Implementierung entschieden. Zu prüfen sind responsive Web-App/PWA, Tauri 2 für Android, Capacitor und eine native Android-Hülle. Entscheidungskriterien sind gemeinsame Codebasis, Touch, Offline-Nutzung, lokale Speicherung, Vorlesen im Hintergrund, Mediensteuerung, Build und Wartungsaufwand. Eine PWA allein darf nicht als Lösung für Hintergrundwiedergabe angenommen werden, bevor das Zielverhalten auf Android geprüft wurde.

### Anforderungen

- Smartphone ab etwa 360 CSS-Pixeln Breite, Tablet und Desktop; Hoch- und Querformat.
- Normale Lektionsinhalte ohne horizontales Scrollen. Komplexe Experimente können eine anpassbare Vollbildansicht erhalten.
- Sämtliche Interaktionen funktionieren mit Touch; Hover hat eine Tap-Alternative. Bedienelemente haben ausreichend große Touch-Ziele.
- Android-System-Back schließt zuerst Dialoge oder Vollbildexperimente und navigiert danach innerhalb der App.
- Lektionslinks, Fortschritt, Experimentparameter und Vorleseposition sind wiederherstellbar.
- Heruntergeladene beziehungsweise bereits bereitgestellte Lektionen, Formeln und Experimente funktionieren offline. Der genaue Umfang des Offline-Pakets wird festgelegt.
- Animationen pausieren außerhalb des sichtbaren Bereichs; aufwendige Berechnungen blockieren die Bedienung nicht.

## Vorlesemodus

Eine Lektion kann abschnittsweise vorgelesen werden. Die Oberfläche bietet Start, Pause, Fortsetzen, Stop, vorherigen/nächsten Abschnitt, Geschwindigkeit und verfügbare Stimmen. Der aktuelle Abschnitt wird hervorgehoben; automatisches Scrollen ist abschaltbar. Ein Tap auf einen Absatz kann dort starten.

Inhalte werden als semantische Sprechblöcke modelliert: Überschrift, Absatz, Formel, Beispiel, Code-Erklärung, Frage und Beschreibung eines Experiments. Formeln erhalten einen expliziten Sprechtext, etwa „y ist gleich w mal x plus b“; rohes LaTeX wird nicht vorgelesen. Code hat eine verständliche gesprochene Erklärung oder wird auf Wunsch übersprungen. Sprachmarkierungen und ein Aussprachelexikon helfen bei englischen Fachbegriffen.

Jedes Experiment enthält eine Beschreibung von Zweck und Bedienung. Bedeutungsvolle Zustandswechsel können optional gesprochen werden; wiederholte Slideränderungen werden gedrosselt. Ein Audioformat für weitgehend bildschirmfreies Lernen führt durch Lernziel, Theorie, Beispiel, Beschreibung des Experiments, Ergebnis und Zusammenfassung. Interaktionsstellen können übersprungen werden.

Für Android werden Hintergrundwiedergabe, Sperrbildschirmsteuerung, Headset-Tasten und Audio-Fokus als verbindliche Anforderungen geprüft und in der gewählten Laufzeitumgebung umgesetzt. Das Verhalten bei Anrufen und unterbrochener Wiedergabe wird definiert und getestet.

## Gemeinsames Inhalts- und Experimentmodell

Text, Darstellung und Sprache stammen aus einer gemeinsamen strukturierten Lektion; es gibt keine separat gepflegte Android-Fassung.

```ts
type Lesson = {
  id: string;
  title: string;
  learningGoals: string[];
  sections: Section[];
};

type Section = {
  id: string;
  kind:
    "heading" | "paragraph" | "equation" | "example" | "code" | "experiment" | "quiz" | "summary";
  visualContent: unknown;
  spokenContent: SpokenBlock[];
  experimentId?: string;
};

type Experiment = {
  id: string;
  learningGoal: string;
  instructions: string;
  spokenDescription: string;
  controls: ControlDefinition[];
  initialState: unknown;
  semanticEvents: string[];
};
```

Ein semantisches Ereignis wie `lossIncreased` aktualisiert Grafik, Zahlenwert, Erklärung und optional Sprachausgabe. Die konkrete Typisierung, Serialisierung und Versionierung wird bei der Umsetzung festgelegt.

## Definition of Done für jede Lektion

- Lernziel, benötigtes Vorwissen, Erklärung, Experiment, Übung und Lösung sind vorhanden.
- Das Experiment reagiert nachvollziehbar auf Eingaben; wichtige Zwischenschritte sind sichtbar.
- Touch- und Tastaturbedienung sind möglich. Screenreader erhalten Labels, sinnvolle Fokusreihenfolge und eine textliche Alternative. Farbe allein trägt keine entscheidende Information.
- Eine hörbare Fassung aller wesentlichen Inhalte ist vorhanden; Mathematik, Code und Experimente sind verständlich beschrieben.
- Auf einem kleinen Android-Smartphone und einem größeren Display ist die Lektion benutzbar; Rotation und App-Neustart verlieren keinen gespeicherten Fortschritt.
- Die Lektion funktioniert im festgelegten Offline-Umfang.
- Fachliche Beispiele und Formeln wurden anhand einer Referenzrechnung geprüft.

## Umsetzungs-Backlog

### A. Android

- **AND-01:** Zielarchitektur evaluieren und Entscheidung dokumentieren.
- **AND-02:** Responsive App-Oberfläche für Smartphone und Tablet.
- **AND-03:** Touch-Bedienung für alle Experimente.
- **AND-04:** Mobile Regeln für Grafiken, Matrizen und Netze.
- **AND-05:** Vollbildansicht mit Zustandserhalt.
- **AND-06:** Android-Navigation, Zurück-Taste und Lektionslinks.
- **AND-07:** Lokaler Lernfortschritt und Wiederaufnahme.
- **AND-08:** Offline-Inhalte und Offline-Anzeige.
- **AND-09:** Performance-Budget und Messungen auf Android.

### B. Vorlesen

- **TTS-01:** Austauschbare Schnittstelle zur Sprach-Engine.
- **TTS-02:** Lektionsplayer mit Navigation und Geschwindigkeitswahl.
- **TTS-03:** Semantische Sprechblöcke im Inhaltsformat.
- **TTS-04:** Absatz-Highlighting und optional Wort-Highlighting, falls die Engine Zeitinformationen liefert.
- **TTS-05:** Sprechtexte für mathematische Formeln.
- **TTS-06:** Gesprochene Beschreibung jedes Experiments.
- **TTS-07:** Optionales, gedrosseltes Audiofeedback zu Zustandsänderungen.
- **TTS-08:** Dauerhafte Einstellungen für Stimme, Sprache und Geschwindigkeit.
- **TTS-09:** Sprachmarkierungen und Ausspracheausnahmen.
- **TTS-10:** Gesprochene Erklärungen zu Code.
- **TTS-11:** Android-Hintergrundwiedergabe und Mediensteuerung.
- **TTS-12:** Hörfassung einer Lektion mit überspringbaren Interaktionen.

### C. Inhalte und Qualität

- **CONTENT-01:** Versioniertes Lektionsschema für Text, Grafik und Sprache.
- **CONTENT-02:** Einheitliches Schema und Zustandsmodell für Experimente.
- **CONTENT-03:** Semantische Ereignisse für Erklärung und Feedback.
- **QA-01:** Gerätematrix: kleines/großes Smartphone, Tablet, Rotation, Lautsprecher, Bluetooth-Headset, helles/dunkles Design.
- **QA-02:** TalkBack, Tastatur, Fokus, Textalternativen und Kontrast prüfen.
- **QA-03:** Regressionstests für gesprochene Formeln, Code und Sprachwechsel.
- **QA-04:** Reproduzierbare Messungen für Ladezeit, Bildrate und Speicherbedarf der anspruchsvollsten Experimente.

## Erste umsetzbare Etappe

1. Architekturentscheidung anhand eines Android-Prototyps mit Hintergrundvorlesen und Touch-Experiment treffen.
2. Gemeinsames Schema für Lektion und Experiment definieren.
3. Erste Lerneinheit „Funktionen, Steigung, Ableitung, Gradient“ mit vier interaktiven Experimenten erstellen.
4. Diese Einheit auf Android und Desktop sowie mit TalkBack und Vorlesemodus prüfen.
5. Erkenntnisse in Komponenten und Definition of Done zurückführen, bevor das restliche Curriculum umgesetzt wird.
