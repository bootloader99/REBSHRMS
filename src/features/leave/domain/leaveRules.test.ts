import { validateLeaveDraft } from './leaveRules';
import type { LeaveBalance, LeaveRequest } from '../../../types/domain';

const balance: LeaveBalance = { casual: 5, sick: 3 };
const existing: LeaveRequest[] = [{
  id: 'leave-1',
  type: 'casual',
  startDate: '2026-11-20',
  endDate: '2026-11-21',
  reason: 'Family function',
  status: 'pending',
  submittedAt: '2026-11-13T08:00:00.000Z',
}];

const validDraft = {
  type: 'casual' as const,
  startDate: '2026-11-15',
  endDate: '2026-11-16',
  reason: 'Personal work',
};

describe('validateLeaveDraft', () => {
  it('accepts a valid inclusive calendar-day request', () => {
    expect(validateLeaveDraft(validDraft, '2026-11-13', balance, [])).toEqual({
      valid: true,
      days: 2,
    });
  });

  it('rejects a start date before the company date', () => {
    expect(validateLeaveDraft(
      { ...validDraft, startDate: '2026-11-12' },
      '2026-11-13',
      balance,
      [],
    ).valid).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    expect(validateLeaveDraft(
      { ...validDraft, endDate: '2026-11-14' },
      '2026-11-13',
      balance,
      [],
    ).valid).toBe(false);
  });

  it('rejects a reason with fewer than ten non-space characters', () => {
    expect(validateLeaveDraft(
      { ...validDraft, reason: '  abcdefgh  ' },
      '2026-11-13',
      balance,
      [],
    ).valid).toBe(false);
  });

  it('rejects a request exceeding the leave balance', () => {
    expect(validateLeaveDraft(
      { ...validDraft, endDate: '2026-11-20' },
      '2026-11-13',
      balance,
      [],
    ).valid).toBe(false);
  });

  it('rejects overlap with pending requests', () => {
    expect(validateLeaveDraft(
      { ...validDraft, startDate: '2026-11-21' },
      '2026-11-13',
      balance,
      existing,
    ).valid).toBe(false);
  });

  it('ignores rejected requests when checking overlap', () => {
    const rejected = existing.map(request => ({ ...request, status: 'rejected' as const }));
    expect(validateLeaveDraft(
      { ...validDraft, startDate: '2026-11-21' },
      '2026-11-13',
      balance,
      rejected,
    ).valid).toBe(true);
  });
});
