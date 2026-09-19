"use strict";

/* Alle Spieltexte und Karteninhalte.
   Logik (state.js) und Darstellung (ui.js) greifen nur auf diese Daten zu. */
const CONTENT = {
  miraDialog: [
    { speaker: "MIRA", text: "Guten Tag. Sie sind wegen Ihres Vertrags hier? Perfekt, die Akte liegt schon bereit." },
    { speaker: "MIRA", text: "Kleine Randnotiz aus der Akte: Sie haben die Verlängerung um 09:01 persönlich bestätigt." },
    { speaker: "MIRA", text: "Ich rate Ihnen, nicht zu sehr an Zeitstempel zu zweifeln. Die Systeme machen keine Fehler." },
    { speaker: "Spieler:in", text: "Vielleicht lohnt sich ein Blick an das Auskunftsterminal im Raum." }
  ],

  terminal: {
    found: "Das Terminal druckt eine Beweiskarte aus. Beweiskarte E2 liegt jetzt im Beweisordner.",
    again: "Das Terminal zeigt: Keine weiteren Unterlagen verfügbar."
  },

  evidence: {
    empty: "Der Ordner ist noch leer."
  },

  cards: {
    E2: {
      id: "E2",
      title: "E2 — Zeitstempel der Verlängerung",
      text: "09:00 — Kündigung beantragt. 09:01 — Verlängerung bestätigt. Ausführende Identität: ALEX-PLUS (Assistenz)."
    }
  },

  contradiction: {
    claim: "Sie haben die Verlängerung um 09:01 persönlich bestätigt.",
    availableLabel: "Verfügbare Beweiskarte:",
    presentLabel: "Beweiskarte E2 vorlegen",
    noCard: "Ohne eine gültige Beweiskarte kann kein Widerspruch geführt werden.",
    success: "Widerspruch erfolgreich: Die Behauptung von MIRA wird zurückgenommen. Das Verfahren ist abgeschlossen.",
    resolvedBadge: "Abgeschlossen"
  },

  progress: {
    none: "Widersprüche gelöst: 0",
    done: "Widersprüche gelöst: 1 — Verfahren 1 abgeschlossen."
  },

  toolbar: {
    contradictionLocked: "Widerspruchsverfahren (noch kein Beweis)",
    contradictionOpen: "Widerspruchsverfahren (1 offen)",
    contradictionDone: "Widerspruchsverfahren (abgeschlossen)"
  },

  restart: {
    confirm: "Neustart bestätigen? Der gesamte Fortschritt dieses Spiels geht verloren."
  },

  status: {
    start: "Empfangsraum. Klicken Sie auf MIRA oder das Auskunftsterminal.",
    dialogClosed: "Gespräch mit MIRA beendet. Sie können es jederzeit erneut lesen.",
    contradictionCancelled: "Widerspruchsverfahren abgebrochen. Kein Fortschritt verloren.",
    contradictionClosed: "Verfahren 1 ist abgeschlossen.",
    restarted: "Neustart abgeschlossen. Der Spielstand ist zurückgesetzt."
  }
};
