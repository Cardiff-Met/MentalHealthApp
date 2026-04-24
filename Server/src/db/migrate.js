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

/** Build 3 weeks of Mon–Fri slots: 09–11 morning, 14–16 afternoon (1-hour each). */
function buildSlots() {
  const slots = [];
  const today = new Date();
  const times = [
    ['09:00:00', 'morning'],
    ['10:00:00', 'morning'],
    ['11:00:00', 'morning'],
    ['14:00:00', 'afternoon'],
    ['15:00:00', 'afternoon'],
    ['16:00:00', 'afternoon'],
  ];
  for (let week = 1; week <= 3; week++) {
    for (let dow = 1; dow <= 5; dow++) {
      const d = new Date(today);
      const diff = (dow - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff + (week - 1) * 7);
      const dateStr = d.toISOString().slice(0, 10);
      for (const [time, tod] of times) {
        slots.push([dateStr, time, tod]);
      }
    }
  }
  return slots;
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
      const slots = buildSlots();
      await db.query('INSERT INTO therapy_slots (slot_date, slot_time, time_of_day) VALUES ?', [
        slots,
      ]);
      console.log(`[migrate] Seeded ${slots.length} therapy slots`);
    }

    // Migration 005 — add therapist role to users ENUM
    const [[{ roleCol }]] = await db.query(
      `SELECT COLUMN_TYPE AS roleCol
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'role'`
    );
    if (!roleCol.includes('therapist')) {
      await db.query(
        `ALTER TABLE users
         MODIFY role ENUM('user','therapist','admin') NOT NULL DEFAULT 'user'`
      );
      console.log('[migrate] Added therapist to users.role ENUM');
    }

    // Migration 006 — add therapist_id FK to therapy_slots
    if (!(await columnExists('therapy_slots', 'therapist_id'))) {
      await db.query(
        `ALTER TABLE therapy_slots
         ADD COLUMN therapist_id INT NULL
         AFTER time_of_day,
         ADD CONSTRAINT fk_slot_therapist
           FOREIGN KEY (therapist_id) REFERENCES users(id) ON DELETE SET NULL`
      );
      console.log('[migrate] Added therapy_slots.therapist_id');
    }

    // Migration 007 — seed test therapist account
    const [[{ therapistCount }]] = await db.query(
      `SELECT COUNT(*) AS therapistCount FROM users WHERE role = 'therapist'`
    );
    if (therapistCount === 0) {
      const [result] = await db.query(
        `INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, 'therapist')`,
        [
          'therapist@cardiffmet.ac.uk',
          '$2b$10$JuCrCLuEpl3sXfaxKMM8PeIStHTbDQH5lm/npzat2/FCJUyvtCboK',
        ]
      );
      if (result.affectedRows > 0) {
        // Seed 3 weeks of slots owned by this therapist, replacing orphan slots
        await db.query(
          "DELETE FROM therapy_slots WHERE therapist_id IS NULL AND status = 'available'"
        );
        const [[{ tid }]] = await db.query(
          `SELECT id AS tid FROM users WHERE email = 'therapist@cardiffmet.ac.uk'`
        );
        const slots = buildSlots().map((s) => [...s, tid]);
        await db.query(
          'INSERT INTO therapy_slots (slot_date, slot_time, time_of_day, therapist_id) VALUES ?',
          [slots]
        );
        console.log(`[migrate] Seeded therapist account and ${slots.length} owned slots`);
      }
    }

    // Migration 009 — replace legacy 13:00/17:00 slots with 1-hour schedule
    const [[{ legacyCount }]] = await db.query(
      `SELECT COUNT(*) AS legacyCount FROM therapy_slots
       WHERE slot_time IN ('13:00:00', '17:00:00')`
    );
    if (legacyCount > 0) {
      await db.query("DELETE FROM therapy_slots WHERE status = 'available'");
      const slots = buildSlots();
      await db.query('INSERT INTO therapy_slots (slot_date, slot_time, time_of_day) VALUES ?', [
        slots,
      ]);
      console.log(`[migrate] Replaced legacy slots with ${slots.length} 1-hour slots`);
    }

    // Migration 010 — add name column to users
    if (!(await columnExists('users', 'name'))) {
      await db.query(`ALTER TABLE users ADD COLUMN name VARCHAR(100) NULL AFTER email`);
      console.log('[migrate] Added column users.name');
    }

    // Migration 011 — add categories JSON column to resources, seed from category
    if (!(await columnExists('resources', 'categories'))) {
      await db.query(`ALTER TABLE resources ADD COLUMN categories JSON NULL AFTER category`);
      await db.query(
        `UPDATE resources SET categories = JSON_ARRAY(category) WHERE categories IS NULL`
      );
      console.log('[migrate] Added resources.categories and seeded from category');
    }

    console.log('[migrate] Schema up to date');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message);
    throw err; // re-throw so the server doesn't start with a broken schema
  }
}

module.exports = { runMigrations };
