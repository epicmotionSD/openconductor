import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Enable diagnostic logging when OTEL_DEBUG=true
if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

const exporter = new OTLPTraceExporter({ url: otelEndpoint });

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

try {
  const startResult = sdk.start();
  if (startResult && typeof (startResult as any).then === 'function') {
    (startResult as Promise<void>)
      .then(() => console.log('[tracing] OpenTelemetry initialized', { endpoint: otelEndpoint }))
      .catch((err) => console.warn('[tracing] Failed to initialize OpenTelemetry', err?.message || err));
  } else {
    // SDK start may be synchronous for some versions
    console.log('[tracing] OpenTelemetry initialized (sync)', { endpoint: otelEndpoint });
  }
} catch (err) {
  console.warn('[tracing] Failed to initialize OpenTelemetry', (err as any)?.message || err);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  try {
    const shutdownResult = sdk.shutdown();
    if (shutdownResult && typeof (shutdownResult as any).then === 'function') {
      (shutdownResult as Promise<void>)
        .then(() => console.log('[tracing] OpenTelemetry shutdown complete'))
        .catch((e) => console.warn('[tracing] Shutdown error', e));
    } else {
      console.log('[tracing] OpenTelemetry shutdown (sync)');
    }
  } catch (e) {
    console.warn('[tracing] Shutdown error', e);
  }
});
