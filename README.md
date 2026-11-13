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

Before trying check-in or check-out, set the office coordinates in `src/config/appConfig.ts`:

```ts
office: {
  latitude: YOUR_OFFICE_LATITUDE,
  longitude: YOUR_OFFICE_LONGITUDE,
  allowedRadiusMeters: 200,
},
```

The coordinates are intentionally left unset because the assignment material does not provide an office address or GPS coordinates. Attendance actions show a configuration message until real demo coordinates are supplied.

The employee record in `App.tsx` is clearly marked sample data. Replace it with the preconfigured employee details supplied for the demonstration.

The Android emulator can access a mock API running on the development machine through `10.0.2.2`. For a physical device, change the API base URL to the development machine's LAN address.

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
