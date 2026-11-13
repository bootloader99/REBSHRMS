# REBS HRMS

This is my React Native implementation of the REBS HRMS assignment.

## Features

- Employee dashboard with attendance, leave balance and recent records.
- Check-in and check-out with location check (200 metre limit).
- Attendance is saved locally when offline and can sync later.
- Apply for casual or sick leave.
- View leave requests and their status.

## Project structure

- `src/screens` – app screens
- `src/features` – attendance and leave code
- `src/database` – SQLite database and repositories
- `src/core/api` – API client
- `mock-api` – local mock server

The app uses SQLite for local data. The screens use hooks and services to work with the database and API.

## Run the project

Install the packages:

```sh
npm install
```

Start the mock API in another terminal:

```sh
npm run mock-api
```

Run the Android app:

```sh
npm run android
```

For iOS, run `pod install` inside the `ios` folder, then run:

```sh
npm run ios
```

The mock API runs on port 3000. The API address can be changed in `src/config/appConfig.ts`.

For a physical Android phone connected over USB, use:

```sh
adb reverse tcp:3000 tcp:3000
```

For the Android emulator, the API address should be `http://10.0.2.2:3000`.

## Mock API

The mock server is included in this repository and runs separately from the app. It provides employee, attendance and leave data. Its data is saved in `mock-api/store.json`.

You can change `mockScenario` in `src/config/appConfig.ts` to try different responses:

- `success`
- `slow`
- `timeout-after-accept`
- `server-error`
- `duplicate-conflict`
- `leave-reject`

## Assumptions and limitations

- The app uses one demo employee. Login is not included.
- Company timezone is set to `Asia/Kolkata`.
- The office coordinates in the config are temporary demo coordinates and should be replaced with the actual office location.
- Attendance sync happens when the app is open and connected. Background sync after closing the app is not included.
- The location is checked in the app. A real server should also validate attendance location and prevent duplicate events.
- The mock API is only for this assignment; it is not connected to REBS systems.

## Tests

Run the tests with:

```sh
npm test -- --runInBand
```

## Time spent

4 hours and 30 minutes.
