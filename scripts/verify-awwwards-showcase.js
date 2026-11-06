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

const PORT = 4182;
const DEBUG_PORT = 9562;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-showcase-test-${Date.now()}`);
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

// Set desktop viewport so cursor preview and layout are active
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

// Wait for preloader & animation hydration
await evalInPage(`
  new Promise((resolve) => {
    const isReady = () => !!document.getElementById('work') && !!window.__lenis && !window.__lenis.isStopped && document.body.style.overflow !== 'hidden';
    const interval = setInterval(() => {
      if (isReady()) {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);
    setTimeout(() => { clearInterval(interval); resolve(false); }, 7000);
  })
`);

console.log('====================================================');
console.log('   AWWWARDS DUAL-MODE SHOWCASE & KINETIC LEDGER QA   ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: Editorial Project Index Ledger Structure & Metadata
// -----------------------------------------------------------------
console.log('--- TEST 1: Editorial Project Index Ledger Rows & Surgical Metadata ---');
const ledgerRowsTest = await evalInPage(`
  (() => {
    const workSection = document.getElementById('work');
    const rows = Array.from(document.querySelectorAll('#work .skew-elem'));
    
    const rowData = rows.map((r, i) => {
      const indexEl = r.querySelector('span.font-mono');
      const titleEl = r.querySelector('h3');
      const allText = r.innerText;
      const ghLink = r.querySelector('a[href*="github.com"]');
      const arrowBtn = r.querySelector('div.rounded-full svg, button svg');
      
      return {
        rowNumber: indexEl?.innerText.trim(),
        title: titleEl?.innerText.trim(),
        hasGithubLink: !!ghLink,
        hasArrow: !!arrowBtn,
        textSnippet: allText.replace(/\\n+/g, ' ').slice(0, 100)
      };
    });

    // Check 1px horizontal dividers
    const dividers = Array.from(document.querySelectorAll('#work .ledger-divider'));

    return {
      sectionFound: !!workSection,
      totalSkewRows: rows.length,
      totalDividers: dividers.length,
      sampleRows: rowData
    };
  })()
`);
console.log('Ledger Structure Check:', ledgerRowsTest);

// -----------------------------------------------------------------
// TEST 2: Dennis Snellenberg Cursor-Bound Floating Media Preview Portal
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Cursor-Bound Floating Media Preview Portal & Label Cursor ---');
const portalTest = await evalInPage(`
  (() => {
    // Find preview container and label cursor by data attributes
    const previewContainer = document.querySelector('[data-preview-portal="true"]');
    const labelCursor = document.querySelector('[data-cursor-label="view"]');

    const previewStyle = previewContainer ? window.getComputedStyle(previewContainer) : null;
    const labelStyle = labelCursor ? window.getComputedStyle(labelCursor) : null;

    // Check slides inside preview reel
    const slides = previewContainer ? previewContainer.querySelectorAll('h4') : [];
    const slideTitles = Array.from(slides).map(s => s.textContent?.trim());

    return {
      previewContainerFound: !!previewContainer,
      previewWidth: previewStyle?.width,
      previewPointerEvents: previewStyle?.pointerEvents,
      previewZIndex: previewStyle?.zIndex,
      previewInitialOpacity: previewStyle?.opacity,
      previewInitialVisibility: previewStyle?.visibility,
      labelCursorFound: !!labelCursor,
      labelZIndex: labelStyle?.zIndex,
      labelCursorText: labelCursor?.textContent?.trim(),
      totalSlidesInReel: slides.length,
      slideTitles
    };
  })()
`);
console.log('Floating Media Preview Portal:', portalTest);

// -----------------------------------------------------------------
// TEST 3: Hover Interaction on Ledger Row (quickTo & Inner Reel Translation)
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Hover Interaction, Scale Entrance & Inner Reel Translation ---');

// Scroll row 1 into view so it is in the active viewport
const scrollDebug = await evalInPage(`
  (() => {
    const row = document.querySelectorAll('#work .skew-elem')[1];
    const initialY = window.scrollY;
    const hasLenis = !!window.__lenis;
    const isStopped = window.__lenis?.isStopped;
    if (row && window.__lenis) {
      window.__lenis.scrollTo(row, { immediate: true, offset: -200 });
    } else if (row) {
      row.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
    return {
      initialY,
      hasLenis,
      isStopped,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow
    };
  })()
`);
console.log('Scroll Debug:', scrollDebug);
await new Promise((r) => setTimeout(r, 600));

const row1Coord = await evalInPage(`
  (() => {
    const row = document.querySelectorAll('#work .skew-elem')[1];
    if (!row) return null;
    const r = row.getBoundingClientRect();
    return { x: Math.round(r.left + 250), y: Math.round(r.top + 30), rectY: r.top, scrollY: window.scrollY };
  })()
`);
console.log('Row 1 Viewport Coordinates:', row1Coord);

let hoverInteractionTest = null;
if (row1Coord) {
  // 1. Move real mouse to row 1 using Chrome DevTools Protocol
  await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: row1Coord.x, y: row1Coord.y });
  await new Promise((r) => setTimeout(r, 500));

  const activeState = await evalInPage(`
    (() => {
      const previewContainer = document.querySelector('[data-preview-portal="true"]');
      const labelCursor = document.querySelector('[data-cursor-label="view"]');
      const reel = document.querySelector('[data-preview-reel="true"]');
      const previewStyle = previewContainer ? window.getComputedStyle(previewContainer) : null;
      const labelStyle = labelCursor ? window.getComputedStyle(labelCursor) : null;
      const reelTransform = reel ? window.getComputedStyle(reel).transform : '';

      return {
        activeOpacity: previewStyle?.opacity,
        activeVisibility: previewStyle?.visibility,
        labelActiveOpacity: labelStyle?.opacity,
        reelTransformOnRow1: reelTransform,
        isReelTranslated: reelTransform.includes('matrix') && !reelTransform.includes('1, 0, 0, 1, 0, 0') || reelTransform !== 'none',
      };
    })()
  `);

  // 2. Move mouse away to header
  await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 50, y: 50 });
  await new Promise((r) => setTimeout(r, 450));

  const afterLeaveState = await evalInPage(`
    (() => {
      const previewContainer = document.querySelector('[data-preview-portal="true"]');
      const previewStyle = previewContainer ? window.getComputedStyle(previewContainer) : null;
      return {
        afterLeaveOpacity: previewStyle?.opacity,
        afterLeaveVisibility: previewStyle?.visibility,
      };
    })()
  `);

  hoverInteractionTest = { ...activeState, ...afterLeaveState };
}
console.log('Hover Interaction & Reel Telemetry:', hoverInteractionTest);

// -----------------------------------------------------------------
// TEST 4: Velocity-Dependent Scroll Skew Physics (.skew-elem)
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Velocity-Dependent Scroll Skew Physics (.skew-elem) ---');
const velocitySkewTest = await evalInPage(`
  (async () => {
    const skewElements = Array.from(document.querySelectorAll('.skew-elem'));
    if (skewElements.length === 0) return { error: 'No .skew-elem found' };

    const rect = skewElements[0].getBoundingClientRect();
    const initialTransformOrigin = window.getComputedStyle(skewElements[0]).transformOrigin;
    const initialTransform = window.getComputedStyle(skewElements[0]).transform;

    // Perform rapid flick scroll
    window.scrollTo({ top: 900, behavior: 'auto' });
    await new Promise(r => setTimeout(r, 100));
    const midScrollTransform = window.getComputedStyle(skewElements[0]).transform;

    // Wait for settle timer (GSAP duration 0.6s)
    await new Promise(r => setTimeout(r, 750));
    const settledTransform = window.getComputedStyle(skewElements[0]).transform;

    const originX = parseFloat(initialTransformOrigin.split(' ')[0]);
    const isRightHinged = Math.abs(originX - rect.width) < 10 || initialTransformOrigin.includes('100%');

    return {
      totalSkewElements: skewElements.length,
      transformOrigin: initialTransformOrigin,
      initialTransform,
      midScrollTransform,
      settledTransform,
      isRightHinged,
      settledBackToZero: settledTransform === 'none' || settledTransform.includes('matrix(1, 0, 0, 1, 0, 0)') || settledTransform === initialTransform
    };
  })()
`);
console.log('Velocity Skew Physics Telemetry:', velocitySkewTest);

// -----------------------------------------------------------------
// TEST 5: Dual-Mode Toggle: Switch to Flagship Cards & Back
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Dual-Mode Switcher (Index Ledger <-> Flagship Cards) ---');
const dualModeTest = await evalInPage(`
  (async () => {
    const cardsBtn = document.querySelector('button[aria-label="Switch to Flagship Interactive Cards view"]');
    const ledgerBtn = document.querySelector('button[aria-label="Switch to Editorial Project Index Ledger view"]');

    if (!cardsBtn || !ledgerBtn) return { error: 'Mode toggle buttons not found' };

    // Click Cards Mode
    cardsBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const cardModeActive = document.querySelector('.liquid-glass') || document.querySelector('[class*="LiquidGlassCard"]');
    const numberTabs = Array.from(document.querySelectorAll('button[aria-label*="Jump to project card"]'));

    // Click Ledger Mode back
    ledgerBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const ledgerRowsAfter = document.querySelectorAll('#work .skew-elem');

    return {
      cardsToggleWorked: !!cardModeActive,
      numberTabsCount: numberTabs.length,
      ledgerReturned: ledgerRowsAfter.length === 5
    };
  })()
`);
console.log('Dual-Mode Switching:', dualModeTest);

// -----------------------------------------------------------------
// TEST 6: Preservation of Titles, Descriptions, Tech Tags & URLs
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Preservation of All Titles, Descriptions, Tech Tags & URLs ---');
const dataIntegrityTest = await evalInPage(`
  (() => {
    const text = document.getElementById('work')?.innerText || '';
    const html = document.getElementById('work')?.innerHTML || '';

    const titles = [
      'Mental Defrag',
      'DocLensBD',
      'Rannabanna',
      'Trash Trail',
      'Neon Vanguard 2D & OS Kernel Labs'
    ];

    const tags = [
      'TypeScript',
      'Matter.js',
      'Vector Embeddings',
      'Cloud Firestore',
      'Bengali NLP',
      'ScrollTrigger',
      'Linux POSIX'
    ];

    const urls = [
      'https://github.com/watchknight/Mental-Defrag',
      'https://github.com/watchknight/DocLensBD',
      'https://github.com/watchknight/Rannabanna',
      'https://github.com/watchknight/TrashTrail',
      'https://github.com/watchknight/BitForge'
    ];

    return {
      allTitlesPreserved: titles.every(t => text.includes(t)),
      allTagsPreserved: tags.every(tg => text.includes(tg) || html.includes(tg)),
      allUrlsPreserved: urls.every(u => html.includes(u)),
    };
  })()
`);
console.log('Data Integrity Verification:', dataIntegrityTest);

// -----------------------------------------------------------------
// TEST 7: Page Errors & Console Log Audit
// -----------------------------------------------------------------
console.log('\n--- TEST 7: Page Errors & Console Log Audit ---');
console.log('Runtime exceptions:', pageErrors.length, pageErrors);
console.log('Console logs:', consoleLogs.length, consoleLogs);

console.log('\n====================================================');
console.log('    AWWWARDS SHOWCASE VERIFICATION COMPLETED        ');
console.log('====================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
}, 300);
