import { appConfig } from '../../../config/appConfig';
import { apiRequest } from '../../../core/api/apiClient';
import { getCompanyDate } from '../../../core/date/companyDate';
import type { LeaveBalance, LeaveRequest } from '../../../types/domain';
import { LeaveRepository } from '../../../database/repositories/leaveRepository';
import { validateLeaveDraft, type LeaveDraft } from '../domain/leaveRules';

function toApiDate(value: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function createLeaveId(): string {
  return `leave-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LeaveService {
  constructor(private readonly repository: LeaveRepository) {}

  getCachedState(): Promise<[LeaveBalance, LeaveRequest[]]> {
    return Promise.all([this.repository.getBalance(), this.repository.getRequests()]);
  }

  async refreshFromServer(): Promise<[LeaveBalance, LeaveRequest[]]> {
    const [balance, requests] = await Promise.all([
      apiRequest<LeaveBalance>('/leave/balance'),
      apiRequest<LeaveRequest[]>('/leave/requests'),
    ]);
    await this.repository.saveBalance(balance);
    for (const request of requests) await this.repository.saveRequest(request);
    return [balance, requests];
  }

  async submit(draft: LeaveDraft, online: boolean): Promise<LeaveRequest> {
    if (!online) throw new Error('Connect to the internet to submit a leave request.');
    const [balance, requests] = await this.refreshFromServer();
    const validation = validateLeaveDraft(
      draft, getCompanyDate(appConfig.companyTimeZone), balance, requests,
    );
    if (!validation.valid) throw new Error(validation.message);

    const request = await apiRequest<LeaveRequest>('/leave/requests', {
      method: 'POST',
      body: JSON.stringify({ ...draft, startDate: toApiDate(draft.startDate), endDate: toApiDate(draft.endDate), id: createLeaveId() }),
    });
    await this.repository.saveRequest(request);
    return request;
  }
}
