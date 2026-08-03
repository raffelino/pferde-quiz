# 🐴 Reitabzeichen Trainer

Eine mobile-optimierte Quiz-App zum Lernen der Theorie für den **Basispass Pferdekunde**
und die **Reitabzeichen**. Läuft komplett im Browser – ohne Server, ohne Account,
ohne Build-Schritt.

## Features

- **250 Fragen** in **17 Kategorien**, die sich einzeln an- und ausschalten lassen
- **8 Antwort-Modi**, passend zur jeweiligen Frage:
  | Modus | Beschreibung |
  |---|---|
  | Einfachauswahl | eine richtige Antwort |
  | Mehrfachauswahl | mehrere richtige Antworten |
  | Richtig / Falsch | Aussage bewerten |
  | Freitext | Begriff eintippen (Tippfehler werden verziehen) |
  | Zahleneingabe | Zahlenwert mit Toleranzbereich |
  | Reihenfolge | Schritte in die richtige Ordnung tippen |
  | Zuordnung | Begriffe paarweise oder in Gruppen zuordnen |
  | Pyramide | Ausbildungsskala bzw. Ausbildungsweg Stufe für Stufe aufbauen |

  Fußfolge-Fragen zeigen statt Text kleine Diagramme des Pferdes von oben, die in
  die richtige Reihenfolge gebracht werden.
- **Runden**: Innerhalb einer Runde kommt jede Frage genau einmal dran – eine sofort
  richtig beantwortete Frage taucht erst in der nächsten Runde wieder auf. Falsch
  beantwortete Fragen werden nach mindestens acht weiteren Fragen bis zu zweimal
  wiederholt. Die Kopfzeile zeigt „Runde 2 · 37/250", der Startbildschirm den
  Rundenfortschritt samt „Runde neu starten".
- **Kategorien priorisieren**: Über die Zahl rechts an jeder Kategorie (1× / 2× / 3×)
  kommen deren Fragen innerhalb einer Runde deutlich früher dran.
- **Karteikarten-System (Leitner)**: 5 Fächer. Richtig beantwortet → ein Fach weiter,
  falsch → zurück in Fach 1. Fragen aus niedrigen Fächern kommen deutlich häufiger dran,
  bis sie sitzen. Eine Frage gilt als „gelernt", wenn sie Fach 5 erreicht.
- **Statistik**: richtige, falsche und gesamte Antworten sowie die Zeit – live während
  des Trainings und langfristig auf dem Statistik-Bildschirm (inkl. Fortschritt je
  Kategorie, Karteikasten-Verteilung und Liste der hartnäckigsten Fragen)
- **Sitzungen**: ohne Limit, als Speed-Runde über 5, 10 oder 20 Minuten oder mit
  festen 20 Fragen. Bei Zeitlimit läuft die Uhr rückwärts; am Ende gibt es eine
  Auswertung mit Quote, Tempo, neu gelernten und falsch beantworteten Fragen.
  Über den Pfeil links oben lässt sich jede Sitzung vorzeitig beenden.
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

## Einzeldatei-Version (ohne Server, offline)

`dist/reitabzeichen-trainer.html` enthält die komplette App in einer einzigen Datei –
CSS und JavaScript sind eingebettet. Die Datei lässt sich per Doppelklick öffnen,
auf einen USB-Stick kopieren oder verschicken; der Lernfortschritt wird trotzdem
im Browser gespeichert. Neu bauen:

```bash
node tools/build-single-file.mjs            # dist/reitabzeichen-trainer.html
node tools/build-single-file.mjs --fragment # ohne <html>/<head>/<body>-Gerüst
```

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
  type: 'single',        // single | multi | truefalse | text | number | order | match | pyramid
  q: 'Fragetext …',
  options: ['A', 'B'],   // single/multi
  a: 0,                  // single: Index · multi: [Indizes] · truefalse: true/false
                         // text: ['akzeptierte', 'Antworten'] · number: Zahl
  items: [],             // order: Elemente in der richtigen Reihenfolge – entweder
                         // Texte oder { label, hooves: ['VL','HR'] } für Fußfolge-Bilder
  levels: [],            // pyramid: Stufen von unten nach oben
  given: [0],            // pyramid: bereits vorgegebene Stufen (optional)
  groups: [{ from: 0, to: 2, label: '…' }], // pyramid: Klammern links (optional)
  pairs: [['links', 'rechts']], // match
  tol: 0.5, unit: '°C',  // number: Toleranz und Einheit
  explain: 'Erklärung, die nach dem Antworten erscheint.'
}
```

Neue Kategorien in `js/data/categories.js` eintragen, neue Fragendateien in
`js/data/index.js` importieren. Danach die Struktur prüfen:

```bash
node tools/validate-questions.mjs   # Struktur des Fragenpools
node tools/srs-sim.mjs              # Karteikasten-Gewichtung
node tools/round-sim.mjs            # Runden, Wiederholungen, Priorisierung
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
Reiterlichen Vereinigung (FN) sowie an eigenen Kursunterlagen (Hilfengebung,
Grundgangarten) – Texte aus den Büchern wurden nicht übernommen, die Fragen
und Erklärungen sind eigenständig formuliert. Es besteht keine Verbindung zur FN und keine
Gewähr für Vollständigkeit oder Prüfungsrelevanz. Für die Prüfungsvorbereitung gelten immer
die aktuellen Originalwerke (z. B. „Richtlinien für Reiten und Fahren", Basispass
Pferdekunde) sowie die jeweils gültige LPO.
