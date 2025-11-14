import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

// NOTE: NEXT_PUBLIC_OTEL_COLLECTOR_URL should be set in env for production collectors
const collectorUrl = process.env.NEXT_PUBLIC_OTEL_COLLECTOR_URL || 'http://localhost:4318/v1/traces';

const exporter = new OTLPTraceExporter({ url: collectorUrl });
const provider = new WebTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [/.*/],
    }),
    new XMLHttpRequestInstrumentation(),
  ],
});

console.log('[tracing] Web tracing initialized', { collectorUrl });
