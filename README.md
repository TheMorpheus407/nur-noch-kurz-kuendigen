# Nur noch kurz kündigen — technische Probe

Kurze, lokale Point-and-Click-/Visual-Novel-Probefassung (Empfangsraum-Ausschnitt).
Keine externen Skripte, keine Netzwerke, keine KI-Abhängigkeiten beim Spielen.

## Starten

**Einfachster Start (am bisherigen Stand extern in Chromium und Firefox bestätigt):**
`index.html` direkt im Browser öffnen (Datei über `file://` Doppelklick oder Menü).

**Optionale lokale Servervariante** (im Projektverzeichnis):

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann öffnen: http://127.0.0.1:8000/

## Anleitung (Spielfluss)

1. **MIRA (Gespräch)** anklicken → Dialog weiterklicken (Mehrfachklicks werden ignoriert).
2. **Auskunftsterminal** anklicken → Beweiskarte **E2** wird genau einmal in den Beweisordner gelegt.
3. **Beweisordner öffnen** → Titel und vollständiger Text von E2; Eintrag bleibt nach Schließen erhalten.
4. **Widerspruchsverfahren** → Behauptung von MIRA anzeigen, **Beweiskarte E2 vorlegen** → abgeschlossener Zustand.
5. **Neustart** (mit Bestätigung) → kompletter Zustand zurückgesetzt.

## Eigene Prüfung (durchgeführt)

- `node --check` auf allen `js/*.js`-Dateien: Syntaxprüfung, erfolgreich.
- Das war **ausschließlich** eine Syntaxprüfung — kein Browser- oder Funktionstest.

## Externe Browserprüfung (durch Cedric, nicht durch mich)

- Ausgeführt auf dem unveränderten Commit `47ad50e8e0b3e8700934f1cdba0383f8b7d8aaa5`.
- Ergebnis: Gespräch, E2-Einmaligkeit, Beweisordner, Abbruch ohne Verlust,
  Widerspruchsabschluss und beide Neustartentscheidungen funktionieren mit Maus
  in Chromium 153 und Firefox 148; direkter Start über `file://` und E2-Auflösen
  ebenfalls in beiden Browsern.
- Bekannter Restbefund vor dieser Reparatur: bei 320 CSS-Pixeln Fensterbreite
  läuft der Empfangsraum horizontal aus dem Bild (Dokumentbreite 335 px).

**Die jetzt reparierte Fassung (schmales-Layout-Fix + Favicon-Verweis) braucht
eine neue externe Browserprüfung durch Cedric.**

## Dateien

- `index.html` — Struktur, deutsche Beschriftungen, Tastaturzugriff, leerer eingebetteter Favicon-Verweis
- `css/style.css` — Darstellung, CSS-Platzhalterfiguren, gestapeltes Layout für schmale Fenster
- `js/content.js` — alle Texte und Karteninhalte
- `js/state.js` — Zustand und gegängigte Übergänge
- `js/ui.js` — Rendering und Ereignisverdrahtung
- `js/main.js` — Start

## Bewusste Grenzen dieser Probe

- Nur ein Raum (Empfangsraum), ein NPC (MIRA), eine Beweiskarte (E2), ein Widerspruchsverfahren, ein Abschlusszustand.
- Keine Bilder, Audio, kein zweiter Raum, keine weiteren Spielsysteme.
