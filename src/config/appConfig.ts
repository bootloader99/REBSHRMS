
export const appConfig = {
  companyTimeZone: 'Asia/Kolkata',
  office: {
    latitude: 10.025821,
    longitude: 76.435891,
    allowedRadiusMeters: 200,
  },
  api: {
    // Android emulator can reach the host machine through 10.0.2.2.
    baseUrl: 'http://127.0.0.1:3000',
    timeoutMs: 10000,
    mockScenario: 'success',
  },
} as const;
