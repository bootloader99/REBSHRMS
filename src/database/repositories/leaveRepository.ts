import type { DB } from '@op-engineering/op-sqlite';
import type { LeaveBalance, LeaveRequest, LeaveStatus, LeaveType } from '../../types/domain';

interface LeaveBalanceRow { leave_type: LeaveType; remaining_days: number; }
interface LeaveRequestRow {
  id: string; leave_type: LeaveType; start_date: string; end_date: string;
  reason: string; status: LeaveStatus; submitted_at: string;
}

export class LeaveRepository {
  constructor(private readonly db: DB) {}

  async getBalance(): Promise<LeaveBalance> {
    const result = await this.db.execute('SELECT leave_type, remaining_days FROM leave_balances');
    const balance: LeaveBalance = { casual: 0, sick: 0 };
    (result.rows as unknown as LeaveBalanceRow[]).forEach(row => { balance[row.leave_type] = row.remaining_days; });
    return balance;
  }

  async saveBalance(balance: LeaveBalance): Promise<void> {
    await this.db.executeBatch([
      ['INSERT INTO leave_balances (leave_type, remaining_days) VALUES (?, ?) ON CONFLICT(leave_type) DO UPDATE SET remaining_days = excluded.remaining_days', ['casual', balance.casual]],
      ['INSERT INTO leave_balances (leave_type, remaining_days) VALUES (?, ?) ON CONFLICT(leave_type) DO UPDATE SET remaining_days = excluded.remaining_days', ['sick', balance.sick]],
    ]);
  }

  async getRequests(): Promise<LeaveRequest[]> {
    const result = await this.db.execute('SELECT * FROM leave_requests ORDER BY submitted_at DESC');
    return (result.rows as unknown as LeaveRequestRow[]).map(row => ({
      id: row.id, type: row.leave_type, startDate: row.start_date, endDate: row.end_date,
      reason: row.reason, status: row.status, submittedAt: row.submitted_at,
    }));
  }

  async saveRequest(request: LeaveRequest): Promise<void> {
    await this.db.execute(
      'INSERT OR REPLACE INTO leave_requests (id, leave_type, start_date, end_date, reason, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [request.id, request.type, request.startDate, request.endDate, request.reason, request.status, request.submittedAt],
    );
  }
}
