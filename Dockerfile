# Build frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json ./
COPY ./frontend/ .
RUN npm install && npm run build

# Build backend
FROM python:3.13-alpine AS backend-builder
WORKDIR /app
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY ./backend/requirements.txt .
RUN python -m pip install -U pip && \
    python -m pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.13-alpine AS prod

ARG BACKEND_HOST
ARG BACKEND_PORT

ENV BACKEND_HOST=${BACKEND_HOST} \
    BACKEND_PORT=${BACKEND_PORT} \
    PATH="/venv/bin:$PATH"

COPY --from=backend-builder /venv /venv

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

WORKDIR /app/backend
CMD uvicorn app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
