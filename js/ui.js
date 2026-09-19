"use strict";

/* Darstellung und Ereignisverdrahtung.
   Liest nur CONTENT und GameState; eigene Spielregeln fehlen hier. */
const UI = {
  els: {},
  dialogIndex: 0,
  lastAdvanceAt: 0,
  ADVANCE_LOCK_MS: 250, /* Mehrfachklick-Schutz: keine Zeilen springen verloren */

  init() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      statusLine: $("status-line"),
      progressLine: $("progress-line"),
      btnMira: $("btn-mira"),
      btnTerminal: $("btn-terminal"),
      dialoguePanel: $("dialogue-panel"),
      dialogueSpeaker: $("dialogue-speaker"),
      dialogueText: $("dialogue-text"),
      btnDialogueNext: $("btn-dialogue-next"),
      btnDialogueClose: $("btn-dialogue-close"),
      evidencePanel: $("evidence-panel"),
      evidenceList: $("evidence-list"),
      btnEvidence: $("btn-evidence"),
      btnEvidenceClose: $("btn-evidence-close"),
      contradictionPanel: $("contradiction-panel"),
      contradictionClaim: $("contradiction-claim"),
      contradictionBody: $("contradiction-body"),
      btnContradiction: $("btn-contradiction"),
      btnContradictionClose: $("btn-contradiction-close"),
      btnRestart: $("btn-restart")
    };

    this.els.contradictionClaim.textContent = CONTENT.contradiction.claim;

    this.els.btnMira.addEventListener("click", () => this.openDialogue());
    this.els.btnTerminal.addEventListener("click", () => this.useTerminal());
    this.els.btnDialogueNext.addEventListener("click", () => this.advanceDialogue());
    this.els.btnDialogueClose.addEventListener("click", () => this.closeDialogue());
    this.els.btnEvidence.addEventListener("click", () => this.openEvidence());
    this.els.btnEvidenceClose.addEventListener("click", () => this.closeEvidence());
    this.els.btnContradiction.addEventListener("click", () => this.openContradiction());
    this.els.btnContradictionClose.addEventListener("click", () => this.closeContradiction());
    this.els.btnRestart.addEventListener("click", () => this.confirmRestart());

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }
      if (!this.els.contradictionPanel.hidden) {
        this.closeContradiction();
      } else if (!this.els.evidencePanel.hidden) {
        this.closeEvidence();
      } else if (!this.els.dialoguePanel.hidden) {
        this.closeDialogue();
      }
    });

    this.renderAll();
  },

  /* ---------- Status und Fortschritt ---------- */

  setStatus(text) {
    this.els.statusLine.textContent = text;
  },

  updateProgress() {
    const s = GameState.get();
    this.els.btnContradiction.textContent = s.contradictionResolved
      ? CONTENT.toolbar.contradictionDone
      : s.e2Found
        ? CONTENT.toolbar.contradictionOpen
        : CONTENT.toolbar.contradictionLocked;
    this.els.progressLine.textContent = s.contradictionResolved
      ? CONTENT.progress.done
      : CONTENT.progress.none;
  },

  renderAll() {
    this.closeDialogue();
    this.closeEvidence();
    this.closeContradiction();
    this.renderEvidenceList();
    this.renderContradictionBody();
    this.updateProgress();
    this.setStatus(CONTENT.status.start);
  },

  /* ---------- Gespräch mit MIRA ---------- */

  openDialogue() {
    this.dialogIndex = 0;
    this.els.dialoguePanel.hidden = false;
    this.renderDialogueLine();
    this.els.btnDialogueNext.focus();
  },

  renderDialogueLine() {
    const lines = CONTENT.miraDialog;
    const line = lines[this.dialogIndex];
    this.els.dialogueSpeaker.textContent = line.speaker;
    this.els.dialogueText.textContent = line.text;
    const isLast = this.dialogIndex >= lines.length - 1;
    this.els.btnDialogueNext.textContent = isLast ? "Gespräch beenden" : "Weiter";
  },

  advanceDialogue() {
    const now = Date.now();
    if (now - this.lastAdvanceAt < this.ADVANCE_LOCK_MS) {
      return; /* schneller Mehrfachklick: bewusst ignorieren */
    }
    this.lastAdvanceAt = now;

    const lines = CONTENT.miraDialog;
    if (this.dialogIndex < lines.length - 1) {
      this.dialogIndex += 1;
      this.renderDialogueLine();
    } else {
      this.closeDialogue();
      this.setStatus(CONTENT.status.dialogClosed);
    }
  },

  closeDialogue() {
    this.els.dialoguePanel.hidden = true;
  },

  /* ---------- Auskunftsterminal ---------- */

  useTerminal() {
    const first = GameState.grantE2();
    this.renderEvidenceList();
    this.updateProgress();
    if (first) {
      this.setStatus(CONTENT.terminal.found);
      this.openEvidence();
    } else {
      this.setStatus(CONTENT.terminal.again);
    }
  },

  /* ---------- Beweisordner ---------- */

  openEvidence() {
    this.renderEvidenceList();
    this.els.evidencePanel.hidden = false;
    this.els.btnEvidenceClose.focus();
  },

  closeEvidence() {
    this.els.evidencePanel.hidden = true;
  },

  renderEvidenceList() {
    const s = GameState.get();
    const list = this.els.evidenceList;
    list.textContent = "";

    if (!s.e2Found) {
      const p = document.createElement("p");
      p.textContent = CONTENT.evidence.empty;
      list.appendChild(p);
      return;
    }

    const card = CONTENT.cards.E2;
    const article = document.createElement("article");
    article.className = "card";
    const h = document.createElement("h3");
    h.textContent = card.title;
    const p = document.createElement("p");
    p.textContent = card.text;
    article.append(h, p);
    list.appendChild(article);
  },

  /* ---------- Widerspruchsverfahren ---------- */

  openContradiction() {
    this.renderContradictionBody();
    this.els.contradictionPanel.hidden = false;
    const firstBtn = this.els.contradictionBody.querySelector("button")
      || this.els.btnContradictionClose;
    firstBtn.focus();
  },

  closeContradiction() {
    this.els.contradictionPanel.hidden = true;
    this.setStatus(GameState.get().contradictionResolved
      ? CONTENT.status.contradictionClosed
      : CONTENT.status.contradictionCancelled);
  },

  renderContradictionBody() {
    const s = GameState.get();
    const body = this.els.contradictionBody;
    body.textContent = "";

    if (s.contradictionResolved) {
      const badge = document.createElement("p");
      badge.className = "badge";
      badge.textContent = CONTENT.contradiction.resolvedBadge;
      const p = document.createElement("p");
      p.textContent = CONTENT.contradiction.success;
      body.append(badge, p);
      return;
    }

    if (!s.e2Found) {
      const p = document.createElement("p");
      p.textContent = CONTENT.contradiction.noCard;
      body.appendChild(p);
      return;
    }

    const card = CONTENT.cards.E2;
    const label = document.createElement("p");
    label.textContent = CONTENT.contradiction.availableLabel;

    const article = document.createElement("article");
    article.className = "card";
    const h = document.createElement("h3");
    h.textContent = card.title;
    const desc = document.createElement("p");
    desc.textContent = card.text;
    article.append(h, desc);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "primary";
    btn.textContent = CONTENT.contradiction.presentLabel;
    btn.addEventListener("click", () => this.presentEvidence("E2"));

    body.append(label, article, btn);
  },

  presentEvidence(cardId) {
    const ok = GameState.resolveContradiction(cardId);
    if (ok) {
      this.updateProgress();
      this.renderContradictionBody();
      this.setStatus(CONTENT.contradiction.success);
    } else {
      this.setStatus(CONTENT.contradiction.noCard);
    }
  },

  /* ---------- Neustart ---------- */

  confirmRestart() {
    const ok = window.confirm(CONTENT.restart.confirm);
    if (!ok) {
      return;
    }
    GameState.reset();
    this.dialogIndex = 0;
    this.renderAll();
    this.setStatus(CONTENT.status.restarted);
  }
};
