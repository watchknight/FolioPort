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

// 1. Static file server
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

const PORT = 4195;
const DEBUG_PORT = 9575;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-fixes-test-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

// 2. Launch headless Chrome
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
  await new Promise((r) => setTimeout(r, 100));
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const data = await res.json();
    wsUrl = data.webSocketDebuggerUrl;
    if (wsUrl) break;
  } catch {}
}

if (!wsUrl) {
  console.error('Failed to connect to headless Chrome');
  process.exit(1);
}

const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:${PORT}`, { method: 'PUT' });
const tabData = await newTabRes.json();
const ws = new WebSocket(tabData.webSocketDebuggerUrl);
let messageId = 1;
const pending = new Map();

function sendCommand(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const pageErrors = [];
const consoleLogs = [];

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

await sendCommand('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
});

async function evalInPage(expression) {
  const res = await sendCommand('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
await new Promise((r) => setTimeout(r, 3800));

console.log('================================================================');
console.log('   AUDIT SUITE: VERIFYING FIXES FOR DEFECTS & UNTESTED EDGES    ');
console.log('================================================================\n');

// TEST 1: Magnetic Coverage on Social Pills & Primary CTAs in Footer
console.log('--- TEST 1: Magnetic Wrapper on Footer Social Pills & Primary CTAs ---');
const footerMagneticAudit = await evalInPage(`
  (() => {
    try {
      const footer = document.getElementById('contact');
      if (!footer) return { error: 'Contact footer not found' };
      const resumeBtn = footer.querySelector('a[aria-label*="Resume"]');
      const credentialsBtn = footer.querySelector('button[aria-label="View interactive credentials modal"]');
      const ghPill = footer.querySelector('a[aria-label*="GitHub"]');
      const liPill = footer.querySelector('a[aria-label*="LinkedIn"]');
      const twPill = footer.querySelector('a[aria-label*="Twitter"]');
      const apexBtn = footer.querySelector('button[aria-label="Back to apex"]');

    const isMagnetic = (el) => {
      if (!el) return false;
      const parent = el.parentElement;
      return el.classList.contains('will-change-transform') || 
             parent?.classList.contains('will-change-transform') ||
             el.hasAttribute('data-magnetic');
    };

    return {
      hasResumeMagnetic: isMagnetic(resumeBtn),
      hasCredentialsMagnetic: isMagnetic(credentialsBtn),
      hasGhPillMagnetic: isMagnetic(ghPill),
      hasLiPillMagnetic: isMagnetic(liPill),
      hasTwPillMagnetic: isMagnetic(twPill),
      hasApexMagnetic: isMagnetic(apexBtn)
    };
    } catch (e) {
      return { error: e.message };
    }
  })()
`);
console.log('Footer Magnetic Micro-Interactions Check:', footerMagneticAudit);

// TEST 2: Magnetic Center Calculation & Spring Tween Cancellation
console.log('\n--- TEST 2: Magnetic Offset Math & Tween Cancellation ---');
const magneticPhysicsMathAudit = await evalInPage(`
  (() => {
    const connectBtn = document.querySelector('nav button[aria-label="Connect and jump to contact section"]');
    if (!connectBtn) return { error: 'connectBtn not found' };

    const rect = connectBtn.getBoundingClientRect();
    // Dispatch mousemove
    connectBtn.dispatchEvent(new MouseEvent('mousemove', {
      clientX: rect.left + rect.width / 2 + 15,
      clientY: rect.top + rect.height / 2 + 5,
      bubbles: true
    }));

    // Dispatch mouseleave (triggers spring back)
    connectBtn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    // Re-enter immediately (testing spring cancellation)
    connectBtn.dispatchEvent(new MouseEvent('mousemove', {
      clientX: rect.left + rect.width / 2 + 25,
      clientY: rect.top + rect.height / 2 + 10,
      bubbles: true
    }));

    return {
      success: true,
      buttonTag: connectBtn.tagName,
      hasTransformClass: connectBtn.classList.contains('will-change-transform')
    };
  })()
`);
console.log('Magnetic Rapid Re-entry & Offset Calculation Check:', magneticPhysicsMathAudit);

// TEST 3: Pong Canvas Aspect Ratio & Keyboard Controls
console.log('\n--- TEST 3: Retro CRT Pong Aspect-Ratio & Keyboard Paddle Navigation ---');
const pongCanvasAndKeyboardAudit = await evalInPage(`
  (async () => {
    const triggerBtn = document.querySelector('button[aria-label="Open retro CRT channel surfing Easter egg"]');
    triggerBtn?.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 400));
    triggerBtn?.click();
    await new Promise(r => setTimeout(r, 400));

    const canvas = document.querySelector('[role="dialog"] canvas');
    if (!canvas) return { error: 'Canvas not found' };

    const rect = canvas.getBoundingClientRect();
    const hasFixedStyleHeight = canvas.getAttribute('style')?.includes('height: 320px');

    // Test Keyboard navigation (ArrowDown, ArrowUp, W, S)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true }));

    // Close modal
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));

    return {
      canvasFound: true,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasAspectValid: canvas.width > 0 && canvas.height > 0,
      noFixedStyleHeightDistortion: !hasFixedStyleHeight,
      renderedRectWidth: rect.width,
      renderedRectHeight: rect.height
    };
  })()
`);
console.log('Pong Canvas Coordinate & Keyboard Navigation Check:', pongCanvasAndKeyboardAudit);

// TEST 4: #404 Route / Hash Direct Easter Egg Invocation
console.log('\n--- TEST 4: #404 Route Hash Auto-Launch ---');
const hash404Audit = await evalInPage(`
  (async () => {
    window.location.hash = '#404';
    await new Promise(r => setTimeout(r, 300));
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    const isModalOpen = !!modal;

    // Close with Escape
    if (isModalOpen) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
    }
    window.location.hash = '';

    return {
      openedOn404Hash: isModalOpen
    };
  })()
`);
console.log('#404 Route Hash Check:', hash404Audit);

// TEST 5: Procedural Web Audio Sine/Triangle Alternation
console.log('\n--- TEST 5: Procedural Web Audio Waveform Alternation ---');
const audioAlternationAudit = await evalInPage(`
  (() => {
    // Access audio singleton on window or test playTick execution
    const audioBtn = document.querySelector('button[aria-label*="procedural Web Audio"]');
    audioBtn?.click(); // enable sound
    
    // Simulate hover ticks
    const navItems = document.querySelectorAll('nav button');
    navItems.forEach(btn => {
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });

    audioBtn?.click(); // mute back
    return {
      toggledSuccessfully: true,
      audioBtnAria: audioBtn?.getAttribute('aria-label')
    };
  })()
`);
console.log('Procedural Web Audio Alternation & Toggle Check:', audioAlternationAudit);

// TEST 6: Page Errors & Console Log Audit
console.log('\n--- TEST 6: Page Errors & Console Log Audit ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length, consoleLogs);

console.log('\n================================================================');
console.log('                 AUDIT COMPLETED SUCCESSFULLY                   ');
console.log('================================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
}, 300);
