# Nur noch kurz kündigen

Dein Abo-Doppelgänger Plus hat in deinem Namen die ersehnte Einladung
abgesagt, damit du bloß nicht enttäuscht wirst. Du kündigst das Abo
also kurzerhand, und prompt läuft es zwölf Monate weiter. Im Kundencenter
von NEBENBEI deckst du im Kreuzverhör auf, wer hier wirklich verlängert hat.

Ein kurzes, humorvolles Visual Novel über Absagen, Doppelgänger und
Kleingedrucktes. Du beginnst an deinem eigenen Schreibtisch und kommst am
Ende genau dort wieder an.

## Spielen

Das vollständige Paket entpacken und `index.html` im Browser öffnen. Die
Ordner `assets`, `css` und `js` müssen daneben bleiben. Optional kann im
Spielordner ein lokaler Server gestartet werden:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann `http://127.0.0.1:8000/` öffnen.

Das Spiel braucht weder Internet, KI-Modelle noch eine besondere Grafikkarte.
Es ist eine lokale statische Anwendung ohne externe Bibliotheken, Schriften
oder Telemetrie. Die Dialogstimmen werden über die Tonsteuerung im Menü oder
oben im Fenster aktiviert; die Untertitel bleiben immer sichtbar.

Eine komplette Runde dauert etwa 15 bis 20 Minuten. Es gibt zwei Enden.

## Bedienung

- Markierte Stellen in der Szene einfach anklicken.
- Weiter geht es per Klick auf die Textbox oder mit der Leertaste.
- Die **Notizen** enthalten deine Unterlagen, den bisherigen Dialog und auf
  Wunsch auch Hinweise.
- Im **Menü** liegen Speichern, Laden und Neustart.
- Nach dem Ende lässt sich per „Zum Entscheidungspunkt" der erreichte Punkt
  für den anderen Weg laden.

## Wie das Spiel entstanden ist

- Idee, Story, Spieldesign, Regie und Qualitätskontrolle: Cedric (The
  Morpheus).
- Qwen3.8-27B, lokal auf einer AMD Radeon AI PRO R9700 in einer
  ALTERNATE-Workstation: Spielcode der ersten Fassungen, die
  Visual-Novel-Oberfläche, das Kreuzverhör, das Wartungsterminal, der
  Laptop-Bildschirm und das Titelbild, Erweiterungen der Spiellogik, Pointen
  und Korrektorat der Dialoge sowie Blind-Testspiele als Spieletester. Qwen
  spielte das Spiel dabei nur anhand von Screenshots und gab Feedback.
- Krea 2 Turbo FP8 in ComfyUI: Hintergründe und Figuren; drei lokal
  trainierte Charakter-LoRAs für MIRA, Alex Plus und Rolf; Freistellung der
  Figuren mit BiRefNet in ComfyUI.
- Qwen3-TTS: Stimmen von MIRA, Alex Plus und Rolf; Prüfung der Aufnahmen mit
  Whisper large-v3. Alles lokal.
- Wo die lokalen Modelle Fehler machten, hat Cedric korrigiert und
  nachgebessert. Herstellungsprotokolle sind nicht Teil des Spielpakets.

## Hinweise

Alle Firmen, Figuren und Vertragsregeln im Spiel sind fiktiv. Das Projekt
entstand als Begleitprojekt zu einem gesponserten Video für The Morpheus mit
ALTERNATE, AMD und Samsung.
