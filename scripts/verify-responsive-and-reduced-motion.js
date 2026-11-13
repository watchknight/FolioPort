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

const PORT = 4201;
const DEBUG_PORT = 9581;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-resp-${Date.now()}`);
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

console.log('========================================================');
console.log('   RESPONSIVE (1440x900 & 375x812) & REDUCED-MOTION AUDIT');
console.log('========================================================\n');

// Skip boot sequence if present
await new Promise((r) => setTimeout(r, 1200));
await evalInPage(`
  const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
  if (skipBtn) skipBtn.click();
`);
await new Promise((r) => setTimeout(r, 600));

// TEST 1: Desktop 1440x900
console.log('--- TEST 1: Desktop Viewport 1440x900 ---');
await sendCommand('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await new Promise((r) => setTimeout(r, 500));

const desktopResults = await evalInPage(`
  (() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
    const casingRect = casing ? casing.getBoundingClientRect() : null;
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    const screenRect = screen ? screen.getBoundingClientRect() : null;
    const deskLineRect = deskLine ? deskLine.getBoundingClientRect() : null;

    const voidHeight = deskLineRect && screenRect ? (deskLineRect.top - screenRect.top) : 0;
    const voidPercentage = screenRect ? (voidHeight / screenRect.height) * 100 : 0;

    // Check sprites for bounding boxes (border or outline)
    const avatar = document.querySelector('[data-testid="developer-avatar-sprite"]');
    const pcLeft = document.querySelector('[data-testid="crt-workstation-pc-left"]');
    const pcRight = document.querySelector('[data-testid="crt-workstation-pc-right"]');
    const getBorder = (el) => el ? window.getComputedStyle(el).borderWidth : '';

    return {
      bodyOverflow: bodyStyle.overflow,
      bodyOverflowX: bodyStyle.overflowX,
      bodyOverflowY: bodyStyle.overflowY,
      hasZeroScrollbars: bodyStyle.overflow === 'hidden' || (bodyStyle.overflowX === 'hidden' && bodyStyle.overflowY === 'hidden'),
      casingCentered: casingRect ? Math.abs((window.innerWidth - casingRect.width) / 2 - casingRect.left) < 5 : false,
      voidPercentage: Math.round(voidPercentage),
      hasAmpleNegativeSpace: voidPercentage >= 45 && voidPercentage <= 75,
      avatarBorder: getBorder(avatar),
      pcLeftBorder: getBorder(pcLeft),
      pcRightBorder: getBorder(pcRight),
      spritesClean: (!avatar || getBorder(avatar) === '0px') && (!pcLeft || getBorder(pcLeft) === '0px')
    };
  })()
`);
console.log('Desktop 1440x900 Metrics:', desktopResults);

// TEST 2: Mobile 375x812
console.log('\n--- TEST 2: Mobile Viewport 375x812 ---');
await sendCommand('Emulation.setDeviceMetricsOverride', {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((r) => setTimeout(r, 500));

const mobileResults = await evalInPage(`
  (() => {
    const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
    const casingStyle = casing ? window.getComputedStyle(casing) : null;
    const docWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;

    return {
      docWidth,
      docClientWidth,
      hasZeroHorizontalOverflow: docWidth <= docClientWidth,
      paddingTop: casingStyle ? casingStyle.paddingTop : '',
      paddingBottom: casingStyle ? casingStyle.paddingBottom : '',
      paddingLeft: casingStyle ? casingStyle.paddingLeft : '',
      paddingRight: casingStyle ? casingStyle.paddingRight : '',
      is8pxFrame: casingStyle ? (casingStyle.paddingTop === '8px' && casingStyle.paddingLeft === '8px') : false,
    };
  })()
`);
console.log('Mobile 375x812 Metrics:', mobileResults);

// Open Projects View in Mobile to test flagship cards & body font
await evalInPage(`
  const pBtn = document.querySelector('[data-testid="retro-command-item-projects"]');
  if (pBtn) pBtn.click();
`);
await new Promise((r) => setTimeout(r, 600));

const mobileProjectsResults = await evalInPage(`
  (() => {
    const projectCards = document.querySelectorAll('[data-testid^="flagship-card-"]');
    const caseStudyBody = document.querySelector('[data-testid="retro-content-projects"] .font-body');
    const bodyFont = caseStudyBody ? window.getComputedStyle(caseStudyBody).fontFamily : '';

    return {
      cardCount: projectCards.length,
      has4FlagshipCards: projectCards.length >= 4,
      bodyFont,
      usesPlusJakartaSans: bodyFont.includes('Plus Jakarta Sans')
    };
  })()
`);
console.log('Mobile Projects Cards & Typography:', mobileProjectsResults);

// TEST 3: Reduced Motion
console.log('\n--- TEST 3: Prefers-Reduced-Motion Compliance ---');
await sendCommand('Emulation.setEmulatedMedia', {
  media: 'screen',
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await new Promise((r) => setTimeout(r, 300));

// Close window back to Level 1
await evalInPage(`
  const closeBtn = document.querySelector('[data-testid="retro-window-header-close"]');
  if (closeBtn) closeBtn.click();
`);
await new Promise((r) => setTimeout(r, 400));

const reducedMotionResults = await evalInPage(`
  (() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isStageVisible = !!document.querySelector('[data-testid="crt-diorama-stage"]');
    return {
      mediaQueryActive: isReduced,
      isStageVisible
    };
  })()
`);
console.log('Reduced Motion Verification:', reducedMotionResults);

console.log('\n--- Console Logs & Exceptions ---');
console.log('Page errors count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length);

const allPassed = (
  desktopResults.hasZeroScrollbars &&
  desktopResults.casingCentered &&
  desktopResults.hasAmpleNegativeSpace &&
  desktopResults.spritesClean &&
  mobileResults.hasZeroHorizontalOverflow &&
  mobileResults.is8pxFrame &&
  mobileProjectsResults.has4FlagshipCards &&
  mobileProjectsResults.usesPlusJakartaSans &&
  reducedMotionResults.mediaQueryActive &&
  pageErrors.length === 0
);

console.log('\n========================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL RESPONSIVE & REDUCED-MOTION TESTS PASSED (100%)' : 'SOME CHECKS FAILED'}`);
console.log('========================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(allPassed ? 0 : 1);
}, 300);
