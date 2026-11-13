import { useCallback, useEffect, useState } from 'react';
import { database } from '../../../core/database/connection';
import type { LeaveBalance, LeaveRequest } from '../../../types/domain';
import { LeaveRepository } from '../data/leaveRepository';
import { LeaveService } from '../services/leaveService';
import type { LeaveDraft } from '../domain/leaveRules';

const leaveService = new LeaveService(new LeaveRepository(database));

export function useLeave(online: boolean, enabled: boolean) {
  const [balance, setBalance] = useState<LeaveBalance>({ casual: 0, sick: 0 });
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cachedBalance, cachedRequests] = await leaveService.getCachedState();
      setBalance(cachedBalance);
      setRequests(cachedRequests);
      if (online) {
        const [serverBalance, serverRequests] = await leaveService.refreshFromServer();
        setBalance(serverBalance);
        setRequests(serverRequests);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to refresh leave information.');
    } finally {
      setLoading(false);
    }
  }, [online]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const submit = useCallback(async (draft: LeaveDraft) => {
    setSubmitting(true);
    setError(null);
    try {
      await leaveService.submit(draft, online);
      const [nextBalance, nextRequests] = await leaveService.getCachedState();
      setBalance(nextBalance);
      setRequests(nextRequests);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit leave request.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [online]);

  return { balance, requests, loading, submitting, error, refresh, submit };
}
