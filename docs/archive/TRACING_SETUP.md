# Tracing Setup (OpenConductor)

This repository includes minimal OpenTelemetry tracing scaffolding for both the API server and the frontend.

What was added

- `packages/api/src/tracing.ts` — Node tracing initializer using `@opentelemetry/sdk-node` with OTLP HTTP exporter.
- `packages/frontend/src/lib/tracing-web.ts` — Web tracing initializer using `@opentelemetry/sdk-trace-web` and instruments `fetch`/`XMLHttpRequest`.

Environment variables

- `OTEL_EXPORTER_OTLP_ENDPOINT` (optional) — URL for backend OTLP collector (default: `http://localhost:4318/v1/traces`).
- `OTEL_DEBUG=true` (optional) — enable OpenTelemetry debug logs for backend.
- `NEXT_PUBLIC_OTEL_COLLECTOR_URL` (optional) — URL for frontend OTLP collector (default: `http://localhost:4318/v1/traces`).

Local testing

1. Start a local collector/trace viewer. The AI Toolkit traces viewer uses OTLP on `http://localhost:4318`.

2. From repo root, install workspace dependencies (pnpm recommended):

```bash
pnpm install --no-frozen-lockfile
```

3. Start API (example):

```bash
# run the simple API server that starts immediately
pnpm --filter @openconductor/api run dev
```

4. Start frontend (example):

```bash
pnpm --filter @openconductor/frontend run dev
```

Notes

- This is a minimal, non-production configuration intended to give you working traces quickly. For production, configure batching, authentication to collectors (OTLP headers), and appropriate sampling.
- If you want a hosted backend (Honeycomb, Lightstep, Datadog, etc.), set `OTEL_EXPORTER_OTLP_ENDPOINT` / `NEXT_PUBLIC_OTEL_COLLECTOR_URL` to the vendor OTLP endpoint and provide required headers.