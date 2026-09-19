"use strict";

/* =========================================================================
 * js/state.js — „Nur noch kurz kündigen“
 * Zentraler Spielzustand und gesamte Zustandslogik.
 *
 * GameState ist der EINZIGE Ort für Zustandsänderungen. UI (ui.js) und
 * Inhalt (content.js) rufen nur Methoden auf und lesen get() — sie ändern
 * nie den internen Zustand direkt. Keine DOM-, fetch-, Netzwerk- oder
 * Zufallslogik in dieser Datei; keine substring-Vergleiche von Erzähltext.
 *
 * INITIALISIERUNG (repariert)
 *   Eine neue Instanz startet ohne Zustand. Der erste get()-Aufruf (oder
 *   jede andere Methode) legt FAZIG einen frischen Arbeitsspeicherzustand
 *   an — NICHT DESTRUKTIV: vorhandene gespeicherte Slots werden dabei
 *   weder gelesen noch gelöscht. Nur der explizite reset() (UI-
 *   bestätigter Neustart) entfernt die beiden eigenen Speicherslots und
 *   die Sitzungs-Einträge im RAM-Fallback. hasSave() und load() sind
 *   reine Lese-/Übernahmepfade und löschen nie Slots.
 *
 * SPEICHER
 *   SAVE_VERSION: 2
 *   Eigene localStorage-Keys (wird NIEMALS localStorage.clear() aufgerufen):
 *     "nurNochKurzKundigen.save"        → allgemeiner Spielstand   (Slot "save")
 *     "nurNochKurzKundigen.checkpoint"  → benannter Entscheidungspunkt (Slot "checkpoint")
 *   Slots werden strikt geprüft: Es werden ausschließlich die beiden
 *   eigenen STORAGE_KEYS-Schlüssel akzeptiert (explizite
 *   hasOwnProperty-Prüfung — geerbte Schlüssel wie "constructor" oder
 *   "__proto__" werden VOR JEGLICHEM Storage-Zugriff abgewiesen).
 *   Geschrieben/entfernt werden ausschließlich diese beiden eigenen
 *   Spielkeys.
 *   Fällt localStorage aus (blockiert/fehlend) oder schlägt ein lokales
 *   Schreiben fehl (z. B. Quota), wird automatisch ein sicherer
 *   RAM-Speicher für dieselbe Sitzung genutzt. Ein erfolgreicher
 *   RAM-Speichernach einem fehlgeschlagenen lokalen Schreiben hat für
 *   diesen Slot innerhalb derselben Sitzung beim Laden VORRANG — bis
 *   wieder ein lokales Schreiben gelingt, danach ist der lokale Stand
 *   der neueste und hat wieder Vorrang (keine dauerhaft veraltete
 *   RAM-Kopie). Speicherfehler werfen nie. Jede save/load-Rückgabe
 *   enthält storage: "local" | "memory" plus warning, damit die UI die
 *   Einschränkung anzeigen kann.
 *
 * REGELN (Kurzform)
 *   - Vor E2: nur Empfang, nur Fund E2 (Auskunftsterminal).
 *   - Nach E2: beide Räume, alle Funde E1–E5, Verfahrensbeginn.
 *     jederzeit zurück zur Untersuchung; die nächste offene Runde bleibt.
 *   - Runden in fester Reihenfolge W1→W2→W3, richtige Karten E2/E3/E4.
 *     Nur tatsächlich gefundene Karten; falsche Karte → passender Feedback-
 *     Text aus content.js; mehrfach gelöste Runde → kein Fortschritt.
 *   - W2: Bindungsroutine aus, Kündigung freigegeben.
 *   - W3: Exportalternative frei.
 *   - Endwahl (A löschen / B exportieren) erst nach allen drei Runden.
 *     Einmal gewählt ist das Ende endgültig; gelöschter Alex Plus kehrt
 *     nicht zurück; eine zweite Endwahl setzt nichts stillschweigend zurück.
 *   - Automatischer Checkpoint („Entscheidungspunkt“) bei Freischaltung
 *     der Endwahl; ladbar auch nach beiden Enden.
 *
 * LADEN/VALIDIERUNG (repariert)
 *   Ein gespeicherter Zustand wird nur übernommen, wenn er konsistent ist:
 *   - Bekannte EIGENE IDs nur (Räume, Hotspots, Karten, Runden, Enden) —
 *     explizite Own-Key-Prüfung, nie truthy-Tests von Objektzugriffen.
 *   - Jede gelöste Runde braucht ihre tatsächlich gefundene Beweiskarte
 *     in cards (W1=E2, W2=E3, W3=E4).
 *   - Freie Folgefunde (E1, E3, E4, E5) sowie der Vorführraum (aktueller
 *     Raum oder besuchte Hotspots) setzen voraus, dass E2 gefunden ist.
 *   - Alle zusammengehörigen Flags/Legacy-Felder passen zur festen
 *     Rundenfolge (procedureStarted, bindungsroutineAktiv,
 *     kuendigungFreigegeben, exportFreigegeben, e2Found,
 *     contradictionResolved, resolvedCount).
 *   - Ein Endzustand (ended/ending/alexPlus) ist erst nach allen drei
 *     gelösten Runden zulässig.
 *   Kaputte Daten werden abgelehnt (reason:"invalid", errors:[...]); der
 *   bereits laufende gültige Zustand bleibt unangetastet. Nach erfolgreicher
 *   Prüfung werden ausschließlich die bekannten kanonischen Felder in ein
 *   neues sauberes Zustandsobjekt übernommen (Arrays/Logeinträge werden
 *   kopiert) — nicht das beliebige JSON-Objekt direkt als Live-State.
 *
 * ÖFFENTLICHE METHODEN (für die UI) — API unverändert
 *   reset()                                → void. Frischer Zustand, eigene
 *                                             Speicherslots gelöscht. Die
 *                                             Bestätigung der Entscheidung
 *                                             trifft die UI, nicht der State.
 *   get()                                  → aktueller Zustand (enthält die
 *                                             Legacy-Felder e2Found,
 *                                             contradictionResolved,
 *                                             resolvedCount der alten UI).
 *                                             Lazy, nicht destruktiv:
 *                                             löscht nie gespeicherte Slots.
 *   enterRoom(roomId)                      → {ok, room?} | {ok:false, reason}
 *   visitHotspot(hotspotId)                → {ok, firstVisit} | {ok:false, reason}
 *   collectFrom(hotspotId)                 → {ok, card, firstFind} |
 *                                             {ok:false, reason}
 *                                             (Wiederholen verliert nichts,
 *                                             erzeugt keine zweite Karte)
 *   hasCard(cardId)                        → boolean
 *   cardList()                             → Array<string> (Kopie)
 *   startProcedure()                       → {ok} | {ok:false, reason}
 *   currentRound()                         → "W1"|"W2"|"W3"|null
 *   presentEvidence(roundId, cardId)       → siehe unten (Erfolg vs.
 *                                             passender falsche Rückmeldung)
 *   resolveContradiction(cardId)           → boolean (Legacy: aktuelle Runde)
 *   grantE2()                              → boolean (Legacy: E2 genau einmal)
 *   canChooseEnding()                      → boolean
 *   chooseEnding("A"|"B")                  → {ok, ending, alexPlus} |
 *                                             {ok:false, reason, ...}
 *   addDialogueLine(speaker, text, id?)    → {ok, line} | {ok:false, reason}
 *   getDialogueLog()                       → Array<{speaker,text,id?}> (Kopie)
 *   save(slot?) / load(slot?)              → {ok, slot, storage, warning?} |
 *                                             {ok:false, reason, ...}
 *   hasSave(slot?)                         → {exists, storage}
 *   saveCheckpoint() / loadCheckpoint()    → wie save/load, Slot "checkpoint"
 *
 * presentEvidence-Rückgabe:
 *   Erfolg:    {ok:true, round, effects:[...],
 *               checkpoint?:{ok, slot, storage, warning?}}
 *   Fehlschlag: {ok:false, reason, round?, card?, feedback?, next?}
 *   reason ∈ "already-ended" | "unknown-round" | "already-resolved"
 *           | "round-locked" | "card-missing" | "wrong-card"
 * ========================================================================= */

const SAVE_VERSION = 2;

const STORAGE_KEYS = {
  save: "nurNochKurzKundigen.save",
  checkpoint: "nurNochKurzKundigen.checkpoint"
};

const ROUND_ORDER = ["W1", "W2", "W3"];
const CORRECT_CARD = { W1: "E2", W2: "E3", W3: "E4" };

/* Welche Fundstelle liefert welche Karte (laut content.js „quelle“). */
const CARD_SOURCE = {
  terminal: "E2",       /* Empfang, Auskunftsterminal            */
  vertragsfach: "E1",   /* Empfang, Vertragsfach                 */
  drucker: "E5",        /* Empfang, Reklamationsdrucker          */
  konsole: "E3",        /* Vorführraum, Assistenzkonsole         */
  wartungsfach: "E4"    /* Vorführraum, Wartungsfach             */
};

const ENDINGS = ["A", "B"];
const ALEXPLUS_STATES = ["active", "deleted", "exported"];

/* Sitzungs-RAM-Fallback, falls localStorage blockiert/fehlend ist. */
const _memoryStore = Object.create(null);
/* Slots, deren zuletzt erfolgreiches Speichern in dieser Sitzung im
   RAM stattfand (lokales Schreiben fehlgeschlagen, z. B. Quota). Diese
   haben beim Laden innerhalb der Sitzung Vorrang, bis wieder ein
   lokales Schreiben gelingt. */
const _memoryPreferred = Object.create(null);

/* ---------- Strikte ID-/Slot-Prüfung (eigene Schlüssel nur) ----------
 * Geerbte Eigenschaften (z. B. "constructor", "__proto__") dürfen nie
 * als ID oder Slot akzeptiert werden: daher explizite hasOwnProperty-
 * Prüfung, kein truthy-Test von Objektzugriffen. */

function _ownKey(obj, key) {
  return typeof key === "string" &&
         Object.prototype.hasOwnProperty.call(obj, key);
}

function _knownRoom(id) { return _ownKey(CONTENT.rooms, id); }
function _knownHotspot(id) { return _ownKey(CONTENT.hotspots, id); }
function _knownCard(id) { return _ownKey(CONTENT.cards, id); }
function _knownRound(id) { return _ownKey(CONTENT.contradictions, id); }
function _knownEnding(id) { return _ownKey(CONTENT.endings, id); }
function _knownSlot(slot) { return _ownKey(STORAGE_KEYS, slot); }

/* ---------- Speicher-Helfer (fehlertolerant) ---------- */

function _ls() {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch (_) { /* Zugriff blockiert */ }
  return null;
}

function _writeRaw(slot, json) {
  const ls = _ls();
  if (ls) {
    try {
      ls.setItem(STORAGE_KEYS[slot], json);
      /* Lokales Schreiben erfolgreich: lokaler Stand ist wieder der
         neueste; RAM-Vorrang für diesen Slot entfällt. */
      delete _memoryPreferred[slot];
      return { storage: "local", warning: null };
    } catch (_) { /* auf RAM-Fallback ausweichen */ }
  }
  try {
    _memoryStore[slot] = json;
    /* Neuer RAM-Stand nach fehlgeschlagenem/fehlendem lokalem
       Schreiben: innerhalb der Sitzung beim Laden Vorrang. */
    _memoryPreferred[slot] = true;
    return {
      storage: "memory",
      warning: "localStorage nicht verfügbar; RAM-Speicher für diese Sitzung genutzt."
    };
  } catch (err) {
    return { storage: null, warning: null, error: String(err) };
  }
}

function _readRaw(slot) {
  /* Sitzungs-RAM-Vorrang: nur wenn für diesen Slot zuletzt im RAM
     gespeichert wurde UND der RAM-Eintrag vorhanden ist. */
  if (_memoryPreferred[slot] &&
      Object.prototype.hasOwnProperty.call(_memoryStore, slot)) {
    return { value: _memoryStore[slot], storage: "memory" };
  }
  const ls = _ls();
  if (ls) {
    try {
      const value = ls.getItem(STORAGE_KEYS[slot]);
      if (value !== null && value !== undefined) {
        return { value, storage: "local" };
      }
    } catch (_) { /* auf RAM-Fallback ausweichen */ }
  }
  if (Object.prototype.hasOwnProperty.call(_memoryStore, slot)) {
    return { value: _memoryStore[slot], storage: "memory" };
  }
  return null;
}

/* ---------- Validierung geladener Daten ----------
 * Lehnt inkonsistente Daten freundlich ab; der aktuelle funktionierende
 * Spielstand bleibt dabei unverändert. Keine willkürlichen Objekte werden
 * in den Live-State übernommen. */

function _isIdArray(arr, known) {
  return (
    Array.isArray(arr) &&
    arr.every((x) => typeof x === "string" && known(x)) &&
    new Set(arr).size === arr.length
  );
}

function _validate(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["kein-Objekt"] };
  }

  /* Version: endliche, erlaubte Zahl. */
  if (typeof data.version !== "number" || !Number.isFinite(data.version) ||
      data.version !== SAVE_VERSION) {
    errors.push("version");
  }

  if (typeof data.room !== "string" || !_knownRoom(data.room)) {
    errors.push("room");
  }
  if (!_isIdArray(data.visitedHotspots, _knownHotspot)) {
    errors.push("visitedHotspots");
  }
  if (!_isIdArray(data.cards, _knownCard)) {
    errors.push("cards");
  }

  /* Runden: eindeutige, geordnete Präfixfolge von W1..W3; next konsistent. */
  let resolvedOk = false;
  if (data.rounds && typeof data.rounds === "object" && !Array.isArray(data.rounds)) {
    const r = data.rounds;
    if (Array.isArray(r.resolved) &&
        r.resolved.every((x) => typeof x === "string" && ROUND_ORDER.includes(x))) {
      const n = r.resolved.length;
      const unique = new Set(r.resolved).size === n;
      const prefix = ROUND_ORDER.slice(0, n).every((x, i) => r.resolved[i] === x);
      const nextOk = (n < ROUND_ORDER.length && r.next === ROUND_ORDER[n]) ||
                     (n === ROUND_ORDER.length && r.next === null);
      resolvedOk = unique && prefix && nextOk;
    }
  }
  if (!resolvedOk) {
    errors.push("rounds");
  }

  for (const b of ["procedureStarted", "bindungsroutineAktiv",
                   "kuendigungFreigegeben", "exportFreigegeben", "ended"]) {
    if (typeof data[b] !== "boolean") {
      errors.push(b);
    }
  }

  if (data.ending !== null && !_knownEnding(data.ending)) {
    errors.push("ending");
  }
  if (data.ended !== (data.ending !== null)) {
    errors.push("ended/ending");
  }
  if (typeof data.alexPlus !== "string" || !ALEXPLUS_STATES.includes(data.alexPlus)) {
    errors.push("alexPlus");
  }
  if (data.ending === "A" && data.alexPlus !== "deleted") {
    errors.push("alexPlus/endingA");
  }
  if (data.ending === "B" && data.alexPlus !== "exported") {
    errors.push("alexPlus/endingB");
  }
  if (!data.ended && data.alexPlus !== "active") {
    errors.push("alexPlus/active");
  }

  if (!Array.isArray(data.dialogueLog) ||
      !data.dialogueLog.every((l) =>
        l && typeof l === "object" &&
        typeof l.speaker === "string" &&
        typeof l.text === "string" &&
        (l.id === undefined || typeof l.id === "string"))) {
    errors.push("dialogueLog");
  }

  /* Konsistenz zwischen Feldern (unmögliche Zustände ablehnen). */
  const cards = Array.isArray(data.cards) ? data.cards : [];
  const visited = Array.isArray(data.visitedHotspots) ? data.visitedHotspots : [];
  const resolved = (data.rounds && Array.isArray(data.rounds.resolved))
    ? data.rounds.resolved : [];

  if (typeof data.procedureStarted === "boolean" &&
      data.procedureStarted !== cards.includes("E2")) {
    errors.push("procedureStarted/konsistenz");
  }
  if (typeof data.kuendigungFreigegeben === "boolean" &&
      data.kuendigungFreigegeben !== resolved.includes("W2")) {
    errors.push("kuendigungFreigegeben/konsistenz");
  }
  if (typeof data.exportFreigegeben === "boolean" &&
      data.exportFreigegeben !== resolved.includes("W3")) {
    errors.push("exportFreigegeben/konsistenz");
  }
  if (typeof data.bindungsroutineAktiv === "boolean" &&
      data.bindungsroutineAktiv !== !resolved.includes("W2")) {
    errors.push("bindungsroutineAktiv/konsistenz");
  }

  /* Jede gelöste Runde braucht ihre tatsächlich gefundene Beweiskarte. */
  for (const r of resolved) {
    const need = CORRECT_CARD[r];
    if (need !== undefined && !cards.includes(need)) {
      errors.push("evidence/" + r);
    }
  }

  /* Freie Folgefunde und der Vorführraum setzen E2 voraus. */
  const hasE2 = cards.includes("E2");
  if (!hasE2) {
    if (["E1", "E3", "E4", "E5"].some((c) => cards.includes(c))) {
      errors.push("cards-before-e2");
    }
    if (data.room === "vorfuehr") {
      errors.push("room-before-e2");
    }
    if (visited.some((h) => _knownHotspot(h) && CONTENT.hotspots[h].room === "vorfuehr")) {
      errors.push("hotspot-before-e2");
    }
  }

  /* Ein Endzustand ist erst nach allen drei gelösten Runden zulässig. */
  if (data.ended && resolved.length !== ROUND_ORDER.length) {
    errors.push("ended-without-rounds");
  }

  /* Legacy-Felder (Kompatibilität) müssen zum Kanonischen passen. */
  if (typeof data.e2Found !== "boolean" || data.e2Found !== cards.includes("E2")) {
    errors.push("e2Found");
  }
  if (typeof data.contradictionResolved !== "boolean" ||
      data.contradictionResolved !== resolved.includes("W1")) {
    errors.push("contradictionResolved");
  }
  if (typeof data.resolvedCount !== "number" ||
      !Number.isFinite(data.resolvedCount) ||
      data.resolvedCount !== resolved.length) {
    errors.push("resolvedCount");
  }

  return { ok: errors.length === 0, errors };
}

/* Übernimmt validierte Daten als neues sauberes Zustandsobjekt:
   ausschließlich die bekannten kanonischen Felder, Arrays und
   Logeinträge werden kopiert. Das beliebige JSON-Objekt wird nie
   direkt als Live-State gesetzt. */
function _adoptState(data) {
  const s = GameState.fresh();
  s.room = data.room;
  s.visitedHotspots = data.visitedHotspots.slice();
  s.cards = data.cards.slice();
  s.rounds = {
    next: data.rounds.next,
    resolved: data.rounds.resolved.slice()
  };
  s.procedureStarted = data.procedureStarted;
  s.bindungsroutineAktiv = data.bindungsroutineAktiv;
  s.kuendigungFreigegeben = data.kuendigungFreigegeben;
  s.exportFreigegeben = data.exportFreigegeben;
  s.ending = data.ending;
  s.ended = data.ended;
  s.alexPlus = data.alexPlus;
  s.dialogueLog = data.dialogueLog.map((l) => {
    const line = { speaker: l.speaker, text: l.text };
    if (typeof l.id === "string") {
      line.id = l.id;
    }
    return line;
  });
  GameState._syncLegacy(s);
  return s;
}

/* =========================================================================
 * GameState
 * ========================================================================= */

const GameState = {
  _state: null,

  /* Frischer Zustand (Version 2). */
  fresh() {
    return {
      version: SAVE_VERSION,
      room: "empfang",
      visitedHotspots: [],           /* eindeutige Hotspot-IDs, in Besuchreihenfolge */
      cards: [],                     /* eindeutige Karten-IDs, in Fundreihenfolge    */
      rounds: {
        next: "W1",                  /* nächste offene Runde oder null (alle gelöst) */
        resolved: []                 /* gelöste Runden in Reihenfolge W1, W2, W3     */
      },
      procedureStarted: false,       /* Verfahrensbeginn nach E2                     */
      bindungsroutineAktiv: true,    /* nach W2: false                               */
      kuendigungFreigegeben: false,  /* nach W2: true                                */
      exportFreigegeben: false,      /* nach W3: true                                */
      ending: null,                  /* "A" | "B" | null                             */
      ended: false,
      alexPlus: "active",            /* "active" | "deleted" | "exported"            */
      dialogueLog: [],               /* [{speaker, text, id?}]                       */
      /* Legacy-Felder (Kompatibilität mit der bisherigen UI): */
      e2Found: false,
      contradictionResolved: false,
      resolvedCount: 0
    };
  },

  /* Expliziter, UI-bestästigter Neustart. Es werden ausschließlich die
     eigenen Spielschlüssel entfernt, nie localStorage.clear(). */
  reset() {
    this._state = this.fresh();
    for (const slot of Object.keys(STORAGE_KEYS)) {
      const ls = _ls();
      if (ls) {
        try { ls.removeItem(STORAGE_KEYS[slot]); } catch (_) { /* ignorieren */ }
      }
      delete _memoryStore[slot];
      delete _memoryPreferred[slot];
    }
  },

  /* Liefert den aktuellen Zustand (mit Legacy-Feldern).
     Lazy, NICHT destruktiv: ein frischer Arbeitsspeicherzustand wird
     nur in den RAM gesetzt; vorhandene gespeicherte Slots bleiben
     erhalten und sind danach per load()/hasSave() erreichbar. */
  get() {
    if (!this._state) {
      this._state = this.fresh();
    }
    return this._state;
  },

  /* Legacy-Felder aus den kanonischen Feldern ableiten. */
  _syncLegacy(s) {
    s.e2Found = s.cards.includes("E2");
    s.contradictionResolved = s.rounds.resolved.includes("W1");
    s.resolvedCount = s.rounds.resolved.length;
  },

  /* ---------- Raum und Fundstellen ---------- */

  /* Raum wechseln. Vorführraum erst nach erstem Fund von E2. */
  enterRoom(roomId) {
    const s = this.get();
    if (s.ended) {
      return { ok: false, reason: "already-ended", ending: s.ending };
    }
    if (typeof roomId !== "string" || !_knownRoom(roomId)) {
      return { ok: false, reason: "unknown-room" };
    }
    if (roomId === "vorfuehr" && !s.cards.includes("E2")) {
      return { ok: false, reason: "room-locked", room: roomId };
    }
    s.room = roomId;
    return { ok: true, room: roomId };
  },

  /* Fundstelle/Gesprächspunkt besuchen. Wiederholtes Besuchen verliert
     nichts; erste Besuche werden eindeutig protokolliert. */
  visitHotspot(hotspotId) {
    const s = this.get();
    if (s.ended) {
      return { ok: false, reason: "already-ended", ending: s.ending };
    }
    if (typeof hotspotId !== "string" || !_knownHotspot(hotspotId)) {
      return { ok: false, reason: "unknown-hotspot" };
    }
    const h = CONTENT.hotspots[hotspotId];
    if (h.room === "vorfuehr" && !s.cards.includes("E2")) {
      return { ok: false, reason: "room-locked", room: h.room };
    }
    const firstVisit = !s.visitedHotspots.includes(hotspotId);
    if (firstVisit) {
      s.visitedHotspots.push(hotspotId);
    }
    return { ok: true, hotspot: hotspotId, firstVisit };
  },

  /* Karte an der Fundstelle einsammeln.
     - Vor E2: nur E2 (Terminal) ist fundbar.
     - Nach E2: alle Karten E1–E5 an ihren Fundstellen.
     - Bereits gefundene Karten: keine Duplikate, nichts geht verloren. */
  collectFrom(hotspotId) {
    const s = this.get();
    if (s.ended) {
      return { ok: false, reason: "already-ended", ending: s.ending };
    }
    if (typeof hotspotId !== "string" || !_knownHotspot(hotspotId)) {
      return { ok: false, reason: "unknown-hotspot" };
    }
    const h = CONTENT.hotspots[hotspotId];
    if (h.room === "vorfuehr" && !s.cards.includes("E2")) {
      return { ok: false, reason: "room-locked", room: h.room };
    }
    const cardId = _ownKey(CARD_SOURCE, hotspotId) ? CARD_SOURCE[hotspotId] : null;
    if (!cardId) {
      return { ok: false, reason: "no-card", hotspot: hotspotId };
    }
    const e2Found = s.cards.includes("E2");
    if (!e2Found && cardId !== "E2") {
      return { ok: false, reason: "locked", card: cardId };
    }
    if (s.cards.includes(cardId)) {
      return { ok: false, reason: "already-found", card: cardId };
    }
    s.cards.push(cardId);
    if (cardId === "E2") {
      s.procedureStarted = true; /* Verfahrensbeginn nach E2 */
    }
    this._syncLegacy(s);
    return { ok: true, card: cardId, firstFind: true };
  },

  hasCard(cardId) {
    return this.get().cards.includes(cardId);
  },

  /* Kopie der gefundenen Karten in Fundreihenfolge. */
  cardList() {
    return this.get().cards.slice();
  },

  /* ---------- Widerspruchsverfahren ---------- */

  /* Verfahren starten/bestätigen; setzt E2 voraus. Idempotent. */
  startProcedure() {
    const s = this.get();
    if (s.ended) {
      return { ok: false, reason: "already-ended", ending: s.ending };
    }
    if (!s.cards.includes("E2")) {
      return { ok: false, reason: "no-e2" };
    }
    s.procedureStarted = true;
    return { ok: true };
  },

  /* Nächste offene Runde oder null, wenn alle drei gelöst sind. */
  currentRound() {
    return this.get().rounds.next;
  },

  /* Beweiskarte in einer Runde vorlegen.
     Distinguiert Erfolg von passender falscher Rückmeldung (feedback aus
     content.js) und von bereits gelöster/gesperrter Runde.
     Richtige Karten: W1=E2, W2=E3, W3=E4 — exakte ID-Vergleiche,
     keine substring-Vergleiche von Erzähltext. */
  presentEvidence(roundId, cardId) {
    const s = this.get();
    if (s.ended) {
      return { ok: false, reason: "already-ended", ending: s.ending };
    }
    if (typeof roundId !== "string" || !_knownRound(roundId)) {
      return { ok: false, reason: "unknown-round" };
    }
    const w = CONTENT.contradictions[roundId];
    if (s.rounds.resolved.includes(roundId)) {
      return { ok: false, reason: "already-resolved", round: roundId };
    }
    if (s.rounds.next !== roundId) {
      return { ok: false, reason: "round-locked", round: roundId, next: s.rounds.next };
    }
    if (!s.cards.includes(cardId)) {
      return { ok: false, reason: "card-missing", round: roundId, card: cardId };
    }
    if (cardId !== CORRECT_CARD[roundId]) {
      return {
        ok: false,
        reason: "wrong-card",
        round: roundId,
        card: cardId,
        feedback: (w.feedback && w.feedback[cardId]) || "Diese Karte trägt die Runde nicht."
      };
    }

    /* Erfolg: Runde abschließen, Effekte setzen. */
    const effects = [];
    s.rounds.resolved.push(roundId);
    const idx = ROUND_ORDER.indexOf(roundId);
    s.rounds.next = idx + 1 < ROUND_ORDER.length ? ROUND_ORDER[idx + 1] : null;

    if (roundId === "W2") {
      s.bindungsroutineAktiv = false;
      s.kuendigungFreigegeben = true;
      effects.push("bindungsroutine-aus", "kuendigung-freigegeben");
    }
    if (roundId === "W3") {
      s.exportFreigegeben = true;
      effects.push("export-freigegeben");
    }
    this._syncLegacy(s);

    /* Benannter Entscheidungspunkt unmittelbar vor der Endwahl sichern. */
    let checkpoint = null;
    if (s.rounds.next === null) {
      checkpoint = this.save("checkpoint");
    }
    return { ok: true, round: roundId, effects, checkpoint };
  },

  /* Legacy (bisherige UI): aktuelle offene Runde mit der Karte lösen.
     Der alte Ein-Runden-Abschluss ist NICHT die neue Endbedingung. */
  resolveContradiction(cardId) {
    const s = this.get();
    if (!s.rounds.next) {
      return false;
    }
    const r = this.presentEvidence(s.rounds.next, cardId);
    return !!r.ok;
  },

  /* Legacy (bisherige UI): E2 genau einmal aus dem Terminal geben. */
  grantE2() {
    const r = this.collectFrom("terminal");
    return !!(r.ok && r.card === "E2");
  },

  /* ---------- Ende ---------- */

  /* Endwahl nur nach allen drei Runden und noch ohne gewähltes Ende. */
  canChooseEnding() {
    const s = this.get();
    return !s.ended && s.rounds.next === null;
  },

  /* Ende wählen: "A" (Kopie löschen) oder "B" (Kopie mitnehmen/exportieren).
     Endgültig für den Spielstand; gelöschter Alex Plus kehrt nicht zurück.
     Eine weitere Endwahl setzt nichts stillschweigend zurück. */
  chooseEnding(endingId) {
    const s = this.get();
    if (s.ended) {
      return {
        ok: false,
        reason: "already-ended",
        ending: s.ending,
        hint: "Das gewählte Ende ist endgültig. Für einen neuen Durchlauf: expliziter, bestätigter Neustart."
      };
    }
    if (endingId !== "A" && endingId !== "B") {
      return { ok: false, reason: "unknown-ending" };
    }
    if (s.rounds.next !== null) {
      return { ok: false, reason: "rounds-unfinished", next: s.rounds.next };
    }
    s.ending = endingId;
    s.ended = true;
    s.alexPlus = endingId === "A" ? "deleted" : "exported";
    this._syncLegacy(s);
    return { ok: true, ending: endingId, alexPlus: s.alexPlus };
  },

  /* ---------- Gesprächsverlauf (klare Daten, kein DOM) ---------- */

  addDialogueLine(speaker, text, id) {
    const s = this.get();
    if (typeof speaker !== "string" || speaker.length === 0) {
      return { ok: false, reason: "bad-speaker" };
    }
    if (typeof text !== "string") {
      return { ok: false, reason: "bad-text" };
    }
    if (id !== undefined && id !== null && typeof id !== "string") {
      return { ok: false, reason: "bad-id" };
    }
    const line = { speaker, text };
    if (id) {
      line.id = id;
    }
    s.dialogueLog.push(line);
    return { ok: true, line };
  },

  getDialogueLog() {
    return this.get().dialogueLog.map((l) => Object.assign({}, l));
  },

  /* ---------- Speichern / Laden ---------- */

  /* Explizit speichern unter Slot "save" oder "checkpoint".
     Rückgabe: {ok, slot, storage:"local"|"memory", warning?} oder
     {ok:false, reason, ...}. Wirft nie. Ungültige Slots werden vor
     jeglichem Storage-Zugriff abgewiesen. */
  save(slot) {
    slot = slot || "save";
    if (!_knownSlot(slot)) {
      return { ok: false, reason: "unknown-slot" };
    }
    const s = this.get();
    let json;
    try {
      json = JSON.stringify(s);
    } catch (err) {
      return { ok: false, reason: "serialize-failed", error: String(err) };
    }
    const w = _writeRaw(slot, json);
    if (w.storage === null) {
      return { ok: false, reason: "write-failed", warning: w.warning, error: w.error };
    }
    return { ok: true, slot, storage: w.storage, warning: w.warning };
  },

  /* Explizit laden aus Slot "save" oder "checkpoint".
     Inkonsistente/ungültige Daten werden abgelehnt (reason:"invalid",
     errors:[...]); der aktuelle funktionierende Spielstand bleibt
     unangetastet. Ungültige Slots werden vor jeglichem Storage-Zugriff
     abgewiesen. */
  load(slot) {
    slot = slot || "save";
    if (!_knownSlot(slot)) {
      return { ok: false, reason: "unknown-slot" };
    }
    const raw = _readRaw(slot);
    if (!raw) {
      return { ok: false, reason: "no-save", slot };
    }
    let data;
    try {
      data = JSON.parse(raw.value);
    } catch (_) {
      return { ok: false, reason: "parse-failed", slot };
    }
    const v = _validate(data);
    if (!v.ok) {
      return { ok: false, reason: "invalid", slot, errors: v.errors };
    }
    this._state = _adoptState(data);
    return { ok: true, slot, storage: raw.storage };
  },

  hasSave(slot) {
    slot = slot || "save";
    if (!_knownSlot(slot)) {
      return { exists: false, storage: null };
    }
    const raw = _readRaw(slot);
    return { exists: !!raw, storage: raw ? raw.storage : null };
  },

  /* Benannter Entscheidungspunkt (automatisch vor der Endwahl gesichert,
     hier explizit wieder verfügbar; ladbar auch nach beiden Enden). */
  saveCheckpoint() {
    return this.save("checkpoint");
  },

  loadCheckpoint() {
    return this.load("checkpoint");
  }
};
