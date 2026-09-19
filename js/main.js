"use strict";

/* Startpunkt: Skripte liegen am Ende des <body>, DOM ist bereit.
 *
 * Bewusst NICHT GameState.reset() beim Seitenstart: reset() ist
 * ausschließlich der bestätigte Nutzer-Neustart und würde die
 * gespeicherten Slots löschen. Die Initialisierung über GameState.get()
 * ist lazy und nicht destruktiv — vorhandene gespeicherte Slots bleiben
 * erhalten und sind per hasSave()/load() erreichbar. */
UI.init();
