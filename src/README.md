# Source layout

The project keeps database access in one place and groups business logic by feature.

- `database/`: SQLite connection, schema and repositories.
- `features/attendance/`: attendance rules, location, recording and synchronization.
- `features/leave/`: leave rules, request submission and screen state.
- `core/api/`: the HTTP client used by the app.
- `core/date/`: company-timezone date helpers.
- `hooks/useAppController.ts`: coordinates startup, connectivity and feature hooks.
- `config/` and `types/`: app settings and shared data types.
- `App.tsx`: renders the three workspace tabs.

Data flow: App → app controller → feature hook/service → database repository or HTTP API.
