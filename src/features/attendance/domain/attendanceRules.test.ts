import { getNextAttendanceStatus, isWithinGeofence } from './attendanceRules';

describe('attendance state transitions', () => {
  it('allows check-in from a not-checked-in state', () => {
    expect(getNextAttendanceStatus('not_checked_in', 'check_in')).toBe('checked_in');
  });

  it('allows check-out after check-in', () => {
    expect(getNextAttendanceStatus('checked_in', 'check_out')).toBe('checked_out');
  });

  it('rejects repeated check-in', () => {
    expect(() => getNextAttendanceStatus('checked_in', 'check_in')).toThrow();
  });

  it('rejects check-out without check-in', () => {
    expect(() => getNextAttendanceStatus('not_checked_in', 'check_out')).toThrow();
  });

  it('rejects actions after checkout', () => {
    expect(() => getNextAttendanceStatus('checked_out', 'check_in')).toThrow();
    expect(() => getNextAttendanceStatus('checked_out', 'check_out')).toThrow();
  });
});

describe('geofence distance', () => {
  it('accepts a point on the configured radius', () => {
    expect(isWithinGeofence(200)).toBe(true);
  });

  it('rejects points outside the radius and invalid distances', () => {
    expect(isWithinGeofence(200.01)).toBe(false);
    expect(isWithinGeofence(-1)).toBe(false);
    expect(isWithinGeofence(Number.NaN)).toBe(false);
  });
});
