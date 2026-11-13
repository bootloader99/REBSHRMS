import type { DB } from '@op-engineering/op-sqlite';
import type {
  AttendanceEvent,
  AttendanceRecord,
  PendingAttendanceEvent,
  AttendanceStatus,
  SyncStatus,
} from '../../types/domain';

interface AttendanceDayRow {
  id: string;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
}

interface AttendanceEventRow {
  id: string;
  attendance_id: string;
  event_type: AttendanceEvent['type'];
  occurred_at: string;
  latitude: number;
  longitude: number;
  sync_status: AttendanceEvent['syncStatus'];
  retry_count: number;
  rejection_reason: string | null;
  employee_id: string;
  work_date: string;
}

const mapDay = (row: AttendanceDayRow): AttendanceRecord => ({
  id: row.id,
  workDate: row.work_date,
  checkInAt: row.check_in_at,
  checkOutAt: row.check_out_at,
  status: row.status,
});

const mapEvent = (row: AttendanceEventRow): PendingAttendanceEvent => ({
  id: row.id,
  attendanceId: row.attendance_id,
  type: row.event_type,
  occurredAt: row.occurred_at,
  latitude: row.latitude,
  longitude: row.longitude,
  syncStatus: row.sync_status,
  retryCount: row.retry_count,
  rejectionReason: row.rejection_reason ?? undefined,
  employeeId: row.employee_id,
  workDate: row.work_date,
});

export class AttendanceRepository {
  constructor(private readonly db: DB) {}

  async getDay(workDate: string): Promise<AttendanceRecord | null> {
    const result = await this.db.execute(
      'SELECT * FROM attendance_days WHERE work_date = ? LIMIT 1',
      [workDate],
    );
    const row = result.rows[0] as AttendanceDayRow | undefined;
    return row ? mapDay(row) : null;
  }

  async getRecentDays(limit = 5): Promise<AttendanceRecord[]> {
    const result = await this.db.execute(
      'SELECT * FROM attendance_days ORDER BY work_date DESC LIMIT ?',
      [limit],
    );
    return (result.rows as AttendanceDayRow[]).map(mapDay);
  }

  async saveDayAndEvent(
    record: AttendanceRecord,
    event: AttendanceEvent,
  ): Promise<void> {
    // The event ID is generated before this method is called and remains
    // unchanged for every retry. Both local writes commit or roll back together.
    await this.db.executeBatch([
      [
        `INSERT INTO attendance_days
          (id, work_date, check_in_at, check_out_at, status)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(work_date) DO UPDATE SET
            check_in_at = excluded.check_in_at,
            check_out_at = excluded.check_out_at,
            status = excluded.status`,
        [
          record.id,
          record.workDate,
          record.checkInAt,
          record.checkOutAt,
          record.status,
        ],
      ],
      [
        `INSERT INTO attendance_events
          (id, attendance_id, event_type, occurred_at, latitude, longitude, sync_status, retry_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.attendanceId,
          event.type,
          event.occurredAt,
          event.latitude,
          event.longitude,
          event.syncStatus,
          event.retryCount,
        ],
      ],
    ]);
  }


  async saveRemoteDays(records: AttendanceRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.db.executeBatch(records.map(record => [
      `INSERT OR IGNORE INTO attendance_days
        (id, work_date, check_in_at, check_out_at, status)
        VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.workDate, record.checkInAt, record.checkOutAt, record.status],
    ]));
  }

  async getSyncCounts(): Promise<Record<SyncStatus, number>> {
    const result = await this.db.execute(
      'SELECT sync_status, COUNT(*) AS total FROM attendance_events GROUP BY sync_status',
    );
    const counts: Record<SyncStatus, number> = { pending: 0, synced: 0, rejected: 0 };
    (result.rows as Array<{ sync_status: SyncStatus; total: number }>).forEach(row => {
      counts[row.sync_status] = row.total;
    });
    return counts;
  }

  async getPendingEvents(): Promise<PendingAttendanceEvent[]> {
    const result = await this.db.execute(
      `SELECT attendance_events.*, employees.id AS employee_id, attendance_days.work_date
       FROM attendance_events
       INNER JOIN attendance_days ON attendance_days.id = attendance_events.attendance_id
       CROSS JOIN employees
       WHERE attendance_events.sync_status = 'pending'
       ORDER BY attendance_events.occurred_at ASC, attendance_events.rowid ASC`,
    );
    return (result.rows as AttendanceEventRow[]).map(mapEvent);
  }

  async markEventSynced(eventId: string): Promise<void> {
    await this.db.execute(
      "UPDATE attendance_events SET sync_status = 'synced' WHERE id = ?",
      [eventId],
    );
  }

  async markEventRejected(eventId: string, reason: string): Promise<void> {
    await this.db.execute(
      "UPDATE attendance_events SET sync_status = 'rejected', rejection_reason = ? WHERE id = ?",
      [reason, eventId],
    );
  }

  async incrementRetryCount(eventId: string): Promise<void> {
    await this.db.execute(
      'UPDATE attendance_events SET retry_count = retry_count + 1 WHERE id = ?',
      [eventId],
    );
  }
}
