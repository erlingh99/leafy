FROM python:3.13-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS lint
RUN pip install --no-cache-dir mypy ruff
COPY . .
RUN mypy app/ && \
    ruff check .

FROM base AS test
RUN pip install --no-cache-dir pytest
COPY . .
RUN pytest
