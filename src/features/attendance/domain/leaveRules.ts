import type { LeaveBalance, LeaveRequest, LeaveType } from '../../../types/domain';

export interface LeaveDraft {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export type LeaveValidationResult =
  | { valid: true; days: number }
  | { valid: false; message: string };

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null;
}

function calendarDaysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function validateLeaveDraft(
  draft: LeaveDraft,
  companyDate: string,
  balance: LeaveBalance,
  existingRequests: LeaveRequest[],
): LeaveValidationResult {
  const start = parseDate(draft.startDate);
  const end = parseDate(draft.endDate);
  const today = parseDate(companyDate);

  if (!start || !end || !today) {
    return { valid: false, message: 'Enter valid dates.' };
  }

  if (start < today) {
    return { valid: false, message: 'Leave cannot start before today.' };
  }

  if (end < start) {
    return { valid: false, message: 'End date must be on or after the start date.' };
  }

  if (draft.reason.trim().length < 10) {
    return { valid: false, message: 'Reason must contain at least 10 non-space characters.' };
  }

  const days = calendarDaysInclusive(start, end);
  if (days > balance[draft.type]) {
    return { valid: false, message: 'Requested days exceed your available leave balance.' };
  }

  const overlaps = existingRequests.some(request => {
    if (request.status === 'rejected') {
      return false;
    }

    const existingStart = parseDate(request.startDate);
    const existingEnd = parseDate(request.endDate);
    return !!existingStart
      && !!existingEnd
      && start <= existingEnd
      && end >= existingStart;
  });

  if (overlaps) {
    return { valid: false, message: 'This period overlaps an existing pending or approved request.' };
  }

  return { valid: true, days };
}
