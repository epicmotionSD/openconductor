#!/usr/bin/env node

import { writeFile } from 'fs/promises';

const DEFAULT_BASE_URL = 'https://openconductor.ai/api/v1';
const baseUrl = (process.env.OPENCONDUCTOR_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const outputPath = process.env.AUDIT_OUTPUT || 'registry-audit.json';
const maxTotal = Number.parseInt(process.env.AUDIT_LIMIT || '100', 10);
const pageSize = Number.parseInt(process.env.AUDIT_PAGE_SIZE || '100', 10);
const requestTimeoutMs = Number.parseInt(process.env.AUDIT_TIMEOUT_MS || '20000', 10);
const progressEvery = Number.parseInt(process.env.AUDIT_PROGRESS_EVERY || '25', 10);
const debugSample = process.env.AUDIT_DEBUG_SAMPLE === '1';

function getNumberOrDefault(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const safeMaxTotal = Math.max(1, getNumberOrDefault(maxTotal, 100));
const safePageSize = Math.max(1, getNumberOrDefault(pageSize, 100));
const safeTimeoutMs = getNumberOrDefault(requestTimeoutMs, 20000);
const safeProgressEvery = getNumberOrDefault(progressEvery, 25);

if (typeof fetch !== 'function') {
  console.error(
    'Registry audit failed: global fetch is not available. Use Node 18+ or set NODE_OPTIONS=--experimental-fetch.'
  );
  process.exit(1);
}

function unwrapResponse(payload) {
  if (payload && payload.success && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function getInstallMethod(server) {
  const installation = server?.installation || {};
  const hasNpm = Boolean(server?.packages?.npm?.name || installation.npm);
  const hasDocker = Boolean(server?.packages?.docker?.image || installation.docker);
  const hasManual = Boolean(installation.manual);

  if (hasNpm) return 'npm';
  if (hasDocker) return 'docker';
  if (hasManual) return 'manual';
  return null;
}

function unwrapServerDetail(payload, slug) {
  const data = unwrapResponse(payload);
  if (Array.isArray(data)) {
    return data.find((item) => item?.slug === slug) || data[0] || null;
  }
  if (data?.servers && Array.isArray(data.servers)) {
    return data.servers.find((item) => item?.slug === slug) || data.servers[0] || null;
  }
  return data;
}

function getServerSummary(server) {
  return {
    id: server.id,
    slug: server.slug,
    name: server.name,
    category: server.category,
    repositoryUrl: server.repository?.url,
    npmPackage: server.packages?.npm?.name,
    dockerImage: server.packages?.docker?.image,
    installCommand: server.installation?.npm || null
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), safeTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${safeTimeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRetry(url, attempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
      console.warn(
        `Request attempt ${attempt} failed: ${error?.message || error}. ${attempt < attempts ? 'Retrying...' : ''}`
      );
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  throw lastError;
}

async function listServers() {
  const all = [];
  let offset = 0;
  let total = null;
  let loggedSample = false;

  while (all.length < safeMaxTotal) {
    const remaining = safeMaxTotal - all.length;
    const pageLimit = Math.min(safePageSize, remaining);
    const url = `${baseUrl}/servers?limit=${pageLimit}&offset=${offset}`;
    console.log(`Fetching servers page (offset ${offset})...`);
    const payload = await fetchJsonWithRetry(url);
    const data = unwrapResponse(payload);
    const servers = Array.isArray(data) ? data : data.servers || [];
    const meta = payload.meta || {};

    if (debugSample && !loggedSample) {
      console.log('Sample server payload:', JSON.stringify(servers[0] ?? null, null, 2));
      loggedSample = true;
    }

    all.push(...servers);

    if (total === null && typeof meta.total === 'number') {
      total = meta.total;
    }

    if (servers.length < pageLimit) {
      break;
    }

    offset += pageLimit;
    if (total !== null && offset >= total) {
      break;
    }
  }

  return all;
}

async function audit() {
  console.log('Starting registry audit...');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Max servers to audit: ${safeMaxTotal}`);
  console.log(`  Page size: ${safePageSize}`);
  console.log(`  Request timeout: ${safeTimeoutMs}ms`);

  const servers = await listServers();
  console.log(`Fetched ${servers.length} servers. Auditing install methods...`);
  const missingInstall = [];
  const withInstall = [];

  for (let index = 0; index < servers.length; index += 1) {
    const server = servers[index];
    let method = getInstallMethod(server);
    let detail = server;

    if (!method) {
      try {
        const detailPayload = await fetchJsonWithRetry(
          `${baseUrl}/servers/${encodeURIComponent(server.slug)}`
        );
        detail = unwrapServerDetail(detailPayload, server.slug) || detail;
        method = getInstallMethod(detail);
      } catch (error) {
        method = null;
      }
    }

    if (!method) {
      missingInstall.push(getServerSummary(detail));
    } else {
      withInstall.push({
        ...getServerSummary(detail),
        installMethod: method
      });
    }

    if ((index + 1) % safeProgressEvery === 0 || index === servers.length - 1) {
      console.log(`  Audited ${index + 1}/${servers.length} servers...`);
    }
  }

  const summary = {
    baseUrl,
    totalServers: servers.length,
    withInstall: withInstall.length,
    missingInstall: missingInstall.length
  };

  const report = {
    summary,
    missingInstall,
    withInstall
  };

  await writeFile(outputPath, JSON.stringify(report, null, 2));

  console.log('Registry audit complete.');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Total servers: ${summary.totalServers}`);
  console.log(`  With install method: ${summary.withInstall}`);
  console.log(`  Missing install method: ${summary.missingInstall}`);
  console.log(`  Output: ${outputPath}`);
}

audit().catch((error) => {
  if (error?.stack) {
    console.error('Registry audit failed:', error.stack);
  } else {
    console.error('Registry audit failed:', error);
  }
  process.exit(1);
});
