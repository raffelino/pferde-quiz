// Kleine HTTP-Helfer: JSON lesen und schreiben, CORS, ein einfacher Router.
// Bewusst schmal gehalten – die API hat wenige Endpunkte.

export const MAX_BODY_BYTES = 1_000_000;

export function sendJson(res, status, body, extraHeaders = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
    ...extraHeaders
  });
  res.end(text);
}

export function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Body einlesen und als JSON auswerten – mit Größenbegrenzung. */
export function readJsonBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'body_too_large', 'Anfrage ist zu groß'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'invalid_json', 'Body ist kein gültiges JSON'));
      }
    });
    req.on('error', err => reject(new HttpError(400, 'request_error', err.message)));
  });
}

/**
 * CORS. Ohne Allowlist bleibt die API gleich-Ursprung (Modus A) – dann wird
 * gar kein Header gesetzt und der Browser lässt nur die eigene Domain zu.
 */
export function applyCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins?.length) return;
  if (!allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) return;

  res.setHeader('access-control-allow-origin', allowedOrigins.includes('*') ? '*' : origin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,authorization');
  res.setHeader('access-control-max-age', '86400');
}

/** Router ohne Platzhalter: Methode + exakter Pfad. */
export function createRouter() {
  const routes = new Map();
  const key = (method, path) => `${method} ${path}`;
  return {
    add(method, path, handler) {
      routes.set(key(method, path), handler);
      return this;
    },
    find(method, path) {
      return routes.get(key(method, path)) || null;
    },
    has(path) {
      return [...routes.keys()].some(k => k.endsWith(` ${path}`));
    }
  };
}

export function clientIp(req, { trustProxy = false } = {}) {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unbekannt';
}
