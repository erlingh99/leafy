# Build frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
COPY ./frontend/ .
RUN npm install && npm run build

# Build backend
FROM ghcr.io/astral-sh/uv:python3.13-alpine AS backend-builder
WORKDIR /app
COPY ./backend/ .
ENV UV_PROJECT_ENVIRONMENT=.venv
RUN uv sync

# Final stage
FROM python:3.13-alpine AS prod

ARG BACKEND_HOST
ARG BACKEND_PORT

ENV BACKEND_HOST=${BACKEND_HOST} \
    BACKEND_PORT=${BACKEND_PORT} \
    PATH="/app/.venv/bin:$PATH"

COPY --from=backend-builder /app/.venv /app/.venv

WORKDIR /app

# Copy backend files
COPY ./backend ./backend
# Copy frontend build
COPY --from=frontend-builder /app/dist ./frontend/dist

RUN apk update && apk add curl
# Install tzdata (time zone database)
RUN apk add --no-cache tzdata
# Set the desired time zone
ENV TZ=Europe/Berlin

HEALTHCHECK --interval=5m --timeout=30s --start-period=5s --retries=3 \
    CMD curl "http://localhost:${BACKEND_PORT}/api/health"

WORKDIR /app/backend
CMD uvicorn app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
