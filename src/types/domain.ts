export type AttendanceStatus = 'not_checked_in' | 'checked_in' | 'checked_out';

export type SyncStatus = 'pending' | 'synced' | 'rejected';

export type AttendanceEventType = 'check_in' | 'check_out';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface AttendanceRecord {
  id: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
}

export interface AttendanceEvent {
  id: string;
  attendanceId: string;
  type: AttendanceEventType;
  occurredAt: string;
  latitude: number;
  longitude: number;
  syncStatus: SyncStatus;
  retryCount: number;
  rejectionReason?: string;
}

export type LeaveType = 'casual' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
}

export interface PendingAttendanceEvent extends AttendanceEvent {
  employeeId: string;
  workDate: string;
}
