import type { DB } from '@op-engineering/op-sqlite';

export async function initializeDatabase(db: DB): Promise<void> {
  // Keep each statement separate: native OP-SQLite execute() runs one
  // prepared statement at a time.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_days (
      id TEXT PRIMARY KEY NOT NULL,
      work_date TEXT NOT NULL UNIQUE,
      check_in_at TEXT,
      check_out_at TEXT,
      status TEXT NOT NULL CHECK (status IN ('not_checked_in', 'checked_in', 'checked_out'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY NOT NULL,
      attendance_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('check_in', 'check_out')),
      occurred_at TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced', 'rejected')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      rejection_reason TEXT,
      FOREIGN KEY (attendance_id) REFERENCES attendance_days(id)
    )
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_event_once_per_day
    ON attendance_events(attendance_id, event_type)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_attendance_events_sync_order
    ON attendance_events(sync_status, occurred_at)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      leave_type TEXT PRIMARY KEY NOT NULL CHECK (leave_type IN ('casual', 'sick')),
      remaining_days INTEGER NOT NULL CHECK (remaining_days >= 0)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY NOT NULL,
      leave_type TEXT NOT NULL CHECK (leave_type IN ('casual', 'sick')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      submitted_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
    ON leave_requests(start_date, end_date, status)
  `);
}
