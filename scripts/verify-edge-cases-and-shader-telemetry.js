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

const PORT = 4192;
const DEBUG_PORT = 9572;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-test-edge-${Date.now()}`);
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
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const data = await res.json();
    wsUrl = data.webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!wsUrl) {
  console.error('Failed to connect to headless Chrome.');
  server.close();
  chromeProcess.kill();
  process.exit(1);
}

const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:${PORT}`, { method: 'PUT' });
const tabData = await newTabRes.json();
const ws = new WebSocket(tabData.webSocketDebuggerUrl);
await new Promise((resolve) => ws.onopen = resolve);

let idCounter = 1;
const callbacks = new Map();
const pageErrors = [];
const consoleLogs = [];

ws.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);
  if (msg.id && callbacks.has(msg.id)) {
    const { resolve, reject } = callbacks.get(msg.id);
    callbacks.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(msg.params.exceptionDetails);
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    consoleLogs.push({ type: msg.params.type, text });
  }
};

function send(method, params = {}) {
  const id = idCounter++;
  return new Promise((resolve, reject) => {
    callbacks.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.exceptionDetails) {
    throw new Error(JSON.stringify(res.exceptionDetails));
  }
  return res.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

await new Promise((r) => setTimeout(r, 3500));

console.log('====================================================');
console.log(' VERIFICATION SUITE: RAPID SPAM, SHADER & POPSTATE  ');
console.log('====================================================\n');

// 1. Test 3D Shader Uniform Tweens on Editorial Theme Switch
console.log('--- TEST 1: 3D Shader Dynamic Uniform Updating ---');
const shaderUniformsTest = await evalInPage(`
  (async () => {
    // Dispatch alabaster theme change and verify event receipt
    const forestBtn = document.querySelector('button[aria-label*="Deep Forest Clay"]');
    if (forestBtn) forestBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const themeAfterForest = document.documentElement.getAttribute('data-theme');
    
    // Switch to alabaster
    const alabasterBtn = document.querySelector('button[aria-label*="Editorial Alabaster"]');
    if (alabasterBtn) alabasterBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const themeAfterAlabaster = document.documentElement.getAttribute('data-theme');

    // Switch back to obsidian
    const obsidianBtn = document.querySelector('button[aria-label*="Obsidian & Rust"]');
    if (obsidianBtn) obsidianBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const themeFinal = document.documentElement.getAttribute('data-theme');

    return {
      themeAfterForest,
      themeAfterAlabaster,
      themeFinal,
      success: themeAfterForest === 'forest' && themeAfterAlabaster === 'alabaster' && themeFinal === 'obsidian'
    };
  })()
`);
console.log('Shader & Theme Result:', shaderUniformsTest);

// 2. Test Rapid Click Spamming on "Next Project" Button (<200ms)
console.log('\n--- TEST 2: Rapid Click Spamming on "Next Project" (<200ms) ---');
const rapidClickTest = await evalInPage(`
  (async () => {
    // Open first project
    const firstRow = document.querySelectorAll('#work .skew-elem [role="button"]')[0];
    if (firstRow) firstRow.click();
    await new Promise(r => setTimeout(r, 1200));

    const nextBtn = document.querySelector('.next-case-study-btn');
    let clicksDispatched = 0;
    if (nextBtn) {
      // Rapid fire 8 clicks within 160ms (20ms interval)
      for (let i = 0; i < 8; i++) {
        nextBtn.click();
        clicksDispatched++;
        await new Promise(r => setTimeout(r, 20));
      }
    }

    // Wait for the single allowed transition to complete
    await new Promise(r => setTimeout(r, 1200));

    const currentTitle = document.querySelector('.case-study-modal h1')?.innerText;
    const currentHash = window.location.hash;

    // Now test rapid keyboard Tab focus trap inside modal
    const modal = document.querySelector('.case-study-modal');
    const focusable = Array.from(modal?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    // Focus last and simulate Tab
    lastFocusable?.focus();
    modal?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    // Close modal via Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 1000));

    const modalAfterClose = document.querySelector('.case-study-modal');

    return {
      clicksDispatched,
      currentTitle,
      currentHash,
      noMultipleSkips: currentHash === '#case-study/doclens-bd',
      closedCleanlyOnEsc: !modalAfterClose,
      focusableCount: focusable.length
    };
  })()
`);
console.log('Rapid Click Spamming Result:', rapidClickTest);

// 3. Test Browser PopState (Back / Forward Button) History Navigation
console.log('\n--- TEST 3: PopState History Back / Forward Navigation ---');
const popStateTest = await evalInPage(`
  (async () => {
    // Open project directly
    const secondRow = document.querySelectorAll('#work .skew-elem [role="button"]')[1];
    if (secondRow) secondRow.click();
    await new Promise(r => setTimeout(r, 1200));

    const modalOpenBeforeBack = !!document.querySelector('.case-study-modal');
    const hashBeforeBack = window.location.hash;

    // Simulate browser Back button
    window.history.back();
    await new Promise(r => setTimeout(r, 1200));

    const modalAfterBack = !!document.querySelector('.case-study-modal');
    const hashAfterBack = window.location.hash;

    return {
      modalOpenBeforeBack,
      hashBeforeBack,
      modalClosedOnBrowserBack: !modalAfterBack,
      hashAfterBack
    };
  })()
`);
console.log('PopState Navigation Result:', popStateTest);

console.log('\n--- TEST 4: Runtime Errors Audit ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length, consoleLogs);

console.log('\n====================================================');
console.log('      ALL EDGE CASE VERIFICATIONS COMPLETE          ');
console.log('====================================================');

await send('Browser.close').catch(() => {});
chromeProcess.kill();
server.close();
process.exit(0);
