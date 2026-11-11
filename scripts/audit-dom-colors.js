import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexHtml = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexHtml).pipe(res);
  }
});

const PORT = 4220;
const DEBUG_PORT = 9588;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-color-audit-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempUserDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--disable-background-networking',
  'about:blank',
]);

let wsUrl = '';
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 200));
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const data = await res.json();
    wsUrl = data.webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch (e) {}
}

if (!wsUrl) {
  console.error('Failed to get Chrome debugger URL');
  process.exit(1);
}

const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:${PORT}`, { method: 'PUT' });
const tabData = await newTabRes.json();
const ws = new WebSocket(tabData.webSocketDebuggerUrl);

let msgId = 1;
const pending = new Map();
function sendCommand(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
};

await new Promise((resolve) => (ws.onopen = resolve));
await sendCommand('Page.enable');
await sendCommand('Runtime.enable');
await sendCommand('DOM.enable');

async function evalInPage(expression) {
  const res = await sendCommand('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

// Wait for preloader and boot sequence
await new Promise((r) => setTimeout(r, 3600));
await evalInPage(`
  const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
  if (skipBtn) skipBtn.click();
`);
await new Promise((r) => setTimeout(r, 600));

const colorsWithElements = await evalInPage(`
  (() => {
    const allEls = document.querySelectorAll('*');
    const culprits = [];
    for (const el of allEls) {
      if (el.closest('.hidden') || (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML')) continue;
      const style = window.getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
      for (const p of props) {
        const val = style[p];
        if (val && (val.includes('229, 231, 235') || val.includes('142, 152, 170') || val.includes('255, 255, 255'))) {
          culprits.push({
            tag: el.tagName,
            testid: el.getAttribute('data-testid'),
            class: el.className,
            prop: p,
            val
          });
        }
      }
    }
    return culprits;
  })()
`);

console.log('Culprits:', colorsWithElements);

// Expand Projects view and inspect colors
await evalInPage(`
  const btn = document.querySelector('[data-testid="retro-command-item-projects"]');
  if (btn) btn.click();
`);
await new Promise((r) => setTimeout(r, 800));

const expandedColors = await evalInPage(`
  (() => {
    const allEls = document.querySelectorAll('*');
    const colors = new Set();
    for (const el of allEls) {
      if (el.closest('.hidden') || (el.offsetParent === null && el.tagName !== 'BODY' && el.tagName !== 'HTML')) continue;
      const style = window.getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
      for (const p of props) {
        const val = style[p];
        if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
          colors.add(val);
        }
      }
    }
    return Array.from(colors);
  })()
`);

console.log('\nDOM Colors on Expanded Projects View:');
console.log(expandedColors);

ws.close();
chromeProcess.kill();
server.close();
process.exit(0);
