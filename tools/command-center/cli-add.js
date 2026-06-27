#!/usr/bin/env node
// OpenConductor Command Center — CLI quick-add tool
// Usage:
//   npm run cc:add                         (interactive)
//   echo "Note text" | npm run cc:add      (piped, defaults to type=note)
//   npm run cc:add -- --type x-reply       (override type via flag)

const http = require('http');
const readline = require('readline');

const PORT = process.env.CC_PORT || 3333;
const API_URL = `http://127.0.0.1:${PORT}/api/content`;

// Parse CLI flags (--type, --author, --tags, --priority, --sentiment, --url)
function parseFlags() {
  const flags = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[++i];
    }
  }
  return flags;
}

function postItem(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`Cannot reach Command Center at localhost:${PORT} — is it running? (${e.message})`)));
    req.write(data);
    req.end();
  });
}

function ask(rl, prompt, defaultVal) {
  return new Promise(resolve => {
    const suffix = defaultVal ? ` (${defaultVal})` : '';
    rl.question(`  ${prompt}${suffix}: `, answer => {
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  📌 OpenConductor — Quick Add Intel\n');

  const body = await ask(rl, 'Content');
  if (!body) { console.log('  Cancelled (empty content).'); rl.close(); return; }

  const type = await ask(rl, 'Type [note, x-reply, x-mention, hn-comment, reddit-comment, link, ...]', 'note');
  const author = await ask(rl, 'Author (@handle)');
  const url = await ask(rl, 'Source URL');
  const tags = await ask(rl, 'Tags (comma-sep)');
  const priority = await ask(rl, 'Priority [1=urgent, 2=normal, 3=low]', '2');
  const sentiment = await ask(rl, 'Sentiment [positive, neutral, negative]');

  rl.close();

  const payload = {
    body,
    type: type || 'note',
    author: author || undefined,
    sourceUrl: url || undefined,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    priority: parseInt(priority) || 2,
    sentiment: sentiment || undefined,
  };

  try {
    const saved = await postItem(payload);
    console.log(`\n  ✓ Saved: ${saved.id} (${saved.type})\n`);
  } catch (e) {
    console.error(`\n  ✗ ${e.message}\n`);
    process.exit(1);
  }
}

async function piped() {
  const flags = parseFlags();
  const chunks = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', async () => {
    const body = Buffer.concat(chunks).toString().trim();
    if (!body) { console.error('  ✗ No input received.'); process.exit(1); }

    const payload = {
      body,
      type: flags.type || 'note',
      author: flags.author || undefined,
      sourceUrl: flags.url || undefined,
      tags: flags.tags ? flags.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      priority: parseInt(flags.priority) || 2,
      sentiment: flags.sentiment || undefined,
    };

    try {
      const saved = await postItem(payload);
      console.log(`  ✓ Saved: ${saved.id} (${saved.type})`);
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
      process.exit(1);
    }
  });
}

// Detect if stdin is a TTY (interactive) or piped
if (process.stdin.isTTY) {
  interactive();
} else {
  piped();
}
