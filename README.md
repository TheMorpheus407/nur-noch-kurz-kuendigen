# Nur noch kurz kündigen

Vollständige lokale Textfassung (Graphic-Novel-Textprototyp) eines
Retrofuturistischen Kundencenters: Alex will das Abo für seinen digitalen
Doppelgänger „Alex Plus“ kündigen und muss im Widerspruchsverfahren
NEBENBEI-7 beweisen, dass er der Kunde ist und nicht das Zusatzprodukt.

- Deutsch, komplett offline, keine externen Skripte/CDNs/Pakete/Schriften,
  keine Telemetrie, keine Netzwerkzugriffe, keine Live-Modellaufrufe.
- Keine Bilder und keine Sprachdateien: bewusste Text-/CSS-Platzhalter
  (keine Emoji-Figuren, keine SVG-Figuren). Dieser Stand wird später mit
  lokalen Krea-Assets bebildert.
- Drei NPCs (MIRA, Alex Plus, Rolf); Alex ist die stille Spielerrolle mit
  sichtbaren Texten. Alle Geschichten und Beweise sind echte sichtbare Texte.
- Alle Firmen, Verfahren und Regeln sind fiktiv.

## Starten

**Einfachster Start:** `index.html` direkt im Browser öffnen
(Doppelklick bzw. Datei über `file://`). Klassische lokale Scripts, keine
Module, keine fetch-Abhängigkeiten — läuft ohne Server.

**Optionale lokale Servervariante** (im Projektverzeichnis):

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann öffnen: http://127.0.0.1:8000/

## Bedienung (Spielfluss)

1. **Ankunft:** Beim Start spielt die Ankunftsszene ab. Dialoge laufen über
   klare **Weiter**/**Schließen**-Schaltflächen, sind jederzeit wieder
   aufrufbar (NPCs) und im **Verlauf** nachlesbar.
2. **Räume:** Empfang und Vorführraum, je vier gut sichtbare
   Hotspot-Schaltflächen (Gespräch/Fundstelle), Raumname, kurze Beschreibung
   und Besuchsmarkierung in der Raumnavigation. Der Vorführraum ist erst
   nach dem Fund von E2 freigegeben — kein verstecktes Pixelraten.
3. **Funde:** Beweiskarten E1–E5 werden an ihren Fundstellen jeweils genau
   einmal in den **Beweisordner** vergeben; dort steht ihr vollständiger
   Text. Nach E2 sind alle übrigen Funde frei erreichbar.
4. **Widerspruchsverfahren** (nach E2, über die Werkzeugleiste):
   - Runde W1: Behauptung „persönliche Bestätigung um 09:01“ → Karte **E2**
   - Runde Rundenfolge W1→W2→W3; W2: „Satz stammt vom Assistenten“ → **E3**
   - W3: erst kurzes tatsächliches Gespräch, dann „ohne Abo kein
   Weiterbetrieb“ → **E4**
   - Falsche Karte → passende Rückmeldung, Runde bleibt offen;
     wiederholte Klicks lösen keine nächste Runde versehentlich mit.
   - **Weiter untersuchen** ist in jeder Runde zugänglich, ohne
     Fortschrittsverlust; Rückkehr führt zur richtigen offenen Runde.
   - Nach W1 behauptet MIRA bei Wiederbesuch die widerlegte persönliche
     Verlängerung nicht mehr als Tatsache (vorhandener W1-Folgetext).
   - Nach W2 sind die abgeschaltete Bindungsroutine und die freigegebene
     Kündigung sichtbar (u. a. Konsole, MIRA, Alex Plus); wiederholte
     NPC-Besuche behaupten keine neue aktive Bindung oder gesperrte Kündigung.
   - W3 erschließt die zusätzliche Exportoption — keine neue Kündigungshürde.
5. **Entscheidung** (nach W3): Beide Optionen wörtlich beschriftet —
   „Kündigen und Kopie löschen.“ bzw. „Kündigen und Kopie mitnehmen.“ —
   jeweils mit vollständigem Enddialog.
   - Ende A: Zwischen Abschlussmeldung und MIRAs Zufriedenheitsfrage
     ein bewusster Weiter-Schritt (Lesemoment). Danach ist die Löschung
     abgeschlossen: Alex Plus erscheint nicht wieder als aktiver Avatar.
   - Beide Enden bieten **„Zum Entscheidungspunkt“** und ermöglichen so die
     andere Wahl. Kein automatischer Neustart am Ende.

## Speichern, Laden, Entscheidungspunkt, Neustart

- **Speichern / Stand laden** (Werkzeugleiste) über die State-Methoden mit
  verständlichen Erfolgs-/Fehlermeldungen.
- **Temporäre Speicherung:** Ist `localStorage` blockiert oder fehlerhaft
  (z. B. Quota), wird automatisch ein RAM-Speicher für dieselbe Sitzung
  genutzt; die UI zeigt die Einschränkung klar an. Speicherblockade oder
  ungültige Daten lassen das Spiel nicht abstürzen; ungültige gespeicherte
  Daten werden abgelehnt, der laufende Stand bleibt erhalten.
- **Entscheidungspunkt:** Wird unmittelbar nach Runde W3 (vor der Endwahl)
  automatisch gesichert und ist über „Zum Entscheidungspunkt“ ladbar —
  auch nach beiden Enden. Damit bleibt die andere Endwahl erreichbar.
  Ist `localStorage` blockiert, liegt der Checkpoint nur im
  Sitzungs-RAM; die UI meldet das ehrlich (automatischer Checkpoint und
  Entscheidungsansicht) und verspricht keine Wiederherstellung nach
  Schließen/Neuladen.
- **Stand laden:** Lädt den gespeicherten Stand; ist der geladene Stand
  bereits beendet (A oder B), wird das passende Endpanel mit
  „Zum Entscheidungspunkt“ wieder angezeigt — ohne neu zu entscheiden
  oder den Stand zurückzusetzen.
- **Neustart** erst nach echter Bestätigung; Abbrechen erhält den
  Fortschritt. Der Neustart betrifft nur den Spielzustand (die eigenen
  beiden Speicherslots), nie allgemeine Browserdaten. Beim normalen
  Seitenstart wird bewusst **nicht** `GameState.reset()` aufgerufen — die
  Initialisierung ist nicht destruktiv und lässt gespeicherte Slots erhalten.

## Tastatur und schmale Fenster

- Alle Aktionen sind echte, erreichbare Buttons mit sichtbarem Fokus;
  Fokusführung beim Öffnen/Schließen der Panels.
- **Escape** schließt das zuletzt geöffnete schließbare Panel in der
  tatsächlichen Öffnungsreihenfolge (Dialog/Verfahren/Ordner/Verlauf)
  ohne Fortschrittsverlust; der Fokus kehrt zu einem erreichbaren Punkt
  zurück. Keine Mauspflicht.
- Layout für 320 px bis Desktop: Textumbrüche und breite Klickziele;
  Text wird nicht durch `overflow:hidden` kaschiert; Beweisordner und
  Verlauf auch auf schmalem Fenster bedienbar.
- Leeres eingebettetes Favicon bleibt erhalten (kein `/favicon.ico`-404).

## Dateien

- `index.html` — Struktur, deutsche Beschriftungen, Tastaturzugriff,
  leerer eingebetteter Favicon-Verweis
- `css/style.css` — Graphic-Novel-Palette (Creme #EEE7D8, Petrol #28666A,
  Pflaume #51364F, Koralle #EF806D, dunkle Kontur #25232B),
  Formular-/Registerflächen, schmales Layout
- `js/content.js` — alle Texte, Karten, Dialoge, Runden, Enden
- `js/state.js` — Zustand, Regeln, Speichern/Laden, Validierung
- `js/ui.js` — Rendering, Dialogmotor, Hotspots, Verfahren, Enden,
  Speichern/Laden, Tastatur
- `js/main.js` — Start (nicht destruktive Initialisierung, `UI.init()`)

## Ausgeführte Prüfung

- `node --check` auf allen `js/*.js`-Dateien (Syntaxprüfung) — für diesen
  Stand tatsächlich ausgeführt; das ist **ausschließlich** eine
  Syntaxprüfung, kein Browser- oder Funktionstest.

## Unabhängige Browserbefunde (Grundlage, keine Abnahme durch diese Reparatur)

- Die drei hier korrigierten Bedienfehler (Escape schließt das zuletzt
  geöffnete Panel; Endpanel nach Laden eines beendeten Stands; ehrliche
  Checkpoint-Meldung bei blockiertem `localStorage`) beruhen auf
  eigenständigen Browserbeobachtungen (Chromium/Firefox) über die
  vollständigen Wege W1→W2→W3 und beide Enden.
- Diese Reparatur wurde **nicht** erneut in einem Browser abgenommen;
  ob die Korrekturen im Browser wie beschrieben greifen, ist eine
  separate Browserprüfung.

## Nicht abgenommene Teile / offene Punkte

- Die frühere Mikro-Browserprüfung (Empfangsraum-Ausschnitt) und die
  29 bestandenen unabhängigen State-VM-Fixtures sind **keine**
  Browserabnahme der jetzt vollständigen Oberfläche.
- Noch keine Kunst und kein Ton: keine Bilder, keine Sprachdateien,
  keine erfundenen Assets. Dialogzeilen tragen stabile IDs als
  spätere Audio-Anknüpfung; die Bebilderung folgt mit lokalen
  Krea-Assets.
