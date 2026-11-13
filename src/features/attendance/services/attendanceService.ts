import { appConfig } from '../../../config/appConfig';
import { apiRequest } from '../../../core/api/apiClient';
import type { AttendanceEventType, AttendanceRecord } from '../../../types/domain';
import { getCompanyDate } from '../../../core/date/companyDate';
import { AttendanceRepository } from '../../../database/repositories/attendanceRepository';
import { getNextAttendanceStatus, isWithinGeofence } from '../domain/attendanceRules';
import { getDistanceInMeters } from '../domain/geofence';
import { getCurrentCoordinates } from './locationService';

function createLocalId(): string {
  return `attendance-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  async getToday(): Promise<AttendanceRecord | null> {
    return this.repository.getDay(getCompanyDate(appConfig.companyTimeZone));
  }

  async getRecent(): Promise<AttendanceRecord[]> {
    return this.repository.getRecentDays(5);
  }

  async refreshFromServer(): Promise<void> {
    const records = await apiRequest<Array<Omit<AttendanceRecord, 'id'>>>('/attendance');
    await this.repository.saveRemoteDays(records.map(record => ({
      ...record,
      id: `server-${record.workDate}`,
    })));
  }

  async recordAction(type: AttendanceEventType): Promise<AttendanceRecord> {
    const { latitude, longitude } = appConfig.office;
    if (latitude === null || longitude === null) {
      throw new Error('Office location is not configured. Add the office coordinates in src/config/appConfig.ts first.');
    }

    const currentLocation = await getCurrentCoordinates();
    const distance = getDistanceInMeters(
      { latitude, longitude },
      currentLocation,
    );
    if (!isWithinGeofence(distance, appConfig.office.allowedRadiusMeters)) {
      throw new Error(`You are ${Math.round(distance)} m from the office. Attendance is allowed within ${appConfig.office.allowedRadiusMeters} m.`);
    }

    const workDate = getCompanyDate(appConfig.companyTimeZone);
    const existing = await this.repository.getDay(workDate);
    const currentStatus = existing?.status ?? 'not_checked_in';
    const nextStatus = getNextAttendanceStatus(currentStatus, type);
    const occurredAt = new Date().toISOString();
    const record: AttendanceRecord = {
      id: existing?.id ?? createLocalId(),
      workDate,
      checkInAt: type === 'check_in' ? occurredAt : existing?.checkInAt ?? null,
      checkOutAt: type === 'check_out' ? occurredAt : existing?.checkOutAt ?? null,
      status: nextStatus,
    };

    await this.repository.saveDayAndEvent(record, {
      id: createLocalId(),
      attendanceId: record.id,
      type,
      occurredAt,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      syncStatus: 'pending',
      retryCount: 0,
    });
    return record;
  }
}
