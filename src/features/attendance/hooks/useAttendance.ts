import { useCallback, useEffect, useState } from 'react';
import { database } from '../../../database/connection';
import { AttendanceRepository } from '../../../database/repositories/attendanceRepository';
import { AttendanceService } from '../services/attendanceService';
import { AttendanceSyncService } from '../services/attendanceSyncService';
import type { AttendanceEventType, AttendanceRecord } from '../../../types/domain';

const attendanceRepository = new AttendanceRepository(database);
const attendanceService = new AttendanceService(attendanceRepository);
const attendanceSyncService = new AttendanceSyncService(attendanceRepository);

export function useAttendance(online: boolean, enabled: boolean) {
  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [syncCounts, setSyncCounts] = useState({ pending: 0, synced: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (online) {
        try {
          await attendanceService.refreshFromServer();
        } catch {
          // Keep showing the local cache when the API cannot be reached.
        }
      }
      const [todayRecord, recentRecords, nextSyncCounts] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.getRecent(),
        attendanceRepository.getSyncCounts(),
      ]);
      setToday(todayRecord);
      setRecent(recentRecords);
      setSyncCounts(nextSyncCounts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [online]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await attendanceSyncService.syncPending();
      await refresh();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to sync attendance.';
      setError(message);
      throw e;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const recordAction = useCallback(async (type: AttendanceEventType) => {
    setWorking(true);
    setError(null);
    try {
      await attendanceService.recordAction(type);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to record attendance.';
      setError(message);
      throw e;
    } finally {
      setWorking(false);
    }
  }, [refresh]);

  return { today, recent, pendingCount: syncCounts.pending, syncCounts, loading, working, syncing, error, refresh, recordAction, syncNow };
}
