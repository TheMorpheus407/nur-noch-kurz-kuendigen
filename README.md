# Nur noch kurz kündigen

**Neufassung in Arbeit.** Die frühere Gestaltungsabnahme wurde nach Cedrics
Spieldurchgang am 21.09.2026 zurückgenommen. Dieser Entwicklungszweig baut
Einstieg, Handlung, Spiellogik und Oberfläche grundlegend neu. Eine neue
Abnahme liegt noch nicht vor; die vorhandenen Stimmen werden nach dem
vollständigen Spieldurchgang neu erzeugt und geprüft. Das Repository bleibt privat.

Deine digitale Kopie hat einen Termin abgesagt, auf den du dich gefreut hast.
Du willst wieder selbst entscheiden. Aber nachdem du das Abo kündigst,
erscheint plötzlich eine neue Laufzeit.

Eine kurze deutsche Graphic Novel mit Erkundung, einem Dokumentwiderspruch,
einem Vorher-/Nachher-Versuch und zwei unterschiedlichen Endwegen. Du beginnst
an deinem eigenen Schreibtisch und kommst am Ende dorthin zurück.

## Spielen

Das vollständige Paket entpacken und `index.html` im Browser öffnen. Die Ordner
`assets`, `css` und `js` müssen daneben bleiben. Die Szene füllt die Browserfläche;
Gespräche stehen unten. Markierte Gegenstände lassen sich anklicken oder per
Tastatur erreichen. Die angebotenen Entscheidungen führen den Fall weiter.

**Notizen** enthalten dein aktuelles Anliegen, gefundene Unterlagen und den
bisherigen Dialog. Hinweise werden auf Nachfrage angezeigt. Im **Menü** liegen
Speichern, Laden und Neustart. Nach dem Ende lässt sich der erreichte
Entscheidungspunkt für den anderen Weg laden. Bei blockiertem Browserspeicher
funktioniert nur der temporäre Speicher derselben Sitzung.

Die fertige Fassung benötigt zum Spielen weder Internet noch KI-Modelle oder
eine KI-Grafikkarte. Die Modellinferenz findet bei der Herstellung statt;
das Spiel selbst ist eine lokale statische Anwendung ohne externe Bibliotheken,
Schriften oder Telemetrie. Dialogstimmen werden über die Tonsteuerung aktiviert,
Untertitel bleiben sichtbar. Alex als Spielerfigur wird nicht gesprochen.

Optional kann im Spielordner ein lokaler Server gestartet werden:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8000/` öffnen. Alle Firmen, Figuren und Vertragsregeln
im Spiel sind fiktiv.

## Herstellung und Urheberschaft

Begleitprojekt zu einem gesponserten Video für The Morpheus mit ALTERNATE,
AMD und Samsung. Auftrag, kreative Vorgaben und Korrekturen aus Spielersicht:
Cedric. Cedric bedient und prüft die Werkzeuge.

Die Beiträge werden getrennt ausgewiesen:

- Die ursprüngliche Fassung und die neue Oberfläche entstanden in
  protokollierten lokalen Qwen3.8-27B-Läufen. Die Neufassung verwendet direkte
  Korrekturen von Cedric für Bedienung und Integration. Ein gesonderter lokaler
  Qwen-Lauf überarbeitet die Bildführung der Oberfläche.
- Mehrere lokale Entwürfe für Handlung und Spiellogik verletzten wesentliche
  Anforderungen oder waren nicht durchspielbar. Sie bleiben als verworfene
  Herstellungsbelege erhalten. Der neue kausale Aufbau, die korrigierten
  Dialogdaten und der überarbeitete Zustandsautomat stammen ausdrücklich von
  Cedric. Diese Arbeit wird nicht als rein lokal erzeugter Spielcode ausgegeben.
- Die Hintergründe und Figurenbilder wurden auf dem Testrechner mit Krea 2
  Turbo FP8 erzeugt. Für MIRA, Alex Plus und Rolf bestehen eigene lokal trainierte
  Charakter-LoRAs. Die Figurenblätter von MIRA und Alex Plus liefern jeweils
  vier Trainingsausschnitte; Rolfs Adapter nutzt vier separat erzeugte Bilder.
  Die verwendeten Ausdrücke sind kein Nachweis beliebiger zuverlässiger Posen.
  Der neue Schreibtischhintergrund verwendet keinen Charakteradapter.
  `assets/art/provenance.json` bindet die einzelnen Bilder, Modelle, Adapter
  und Prüfsummen.
- Die ausgewählte Besetzung für lokale Qwen3-TTS-Aufnahmen bleibt MIRA B,
  Alex Plus A und Rolf. Neue Texte erfordern neue Aufnahmen. Ihr vollständiger
  Abgleich mit Katalog, Sprachdateien und frischen Whisper-Transkriptionen
  gehört vor die fertige Lieferung. Automatische Transkription und
  Signalprüfung ersetzen kein persönliches Probehören und keine menschliche
  Schauspielbewertung.

Die Werkzeugbedienung lief extern; Modellinferenz und Medienerzeugung erfolgten
auf dem Testrechner. Modellgewichte und private Produktionsprotokolle sind
nicht Teil des Spielpakets. Technische Funktion, Verständlichkeit des
Spielablaufs und subjektiver Spielspaß werden bei der Prüfung getrennt behandelt.
