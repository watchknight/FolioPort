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

const PORT = 4179;
const DEBUG_PORT = 9559;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-timing-test-${Date.now()}`);
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

const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
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

// 1. Inject telemetry BEFORE page scripts execute
await sendCommand('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    window.__timingTelemetry = {
      startTime: performance.now(),
      heroRevealEventTime: null,
      curtainCompletedTime: null,
      firstWordTransformAtReveal: null,
      wordTransforms: [],
    };

    window.addEventListener('hero-reveal', () => {
      window.__timingTelemetry.heroRevealEventTime = performance.now();
      const word = document.querySelector('.hero-split-word');
      if (word) {
        window.__timingTelemetry.firstWordTransformAtReveal = window.getComputedStyle(word).transform;
      }
    });

    // Observe when preloader finishes (autoAlpha: 0)
    const observer = new MutationObserver(() => {
      const preloader = document.querySelector('[aria-label="Portfolio Loading Curtain"]');
      if (preloader) {
        const style = window.getComputedStyle(preloader);
        if ((style.visibility === 'hidden' || style.opacity === '0' || style.pointerEvents === 'none') && !window.__timingTelemetry.curtainCompletedTime) {
          window.__timingTelemetry.curtainCompletedTime = performance.now();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
  `
});

console.log('====================================================');
console.log('       KINETIC TIMING & VELOCITY VERIFICATION        ');
console.log('====================================================\n');

// 2. Navigate to application
await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}` });

// Sample transforms during lifecycle
console.log('Sampling animation lifecycle across 4.2s...');
for (let i = 0; i < 42; i++) {
  await new Promise((r) => setTimeout(r, 100));
  await evalInPage(`
    (() => {
      const word = document.querySelector('.hero-split-word');
      const preloader = document.querySelector('[aria-label="Portfolio Loading Curtain"]');
      const isPreloaderHidden = preloader ? (window.getComputedStyle(preloader).visibility === 'hidden' || window.getComputedStyle(preloader).opacity === '0' || window.getComputedStyle(preloader).pointerEvents === 'none') : false;
      if (isPreloaderHidden && !window.__timingTelemetry.curtainCompletedTime) {
        window.__timingTelemetry.curtainCompletedTime = performance.now();
      }
      if (word && window.__timingTelemetry.heroRevealEventTime) {
        window.__timingTelemetry.wordTransforms.push({
          timeSinceReveal: performance.now() - window.__timingTelemetry.heroRevealEventTime,
          transform: window.getComputedStyle(word).transform,
          opacity: window.getComputedStyle(word).opacity
        });
      }
    })()
  `);
}

const telemetry = await evalInPage(`window.__timingTelemetry`);
console.log('Kinetic Timing Telemetry:');
console.log('- Hero Reveal event fired:', !!telemetry.heroRevealEventTime);
console.log('- Curtain Completed recorded:', !!telemetry.curtainCompletedTime);

if (telemetry.heroRevealEventTime && telemetry.curtainCompletedTime) {
  const leadTimeMs = telemetry.curtainCompletedTime - telemetry.heroRevealEventTime;
  console.log(`- Lead time between hero-reveal and curtain lift completion: ${leadTimeMs.toFixed(1)}ms`);
  const isAround300ms = leadTimeMs >= 200 && leadTimeMs <= 450;
  console.log(`- Confirmed ~300ms (0.3s) lead time requirement:`, isAround300ms);
}

// Check word entrance movement within 150ms of reveal event
const samplesAfterReveal = telemetry.wordTransforms || [];
const earlySample = samplesAfterReveal.find((s) => s.timeSinceReveal >= 50 && s.timeSinceReveal <= 200);
console.log('- Word sample 100-200ms after reveal:', earlySample);

// Check marquee velocity response
console.log('\nTesting Marquee scroll velocity acceleration...');
const marqueeVelocityTest = await evalInPage(`
  (async () => {
    const track = document.querySelector('.hero-marquee-wrap div[style*="width: fit-content"]');
    if (!track) return { error: 'No marquee track' };

    const t0 = window.getComputedStyle(track).transform;
    // Rapid programmatic flick scroll
    window.scrollTo({ top: 400, behavior: 'auto' });
    await new Promise(r => setTimeout(r, 100));
    const t1 = window.getComputedStyle(track).transform;

    // Upward programmatic flick scroll
    window.scrollTo({ top: 0, behavior: 'auto' });
    await new Promise(r => setTimeout(r, 100));
    const t2 = window.getComputedStyle(track).transform;

    return {
      t0,
      t1,
      t2,
      respondedToFlick: t0 !== t1 && t1 !== t2
    };
  })()
`);
console.log('Marquee Velocity Response:', marqueeVelocityTest);

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
}, 300);
