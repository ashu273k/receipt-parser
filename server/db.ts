import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ParsedReceipt } from './gemini-client.js';

// ── DB path ─────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.sqlite');

let db: Database.Database;

// ── Init ────────────────────────────────────────────────────────────────────

export function initDb(): void {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id                  TEXT PRIMARY KEY,
      merchant            TEXT NOT NULL,
      date                TEXT NOT NULL,
      currency            TEXT NOT NULL,
      subtotal            REAL,
      tax                 REAL,
      tip                 REAL,
      discount            REAL,
      total               REAL NOT NULL,
      line_items          TEXT NOT NULL,
      overall_confidence  TEXT NOT NULL,
      reviewed            INTEGER NOT NULL DEFAULT 0,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ── Queries ─────────────────────────────────────────────────────────────────

export interface SavedReceipt extends ParsedReceipt {
  id: string;
  reviewed: boolean;
  created_at: string;
}

const insertStmt = () =>
  db.prepare(`
    INSERT INTO receipts (id, merchant, date, currency, subtotal, tax, tip, discount, total, line_items, overall_confidence, reviewed)
    VALUES (@id, @merchant, @date, @currency, @subtotal, @tax, @tip, @discount, @total, @line_items, @overall_confidence, @reviewed)
  `);

const listStmt = () =>
  db.prepare(`SELECT * FROM receipts ORDER BY created_at DESC`);

/**
 * Saves a reviewed receipt and returns the generated id.
 */
export function saveReceipt(data: ParsedReceipt): string {
  const id = crypto.randomUUID();
  insertStmt().run({
    id,
    merchant: data.merchant,
    date: data.date,
    currency: data.currency,
    subtotal: data.subtotal,
    tax: data.tax,
    tip: data.tip,
    discount: data.discount,
    total: data.total,
    line_items: JSON.stringify(data.line_items),
    overall_confidence: data.overall_confidence,
    reviewed: 1,
  });
  return id;
}

/**
 * Returns all saved receipts, newest first, with line_items parsed back to arrays.
 */
export function listReceipts(): SavedReceipt[] {
  const rows = listStmt().all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: row.id as string,
    merchant: row.merchant as string,
    date: row.date as string,
    currency: row.currency as string,
    subtotal: row.subtotal as number | null,
    tax: row.tax as number | null,
    tip: row.tip as number | null,
    discount: row.discount as number | null,
    total: row.total as number,
    line_items: JSON.parse(row.line_items as string),
    overall_confidence: row.overall_confidence as 'high' | 'medium' | 'low',
    reviewed: row.reviewed === 1,
    created_at: row.created_at as string,
  }));
}
