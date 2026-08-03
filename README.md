# 🐴 Reitabzeichen Trainer

Eine mobile-optimierte Quiz-App zum Lernen der Theorie für den **Basispass Pferdekunde**
und die **Reitabzeichen**. Läuft komplett im Browser – ohne Server, ohne Account,
ohne Build-Schritt.

## Features

- **176 Fragen** in **14 Kategorien**, die sich einzeln an- und ausschalten lassen
- **7 Antwort-Modi**, passend zur jeweiligen Frage:
  | Modus | Beschreibung |
  |---|---|
  | Einfachauswahl | eine richtige Antwort |
  | Mehrfachauswahl | mehrere richtige Antworten |
  | Richtig / Falsch | Aussage bewerten |
  | Freitext | Begriff eintippen (Tippfehler werden verziehen) |
  | Zahleneingabe | Zahlenwert mit Toleranzbereich |
  | Reihenfolge | Schritte in die richtige Ordnung tippen |
  | Zuordnung | Begriffe paarweise zuordnen |
- **Karteikarten-System (Leitner)**: 5 Fächer. Richtig beantwortet → ein Fach weiter,
  falsch → zurück in Fach 1. Fragen aus niedrigen Fächern kommen deutlich häufiger dran,
  bis sie sitzen. Eine Frage gilt als „gelernt", wenn sie Fach 5 erreicht.
- **Statistik**: richtige, falsche und gesamte Antworten sowie die Zeit – live während
  des Trainings und langfristig auf dem Statistik-Bildschirm (inkl. Fortschritt je
  Kategorie, Karteikasten-Verteilung und Liste der hartnäckigsten Fragen)
- **Filter**: nach Kategorie, nach Schwierigkeitsstufe (Basis / Aufbau / Profi) und
  „nur schwierige Fragen"
- **Mobil zuerst**: große Touch-Flächen, Safe-Area-Unterstützung, Dark- und Light-Mode,
  installierbar als PWA und offline nutzbar
- **Fortschritt bleibt lokal** im Browser (`localStorage`) – keine Daten verlassen das Gerät

## Live-Version

Nach dem ersten erfolgreichen Deployment erreichbar unter:

```
https://<dein-github-name>.github.io/pferde-quiz/
```

### GitHub Pages aktivieren (einmalig, muss von Hand passieren)

Der Workflow kann GitHub Pages nicht selbst einschalten – der Token einer Action darf
keine Pages-Site anlegen. Deshalb einmalig:

1. Im Repository auf **Settings → Pages** gehen
2. Unter **Build and deployment → Source** den Eintrag **GitHub Actions** wählen
3. Unter **Actions → Deploy to GitHub Pages → Run workflow** den Workflow einmal starten
   (oder einfach den nächsten Push abwarten)

Solange Schritt 1–2 fehlen, bricht der Workflow im Schritt „Setup Pages" mit
`Get Pages site failed` ab – das ist erwartet und behebt sich mit der Einstellung.

Danach veröffentlicht `.github/workflows/deploy-pages.yml` die Seite bei jedem Push
auf `main`, `master` oder einen `claude/**`-Branch.

## Lokal starten

Die App braucht einen kleinen Webserver (ES-Module funktionieren nicht über `file://`):

```bash
npx http-server -p 8080 -c-1 .
# oder
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

## Fragen ergänzen oder korrigieren

Die Fragen liegen als einfache Objekte in `js/data/`:

```js
{
  id: 'ge01',            // eindeutig, wird für den Lernfortschritt genutzt
  cat: 'gesundheit',     // Kategorie-ID aus js/data/categories.js
  level: 'basis',        // basis | aufbau | profi
  type: 'single',        // single | multi | truefalse | text | number | order | match
  q: 'Fragetext …',
  options: ['A', 'B'],   // single/multi
  a: 0,                  // single: Index · multi: [Indizes] · truefalse: true/false
                         // text: ['akzeptierte', 'Antworten'] · number: Zahl
  items: [],             // order: Elemente in der richtigen Reihenfolge
  pairs: [['links', 'rechts']], // match
  tol: 0.5, unit: '°C',  // number: Toleranz und Einheit
  explain: 'Erklärung, die nach dem Antworten erscheint.'
}
```

Neue Kategorien in `js/data/categories.js` eintragen, neue Fragendateien in
`js/data/index.js` importieren. Danach die Struktur prüfen:

```bash
node tools/validate-questions.mjs
```

Optionaler Browser-Smoketest (benötigt Playwright und einen laufenden Server auf Port 8080):

```bash
node tools/smoke-test.mjs
```

Nach Änderungen an Dateien, die im Service Worker gecacht werden, in `sw.js` die
`CACHE_VERSION` erhöhen – sonst sehen bereits installierte Clients die alte Version.

## Hinweis zu den Inhalten

Dies ist eine **inoffizielle, privat erstellte Lernhilfe**. Die Fragen orientieren sich an
den Lernzielen und Themengebieten der Ausbildungs- und Prüfungsliteratur der Deutschen
Reiterlichen Vereinigung (FN) – Texte aus den Büchern wurden nicht übernommen, die Fragen
und Erklärungen sind eigenständig formuliert. Es besteht keine Verbindung zur FN und keine
Gewähr für Vollständigkeit oder Prüfungsrelevanz. Für die Prüfungsvorbereitung gelten immer
die aktuellen Originalwerke (z. B. „Richtlinien für Reiten und Fahren", Basispass
Pferdekunde) sowie die jeweils gültige LPO.
