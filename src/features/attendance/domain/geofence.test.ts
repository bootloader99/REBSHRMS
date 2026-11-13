import { getDistanceInMeters } from './geofence';

describe('getDistanceInMeters', () => {
  it('returns zero for the same coordinates', () => {
    expect(getDistanceInMeters({ latitude: 10, longitude: 76 }, { latitude: 10, longitude: 76 })).toBe(0);
  });

  it('returns a plausible distance for two nearby coordinates', () => {
    const distance = getDistanceInMeters(
      { latitude: 10, longitude: 76 },
      { latitude: 10.001, longitude: 76 },
    );
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(115);
  });
});
