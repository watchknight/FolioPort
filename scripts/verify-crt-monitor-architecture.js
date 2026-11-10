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

const PORT = 4188;
const DEBUG_PORT = 9568;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-crt-${Date.now()}`);
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

// Wait for initial render and preloader to dismiss
await new Promise((r) => setTimeout(r, 2200));

console.log('====================================================');
console.log('   RETRO 90S CRT MONITOR & PHOSPHOR BROWSER AUDIT   ');
console.log('====================================================\n');

// 1. Audit CRT Monitor Shell Geometry & Bezel
console.log('--- TEST 1: CRT Monitor Hardware Casing & Screen Optics ---');
const casingTest = await evalInPage(`
  (() => {
    const room = document.querySelector('[data-testid="crt-monitor-room"]');
    const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
    const lip = document.querySelector('[data-testid="crt-bezel-lip"]');
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    
    if (!room || !casing || !lip || !screen) {
      return { error: 'Missing CRT Monitor hardware DOM elements' };
    }
    
    const casingStyles = window.getComputedStyle(casing);
    const screenStyles = window.getComputedStyle(screen);
    const lipStyles = window.getComputedStyle(lip);
    
    return {
      roomBg: window.getComputedStyle(room).backgroundColor,
      casingBg: casingStyles.backgroundColor,
      casingMaxWidth: casingStyles.maxWidth,
      lipBg: lipStyles.backgroundColor,
      screenBg: screenStyles.backgroundColor,
      screenBorderRadius: screenStyles.borderRadius,
      screenBoxShadow: screenStyles.boxShadow,
      hasScanlineClass: screen.classList.contains('crt-glass-screen')
    };
  })()
`);
console.log('CRT Monitor Hardware Casing:', casingTest);

// 2. Audit Removal of 3D CyberWaveCanvas, CustomCursor, and backdrop-filter
console.log('\n--- TEST 2: Removal of Three.js Wave Canvas & Floating Cursors ---');
const removalsTest = await evalInPage(`
  (() => {
    const cyberWaveCanvas = document.querySelector('.cyber-wave-canvas');
    const customCursor = document.querySelector('.custom-cursor-container');
    const allCanvases = Array.from(document.querySelectorAll('canvas'));
    
    // Check backdrop-filter across all elements
    const elementsWithBackdropFilter = Array.from(document.querySelectorAll('*')).filter((el) => {
      const bf = window.getComputedStyle(el).backdropFilter;
      return bf && bf !== 'none';
    });
    
    const canvasDetails = allCanvases.map(c => ({
      id: c.id,
      className: c.className,
      parent: c.parentElement?.tagName + (c.parentElement?.className ? '.' + c.parentElement.className.slice(0, 30) : '')
    }));

    const computedRoot = window.getComputedStyle(document.documentElement);
    const techCyan = computedRoot.getPropertyValue('--tech-cyan-wave').trim();
    const techMagenta = computedRoot.getPropertyValue('--tech-magenta-crest').trim();
    const pixelBright = computedRoot.getPropertyValue('--pixel-bright').trim();

    return {
      hasCyberWaveCanvas: !!cyberWaveCanvas,
      hasWkWebglCanvas: !!document.getElementById('wk-webgl-canvas'),
      hasCustomCursor: !!customCursor,
      totalCanvases: allCanvases.length,
      canvasDetails,
      elementsWithBackdropFilterCount: elementsWithBackdropFilter.length,
      computedTokens: { techCyan, techMagenta, pixelBright }
    };
  })()
`);
console.log('Removals Check:', removalsTest);

// 3. Audit Hardware Controls (Power Button + SFX Toggle + Glowing LED + Rapid Clicks)
console.log('\n--- TEST 3: Hardware Controls (Power Button, SFX Toggle & Rapid Click Resilience) ---');
const hardwareControlsTest = await evalInPage(`
  (async () => {
    const pwrBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('POWER') || b.getAttribute('aria-label')?.includes('Power'));
    const sfxBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SFX'));
    const pwrLed = document.querySelector('aside .w-2.h-2, aside .w-2\\\\.5.h-2\\\\.5');
    
    const initialPowerText = pwrBtn?.innerText;
    const initialSfxText = sfxBtn?.innerText;
    
    // Click SFX button
    sfxBtn?.click();
    await new Promise(r => setTimeout(r, 100));
    const toggledSfxText = sfxBtn?.innerText;
    
    // Toggle back
    sfxBtn?.click();
    await new Promise(r => setTimeout(r, 100));
    
    // Test Power Button Collapse
    pwrBtn?.click();
    // Test rapid click resilience: click again within 50ms while disabled/collapsing
    pwrBtn?.click();
    await new Promise(r => setTimeout(r, 200));
    const screenDuringCollapse = document.querySelector('[data-testid="crt-glass-screen"]');
    const hasCollapseAnim = screenDuringCollapse?.className.includes('animate-tube-off');
    
    // Wait for power off settle (450ms)
    await new Promise(r => setTimeout(r, 350));
    const standbyTextVisible = document.body.innerText.includes('POWER OFF') || document.body.innerText.includes('STANDBY');
    
    // Turn back on
    pwrBtn?.click();
    // Rapid click again while expanding
    pwrBtn?.click();
    await new Promise(r => setTimeout(r, 150));
    const hasExpandAnim = document.querySelector('[data-testid="crt-glass-screen"]')?.className.includes('animate-tube-on');
    await new Promise(r => setTimeout(r, 450));

    // Test nested scrolling and anchor navigation inside CRT screen
    const scrollContainer = document.querySelector('.crt-screen-scroll');
    const hasLenisPrevent = scrollContainer?.hasAttribute('data-lenis-prevent');
    
    return {
      hasPowerBtn: !!pwrBtn,
      hasSfxBtn: !!sfxBtn,
      initialSfxText,
      toggledSfxText,
      hasCollapseAnim,
      standbyTextVisible,
      hasExpandAnim,
      hasLenisPrevent
    };
  })()
`);
console.log('Hardware Controls Verification:', hardwareControlsTest);

// 4. Audit Console Errors
console.log('\n--- TEST 4: Zero Console Errors & Runtime Exceptions ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
const errorLogs = consoleLogs.filter(l => l.type === 'error');
console.log('Console errors count:', errorLogs.length, errorLogs);

const passed = (
  casingTest.screenBg === 'rgb(17, 23, 18)' &&
  casingTest.casingBg === 'rgb(200, 194, 171)' &&
  !removalsTest.hasCyberWaveCanvas &&
  !removalsTest.hasWkWebglCanvas &&
  !removalsTest.hasCustomCursor &&
  removalsTest.computedTokens.techCyan === '#c2cdb4' &&
  removalsTest.computedTokens.techMagenta === '#6e7d62' &&
  hardwareControlsTest.hasPowerBtn &&
  hardwareControlsTest.hasSfxBtn &&
  hardwareControlsTest.hasCollapseAnim &&
  hardwareControlsTest.hasExpandAnim &&
  hardwareControlsTest.hasLenisPrevent &&
  pageErrors.length === 0 &&
  errorLogs.length === 0
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
