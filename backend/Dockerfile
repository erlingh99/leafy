FROM ghcr.io/astral-sh/uv:python3.11-alpine AS base
WORKDIR /app
COPY . .
RUN uv sync

FROM base AS lint
RUN uvx ty check && \
    uvx ruff check

FROM base AS test
RUN uvx pytest
