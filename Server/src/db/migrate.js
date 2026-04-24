/**
 * Lightweight migration runner.
 *
 * Checks information_schema for missing columns/tables and applies them
 * idempotently on every server start. This handles the case where the
 * MySQL named volume already existed before a schema change was introduced
 * (Docker only re-runs init scripts on an empty volume).
 */
const { setTimeout: sleep } = require('timers/promises');
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

/** Wait until MySQL accepts connections (retries for up to ~60 s). */
async function waitForDb(retries = 20, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await db.query('SELECT 1');
      return; // connected
    } catch {
      console.log(`[migrate] Waiting for DB… (attempt ${i}/${retries})`);
      await sleep(delayMs);
    }
  }
  throw new Error('Database did not become ready in time');
}

async function runMigrations() {
  await waitForDb();
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

    // Migration 004 — seed therapy slots if table is empty
    const [[{ cnt }]] = await db.query(
      'SELECT COUNT(*) AS cnt FROM therapy_slots'
    );
    if (cnt === 0) {
      // Generate 3 weeks of slots (Mon–Fri, morning / afternoon / evening)
      const slots = [];
      const today = new Date();
      for (let week = 1; week <= 3; week++) {
        for (let dow = 1; dow <= 5; dow++) {
          // Find the next occurrence of this day-of-week
          const d = new Date(today);
          const diff = (dow - d.getDay() + 7) % 7 || 7;
          d.setDate(d.getDate() + diff + (week - 1) * 7);
          const dateStr = d.toISOString().slice(0, 10);
          slots.push(
            [dateStr, '09:00:00', 'morning'],
            [dateStr, '13:00:00', 'afternoon'],
            [dateStr, '17:00:00', 'evening']
          );
        }
      }
      await db.query(
        'INSERT INTO therapy_slots (slot_date, slot_time, time_of_day) VALUES ?',
        [slots]
      );
      console.log(`[migrate] Seeded ${slots.length} therapy slots`);
    }

    console.log('[migrate] Schema up to date');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    // Non-fatal — server still starts, but log clearly
  }
}

module.exports = { runMigrations };
