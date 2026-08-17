# Backend – Plan und Architektur

Ziel: Lernfortschritt gehört zum **Menschen**, nicht zum Browser. Anmeldung per
Google, Daten in einer Datenbank, mehrere Geräte, nachvollziehbare Statistik –
ohne die bisherige Stärke aufzugeben: Die App muss offline weiterlaufen.

## Entscheidungen und Begründung

| Thema | Entscheidung | Warum |
|---|---|---|
| Laufzeit | Node ≥ 22, **keine Laufzeit-Abhängigkeiten** (`node:http`, `node:sqlite`, `node:crypto`) | Kleine API (11 Endpunkte). Kein Lieferketten-Risiko, kein `npm install` beim Deploy, vollständig hier testbar. Ab Node 24 ist `node:sqlite` stabil, auf Node 22 mit `--experimental-sqlite`. |
| Datenbank | SQLite (Datei), Zugriff nur über `server/db.js` | Für einen Lern-Trainer mit einigen hundert Nutzern völlig ausreichend, keine zweite Infrastruktur. Der Zugriff läuft über eine schmale Schicht, ein Wechsel auf Postgres betrifft nur diese Datei und die Migrationen. |
| Anmeldung | Google Identity Services → **ID-Token** → Server prüft Signatur gegen Googles JWKS | Kein Passwort, kein Passwort-Reset, keine E-Mail-Zustellung. Der Server vertraut nie dem Client, sondern prüft das Token selbst. |
| Sitzung | Zufälliges Token (32 Byte), **Bearer**-Header, in der DB nur der SHA-256-Hash | Funktioniert auch, wenn Frontend (GitHub Pages) und API auf verschiedenen Domains liegen – Cookies wären dort Drittanbieter-Cookies und würden von Safari blockiert. |
| Synchronisation | Antworten sind **Ereignisse** mit eigener ID; der Server rechnet den Kartenzustand daraus nach | Zwei Geräte überschreiben sich sonst gegenseitig. Ereignisse sind idempotent und der Kartenzustand ist reproduzierbar. |
| Lernlogik | **Ein** Modul (`js/core/srs-core.js`) für Browser und Server | Sonst driften die Regeln auseinander und Client und Server berechnen unterschiedliche Fächer. |
| Offline | localStorage bleibt die Arbeitskopie, ungesendete Antworten liegen in einer Outbox | Im Stall gibt es kein Netz. Ohne Konto funktioniert alles wie bisher. |

## Topologie

Zwei unterstützte Betriebsarten – der Code ist derselbe:

```
A) Alles aus einer Hand (empfohlen)
   https://trainer.example.com/          -> statische App   } derselbe
   https://trainer.example.com/api/...   -> API             } Server

B) Frontend bleibt auf GitHub Pages
   https://name.github.io/pferde-quiz/   -> statische App
   https://api.example.com/api/...       -> API (CORS-Allowlist + Bearer-Token)
```

Ohne konfigurierte API-Adresse läuft die App unverändert im lokalen Modus.

## Datenmodell

```
users        id, google_sub (eindeutig), email, name, picture, created_at, last_seen_at
sessions     token_hash (PK), user_id, created_at, expires_at, last_used_at, user_agent
cards        (user_id, question_id) PK, box, right, wrong, streak, seen_at, updated_at
answers      id, user_id, client_event_id, question_id, correct, ms, answered_at, created_at
             UNIQUE (user_id, client_event_id)   -> Idempotenz
user_state   user_id (PK), settings JSON, round JSON, totals JSON, seq, revision, updated_at
schema_migrations version, name, applied_at
```

Die Migrationen stehen als nummerierte Einträge in `server/db.js` (`MIGRATIONS`)
und laufen beim Start automatisch in einer Transaktion. Einträge werden nur
angehängt, nie geändert.

`google_sub` ist der Schlüssel, nicht die E-Mail: Google-Konten können ihre
E-Mail-Adresse wechseln, `sub` bleibt.

`cards` ist abgeleiteter Zustand, `answers` die Wahrheit. Beides wird in
derselben Transaktion geschrieben.

## Synchronisation im Detail

1. Jede Antwort erzeugt lokal ein Ereignis `{ eventId, questionId, correct, ms, answeredAt }`
   und wandert in die Outbox.
2. Sobald online und angemeldet: `POST /api/answers { events: [...] }`.
3. Der Server verwirft bereits bekannte `eventId`s (UNIQUE) und speichert die
   restlichen.
4. Für jede betroffene Frage wird die Karte **immer vollständig aus dem
   Antwortprotokoll neu berechnet** – sortiert nach `answeredAt`, nicht nach
   Eingangsreihenfolge. Deshalb ist es gleichgültig, wann welches Gerät seine
   Ereignisse abliefert; Nachzügler führen zum selben Ergebnis.
   Auch die Summen werden nachgerechnet statt mitgezählt.
5. Die Antwort enthält die neuen Kartenstände; der Client übernimmt sie.

Beim **ersten** Anmelden mit lokal erlerntem Stand wird dieser einmalig
übernommen (`POST /api/import`). Danach ist der Server die Wahrheit: Meldet sich
jemand auf einem zweiten Gerät an, auf dem lokal gelernt wurde, gewinnt der
Serverstand – die App sagt das auch deutlich, statt still zu überschreiben.

Einstellungen und Rundenstand sind kein Ereignisstrom, sondern ein Dokument mit
`revision`. Der Client schickt die Revision, die er gelesen hat; ist sie
veraltet, antwortet der Server mit `409` und dem aktuellen Stand. Der Client
übernimmt dann den Server-Stand (und meldet es sichtbar), statt stillschweigend
zu überschreiben.

## API

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/health` | Betriebsprüfung (Version, DB erreichbar) |
| GET | `/api/config` | was das Frontend zum Anmelden braucht (Client-ID) |
| POST | `/api/auth/google` | ID-Token eintauschen → Sitzungstoken |
| POST | `/api/auth/logout` | Sitzung beenden |
| GET | `/api/me` | Nutzer + kompletter Lernstand |
| POST | `/api/answers` | Antwort-Ereignisse melden (idempotent) |
| POST | `/api/import` | einmaliger Übertrag des lokal erlernten Stands beim ersten Anmelden |
| PUT | `/api/state` | Einstellungen/Runde speichern (mit Revision) |
| GET | `/api/stats` | Auswertung: Fächer, Kategorien, Verlauf |
| DELETE | `/api/me` | Konto und alle Daten löschen |

Fehler immer als `{ error: { code, message } }` mit passendem Status.

## Sicherheit

- Der Server prüft ID-Tokens vollständig: Signatur (JWKS, gecacht), `iss`, `aud`,
  `exp`, `iat`, `nbf`. Kein Vertrauen in Client-Angaben.
- Sitzungstoken nur gehasht gespeichert; Ablauf nach 90 Tagen, gleitende Verlängerung.
- Fragen-IDs werden gegen den echten Fragenpool geprüft – nichts Unbekanntes landet in der DB.
- Grenzen: 1 MB Body, 500 Ereignisse je Anfrage, Token-Bucket je IP.
- CORS nur für konfigurierte Ursprünge.
- Test-Login existiert, ist aber an `ALLOW_TEST_LOGIN=1` **und** `NODE_ENV != production` gebunden.
- Kontolöschung über die API (DSGVO), Kaskade über alle Tabellen.
- Der Service Worker fasst `/api/`-Aufrufe nicht an. Eine zwischengespeicherte
  Antwort auf `/api/me` würde ohne Netz als gültiger Serverstand gelten – und
  der Serverstand gewinnt beim Abgleich. Lieber ein ehrlicher Netzfehler: Dann
  bleibt der lokale Stand stehen und die Outbox reicht später nach.
  `tools/e2e.mjs` prüft, dass im Cache nichts mit `/api/` liegt.

## Tests

| Ebene | Was |
|---|---|
| Einheit | JWT-Prüfung, Sitzungen, Merge-Regeln, Migrationen, SRS-Kern |
| Integration | Alle Endpunkte gegen einen laufenden Server mit temporärer DB |
| Regression | Idempotenz, Nachzügler-Ereignisse, Revisionskonflikt, Rundenregeln serverseitig, Fremdzugriff auf andere Nutzer |
| Simulation | Bestehende Rundenlogik-Simulationen (`tools/*-sim.mjs`) |
| E2E | Playwright: anmelden, lernen, neu laden, Fortschritt ist noch da; zweites Gerät sieht denselben Stand |
| CI | GitHub Actions bei jedem Push und Pull Request |

## Was der Betreiber selbst tun muss

1. **Google-OAuth-Client anlegen** (Google Cloud Console → APIs & Dienste →
   Anmeldedaten → OAuth-Client-ID, Typ „Web"). Autorisierte JavaScript-Ursprünge:
   die Adresse des Frontends. Die Client-ID wird nur als `GOOGLE_CLIENT_ID` am
   Server gesetzt – das Frontend holt sie über `/api/config`, sie steht also
   nirgends im Repository.
2. **Hosting wählen** – der Server ist ein einzelner Node-Prozess mit einer
   SQLite-Datei auf einem beständigen Volume. Dockerfile liegt bei.
3. **Sicherungen** der SQLite-Datei einrichten (`sqlite3 .backup` oder Volume-Snapshot).
