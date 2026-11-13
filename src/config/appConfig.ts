/**
 * Demo configuration.
 *
 * Replace the office coordinates and timezone with values supplied by the
 * assignment environment before testing geofence behaviour. Coordinates are
 * intentionally not fabricated.
 */
export const appConfig = {
  companyTimeZone: 'Asia/Kolkata',
  office: {
    latitude: null as number | null,
    longitude: null as number | null,
    allowedRadiusMeters: 200,
  },
  api: {
    // Android emulator can reach the host machine through 10.0.2.2.
    baseUrl: 'http://10.0.2.2:3000',
    timeoutMs: 10000,
    // Change to slow, timeout-after-accept, server-error or duplicate-conflict to test sync failures.
    mockScenario: 'success',
  },
} as const;
