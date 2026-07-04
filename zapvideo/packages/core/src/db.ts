import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from './config';
import type { JobStatus, RenderJob, VideoParams } from './types';

let db: Database.Database | null = null;

export function openDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(config.dataDir, { recursive: true });
  db = new Database(path.join(config.dataDir, 'zapvideo.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  return db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'queued',
      params_json TEXT NOT NULL,
      preview_path TEXT,
      clean_path TEXT,
      error TEXT,
      source TEXT NOT NULL DEFAULT 'web',
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL DEFAULT 'web',
      wa_number TEXT,
      history_json TEXT NOT NULL DEFAULT '[]',
      video_params_json TEXT,
      renders_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      session_id TEXT,
      job_id TEXT,
      props_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      job_id TEXT,
      phone TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'paywall'
    );
  `);
}

export function newId(prefix = ''): string {
  return prefix + crypto.randomBytes(8).toString('hex');
}

// ---------- jobs ----------

export function createJob(params: VideoParams, source: 'web' | 'bot', sessionId?: string): string {
  const id = newId('v');
  openDb()
    .prepare(`INSERT INTO jobs (id, params_json, source, session_id) VALUES (?, ?, ?, ?)`)
    .run(id, JSON.stringify(params), source, sessionId ?? null);
  return id;
}

export function getJob(id: string): RenderJob | null {
  const row = openDb().prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return rowToJob(row);
}

export function claimNextJob(): RenderJob | null {
  const d = openDb();
  const tx = d.transaction(() => {
    const row = d
      .prepare(`SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1`)
      .get() as any;
    if (!row) return null;
    d.prepare(`UPDATE jobs SET status = 'rendering', updated_at = datetime('now') WHERE id = ?`).run(row.id);
    row.status = 'rendering';
    return row;
  });
  const row = tx();
  return row ? rowToJob(row) : null;
}

export function finishJob(id: string, previewPath: string, cleanPath: string) {
  openDb()
    .prepare(
      `UPDATE jobs SET status = 'done', preview_path = ?, clean_path = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(previewPath, cleanPath, id);
}

export function failJob(id: string, error: string) {
  openDb()
    .prepare(`UPDATE jobs SET status = 'error', error = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(error.slice(0, 2000), id);
}

function rowToJob(row: any): RenderJob {
  return {
    id: row.id,
    status: row.status as JobStatus,
    params: JSON.parse(row.params_json),
    previewPath: row.preview_path ?? undefined,
    cleanPath: row.clean_path ?? undefined,
    error: row.error ?? undefined,
    source: row.source,
    sessionId: row.session_id ?? undefined,
    createdAt: row.created_at,
  };
}

// ---------- sessions ----------

export interface SessionRow {
  id: string;
  channel: 'web' | 'bot';
  waNumber?: string;
  history: unknown[];
  videoParams?: VideoParams;
  rendersUsed: number;
}

export function getOrCreateSession(id: string, channel: 'web' | 'bot', waNumber?: string): SessionRow {
  const d = openDb();
  const row = d.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as any;
  if (!row) {
    d.prepare(`INSERT INTO sessions (id, channel, wa_number) VALUES (?, ?, ?)`).run(id, channel, waNumber ?? null);
    return { id, channel, waNumber, history: [], rendersUsed: 0 };
  }
  return {
    id: row.id,
    channel: row.channel,
    waNumber: row.wa_number ?? undefined,
    history: JSON.parse(row.history_json),
    videoParams: row.video_params_json ? JSON.parse(row.video_params_json) : undefined,
    rendersUsed: row.renders_used,
  };
}

export function saveSession(s: SessionRow) {
  openDb()
    .prepare(
      `UPDATE sessions SET history_json = ?, video_params_json = ?, renders_used = ?, wa_number = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(
      JSON.stringify(s.history),
      s.videoParams ? JSON.stringify(s.videoParams) : null,
      s.rendersUsed,
      s.waNumber ?? null,
      s.id
    );
}

// ---------- events / leads ----------

export function logEvent(name: string, props?: Record<string, unknown>, ids?: { sessionId?: string; jobId?: string }) {
  openDb()
    .prepare(`INSERT INTO events (name, session_id, job_id, props_json) VALUES (?, ?, ?, ?)`)
    .run(name, ids?.sessionId ?? null, ids?.jobId ?? null, props ? JSON.stringify(props) : null);
}

export function saveLead(phone: string, jobId?: string, source = 'paywall') {
  openDb().prepare(`INSERT INTO leads (phone, job_id, source) VALUES (?, ?, ?)`).run(phone, jobId ?? null, source);
}

export interface AdminMetrics {
  videosCreated: number;
  videosDone: number;
  paywallClicks: number;
  phonesSubmitted: number;
  whatsappShares: number;
  recentJobs: { id: string; status: string; template: string; source: string; createdAt: string }[];
  recentLeads: { phone: string; jobId: string | null; ts: string }[];
}

export function adminMetrics(): AdminMetrics {
  const d = openDb();
  const count = (sql: string) => (d.prepare(sql).get() as any).c as number;
  return {
    videosCreated: count(`SELECT COUNT(*) c FROM jobs`),
    videosDone: count(`SELECT COUNT(*) c FROM jobs WHERE status = 'done'`),
    paywallClicks: count(`SELECT COUNT(*) c FROM events WHERE name = 'paywall_click'`),
    phonesSubmitted: count(`SELECT COUNT(*) c FROM leads`),
    whatsappShares: count(`SELECT COUNT(*) c FROM events WHERE name = 'whatsapp_share'`),
    recentJobs: (d
      .prepare(`SELECT id, status, params_json, source, created_at FROM jobs ORDER BY created_at DESC LIMIT 20`)
      .all() as any[]).map((r) => ({
      id: r.id,
      status: r.status,
      template: JSON.parse(r.params_json).template,
      source: r.source,
      createdAt: r.created_at,
    })),
    recentLeads: (d
      .prepare(`SELECT phone, job_id, ts FROM leads ORDER BY ts DESC LIMIT 20`)
      .all() as any[]).map((r) => ({ phone: r.phone, jobId: r.job_id, ts: r.ts })),
  };
}
