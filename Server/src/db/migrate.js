/**
 * Lightweight migration runner.
 *
 * Checks information_schema for missing columns and seeds missing rows,
 * applied idempotently on every server start. This handles the case where
 * the MySQL named volume already existed before a schema change was added
 * (Docker only re-runs initdb scripts on an empty volume).
 *
 * The server container's depends_on healthcheck guarantees MySQL is fully
 * ready before this runs, so no retry logic is needed here.
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

    // Migration 004 — seed therapy slots if table is empty
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM therapy_slots');
    if (cnt === 0) {
      // Generate 3 weeks of Mon–Fri slots (morning / afternoon / evening)
      const slots = [];
      const today = new Date();
      for (let week = 1; week <= 3; week++) {
        for (let dow = 1; dow <= 5; dow++) {
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
      await db.query('INSERT INTO therapy_slots (slot_date, slot_time, time_of_day) VALUES ?', [
        slots,
      ]);
      console.log(`[migrate] Seeded ${slots.length} therapy slots`);
    }

    console.log('[migrate] Schema up to date');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    throw err; // re-throw so the server doesn't start with a broken schema
  }
}

module.exports = { runMigrations };
