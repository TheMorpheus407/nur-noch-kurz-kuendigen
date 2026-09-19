"use strict";

/* =========================================================================
 * js/audio.js — „Nur noch kurz kündigen“
 * Kleiner klassischer Audio-Baustein für die lokalen TTS-Stimmen.
 *
 * - Liest nur den globalen Katalog AUDIO_CATALOG (js/audio-catalog.js):
 *   Zeilen-ID → {url, speaker, duration}. Zuordnung ausschließlich über
 *   die stabilen Zeilen-IDs, nie über Arrayposition oder Sprechertext.
 * - Ein einziges Audioelement mit preload="none"; höchstens ein Clip
 *   gleichzeitig. Sequenzen (W3-Einleitung, erfolgreiche Beweisrunden)
 *   laufen in sichtbarer Reihenfolge; fehlende IDs werden still
 *   übersprungen, es gibt keine Ersatzstimmen.
 * - Stimmen starten ausgeschaltet; Audio beginnt nur auf aktive
 *   Nutzerhandlung (UI-Umschalter, Weiter-Klick, Replay-Klick).
 * - Fehlende Dateien, nicht unterstütztes Audio oder abgelehntes play()
 *   geben einen kurzen Hinweis über die UI — kein ungefangener Fehler,
 *   keine wiederholten Fehlerdialoge, Spiel bleibt bedienbar.
 * - Späte ended-/play-Ereignisse dürfen keine veraltete Folge starten
 *   (Token-Wächter). stop() stoppt sofort und verwirft wartende Clips.
 * - Keine Module, kein fetch, keine externen Pakete; file:// lauffähig.
 * ========================================================================= */

const GameAudio = {
  enabled: false,          /* Master-Schalter: bewusst initial aus */
  supported: (typeof window.Audio !== "undefined"),
  _audio: null,            /* das EINZIGE Audioelement */
  _token: 0,               /* jede Abspielaktion/Stop erhöht den Token */
  _queue: [],              /* wartende Zeilen-IDs der aktuellen Folge */
  _onNotice: null,         /* UI-Kallback für kurze Hinweise */
  _lastNotice: "",
  _lastNoticeAt: 0,

  /* Audioelement einmalig anlegen (noch ohne src → kein Medienzugriff). */
  init() {
    if (this._audio || !this.supported) {
      return;
    }
    const a = new Audio();
    a.preload = "none";
    a.addEventListener("ended", () => this._onEnded());
    a.addEventListener("error", () => this._onError());
    this._audio = a;
  },

  /* Kurzer, deduplizierter Hinweis an die UI (Statuszeile, kein Dialog). */
  setNoticeHandler(fn) {
    this._onNotice = fn;
  },

  notice(text) {
    const now = Date.now();
    if (text === this._lastNotice && now - this._lastNoticeAt < 3000) {
      return; /* kein wiederholter Fehlerhinweis */
    }
    this._lastNotice = text;
    this._lastNoticeAt = now;
    if (this._onNotice) {
      this._onNotice(text);
    }
  },

  isEnabled() {
    return this.enabled;
  },

  /* Zeile im Katalog vorhanden? Fehlende IDs (z. B. miranachw2-05,
     miraNachW1-01) sind normale stille Textschritte. */
  hasLine(id) {
    return !!(id &&
      typeof AUDIO_CATALOG !== "undefined" &&
      Object.prototype.hasOwnProperty.call(AUDIO_CATALOG, id));
  },

  /* Master-Umschalter. Ausschalten stoppt sofort und verwirft
     wartende Clips. Rückgabe: neuer Zustand. */
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (!this.supported) {
        this.notice("Stimmen sind in diesem Browser nicht verfügbar; der Text bleibt vollständig bedienbar.");
      }
    } else {
      this.stop();
    }
    return this.enabled;
  },

  /* Einzelne Zeile abspielen (ersetzt laufendes Audio).
     Ausgeschaltete Stimmen oder fehlende ID: bewusst still. */
  playLine(id) {
    if (!this.enabled || !this.hasLine(id)) {
      return;
    }
    this._queue = [];
    this._start(id);
  },

  /* Folge von Zeilen-IDs in sichtbarer Reihenfolge abspielen;
     fehlende IDs werden still übersprungen. */
  playSequence(ids) {
    if (!this.enabled || !Array.isArray(ids)) {
      return;
    }
    const queued = [];
    for (const id of ids) {
      if (this.hasLine(id)) {
        queued.push(id);
      }
    }
    if (!queued.length) {
      return;
    }
    this._queue = queued;
    this._start(queued.shift());
  },

  /* Sofort stoppen und alle wartenden Clips verwerfen. */
  stop() {
    this._token += 1;
    this._queue = [];
    const a = this._audio;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
  },

  /* Intern: einen Clip starten; ersetzt laufendes Audio. */
  _start(id) {
    const a = this._audio;
    if (!a) {
      return;
    }
    const myToken = ++this._token;
    a._audioToken = myToken; /* gehört zu genau diesem Ladevorgang */
    a.src = AUDIO_CATALOG[id].url;
    const p = a.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (myToken !== this._token) {
          return; /* Folge wurde zwischenzeitlich verworfen */
        }
        this.notice("Diese Sprachdatei konnte nicht abgespielt werden; der Text bleibt bedienbar.");
      });
    }
  },

  /* aktueller Clip zu Ende: nächste wartende Zeile — nur wenn die
     Folge nicht verworfen wurde. */
  _onEnded() {
    if (!this._queue.length) {
      return;
    }
    const myToken = this._token;
    const next = this._queue.shift();
    if (myToken !== this._token) {
      return; /* stop() in der Zwischenzeit: Folge veraltet */
    }
    this._start(next);
  },

  /* Lade-/Decode-Fehler: kurzer Hinweis, kein Abwurf. Veraltete
     Fehler (zu einer verworfenen Quelle) bleiben ohne Wirkung. */
  _onError() {
    const a = this._audio;
    if (!a || !a.src) {
      return; /* leere/abgebrochene Quelle (z. B. nach stop()) ignorieren */
    }
    if (a._audioToken !== this._token) {
      return; /* Fehler gehört zu einer verworfenen Quelle */
    }
    this.notice("Diese Sprachdatei konnte nicht geladen werden; der Text bleibt bedienbar.");
  }
};
