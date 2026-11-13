import type { AttendanceStatus } from '../../../types/domain';

export type AttendanceAction = 'check_in' | 'check_out';

export function getNextAttendanceStatus(
  current: AttendanceStatus,
  action: AttendanceAction,
): AttendanceStatus {
  if (action === 'check_in' && current === 'not_checked_in') {
    return 'checked_in';
  }

  if (action === 'check_out' && current === 'checked_in') {
    return 'checked_out';
  }

  if (action === 'check_in') {
    throw new Error('You have already checked in for today.');
  }

  throw new Error('You must check in before checking out.');
}

export function isWithinGeofence(
  distanceMeters: number,
  allowedRadiusMeters = 200,
): boolean {
  return Number.isFinite(distanceMeters)
    && distanceMeters >= 0
    && distanceMeters <= allowedRadiusMeters;
}
