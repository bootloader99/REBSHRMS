# REBS HRMS

This assignment was given for Flutter. I have implemented it in React Native instead, based on my React Native experience.

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

Make sure you have Node.js, the Android Studio/Android SDK setup and a connected Android device or emulator. This project uses React Native, so it needs the React Native development setup rather than Flutter.

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

For iOS, you will also need a Mac with Xcode and CocoaPods. Run `pod install` inside the `ios` folder, then run:

```sh
npm run ios
```

## Mock API

The mock API is a local server. It is not hosted online and is not included in the APK, so it must be started separately on a computer to use online features such as loading dashboard data and submitting leave requests.

The phone/emulator running the app must be able to reach the computer running the mock API:

- **Physical Android phone over USB:** The default API address is `http://127.0.0.1:3000`. Connect the phone with USB debugging enabled and run `adb reverse tcp:3000 tcp:3000` on the computer.
- **Physical Android phone over Wi-Fi:** Connect both the phone and computer to the same Wi-Fi network. Set `api.baseUrl` in `src/config/appConfig.ts` to the computer's local IPv4 address, for example `http://192.168.1.5:3000`. Allow Node.js through the computer's firewall if needed, then rebuild the APK with this address.
- **Android emulator:** Use `http://10.0.2.2:3000` as the API address.

The APK uses the API address that was set when it was built. An APK configured with `127.0.0.1` will not connect to a computer over Wi-Fi unless USB port forwarding is set up with `adb reverse`.

The mock server runs on port 3000. Its data is saved in `mock-api/store.json`.

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
- Attendance can be recorded offline and synced when the API is reachable. Background sync after closing the app is not included.
- Previously loaded leave requests can be viewed offline, but submitting a new leave request requires a connection to the mock API.
- The location is checked in the app. A real server should also validate attendance location and prevent duplicate events.
- The mock API is only for this assignment; it is not connected to REBS systems.

## Tests

Run the tests with:

```sh
npm test -- --runInBand
```

## Time spent

4 hours and 30 minutes.
