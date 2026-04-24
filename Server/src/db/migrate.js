/**
 * Lightweight migration runner.
 *
 * Checks information_schema for missing columns/tables and applies them
 * idempotently on every server start. This handles the case where the
 * MySQL named volume already existed before a schema change was introduced
 * (Docker only re-runs init scripts on an empty volume).
 */
const db = require('./connection');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function runMigrations() {
  try {
    // Migration 001 — add category column to resources
    if (!(await columnExists('resources', 'category'))) {
      await db.query(
        `ALTER TABLE resources
         ADD COLUMN category VARCHAR(50) DEFAULT 'general'
         AFTER url`
      );
      console.log('[migrate] Added column resources.category');
    }

    // Migration 002 — add min_mood column to resources
    if (!(await columnExists('resources', 'min_mood'))) {
      await db.query(
        `ALTER TABLE resources
         ADD COLUMN min_mood TINYINT DEFAULT 1
         AFTER category`
      );
      console.log('[migrate] Added column resources.min_mood');
    }

    // Migration 003 — add max_mood column to resources
    if (!(await columnExists('resources', 'max_mood'))) {
      await db.query(
        `ALTER TABLE resources
         ADD COLUMN max_mood TINYINT DEFAULT 5
         AFTER min_mood`
      );
      console.log('[migrate] Added column resources.max_mood');
    }

    console.log('[migrate] Schema up to date');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    // Non-fatal — server still starts, but log clearly
  }
}

module.exports = { runMigrations };
