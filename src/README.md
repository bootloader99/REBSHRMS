# Source layout

The application is organized by responsibility and feature.

- `config/`: environment-specific demo settings such as office geofence and API URL.
- `types/`: shared domain types used by screens, services and persistence.
- `app/`: application entry, providers and navigation.
- `core/`: shared database, API, connectivity and reusable UI infrastructure.
- `features/`: dashboard, attendance and leave feature code.

Intended data flow: Screen → feature hook/use case → service → repository → SQLite or HTTP API.

Business rules should live outside screen components. The SQLite layer is the source of truth for cached data and pending attendance events; the API is authoritative for server-accepted results.
