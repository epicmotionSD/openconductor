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
  // Some SDK versions return void, others return a Promise. Cast to `any` first
  // to avoid testing a value that could be typed as `void`.
  const _maybePromise: any = startResult as any;
  if (_maybePromise && typeof _maybePromise.then === 'function') {
    _maybePromise
      .then(() => console.log('[tracing] OpenTelemetry initialized', { endpoint: otelEndpoint }))
      .catch((err: any) => console.warn('[tracing] Failed to initialize OpenTelemetry', err?.message || err));
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
    const _maybeShutdown: any = shutdownResult as any;
    if (_maybeShutdown && typeof _maybeShutdown.then === 'function') {
      _maybeShutdown
        .then(() => console.log('[tracing] OpenTelemetry shutdown complete'))
        .catch((e: any) => console.warn('[tracing] Shutdown error', e));
    } else {
      console.log('[tracing] OpenTelemetry shutdown (sync)');
    }
  } catch (e) {
    console.warn('[tracing] Shutdown error', e);
  }
});
