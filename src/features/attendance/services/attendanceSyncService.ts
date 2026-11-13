import { apiRequest, ApiError } from '../../../core/api/apiClient';
import type { PendingAttendanceEvent } from '../../../types/domain';
import { AttendanceRepository } from '../../../database/repositories/attendanceRepository';

interface AttendanceEventResponse { accepted: boolean; duplicate?: boolean; }

export interface SyncResult {
  synced: number;
  rejected: number;
  pending: number;
}

export class AttendanceSyncService {
  constructor(private readonly repository: AttendanceRepository) {}

  async syncPending(): Promise<SyncResult> {
    const events = await this.repository.getPendingEvents();
    let synced = 0;
    let rejected = 0;

    // Process one at a time so a checkout cannot overtake its check-in.
    for (const event of events) {
      try {
        await this.sendEvent(event);
        await this.repository.markEventSynced(event.id);
        synced += 1;
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          await this.repository.markEventRejected(event.id, error.message);
          rejected += 1;
          continue;
        }

        // A timeout or server error may mean the server accepted the event but
        // the response was lost. Keep the same event ID for the next attempt.
        await this.repository.incrementRetryCount(event.id);
        break;
      }
    }

    const remaining = await this.repository.getPendingEvents();
    return { synced, rejected, pending: remaining.length };
  }

  private sendEvent(event: PendingAttendanceEvent): Promise<AttendanceEventResponse> {
    return apiRequest<AttendanceEventResponse>('/attendance/events', {
      method: 'POST',
      headers: { 'Idempotency-Key': event.id },
      body: JSON.stringify({
        id: event.id,
        employeeId: event.employeeId,
        workDate: event.workDate,
        eventType: event.type,
        occurredAt: event.occurredAt,
        latitude: event.latitude,
        longitude: event.longitude,
      }),
    });
  }
}
