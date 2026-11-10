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

const tempUserDataDir = path.join(os.tmpdir(), `chrome-boot-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempUserDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
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

const consoleLogs = [];
const pageErrors = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }

  if (msg.method === 'Runtime.consoleAPICalled') {
    const type = msg.params.type;
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    consoleLogs.push({ type, text });
  }

  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(msg.params.exceptionDetails);
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

console.log('====================================================');
console.log('   BOOT SEQUENCE, AUDIO & MOBILE ERGONOMICS AUDIT   ');
console.log('====================================================\n');

// Set mobile viewport 375x667
await sendCommand('Emulation.setDeviceMetricsOverride', {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  mobile: true,
});

await new Promise((r) => setTimeout(r, 600));

// 1. Audit Boot Sequence Elements on Initial Load
console.log('--- TEST 1: Boot Sequence Presence & Bypass ---');
const bootAudit = await evalInPage(`
  (() => {
    const bootEl = document.querySelector('[data-testid="crt-boot-sequence"]');
    const biosText = document.querySelector('[data-testid="crt-bios-text"]');
    const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
    
    const initialPresent = !!bootEl;
    const hasBiosText = biosText ? biosText.innerText.includes('EWU-CSE ROM BIOS v1.96') : false;
    const hasPortfolioSys = biosText ? biosText.innerText.includes('PORTFOLIO.SYS') : false;
    const hasSkipBtn = !!skipBtn;
    
    // Test instant skip by clicking skip button
    if (skipBtn) {
      skipBtn.click();
    }
    
    return {
      initialPresent,
      hasBiosText,
      hasPortfolioSys,
      hasSkipBtn,
    };
  })()
`);
console.log('Boot Sequence Audit:', bootAudit);

await new Promise((r) => setTimeout(r, 300));

const postSkipAudit = await evalInPage(`
  (() => {
    const bootEl = document.querySelector('[data-testid="crt-boot-sequence"]');
    return {
      bootDismissedAfterSkip: !bootEl
    };
  })()
`);
console.log('Post-Skip Dismissal Audit:', postSkipAudit);

// 2. Audit Mobile Viewport Adaptation & Overflow
console.log('\n--- TEST 2: Mobile 100dvh Adaptation & Zero Horizontal Overflow ---');
const mobileAudit = await evalInPage(`
  (() => {
    const docEl = document.documentElement;
    const body = document.body;
    const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
    const casingRect = casing ? casing.getBoundingClientRect() : null;
    
    const horizontalOverflow = docEl.scrollWidth > docEl.clientWidth || body.scrollWidth > body.clientWidth;
    
    // Audit tap target min-height >= 44px
    const commandButtons = Array.from(document.querySelectorAll('[data-testid^="retro-command-item-"]'));
    const commandButtonHeights = commandButtons.map(b => b.getBoundingClientRect().height);
    const allCommandButtonsGe44 = commandButtonHeights.every(h => h >= 43.5); // Allow subpixel
    
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      casingWidth: casingRect ? casingRect.width : 0,
      casingHeight: casingRect ? casingRect.height : 0,
      horizontalOverflow,
      allCommandButtonsGe44,
      commandButtonHeights
    };
  })()
`);
console.log('Mobile Audit:', mobileAudit);

// 3. Audit Power Cycle & Immediate Beam Wipe Skip via Keyboard
console.log('\n--- TEST 3: Power Cycle & Immediate Beam-Wipe Keydown Skip ---');
const powerCycleAudit = await evalInPage(`
  (async () => {
    const powerBtn = document.querySelector('button[aria-label="Toggle CRT Monitor Power"]');
    if (!powerBtn) return { error: 'No power button' };
    
    // 1. Power off
    powerBtn.click();
    await new Promise(r => setTimeout(r, 550));
    
    // 2. Power on
    powerBtn.click();
    await new Promise(r => setTimeout(r, 600));
    
    // Should be in beam wipe phase
    const bootPresentDuringBeam = !!document.querySelector('[data-testid="crt-boot-sequence"]');
    
    // Instant skip via keyboard keydown event
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    
    const bootDismissedAfterKey = !document.querySelector('[data-testid="crt-boot-sequence"]');
    
    // Wait past 1.6s to confirm no ghost re-emergence or duplicate callbacks
    await new Promise(r => setTimeout(r, 1600));
    const stillDismissedAfterTimeout = !document.querySelector('[data-testid="crt-boot-sequence"]');
    
    return {
      bootPresentDuringBeam,
      bootDismissedAfterKey,
      stillDismissedAfterTimeout
    };
  })()
`);
console.log('Power Cycle & Beam Skip Audit:', powerCycleAudit);

// 4. Audit Runtime Errors
console.log('\n--- TEST 4: Console Logs & Page Exceptions ---');
console.log('Runtime exceptions:', pageErrors);
console.log('Console errors:', consoleLogs.filter(l => l.type === 'error'));

const passed = (
  bootAudit.initialPresent &&
  bootAudit.hasBiosText &&
  bootAudit.hasPortfolioSys &&
  bootAudit.hasSkipBtn &&
  postSkipAudit.bootDismissedAfterSkip &&
  !mobileAudit.horizontalOverflow &&
  mobileAudit.allCommandButtonsGe44 &&
  powerCycleAudit.bootPresentDuringBeam &&
  powerCycleAudit.bootDismissedAfterKey &&
  powerCycleAudit.stillDismissedAfterTimeout &&
  pageErrors.length === 0
);

console.log('\n====================================================');
console.log(`AUDIT RESULT: ${passed ? 'ALL CHECKS PASSED (100%)' : 'SOME CHECKS FAILED'}`);
console.log('====================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(passed ? 0 : 1);
}, 300);
