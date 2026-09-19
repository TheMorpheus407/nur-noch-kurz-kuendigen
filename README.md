# Nur noch kurz kündigen

**Überarbeitete Arbeitsfassung zur Durchsicht, keine finale Abnahme.** MIRA, Alex Plus und Rolf haben jeweils eine eigene lokal trainierte Charakter-LoRA; ausgewählte Bilder sind eingebaut. Bühne, Dialogführung, Rätselpräsentation und beide Enden wurden überarbeitet. Die vollständige Hörabnahme steht aus. Dieses Repository wird privat gepflegt.

Du willst das Abo für deinen digitalen Doppelgänger kündigen. Der Kundenservice
hat Rückfragen. Dein Doppelgänger auch. Und der Ficus weiß mehr, als er sollte.

Ein kurzes deutsches Point-and-Click-Spiel im Graphic-Novel-Stil: zwei Räume,
drei Widersprüche und zwei Enden.

## Spielen

Das vollständige Spielpaket herunterladen, entpacken und `index.html` im Browser
öffnen. Die Ordner `assets`, `css` und `js` müssen daneben liegen bleiben.
Mit **Stimmen an** aktivierst du die vorbereiteten Dialogstimmen.

Du brauchst zum Spielen keine KI-Modelle, keine KI-Grafikkarte und keine
Internetverbindung. Code, Bilder und Stimmen liegen im Paket. Das Spiel führt
keine Modellinferenz aus und verwendet keine externen Skripte oder Schriftarten.

Die markierten Orte in den Räumen führen zu Gesprächen und Beweisen.
Ihre Namen erscheinen bei Zeigerkontakt oder Tastaturfokus; auf schmalen
Bildschirmen stehen sie in einer beschrifteten Liste.
Gefundene Karten bleiben im Beweisordner. Das Widerspruchsverfahren öffnest du
über die Werkzeugleiste. Dialoge lassen sich mit **Weiter** lesen; **Escape**
schließt das zuletzt geöffnete Panel. Alle Aktionen sind auch per Tastatur
erreichbar.

Unter **Weitere Aktionen** findest du Verlauf, **Speichern** und **Stand laden**.
Speichern verwendet den Browserspeicher. Falls dieser
blockiert ist, weist das Spiel auf die nur temporäre Speicherung hin. Nach dem
Ende führt **Zum Entscheidungspunkt** zur anderen möglichen Wahl zurück.

Optional kannst du im Spielordner einen lokalen Server starten:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Danach im Browser `http://127.0.0.1:8000/` öffnen.

## Herstellung

Begleitprojekt zu einem gesponserten Video für The Morpheus mit ALTERNATE,
AMD und Samsung. Auftrag und kreative
Entscheidungen: Cedric. Cedric bediente die Werkzeuge, formulierte die
Entwicklungsaufträge und prüfte die Ergebnisse in seinem Auftrag.

- Spielcode und Dialogdaten entstanden in tatsächlich protokollierten lokalen
  Qwen3.8-27B-Läufen. Cedric ergänzte dokumentierte direkte Korrekturen an
  Speicherrandfällen, Darstellung, Syntax, Audioauswahl und Bühnenlayout.
  Auch die abschließende Straffung von NPC-Nachgesprächen und des W2-Pflichtwegs
  ist gesondert als direkte Kuration durch Cedric dokumentiert.
  Der Qwen-Auftrag für die Endinszenierung erreichte nach seiner Syntaxprüfung
  die Rundengrenze. Sein ursprünglicher Teilstand und die anschließenden
  Korrekturen von Cedric an Zeitpunkt, Portraitdarstellung und schmalen Ansichten
  sind als getrennte Commits erhalten.
  Auch zurückgenommene, unvollständige Modellversuche bleiben in der
  Git-Historie nachvollziehbar; diese unterscheidet die Beiträge.
- Die fünf bisherigen Spielbilder entstanden mit lokalem Krea 2 Turbo FP8.
  MIRA und Alex Plus sind ausgewählte Ausschnitte aus Figurenbögen; Rolf stammt
  direkt aus dem Vorführraum. Diese fünf Grafiken verwenden keine Charakter-LoRA.
  Drei zusätzliche MIRA-Ausdrucksbilder (Lächeln, Skepsis und Überraschung)
  und zwei Alex-Plus-Ausdrücke (besorgt und erleichtert) entstanden lokal mit
  Krea 2 Turbo FP8 und jeweils einer eigenen auf Krea 2 RAW trainierten
  Charakter-LoRA. Die Trainingssätze dieser beiden Figuren bestehen jeweils
  aus vier Ausschnitten eines einzelnen Figurenbogens; die gewählten Bilder
  sind kein Nachweis beliebiger zuverlässiger Posen. Rolf erhielt einen eigenen
  Adapter aus vier vollständigen, getrennt erzeugten Krea-Bildern. Eine ausgewählte
  neue Ganzansicht ersetzt sein altes Gesprächsportrait; angeschnittene und doppelte
  Pflanzenansichten wurden verworfen. Auch Rolfs Pose bleibt weitgehend aufrecht.
  Der alte Raumcrop bleibt als Original enthalten, wird als Portrait jedoch nicht
  mehr verwendet. Alle elf Bilder sind feste PNGs. Bildherkunft, Adapter und
  Prüfsummen stehen in `assets/art/provenance.json`.
- Die 45 vorbereiteten Sprachdateien stammen aus lokalem Qwen3-TTS mit den von
  Cedric gewählten Stimmreferenzen MIRA B, Alex Plus A und Rolf. Alex als
  Spielerfigur bleibt stumm. Alternative Enden sind enthalten; die summierte
  Audiodauer entspricht deshalb keiner gemessenen Spielzeit. MIRA und Alex
  haben einen konstanten Pegelabgleich erhalten; Rolf bleibt unverändert.
  Bei zwölf MIRA-/Alex-Plus-Dateien wurde außerdem nur der anfängliche leise
  Vorlauf gekürzt; 160 Millisekunden vor dem ersten definierten Signal bleiben
  stehen. Die erhaltenen Sprachsamples, inneren Pausen, Enden, das Tempo und
  die Besetzung bleiben gleich. `assets/audio/provenance.json` nennt
  Bearbeitung und Herkunft je Datei. Automatische Transkription fand keine
  bedeutungsrelevante Textabweichung; sie bewertet keine Schauspielqualität.

Die Modellinferenz lief auf dem Testrechner. Cedric unterstützte die Bedienung
und Prüfung extern. Modellgewichte und private Produktionsprotokolle sind
nicht Teil dieses Repositories. Alle Firmen und Verfahren im Spiel sind fiktiv.
