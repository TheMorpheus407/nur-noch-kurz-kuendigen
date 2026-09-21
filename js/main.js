"use strict";
// Lokales Qwen-Gerüst; Bootstrap durch Cedric auf die integrierte Fassung gekürzt.
// Klassische Skripte ohne Netzwerkzugriff; file:// wird unterstützt.
(function () {
  function boot() { UI.init(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
