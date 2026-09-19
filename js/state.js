"use strict";

/* Zentraler Spielzustand.
   Alle Übergänge sind hier gegängigt; UI und Inhalt ändern nichts direkt. */
const GameState = {
  _state: null,

  fresh() {
    return {
      e2Found: false,            // Beweiskarte E2 genau einmal erhalten
      contradictionResolved: false,
      resolvedCount: 0           // wird gesetzt, nie inkrementiert
    };
  },

  reset() {
    this._state = this.fresh();
  },

  get() {
    if (!this._state) {
      this.reset();
    }
    return this._state;
  },

  /* Gibt E2 genau einmal. Weitere Aufrufe liefern false (keine Duplikate). */
  grantE2() {
    const s = this.get();
    if (s.e2Found) {
      return false;
    }
    s.e2Found = true;
    return true;
  },

  /* Erfolg nur mit gefundener Karte E2. Ohne Karte oder nach Abschluss: false. */
  resolveContradiction(cardId) {
    const s = this.get();
    if (s.contradictionResolved) {
      return false;
    }
    if (!s.e2Found || cardId !== "E2") {
      return false;
    }
    s.contradictionResolved = true;
    s.resolvedCount = 1;
    return true;
  }
};
