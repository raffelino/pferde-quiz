// SPDX-License-Identifier: Apache-2.0
// Zugriff auf das Backend. Ohne konfigurierte API bleibt die App rein lokal.
//
// Die Adresse steht in index.html:
//   <meta name="api-base" content="auto">          -> gleiche Herkunft wie die Seite
//   <meta name="api-base" content="https://api…">  -> eigene Adresse
//   (kein Meta-Tag)                                -> kein Backend
// Zum Ausprobieren lässt sie sich mit
//   localStorage.setItem('reitabzeichen-trainer.api', 'https://api…')
// überschreiben.

const OVERRIDE_KEY = 'reitabzeichen-trainer.api';

export function apiBase() {
  try {
    const override = localStorage.getItem(OVERRIDE_KEY);
    if (override !== null) return override.replace(/\/$/, '');
  } catch { /* localStorage gesperrt */ }

  const meta = document.querySelector('meta[name="api-base"]')?.content;
  if (meta === undefined || meta === null) return null;
  const value = meta.trim();
  if (!value) return null;
  if (value === 'auto') return '';
  return value.replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(status, code, message, body) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
  get offline() {
    return this.status === 0;
  }
}

/**
 * Aufruf der API. Wirft ApiError – auch bei Netzproblemen (status 0),
 * damit der Aufrufer den Unterschied kennt.
 */
export async function apiFetch(path, { method = 'GET', body, token, timeoutMs = 10_000 } = {}) {
  const base = apiBase();
  if (base === null) throw new ApiError(0, 'no_backend', 'Kein Backend konfiguriert');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    throw new ApiError(0, 'network', err.name === 'AbortError' ? 'Zeitüberschreitung' : 'Keine Verbindung');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { /* keine JSON-Antwort */ }
  }

  if (!res.ok) {
    const code = data?.error?.code || `http_${res.status}`;
    const message = data?.error?.message || `Server antwortete mit ${res.status}`;
    throw new ApiError(res.status, code, message, data);
  }
  return data;
}
