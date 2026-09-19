"use strict";

/* =========================================================================
 * js/ui.js — „Nur noch kurz kündigen“
 * Darstellung und Ereignisverdrahtung der vollständigen Textfassung.
 *
 * Liest nur CONTENT (Texte/Daten) und ruft GameState-Methoden auf —
 * eigene Spielregeln fehlen hier. Alle Zustandsänderungen laufen über
 * die State-API; die UI rendert das Ergebnis und meldet Erfolg/Fehler.
 *
 * Keine Module, kein fetch, keine externen Pakete: klassisches lokales
 * Skript, direkt per file:// lauffähig. Keine Telemetrie, keine Requests.
 *
 * Aufbau:
 *   - Raumnavigation (Empfang / Vorführraum) mit Besuchsmarkierung
 *   - Szene: vier Hotspot-Schaltflächen pro Raum (Gespräch / Fundstelle)
 *   - Dialogmotor (Weiter/Schließen) für Ankunft, NPC-Gespräche,
 *     Folgedialoge und beide Enden — Zeilen werden in den Verlauf geloggt
 *   - Beweisordner (E1–E5 mit vollständigem Text) und Verlauf
 *   - Widerspruchsverfahren: W1→W2→W3, Kartenwahl, passende Rückmeldung,
 *     Folgedialog, „Weiter untersuchen“ ohne Fortschrittsverlust
 *   - Entscheidung (A löschen / B exportieren), Enddialoge,
 *     Entscheidungspunkt (Checkpoint) als Rückweg zur anderen Wahl
 *   - Speichern/Laden/Neustart über die State-Methoden mit klaren Meldungen
 *   - Tastatur: echte Buttons, Fokusführung, Escape schließt ohne Verlust
 * ========================================================================= */

/* Gesprächspunkte (NPCs) vs. Fundstellen (Karten). */
const NPC_IDS = ["mira", "alexPlus", "rolf"];

/* UI-eigene Status- und Hinweiszeilen (Bedienung, kein Erzähltext).
   Alle Erzähltexte kommen aus content.js. */
const UI_TEXTS = {
  start: "Empfang. Wählen Sie in der Szene ein Gespräch oder eine Fundstelle.",
  roomLocked: "Der Vorführraum ist noch nicht freigegeben. Zuerst: das Auskunftsterminal im Empfang.",
  ended: "Das Ende ist abgeschlossen. Über „Zum Entscheidungspunkt“ erreichen Sie den gesicherten Stand.",
  cardFound: (id) => "Beweiskarte " + id + " liegt jetzt im Beweisordner.",
  cardAlready: "Die Karte liegt bereits im Beweisordner.",
  notUnlocked: "Noch nicht freigegeben. Das Auskunftsterminal ist der richtige Anfang.",
  alexPlusGeloescht: "Das Terminal ist dunkel. ALEX-PLUS ist gelöscht und nicht mehr aktiv.",
  alexPlusExportiert: "Das Terminal ist dunkel. ALEX-PLUS wurde exportiert.",
  saveOk: "Spielstand gesichert.",
  saveOkMemory: "Spielstand nur für diese Sitzung gesichert — lokales Speichern ist im Browser blockiert.",
  saveFail: "Speichern fehlgeschlagen. Der Spielstand läuft weiter, ist aber nicht gesichert.",
  loadOk: "Gespeicherter Stand geladen.",
  loadNone: "Kein gespeicherter Stand vorhanden.",
  loadInvalid: "Der gespeicherte Stand ist ungültig und wurde nicht geladen. Der aktuelle Stand bleibt erhalten.",
  checkpointOk: "Entscheidungspunkt geladen. Die Entscheidung ist wieder offen.",
  checkpointNone: "Noch kein Entscheidungspunkt gesichert — er entsteht automatisch nach Runde W3.",
  checkpointAuto: "Entscheidungspunkt automatisch gesichert.",
  checkpointAutoMemory: "Entscheidungspunkt nur für diese Sitzung gesichert — lokales Speichern ist im Browser blockiert; nach Schließen/Neuladen nicht verlässlich wiederherstellbar.",
  decisionCheckpointMemory: "Der Entscheidungspunkt ist nur für diese Sitzung gesichert (lokales Speichern blockiert) — nach Schließen/Neuladen nicht verlässlich wiederherstellbar.",
  roundDone: "Runde abgeschlossen.",
  endingConfirm: "Diese Entscheidung ist für diesen Spielstand endgültig. Der Entscheidungspunkt bleibt ladbar. Bestätigen?",
  endingNote: "Das Ende ist für diesen Spielstand abgeschlossen. Über „Zum Entscheidungspunkt“ können Sie zum gesicherten Stand zurückkehren und die andere Option wählen.",
  noLog: "Noch keine Gesprächszeilen im Verlauf.",
  audioOn: "Stimmen an: vertonte Zeilen werden gesprochen.",
  audioOff: "Stimmen aus: laufende Sprache gestoppt.",
  audioOffHint: "Stimmen sind ausgeschaltet — „Stimmen an“ schaltet sie ein.",
  miraNachW1Titel: "MIRA — Stand des Vorgangs",
  procedureLocked: "Zuerst eine Beweiskarte finden: das Auskunftsterminal im Empfang.",
  cardPickLabel: "Beweiskarte aus dem Ordner wählen und vorlegen:",
  claimBy: "MIRA behauptet:",
  vorherLabel: "Vor der Behauptung — kurzes Gespräch:",
  resolvedPrefix: "Abgeschlossen:"
};

const UI = {
  els: {},
  _dialogue: null,        /* aktive Dialogfolge: {steps, index, onDone} */
  _procedureView: null,   /* aktive Verfahrensansicht: {type, rid} */
  _focusReturn: null,     /* Element, auf das der Fokus beim Schließen zurückgeht */
  _openStack: [],         /* geöffnete schließbare Panels, zuletzt oben (Escape) */
  lastAdvanceAt: 0,
  ADVANCE_LOCK_MS: 250,   /* Mehrfachklick-Schutz: keine Zeilen springen verloren */

  /* ---------- Initialisierung ---------- */

  init() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      roomButtons: [
        document.querySelector('#room-empfang'),
        document.querySelector('#room-vorfuehr')
      ],
      roomName: $("room-name"),
      roomDesc: $("room-desc"),
      scene: $("scene"),
      stage: document.querySelector("#stage"),
      sceneBg: $("scene-bg"),
      stageHotspots: $("stage-hotspots"),
      hotspotInfo: $("hotspot-info"),
      hotspotInfoLabel: $("hotspot-info-label"),
      hotspotInfoText: $("hotspot-info-text"),
      statusLine: $("status-line"),
      progressLine: $("progress-line"),
      dialoguePanel: $("dialogue-panel"),
      dialogueTitle: $("dialogue-title"),
      dialogueBody: $("dialogue-body"),
      btnDialogueNext: $("btn-dialogue-next"),
      btnDialogueClose: $("btn-dialogue-close"),
      evidencePanel: $("evidence-panel"),
      evidenceList: $("evidence-list"),
      btnEvidence: $("btn-evidence"),
      btnEvidenceClose: $("btn-evidence-close"),
      logPanel: $("log-panel"),
      logList: $("log-list"),
      btnLog: $("btn-log"),
      btnLogClose: $("btn-log-close"),
      procedurePanel: $("procedure-panel"),
      procedureTitle: $("procedure-title"),
      procedureBody: $("procedure-body"),
      btnProcedure: $("btn-procedure"),
      btnProcedureClose: $("btn-procedure-close"),
      endingPanel: $("ending-panel"),
      endingTitle: $("ending-title"),
      endingBody: $("ending-body"),
      btnSave: $("btn-save"),
      btnLoad: $("btn-load"),
      btnCheckpoint: $("btn-checkpoint"),
      btnRestart: $("btn-restart"),
      btnAudio: $("btn-audio")
    };

    /* Raumwechsel */
    for (const btn of this.els.roomButtons) {
      btn.addEventListener("click", () => this.openRoom(btn.dataset.room));
    }

    /* Dialog */
    this.els.btnDialogueNext.addEventListener("click", () => this.advanceDialogue());
    this.els.btnDialogueClose.addEventListener("click", () => this.finishDialogue());

    /* Beweisordner */
    this.els.btnEvidence.addEventListener("click", () => this.openEvidence());
    this.els.btnEvidenceClose.addEventListener("click", () => this.closeEvidence());

    /* Verlauf */
    this.els.btnLog.addEventListener("click", () => this.openLog());
    this.els.btnLogClose.addEventListener("click", () => this.closeLog());

    /* Widerspruchsverfahren */
    this.els.btnProcedure.addEventListener("click", () => this.openProcedure());
    this.els.btnProcedureClose.addEventListener("click", () => this.closeProcedure());

    /* Stimmen: Master-Umschalter, beginnt bewusst ausgeschaltet */
    GameAudio.init();
    GameAudio.setNoticeHandler((text) => this.setStatus(text));
    this.els.btnAudio.addEventListener("click", () => this.toggleAudio());

    /* Speichern / Laden / Entscheidungspunkt / Neustart */
    this.els.btnSave.addEventListener("click", () => this.doSave());
    this.els.btnLoad.addEventListener("click", () => this.doLoad());
    this.els.btnCheckpoint.addEventListener("click", () => this.doCheckpoint());
    this.els.btnRestart.addEventListener("click", () => this.doRestart());

    /* Escape: schließt das zuletzt geöffnete schließbare Panel in der
       tatsächlichen Öffnungsreihenfolge, ohne Fortschritt zu verlieren. */
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      const top = this._openStack[this._openStack.length - 1];
      if (!top) {
        return;
      }
      if (top === "dialogue") {
        this.finishDialogue();
      } else if (top === "procedure") {
        this.closeProcedure();
      } else if (top === "evidence") {
        this.closeEvidence();
      } else if (top === "log") {
        this.closeLog();
      }
    });

    this.renderAll();

    /* Erster Start: vorhandene Ankunftsszene.
       (Bewusst NICHT GameState.reset() — see js/main.js.) */
    const ankunft = CONTENT.dialogues.ankunft;
    this.openDialogue({
      title: ankunft.titel,
      steps: this.buildSteps(ankunft.lines)
    });
  },

  /* ---------- Kleine DOM-Helfer ---------- */

  make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (text !== undefined && text !== null) {
      el.textContent = text;
    }
    return el;
  },

  /* Sprecher-Portrait: exakte Sprechernamen aus ART_ASSETS.portraits
     („MIRA“, „Alex Plus“, „Rolf“). Keine Teilstring-Erkennung —
     „Alex“ (stumm) erhält kein Portrait. Fehlende Daten: null,
     die Zeile rendert unverändert weiter. Bildladefehler: das
     kaputte Bild wird ausgeblendet, der Dialog bleibt lauffähig.
     Standard: ein Bild pro Figur; bei passendem portraitByLine-Eintrag
     (exakter speaker + gültiges Ausdrucks-Bild) das Ausdrucks-Bild.
     Ohne Emotionen/Filter/Ausschnitte. */
  makeSpeakerPortrait(speaker, lineId) {
    const art = (typeof ART_ASSETS !== "undefined" && ART_ASSETS) ? ART_ASSETS : null;
    const portraits = (art && art.portraits) ? art.portraits : null;
    let p = (portraits && typeof speaker === "string" &&
      Object.prototype.hasOwnProperty.call(portraits, speaker)) ?
      portraits[speaker] : null;
    /* Passender portraitByLine-Eintrag (eigene Schlüssel, exakter
       speaker, gültiges Ausdrucks-Bild) ersetzt das Standardportrait. */
    if (art && typeof lineId === "string" && lineId.length > 0 &&
        art.portraitByLine &&
        Object.prototype.hasOwnProperty.call(art.portraitByLine, lineId)) {
      const mapping = art.portraitByLine[lineId];
      if (mapping && mapping.speaker === speaker &&
          typeof mapping.expression === "string" &&
          art.expressions &&
          Object.prototype.hasOwnProperty.call(art.expressions, speaker) &&
          Object.prototype.hasOwnProperty.call(art.expressions[speaker], mapping.expression)) {
        const candidate = art.expressions[speaker][mapping.expression];
        if (candidate && typeof candidate.url === "string" && candidate.url.length > 0) {
          p = candidate;
        }
      }
    }
    if (!p || typeof p.url !== "string" || p.url.length === 0) {
      return null;
    }
    const img = document.createElement("img");
    img.className = "speaker-portrait";
    img.setAttribute("alt", "");
    img.setAttribute("src", p.url);
    if (typeof p.width === "number" && Number.isFinite(p.width)) {
      img.setAttribute("width", String(p.width));
    }
    if (typeof p.height === "number" && Number.isFinite(p.height)) {
      img.setAttribute("height", String(p.height));
    }
    img.addEventListener("error", () => {
      img.hidden = true;
    });
    return img;
  },

  rememberFocus() {
    this._focusReturn = document.activeElement;
  },

  /* Öffnungsreihenfolge der schließbaren Panels verwalten: das zuletzt
     geöffnete Panel steht oben; Escape schließt genau dieses (LIFO). */
  trackOpen(panelId) {
    const i = this._openStack.indexOf(panelId);
    if (i >= 0) {
      this._openStack.splice(i, 1);
    }
    this._openStack.push(panelId);
  },

  trackClose(panelId) {
    const i = this._openStack.lastIndexOf(panelId);
    if (i >= 0) {
      this._openStack.splice(i, 1);
    }
  },

  restoreFocus(fallback) {
    const target = this._focusReturn;
    this._focusReturn = null;
    const candidates = [];
    if (target && document.contains(target)) {
      candidates.push(target);
    }
    if (fallback && document.contains(fallback) && fallback !== target) {
      candidates.push(fallback);
    }
    /* Fokussierter Knoten fehlt/ersetzt/verborgen: sinnvoller, erreichbarer
       Rückkehrpunkt statt Fokusverlust. */
    for (const el of candidates) {
      el.focus();
      if (document.activeElement === el) {
        return;
      }
    }
  },

  /* ---------- Status und Fortschritt ---------- */

  setStatus(text) {
    this.els.statusLine.textContent = text;
  },

  updateProgress() {
    const s = GameState.get();
    const n = s.rounds.resolved.length;

    if (n === 0) {
      this.els.progressLine.textContent = CONTENT.progress.none;
    } else if (n === 1) {
      this.els.progressLine.textContent = CONTENT.progress.done;
    } else {
      this.els.progressLine.textContent =
        "Widersprüche gelöst: " + n + " von 3" +
        (n === 3 ? " — Entscheidung möglich." : "");
    }

    let label;
    if (s.ended) {
      label = CONTENT.labels.entscheidung + " — abgeschlossen";
    } else if (!s.e2Found) {
      label = CONTENT.toolbar.contradictionLocked;
    } else if (n === 3) {
      label = CONTENT.labels.entscheidung;
    } else {
      label = CONTENT.labels.widerspruchsverfahren + " (" + (3 - n) + " offen)";
    }
    this.els.btnProcedure.textContent = label;
  },

  /* ---------- Gesamtes Rendering ---------- */

  renderAll() {
    this.closeAllPanels();
    this.renderWorld();
    this.setStatus(GameState.get().ended ? UI_TEXTS.ended : UI_TEXTS.start);
  },

  closeAllPanels() {
    this.stopAudio();
    this._dialogue = null;
    this._openStack.length = 0;
    this.els.dialoguePanel.hidden = true;
    this.els.evidencePanel.hidden = true;
    this.els.logPanel.hidden = true;
    this.els.procedurePanel.hidden = true;
    this.els.endingPanel.hidden = true;
    this.els.hotspotInfo.hidden = true;
  },

  renderWorld() {
    this.updateProgress();
    const s = GameState.get();

    /* Raumnavigation: aktueller Raum, Besuchsmarkierung, Sperrzustand */
    for (const btn of this.els.roomButtons) {
      const room = btn.dataset.room;
      const isCurrent = s.room === room;
      const locked = s.ended ||
        (room === "vorfuehr" && !s.cards.includes("E2"));
      btn.setAttribute("aria-current", isCurrent ? "true" : "false");
      if (locked) {
        btn.setAttribute("aria-disabled", "true");
      } else {
        btn.removeAttribute("aria-disabled");
      }
      const visited = isCurrent ||
        s.visitedHotspots.some((h) =>
          CONTENT.hotspots[h] && CONTENT.hotspots[h].room === room);
      btn.classList.toggle("visited", visited);
    }

    /* Raumname und passende Beschreibung */
    const room = CONTENT.rooms[s.room];
    this.els.roomName.textContent = room.name;
    this.els.roomDesc.textContent = room.beschreibung;

    /* Szene: gezeichneter 16:9-Raum (unbeschnitten) + vier echte
       Hotspot-Buttons. Anker ausschließlich aus dem Bildkatalog
       (js/art-catalog.js); ohne Katalog/Daten bleiben die Buttons als
       gut lesbare Liste bedienbar (stage--list). */
    const art = (typeof ART_ASSETS !== "undefined" && ART_ASSETS) ? ART_ASSETS : null;
    const roomArt = (art && art.rooms && art.rooms[s.room]) ? art.rooms[s.room] : null;
    const anchors = (roomArt && roomArt.hotspots) ? roomArt.hotspots : null;

    if (roomArt && roomArt.url) {
      if (this.els.sceneBg.getAttribute("src") !== roomArt.url) {
        this.els.sceneBg.setAttribute("src", roomArt.url);
      }
      this.els.sceneBg.setAttribute("width", String(roomArt.width));
      this.els.sceneBg.setAttribute("height", String(roomArt.height));
      this.els.stage.classList.remove("stage--list");
    } else {
      this.els.stage.classList.add("stage--list");
    }

    const hotspotsEl = this.els.stageHotspots;
    hotspotsEl.textContent = "";
    for (const id of room.hotspots) {
      const h = CONTENT.hotspots[id];
      const isNpc = NPC_IDS.includes(id);
      let label = h.label;
      if (id === "alexPlus" && s.alexPlus !== "active") {
        label += " — offline";
      }
      /* Bereits besuchte/gesammelte Orte bleiben erkennbar. */
      const collected = !isNpc &&
        typeof CARD_SOURCE !== "undefined" &&
        Object.prototype.hasOwnProperty.call(CARD_SOURCE, id) &&
        s.cards.includes(CARD_SOURCE[id]);
      const visited = s.visitedHotspots.includes(id);
      if (collected) {
        label += " — im Beweisordner";
      } else if (visited) {
        label += " — besucht";
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot";
      if (collected) {
        btn.classList.add("is-collected");
      } else if (visited) {
        btn.classList.add("is-visited");
      }
      const anchor = (anchors && anchors[id]) ? anchors[id] : null;
      if (anchor &&
          typeof anchor.x === "number" && Number.isFinite(anchor.x) &&
          typeof anchor.y === "number" && Number.isFinite(anchor.y)) {
        btn.classList.add("is-placed");
        btn.style.left = (anchor.x * 100) + "%";
        btn.style.top = (anchor.y * 100) + "%";
      }
      btn.append(
        this.make("span", "hotspot-kind", isNpc ? "Gespräch" : "Fundstelle"),
        this.make("span", "hotspot-label", label)
      );
      if (s.ended) {
        btn.setAttribute("aria-disabled", "true");
      }
      btn.addEventListener("click", () => this.onHotspot(id));
      hotspotsEl.appendChild(btn);
    }
  },

  /* ---------- Raumwechsel ---------- */

  openRoom(roomId) {
    const s = GameState.get();
    if (s.ended) {
      this.setStatus(UI_TEXTS.ended);
      return;
    }
    if (roomId === s.room) {
      this.renderWorld();
      return;
    }
    const r = GameState.enterRoom(roomId);
    if (!r.ok) {
      if (r.reason === "room-locked") {
        this.setStatus(UI_TEXTS.roomLocked);
      } else {
        this.setStatus("Raumwechsel nicht möglich.");
      }
      return;
    }
    this.stopAudio();
    this.renderWorld();
    this.setStatus(CONTENT.rooms[roomId].name + ". Vier Punkte sind in der Szene sichtbar.");
  },

  /* ---------- Hotspots: Gespräche und Fundstellen ---------- */

  onHotspot(id) {
    const s = GameState.get();
    if (s.ended) {
      this.setStatus(UI_TEXTS.ended);
      return;
    }

    const v = GameState.visitHotspot(id);
    if (!v.ok) {
      if (v.reason === "room-locked") {
        this.setStatus(UI_TEXTS.roomLocked);
      } else {
        this.setStatus("Noch nicht möglich.");
      }
      return;
    }

    if (NPC_IDS.includes(id)) {
      this.showHotspotInfo(id, v.firstVisit);
      this.openNpcDialogue(id);
      return;
    }

    /* Fundstelle: Karte einmal vergeben, vollständiger Text im Ordner. */
    const c = GameState.collectFrom(id);
    if (c.ok) {
      this.renderWorld();
      this.showHotspotInfo(id, true);
      this.setStatus(UI_TEXTS.cardFound(c.card));
      this.openEvidence();
    } else if (c.reason === "already-found") {
      this.showHotspotInfo(id, false);
      this.setStatus(UI_TEXTS.cardAlready);
    } else if (c.reason === "locked") {
      this.showHotspotInfo(id, v.firstVisit);
      this.setStatus(UI_TEXTS.notUnlocked);
    } else {
      this.showHotspotInfo(id, v.firstVisit);
    }
  },

  /* Passender Kurztext der Fundstelle:
     - Konsole nach W2: beschreibungNachW2 (Routine tatsächlich aus)
     - sonst: Beschreibung beim ersten Besuch, „wieder“-Text danach */
  hotspotText(id, firstVisit) {
    const h = CONTENT.hotspots[id];
    if (id === "konsole" &&
        GameState.get().rounds.resolved.includes("W2")) {
      return h.beschreibungNachW2;
    }
    return firstVisit ? h.beschreibung : h.wieder;
  },

  showHotspotInfo(id, firstVisit) {
    this.els.hotspotInfoLabel.textContent = CONTENT.hotspots[id].label;
    this.els.hotspotInfoText.textContent = this.hotspotText(id, firstVisit);
    this.els.hotspotInfo.hidden = false;
  },

  /* ---------- NPC-Gespräche ---------- */

  openNpcDialogue(id) {
    const s = GameState.get();

    if (id === "mira") {
      this.openDialogue({
        title: this.miraDialogue().titel,
        steps: this.buildSteps(this.miraDialogue().lines)
      });
      return;
    }

    if (id === "alexPlus") {
      /* Löschung/Export wirklich als abgeschlossen darstellen:
         Alex Plus ist danach kein aktiver Avatar mehr. */
      if (s.alexPlus === "deleted") {
        this.setStatus(UI_TEXTS.alexPlusGeloescht);
        return;
      }
      if (s.alexPlus === "exported") {
        this.setStatus(UI_TEXTS.alexPlusExportiert);
        return;
      }
      const d = s.rounds.resolved.includes("W2")
        ? CONTENT.dialogues.alexPlusNachW2
        : CONTENT.dialogues.alexPlus;
      this.openDialogue({ title: d.titel, steps: this.buildSteps(d.lines) });
      return;
    }

    /* Rolf */
    const d = CONTENT.dialogues.rolf;
    this.openDialogue({ title: d.titel, steps: this.buildSteps(d.lines) });
  },

  /* MIRA je nach Verfahrensstand:
     - nach W2: miraNachW2 (Routine aus, Kündigung freigegeben —
       keine neue aktive Bindung, keine gesperrte Kündigung)
     - nach W1: vorhandener W1-Folgetext — die widerlegte persönliche
       Verlängerung wird NICHT erneut als Tatsache behauptet
     - sonst: frühes Gespräch (vor W2) */
  miraDialogue() {
    const s = GameState.get();
    if (s.rounds.resolved.includes("W2")) {
      return CONTENT.dialogues.miraNachW2;
    }
    if (s.rounds.resolved.includes("W1")) {
      return {
        id: "miraNachW1",
        titel: UI_TEXTS.miraNachW1Titel,
        lines: [{
          id: "miraNachW1-01",
          speaker: "MIRA",
          text: CONTENT.contradictions.W1.folge
        }]
      };
    }
    return CONTENT.dialogues.mira;
  },

  /* ---------- Stimmen (lokale TTS-Dateien, js/audio.js) ---------- */

  currentDialogueStep() {
    const d = this._dialogue;
    return d ? d.steps[d.index] : null;
  },

  /* Laufende Sprache stoppen und wartende Clips verwerfen. */
  stopAudio() {
    GameAudio.stop();
  },

  /* Master-Umschalter. Bei Einschalten spielt die gerade sichtbare
     vertonte Dialogzeile — oder, falls die Verfahrensansicht aktiv
     ist, die dort sichtbaren vertonten Zeilen in sichtbarer
     Reihenfolge. Bei Ausschalten stoppt alles sofort und leert die
     Queue. */
  toggleAudio() {
    const on = GameAudio.toggle();
    this.els.btnAudio.textContent = on ? "Stimmen aus" : "Stimmen an";
    this.els.btnAudio.setAttribute("aria-pressed", on ? "true" : "false");
    if (on) {
      /* Fix018c: Audio folgt wie Escape dem zuletzt geöffneten Panel. */
      const activePanel = this._openStack[this._openStack.length - 1];
      if (activePanel === "procedure" && !this.els.procedurePanel.hidden) {
        this.playVisibleProcedureAudio();
      } else if (activePanel === "dialogue" && !this.els.dialoguePanel.hidden) {
        const step = this.currentDialogueStep();
        if (step && step.kind === "line" && GameAudio.hasLine(step.id)) {
          GameAudio.playLine(step.id);
        }
      }
      this.setStatus(UI_TEXTS.audioOn);
    } else {
      this.setStatus(UI_TEXTS.audioOff);
    }
  },

  /* Bei bewusstem Einschalten: genau die gerade sichtbaren vertonten
     Verfahrenszeilen der tatsächlich aktiven Ansicht in sichtbarer
     Reihenfolge abspielen (Erfolgsfolge bzw. W3-Einleitung). Keine
     veraltete Folge, keine neue Runde, keine Dialogansicht im
     Hintergrund. Stille Zeilen bleiben still; ohne vertonte Zeilen
     passiert nichts. */
  playVisibleProcedureAudio() {
    const view = this._procedureView;
    if (!view || !view.rid) {
      return false;
    }
    const w = CONTENT.contradictions[view.rid];
    if (!w) {
      return false;
    }
    if (view.type === "success" && Array.isArray(w.erfolg)) {
      GameAudio.playSequence(w.erfolg.map((l) => l.id));
      return true;
    }
    if (view.type === "round" && Array.isArray(w.vorher)) {
      GameAudio.playSequence(w.vorher.map((l) => l.id));
      return true;
    }
    return false;
  },

  /* Bewusst angeklickte Zeile wieder abspielen (Dialog oder Verlauf).
     Bei ausgeschalteten Stimmen: kurzer Hinweis statt Audio. */
  replayLine(id) {
    if (!GameAudio.isEnabled()) {
      this.setStatus(UI_TEXTS.audioOffHint);
      return;
    }
    GameAudio.playLine(id);
  },

  /* Kleine Wiederhol-Schaltfläche für eine vertonte Zeile. */
  makeReplayButton(id, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "audio-replay ghost";
    btn.textContent = label;
    btn.addEventListener("click", () => this.replayLine(id));
    return btn;
  },

  /* ---------- Dialogmotor (Weiter / Schließen) ---------- */

  buildSteps(lines) {
    return lines.map((l) => ({
      kind: "line",
      id: l.id,
      speaker: l.speaker,
      text: l.text
    }));
  },

  openDialogue(opts) {
    this.stopAudio();
    this._dialogue = {
      steps: opts.steps,
      index: 0,
      onDone: opts.onDone || null
    };
    this.els.dialogueTitle.textContent = opts.title;
    this.rememberFocus();
    this.els.dialoguePanel.hidden = false;
    this.trackOpen("dialogue");
    this.renderStep();
    this.els.btnDialogueNext.focus();
  },

  speakerClass(speaker) {
    if (speaker === "Alex") {
      return " is-alex";
    }
    if (speaker === "Alex Plus") {
      return " is-alexplus";
    }
    return "";
  },

  renderStep() {
    const d = this._dialogue;
    const step = d.steps[d.index];
    const body = this.els.dialogueBody;
    body.textContent = "";

    if (step.kind === "line") {
      this.safeLog(step.speaker, step.text, step.id);
      const line = this.make("div", "dialogue-line");
      const portrait = this.makeSpeakerPortrait(step.speaker, step.id);
      if (portrait) {
        line.appendChild(portrait);
      }
      line.append(
        this.make("span", "dialogue-speaker" + this.speakerClass(step.speaker), step.speaker),
        this.make("p", "dialogue-text", step.text)
      );
      body.appendChild(line);
      /* Vertonte Zeile: bei aktivierten Stimmen die zugehörige Datei
         abspielen + klare Wiederholfunktion. Stille Zeilen (z. B. Alex)
         bleiben sichtbar und ohne Ton. */
      if (GameAudio.hasLine(step.id)) {
        body.appendChild(this.makeReplayButton(step.id, "Zeile wiederholen"));
        GameAudio.playLine(step.id);
      } else {
        /* Wechsel zu einer stillen/fehlenden Zeile: vorherige Stimme
           sofort stoppen und wartende Clips verwerfen — keine laufende
           Medienzeit unter der neuen Zeile, kein Ersatzclip. */
        this.stopAudio();
      }
    } else {
      /* Bewusster Lesemoment (z. B. Ende A zwischen Löschung und
         Zufriedenheitsfrage): eigener Schritt, eigener Weiter-Klick.
         Die bewusste Pause bleibt stumm und stoppt laufende Sprache. */
      this.stopAudio();
      body.appendChild(this.make("div", "dialogue-pause", "· · ·"));
    }

    const last = d.index >= d.steps.length - 1;
    this.els.btnDialogueNext.textContent = last ? "Schließen" : "Weiter";
  },

  advanceDialogue() {
    const now = Date.now();
    if (now - this.lastAdvanceAt < this.ADVANCE_LOCK_MS) {
      return; /* schneller Mehrfachklick: bewusst ignorieren */
    }
    this.lastAdvanceAt = now;

    const d = this._dialogue;
    if (!d) {
      return;
    }
    if (d.index < d.steps.length - 1) {
      d.index += 1;
      this.renderStep();
    } else {
      this.finishDialogue();
    }
  },

  /* Schließen (Button, Escape oder letzter Schritt): ohne Fortschritts-
     verlust; bei Enddialogen schließt der Abschluss das Ende ab. */
  finishDialogue() {
    this.stopAudio();
    const d = this._dialogue;
    this._dialogue = null;
    this.trackClose("dialogue");
    this.els.dialoguePanel.hidden = true;
    this.restoreFocus(document.body);
    if (d && d.onDone) {
      d.onDone();
    }
  },

  /* Zeile in den Gesprächsverlauf legen — pro Zeilen-ID nur einmal,
     damit erneutes Lesen desselben Dialogs keine Duplikate erzeugt. */
  safeLog(speaker, text, id) {
    if (id) {
      const log = GameState.getDialogueLog();
      if (log.some((l) => l.id === id)) {
        return;
      }
    }
    GameState.addDialogueLine(speaker, text, id);
  },

  /* ---------- Beweisordner ---------- */

  openEvidence() {
    this.stopAudio();
    this.renderEvidenceList();
    this.rememberFocus();
    this.els.evidencePanel.hidden = false;
    this.trackOpen("evidence");
    this.els.btnEvidenceClose.focus();
  },

  closeEvidence() {
    this.stopAudio();
    this.trackClose("evidence");
    this.els.evidencePanel.hidden = true;
    this.restoreFocus(this.els.btnEvidence);
  },

  renderEvidenceList() {
    const list = this.els.evidenceList;
    list.textContent = "";
    const cards = GameState.cardList();

    if (!cards.length) {
      list.appendChild(this.make("p", "evidence-empty", CONTENT.evidence.empty));
      return;
    }

    for (const id of cards) {
      const card = CONTENT.cards[id];
      const article = this.make("article", "card");
      article.append(
        this.make("h3", null, card.title),
        this.make("p", null, card.text),
        this.make("p", "card-meta", "Quelle: " + card.quelle + " — " + card.rolle)
      );
      list.appendChild(article);
    }
  },

  /* ---------- Verlauf ---------- */

  openLog() {
    this.stopAudio();
    this.renderLog();
    this.rememberFocus();
    this.els.logPanel.hidden = false;
    this.trackOpen("log");
    this.els.btnLogClose.focus();
  },

  closeLog() {
    this.stopAudio();
    this.trackClose("log");
    this.els.logPanel.hidden = true;
    this.restoreFocus(this.els.btnLog);
  },

  renderLog() {
    const list = this.els.logList;
    list.textContent = "";
    const log = GameState.getDialogueLog();

    if (!log.length) {
      const li = this.make("li", "log-empty", UI_TEXTS.noLog);
      list.appendChild(li);
      return;
    }

    for (const line of log) {
      const li = this.make("li", null);
      li.append(
        this.make("span", "log-speaker", line.speaker + " — "),
        document.createTextNode(line.text)
      );
      /* Nur vertonte Zeilen erhalten eine Wiederholfunktion; das Öffnen
         des Verlaufs selbst spielt keine Historie ab. */
      if (GameAudio.hasLine(line.id)) {
        li.appendChild(this.makeReplayButton(line.id, "Anhören"));
      }
      list.appendChild(li);
    }
  },

  /* ---------- Widerspruchsverfahren ---------- */

  openProcedure() {
    this.stopAudio();
    this.renderProcedure();
    this.rememberFocus();
    this.els.procedurePanel.hidden = false;
    this.trackOpen("procedure");
    const firstBtn = this.els.procedureBody.querySelector("button");
    (firstBtn || this.els.btnProcedureClose).focus();
  },

  closeProcedure() {
    this.stopAudio();
    this.trackClose("procedure");
    this.els.procedurePanel.hidden = true;
    this.restoreFocus(this.els.btnProcedure);
    this.setStatus(CONTENT.status.contradictionCancelled);
  },

  renderProcedure() {
    /* Verfahrensübergang: laufende und wartende Sprache der vorherigen
       Ansicht verwirfen, bevor die neue Ansicht gilt. */
    this.stopAudio();
    const s = GameState.get();
    const body = this.els.procedureBody;
    body.textContent = "";

    if (!s.e2Found) {
      this._procedureView = { type: "locked" };
      this.els.procedureTitle.textContent = CONTENT.labels.widerspruchsverfahren;
      body.append(
        this.make("p", null, CONTENT.contradiction.noCard),
        this.make("p", null, UI_TEXTS.procedureLocked)
      );
      return;
    }

    if (s.ended) {
      this._procedureView = { type: "ended" };
      this.els.procedureTitle.textContent = CONTENT.labels.entscheidung;
      const badge = this.make("p", "badge is-done", "Abgeschlossen");
      body.append(
        badge,
        this.make("p", null,
          "Das gewählte Ende ist für diesen Spielstand endgültig. " +
          "Über „Zum Entscheidungspunkt“ ist der Stand vor der Entscheidung wieder erreichbar.")
      );
      return;
    }

    if (s.rounds.next) {
      this.renderRound(s.rounds.next, body);
    } else {
      this.renderDecision(body);
    }
  },

  renderRound(rid, body, playIntro = true) {
    body.textContent = "";
    const s = GameState.get();
    const w = CONTENT.contradictions[rid];
    this._procedureView = { type: "round", rid: rid };
    this.els.procedureTitle.textContent = w.titel;

    /* Bereits abgeschlossene Runden sichtbar machen. */
    if (s.rounds.resolved.length) {
      body.appendChild(this.make("p", "badge is-done",
        UI_TEXTS.resolvedPrefix + " " + s.rounds.resolved.join(", ")));
    }

    /* W3: vor der Behauptung das kurze tatsächliche Gespräch (vorher). */
    if (Array.isArray(w.vorher)) {
      body.appendChild(this.make("p", "claim-by", UI_TEXTS.vorherLabel));
      for (const line of w.vorher) {
        this.safeLog(line.speaker, line.text, line.id);
        const el = this.make("div", "dialogue-line");
        const portrait = this.makeSpeakerPortrait(line.speaker, line.id);
        if (portrait) {
          el.appendChild(portrait);
        }
        el.append(
          this.make("span", "dialogue-speaker" + this.speakerClass(line.speaker), line.speaker),
          this.make("p", "dialogue-text", line.text)
        );
        /* Vertonte Einleitungszeile: klare Wiederholfunktion; stille
           Zeilen und fehlende Katalog-IDs bleiben ohne Button. */
        if (GameAudio.hasLine(line.id)) {
          el.appendChild(this.makeReplayButton(line.id, "Zeile wiederholen"));
        }
        body.appendChild(el);
      }
      if (playIntro) {
        /* W3-Einleitung: bei aktivierten Stimmen in sichtbarer
           Reihenfolge abspielen; stille Zeilen bleiben still. */
        GameAudio.playSequence(w.vorher.map((l) => l.id));
      }
    }

    /* Offene Aussage mit Sprecher. */
    body.appendChild(this.make("p", "claim-by", UI_TEXTS.claimBy));
    body.appendChild(this.make("blockquote", "claim", w.claim));

    /* Kartenwahl: nur tatsächlich gefundene Karten. */
    body.appendChild(this.make("p", null, UI_TEXTS.cardPickLabel));
    const cards = GameState.cardList();
    for (const cardId of cards) {
      const card = CONTENT.cards[cardId];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-pick";
      const text = this.make("span", "card-pick-text");
      text.append(
        this.make("strong", null, card.title),
        this.make("p", null, card.rolle)
      );
      btn.appendChild(text);
      btn.addEventListener("click", () => this.presentCard(rid, cardId));
      body.appendChild(btn);
    }

    /* „Weiter untersuchen“ in jeder Runde zugänglich — kein Verlust. */
    const back = document.createElement("button");
    back.type = "button";
    back.className = "ghost";
    back.textContent = CONTENT.labels.weiterUntersuchen;
    back.addEventListener("click", () => this.closeProcedure());
    body.appendChild(back);
  },

  presentCard(rid, cardId) {
    const res = GameState.presentEvidence(rid, cardId);
    const body = this.els.procedureBody;

    if (res.ok) {
      this.renderSuccess(rid, body);
      this.updateProgress();
      if (res.checkpoint && res.checkpoint.ok) {
        if (res.checkpoint.storage === "memory") {
          this.setStatus(UI_TEXTS.checkpointAutoMemory);
        } else {
          this.setStatus(UI_TEXTS.checkpointAuto);
        }
      } else {
        this.setStatus(UI_TEXTS.roundDone);
      }
      return;
    }

    if (res.reason === "already-resolved") {
      /* Doppelklick o. ä.: Runde bleibt, wie sie ist. */
      this.renderProcedure();
      return;
    }

    /* Passende falsche Rückmeldung (aus content.js), Runde bleibt offen.
       Die sichtbare Einleitung wird dabei NICHT erneut abgespielt. */
    this.renderRound(rid, body, false);
    const box = this.make("div", "feedback-box",
      res.feedback || "Diese Karte trägt die Runde nicht.");
    body.appendChild(box);
    this.setStatus(res.feedback || "Diese Karte trägt die Runde nicht.");
  },

  renderSuccess(rid, body) {
    /* Übergang in die Erfolgsansicht: laufende/wartende Sprache der
       vorherigen Ansicht verwirfen, bevor die neue Ansicht gilt. */
    this.stopAudio();
    body.textContent = "";
    const w = CONTENT.contradictions[rid];
    this._procedureView = { type: "success", rid: rid };
    this.els.procedureTitle.textContent = w.titel;

    body.appendChild(this.make("p", "badge", "Runde abgeschlossen"));

    /* Vorher-Dialog (W3) gehört zum Verlauf, falls er noch fehlt. */
    if (Array.isArray(w.vorher)) {
      for (const line of w.vorher) {
        this.safeLog(line.speaker, line.text, line.id);
      }
    }

    /* Folgedialog mit Sprecher. */
    for (const line of w.erfolg) {
      this.safeLog(line.speaker, line.text, line.id);
      const el = this.make("div", "dialogue-line");
      const portrait = this.makeSpeakerPortrait(line.speaker, line.id);
      if (portrait) {
        el.appendChild(portrait);
      }
      el.append(
        this.make("span", "dialogue-speaker" + this.speakerClass(line.speaker), line.speaker),
        this.make("p", "dialogue-text", line.text)
      );
      /* Vertonte Erfolgszeile: klare Wiederholfunktion; stille Zeilen
         (z. B. Alex) und fehlende Katalog-IDs bleiben ohne Button. */
      if (GameAudio.hasLine(line.id)) {
        el.appendChild(this.makeReplayButton(line.id, "Zeile wiederholen"));
      }
      body.appendChild(el);
    }

    /* Erfolgreiche Beweisrunde: bei aktivierten Stimmen in sichtbarer
       Reihenfolge abspielen; danach bestimmt der Spieler das Tempo. */
    GameAudio.playSequence(w.erfolg.map((l) => l.id));

    body.appendChild(this.make("div", "success-box", w.folge));

    const actions = this.make("div", "panel-actions");
    const weiter = document.createElement("button");
    weiter.type = "button";
    weiter.className = "primary";
    weiter.textContent = "Weiter";
    weiter.addEventListener("click", () => {
      this.renderProcedure();
      const firstBtn = this.els.procedureBody.querySelector("button");
      (firstBtn || this.els.btnProcedureClose).focus();
    });
    const untersuchen = document.createElement("button");
    untersuchen.type = "button";
    untersuchen.className = "ghost";
    untersuchen.textContent = CONTENT.labels.weiterUntersuchen;
    untersuchen.addEventListener("click", () => this.closeProcedure());
    actions.append(weiter, untersuchen);
    body.appendChild(actions);
  },

  /* ---------- Entscheidung und Enden ---------- */

  renderDecision(body) {
    this._procedureView = { type: "decision" };
    this.els.procedureTitle.textContent = CONTENT.labels.entscheidung;
    body.appendChild(this.make("p", "decision-prompt", CONTENT.decision.prompt));
    const cp = GameState.hasSave("checkpoint");
    if (cp.exists && cp.storage === "local") {
      body.appendChild(this.make("p", null,
        "Der Entscheidungspunkt wurde automatisch gesichert — die andere Option bleibt erreichbar."));
    } else {
      body.appendChild(this.make("p", null, UI_TEXTS.decisionCheckpointMemory));
    }

    const options = this.make("div", "decision-options");
    for (const opt of CONTENT.decision.optionen) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.ending = opt.id;
      btn.textContent = opt.label;
      btn.addEventListener("click", () => this.chooseEnding(opt.id));
      options.appendChild(btn);
    }
    body.appendChild(options);
  },

  chooseEnding(endingId) {
    if (!window.confirm(UI_TEXTS.endingConfirm)) {
      return; /* Abbrechen erhält den Fortschritt */
    }
    const res = GameState.chooseEnding(endingId);
    if (!res.ok) {
      if (res.reason === "already-ended") {
        this.setStatus("Das gewählte Ende ist endgültig. " + (res.hint || ""));
      } else {
        this.setStatus("Noch nicht möglich.");
      }
      return;
    }
    this.updateProgress();
    this.playEnding(endingId);
  },

  /* Vollständigen Enddialog abspielen.
     Ende A: zwischen Abschlussmeldung (endeA-03) und
     Zufriedenheitsfrage (endeA-04) ein bewusster Weiter-Schritt
     (endings.A.weiterPause). */
  playEnding(endingId) {
    const e = CONTENT.endings[endingId];
    const steps = this.buildSteps(e.lines);
    if (e.weiterPause) {
      const i = steps.findIndex((st) => st.id === e.weiterPause.nach);
      if (i >= 0) {
        steps.splice(i + 1, 0, { kind: "pause" });
      }
    }
    /* Erledigte Entscheidungsansicht beim Start des Enddialogs ausblenden:
       die Endwahl ist erst nach geladenem Entscheidungspunkt wieder offen. */
    this.trackClose("procedure");
    this.els.procedurePanel.hidden = true;
    this.openDialogue({
      title: e.titel,
      steps: steps,
      onDone: () => this.showEndingPanel(endingId)
    });
  },

  showEndingPanel(endingId) {
    const e = CONTENT.endings[endingId];
    this.els.endingTitle.textContent = e.titel;

    const body = this.els.endingBody;
    body.textContent = "";
    body.appendChild(this.make("p", "ending-note", UI_TEXTS.endingNote));

    const actions = this.make("div", "ending-actions");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary";
    btn.textContent = "Zum Entscheidungspunkt";
    btn.addEventListener("click", () => this.doCheckpoint());
    actions.appendChild(btn);
    body.appendChild(actions);

    this.renderWorld();
    this.els.endingPanel.hidden = false;
    this.setStatus(UI_TEXTS.ended);
    btn.focus();
  },

  /* ---------- Speichern / Laden / Entscheidungspunkt / Neustart ---------- */

  doSave() {
    const r = GameState.save("save");
    if (r.ok) {
      this.setStatus(r.storage === "memory" ? UI_TEXTS.saveOkMemory : UI_TEXTS.saveOk);
    } else {
      this.setStatus(UI_TEXTS.saveFail);
    }
  },

  doLoad() {
    const r = GameState.load("save");
    if (r.ok) {
      this.renderAll();
      const s = GameState.get();
      if (s.ended && s.ending) {
        /* Abgeschlossener Stand: passendes Endpanel wieder zeigen, ohne neu
           zu entscheiden oder den Stand zurückzusetzen. */
        this.showEndingPanel(s.ending);
      }
      this.setStatus(UI_TEXTS.loadOk);
    } else if (r.reason === "no-save") {
      this.setStatus(UI_TEXTS.loadNone);
    } else {
      /* invalid / parse-failed: aktueller Stand bleibt unangetastet */
      this.setStatus(UI_TEXTS.loadInvalid);
    }
  },

  doCheckpoint() {
    const r = GameState.loadCheckpoint();
    if (r.ok) {
      this.renderAll();
      this.setStatus(UI_TEXTS.checkpointOk);
      /* Entscheidung ist wieder offen: beide Optionen zeigen. */
      this.openProcedure();
    } else {
      this.setStatus(UI_TEXTS.checkpointNone);
    }
  },

  /* Neustart erst nach echter Bestätigung; Abbrechen erhält Fortschritt.
     Reset betrifft nur den Spielzustand (eigene Slots), nie Browserdaten. */
  doRestart() {
    if (!window.confirm(CONTENT.restart.confirm)) {
      return;
    }
    GameState.reset();
    this.renderAll();
    this.setStatus(CONTENT.status.restarted);
  }
};
