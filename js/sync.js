// SPDX-License-Identifier: Apache-2.0
// Konto und Abgleich mit dem Server.
//
// Die App bleibt offline-fähig: Gelernt wird immer lokal, jede Antwort landet
// zusätzlich in einer Outbox. Sobald Netz und Konto da sind, wandert sie zum
// Server. Der Server rechnet die Kartenstände nach und schickt sie zurück.

import { apiBase, apiFetch, ApiError } from './api.js';
import { getState, save, saveNow } from './store.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const MAX_OUTBOX = 2000;

let serverConfig = null;      // { googleClientId, testLogin } oder null
let syncing = false;
let syncTimer = null;
const listeners = new Set();

export const onSyncChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => { try { fn(status()); } catch (err) { console.warn(err); } });

/* ------------------------------------------------------------- Zustand */

export function isConfigured() {
  return apiBase() !== null;
}

export function isLoggedIn() {
  return !!getState().account?.token;
}

export function status() {
  const account = getState().account || {};
  return {
    configured: isConfigured(),
    loggedIn: !!account.token,
    user: account.user || null,
    pending: (getState().outbox || []).length,
    lastSyncAt: account.lastSyncAt || 0,
    lastError: account.lastError || null,
    googleClientId: serverConfig?.googleClientId || null,
    testLogin: !!serverConfig?.testLogin
  };
}

function setAccount(patch) {
  const state = getState();
  state.account = { ...(state.account || {}), ...patch };
  save();
  emit();
}

/** Fragt beim Server nach, ob und wie angemeldet werden kann. */
export async function probeServer() {
  if (!isConfigured()) return null;
  try {
    serverConfig = await apiFetch('/api/config', { timeoutMs: 4000 });
  } catch {
    serverConfig = null;      // kein erreichbares Backend – App bleibt lokal
  }
  emit();
  return serverConfig;
}

/* ------------------------------------------------------------- Outbox */

/** Antwort für den Server vormerken. */
export function queueAnswer({ questionId, correct, ms }) {
  const state = getState();
  state.outbox = state.outbox || [];
  state.outbox.push({
    eventId: newEventId(),
    questionId,
    correct: !!correct,
    ms: Number.isFinite(ms) ? Math.round(ms) : null,
    answeredAt: Date.now()
  });
  // Nicht unbegrenzt wachsen lassen (z. B. monatelang offline gelernt).
  if (state.outbox.length > MAX_OUTBOX) state.outbox = state.outbox.slice(-MAX_OUTBOX);
  save();
  scheduleSync();
  emit();
}

function newEventId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function scheduleSync(delay = 4000) {
  if (!isLoggedIn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { syncNow().catch(() => {}); }, delay);
}

/* ---------------------------------------------------------- Anmeldung */

/** Google-Anmeldeschaltfläche einhängen (lädt Googles Skript nach). */
export async function mountGoogleButton(container, { onDone } = {}) {
  const clientId = serverConfig?.googleClientId;
  if (!clientId) return false;

  await loadScript(GIS_SRC);
  if (!globalThis.google?.accounts?.id) return false;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: async response => {
      try {
        await loginWithGoogle(response.credential);
        onDone?.(null);
      } catch (err) {
        onDone?.(err);
      }
    }
  });
  container.textContent = '';
  google.accounts.id.renderButton(container, {
    theme: 'outline', size: 'large', text: 'signin_with', locale: 'de', width: 260
  });
  return true;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('Google-Anmeldung konnte nicht geladen werden'));
    document.head.appendChild(el);
  });
}

export async function loginWithGoogle(credential) {
  const answer = await apiFetch('/api/auth/google', { method: 'POST', body: { credential } });
  return afterLogin(answer);
}

/** Nur für lokale Entwicklung und automatische Tests. */
export async function loginForTest(sub = 'test-user') {
  const answer = await apiFetch('/api/auth/test', { method: 'POST', body: { sub } });
  return afterLogin(answer);
}

/**
 * Nach der Anmeldung zusammenführen.
 *
 * Regel: Beim allerersten Anmelden wird der lokal erlernte Stand übernommen.
 * Liegt auf dem Konto schon Fortschritt, gewinnt der Server – der lokale Stand
 * dieses Geräts wird dann nicht übernommen, und die App sagt das auch.
 */
async function afterLogin(answer) {
  const state = getState();
  const localCards = state.cards || {};
  const serverHasProgress = Object.keys(answer.cards || {}).length > 0
    || (answer.state?.totals?.total || 0) > 0;

  let imported = 0;
  let localDiscarded = false;

  setAccount({
    token: answer.token, user: answer.user, expiresAt: answer.expiresAt,
    revision: answer.state?.revision ?? 0, lastError: null
  });

  if (!serverHasProgress && Object.keys(localCards).length) {
    try {
      const result = await apiFetch('/api/import', {
        method: 'POST', token: answer.token,
        body: { cards: localCards, totals: state.totals }
      });
      imported = result.imported;
      // Der Import enthält bereits alles, was in der Outbox stand.
      state.outbox = [];
      applyServerState({ state: result.state, cards: result.cards });
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 409) throw err;
      localDiscarded = true;
      applyServerState(answer);
    }
  } else {
    localDiscarded = serverHasProgress && Object.keys(localCards).length > 0;
    applyServerState(answer);
  }

  saveNow();
  emit();
  await syncNow().catch(() => {});
  return { imported, localDiscarded, user: answer.user };
}

export async function logout() {
  const token = getState().account?.token;
  try {
    if (token) await apiFetch('/api/auth/logout', { method: 'POST', token });
  } catch { /* auch ohne Netz lokal abmelden */ }
  const state = getState();
  state.account = {};
  saveNow();
  emit();
}

export async function deleteAccount() {
  const token = getState().account?.token;
  if (!token) return false;
  await apiFetch('/api/me', { method: 'DELETE', token });
  const state = getState();
  state.account = {};
  state.outbox = [];
  saveNow();
  emit();
  return true;
}

/* -------------------------------------------------------------- Abgleich */

/** Serverstand in die lokale Arbeitskopie übernehmen. */
function applyServerState({ state: remote, cards }) {
  const state = getState();
  if (cards) state.cards = { ...cards };
  if (remote) {
    if (remote.settings) state.settings = { ...state.settings, ...remote.settings };
    if (remote.round) state.round = remote.round;
    if (remote.totals) state.totals = { ...state.totals, ...remote.totals };
    if (Number.isFinite(remote.seq)) state.seq = remote.seq;
    state.account = { ...(state.account || {}), revision: remote.revision };
  }
  save();
}

/**
 * Alles Ausstehende zum Server schicken und den aktuellen Stand holen.
 * Läuft immer nur einmal gleichzeitig und wirft nicht – Fehler landen im Status.
 */
export async function syncNow({ pull = true } = {}) {
  if (!isLoggedIn() || syncing) return status();
  syncing = true;
  const state = getState();
  const token = state.account.token;

  try {
    // 1. Antworten hochladen (in Blöcken, damit große Rückstände durchgehen)
    while ((state.outbox || []).length) {
      const batch = state.outbox.slice(0, 200);
      const result = await apiFetch('/api/answers', { method: 'POST', token, body: { events: batch } });
      state.outbox = state.outbox.slice(batch.length);
      state.cards = { ...state.cards, ...result.cards };
      if (result.totals) state.totals = { ...state.totals, ...result.totals };
      if (Number.isFinite(result.seq)) state.seq = result.seq;
      setAccount({ revision: result.revision });
      save();
    }

    // 2. Einstellungen und Rundenstand sichern
    const push = await apiFetch('/api/state', {
      method: 'PUT', token,
      body: {
        settings: state.settings,
        round: state.round,
        timeMs: state.totals?.timeMs,
        revision: state.account.revision
      }
    }).catch(err => {
      if (err instanceof ApiError && err.status === 409) return err.body;   // Server gewinnt
      throw err;
    });
    if (push?.state) applyServerState({ state: push.state });

    // 3. Frischen Gesamtstand holen (anderes Gerät kann geschrieben haben)
    if (pull) {
      const me = await apiFetch('/api/me', { token });
      applyServerState(me);
    }

    setAccount({ lastSyncAt: Date.now(), lastError: null });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // Sitzung abgelaufen oder widerrufen
      getState().account = {};
      saveNow();
    } else {
      setAccount({ lastError: err.message || 'Abgleich fehlgeschlagen' });
    }
  } finally {
    syncing = false;
    saveNow();
    emit();
  }
  return status();
}

/** Beim Start und bei Rückkehr ins Netz abgleichen. */
export function startAutoSync() {
  if (!isConfigured()) return;
  probeServer().then(() => {
    if (isLoggedIn()) syncNow().catch(() => {});
  });
  globalThis.addEventListener?.('online', () => scheduleSync(500));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSync(1000);
  });
  globalThis.addEventListener?.('pagehide', () => {
    // Letzter Versuch, das Ausstehende loszuwerden
    if (isLoggedIn() && (getState().outbox || []).length) syncNow({ pull: false }).catch(() => {});
  });
}
