# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leafy is a houseplant tracking app ("Leafy lapse") with three components:

- `backend/` — FastAPI service (Python, uv) storing plants/species/sensors in SQLite, enriching plant data via the Perenual API, sending watering-reminder emails via Brevo, and serving the built frontend.
- `frontend/` — React 19 + Vite + Tailwind + shadcn/radix UI, with i18n (`src/translations/`, currently `en-US`/`sv-SE`) and an MSW mock mode (`npm run dev:mock`, backed by `src/mocks/`) for developing against the UI without a live backend.
- `embedded/` — MicroPython firmware for an ESP32 capacitive soil-moisture sensor. Not part of the Docker build; flashed and configured independently per `embedded/README.md`.

The root multi-stage `Dockerfile` builds frontend + backend into one production image (`FRONTEND_DIST` in `backend/app/config.py` points the backend at the built frontend assets).

## Common Commands

### Backend (`backend/`)
```bash
uv sync --group dev
uv run uvicorn app.main:app --reload
uv run pytest
uv run pytest tests/test_plant_api.py -k some_test   # single test
uv run ruff check
uv run ty check
```
Alembic migrations live in `backend/migrations/versions/`; `init_db()` (`app/database/setup.py`) runs `alembic upgrade head` automatically on startup.

### Frontend (`frontend/`)
```bash
npm ci
npm run dev          # against a real backend
npm run dev:mock      # against MSW mocks in src/mocks/ — no backend needed
npm run build
npm run check          # tsc --noEmit
npm run lint
npm run test           # vitest run
```

### Embedded (`embedded/`)
Python/MicroPython tooling via uv, but checked with `ruff`/`ty` like a normal Python project (no on-device test runner):
```bash
uv sync --group dev --no-install-project
uv run ruff check
uv run ty check
```
Config is generated, not hand-edited: copy `.env.example` to `.env`, fill in WiFi/server/sensor values, then run `python generate_config.py` to produce `config.py`. Only `boot.py`, `main.py`, and `config.py` get uploaded to the device (via `mpremote`) — never `.env`.

### Full stack
```bash
docker compose up -d --build
```

## Architecture Notes

**Sensor data flow is push-based, opposite of a typical polling sensor**: the ESP32 (`embedded/main.py`) POSTs moisture readings to `backend`'s `/api/moisture` on a timer (`READING_INTERVAL_SECONDS`, default 5 min), self-registering first via `/api/sensors/register`. Sensors are matched to plants by a user-chosen `SENSOR_ID` string, entered both in the sensor's `.env` and the Leafy frontend's plant "Sensor ID" field — the assignment itself is a separate DB row (`SensorAssignment`) managed via `assignment_router` in `app/routes/sensor_api.py`, decoupled from the sensor's own registration record.

**Calibration uses a live side-channel, not the main HTTP flow**: each ESP32 also runs a small TCP "calibration server" (`embedded/calibration_server.py`) on `SENSOR_CALIBRATION_PORT`. The backend's `/api/sensors/{id}/calibrate/stream` opens a TCP connection to `leafy-{sensor_id}.{SENSOR_LAN_DOMAIN}` and relays readings to the frontend as SSE; `/api/sensors/{id}/calibrate` then pushes new `adc_dry`/`adc_wet` values down that same TCP connection and persists them to the DB. Only one calibration stream per sensor is allowed at a time (tracked in `_sensor_connections`/`_sensor_locks` module-level dicts in `sensor_api.py`).

**Species enrichment is external and best-effort**: `app/services/perenual.py` wraps the Perenual Plant API (species search → details → care guide) to enrich a plant's species metadata and to seed USDA hardiness zone map overlays into the DB on first startup (see `lifespan` in `app/main.py`). It no-ops gracefully if `PERENUAL_API_KEY` isn't set.

**Email reminders are optional and schedule-driven**: `app/services/mail_service.py` (via Brevo) is wired into an `AsyncIOScheduler` cron job (daily at 12:00, `app/main.py`) that only starts if both `BREVO_API_KEY` and `SENDER_EMAIL` are configured — check `app/config.py` for how these are read from the environment before assuming reminder logic is active.

**Backend layering** mirrors the alarmy sibling project: `routes/` → Pydantic models (`models/`) → SQLAlchemy models (`database/models.py`), with `database/interaction.py`-style functions imported into routes doing the actual queries (see the `db_*` aliased imports at the top of `sensor_api.py` for the pattern). `PlantResponse` exposes `image_url`/`thumbnail_url` rather than raw bytes — images are served from dedicated endpoints, not inlined in JSON.

## CI (`.github/workflows/`)

- `pr-checks.yml`: backend (`ty check`, `ruff check`, `pytest`), frontend (`tsc`, `eslint`, `vitest`), and embedded (`ruff check`, `ty check` only — no on-device tests) run independently.
- `deploy.yml`: on push to `main`, builds+pushes the arm64 Docker image to GHCR, then SSHes over Tailscale to the `leafy` staging environment and runs `scripts/restart.sh`.
