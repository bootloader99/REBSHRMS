# REBS HRMS – React Native implementation

This repository contains the React Native version of the employee workspace assignment. The assignment permits React Native as an alternative to Flutter for a candidate with React Native experience.

## Current implementation status

The branch contains a working employee workspace prototype:

- A local OP-SQLite database and schema for employees, attendance days/events, leave balances and leave requests.
- A dashboard that reads the employee's attendance from local storage.
- Attendance state-transition and leave-validation rules with unit tests.
- Location permission handling and a 200 m geofence check for attendance actions.
- A persistent attendance event queue with manual and connectivity-triggered synchronization.
- A small Node.js mock HTTP API for employee, attendance and leave data.
- Leave balance, request history, local validation and online submission.

The app still needs device testing, a final UI review, an installable APK and a short demo recording.

## Setup

Use Node.js 22.13 or later and the Android/iOS toolchain required by React Native 0.88.

After pulling the branch, install the newly added native dependencies and update the lockfile:

```sh
npm install
```

Start the mock HTTP API in a separate terminal:

```sh
npm run mock-api
```

The server listens on port 3000 and stores accepted demo data in `mock-api/store.json` (ignored by Git). Delete that file to reset the mock data.

To exercise failure paths, change `mockScenario` in `src/config/appConfig.ts` to one of:

- `success` – normal API responses.
- `slow` – delayed GET responses, exceeding the client timeout.
- `timeout-after-accept` – stores an attendance event, then delays its response. Retrying the same event ID should return the original accepted result instead of creating a duplicate.
- `server-error` – returns HTTP 500.
- `duplicate-conflict` – rejects attendance with HTTP 409.
- `leave-reject` – rejects leave submission with HTTP 422.

For Android:

```sh
npm run android
```

For iOS, install CocoaPods after npm install:

```sh
cd ios && pod install && cd ..
npm run ios
```

Run the current tests with:

```sh
npm test -- --runInBand
```

## Demo configuration

The office coordinates and radius are configured in `src/config/appConfig.ts`:

```ts
office: {
  latitude: YOUR_OFFICE_LATITUDE,
  longitude: YOUR_OFFICE_LONGITUDE,
  allowedRadiusMeters: 200,
},
```

The coordinates currently in the config are temporary demo coordinates, not verified REBS office coordinates. Before a real deployment, replace them with the actual office coordinates. Keep the radius at 200 metres unless the company specifies otherwise.

### Simulating attendance locations on the Android emulator

Reviewers can test the geofence without physically travelling to the configured location:

1. Start the Android emulator and open REBS HRMS.
2. In Android Studio's emulator toolbar, open **Extended Controls** (the three-dot button).
3. Select **Location**.
4. Enter the configured office latitude and longitude, then select **Set Location**. Check-in/check-out should pass the location check.
5. Change the simulated location to a point more than 200 metres away and try again. The app should show the distance and explain that attendance is only allowed within 200 metres.

Use the coordinates in `src/config/appConfig.ts` as the centre point for both tests. The emulator's Location panel changes the GPS position reported to the app; no application code changes are needed between the two tests.

On a physical Android device, use its actual GPS location or an Android mock-location app configured through Developer options. Do not use mock locations for a production attendance system.

The employee record in `src/hooks/useAppController.ts` is sample data. Replace it with the preconfigured employee details supplied for the demonstration.

The Android emulator can access a mock API running on the development machine through `10.0.2.2`. For a physical device, use the USB port-forwarding or LAN-address setup described in the project setup instructions.


## Mock API contract

The app uses the local Node.js HTTP API through the shared `apiRequest()` HTTP client. The mock server is for assignment/demo use only; it does not connect to REBS production services or require production credentials.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/employee/me` | Load the preconfigured demo employee |
| GET | `/attendance?month=YYYY-MM` | Load attendance history; the `month` query is optional |
| POST | `/attendance/events` | Submit a check-in or check-out event |
| GET | `/leave/balance` | Load casual and sick leave balances |
| GET | `/leave/requests` | Load existing leave requests |
| POST | `/leave/requests` | Submit a leave application |

The current app requests `/attendance` without a month filter so the mock API returns the available attendance history; the server also accepts the optional `month=YYYY-MM` filter. This keeps the dashboard/history request simple for the assignment.

The demo employee profile is supplied by the mock API. Office coordinates and the 200 m geofence radius are kept in `src/config/appConfig.ts` because they are app-level attendance configuration in this prototype, rather than employee profile fields returned by `/employee/me`. Replace the temporary coordinates with the actual office coordinates supplied for a real deployment.

Mock behavior is selected with `mockScenario` in `src/config/appConfig.ts` and sent in the `X-Mock-Scenario` request header. The supported scenarios are listed in the Setup section above.

## Architecture

The implementation follows a small feature-based structure and keeps the responsibilities separate:

- **Screen:** renders the employee workspace.
- **Hook:** loads attendance state and exposes screen actions.
- **Service/domain:** applies attendance rules, gets the device location and checks the geofence.
- **Repository:** reads and writes structured records in SQLite.
- **Database:** owns the schema and the single shared OP-SQLite connection.

Attendance records and events are saved in SQLite. A unique database index prevents a second check-in or second check-out event for the same attendance day. The event ID is created once and is intended to remain unchanged for every future server retry.

## Important assumptions and limitations

- The configured company timezone is `Asia/Kolkata`; change it if the assignment environment specifies another timezone.
- The office geofence radius is 200 metres. Device-side location checks improve the user experience but are not a security boundary. A production server must independently validate attendance location and event identity.
- The mock API uses the stable attendance event ID as an idempotency key so retrying after a timeout does not create a second event.
- Background synchronization after the app is terminated is not part of the planned scope.
- The demo employee is sample data, not a real REBS employee record.

## AI-use disclosure

AI assistance was used to help draft and review parts of the implementation, tests, and documentation. The candidate is reviewing the code, integrating it into the project, and is responsible for understanding, validating, and modifying the submitted work.
