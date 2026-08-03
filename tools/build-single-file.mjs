// Baut die App in eine einzige HTML-Datei (CSS und JS eingebettet).
// Nützlich zum Weitergeben per Messenger, für Offline-Nutzung ohne Server
// oder zum Hochladen auf beliebigen Webspace.
//
//   node tools/build-single-file.mjs                    -> dist/reitabzeichen-trainer.html
//   node tools/build-single-file.mjs --fragment          -> ohne <html>/<head>/<body>-Gerüst
//   node tools/build-single-file.mjs --out pfad.html
//
// Benötigt esbuild (wird bei Bedarf über npx geladen).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 && args[outIdx + 1]
  ? resolve(args[outIdx + 1])
  : resolve(root, 'dist/reitabzeichen-trainer.html');

// Version in sw.js und js/version.js muss zusammenpassen, sonst bekommen
// installierte Clients eine neue App mit altem Cache (oder umgekehrt).
const swVersion = /CACHE_VERSION = '([^']+)'/.exec(readFileSync(resolve(root, 'sw.js'), 'utf8'))?.[1];
const appVersion = /APP_VERSION = '([^']+)'/.exec(readFileSync(resolve(root, 'js/version.js'), 'utf8'))?.[1];
if (swVersion !== appVersion) {
  console.error(`Versionen unterschiedlich: sw.js=${swVersion}, js/version.js=${appVersion}`);
  process.exit(1);
}

const css = readFileSync(resolve(root, 'css/styles.css'), 'utf8');
const js = execFileSync(
  'npx',
  ['--yes', 'esbuild', 'js/app.js', '--bundle', '--format=esm', '--target=es2020'],
  { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
);

let html = readFileSync(resolve(root, 'index.html'), 'utf8');

// Body-Markup herauslösen
const body = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>')).trim();
const markup = body.replace(/<script[\s\S]*?<\/script>/g, '').trim();

const head = [
  '<title>Reitabzeichen Trainer</title>',
  '<meta name="build" content="single-file">',
  '<meta name="description" content="Lern-App zum Training für die Reitabzeichen und den Basispass Pferdekunde – mit Karteikarten-System, Kategorien und Statistik.">',
  `<style>\n${css}\n</style>`
].join('\n');

const script = `<script type="module">\n${js}\n</script>`;

const out = fragment
  ? `${head}\n\n${markup}\n\n${script}\n`
  : `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#3f6b4f">
${head}
</head>
<body>
${markup}
${script}
</body>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, out);
console.log(`${outFile}  (${(out.length / 1024).toFixed(0)} KB)`);
