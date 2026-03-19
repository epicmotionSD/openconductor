#!/usr/bin/env node
/**
 * OpenConductor Command Center — Local MVP
 * Zero dependencies. Pure Node.js.
 * Run: node tools/command-center/server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./lib/store');
const { queryContent } = require('./lib/search');
const { detectType, parseImport, parseMultiImport } = require('./lib/parser');

const PORT = 3333;
const ROOT = path.resolve(__dirname, '..', '..');
const CHECKLIST_PATH = path.join(ROOT, 'docs', 'launch', 'GTC-2026-LAUNCH-CHECKLIST.md');
const ICS_PATH = path.join(ROOT, 'docs', 'launch', 'openconductor-launch-schedule.ics');

// --- Parse checklist markdown ---
function parseChecklist() {
  if (!fs.existsSync(CHECKLIST_PATH)) return { sections: [], doneCount: 0, totalCount: 0 };
  const md = fs.readFileSync(CHECKLIST_PATH, 'utf-8');
  const lines = md.split('\n');
  const sections = [];
  let currentSection = null;
  let doneCount = 0;
  let totalCount = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = { title: line.replace('## ', ''), items: [] };
      sections.push(currentSection);
    } else if (line.startsWith('### ') && currentSection) {
      currentSection.items.push({ type: 'heading', text: line.replace('### ', '') });
    } else if (/^\s*- \[[ x]\]/.test(line) && currentSection) {
      const done = /- \[x\]/i.test(line);
      const text = line.replace(/^\s*- \[[ x]\]\s*/i, '').trim();
      const indent = (line.match(/^\s*/) || [''])[0].length;
      currentSection.items.push({ type: 'task', text, done, indent });
      totalCount++;
      if (done) doneCount++;
    } else if (line.startsWith('- **') && currentSection) {
      currentSection.items.push({ type: 'note', text: line.replace(/^- /, '') });
    }
  }
  return { sections, doneCount, totalCount };
}

// --- Parse .ics file ---
function parseICS() {
  if (!fs.existsSync(ICS_PATH)) return [];
  const ics = fs.readFileSync(ICS_PATH, 'utf-8');
  const events = [];
  const eventBlocks = ics.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const get = (key) => {
      const match = block.match(new RegExp(`${key}[^:]*:(.+)`));
      return match ? match[1].trim() : '';
    };
    const dtRaw = get('DTSTART');
    // Parse 20260318T090000
    const m = dtRaw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
    let date = null;
    if (m) {
      date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    }
    events.push({
      summary: get('SUMMARY'),
      description: get('DESCRIPTION').replace(/\\n/g, '\n'),
      location: get('LOCATION'),
      date,
      dateStr: date ? date.toISOString().split('T')[0] : '',
      timeStr: date ? `${m[4]}:${m[5]}` : '',
      priority: parseInt(get('PRIORITY')) || 3,
    });
  }
  events.sort((a, b) => (a.date || 0) - (b.date || 0));
  return events;
}

// --- Build dashboard HTML ---
function buildDashboard() {
  const { sections, doneCount, totalCount } = parseChecklist();
  const events = parseICS();
  const contentItems = store.getAllItems().filter(i => i.status !== 'archived');
  const contentStats = store.getStats();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.dateStr === todayStr);
  const upcomingEvents = events.filter(e => e.date && e.date > now).slice(0, 10);
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Group events by date for timeline
  const eventsByDate = {};
  for (const e of events) {
    if (!eventsByDate[e.dateStr]) eventsByDate[e.dateStr] = [];
    eventsByDate[e.dateStr].push(e);
  }

  const keyLinks = [
    { label: 'npm package', url: 'https://www.npmjs.com/package/@openconductor/openclaw-trust-stack', icon: '📦' },
    { label: 'GitHub repo', url: 'https://github.com/epicmotionSD/openconductor', icon: '🐙' },
    { label: 'Blog (dev.to)', url: 'https://dev.to/epicmotionsd/jensen-is-right-every-company-needs-an-openclaw-strategy-heres-what-he-didnt-say-4l4p', icon: '✍️' },
    { label: 'Site blog', url: 'https://openconductor.ai/blog', icon: '🌐' },
    { label: 'Contract (Sepolia)', url: 'https://sepolia.basescan.org/address/0xf8d7044d657b602194fb5745c614beb35d5d898a', icon: '⛓️' },
    { label: 'OpenClaw repo', url: 'https://github.com/openclaw/openclaw', icon: '🦞' },
    { label: 'OpenClaw Discord', url: 'https://discord.gg/qkhbAGHRBT', icon: '💬' },
    { label: '@steipete (X)', url: 'https://x.com/steipete', icon: '🐦' },
  ];

  // Render checklist sections
  let checklistHTML = '';
  for (const section of sections) {
    checklistHTML += `<div class="section">
      <h3 class="section-title">${esc(section.title)}</h3>`;
    for (const item of section.items) {
      if (item.type === 'heading') {
        checklistHTML += `<h4 class="subsection">${esc(item.text)}</h4>`;
      } else if (item.type === 'task') {
        const cls = item.done ? 'task done' : 'task';
        const indent = item.indent > 2 ? ' style="margin-left:24px"' : '';
        checklistHTML += `<div class="${cls}"${indent}>
          <span class="check">${item.done ? '✅' : '⬜'}</span>
          <span>${esc(item.text)}</span>
        </div>`;
      } else if (item.type === 'note') {
        checklistHTML += `<div class="note">${esc(item.text)}</div>`;
      }
    }
    checklistHTML += '</div>';
  }

  // Today events
  let todayHTML = '';
  if (todayEvents.length === 0) {
    todayHTML = '<p class="empty">No events scheduled for today.</p>';
  } else {
    for (const e of todayEvents) {
      todayHTML += `<div class="event p${e.priority}">
        <div class="event-time">${esc(e.timeStr)}</div>
        <div class="event-body">
          <div class="event-title">${esc(e.summary)}</div>
          <div class="event-desc">${esc(e.description).replace(/\n/g, '<br>')}</div>
          ${e.location ? `<a class="event-link" href="${esc(e.location)}" target="_blank">${esc(e.location)}</a>` : ''}
        </div>
      </div>`;
    }
  }

  // Upcoming
  let upcomingHTML = '';
  let lastDate = '';
  for (const e of upcomingEvents) {
    if (e.dateStr !== lastDate) {
      const d = e.date;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      upcomingHTML += `<div class="date-divider">${dayName}</div>`;
      lastDate = e.dateStr;
    }
    upcomingHTML += `<div class="event-compact p${e.priority}">
      <span class="event-time-sm">${esc(e.timeStr)}</span>
      <span class="event-title-sm">${esc(e.summary)}</span>
    </div>`;
  }

  // Timeline (full 30 days)
  let timelineHTML = '';
  const dates = Object.keys(eventsByDate).sort();
  for (const dateStr of dates) {
    const d = new Date(dateStr + 'T12:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const cls = isToday ? 'tl-day today' : isPast ? 'tl-day past' : 'tl-day future';
    timelineHTML += `<div class="${cls}">
      <div class="tl-date">${dayLabel}${isToday ? ' <span class="badge">TODAY</span>' : ''}</div>
      <div class="tl-events">`;
    for (const e of eventsByDate[dateStr]) {
      timelineHTML += `<div class="tl-event p${e.priority}"><span class="tl-time">${esc(e.timeStr)}</span> ${esc(e.summary)}</div>`;
    }
    timelineHTML += '</div></div>';
  }

  // Key links
  let linksHTML = '';
  for (const l of keyLinks) {
    linksHTML += `<a class="quicklink" href="${esc(l.url)}" target="_blank">
      <span class="ql-icon">${l.icon}</span>
      <span class="ql-label">${esc(l.label)}</span>
    </a>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenConductor Command Center</title>
<style>
  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a28;
    --border: #2a2a3d;
    --text: #e4e4ed;
    --text2: #9898b0;
    --purple: #8B5CF6;
    --purple-dim: rgba(139,92,246,0.15);
    --green: #22c55e;
    --green-dim: rgba(34,197,94,0.15);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.15);
    --red: #ef4444;
    --red-dim: rgba(239,68,68,0.15);
    --radius: 12px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
  }
  .header {
    background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.03) 100%);
    border-bottom: 1px solid var(--border);
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }
  .header h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #fff 0%, var(--purple) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .header-meta { display: flex; gap: 16px; align-items: center; }
  .header-meta .date { color: var(--text2); font-size: 14px; }
  .progress-ring {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 50px;
    padding: 8px 20px 8px 12px;
  }
  .progress-bar-bg {
    width: 120px; height: 8px;
    background: var(--surface2); border-radius: 4px; overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--purple), var(--green));
    transition: width 0.6s ease;
  }
  .progress-label { font-size: 13px; color: var(--text2); font-weight: 600; }
  .progress-label b { color: var(--text); }

  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 1px;
    background: var(--border);
    max-width: 1600px;
    margin: 0 auto;
  }
  .panel {
    background: var(--bg);
    padding: 24px;
    overflow-y: auto;
  }
  .panel-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
  }
  .panel-title .icon { font-size: 20px; }

  /* Today */
  .event { display: flex; gap: 16px; padding: 14px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); margin-bottom: 10px; }
  .event.p1 { border-left: 3px solid var(--red); }
  .event.p2 { border-left: 3px solid var(--amber); }
  .event.p3 { border-left: 3px solid var(--border); }
  .event-time { font-size: 14px; font-weight: 700; color: var(--purple);
    min-width: 50px; padding-top: 2px; }
  .event-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .event-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }
  .event-link { font-size: 12px; color: var(--purple); text-decoration: none;
    margin-top: 6px; display: inline-block; }
  .event-link:hover { text-decoration: underline; }
  .empty { color: var(--text2); font-style: italic; }

  /* Upcoming */
  .date-divider {
    font-size: 12px; font-weight: 700; color: var(--purple);
    text-transform: uppercase; letter-spacing: 0.05em;
    margin: 16px 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
  }
  .date-divider:first-child { margin-top: 0; }
  .event-compact { display: flex; gap: 12px; padding: 8px 10px; border-radius: 8px;
    margin-bottom: 4px; font-size: 13px; }
  .event-compact:hover { background: var(--surface); }
  .event-compact.p1 .event-title-sm { color: var(--text); font-weight: 600; }
  .event-compact.p2 .event-title-sm { color: var(--text); }
  .event-compact.p3 .event-title-sm { color: var(--text2); }
  .event-time-sm { color: var(--purple); font-weight: 600; min-width: 44px; }
  .event-title-sm { flex: 1; }

  /* Quick links */
  .quicklinks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .quicklink {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border);
    text-decoration: none; color: var(--text);
    transition: all 0.15s;
    font-size: 13px;
  }
  .quicklink:hover { border-color: var(--purple); background: var(--purple-dim); }
  .ql-icon { font-size: 18px; }
  .ql-label { font-weight: 500; }

  /* Checklist */
  .checklist-panel { grid-column: 1 / -1; }
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 15px; font-weight: 700;
    color: var(--purple); margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 1px solid var(--border);
  }
  .subsection { font-size: 14px; font-weight: 600; color: var(--text);
    margin: 12px 0 6px; }
  .task {
    display: flex; align-items: baseline; gap: 8px;
    padding: 5px 8px; border-radius: 6px; font-size: 13px;
    color: var(--text);
  }
  .task:hover { background: var(--surface); }
  .task.done { color: var(--text2); text-decoration: line-through; }
  .task .check { font-size: 14px; flex-shrink: 0; }
  .note { font-size: 12px; color: var(--text2); padding: 4px 8px 4px 32px; }

  /* Timeline */
  .timeline-panel { grid-column: 1 / -1; }
  .tl-day { display: flex; gap: 20px; padding: 10px 0;
    border-bottom: 1px solid var(--border); }
  .tl-day.past { opacity: 0.45; }
  .tl-day.today { background: var(--purple-dim); border-radius: var(--radius);
    padding: 12px 16px; margin-bottom: 4px; border: 1px solid rgba(139,92,246,0.3); }
  .tl-date { min-width: 140px; font-size: 13px; font-weight: 700; color: var(--text2);
    padding-top: 2px; }
  .tl-day.today .tl-date { color: var(--purple); }
  .badge { background: var(--purple); color: #fff; font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 50px; margin-left: 6px; letter-spacing: 0.05em; }
  .tl-events { flex: 1; }
  .tl-event { font-size: 13px; padding: 3px 0; }
  .tl-event.p1 { font-weight: 600; }
  .tl-event.p2 { color: var(--text); }
  .tl-event.p3 { color: var(--text2); }
  .tl-time { color: var(--purple); font-weight: 600; margin-right: 8px; }

  /* Tabs */
  .tabs { display: flex; gap: 4px; margin-bottom: 20px;
    background: var(--surface); border-radius: 10px; padding: 4px; }
  .tab { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
    cursor: pointer; color: var(--text2); transition: all 0.15s;
    background: transparent; border: none; }
  .tab:hover { color: var(--text); }
  .tab.active { background: var(--purple-dim); color: var(--purple); }
  .tab-content { display: none; }
  .tab-content.active { display: block; }

  .main { padding: 24px 32px; max-width: 1600px; margin: 0 auto; }

  /* Countdown */
  .countdown-bar {
    display: flex; gap: 16px; padding: 16px 24px;
    background: var(--red-dim); border: 1px solid rgba(239,68,68,0.3);
    border-radius: var(--radius); margin-bottom: 24px; align-items: center;
  }
  .countdown-bar .icon { font-size: 22px; }
  .countdown-bar .text { font-size: 14px; }
  .countdown-bar .text b { color: var(--red); }

  /* Responsive */
  @media (max-width: 900px) {
    .container { grid-template-columns: 1fr; }
    .quicklinks { grid-template-columns: 1fr; }
    .header { padding: 16px; }
    .main { padding: 16px; }
  }

  /* Auto-refresh indicator */
  .refresh-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green); display: inline-block;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Intel Tab */
  .intel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .intel-stats { display: flex; gap: 10px; }
  .stat-chip { background: var(--surface); border: 1px solid var(--border); padding: 6px 14px;
    border-radius: 50px; font-size: 13px; color: var(--text2); }
  .stat-chip b { color: var(--text); }
  .stat-chip.unread b { color: var(--purple); }
  .stat-chip.actioned b { color: var(--green); }
  .btn-add { background: var(--purple); color: #fff; border: none; padding: 8px 20px;
    border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-add:hover { background: #7c4fe0; }

  .quick-add { background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px; margin-bottom: 16px; }
  .qa-row { margin-bottom: 10px; }
  .qa-row textarea { width: 100%; background: var(--bg); color: var(--text); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px; font-size: 14px; resize: vertical; font-family: inherit; }
  .qa-fields { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .qa-fields select, .qa-fields input { background: var(--bg); color: var(--text);
    border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 13px; }
  .qa-fields select { min-width: 120px; }
  .qa-fields input { flex: 1; min-width: 120px; }
  .btn-save { background: var(--green); color: #000; border: none; padding: 6px 18px;
    border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .btn-save:hover { background: #1eac50; }
  .btn-import { background: transparent; color: var(--purple); border: 1px solid var(--purple); padding: 8px 16px;
    border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-import:hover { background: var(--purple-dim); }
  .btn-bookmarklet { background: transparent; color: var(--text2); border: 1px solid var(--border); padding: 8px 16px;
    border-radius: 8px; font-size: 13px; cursor: pointer; }
  .btn-bookmarklet:hover { background: var(--surface2); }
  .btn-preview { background: var(--purple); color: #fff; border: none; padding: 6px 18px;
    border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
  .btn-preview:hover { background: #7c4fe0; }
  .qa-hint { color: var(--text2); font-size: 13px; margin: 0 0 10px; }
  .qa-detect { padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 10px;
    background: var(--purple-dim); color: var(--purple); border: 1px solid rgba(139,92,246,0.3); }
  .qa-feedback { padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-top: 10px; }
  .qa-feedback.success { background: rgba(34,197,94,0.15); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .qa-feedback.error { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .bi-status { color: var(--text2); font-size: 13px; }
  .bi-preview { margin-top: 12px; }
  .bi-preview-item { background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 14px; margin-bottom: 8px; font-size: 13px; }
  .bi-preview-item .bi-type { color: var(--purple); font-weight: 600; text-transform: uppercase; font-size: 11px; }
  .bi-preview-item .bi-body { color: var(--text); margin-top: 4px; }
  .bi-preview-item .bi-url { color: var(--text2); font-size: 11px; margin-top: 2px; word-break: break-all; }
  .bookmarklet-link { display: inline-block; background: var(--purple); color: #fff !important;
    padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none;
    cursor: grab; transition: transform 0.1s; }
  .bookmarklet-link:hover { transform: scale(1.05); background: #7c4fe0; }

  .intel-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
  .filter-chip { background: transparent; border: 1px solid var(--border); color: var(--text2);
    padding: 5px 12px; border-radius: 50px; font-size: 12px; cursor: pointer; }
  .filter-chip:hover { border-color: var(--purple); color: var(--text); }
  .filter-chip.active { background: var(--purple-dim); border-color: var(--purple); color: var(--purple); }
  .filter-sep { color: var(--border); margin: 0 4px; }
  .filter-search { background: var(--bg); color: var(--text); border: 1px solid var(--border);
    border-radius: 50px; padding: 5px 14px; font-size: 12px; width: 180px; margin-left: auto; }

  .intel-feed { display: flex; flex-direction: column; gap: 8px; }
  .intel-item { background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px; transition: border-color 0.15s; }
  .intel-item:hover { border-color: rgba(139,92,246,0.4); }
  .intel-item.status-unread { border-left: 3px solid var(--purple); }
  .intel-item.status-actioned { border-left: 3px solid var(--green); }
  .intel-item.sentiment-positive { background: rgba(34,197,94,0.04); }
  .intel-item.sentiment-negative { background: rgba(239,68,68,0.04); }

  .ii-header { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
  .ii-type { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 2px 8px; border-radius: 4px; background: var(--purple-dim); color: var(--purple); }
  .ii-type.type-x { background: rgba(29,155,240,0.15); color: #1d9bf0; }
  .ii-type.type-hn { background: rgba(255,102,0,0.15); color: #ff6600; }
  .ii-type.type-reddit { background: rgba(255,69,0,0.15); color: #ff4500; }
  .ii-type.type-github { background: rgba(110,118,129,0.15); color: #8b949e; }
  .ii-type.type-devto { background: rgba(59,73,223,0.15); color: #3b49df; }
  .ii-author { font-size: 13px; font-weight: 600; color: var(--text); }
  .ii-time { font-size: 11px; color: var(--text2); margin-left: auto; }
  .ii-priority { font-size: 11px; font-weight: 700; }
  .ii-priority.p1 { color: var(--red); }
  .ii-priority.p2 { color: var(--text2); }
  .ii-priority.p3 { color: var(--border); }

  .ii-body { font-size: 14px; line-height: 1.6; color: var(--text); margin-bottom: 8px;
    white-space: pre-wrap; word-break: break-word; }
  .ii-link { font-size: 12px; color: var(--purple); text-decoration: none; display: inline-block; margin-bottom: 6px; }
  .ii-link:hover { text-decoration: underline; }
  .ii-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
  .ii-tag { font-size: 11px; background: var(--surface2); color: var(--text2);
    padding: 2px 8px; border-radius: 50px; }
  .ii-notes { font-size: 12px; color: var(--text2); font-style: italic;
    padding: 6px 10px; background: var(--surface2); border-radius: 6px; margin-bottom: 6px; }

  .ii-actions { display: flex; gap: 6px; margin-top: 6px; }
  .ii-actions button { background: var(--surface2); border: 1px solid var(--border); color: var(--text2);
    padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
  .ii-actions button:hover { border-color: var(--purple); color: var(--text); }
  .ii-actions button.active { background: var(--purple-dim); border-color: var(--purple); color: var(--purple); }
  .ii-actions .btn-archive { color: var(--red); }
  .ii-actions .btn-archive:hover { border-color: var(--red); background: var(--red-dim); }

  .tab-badge { background: var(--purple); color: #fff; font-size: 11px; font-weight: 700;
    padding: 1px 7px; border-radius: 50px; margin-left: 6px; }
</style>
</head>
<body>
<div class="header">
  <h1>⚡ OpenConductor Command Center</h1>
  <div class="header-meta">
    <div class="progress-ring">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-label"><b>${doneCount}/${totalCount}</b> tasks (${pct}%)</div>
    </div>
    <div class="date">${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <span class="refresh-dot" title="Live — auto-refreshes every 30s"></span>
  </div>
</div>

<div class="main">
  <div id="countdown"></div>

  <div class="tabs">
    <button class="tab active" onclick="switchTab('dashboard')">Dashboard</button>
    <button class="tab" onclick="switchTab('intel')">Intel ${contentStats.total > 0 ? '<span class="tab-badge">' + contentStats.unread + '</span>' : ''}</button>
    <button class="tab" onclick="switchTab('timeline')">Timeline (30 Days)</button>
    <button class="tab" onclick="switchTab('checklist')">Full Checklist</button>
    <button class="tab" onclick="switchTab('links')">Quick Links</button>
  </div>

  <div id="tab-dashboard" class="tab-content active">
    <div class="container" style="background:transparent;gap:24px;">
      <div class="panel" style="background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);">
        <div class="panel-title"><span class="icon">📅</span> Today's Schedule</div>
        ${todayHTML}
      </div>
      <div class="panel" style="background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);">
        <div class="panel-title"><span class="icon">⏭️</span> Coming Up</div>
        ${upcomingHTML || '<p class="empty">No upcoming events.</p>'}
      </div>
    </div>
  </div>

  <div id="tab-intel" class="tab-content">
    <div class="intel-header">
      <div class="intel-stats">
        <span class="stat-chip"><b>${contentStats.total}</b> items</span>
        <span class="stat-chip unread"><b>${contentStats.unread}</b> unread</span>
        <span class="stat-chip actioned"><b>${contentStats.actioned}</b> actioned</span>
      </div>
      <button class="btn-add" onclick="toggleQuickAdd()">+ Add Intel</button>
      <button class="btn-import" onclick="toggleBulkImport()">Bulk Import</button>
      <button class="btn-bookmarklet" onclick="toggleBookmarklet()">Bookmarklet</button>
    </div>

    <div id="quick-add" class="quick-add" style="display:none;">
      <div class="qa-row">
        <textarea id="qa-body" placeholder="Paste content, URL, or write a note..." rows="3" oninput="onQaBodyInput(this.value)"></textarea>
      </div>
      <div id="qa-detect" class="qa-detect" style="display:none;"></div>
      <div class="qa-row qa-fields">
        <select id="qa-type">
          <option value="">Auto-detect</option>
          ${store.VALID_TYPES.map(t => '<option value="' + t + '">' + t + '</option>').join('')}
        </select>
        <input id="qa-author" placeholder="Author (@handle)" />
        <input id="qa-url" placeholder="Source URL (optional)" />
        <input id="qa-tags" placeholder="Tags (comma-separated)" />
        <select id="qa-sentiment">
          <option value="">Sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <select id="qa-priority">
          <option value="2">Normal</option>
          <option value="1">Urgent</option>
          <option value="3">Low</option>
        </select>
        <button class="btn-save" onclick="saveIntel()">Save</button>
      </div>
      <div id="qa-feedback" class="qa-feedback" style="display:none;"></div>
    </div>

    <div id="bulk-import" class="quick-add" style="display:none;">
      <p class="qa-hint">Paste multiple items separated by blank lines. URLs are auto-detected.</p>
      <div class="qa-row">
        <textarea id="bi-body" placeholder="https://x.com/steipete/status/123&#10;Great feedback on the trust layer&#10;&#10;https://news.ycombinator.com/item?id=456&#10;Interesting HN discussion&#10;&#10;A plain text note here" rows="6"></textarea>
      </div>
      <div class="qa-row qa-fields">
        <button class="btn-preview" onclick="previewImport()">Preview</button>
        <button class="btn-save" onclick="confirmImport()" id="bi-confirm" disabled>Save All</button>
        <span id="bi-status" class="bi-status"></span>
      </div>
      <div id="bi-preview" class="bi-preview" style="display:none;"></div>
    </div>

    <div id="bookmarklet-panel" class="quick-add" style="display:none;">
      <p class="qa-hint">Drag this link to your bookmarks bar. Click it on any page to capture the URL + selected text to Command Center:</p>
      <p style="text-align:center; margin: 12px 0;">
        <a class="bookmarklet-link" href="javascript:void(fetch('http://localhost:3333/api/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'link',source:'manual',sourceUrl:location.href,body:window.getSelection().toString()||document.title,tags:[]})}).then(function(r){return r.json()}).then(function(d){var n=document.createElement('div');n.style.cssText='position:fixed;top:16px;right:16px;background:#22c55e;color:#000;padding:12px 20px;border-radius:8px;z-index:999999;font:14px/1.4 system-ui;box-shadow:0 4px 12px rgba(0,0,0,.3)';n.textContent='✓ Captured to Command Center';document.body.appendChild(n);setTimeout(function(){n.remove()},2500)}).catch(function(){alert('Command Center not running on localhost:3333')}))">📌 Capture to CC</a>
      </p>
      <p class="qa-hint" style="font-size:11px;">Requires Command Center running on localhost:3333. Captures the page URL and any selected text.</p>
    </div>

    <div class="intel-filters">
      <button class="filter-chip active" onclick="filterIntel(this,'')">All</button>
      <button class="filter-chip" onclick="filterIntel(this,'unread')">Unread</button>
      <button class="filter-chip" onclick="filterIntel(this,'read')">Read</button>
      <button class="filter-chip" onclick="filterIntel(this,'actioned')">Actioned</button>
      <span class="filter-sep">|</span>
      <button class="filter-chip" onclick="filterIntel(this,'x-reply')">X Reply</button>
      <button class="filter-chip" onclick="filterIntel(this,'hn-comment')">HN</button>
      <button class="filter-chip" onclick="filterIntel(this,'reddit-comment')">Reddit</button>
      <button class="filter-chip" onclick="filterIntel(this,'note')">Notes</button>
      <input class="filter-search" id="intel-search" placeholder="Search..." oninput="searchIntel(this.value)" />
    </div>

    <div id="intel-feed" class="intel-feed">
      ${contentItems.length === 0
        ? '<p class="empty">No intel captured yet. Click "+ Add Intel" to start.</p>'
        : contentItems.map(item => `
        <div class="intel-item status-${esc(item.status)} sentiment-${esc(item.sentiment || 'none')}" data-id="${esc(item.id)}" data-type="${esc(item.type)}" data-status="${esc(item.status)}">
          <div class="ii-header">
            <span class="ii-type type-${esc(item.source)}">${esc(item.type)}</span>
            ${item.author ? '<span class="ii-author">' + esc(item.author) + '</span>' : ''}
            <span class="ii-time">${new Date(item.capturedAt).toLocaleString()}</span>
            <span class="ii-priority p${item.priority}">P${item.priority}</span>
          </div>
          <div class="ii-body">${esc(item.body).replace(/\\n/g, '<br>')}</div>
          ${item.sourceUrl ? '<a class="ii-link" href="' + esc(item.sourceUrl) + '" target="_blank">View source →</a>' : ''}
          ${item.tags.length ? '<div class="ii-tags">' + item.tags.map(t => '<span class="ii-tag">' + esc(t) + '</span>').join('') + '</div>' : ''}
          ${item.notes ? '<div class="ii-notes">' + esc(item.notes) + '</div>' : ''}
          <div class="ii-actions">
            <button onclick="setStatus('${esc(item.id)}','read')" class="${item.status === 'read' ? 'active' : ''}">Read</button>
            <button onclick="setStatus('${esc(item.id)}','actioned')" class="${item.status === 'actioned' ? 'active' : ''}">Actioned</button>
            <button onclick="archiveItem('${esc(item.id)}')" class="btn-archive">Archive</button>
          </div>
        </div>`).join('')}
    </div>
  </div>

  <div id="tab-timeline" class="tab-content">
    <div class="timeline-panel">
      ${timelineHTML}
    </div>
  </div>

  <div id="tab-checklist" class="tab-content">
    <div class="checklist-panel">
      ${checklistHTML}
    </div>
  </div>

  <div id="tab-links" class="tab-content">
    <div class="quicklinks">
      ${linksHTML}
    </div>
  </div>
</div>

<script>
  // Tab switching
  function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    event.target.classList.add('active');
  }

  // EU AI Act countdown
  const euDate = new Date('2026-08-01T00:00:00');
  function updateCountdown() {
    const now = new Date();
    const diff = euDate - now;
    if (diff <= 0) return;
    const days = Math.floor(diff / 86400000);
    const el = document.getElementById('countdown');
    if (days <= 180) {
      el.innerHTML = '<div class="countdown-bar">' +
        '<span class="icon">⚠️</span>' +
        '<span class="text"><b>EU AI Act enforcement in ' + days + ' days</b> (August 1, 2026) — Your compliance module is your key differentiator.</span>' +
        '</div>';
    }
  }
  updateCountdown();

  // Auto-refresh every 30s (skip if user has unsaved content)
  setInterval(() => {
    const qa = document.getElementById('qa-body');
    const bi = document.getElementById('bi-body');
    if ((qa && qa.value.trim()) || (bi && bi.value.trim())) return;
    location.reload();
  }, 30000);

  // Intel: toggle quick-add form
  function toggleQuickAdd() {
    const el = document.getElementById('quick-add');
    const wasOpen = el.style.display !== 'none';
    el.style.display = wasOpen ? 'none' : 'block';
    document.getElementById('bulk-import').style.display = 'none';
    document.getElementById('bookmarklet-panel').style.display = 'none';
    if (!wasOpen) document.getElementById('qa-body').focus();
  }
  function toggleBulkImport() {
    const el = document.getElementById('bulk-import');
    const wasOpen = el.style.display !== 'none';
    el.style.display = wasOpen ? 'none' : 'block';
    document.getElementById('quick-add').style.display = 'none';
    document.getElementById('bookmarklet-panel').style.display = 'none';
    if (!wasOpen) document.getElementById('bi-body').focus();
  }
  function toggleBookmarklet() {
    const el = document.getElementById('bookmarklet-panel');
    el.style.display = el.style.display !== 'none' ? 'none' : 'block';
    document.getElementById('quick-add').style.display = 'none';
    document.getElementById('bulk-import').style.display = 'none';
  }

  // Auto-detect URL in quick-add body
  function onQaBodyInput(val) {
    const urlMatch = val.match(/https?:\\/\\/[^\\s]+/);
    const detectEl = document.getElementById('qa-detect');
    if (urlMatch) {
      const url = urlMatch[0];
      document.getElementById('qa-url').value = url;
      // Auto-detect type from URL domain
      const domainHints = {
        'twitter.com': 'x-reply', 'x.com': 'x-reply',
        'news.ycombinator.com': 'hn-comment', 'reddit.com': 'reddit-comment',
        'discord.com': 'discord-message', 'linkedin.com': 'linkedin-comment',
        'github.com': 'github-comment', 'dev.to': 'blog-comment'
      };
      let detected = null;
      for (const [domain, type] of Object.entries(domainHints)) {
        if (url.includes(domain)) { detected = type; break; }
      }
      if (detected) {
        const sel = document.getElementById('qa-type');
        if (!sel.value) sel.value = detected;
        detectEl.textContent = 'Detected: ' + detected + ' from ' + url.split('/')[2];
        detectEl.style.display = 'block';
      } else {
        detectEl.style.display = 'none';
      }
    } else {
      detectEl.style.display = 'none';
    }
  }

  // Show feedback message (replaces page reload for saves)
  function showFeedback(elId, msg, isError) {
    const el = document.getElementById(elId);
    el.textContent = msg;
    el.className = 'qa-feedback ' + (isError ? 'error' : 'success');
    el.style.display = 'block';
    if (!isError) setTimeout(() => location.reload(), 1200);
  }

  // Intel: save new item (inline feedback instead of reload)
  async function saveIntel() {
    const body = document.getElementById('qa-body').value.trim();
    const url = document.getElementById('qa-url').value.trim();
    if (!body && !url) return;
    const payload = {
      body: body,
      sourceUrl: url,
      type: document.getElementById('qa-type').value || undefined,
      author: document.getElementById('qa-author').value.trim() || undefined,
      tags: document.getElementById('qa-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      sentiment: document.getElementById('qa-sentiment').value || undefined,
      priority: parseInt(document.getElementById('qa-priority').value) || 2,
    };
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) showFeedback('qa-feedback', '✓ Saved! Refreshing...', false);
      else showFeedback('qa-feedback', 'Error: ' + (await res.json()).error, true);
    } catch(e) {
      showFeedback('qa-feedback', 'Network error: ' + e.message, true);
    }
  }

  // Bulk import: preview
  let pendingImportItems = [];
  async function previewImport() {
    const raw = document.getElementById('bi-body').value.trim();
    if (!raw) return;
    document.getElementById('bi-status').textContent = 'Parsing...';
    try {
      const res = await fetch('/api/content/import?preview=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: raw })
      });
      const data = await res.json();
      pendingImportItems = data.items || [];
      const previewEl = document.getElementById('bi-preview');
      if (pendingImportItems.length === 0) {
        previewEl.innerHTML = '<p style="color:var(--text2)">No items detected.</p>';
        document.getElementById('bi-confirm').disabled = true;
      } else {
        previewEl.innerHTML = pendingImportItems.map(item =>
          '<div class="bi-preview-item">' +
          '<span class="bi-type">' + (item.type || 'note') + '</span>' +
          (item.sourceUrl ? '<div class="bi-url">' + item.sourceUrl + '</div>' : '') +
          '<div class="bi-body">' + (item.body || '').substring(0, 200) + '</div>' +
          '</div>'
        ).join('');
        document.getElementById('bi-confirm').disabled = false;
      }
      previewEl.style.display = 'block';
      document.getElementById('bi-status').textContent = pendingImportItems.length + ' item(s) detected';
    } catch(e) {
      document.getElementById('bi-status').textContent = 'Error: ' + e.message;
    }
  }

  // Bulk import: confirm and save
  async function confirmImport() {
    if (!pendingImportItems.length) return;
    document.getElementById('bi-status').textContent = 'Saving...';
    try {
      const res = await fetch('/api/content/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingImportItems })
      });
      if (res.ok) {
        const data = await res.json();
        document.getElementById('bi-status').textContent = '✓ Saved ' + data.saved.length + ' items! Refreshing...';
        setTimeout(() => location.reload(), 1200);
      } else {
        document.getElementById('bi-status').textContent = 'Error saving';
      }
    } catch(e) {
      document.getElementById('bi-status').textContent = 'Error: ' + e.message;
    }
  }

  // Intel: set item status
  async function setStatus(id, status) {
    await fetch('/api/content/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    });
    location.reload();
  }

  // Intel: archive item
  async function archiveItem(id) {
    await fetch('/api/content/' + id, { method: 'DELETE' });
    location.reload();
  }

  // Intel: filter by status or type
  function filterIntel(btn, value) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.intel-item').forEach(el => {
      if (!value) { el.style.display = ''; return; }
      const matchStatus = el.dataset.status === value;
      const matchType = el.dataset.type === value;
      el.style.display = (matchStatus || matchType) ? '' : 'none';
    });
  }

  // Intel: search
  function searchIntel(q) {
    const term = q.toLowerCase();
    document.querySelectorAll('.intel-item').forEach(el => {
      if (!term) { el.style.display = ''; return; }
      el.style.display = el.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  }
</script>
</body>
</html>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Helpers ---
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1048576) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// --- HTTP Server ---
// --- Trinity REST bridge (optional) ---
let handleContentApi;
try {
  ({ handleContentApi } = require('../trinity-cc-mcp/content-api.cjs'));
} catch { /* Trinity not built — skip */ }

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsed.pathname;
  const method = req.method;

  // --- Trinity API routes ---
  if (handleContentApi && pathname.startsWith('/api/trinity')) {
    const handled = await handleContentApi(req, res);
    if (handled) return;
  }

  // --- Dashboard ---
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildDashboard());
    return;
  }

  // --- Legacy data endpoint ---
  if (pathname === '/api/data' && method === 'GET') {
    const { sections, doneCount, totalCount } = parseChecklist();
    const events = parseICS();
    jsonResponse(res, 200, { sections, doneCount, totalCount, events });
    return;
  }

  // --- Content CRUD ---
  // GET /api/content — list + search + filter
  if (pathname === '/api/content' && method === 'GET') {
    const params = Object.fromEntries(parsed.searchParams);
    const items = store.getAllItems();
    const result = queryContent(items, params);
    jsonResponse(res, 200, { items: result, total: result.length, stats: store.getStats() });
    return;
  }

  // POST /api/content — create
  if (pathname === '/api/content' && method === 'POST') {
    try {
      const data = await readBody(req);
      if (!data.body && !data.sourceUrl) {
        jsonResponse(res, 400, { error: 'body or sourceUrl is required' });
        return;
      }
      // Auto-detect type from URL if not specified
      if (!data.type && data.sourceUrl) {
        const detected = detectType(data.sourceUrl);
        data.type = detected.type;
        if (!data.source) data.source = detected.source;
      }
      const item = store.addItem(data);
      jsonResponse(res, 201, item);
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  // --- Content stats ---
  if (pathname === '/api/content/stats' && method === 'GET') {
    jsonResponse(res, 200, store.getStats());
    return;
  }

  // --- Import (smart parse) --- supports ?preview=1 for dry-run
  if (pathname === '/api/content/import' && method === 'POST') {
    try {
      const data = await readBody(req);
      const preview = parsed.searchParams.get('preview') === '1';
      const rawText = data.raw || data.body || '';
      const parsedItems = parseMultiImport(rawText);
      if (!parsedItems.length) { jsonResponse(res, 400, { error: 'Nothing to import' }); return; }

      // Apply overrides to each item
      const items = parsedItems.map(p => {
        if (data.tags) p.tags = data.tags;
        if (data.author) p.author = data.author;
        if (data.notes !== undefined) p.notes = data.notes || '';
        if (data.priority) p.priority = data.priority;
        if (data.sentiment) p.sentiment = data.sentiment;
        return p;
      });

      if (preview) {
        jsonResponse(res, 200, { preview: true, count: items.length, items });
        return;
      }

      // Save all items
      const saved = items.map(item => store.addItem(item));
      jsonResponse(res, 201, { saved: saved.length, items: saved });
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  // --- Batch save (for confirmed previewed items) ---
  if (pathname === '/api/content/batch' && method === 'POST') {
    try {
      const data = await readBody(req);
      if (!Array.isArray(data.items) || !data.items.length) {
        jsonResponse(res, 400, { error: 'items array required' }); return;
      }
      const saved = data.items.map(item => store.addItem(item));
      jsonResponse(res, 201, { saved: saved.length, items: saved });
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  // Single item routes: /api/content/:id
  const itemMatch = pathname.match(/^\/api\/content\/([a-zA-Z0-9_]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];

    if (method === 'GET') {
      const item = store.getItem(id);
      if (!item) { jsonResponse(res, 404, { error: 'Not found' }); return; }
      jsonResponse(res, 200, item);
      return;
    }

    if (method === 'PUT') {
      try {
        const updates = await readBody(req);
        const item = store.updateItem(id, updates);
        if (!item) { jsonResponse(res, 404, { error: 'Not found' }); return; }
        jsonResponse(res, 200, item);
      } catch (e) {
        jsonResponse(res, 400, { error: e.message });
      }
      return;
    }

    if (method === 'DELETE') {
      const item = store.deleteItem(id);
      if (!item) { jsonResponse(res, 404, { error: 'Not found' }); return; }
      jsonResponse(res, 200, { archived: true, id });
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
  ⚡ OpenConductor Command Center
  ────────────────────────────────
  Running at: http://localhost:${PORT}
  
  Reads from:
    • docs/launch/GTC-2026-LAUNCH-CHECKLIST.md
    • docs/launch/openconductor-launch-schedule.ics
    • tools/command-center/data/content.json
  
  API endpoints:
    • GET    /api/content          — list + search + filter
    • POST   /api/content          — create item
    • GET    /api/content/:id      — single item
    • PUT    /api/content/:id      — update item
    • DELETE /api/content/:id      — archive item
    • POST   /api/content/import   — smart import (supports ?preview=1)
    • POST   /api/content/batch    — batch save items
  
  Capture tools:
    • Quick-Add form with URL auto-detect
    • Bulk Import with preview
    • Browser bookmarklet (drag from UI)
    • CLI: npm run cc:add
  
  Auto-refreshes every 30 seconds.
  Press Ctrl+C to stop.
  `);
});
