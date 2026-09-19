# Nur noch kurz kündigen — technische Probe

Kurze, lokale Point-and-Click-/Visual-Novel-Probefassung (Empfangsraum-Ausschnitt).
Keine externen Skripte, keine Netzwerke, keine KI-Abhängigkeiten beim Spielen.

## Starten (lokaler statischer Webserver)

Im Projektverzeichnis (dieses Verzeichnis) eine Variante wählen:

```bash
python3 -m http.server 8000
# oder
npx serve .
# oder
php -S localhost:8000
```

Dann im Browser öffnen: http://localhost:8000/

## Geprüfter Spielfluss

1. **MIRA (Gespräch)** anklicken → Dialog weiterklicken (Mehrfachklicks werden ignoriert).
2. **Auskunftsterminal** anklicken → Beweiskarte **E2** wird genau einmal in den Beweisordner gelegt.
3. **Beweisordner öffnen** → Titel und vollständiger Text von E2; Eintrag bleibt nach Schließen erhalten.
4. **Widerspruchsverfahren** → Behauptung von MIRA anzeigen, **Beweiskarte E2 vorlegen** → abgeschlossener Zustand.
5. **Neustart** (mit Bestätigung) → kompletter Zustand zurückgesetzt.

## Dateien

- `index.html` — Struktur, deutsche Beschriftungen, Tastaturzugriff
- `css/style.css` — Darstellung, CSS-Platzhalterfiguren
- `js/content.js` — alle Texte und Karteninhalte
- `js/state.js` — Zustand und gegängigte Übergänge
- `js/ui.js` — Rendering und Ereignisverdrahtung
- `js/main.js` — Start

## Bewusste Grenzen dieser Probe

- Nur ein Raum (Empfangsraum), ein NPC (MIRA), eine Beweiskarte (E2), ein Widerspruchsverfahren, ein Abschlusszustand.
- Keine Bilder, Audio, kein zweiter Raum, keine weiteren Spielsysteme.
