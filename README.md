# REBS HRMS

A small React Native employee workspace built for the REBS HRMS assignment. It uses a local SQLite database and a Node.js mock API, so the main flows can be tried without a real backend.

## Features

- **Dashboard:** employee details, today's attendance, working duration, leave balance and the latest five attendance records.
- **Attendance:** check-in and check-out with timestamp and location. Attendance is allowed only within 200 metres of the configured office location.
- **Offline attendance:** attendance events are saved on the device and marked Pending Sync, Synced or Rejected. They can be synced manually or when the app reconnects.
- **Leave:** casual and sick leave requests, with date, balance, reason and overlapping-request validation.
- **Error states:** handles offline access, location permission problems, unavailable location, API errors, timeouts and server-side rejections.

## How it is organised

The code is kept fairly simple:

- `src/screens` contains the three screens.
- `src/features` contains attendance and leave rules, hooks and services.
- `src/database` contains the SQLite schema and repositories.
- `src/core/api` contains the shared HTTP client.
- `mock-api` contains the local API server.

Screens use hooks and services rather than calling the database or API directly. SQLite keeps the employee data, attendance history, pending attendance events and leave data on the device.

## Setup

You need Node.js 22.13 or later and the normal React Native Android/iOS development tools.

Install dependencies:

```sh
npm install
```

Start the mock API in a separate terminal:

```sh
npm run mock-api
```

It runs on port `3000`. The server saves its demo data in `mock-api/store.json`, which is generated locally and ignored by Git. Delete that file to reset the mock server data.

For Android:

```sh
npm run android
```

For iOS:

```sh
cd ios
pod install
cd ..
npm run ios
```

The API URL is in `src/config/appConfig.ts`. It is currently set to `http://127.0.0.1:3000` for the USB `adb reverse` setup. For a connected Android phone, run:

```sh
adb reverse tcp:3000 tcp:3000
```

For an Android emulator, use `http://10.0.2.2:3000`. For a physical device without USB forwarding, use your computer's LAN IP address and make sure both devices are on the same network.

## Mock API

The mock server is part of this repository and runs separately from the mobile app. It provides these endpoints:

| Method | Endpoint | Use |
| --- | --- | --- |
| GET | `/employee/me` | Demo employee |
| GET | `/attendance` | Attendance history |
| POST | `/attendance/events` | Check-in/check-out event |
| GET | `/leave/balance` | Leave balances |
| GET | `/leave/requests` | Leave requests |
| POST | `/leave/requests` | Submit a leave request |

The server supports a few test scenarios. Change `mockScenario` in `src/config/appConfig.ts`:

- `success` – normal responses.
- `slow` – delayed responses.
- `timeout-after-accept` – accepts an attendance event but delays the response, so the app can retry it.
- `server-error` – returns a server error.
- `duplicate-conflict` – returns an attendance conflict.
- `leave-reject` – rejects a leave request.

## Assumptions

- There is one preconfigured demo employee. Login is not included.
- The company timezone is set to `Asia/Kolkata`.
- The geofence radius is 200 metres.
- The office coordinates in `src/config/appConfig.ts` are temporary demo coordinates. They should be replaced with the actual office location if used outside this assignment.
- The mock API represents the server. It is not connected to REBS systems and does not use production credentials.

## Limitations

- Attendance is stored offline and syncs when the app is open and connected. Background sync after the app is terminated is not included.
- The app checks the location on the device. A real backend must also validate the location, employee, event order and duplicate submissions.
- The mock API and its local data are only for development and demonstration.
- A production login, real HRMS integration and deployment setup are outside this assignment.

## Tests

Run the available tests with:

```sh
npm test -- --runInBand
```

## Time spent

4 hours and 30 minutes.

