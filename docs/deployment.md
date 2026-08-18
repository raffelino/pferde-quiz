# Online stellen

Ziel: Die App liegt öffentlich im Netz, **beliebige Menschen melden sich mit
ihrem Google-Konto an** und finden ihren Lernstand auf jedem Gerät wieder.

Das Wichtigste vorweg: **GitHub Pages allein reicht dafür nicht.** Pages liefert
nur Dateien aus und kann kein Programm ausführen – für Konten braucht es einen
laufenden Server mit Datenbank. Pages bleibt trotzdem nützlich (siehe Variante B).

## Zwei Varianten

### A) Alles von einem Server (empfohlen)

```
https://trainer.example.com/          App
https://trainer.example.com/api/…     API          – ein Prozess, eine Domain
```

Kein CORS, keine Fremd-Domain bei der Anmeldung, eine Adresse zum Merken.
Die GitHub-Pages-Seite kann als Schaufenster bestehen bleiben.

### B) App auf GitHub Pages, API woanders

```
https://name.github.io/pferde-quiz/   App (Pages)
https://api.example.com/api/…         API
```

Nötig, wenn die Pages-Adresse die Hauptadresse bleiben soll. Dann müssen
zusätzlich `ALLOWED_ORIGINS` am Server und `API_BASE_URL` im Repository gesetzt
sein (siehe unten). Die Anmeldung funktioniert trotzdem, weil die Sitzung über
einen `Authorization`-Header läuft und nicht über Cookies – Drittanbieter-Cookies
würden von Safari sonst blockiert.

## Schritt 1: Google-Anmeldung einrichten

Das kann nur der Betreiber selbst, es hängt an einem Google-Konto.

1. [Google Cloud Console](https://console.cloud.google.com/) → Projekt anlegen
2. **APIs & Dienste → OAuth-Zustimmungsbildschirm**: Nutzertyp „Extern",
   App-Name, Support-E-Mail, Datenschutzerklärung-Link. Solange die App im
   Status „Testing" steht, können sich **nur eingetragene Testnutzer anmelden** –
   für „beliebige Nutzer" muss sie auf **„In Produktion"** gestellt werden.
   Bei den reinen Anmelde-Berechtigungen (`openid`, `email`, `profile`) ist dafür
   keine Google-Überprüfung nötig.
3. **Anmeldedaten → OAuth-Client-ID → Webanwendung**
   - Autorisierte JavaScript-Ursprünge: die Adresse(n) der App
     (`https://trainer.example.com`, bei Variante B zusätzlich
     `https://name.github.io`)
   - Redirect-URIs braucht es nicht – die App nutzt kein Weiterleitungsverfahren.
4. Die Client-ID (`…apps.googleusercontent.com`) merken.

Die Client-ID wird **nur am Server** als `GOOGLE_CLIENT_ID` gesetzt; das
Frontend holt sie über `/api/config`. Sie steht damit nirgends im Repository.

## Schritt 2: Server betreiben

Der Server ist ein einzelner Node-Prozess mit einer SQLite-Datei. Er braucht
kein `npm install` – es gibt keine Laufzeit-Abhängigkeiten.

### Mit fly.io (vorbereitet)

Das Anlegen der App passiert einmalig auf dem eigenen Rechner – ein
Deploy-Token darf zwar ausliefern, aber keine App und kein Volume anlegen.

**Reihenfolge beachten:** Der App-Name legt die Adresse fest
(`https://<app-name>.fly.dev`), und genau die braucht Google als autorisierten
JavaScript-Ursprung. Also zuerst den Namen wählen, dann den OAuth-Client damit
anlegen (Schritt 1 oben), dann ausliefern. Wer erst deployt und den Namen
später ändert, darf beim OAuth-Client nachbessern.

```bash
# 1. App anlegen. Der Name ist weltweit eindeutig; ist er vergeben, einen
#    anderen wählen und in fly.toml eintragen.
flyctl launch --no-deploy --copy-config --name mein-trainer

# 2. Volume für die SQLite-Datei – genau EINES, siehe Kasten unten.
flyctl volumes create trainer_data --region fra --size 1 --yes

# 3. Client-ID hinterlegen (landet nicht im Repository)
flyctl secrets set GOOGLE_CLIENT_ID=…apps.googleusercontent.com

# 4. Erstes Deployment
flyctl deploy --ha=false
flyctl scale count 1          # zur Sicherheit nachsehen
flyctl status
```

> **Nur eine Maschine.** Ein Volume gehört immer genau einer Maschine. Legt fly
> zwei an – beim ersten Deploy die Voreinstellung –, entstehen **zwei getrennte
> Datenbanken**. Nutzer landen mal auf der einen, mal auf der anderen und sehen
> unterschiedliche Lernstände, ohne dass irgendwo ein Fehler auftaucht. Deshalb
> immer `--ha=false`. Der Deploy-Workflow prüft die Anzahl nach jedem
> Deployment und schlägt fehl, wenn es mehr als eine ist.

Ist es soweit, lässt sich das Ausliefern an GitHub übergeben:

```bash
flyctl tokens create deploy -a mein-trainer     # nur Deployment, nur diese App
```

Den ausgegebenen Token im Repository unter **Settings → Secrets and variables →
Actions → Secrets** als `FLY_API_TOKEN` hinterlegen und unter **Variables**
`DEPLOY_TARGET=fly` setzen. Danach liefert `.github/workflows/deploy-api.yml`
bei jedem Push auf `main` aus – aber erst, nachdem die Tests durchgelaufen sind.

**Zum Token selbst:** `tokens create deploy` gibt einen Schlüssel, der nur
diese eine App ausliefern darf – kein Zugriff auf Abrechnung, andere Apps oder
das Konto. Er gehört ausschließlich in den GitHub-Secret-Speicher, nie in eine
Datei im Repository und nie in einen Chat-Verlauf. Ist er doch einmal irgendwo
gelandet, wo er nicht hingehört:

```bash
flyctl tokens list
flyctl tokens revoke <id>
```

### Mit Docker (jeder andere Anbieter)

```bash
docker build -t trainer .
docker run -d --name trainer -p 8787:8787 \
  -v trainer-data:/data \
  -e GOOGLE_CLIENT_ID=…apps.googleusercontent.com \
  -e NODE_ENV=production \
  -e TRUST_PROXY=1 \
  trainer
```

Davor gehört ein HTTPS-Endpunkt (Caddy, nginx, Traefik oder der Load Balancer
des Anbieters). **`TRUST_PROXY=1` nur setzen, wenn wirklich ein Proxy davorsteht** –
sonst kann sich jeder eine beliebige Absender-IP ausdenken und die Begrenzung
der Anmeldeversuche aushebeln.

### Umgebungsvariablen

| Variable | Standard | Bedeutung |
|---|---|---|
| `GOOGLE_CLIENT_ID` | – | OAuth-Client-ID. Fehlt sie, ist die Anmeldung aus. |
| `DB_PATH` | `./data/trainer.db` | Pfad der SQLite-Datei (auf ein beständiges Volume legen) |
| `PORT` | `8787` | Port |
| `NODE_ENV` | – | `production` schaltet die Test-Anmeldung endgültig ab |
| `ALLOWED_ORIGINS` | leer | nur für Variante B: `https://name.github.io` |
| `TRUST_PROXY` | `0` | `1`, wenn ein Reverse Proxy die echte IP in `X-Forwarded-For` setzt |
| `SESSION_DAYS` | `90` | Gültigkeit einer Anmeldung, gleitend verlängert |
| `SERVE_STATIC` | `1` | `0`, wenn der Server nur die API ausliefern soll |
| `CONTENT_SECURITY_POLICY` | leer | siehe unten |
| `ALLOW_TEST_LOGIN` | `0` | **niemals in Produktion** – Anmeldung ohne Google |

## Schritt 3 (nur Variante B): Pages auf die API zeigen lassen

Im Repository unter **Settings → Secrets and variables → Actions → Variables**
die Variable `API_BASE_URL` auf `https://api.example.com` setzen. Der
Pages-Workflow trägt sie beim Deployment in `index.html` ein
(`tools/set-api-base.mjs`, lehnt alles ab, was nicht `https` ist).

Am Server zusätzlich `ALLOWED_ORIGINS=https://name.github.io` setzen.

Ohne die Variable bleibt die Pages-Version wie bisher rein lokal – sie fragt
einmal `/api/config` an, bekommt nichts und lernt weiter ohne Konto.

## Schritt 4: Nach dem ersten Deployment prüfen

```bash
curl https://trainer.example.com/api/health     # Version, Anzahl Fragen
curl https://trainer.example.com/api/config     # muss die Client-ID nennen
```

Meldet `/api/config` keine `googleClientId`, ist `GOOGLE_CLIENT_ID` nicht
angekommen – dann erscheint in der App auch keine Anmeldeschaltfläche.

Danach einmal von Hand: anmelden, drei Fragen beantworten, in einem anderen
Browser anmelden und prüfen, dass der Stand da ist.

## Content-Security-Policy

Die CSP ist bewusst **nicht** fest eingebaut: Eine zu strenge Regel legt still
die Google-Anmeldung lahm, und die lässt sich in der Entwicklung hier nicht
durchspielen. Nach dem ersten erfolgreichen Login einschalten und die Anmeldung
danach **erneut testen**:

```
CONTENT_SECURITY_POLICY="default-src 'self'; base-uri 'self'; object-src 'none'; \
frame-ancestors 'none'; form-action 'self'; \
img-src 'self' data: https://*.googleusercontent.com; \
script-src 'self' https://accounts.google.com/gsi/client; \
frame-src https://accounts.google.com/gsi/; \
connect-src 'self' https://accounts.google.com/gsi/; \
style-src 'self' 'unsafe-inline'"
```

Ohne die Variable setzt der Server trotzdem `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options` und `Cross-Origin-Opener-Policy`.

## Sicherungen

Die gesamte Datenlage steckt in einer Datei.

```bash
# im laufenden Betrieb sicher (nicht einfach kopieren!)
sqlite3 /data/trainer.db ".backup '/data/backup-$(date +%F).db'"
```

Bei fly.io zusätzlich Volume-Snapshots aktivieren. Einmal ausprobieren, ob sich
aus der Sicherung wirklich ein Server starten lässt – eine ungetestete Sicherung
ist keine.

## Pflichten als Betreiber

Sobald sich fremde Menschen anmelden, werden personenbezogene Daten verarbeitet
(Name, E-Mail, Profilbild-Adresse von Google sowie der Lernverlauf). Dann braucht
die Seite:

- eine **Datenschutzerklärung** (was wird gespeichert, warum, wie lange, wer ist
  verantwortlich, Kontakt) – Google verlangt beim Zustimmungsbildschirm ohnehin
  einen Link darauf
- ein **Impressum**, wenn die Seite in Deutschland öffentlich angeboten wird
- eine Möglichkeit zur **Löschung** – die gibt es bereits: `DELETE /api/me`,
  in der App als „Konto löschen", entfernt Nutzer, Sitzungen, Karten und
  Antworten in einem Zug

Was der Server speichert, steht in [backend.md](backend.md) unter „Datenmodell".
Passwörter gibt es keine, Sitzungstoken liegen nur als Hash in der Datenbank.

## Wenn es klemmt

| Symptom | Ursache |
|---|---|
| Keine Anmeldeschaltfläche | `GOOGLE_CLIENT_ID` fehlt – `/api/config` prüfen |
| „origin is not allowed" von Google | Adresse fehlt in den autorisierten JavaScript-Ursprüngen |
| Anmeldung nur für einzelne Konten | OAuth-Zustimmungsbildschirm steht auf „Testing" |
| Login-Fenster hängt | `Cross-Origin-Opener-Policy` – die App setzt bewusst `same-origin-allow-popups`; ein Proxy davor darf das nicht überschreiben |
| CORS-Fehler in der Konsole (Variante B) | `ALLOWED_ORIGINS` am Server setzen |
| Lernstand weg nach Neustart | `DB_PATH` zeigt nicht auf ein beständiges Volume |
