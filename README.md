# 🐴 Reitabzeichen Trainer

Eine mobile-optimierte Quiz-App zum Lernen der Theorie für den **Basispass Pferdekunde**
und die **Reitabzeichen**. Die App läuft komplett im Browser – ohne Build-Schritt.
Wer den Lernstand geräteübergreifend sichern möchte, startet zusätzlich das
mitgelieferte Backend mit Google-Anmeldung.

## Features

- **249 Fragen** in **17 Kategorien**, die sich einzeln an- und ausschalten lassen
- **Stufensystem**: Einsteiger (Basispass · RA 10–6), Fortgeschritten (RA 5 & 4)
  oder Profi (RA 3–1). Die Stufe bestimmt, welche Fragen drankommen; die Stufen
  bauen aufeinander auf, Fortgeschrittene wiederholen also die Basis mit. Sitzen
  **80 %** der Fragen einer Stufe im letzten Karteikasten-Fach, meldet die App den
  Aufstieg und schlägt die nächste Stufe vor. Der Stand wird immer frisch aus dem
  Karteikasten gerechnet – auf dem Gerät und auf dem Server mit demselben Code.
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
  die richtige Reihenfolge gebracht werden. Bei der Auflösung bleibt die selbst
  gewählte Reihenfolge stehen: Die eigene Zahl wird durchgestrichen, die richtige
  steht direkt daneben – man sieht also, *was* man verwechselt hat.
- **Runden**: Innerhalb einer Runde kommt jede Frage genau einmal dran. Sobald eine
  Frage richtig beantwortet ist, taucht sie in dieser Runde nicht mehr auf – auch dann
  nicht, wenn sie vorher schon einmal falsch war. Falsch beantwortete Fragen werden
  bis zu zweimal wiederholt, nach einem zufälligen Abstand von 8–17 Fragen, beim
  zweiten Mal nach 16–35 Fragen. Steht eine Wiederholung am Rundenende noch aus,
  wandert sie in die nächste Runde und belegt dort den Platz der Frage. Die Kopfzeile zeigt „Runde 2 · 37/250", der Startbildschirm den
  Rundenfortschritt samt „Runde neu starten".
- **Verwandte Fragen** (z. B. „Welche Arten von Zügelhilfen gibt es?" und „Wie viele
  Arten von Zügelhilfen unterscheidet man?") sind über ein `twin`-Feld gruppiert und
  kommen nie dicht hintereinander.
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
  „nur schwierige Fragen". Eine eigene Schwierigkeitsauswahl sticht die Stufe –
  die App sagt dann auch, dass gerade eine eigene Auswahl aktiv ist.
- **Mobil zuerst**: große Touch-Flächen, Safe-Area-Unterstützung, Dark- und Light-Mode,
  installierbar als PWA und offline nutzbar
- **Fortschritt bleibt lokal** im Browser (`localStorage`) – ohne Konto verlässt
  nichts das Gerät. Mit Konto (siehe unten) wird zusätzlich auf dem eigenen Server gesichert.

## Konto und Backend (optional)

Ohne Backend funktioniert alles wie bisher – der Lernstand liegt dann im Browser.
Mit dem mitgelieferten Server wird daraus ein Konto:

- **Anmeldung mit Google**, kein Passwort
- Lernstand, Einstellungen und Rundenstand liegen in einer **SQLite-Datenbank**
- **mehrere Geräte**: Handy im Stall, Laptop zu Hause – derselbe Stand
- **offline weiterlernen**: Antworten wandern in eine Outbox und werden später
  nachgereicht; der Server rechnet die Karteikästen daraus nach
- **Konto löschen** entfernt alle Daten (ein Klick in der App)

```bash
npm start                    # http://localhost:8787 – App und API
npm run dev                  # zusätzlich mit Test-Anmeldung, ohne Google
```

Wie das Ganze **öffentlich** online geht – Google-Anmeldung einrichten, Server
betreiben, Sicherungen, Betreiberpflichten – steht Schritt für Schritt in
[docs/deployment.md](docs/deployment.md). Datenmodell und Begründungen stehen in
[docs/backend.md](docs/backend.md). Kurzfassung für den Betrieb:

| Variable | Bedeutung |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth-Client-ID aus der Google Cloud Console (Typ „Web") |
| `DB_PATH` | Pfad der SQLite-Datei, Standard `./data/trainer.db` |
| `ALLOWED_ORIGINS` | nur nötig, wenn das Frontend auf einer anderen Domain liegt |
| `ALLOW_TEST_LOGIN` | `1` erlaubt eine Anmeldung ohne Google (nur lokal, nie in Produktion) |

Mit Docker: `docker build -t trainer . && docker run -p 8787:8787 -v trainer-data:/data -e GOOGLE_CLIENT_ID=... trainer`

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
npm test              # Fragenpool, Einheits- und Integrationstests, Simulationen
npm run test:e2e      # Browser gegen echten Server (benötigt playwright)
```

Einzeln:

| Befehl | Prüft |
|---|---|
| `npm run test:data` | Struktur des Fragenpools |
| `npm run test:unit` | Lernlogik, Anmeldung, Abgleich, alle API-Endpunkte |
| `npm run test:sim` | Runden, Wiederholungsabstände, Priorisierung über viele Durchläufe |
| `npm run test:e2e` | Anmelden, lernen, neu laden, zweites Gerät, offline |
| `npm run test:ui` | Browser: alle Antworttypen und das Stufensystem (Server auf Port 8080) |
| `node tools/stage-ui.mjs` | nur Stufen: Auswahl, Aufstieg, Empfehlung, alte Stände |
| `node tools/order-ui.mjs` | Reihenfolge-Auflösung: eigene Wahl bleibt lesbar, Layout hält |

Die Tests laufen bei jedem Push über GitHub Actions (`.github/workflows/ci.yml`).

## Versionen und Updates

Der Service Worker holt die App-Dateien **zuerst aus dem Netz** und nutzt den Cache nur
als Offline-Reserve. Damit startet die App nach einem Deploy sofort mit dem neuen Code;
übernimmt eine neue Version, lädt sich die Seite einmal selbst neu. Aufrufe an `/api/`
bleiben bewusst außen vor – eine zwischengespeicherte Serverantwort würde beim
Abgleich als aktueller Stand durchgehen und den neueren lokalen überschreiben.

Bei jeder Veröffentlichung beide Stellen erhöhen:

- `CACHE_VERSION` in `sw.js`
- `APP_VERSION` in `js/version.js` (steht unten auf dem Startbildschirm)

`node tools/build-single-file.mjs` bricht ab, wenn die beiden auseinanderlaufen.
`node tools/round-stress.mjs` spielt 1 500 Fragen je Lauf mit wechselnden Kategorien
durch und prüft, dass eine richtig beantwortete Frage in derselben Runde nicht
wiederkommt.

## Lizenz

Programmcode und Inhalte stehen unter der **Apache License 2.0** – siehe
[LICENSE](LICENSE) und [NOTICE](NOTICE). Kurz: benutzen, verändern und
weitergeben ist erlaubt, auch kommerziell, solange Lizenz- und
Urheberrechtshinweis erhalten bleiben und Änderungen kenntlich gemacht werden.
Die Lizenz gibt außerdem eine ausdrückliche Patentlizenz und schließt jede
Gewährleistung aus.

Jede Quelldatei trägt `SPDX-License-Identifier: Apache-2.0`. Fremde
Bibliotheken sind nicht enthalten: Die App nutzt nur Bordmittel des Browsers,
der Server nur die Node-Standardbibliothek.

## Hinweis zu den Inhalten

Dies ist eine **inoffizielle, privat erstellte Lernhilfe**. Die Fragen orientieren sich an
den Lernzielen und Themengebieten der Ausbildungs- und Prüfungsliteratur der Deutschen
Reiterlichen Vereinigung (FN) sowie an eigenen Kursunterlagen (Hilfengebung,
Grundgangarten) – Texte aus den Büchern wurden nicht übernommen, die Fragen
und Erklärungen sind eigenständig formuliert. Es besteht keine Verbindung zur FN und keine
Gewähr für Vollständigkeit oder Prüfungsrelevanz. Für die Prüfungsvorbereitung gelten immer
die aktuellen Originalwerke (z. B. „Richtlinien für Reiten und Fahren", Basispass
Pferdekunde) sowie die jeweils gültige LPO.
