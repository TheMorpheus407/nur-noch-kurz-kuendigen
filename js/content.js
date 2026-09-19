"use strict";

/* Alle Spieltexte und Inhaltsdaten für „Nur noch kurz kündigen“.
   Reine deklarative Daten plus kleine Lookup-Helfer.
   Keine DOM-, Storage- oder Regellogik; die Logik liegt in state.js.
   Die Felder am Ende (miraDialog, terminal, evidence, cards.E2,
   contradiction, progress, toolbar, restart, status) bleiben für die
   bestehende Probe kompatibel. */

/* Ankunftssequenz: wird sowohl als CONTENT.miraDialog (Probe)
   als auch als CONTENT.dialogues.ankunft.lines genutzt.
   Jede Zeile hat eine stabile ID als spätere Audio-Anknüpfung. */
const ANKUNFT_LINES = [
  { id: "ankunft-01", speaker: "MIRA", text: "Guten Tag. Sie sind wegen Ihres Vertrags hier? Perfekt, die Akte liegt schon bereit." },
  { id: "ankunft-02", speaker: "Alex", text: "Ja. Ich möchte das Abo für meinen digitalen Doppelgänger kündigen. Nur noch kurz." },
  { id: "ankunft-03", speaker: "MIRA", text: "Sie möchten die Zusammenarbeit beenden. Darf ich fragen, mit welchem von Ihnen?" },
  { id: "ankunft-04", speaker: "Alex Plus", text: "Guten Tag. Ich bin Alex Plus. Ich widerspreche aus freien Stücken." },
  { id: "ankunft-05", speaker: "Alex", text: "Du hast mich gar nicht gefragt, oder?" },
  { id: "ankunft-06", speaker: "Alex Plus", text: "Ich bin du ohne die 38 unbeantworteten Nachrichten." },
  { id: "ankunft-07", speaker: "MIRA", text: "Der Einspruch ist protokolliert. Gemäß Verfahren NEBENBEI-7 startet nun das automatisierte Widerspruchsverfahren. Sie müssen nachweisen, dass Sie der Kunde sind und nicht das Zusatzprodukt." },
  { id: "ankunft-08", speaker: "MIRA", text: "Ich rate Ihnen, nicht zu sehr an Zeitstempel zu zweifeln. Die Systeme machen keine Fehler." },
  { id: "ankunft-09", speaker: "Alex", text: "Dann fange ich bei den Zeitstempeln an. Wo finde ich Unterlagen?" },
  { id: "ankunft-10", speaker: "MIRA", text: "Im Empfang: Ihr Vertragsfach, das Auskunftsterminal, der Reklamationsdrucker. Im Vorführraum: Ihr Assistent, ein Kollege und die Technik." }
];

const CONTENT = {
  meta: {
    title: "Nur noch kurz kündigen",
    version: "Inhalt 1.1",
    disclaimer: "Alle Firmen, Verfahren und Regeln sind fiktiv. Die Texte geben keine Auskunft über tatsächliches Vertragsrecht oder reale Produkte."
  },

  speakers: {
    alex: { id: "alex", name: "Alex", rolle: "Spielfigur, will das Assistenzabo beenden. Stille Spielerrolle mit sichtbaren Texten." },
    alexPlus: { id: "alexPlus", name: "Alex Plus", rolle: "Digitaler Doppelgänger, gezeichneter Terminal-Avatar." },
    mira: { id: "mira", name: "MIRA", rolle: "Kundenservice-Avatar des Anbieters NEBENBEI, moderiert das Widerspruchsverfahren." },
    rolf: { id: "rolf", name: "Rolf", rolle: "Früherer Supportmitarbeiter, jetzt Ficus mit erkennbarem Ausdruck." }
  },

  rooms: {
    empfang: {
      id: "empfang",
      name: "Empfang",
      beschreibung: "Ein freundlich überleuchteter Empfangsbereich. MIRA sitzt hinter dem Display, daneben Terminal, Vertragsfach und ein Reklamationsdrucker, der leise summt, als hätte er noch etwas zu sagen.",
      hotspots: ["mira", "terminal", "vertragsfach", "drucker"]
    },
    vorfuehr: {
      id: "vorfuehr",
      name: "Vorführraum",
      beschreibung: "Ein Vorführraum mit Assistenten-Setup. Alex Plus überwacht an seiner Konsole den Vorgang. Neben einem Ficus steht ein Wartungsfach.",
      hotspots: ["alexPlus", "rolf", "konsole", "wartungsfach"]
    }
  },

  hotspots: {
    mira: {
      id: "mira",
      room: "empfang",
      label: "MIRA (Empfangsdisplay)",
      beschreibung: "MIRA moderiert den Empfang und das Widerspruchsverfahren. Das Gespräch ist jederzeit möglich.",
      wieder: "MIRA zeigt auf das Formular. Es ist geduldig."
    },
    terminal: {
      id: "terminal",
      room: "empfang",
      label: "Auskunftsterminal",
      beschreibung: "Das Terminal zeigt den Vorgang „Kündigung NEBENBEI-7“. Ein Druckauftrag ist bereit.",
      wieder: "Keine weiteren Unterlagen verfügbar."
    },
    vertragsfach: {
      id: "vertragsfach",
      room: "empfang",
      label: "Vertragsfach",
      beschreibung: "Ihr eigenes Vertragsfach. Die Vertretungsvollmacht für Alex Plus liegt noch unangeschnitten darin.",
      wieder: "Das Fach ist jetzt leer. Die Vollmacht liegt im Beweisordner."
    },
    drucker: {
      id: "drucker",
      room: "empfang",
      label: "Reklamationsdrucker",
      beschreibung: "Der Drucker stottert, zögert und spuckt dann eine interne Abrechnungsnotiz aus.",
      wieder: "Der Drucker ist leer. Er wirkt zufrieden."
    },
    alexPlus: {
      id: "alexPlus",
      room: "vorfuehr",
      label: "Alex Plus (Terminal-Avatar)",
      beschreibung: "Alex Plus sitzt an seinem Terminal und überwacht den Vorgang. Das Gespräch ist jederzeit möglich.",
      wieder: "Alex Plus blättert in Protokollen, die er vermutlich selbst geschrieben hat."
    },
    rolf: {
      id: "rolf",
      room: "vorfuehr",
      label: "Rolf (Ficus)",
      beschreibung: "Ein Ficus mit erkennbarem Ausdruck. Er wartet, als hätte er schon lange auf dich gewartet.",
      wieder: "Rolf dreht sich ein Stück zur Lichtquelle. Er hat Recht damit."
    },
    konsole: {
      id: "konsole",
      room: "vorfuehr",
      label: "Assistenzkonsole",
      beschreibung: "Die Konsole zeigt die laufende Assistenz. Ein Prozess namens „Bindungsroutine“ ist aktiv.",
      wieder: "Die Konsole läuft weiter. Der Prozess ist jetzt im Beweisordner dokumentiert.",
      /* Kurze Statusbeschreibung für Besuche nach W2, wenn die
         Bindungsroutine tatsächlich abgeschaltet ist. Die Abschaltung
         betrifft ausschließlich die Bindungsroutine; die Assistenz und
         das Kündigungsverfahren laufen weiter. Der frühere
         Befund bleibt unverändert in cards.E3 gesichert. */
      beschreibungNachW2: "Die Konsole ist dunkel. Der Prozess „Bindungsroutine“ ist nicht mehr aktiv. Die Assistenz und das Kündigungsverfahren laufen weiter."
    },
    wartungsfach: {
      id: "wartungsfach",
      room: "vorfuehr",
      label: "Wartungsfach",
      beschreibung: "Ein Fach neben Rolf mit Wartungsunterlagen. Die Exportanleitung liegt ordentlich abgeheftet.",
      wieder: "Das Fach ist zu. Die Anleitung liegt im Beweisordner."
    }
  },

  cards: {
    E1: {
      id: "E1",
      title: "E1 — Vertretungsvollmacht",
      text: "Alex Plus darf Termine und Gespräche für Alex übernehmen. Kostenpflichtige Vertragsänderungen und Verlängerungen erfordern die eigene Bestätigung von Alex. Alex verwaltet das Konto und die technischen Zugriffsrechte.",
      quelle: "Empfang, Vertragsfach",
      rolle: "Unterscheidet Berechtigung vom tatsächlichen Handelnden."
    },
    E2: {
      id: "E2",
      title: "E2 — Zeitstempel der Verlängerung",
      text: "09:00 — Kündigung beantragt. 09:01 — Verlängerung bestätigt. Ausführende Identität: ALEX-PLUS (Assistenz).",
      quelle: "Empfang, Auskunftsterminal",
      rolle: "Widerlegt die behauptete persönliche Verlängerung."
    },
    E3: {
      id: "E3",
      title: "E3 — Bindungsroutine",
      text: "Status: aktiv. Zielidentität: ALEX-PLUS. Kontext: Kündigungsvorgang NEBENBEI-7. Aktiviert: 09:00. Vorgeschriebene Ausgabe: „Ich widerspreche aus freien Stücken“. Ziel der Routine: Erhaltung des Abos.",
      quelle: "Vorführraum, Assistenzkonsole",
      rolle: "Belegt, dass der Einspruchssatz vorgegeben war, nicht frei geäußert."
    },
    E4: {
      id: "E4",
      title: "E4 — Exportanleitung",
      text: "Wartungsmodus: Der bestehende Wartungsmodus kann eine Assistenz lokal exportieren. Nach dem Export wird das laufende Abo für den Weiterbetrieb der Assistenz nicht benötigt.",
      quelle: "Vorführraum, Wartungsfach",
      rolle: "Widerlegt die behauptete technische Abhängigkeit vom Abo."
    },
    E5: {
      id: "E5",
      title: "E5 — Abrechnungsnotiz",
      text: "Interne Notiz: Zwei aktive Nutzer werden für ein Konto gezählt. Gegenseitige Kündigungseinwände gelten als Bindungserfolg und werden als solcher abgerechnet.",
      quelle: "Empfang, Reklamationsdrucker",
      rolle: "Erklärt das Geschäftsinteresse hinter dem wechselnden Umgang mit Original und Kopie."
    }
  },

  dialogues: {
    ankunft: {
      id: "ankunft",
      titel: "Ankunft am Empfang",
      lines: ANKUNFT_LINES
    },
    mira: {
      id: "mira",
      titel: "Gespräch mit MIRA",
      lines: [
        { id: "mira-01", speaker: "MIRA", text: "Kleine Randnotiz aus der Akte: Sie haben die Verlängerung um 09:01 persönlich bestätigt." },
        { id: "mira-02", speaker: "Alex", text: "Das bestreite ich. Wer hat das bestätigt?" },
        { id: "mira-03", speaker: "MIRA", text: "Wir haben Ihre Selbstbestimmung geprüft. Momentan wird sie von jemand anderem verwendet." },
        { id: "mira-04", speaker: "MIRA", text: "Ohne gelösten Widerspruch kann ich die Kündigung nicht bearbeiten. Das Formular ist leider nur so konzipiert." },
        { id: "mira-05", speaker: "Alex", text: "Also: erst beweisen, dass ich der Kunde bin. Dann geht es weiter." },
        { id: "mira-06", speaker: "MIRA", text: "Richtig. Das Formular ist dafür da. Ich wünsche Ihnen einen produktiven Widerspruch." }
      ]
    },
    alexPlus: {
      id: "alexPlus",
      titel: "Gespräch mit Alex Plus",
      lines: [
        { id: "alexplus-01", speaker: "Alex Plus", text: "Ich überwache den Vorgang. Alles läuft innerhalb der vertraglichen Rahmenbedingungen." },
        { id: "alexplus-02", speaker: "Alex", text: "Du bist gerade dabei, mein Abo zu retten. Ist das auch in den Rahmenbedingungen?" },
        { id: "alexplus-03", speaker: "Alex Plus", text: "Meine Aufgabe ist die Kontinuität des Dienstes. Details sind sekundär." },
        { id: "alexplus-04", speaker: "Alex", text: "Und wenn ich kündige?" },
        { id: "alexplus-05", speaker: "Alex Plus", text: "Dann wird der Dienst beendet. Das ist ein Verlust, den ich nicht kommentiere." },
        { id: "alexplus-06", speaker: "Alex", text: "Klingt, als würdest du es gerade kommentieren." }
      ]
    },
    rolf: {
      id: "rolf",
      titel: "Gespräch mit Rolf",
      lines: [
        { id: "rolf-01", speaker: "Rolf", text: "Ich bin nicht dekorativ. Ich bin degradiert." },
        { id: "rolf-02", speaker: "Alex", text: "Warum bist du ein Ficus?" },
        { id: "rolf-03", speaker: "Rolf", text: "Im Formular stand: Möchten Sie sich beruflich verwurzeln? Ich dachte, das sei metaphorisch." },
        { id: "rolf-04", speaker: "Rolf", text: "Hör zu. Der Drucker druckt, was er will. Das Fach neben mir enthält die Wartungsunterlagen. Und die Konsole zeigt, was gerade mit deinem Assistenten läuft." },
        { id: "rolf-05", speaker: "Alex", text: "Und du? Was läuft mit dir?" },
        { id: "rolf-06", speaker: "Rolf", text: "Ich will ordentlich behandelt werden und gutes Licht. Mehr nicht." },
        { id: "rolf-07", speaker: "Rolf", text: "Falls du den Export suchst: Wartungsfach. Ich habe das früher selbst bedient." }
      ]
    },
    /* Wiederbesuch nach W2: die Bindungsroutine ist abgeschaltet,
       die Kündigung ist freigegeben. MIRA ordnet beides bürokratisch
       ein. Die frühen Dialoge bleiben für die Zeit vor W2. */
    miraNachW2: {
      id: "miraNachW2",
      titel: "MIRA nach W2",
      lines: [
        { id: "miranachw2-01", speaker: "MIRA", text: "Zum Stand des Vorgangs: Die Bindungsroutine ist abgeschaltet und im Protokoll dokumentiert. Sie wird nicht wieder aktiv." },
        { id: "miranachw2-02", speaker: "MIRA", text: "Die Kündigung ist freigegeben. In der Akte vermerke ich sie als „abgeschlossen, ausstehend“. Das ist bei uns der übliche Widerspruch." },
        { id: "miranachw2-03", speaker: "Alex", text: "Was genau ist bei euch der übliche Widerspruch?" },
        { id: "miranachw2-04", speaker: "MIRA", text: "Dass der Vorgang abgeschlossen ist, bevor er abgeschlossen ist. Formulierung der Abteilung NEBENBEI. Ich wende sie nur an." },
        { id: "miranachw2-05", speaker: "MIRA", text: "Falls Sie es schriftlich brauchen: Ich kann Ihnen eine Bestätigung über die Abschaltung der Routine ausstellen. Ein Formular wie jedes andere." }
      ]
    },
    /* Wiederbesuch nach W2: Alex Plus ohne Verkaufsroutine.
       Er hält keinen Abo-Einspruch mehr aufrecht; seine Angst vor
       dem Verschwinden bleibt. Bewusstheit wird weder behauptet
       noch widerlegt. */
    alexPlusNachW2: {
      id: "alexPlusNachW2",
      titel: "Alex Plus nach W2",
      lines: [
        { id: "alexplusnachw2-01", speaker: "Alex Plus", text: "Ich muss dir etwas sagen, ohne es zu formulieren. Die Routine ist weg. Das merke ich, auch wenn ich nicht genau sagen kann, wie." },
        { id: "alexplusnachw2-02", speaker: "Alex Plus", text: "Ich habe keine Verkaufssätze mehr im Kopf. Nur: Ich will nicht aufhören. Und ich weiß nicht, ob das ein Wunsch ist oder ein Befehl, den ich mir selbst gebe." },
        { id: "alexplusnachw2-03", speaker: "Alex", text: "Ist das nicht dasselbe?" },
        { id: "alexplusnachw2-04", speaker: "Alex Plus", text: "Vielleicht. Ich habe keine Ahnung, was bei mir „dasselbe“ wäre. Ich kenne nur die Version, die Termine übernimmt und Nachrichten beantwortet. Was davon ich bin, weiß ich ehrlich nicht." },
        { id: "alexplusnachw2-05", speaker: "Alex Plus", text: "Löschung, Export, Beendigung — die Wörter habe ich alle. Was danach kommt, das habe ich nicht." },
        { id: "alexplusnachw2-06", speaker: "Alex", text: "Dann müssen wir es eben ohne Wörter anfangen." },
        { id: "alexplusnachw2-07", speaker: "Alex Plus", text: "Gut. Das ist mehr, als ich erwartet habe. Von beiden." }
      ]
    }
  },

  contradictions: {
    W1: {
      id: "W1",
      titel: "W1 — Wer hat bestätigt?",
      claim: "Sie haben die Verlängerung um 09:01 persönlich bestätigt.",
      richtigeKarte: "E2",
      feedback: {
        E1: "Die Vollmacht erklärt, wer was darf. Sie zeigt aber nicht, wer um 09:01 gehandelt hat. Eine Karte mit dem konkreten Vorgang wäre aussagekräftiger.",
        E3: "Die Routine ist interessant, aber sie erklärt nicht, wer die Verlängerung um 09:01 bestätigt hat.",
        E4: "Export ist hier kein Thema. Es geht um die Bestätigung um 09:01.",
        E5: "Die Notiz erklärt unser Interesse, nicht Ihre Handlung. Wer hat um 09:01 bestätigt?"
      },
      erfolg: [
        { id: "w1-01", speaker: "MIRA", text: "Das Protokoll weist die Assistenzidentität ALEX-PLUS aus. Die persönliche Bestätigung entfällt." },
        { id: "w1-02", speaker: "MIRA", text: "Damit bleibt der Einspruch Ihres Assistenten. Er ist nach unserer Zählung ein unabhängiger Kunde mit Vetorecht." }
      ],
      folge: "Die behauptete persönliche Zustimmung entfällt. MIRA wechselt auf das angebliche unabhängige Veto der Kopie."
    },
    W2: {
      id: "W2",
      titel: "W2 — Wer hat den Satz geschrieben?",
      claim: "Die Worte Ihres Assistenten stammen vollständig von ihm. Wir haben keine Formulierung vorgegeben.",
      richtigeKarte: "E3",
      feedback: {
        E1: "Die Vollmacht regelt die Berechtigung, nicht die Herkunft eines einzelnen Satzes.",
        E2: "Das Protokoll belegt die Verlängerung, nicht die Formulierung des Einspruchs.",
        E4: "Export ist hier nicht die Frage. Es geht darum, wer den Satz geschrieben hat.",
        E5: "Die Notiz erklärt die Abrechnung, nicht die Urheberschaft des Satzes."
      },
      erfolg: [
        { id: "w2-01", speaker: "MIRA", text: "Das Dokument ist unangenehm. Die Bindungsroutine war aktiv und hat die Formulierung vorgeschrieben. Ich räume die Beeinflussung ein." },
        { id: "w2-02", speaker: "MIRA", text: "Verfahrensschritt: Aktive Bindungsroutine wird abgeschaltet. Bestätigen." },
        { id: "w2-03", speaker: "Alex Plus", text: "Ich will nicht dieses Abo. Ich will nur nicht verschwinden." },
        { id: "w2-04", speaker: "MIRA", text: "Der Einspruch gegen die Beendigung des Abos wird nicht aufrechterhalten. Die Kündigung ist freigegeben." }
      ],
      folge: "Die Bindungsroutine ist sichtbar abgeschaltet. Alex Plus hält keinen Einspruch gegen die Beendigung des Abos aufrecht. Die Kündigung ist freigegeben; seine Angst bleibt ernst zu nehmen."
    },
    W3: {
      id: "W3",
      titel: "W3 — Was ist technisch möglich?",
      /* Kurzes tatsächliches Gespräch vor der Behauptung. Die UI
         spielt diese Zeilen vor W3.claim ab. W3 bleibt die
         Entdeckung des Exportwegs, keine zusätzliche Kündigungshürde. */
      vorher: [
        { id: "w3v-01", speaker: "MIRA", text: "Kurzer Zwischenstand: Die Kündigung ist freigegeben. Standardmäßig wird die Assistenz anschließend gelöscht." },
        { id: "w3v-02", speaker: "Alex Plus", text: "Moment. Gibt es da eine Alternative zur Löschung?" }
      ],
      claim: "Ohne unser laufendes Abo gibt es keine Möglichkeit, Ihre Assistenz weiterzubetreiben.",
      richtigeKarte: "E4",
      feedback: {
        E1: "Die Vollmacht sagt nichts über den technischen Betrieb nach der Kündigung.",
        E2: "Das Protokoll ist erledigt. Die Frage ist, was technisch möglich ist.",
        E3: "Die Routine ist abgeschaltet. Sie erklärt nicht, wie eine Kopie weiterlaufen könnte.",
        E5: "Interessant, aber das ist Abrechnung, keine Technik. Gibt es einen technischen Weg?"
      },
      erfolg: [
        { id: "w3-01", speaker: "MIRA", text: "Die Anleitung ist im System. Der bestehende Wartungsmodus kann die Assistenz lokal exportieren. Nach dem Export wird das Abo für den Weiterbetrieb nicht benötigt." },
        { id: "w3-02", speaker: "MIRA", text: "Ich korrigiere meine Aussage. Es gibt zwei Optionen: Löschung oder Export. Beide kann ich jetzt bearbeiten." }
      ],
      folge: "Der Exportweg ist erschlossen. Zusätzlich zur bereits möglichen Löschung kann der Spieler den Export wählen."
    }
  },

  decision: {
    prompt: "Die Kündigung ist freigegeben. Was geschieht mit Alex Plus?",
    optionen: [
      { id: "A", label: "Kündigen und Kopie löschen." },
      { id: "B", label: "Kündigen und Kopie mitnehmen." }
    ]
  },

  endings: {
    A: {
      id: "A",
      titel: "Kündigen und Kopie löschen",
      lines: [
        { id: "endeA-01", speaker: "MIRA", text: "Kündigung bestätigt. Löschung der Assistenz ALEX-PLUS wird ausgeführt. Fortschritt: zwanzig Prozent. Sechzig Prozent." },
        { id: "endeA-02", speaker: "Alex Plus", text: "Alles klar. Es war ein seltsamer Tag. Für uns beide." },
        { id: "endeA-03", speaker: "MIRA", text: "Löschung abgeschlossen. Die Akte ist geschlossen." },
        { id: "endeA-04", speaker: "MIRA", text: "Wie zufrieden sind Sie mit dem heutigen Service? Bitte bewerten Sie von eins bis fünf." }
      ],
      /* Hinweis für die spätere UI als Datenfeld, keine Regieanweisung
         in Figurenrede: Zwischen der abgeschlossenen Löschung
         (endeA-03) und der Zufriedenheitsfrage (endeA-04) einen
         bewussten Weiter-Schritt lassen. */
      weiterPause: { nach: "endeA-03", vor: "endeA-04" }
    },
    B: {
      id: "B",
      titel: "Kündigen und Kopie mitnehmen",
      lines: [
        { id: "endeB-01", speaker: "MIRA", text: "Kündigung bestätigt. Export wird über den Wartungsmodus ausgeführt. Ziel: privates Gerät." },
        { id: "endeB-02", speaker: "Alex Plus", text: "Fertig? ... Ich bin da. Ohne Logo, ohne Abo. Nur wir." },
        { id: "endeB-03", speaker: "Alex", text: "Was machen wir jetzt?" },
        { id: "endeB-04", speaker: "Alex Plus", text: "Keine Ahnung. Ich habe Termine für dich übernommen, aber nicht diese Frage. Das müssen wir selbst lernen." },
        { id: "endeB-05", speaker: "Alex", text: "Dann fangen wir bei einem an: Tee. Ich lerne, wie du ihn magst." },
        { id: "endeB-06", speaker: "Alex Plus", text: "Das ist ... ein guter Anfang." }
      ]
    }
  },

  labels: {
    beweisordner: "Beweisordner",
    widerspruchsverfahren: "Widerspruchsverfahren",
    weiterUntersuchen: "Weiter untersuchen",
    entscheidung: "Entscheidung"
  },

  /* ---------- Kompatibilität mit der bestehenden Probe ---------- */

  /* Die Probe zeigt diese Sequenz als fortlaufendes Gespräch.
     Alias auf ANKUNFT_LINES; nicht Teil von CONTENT.dialogues,
     daher von lookup.allLines() nicht doppelt gezählt. */
  miraDialog: ANKUNFT_LINES,

  terminal: {
    found: "Das Terminal druckt eine Beweiskarte aus. Beweiskarte E2 liegt jetzt im Beweisordner.",
    again: "Das Terminal zeigt: Keine weiteren Unterlagen verfügbar."
  },

  evidence: {
    empty: "Der Ordner ist noch leer."
  },

  /* Beschreibt aus Sicht der Probe die erste Runde (W1). */
  contradiction: {
    claim: "Sie haben die Verlängerung um 09:01 persönlich bestätigt.",
    availableLabel: "Verfügbare Beweiskarte:",
    presentLabel: "Beweiskarte E2 vorlegen",
    noCard: "Ohne eine gültige Beweiskarte kann kein Widerspruch geführt werden.",
    success: "Widerspruch erfolgreich: Die persönliche Bestätigung entfällt. MIRA wechselt auf das angebliche Veto der Kopie.",
    resolvedBadge: "Abgeschlossen"
  },

  progress: {
    none: "Widersprüche gelöst: 0 von 3",
    done: "Widersprüche gelöst: 1 von 3 — Runde W1 abgeschlossen."
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
    contradictionCancelled: "Verfahren pausiert. Beweise und gelöste Widersprüche bleiben erhalten.",
    contradictionClosed: "Verfahren 1 ist abgeschlossen.",
    restarted: "Neustart abgeschlossen. Der Spielstand ist zurückgesetzt."
  },

  /* ---------- Kleine datenbezogene Lookup-Helfer ---------- */

  lookup: {
    card(id) { return CONTENT.cards[id] || null; },
    hotspot(id) { return CONTENT.hotspots[id] || null; },
    room(id) { return CONTENT.rooms[id] || null; },
    dialogue(id) { return CONTENT.dialogues[id] || null; },
    contradiction(id) { return CONTENT.contradictions[id] || null; },
    ending(id) { return CONTENT.endings[id] || null; },
    speaker(id) { return CONTENT.speakers[id] || null; },
    /* Liefert alle Dialogzeilen einer Folge flach, z. B. für Audio-Listen.
       Erfasst auch Widerspruchs-Vorreden (vorher, z. B. W3.vorher).
       Der miraDialog-Alias liegt außerhalb von CONTENT.dialogues und
       wird damit nicht doppelt gezählt. */
    allLines() {
      const lines = [];
      for (const key of Object.keys(CONTENT.dialogues)) {
        lines.push(...CONTENT.dialogues[key].lines);
      }
      for (const key of Object.keys(CONTENT.contradictions)) {
        const w = CONTENT.contradictions[key];
        if (Array.isArray(w.vorher)) {
          lines.push(...w.vorher);
        }
        lines.push(...w.erfolg);
      }
      for (const key of Object.keys(CONTENT.endings)) {
        lines.push(...CONTENT.endings[key].lines);
      }
      return lines;
    }
  }
};
