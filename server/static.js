// SPDX-License-Identifier: Apache-2.0
// Auslieferung der statischen App (Betriebsart A: App und API auf einer Domain).
// Bewusst eng gefasst: nur bekannte Dateitypen, kein Verlassen des Wurzelverzeichnisses.

import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

export function createStaticHandler(rootDir) {
  const root = resolve(rootDir);

  return function serveStatic(req, res, pathname) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return false;

    let relative = decodeURIComponent(pathname);
    if (relative.endsWith('/')) relative += 'index.html';
    const target = resolve(join(root, normalize(relative)));

    // Pfad muss innerhalb des Wurzelverzeichnisses bleiben
    if (target !== root && !target.startsWith(root + sep)) return false;

    const ext = extname(target).toLowerCase();
    const type = TYPES[ext];
    if (!type) return false;

    let stat;
    try {
      stat = statSync(target);
    } catch {
      return false;
    }
    if (!stat.isFile()) return false;

    // Die App aktualisiert sich über den Service Worker; HTML nie zwischenspeichern.
    const cache = ext === '.html' || target.endsWith('sw.js')
      ? 'no-cache'
      : 'public, max-age=300';

    res.writeHead(200, {
      'content-type': type,
      'content-length': stat.size,
      'cache-control': cache,
      'last-modified': new Date(stat.mtimeMs).toUTCString()
    });
    if (req.method === 'HEAD') { res.end(); return true; }
    createReadStream(target).pipe(res);
    return true;
  };
}
