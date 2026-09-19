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
  roundDone: "Runde abgeschlossen.",
  endingConfirm: "Diese Entscheidung ist für diesen Spielstand endgültig. Der Entscheidungspunkt bleibt ladbar. Bestätigen?",
  endingNote: "Das Ende ist für diesen Spielstand abgeschlossen. Über „Zum Entscheidungspunkt“ können Sie zum gesicherten Stand zurückkehren und die andere Option wählen.",
  noLog: "Noch keine Gesprächszeilen im Verlauf.",
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
  _focusReturn: null,     /* Element, auf das der Fokus beim Schließen zurückgeht */
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
      btnRestart: $("btn-restart")
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

    /* Speichern / Laden / Entscheidungspunkt / Neustart */
    this.els.btnSave.addEventListener("click", () => this.doSave());
    this.els.btnLoad.addEventListener("click", () => this.doLoad());
    this.els.btnCheckpoint.addEventListener("click", () => this.doCheckpoint());
    this.els.btnRestart.addEventListener("click", () => this.doRestart());

    /* Escape: schließt das oberste geöffnete Panel, ohne Fortschritt zu verlieren. */
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (!this.els.dialoguePanel.hidden) {
        this.finishDialogue();
      } else if (!this.els.procedurePanel.hidden) {
        this.closeProcedure();
      } else if (!this.els.evidencePanel.hidden) {
        this.closeEvidence();
      } else if (!this.els.logPanel.hidden) {
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

  rememberFocus() {
    this._focusReturn = document.activeElement;
  },

  restoreFocus() {
    const target = this._focusReturn;
    this._focusReturn = null;
    if (target && document.contains(target)) {
      target.focus();
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
    this._dialogue = null;
    this.els.dialoguePanel.hidden = true;
    this.els.evidencePanel.hidden = true;
    this.els.logPanel.hidden = true;
    this.els.procedurePanel.hidden = true;
    this.els.endingPanel.hidden = true;
    this.els.hotspotInfo.hidden = true;
  },

  renderWorld() {
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

    /* Szene: vier gut sichtbare Hotspot-Schaltflächen */
    const scene = this.els.scene;
    scene.textContent = "";
    for (const id of room.hotspots) {
      const h = CONTENT.hotspots[id];
      const isNpc = NPC_IDS.includes(id);
      let label = h.label;
      if (id === "alexPlus" && s.alexPlus !== "active") {
        label += " — offline";
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot";
      btn.append(
        this.make("span", "hotspot-kind", isNpc ? "Gespräch" : "Fundstelle"),
        this.make("span", "hotspot-label", label)
      );
      if (s.ended) {
        btn.setAttribute("aria-disabled", "true");
      }
      btn.addEventListener("click", () => this.onHotspot(id));
      scene.appendChild(btn);
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
    this._dialogue = {
      steps: opts.steps,
      index: 0,
      onDone: opts.onDone || null
    };
    this.els.dialogueTitle.textContent = opts.title;
    this.rememberFocus();
    this.els.dialoguePanel.hidden = false;
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
      line.append(
        this.make("span", "dialogue-speaker" + this.speakerClass(step.speaker), step.speaker),
        this.make("p", "dialogue-text", step.text)
      );
      body.appendChild(line);
    } else {
      /* Bewusster Lesemoment (z. B. Ende A zwischen Löschung und
         Zufriedenheitsfrage): eigener Schritt, eigener Weiter-Klick. */
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
    const d = this._dialogue;
    this._dialogue = null;
    this.els.dialoguePanel.hidden = true;
    this.restoreFocus();
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
    this.renderEvidenceList();
    this.rememberFocus();
    this.els.evidencePanel.hidden = false;
    this.els.btnEvidenceClose.focus();
  },

  closeEvidence() {
    this.els.evidencePanel.hidden = true;
    this.restoreFocus();
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
    this.renderLog();
    this.rememberFocus();
    this.els.logPanel.hidden = false;
    this.els.btnLogClose.focus();
  },

  closeLog() {
    this.els.logPanel.hidden = true;
    this.restoreFocus();
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
      list.appendChild(li);
    }
  },

  /* ---------- Widerspruchsverfahren ---------- */

  openProcedure() {
    this.renderProcedure();
    this.rememberFocus();
    this.els.procedurePanel.hidden = false;
    const firstBtn = this.els.procedureBody.querySelector("button");
    (firstBtn || this.els.btnProcedureClose).focus();
  },

  closeProcedure() {
    this.els.procedurePanel.hidden = true;
    this.restoreFocus();
    this.setStatus(CONTENT.status.contradictionCancelled);
  },

  renderProcedure() {
    const s = GameState.get();
    const body = this.els.procedureBody;
    body.textContent = "";

    if (!s.e2Found) {
      this.els.procedureTitle.textContent = CONTENT.labels.widerspruchsverfahren;
      body.append(
        this.make("p", null, CONTENT.contradiction.noCard),
        this.make("p", null, UI_TEXTS.procedureLocked)
      );
      return;
    }

    if (s.ended) {
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

  renderRound(rid, body) {
    const s = GameState.get();
    const w = CONTENT.contradictions[rid];
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
        el.append(
          this.make("span", "dialogue-speaker" + this.speakerClass(line.speaker), line.speaker),
          this.make("p", "dialogue-text", line.text)
        );
        body.appendChild(el);
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
        this.setStatus(UI_TEXTS.checkpointAuto);
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

    /* Passende falsche Rückmeldung (aus content.js), Runde bleibt offen. */
    this.renderRound(rid, body);
    const box = this.make("div", "feedback-box",
      res.feedback || "Diese Karte trägt die Runde nicht.");
    body.appendChild(box);
    this.setStatus(res.feedback || "Diese Karte trägt die Runde nicht.");
  },

  renderSuccess(rid, body) {
    const w = CONTENT.contradictions[rid];
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
      el.append(
        this.make("span", "dialogue-speaker" + this.speakerClass(line.speaker), line.speaker),
        this.make("p", "dialogue-text", line.text)
      );
      body.appendChild(el);
    }

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
    this.els.procedureTitle.textContent = CONTENT.labels.entscheidung;
    body.appendChild(this.make("p", "decision-prompt", CONTENT.decision.prompt));
    body.appendChild(this.make("p", null,
      "Der Entscheidungspunkt wurde automatisch gesichert — die andere Option bleibt erreichbar."));

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
