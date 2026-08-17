// SPDX-License-Identifier: Apache-2.0
// Datenbankzugriff über die in Node eingebaute SQLite.
//
// Auf Node 22 braucht das den Schalter --experimental-sqlite, ab Node 24 nicht
// mehr. Der gesamte SQL-Zugriff läuft über diese Datei; ein späterer Wechsel
// auf Postgres betrifft nur sie und die Migrationen.

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Migrationen. Nur anhängen, niemals ändern – die Nummer steht in der
 * Tabelle schema_migrations und entscheidet, was noch fehlt.
 */
export const MIGRATIONS = [
  {
    version: 1,
    name: 'init',
    sql: `
      CREATE TABLE users (
        id            INTEGER PRIMARY KEY,
        google_sub    TEXT    NOT NULL UNIQUE,
        email         TEXT,
        name          TEXT,
        picture       TEXT,
        created_at    INTEGER NOT NULL,
        last_seen_at  INTEGER NOT NULL
      );

      CREATE TABLE sessions (
        token_hash    TEXT    PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at    INTEGER NOT NULL,
        expires_at    INTEGER NOT NULL,
        last_used_at  INTEGER NOT NULL,
        user_agent    TEXT
      );
      CREATE INDEX idx_sessions_user ON sessions(user_id);
      CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

      CREATE TABLE cards (
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id   TEXT    NOT NULL,
        box           INTEGER NOT NULL,
        right_count   INTEGER NOT NULL DEFAULT 0,
        wrong_count   INTEGER NOT NULL DEFAULT 0,
        streak        INTEGER NOT NULL DEFAULT 0,
        seen_at       INTEGER NOT NULL DEFAULT -1,
        updated_at    INTEGER NOT NULL,
        PRIMARY KEY (user_id, question_id)
      );

      -- Antworten sind die Wahrheit, cards ist daraus abgeleitet.
      CREATE TABLE answers (
        id              INTEGER PRIMARY KEY,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_event_id TEXT    NOT NULL,
        question_id     TEXT    NOT NULL,
        correct         INTEGER NOT NULL,
        ms              INTEGER,
        answered_at     INTEGER NOT NULL,
        created_at      INTEGER NOT NULL,
        UNIQUE (user_id, client_event_id)
      );
      CREATE INDEX idx_answers_card ON answers(user_id, question_id, answered_at);
      CREATE INDEX idx_answers_time ON answers(user_id, answered_at);

      CREATE TABLE user_state (
        user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        settings    TEXT    NOT NULL,
        round       TEXT    NOT NULL,
        totals      TEXT    NOT NULL,
        seq         INTEGER NOT NULL DEFAULT 0,
        revision    INTEGER NOT NULL DEFAULT 0,
        updated_at  INTEGER NOT NULL
      );
    `
  }
];

export function openDatabase(path = ':memory:') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  migrate(db);
  return db;
}

export function migrate(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL
  )`);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
        .run(migration.version, migration.name, Date.now());
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${migration.version} (${migration.name}) fehlgeschlagen: ${err.message}`);
    }
  }
  return db;
}

/** Mehrere Schreibvorgänge als eine Einheit. */
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* Verbindung schon zu */ }
    throw err;
  }
}
