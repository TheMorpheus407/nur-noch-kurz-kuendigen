"use strict";
/* =========================================================================
 * js/ui.js — „Nur noch kurz kündigen“
 *
 * Lokales Qwen-Gerüst; Vertrags- und Bedienkorrekturen durch Cedric,
 * dokumentiert in qa/redesign-032/ui-fixes/.
 * Ein konsistenter Renderweg aus GameState.view().
 * Die UI mutiert nie State direkt und erfindet keine Fortschrittsregeln:
 * sie liest view(), rendert die angebotenen actions und sendet deren
 * action-Objekte unverändert an GameState.dispatch(action).
 *
 * - Sichere textContent-Erzeugung (kein innerHTML mit Spielerdaten).
 * - Audio: nur bei tatsächlichem Wechsel von line.id starten; Rerender
 *   und Notizen starten keine zweite Wiedergabe.
 * - Hotspots: normierte Koordinaten über denselben object-fit:cover-
 *   Ausgleich projizieren (projectPoint), damit Marker und Bild denselben
 *   Beschnitt teilen.
 * ========================================================================= */

const UI = (() => {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Element-Referenzen ---------- */
  const el = {};
  function cacheElements() {
    el.startScreen = $("#start-screen");
    el.game = $("#game");
    el.stage = $("#stage");
    el.stageImg = $("#stage-img");
    el.hotspots = $("#hotspots");
    el.sceneActions = $("#scene-actions-mobile");
    el.portrait = $("#portrait");
    el.portraitImg = $("#portrait-img");
    el.hud = $("#hud");
    el.hudPlace = $("#hud-place");
    el.dialog = $("#dialog");
    el.dialogSpeaker = $("#dialog-speaker");
    el.dialogText = $("#dialog-text");
    el.dialogActions = $("#dialog-actions");
    el.btnReplay = $("#btn-replay");
    el.toast = $("#toast");
    el.btnNotes = $("#btn-notes");
    el.btnVoice = $("#btn-voice");
    el.btnFullscreen = $("#btn-fullscreen");
    el.btnMenu = $("#btn-menu");
    el.startNote = $("#start-note");
    el.btnStartNew = $("#btn-start-new");
    el.btnStartContinue = $("#btn-start-continue");
    el.btnStartVoice = $("#btn-start-voice");
    el.btnMenuVoice = $("#btn-menu-voice");
    // Overlays
    el.dlg = {
      document: $("#dlg-document"), form: $("#dlg-form"), challenge: $("#dlg-challenge"),
      diagnostic: $("#dlg-diagnostic"), choice: $("#dlg-choice"), transfer: $("#dlg-transfer"),
      message: $("#dlg-message"), done: $("#dlg-done"), notes: $("#dlg-notes"),
      menu: $("#dlg-menu"), confirm: $("#dlg-confirm"), credits: $("#dlg-credits")
    };
    for (const [id, d] of Object.entries(el.dlg)) {
      if (["menu", "notes", "credits", "confirm"].includes(id)) continue;
      const nav = make("nav", "overlay-tools");
      nav.setAttribute("aria-label", "Spielmenü");
      nav.appendChild(button("Notizen", "btn btn-ghost", () => renderNotes(view())));
      nav.appendChild(button("Menü", "btn btn-ghost", openMenu));
      d.firstElementChild.appendChild(nav);
    }
  }

  /* ---------- Zustand der UI (kein Story-State) ---------- */
  let lastLineId = null;          // für Audio-Wechsel
  let lastRenderedPhase = null;
  let lastRenderedScene = null;
  let lastRenderedMode = null;
  let toastTimer = null;
  let confirmResolver = null;     // Promise-Resolver für Bestätigungen
  let lastFocusedBeforeOverlay = null;
  let activeOverlay = null;       // id des zuletzt geöffneten Overlays
  let uiOverlay = null;           // Menü/Notizen über unverändertem Spielzustand
  let currentPortrait = null;
  let portraitScene = null;
  let savedRevision = null;
  let voiceEnabled = false;

  /* ---------- GameState-Brücke ---------- */
  function state() { return (typeof GameState !== "undefined") ? GameState : null; }
  function view() {
    const s = state();
    if (!s || typeof s.view !== "function") return null;
    try { return s.view(); } catch (e) { return null; }
  }
  function dispatch(action) {
    const s = state();
    if (!s || typeof s.dispatch !== "function" || !action) return { ok: false, message: "Keine Aktion." };
    try { return s.dispatch(action); } catch (e) { return { ok: false, message: "Aktion konnte nicht ausgeführt werden." }; }
  }

  /* ---------- Sichere DOM-Hilfen ---------- */
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function text(node, value) { if (node) node.textContent = (value == null ? "" : String(value)); }
  function make(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function button(label, cls, onClick, attrs) {
    const b = make("button", cls || "btn", label);
    b.type = "button";
    if (attrs) for (const k in attrs) b.setAttribute(k, attrs[k]);
    if (onClick) b.addEventListener("click", (e) => { e.preventDefault(); onClick(b, e); });
    return b;
  }
  function payload(action) { return action && (action.action || action); }
  function focusKey(action) {
    const a = payload(action);
    return JSON.stringify(Object.fromEntries(Object.entries(a || {}).filter(([k]) => !k.startsWith("expected"))));
  }
  function actionButton(action, cls) {
    return button(action.label || "Weiter", cls || "btn", () => onAction(action), {"data-focus-key": focusKey(action)});
  }
  function findAction(v, type) { return (v.actions || []).find(a => payload(a).type === type); }
  function backAction(v) {
    return (v && v.actions || []).find(a => {
      const p = payload(a);
      return p.type === "closeDocument" || p.confirm === false ||
        (p.type === "interact" && ["backHome", "backReception", "backRoom"].includes(p.target));
    });
  }
  function hasSave(slot) {
    const s = state();
    try { return !!(s && s.hasSave && s.hasSave(slot).exists); } catch (_) { return false; }
  }

  /* ---------- Toast / kurze Rückmeldung ---------- */
  function toast(msg, ms) {
    if (!el.toast) return;
    text(el.toast, msg || "");
    // Native modale Dialoge liegen über dem gewöhnlichen Toast.
    const d = activeOverlay && el.dlg[activeOverlay];
    if (d && d.open) {
      let notice = $(".overlay-notice", d);
      if (!notice) { notice = make("p", "overlay-notice"); notice.setAttribute("role", "status"); d.firstElementChild.appendChild(notice); }
      text(notice, msg || "");
    }
    if (!msg) { el.toast.classList.remove("show"); return; }
    el.toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), ms || 3200);
  }

  /* ---------- Audio-Verwaltung ---------- */
  function audioNotice(msg) { if (msg) toast(msg, 3600); }
  function stopAudio() {
    if (typeof GameAudio !== "undefined" && GameAudio.stop) GameAudio.stop();
  }
  function maybePlayLine(line) {
    const id = line && line.id || null;
    if (id === lastLineId) return;
    stopAudio();
    lastLineId = id;
    if (!id) return;
    if (typeof GameAudio === "undefined") return;
    if (!line.voice) return;
    if (!GameAudio.isEnabled()) return;
    if (!GameAudio.hasLine(line.id)) return; // fehlender Clip: Text bleibt, keine Ersatzstimme
    GameAudio.playLine(line.id);
  }
  function replayLine() {
    const v = view();
    const line = v && v.line;
    if (!line || !line.id) return;
    if (typeof GameAudio === "undefined") return;
    if (!GameAudio.isEnabled()) { toast("Stimmen sind aus."); return; }
    if (!GameAudio.hasLine(line.id)) { toast("Für diese Zeile ist keine Sprachdatei vorhanden."); return; }
    lastLineId = line.id;
    GameAudio.playLine(line.id);
  }
  function setVoice(enabled) {
    voiceEnabled = !!enabled;
    if (el.btnVoice) el.btnVoice.setAttribute("aria-pressed", String(!!enabled));
    if (el.btnStartVoice) {
      el.btnStartVoice.setAttribute("aria-pressed", String(!!enabled));
      el.btnStartVoice.textContent = "Stimmen: " + (enabled ? "an" : "aus");
    }
    if (el.btnVoice) el.btnVoice.setAttribute("aria-label", "Stimmen " + (enabled ? "ausschalten" : "einschalten"));
    if (el.btnMenuVoice) { el.btnMenuVoice.textContent = "Stimmen: " + (enabled ? "an" : "aus"); el.btnMenuVoice.setAttribute("aria-pressed", String(!!enabled)); }
  }
  function toggleVoice() {
    if (typeof GameAudio === "undefined") { toast("Stimmen sind gerade nicht verfügbar."); return; }
    const on = GameAudio.toggle();
    setVoice(on);
    if (!on) stopAudio();
    else if (!el.game.hidden && view() && view().line) replayLine();
  }

  /* ---------- Bildkoordinatentransformation ----------
     Das Raumbild wird mit object-fit:cover zentriert beschnitten.
     Normierte Hotspot-Koordinaten (0..1 auf dem ganzen Bild) müssen auf
     die sichtbare Bühne projiziert werden. Wir berechnen den sichtbaren
     Ausschnitt und mappen (x,y) in Prozent der Bühne. */
  function projectPoint(nx, ny) {
    const stage = el.stage;
    const img = el.stageImg;
    if (!stage || !img) return { left: "50%", top: "50%" };
    const sw = stage.clientWidth || 1;
    const sh = stage.clientHeight || 1;
    const nw = img.naturalWidth || 2048;
    const nh = img.naturalHeight || 1152;
    const imgRatio = nw / nh;
    const stageRatio = sw / sh;
    let visW, visH, offX, offY;
    if (imgRatio > stageRatio) {
      // Bild breiter: Höhe füllt, Seiten werden beschnitten
      visH = nh;
      visW = nh * stageRatio;
      offX = (nw - visW) / 2;
      offY = 0;
    } else {
      // Bild höher: Breite füllt, oben/unten werden beschnitten
      visW = nw;
      visH = nw / stageRatio;
      offX = 0;
      offY = (nh - visH) / 2;
    }
    const px = nx * nw;
    const py = ny * nh;
    const vx = (px - offX) / visW;
    const vy = (py - offY) / visH;
    return { left: (vx * 100) + "%", top: (vy * 100) + "%", visible: vx > 0.06 && vx < 0.94 && vy > 0.08 && vy < 0.72 };
  }

  /* ---------- Hotspot-Auflösung ----------
     Normalisierte Art-Hotspots haben Vorrang vor CONTENT-Koordinaten.
     action.target ist die Hotspot-ID; position aus der Action als Fallback. */
  function resolveHotspot(action, sceneId) {
    const target = action && action.action && action.action.target;
    let pos = null;
    let label = (action && action.label) || "";
    if (target && typeof ART_ASSETS !== "undefined" && ART_ASSETS.rooms && ART_ASSETS.rooms[sceneId]) {
      const room = ART_ASSETS.rooms[sceneId];
      const hs = room.hotspots && room.hotspots[target];
      if (hs) { pos = { x: hs.x, y: hs.y }; }
    }
    if (!pos && action && action.position) {
      pos = { x: action.position.x, y: action.position.y };
    }
    return { pos, label, target };
  }

  /* ---------- Porträt-Auflösung ----------
     line.portrait = {speaker, expression?}. Alex (Ich-Figur) bekommt kein
     NPC-Porträt. MIRA / Alex Plus / Rolf zeigen die gewählte Emotion. */
  function resolvePortrait(line) {
    if (!line || !line.portrait) return null;
    const p = line.portrait;
    if (typeof ART_ASSETS === "undefined" || !ART_ASSETS.portraits) return null;
    const speaker = p.speaker;
    if (!speaker) return null;
    // Alex als Ich-Figur: kein zufälliges NPC-Porträt
    if (speaker === "Alex") return null;
    const base = ART_ASSETS.portraits[speaker];
    if (!base) return null;
    let url = base.url;
    let alt = speaker;
    if (p.expression && ART_ASSETS.expressions && ART_ASSETS.expressions[speaker]) {
      const ex = ART_ASSETS.expressions[speaker][p.expression];
      if (ex && ex.url) url = ex.url;
    }
    return { url, alt };
  }

  /* ---------- HUD ---------- */
  function updateHud(v) {
    const place = {zuhause: "Zuhause", empfang: "Kundenempfang", vorfuehr: "Vorführraum"}[v.sceneId] || "";
    text(el.hudPlace, place);
    // Vollbild nur auf Desktop mit Unterstützung
    if (el.btnFullscreen) {
      const canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
      el.btnFullscreen.hidden = !canFs;
    }
  }

  /* ---------- Hotspots rendern ---------- */
  function renderHotspots(v) {
    clear(el.hotspots);
    clear(el.sceneActions);
    el.sceneActions.hidden = true;
    if (!v || v.mode !== "explore" || !v.actions || !v.actions.length) return;
    const sceneId = v.sceneId;
    for (const action of v.actions) {
      const r = resolveHotspot(action, sceneId);
      if (!r.pos) continue; // keine Position → kein Hotspot (wird ggf. als Button unten)
      const p = projectPoint(r.pos.x, r.pos.y);
      if (window.innerWidth <= 768 || !p.visible) {
        el.sceneActions.appendChild(actionButton(action));
        el.sceneActions.hidden = false;
        continue;
      }
      const b = make("button", "hotspot");
      b.type = "button";
      b.dataset.focusKey = focusKey(action);
      b.style.left = p.left;
      b.style.top = p.top;
      b.setAttribute("aria-label", r.label || "Interagieren");
      b.title = r.label || "";
      const dot = make("span", "dot");
      const label = make("span", "label", r.label || "");
      b.appendChild(dot);
      b.appendChild(label);
      b.addEventListener("click", (e) => {
        e.preventDefault();
        onAction(action);
      });
      el.hotspots.appendChild(b);
    }
  }

  /* ---------- Porträt rendern ---------- */
  function renderPortrait(v) {
    const line = v && v.line;
    if (v.sceneId !== portraitScene || !["dialogue", "choice", "confirm"].includes(v.mode)) currentPortrait = null;
    portraitScene = v.sceneId;
    const resolved = line ? resolvePortrait(line) : null;
    if (resolved) currentPortrait = resolved;
    const pr = currentPortrait;
    if (pr) {
      el.portraitImg.src = pr.url;
      el.portraitImg.alt = pr.alt;
      el.portrait.hidden = false;
    } else {
      el.portrait.hidden = true;
      el.portraitImg.removeAttribute("src");
    }
  }

  /* ---------- Dialogleiste ---------- */
  function renderDialog(v) {
    const line = v && v.line;
    if (line) {
      text(el.dialogSpeaker, line.speaker || "");
      text(el.dialogText, line.text || "");
      el.dialog.hidden = false;
      // Replay nur wenn voice + Clip vorhanden
      const canReplay = line.voice && typeof GameAudio !== "undefined" && GameAudio.hasLine(line.id);
      el.btnReplay.hidden = !canReplay;
    } else {
      text(el.dialogSpeaker, "");
      text(el.dialogText, v.mode === "explore" && v.objective ? v.objective.text : "");
      el.btnReplay.hidden = true;
    }
    el.dialog.hidden = !["dialogue", "explore"].includes(v.mode);
    renderDialogActions(v);
  }

  function renderDialogActions(v) {
    clear(el.dialogActions);
    if (!v || !["dialogue", "explore"].includes(v.mode) || !v.actions || !v.actions.length) return;
    // In explore: Hotspots sind primär; hier nur Aktionen OHNE Position als Buttons
    const buttons = v.actions.filter((a) => {
      const r = resolveHotspot(a, v.sceneId);
      return !r.pos; // hat Position → ist Hotspot
    });
    if (!buttons.length) return;
    for (const action of buttons) {
      const b = actionButton(action);
      el.dialogActions.appendChild(b);
    }
  }

  /* ---------- Aktionen ausführen ---------- */
  function onAction(action) {
    if (!action) return;
    uiOverlay = null;
    const res = dispatch(payload(action));
    handleDispatchResult(res);
  }
  function handleDispatchResult(res) {
    if (!res) return;
    if (res.ok === false) {
      // genaue GameState-Rückmeldung anzeigen, kein Fortschritt erfinden
      const msg = res.message || "Diese Aktion ist gerade nicht möglich.";
      // Neu rendern, damit der Zustand konsistent bleibt
      render();
      toast(msg, 4200);
      return;
    }
    render();
    if (res.warning) toast(res.warning, 3600);
  }

  /* ---------- Overlays: Fokus-Verwaltung ---------- */
  function openOverlay(id) {
    const d = el.dlg[id];
    if (!d) return;
    const wasOpen = d.open;
    stopAudio();
    if (activeOverlay && activeOverlay !== id && el.dlg[activeOverlay] && el.dlg[activeOverlay].open) {
      // anderes Overlay schließen, wenn es offen ist
      try { el.dlg[activeOverlay].close(); } catch (e) {}
    }
    if (!d.open) {
      if (!activeOverlay) lastFocusedBeforeOverlay = document.activeElement;
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    }
    activeOverlay = id;
    if (!wasOpen) focusOverlay(d);
  }
  function focusOverlay(d) {
    const items = $$("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)", d).filter(n => !n.hidden && n.getClientRects().length);
    const item = items.find(n => !n.hasAttribute("data-close")) || items[0];
    if (item) item.focus({preventScroll: true});
  }
  function closeOverlay(id) {
    const d = el.dlg[id];
    if (!d) return;
    if (d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    if (activeOverlay === id) activeOverlay = null;
    if (lastFocusedBeforeOverlay && lastFocusedBeforeOverlay.isConnected && lastFocusedBeforeOverlay.focus) {
      try { lastFocusedBeforeOverlay.focus(); } catch (e) {}
    }
    lastFocusedBeforeOverlay = null;
  }
  function closeAllOverlays() {
    for (const id in el.dlg) {
      const d = el.dlg[id];
      if (d && d.open) { try { d.close(); } catch (e) {} }
    }
    activeOverlay = null;
  }
  function updateCloseButtons(v) {
    for (const [id, d] of Object.entries(el.dlg)) {
      if (["notes", "menu", "credits", "confirm"].includes(id)) continue;
      const back = id === v.mode ? backAction(v) : null;
      for (const b of $$("[data-close]", d)) {
        b.hidden = !back;
        if (back) {
          b.setAttribute("aria-label", back.label);
          if (!b.classList.contains("overlay-close")) b.textContent = back.label;
        }
      }
    }
  }
  function requestClose(id) {
    if (id === "confirm" && confirmResolver) { confirmResolver(false); return; }
    if (["notes", "menu", "credits"].includes(id)) {
      closeOverlay(id);
      if (id === "credits") { openMenu(); return; }
      uiOverlay = null;
      render();
      return;
    }
    const back = backAction(view());
    if (back) onAction(back);
  }

  /* ---------- Dokument ---------- */
  function renderDocument(v) {
    const doc = v && v.document;
    if (!doc) { closeOverlay("document"); return; }
    text($("#doc-title"), doc.title || "Dokument");
    text($("#doc-source"), doc.source || "");
    const body = $("#doc-body");
    clear(body);
    if (doc.passages && doc.passages.length) {
      for (const p of doc.passages) {
        const box = make("div", "doc-passage");
        const t = make("p", "", p.text || "");
        t.style.margin = "0";
        box.appendChild(t);
        body.appendChild(box);
      }
    } else {
      body.appendChild(make("p", "notes-empty", "Kein Inhalt."));
    }
    openOverlay("document");
  }

  /* ---------- Formular ---------- */
  function renderForm(v) {
    const form = v && v.form;
    if (!form) { closeOverlay("form"); return; }
    text($("#form-title"), form.title || "Formular");
    text($("#form-desc"), form.description || "");
    const body = $("#form-body");
    clear(body);
    if (form.options && form.options.length) {
      for (const opt of form.options) {
        const row = make("label", "form-option" + (opt.selected ? " selected" : ""));
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "form-reason";
        input.value = opt.id;
        input.checked = !!opt.selected;
        input.dataset.focusKey = focusKey(opt.action);
        input.addEventListener("change", () => {
          // Grundwahl: dieselbe action senden, die State erwartet
          if (opt.action) onAction(opt.action);
        });
        const lab = make("span", "", opt.label || "");
        row.appendChild(input);
        row.appendChild(lab);
        body.appendChild(row);
      }
    }
    const submit = $("#btn-form-submit");
    const submitAction = findAction(v, "submitCancellation");
    submit.disabled = !submitAction;
    submit.textContent = submitAction ? submitAction.label : "Kündigung absenden";
    submit.onclick = () => {
      // Absenden erst nach Grundwahl: die submit-Aktion aus view().actions
      const v2 = view();
      const act = (v2 && v2.actions || []).find((a) => a.action && a.action.type === "submitCancellation");
      if (act) onAction(act);
      else toast("Bitte zuerst einen Grund wählen.");
    };
    openOverlay("form");
  }

  /* ---------- Challenge ---------- */
  function renderChallenge(v) {
    const ch = v && v.challenge;
    if (!ch) { closeOverlay("challenge"); return; }
    text($("#ch-title"), ch.title || "Frage");
    // Behauptungen
    const st = $("#ch-statements");
    clear(st);
    if (ch.statements && ch.statements.length) {
      for (const s of ch.statements) {
        const sel = (ch.selectedStatement === s.id);
        const b = make("button", "ch-item" + (sel ? " selected" : ""), s.text || "");
        b.type = "button";
        b.dataset.focusKey = focusKey(s.action);
        b.setAttribute("aria-pressed", String(sel));
        b.addEventListener("click", () => {
          if (s.action) onAction(s.action);
        });
        st.appendChild(b);
      }
    }
    // Dokumente + Passagen
    const docs = $("#ch-docs");
    clear(docs);
    if (ch.documents && ch.documents.length) {
      for (const d of ch.documents) {
        const head = make("div", "ch-item", d.title || "");
        head.style.cursor = "default";
        head.style.background = "var(--creme-2)";
        docs.appendChild(head);
        if (d.passages && d.passages.length) {
          for (const p of d.passages) {
            const sel = (ch.selectedDocument === d.id && ch.selectedPassage === p.id);
            const b = make("button", "ch-item" + (sel ? " selected" : ""), p.text || "");
            b.type = "button";
            b.dataset.focusKey = focusKey(p.action);
            b.setAttribute("aria-pressed", String(sel));
            b.addEventListener("click", () => {
              if (p.action) onAction(p.action);
            });
            docs.appendChild(b);
          }
        }
      }
    }
    // Feedback
    text($("#ch-feedback"), ch.feedback || "");
    // Vorlegen-Button
    const present = $("#btn-ch-present");
    const canPresent = !!findAction(v, "presentEvidence");
    present.disabled = !canPresent;
    present.onclick = () => {
      const v2 = view();
      const act = (v2 && v2.actions || []).find((a) => a.action && a.action.type === "presentEvidence");
      if (act) onAction(act);
      else toast("Wähle eine Behauptung und eine Passage.");
    };
    openOverlay("challenge");
  }

  /* ---------- Diagnose ---------- */
  function renderDiagnostic(v) {
    const dg = v && v.diagnostic;
    if (!dg) { closeOverlay("diagnostic"); return; }
    text($("#diag-title"), dg.title || "Diagnose");
    text($("#diag-notice"), dg.notice || "");
    // Schalter
    const controls = $("#diag-controls");
    clear(controls);
    if (dg.controls && dg.controls.length) {
      for (const c of dg.controls) {
        const row = make("div", "diag-row");
        const left = make("div");
        left.appendChild(make("div", "diag-label", c.label || ""));
        if (c.description) left.appendChild(make("div", "diag-desc", c.description));
        const status = make("span", "diag-status " + (c.active ? "on" : "off"), c.active ? "an" : "aus");
        const sw = make("button", "switch");
        sw.type = "button";
        sw.setAttribute("role", "switch");
        sw.setAttribute("aria-checked", String(!!c.active));
        sw.setAttribute("aria-label", c.label || "Schalter");
        sw.disabled = !c.action;
        sw.dataset.focusKey = "diagnostic-control-" + c.id;
        sw.addEventListener("click", () => {
          // Schalteränderung: State erwartet setDiagnostic + ggf. confirmDiagnostic
          if (c.action) onAction(c.action);
        });
        row.appendChild(left);
        row.appendChild(status);
        row.appendChild(sw);
        controls.appendChild(row);
      }
    }
    // Tests
    const tests = $("#diag-tests");
    clear(tests);
    if (dg.tests && dg.tests.length) {
      for (const t of dg.tests) {
        const row = make("div", "diag-row");
        const left = make("div");
        left.appendChild(make("div", "diag-label", t.label || ""));
        if (t.input) left.appendChild(make("div", "diag-desc", t.input));
        const b = button("Testen", "btn", (btn) => {
          if (t.action) onAction(t.action);
        });
        b.disabled = !t.action;
        b.dataset.focusKey = "diagnostic-test-" + t.id;
        b.setAttribute("aria-label", (t.label || "Versuch") + " testen");
        row.appendChild(left);
        row.appendChild(b);
        tests.appendChild(row);
      }
    }
    // Beobachtungen / Ergebnisse
    const results = $("#diag-results");
    clear(results);
    const obs = (dg.observations || []).slice();
    if (dg.latestResults && !obs.some(o => JSON.stringify(o) === JSON.stringify(dg.latestResults))) obs.push(dg.latestResults);
    if (obs.length) {
      for (const o of obs) {
        const box = make("div", "diag-result");
        const control = (dg.controls || []).find(c => c.id === o.controlId);
        const test = (dg.tests || []).find(t => t.id === o.testId);
        const head = make("div", "diag-result-head", [test && test.label, control && (control.label + ": " + (o.controlState === "on" ? "an" : "aus"))].filter(Boolean).join(" · "));
        box.appendChild(head);
        box.appendChild(make("p", "", o.text || ""));
        results.appendChild(box);
      }
    } else {
      results.appendChild(make("p", "notes-empty", "Noch keine Beobachtung. Probiere einen Test aus, bevor du etwas änderst."));
    }
    // Fußzeile: angebotene Aktionen (z. B. Abschluss)
    const foot = $("#diag-foot");
    clear(foot);
    if (v && v.actions && v.actions.length) {
      for (const a of v.actions) {
        if (["setDiagnostic", "testDiagnostic"].includes(payload(a).type) || a === backAction(v)) continue;
        foot.appendChild(actionButton(a));
      }
    }
    openOverlay("diagnostic");
  }

  /* ---------- Choice ---------- */
  function renderChoice(v) {
    const ch = v && v.choice;
    if (!ch) { closeOverlay("choice"); return; }
    text($("#choice-title"), ch.title || "Entscheidung");
    text($("#choice-desc"), ch.description || "");
    const opts = $("#choice-options");
    clear(opts);
    if (ch.options && ch.options.length) {
      for (const o of ch.options) {
        const box = make("button", "choice-option");
        box.type = "button";
        box.dataset.focusKey = focusKey(o.action);
        box.appendChild(make("div", "choice-label", o.label || ""));
        if (o.description) box.appendChild(make("div", "choice-desc", o.description));
        box.addEventListener("click", () => {
          // Endwahlen mit Bestätigung: confirmEnding / deleteConfirm / takeTransfer
          if (o.action) onAction(o.action);
        });
        opts.appendChild(box);
      }
    }
    openOverlay("choice");
  }

  /* ---------- Transfer ---------- */
  function renderTransfer(v) {
    const tr = v && v.transfer;
    if (!tr) { closeOverlay("transfer"); return; }
    text($("#tr-text"), tr.text || "");
    const status = $("#tr-status");
    clear(status);
    const steps = [
      { key: "transferred", label: "Kopie übertragen", done: !!tr.transferred },
      { key: "bootVerified", label: "Lokaler Start geprüft", done: !!tr.bootVerified },
      { key: "providerDeleted", label: "Anbieterkopie gelöscht", done: !!tr.providerDeleted }
    ];
    for (const s of steps) {
      const row = make("div", "tr-step" + (s.done ? " done" : ""));
      row.appendChild(make("span", "tr-dot"));
      row.appendChild(make("span", "", s.label));
      status.appendChild(row);
    }
    // Aktionen
    const acts = $("#tr-actions");
    clear(acts);
    if (v && v.actions && v.actions.length) {
      for (const a of v.actions) {
        if (a !== backAction(v)) acts.appendChild(actionButton(a));
      }
    }
    openOverlay("transfer");
  }

  /* ---------- Nachricht ---------- */
  function renderMessage(v) {
    const msg = v && v.finalMessage;
    if (!msg) { closeOverlay("message"); return; }
    text($("#msg-title"), msg.title || "Nachricht");
    const body = $("#msg-body");
    clear(body);
    body.appendChild(make("div", "msg-text", msg.text || ""));
    const submit = $("#btn-msg-submit");
    submit.textContent = msg.submitLabel || "Absenden";
    submit.onclick = () => {
      const v2 = view();
      const act = (v2 && v2.actions || []).find((a) => a.action && a.action.type === "submitMara");
      if (act) onAction(act);
      else toast("Nachricht konnte nicht gesendet werden.");
    };
    openOverlay("message");
  }

  /* ---------- Ende ---------- */
  function renderDone(v) {
    const ed = v && v.endingData;
    if (!ed) { closeOverlay("done"); return; }
    text($("#done-title"), ed.title || "Ende");
    text($("#done-text"), ed.text || "");
    // Checkpoint-Button nur wenn hasSave("checkpoint")
    const btnCp = $("#btn-done-checkpoint");
    let hasCp = false;
    const s = state();
    if (s && typeof s.hasSave === "function") {
      try { hasCp = !!(s.hasSave("checkpoint") && s.hasSave("checkpoint").exists); } catch (e) {}
    }
    btnCp.hidden = !hasCp;
    openOverlay("done");
  }

  /* ---------- Notizen ---------- */
  function renderNotes(v) {
    uiOverlay = "notes";
    const body = $("#notes-body");
    clear(body);
    // Aktuelles Anliegen
    const obj = v && v.objective;
    if (obj && obj.text) {
      const sec = make("div", "notes-section");
      sec.appendChild(make("h3", "", "Aktuelles Anliegen"));
      sec.appendChild(make("p", "notes-item", obj.text));
      body.appendChild(sec);
    }
    // Bekannte Dokumente (tatsächlich erworbene)
    const docs = (v && v.documents) || [];
    if (docs.length) {
      const sec = make("div", "notes-section");
      sec.appendChild(make("h3", "", "Bekannte Dokumente"));
      const list = make("div", "notes-list");
      for (const d of docs) {
        const b = button(d.title || "Dokument öffnen", "notes-item btn", () => onAction(d.action));
        b.disabled = !d.action;
        b.dataset.focusKey = focusKey(d.action);
        list.appendChild(b);
      }
      sec.appendChild(list);
      body.appendChild(sec);
    } else {
      const sec = make("div", "notes-section");
      sec.appendChild(make("h3", "", "Bekannte Dokumente"));
      sec.appendChild(make("p", "notes-empty", "Noch keine Unterlagen gefunden."));
      body.appendChild(sec);
    }
    // Gesprochener Verlauf (letzte Zeilen)
    const hist = (v && v.history) || [];
    if (hist.length) {
      const sec = make("div", "notes-section");
      sec.appendChild(make("h3", "", "Verlauf"));
      const list = make("div", "notes-list");
      for (const h of hist) {
        const item = make("div", "notes-item");
        item.appendChild(make("strong", "", (h.speaker || "") + ": "));
        item.appendChild(document.createTextNode(h.text || ""));
        list.appendChild(item);
      }
      sec.appendChild(list);
      body.appendChild(sec);
    }
    // Hinweise (nur wenn vorhanden, nicht permanent als Lösungsanzeige)
    if (obj && obj.hints && obj.hints.length) {
      const sec = make("div", "notes-section");
      sec.appendChild(make("h3", "", "Hinweise"));
      const list = make("div", "notes-list");
      sec.appendChild(list);
      let revealed = 0;
      const reveal = button("Einen Hinweis zeigen", "btn", () => {
        list.appendChild(make("p", "notes-item", obj.hints[revealed++]));
        reveal.hidden = revealed >= obj.hints.length;
        reveal.textContent = "Noch einen Hinweis zeigen";
      });
      sec.appendChild(reveal);
      body.appendChild(sec);
    }
    openOverlay("notes");
  }

  /* ---------- Bestätigung (native dialog) ---------- */
  function confirmDialog(title, txt) {
    return new Promise((resolve) => {
      const previous = uiOverlay;
      uiOverlay = "confirm";
      text($("#confirm-title"), title || "Bestätigen");
      text($("#confirm-text"), txt || "");
      const yes = $("#btn-confirm-yes");
      const no = $("#btn-confirm-no");
      yes.textContent = "Bestätigen";
      no.textContent = "Abbrechen";
      yes.hidden = no.hidden = false;
      const done = (val) => {
        yes.onclick = no.onclick = null;
        confirmResolver = null;
        closeOverlay("confirm");
        uiOverlay = val ? null : previous;
        if (!val) {
          if (previous === "menu") openMenu();
          else if (!el.game.hidden) render();
        }
        resolve(val);
      };
      const onYes = () => done(true);
      const onNo = () => done(false);
      yes.onclick = onYes;
      no.onclick = onNo;
      confirmResolver = done;
      openOverlay("confirm");
    });
  }
  function renderConfirmation(v) {
    const c = v.confirmation;
    if (!c) return;
    text($("#confirm-title"), c.title || "Bestätigen");
    text($("#confirm-text"), c.text || "");
    const yes = (v.actions || []).find(a => payload(a).confirm === true);
    const no = (v.actions || []).find(a => payload(a).confirm === false);
    for (const [id, a] of [["yes", yes], ["no", no]]) {
      const b = $("#btn-confirm-" + id);
      b.hidden = !a;
      b.textContent = a ? a.label : "";
      b.onclick = a ? () => onAction(a) : null;
    }
    openOverlay("confirm");
  }

  /* ---------- Menü ---------- */
  function openMenu() {
    uiOverlay = "menu";
    const loadBtn = $("#btn-menu-load");
    loadBtn.disabled = !hasSave("save");
    openOverlay("menu");
  }

  /* ---------- Startansicht ---------- */
  function showStart() {
    el.game.hidden = true;
    el.startScreen.hidden = false;
    // Fortsetzen-Button nur wenn Speicher vorhanden
    const s = state();
    let hasSave = false;
    if (s && typeof s.hasSave === "function") {
      try { hasSave = !!(s.hasSave("save") && s.hasSave("save").exists); } catch (e) {}
    }
    el.btnStartContinue.hidden = !hasSave;
    setVoice(voiceEnabled);
  }
  function hideStart() {
    el.startScreen.hidden = true;
    el.game.hidden = false;
    render();
  }

  /* ---------- Haupt-Render ---------- */
  function render() {
    const focused = document.activeElement;
    const focusedId = focused && focused.id;
    const focusedKey = focused && focused.dataset && focused.dataset.focusKey;
    const v = view();
    if (!v) {
      // GameState nicht verfügbar: klare Meldung, kein Crash
      toast("Das Spiel konnte nicht gestartet werden. Bitte entpacke das Spiel vollständig und öffne index.html erneut.", 6000);
      return;
    }
    updateCloseButtons(v);
    // Szene / Hintergrund
    const sceneId = v.sceneId;
    if (sceneId !== lastRenderedScene) {
      lastRenderedScene = sceneId;
      let url = null;
      const alt = {zuhause: "Alex’ Wohnung", empfang: "Empfang im Kundenservice", vorfuehr: "Vorführraum im Kundenservice"}[sceneId] || "Raum";
      if (typeof ART_ASSETS !== "undefined" && ART_ASSETS.rooms && ART_ASSETS.rooms[sceneId]) {
        url = ART_ASSETS.rooms[sceneId].url;
      }
      if (url) {
        el.stageImg.src = url;
        el.stageImg.alt = alt || "Szene";
      } else {
        // Ruhige grafische Schreibtisch-Rückfallebene (nur im Code markiert)
        el.stageImg.removeAttribute("src");
        el.stageImg.alt = alt;
        el.stage.style.background = "linear-gradient(180deg, var(--creme) 0%, var(--creme-2) 100%)";
      }
    }
    updateHud(v);
    renderHotspots(v);
    renderPortrait(v);
    renderDialog(v);

    // Modus-spezifische Overlays öffnen (nur wenn view sie liefert)
    if (uiOverlay === "menu") openMenu();
    else if (uiOverlay === "notes") renderNotes(v);
    else if (uiOverlay === "credits" || uiOverlay === "confirm") openOverlay(uiOverlay);
    else if (v.mode === "document") renderDocument(v);
    else if (v.mode === "form") renderForm(v);
    else if (v.mode === "challenge") renderChallenge(v);
    else if (v.mode === "diagnostic") renderDiagnostic(v);
    else if (v.mode === "choice") renderChoice(v);
    else if (v.mode === "confirm") renderConfirmation(v);
    else if (v.mode === "transfer") renderTransfer(v);
    else if (v.mode === "message") renderMessage(v);
    else if (v.mode === "done") renderDone(v);
    else closeAllOverlays();

    // Audio: nur bei tatsächlichem Wechsel der Zeile
    if (!uiOverlay && v.mode === "dialogue" && v.line) {
      maybePlayLine(v.line);
    } else {
      // kein Dialog: Audio stoppen (Laden, Neustart, Menüwechsel)
      stopAudio();
      if (!v.line) lastLineId = null;
    }
    const replacement = focusedId && document.getElementById(focusedId) ||
      (focusedKey && $$("[data-focus-key]").find(n => n.dataset.focusKey === focusedKey));
    if (replacement && !replacement.disabled && replacement.getClientRects().length &&
        (!activeOverlay || el.dlg[activeOverlay].contains(replacement))) replacement.focus({preventScroll: true});
    else if (activeOverlay && !el.dlg[activeOverlay].contains(document.activeElement)) focusOverlay(el.dlg[activeOverlay]);

    lastRenderedPhase = v.phase;
    lastRenderedMode = v.mode;
  }

  /* ---------- Event-Verdrahtung ---------- */
  function resetGame() {
    const s = state();
    if (!s || !s.reset) return;
    stopAudio();
    lastLineId = null;
    currentPortrait = null;
    savedRevision = null;
    uiOverlay = null;
    s.reset();
    closeAllOverlays();
    hideStart();
  }
  async function loadGame(slot, fromStart) {
    const s = state();
    if (!s || !s.load) return;
    if (!fromStart && view().revision !== savedRevision &&
        !await confirmDialog("Spielstand laden", "Dein aktueller Fortschritt wird durch den gespeicherten Stand ersetzt. Möchtest du fortfahren?")) return;
    stopAudio();
    const res = s.load(slot);
    if (!res || !res.ok) { toast(res && (res.message || res.warning) || "Der Spielstand konnte nicht geladen werden."); return; }
    lastLineId = null;
    currentPortrait = null;
    savedRevision = slot === "save" ? view().revision : null;
    uiOverlay = null;
    closeAllOverlays();
    hideStart();
    toast(res.warning || (slot === "checkpoint" ? "Zur Entscheidung zurückgekehrt." : "Spielstand geladen."));
  }
  function wireEvents() {
    // Start
    el.btnStartNew.addEventListener("click", async () => {
      if ((hasSave("save") || hasSave("checkpoint")) &&
          !await confirmDialog("Neu beginnen", "Möchtest du neu beginnen? Dein gespeicherter Fortschritt und der Entscheidungspunkt werden gelöscht.")) return;
      resetGame();
    });
    el.btnStartContinue.addEventListener("click", () => loadGame("save", true));
    el.btnStartVoice.addEventListener("click", toggleVoice);

    // HUD
    el.btnNotes.addEventListener("click", () => renderNotes(view()));
    el.btnVoice.addEventListener("click", toggleVoice);
    el.btnMenu.addEventListener("click", openMenu);
    el.btnReplay.addEventListener("click", replayLine);
    el.btnFullscreen.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
      } catch (_) { toast("Vollbild konnte nicht eingeschaltet werden."); }
    });

    // Overlay-Schließen (data-close)
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.hasAttribute && t.hasAttribute("data-close")) {
        const id = t.getAttribute("data-close");
        requestClose(id);
      }
    });

    // Menü-Aktionen
    $("#btn-menu-save").addEventListener("click", async () => {
      const s = state();
      if (s && typeof s.save === "function") {
        if (hasSave("save") && !await confirmDialog("Spielstand ersetzen", "Der bisher gespeicherte Stand wird durch deinen aktuellen Fortschritt ersetzt. Möchtest du speichern?")) return;
        const res = s.save("save");
        openMenu();
        if (res && res.ok) { savedRevision = view().revision; toast(res.warning || (res.storage === "memory" ? "Nur für dieses geöffnete Fenster gespeichert. Beim Schließen geht der Spielstand verloren." : "Spielstand gespeichert.")); }
        else toast((res && (res.message || res.warning)) || "Speichern fehlgeschlagen.");
      } else toast("Speichern ist nicht verfügbar.");
    });
    $("#btn-menu-load").addEventListener("click", () => loadGame("save", false));
    $("#btn-menu-reset").addEventListener("click", async () => {
      const ok = await confirmDialog("Neu beginnen", "Dein aktueller und gespeicherter Fortschritt werden gelöscht. Möchtest du neu beginnen?");
      if (!ok) return;
      resetGame();
    });
    $("#btn-menu-voice").addEventListener("click", toggleVoice);
    $("#btn-menu-credits").addEventListener("click", () => { uiOverlay = "credits"; openOverlay("credits"); });

    // Ende
    $("#btn-done-restart").addEventListener("click", async () => {
      const ok = await confirmDialog("Neu beginnen", "Dein aktueller und gespeicherter Fortschritt werden gelöscht. Möchtest du neu beginnen?");
      if (!ok) return;
      resetGame();
    });
    $("#btn-done-checkpoint").addEventListener("click", () => loadGame("checkpoint", false));

    // Escape schließt Overlays, zerstört keinen Fortschritt
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activeOverlay) {
        requestClose(activeOverlay);
        e.preventDefault();
        e.stopPropagation();
      }
    });
    for (const [id, d] of Object.entries(el.dlg)) d.addEventListener("cancel", e => { e.preventDefault(); requestClose(id); });

    // Enter/Space: Weiter nur wenn kein Button/Formular/Dialog den Fokus beansprucht
    document.addEventListener("keydown", (e) => {
      if (e.repeat || el.game.hidden || activeOverlay || (e.key !== "Enter" && e.key !== " ")) return;
      const ae = document.activeElement;
      const inControl = ae && (
        ae.tagName === "BUTTON" || ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT" || ae.isContentEditable ||
        (ae.closest && ae.closest("dialog[open]"))
      );
      if (inControl) return;
      const v = view();
      if (!v || v.mode !== "dialogue") return;
      const next = (v.actions || []).find((a) => a.action && a.action.type === "next");
      if (next) {
        e.preventDefault();
        onAction(next);
      }
    });

    // Audio-Hinweise
    if (typeof GameAudio !== "undefined" && GameAudio.setNoticeHandler) {
      GameAudio.setNoticeHandler(audioNotice);
    }

    // Größenänderung: Hotspots neu projizieren
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const v = view();
        if (v) renderHotspots(v);
      }, 120);
    });
    el.stageImg.addEventListener("load", () => { const v = view(); if (v) renderHotspots(v); });
  }

  /* ---------- Init ---------- */
  function init() {
    cacheElements();
    if (typeof GameAudio !== "undefined" && GameAudio.init) GameAudio.init();
    setVoice(false);
    wireEvents();
    showStart();
  }

  return {
    init,
    render,
    toast,
    confirmDialog,
    openOverlay,
    closeOverlay,
    setVoice,
    toggleVoice,
    _el: el
  };
})();
