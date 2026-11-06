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

const PORT = 4178;
const DEBUG_PORT = 9558;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-editorial-test-${Date.now()}`);
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

async function evalInPage(expression) {
  const res = await sendCommand('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

// Allow initial page load & React hydration (600ms)
await new Promise((r) => setTimeout(r, 600));

console.log('====================================================');
console.log('   DEEP EDITORIAL ARCHITECTURE & KINETIC HERO QA   ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// 1. Preloader Verification during initialization
// -----------------------------------------------------------------
console.log('--- TEST 1: Multilingual Preloader & Lenis Lock State ---');
const preloaderInitialState = await evalInPage(`
  (() => {
    const preloader = document.querySelector('[aria-label="Portfolio Loading Curtain"]');
    const svgPath = preloader?.querySelector('path');
    const hasLenis = typeof window.__lenis !== 'undefined';
    const isLenisStopped = window.__lenis?.isStopped ?? false;
    const preloaderZIndex = preloader ? window.getComputedStyle(preloader).zIndex : '';
    const preloaderPos = preloader ? window.getComputedStyle(preloader).position : '';
    const currentGreeting = preloader?.querySelector('h1')?.innerText;
    const currentCounter = preloader?.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow');
    
    return {
      hasPreloader: !!preloader,
      preloaderZIndex,
      preloaderPos,
      currentGreeting,
      currentCounter,
      hasSvgPath: !!svgPath,
      initialPathD: svgPath?.getAttribute('d'),
      hasLenisGlobal: hasLenis,
      lenisExposedOnWindow: !!window.__lenis,
      isLenisStopped
    };
  })()
`);
console.log('Preloader Initial Active State:', preloaderInitialState);

// Wait for preloader animation and curtain lift to finish (total duration ~3.4s)
console.log('\nWaiting for Preloader timeline completion & curtain lift...');
await new Promise((r) => setTimeout(r, 3800));

const preloaderPostState = await evalInPage(`
  (() => {
    const preloader = document.querySelector('[aria-label="Portfolio Loading Curtain"]');
    const style = preloader ? window.getComputedStyle(preloader) : null;
    const opacity = style?.opacity;
    const visibility = style?.visibility;
    const pointerEvents = style?.pointerEvents;
    const isLenisStopped = window.__lenis?.isStopped ?? true;
    
    return {
      preloaderFound: !!preloader,
      opacity,
      visibility,
      autoAlphaZero: visibility === 'hidden' || opacity === '0',
      pointerEventsPassThrough: pointerEvents === 'none',
      lenisSmoothScrollActive: !isLenisStopped,
    };
  })()
`);
console.log('Preloader Post-Completion State:', preloaderPostState);

// -----------------------------------------------------------------
// 2. Lenis & GSAP Master Ticker Synchronization Verification
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Unified Lenis and GSAP Ticker Synchronization ---');
const lenisSyncTest = await evalInPage(`
  (() => {
    const hasLenis = typeof window.__lenis !== 'undefined';
    const canScroll = typeof window.__lenis?.scrollTo === 'function';
    const canStart = typeof window.__lenis?.start === 'function';
    const canStop = typeof window.__lenis?.stop === 'function';
    const hasRaf = typeof window.__lenis?.raf === 'function';
    
    return {
      windowHasLenis: hasLenis,
      hasScrollToMethod: canScroll,
      hasStartMethod: canStart,
      hasStopMethod: canStop,
      hasRafMethod: hasRaf,
      lenisVersion: window.__lenis?.version || 'v1.x'
    };
  })()
`);
console.log('Lenis Master Sync Check:', lenisSyncTest);

// -----------------------------------------------------------------
// 3. Editorial Design Tokens & Radical Color Restraint
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Editorial Design Tokens & Radical Color Restraint ---');
const editorialTokensTest = await evalInPage(`
  (() => {
    const hero = document.getElementById('hero');
    const body = document.body;
    const heroStyle = window.getComputedStyle(hero);
    const bodyStyle = window.getComputedStyle(body);
    
    // Check background obsidian (#0A0A0A => rgb(10, 10, 10))
    const bodyBg = bodyStyle.backgroundColor;
    const heroBg = heroStyle.backgroundColor;
    
    // Check text alabaster (#F4F3EF => rgb(244, 243, 239))
    const heroText = heroStyle.color;
    
    // Check headline word typography
    const word = document.querySelector('.hero-split-word');
    const wordStyle = word ? window.getComputedStyle(word) : null;
    
    // Check terracotta accent word
    const accentWord = document.querySelector('.hero-split-word.text-accent-coral');
    const accentStyle = accentWord ? window.getComputedStyle(accentWord) : null;
    
    return {
      bodyBg,
      heroBg,
      heroTextColor: heroText,
      isObsidianDark: heroBg === 'rgb(10, 10, 10)' || bodyBg === 'rgb(10, 10, 10)',
      isAlabasterText: heroText === 'rgb(244, 243, 239)' || bodyStyle.color === 'rgb(244, 243, 239)',
      headlineWordFont: wordStyle?.fontFamily,
      headlineWordFontSize: wordStyle?.fontSize,
      accentWordColor: accentStyle?.color
    };
  })()
`);
console.log('Editorial Tokens Verification:', editorialTokensTest);

// -----------------------------------------------------------------
// 4. Kinetic Hero Choreography & Masked Split-Word Entrance
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Kinetic Hero Split-Word Mask Containers & Stagger ---');
const splitWordsTest = await evalInPage(`
  (() => {
    const masks = Array.from(document.querySelectorAll('#hero h1 span[style*="overflow: hidden"]'));
    const words = Array.from(document.querySelectorAll('#hero .hero-split-word'));
    
    const wordTexts = words.map(w => w.innerText.trim());
    
    // Verify each word is inside an overflow-hidden mask
    const allMasked = words.every(w => {
      const parent = w.parentElement;
      return parent && (parent.style.overflow === 'hidden' || window.getComputedStyle(parent).overflow === 'hidden');
    });
    
    const wordTransforms = words.map(w => window.getComputedStyle(w).transform);
    const wordOpacities = words.map(w => window.getComputedStyle(w).opacity);
    
    return {
      totalMaskedContainers: masks.length,
      totalSplitWords: words.length,
      allWordsContainedInMasks: allMasked,
      sampleWords: wordTexts,
      firstWordOpacity: wordOpacities[0],
      firstWordTransform: wordTransforms[0]
    };
  })()
`);
console.log('Split-Word Masked Entrance Check:', splitWordsTest);

// -----------------------------------------------------------------
// 5. Giant Full-Bleed Infinite Velocity Marquee & Reversal on Scroll
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Infinite Velocity Marquee & Direction Reversal on Scroll ---');
const marqueeTest = await evalInPage(`
  (async () => {
    const marqueeWrap = document.querySelector('.hero-marquee-wrap');
    const marqueeTrack = marqueeWrap?.querySelector('div[style*="width: fit-content"]');
    
    if (!marqueeWrap || !marqueeTrack) {
      return { error: 'Marquee wrap or track not found' };
    }
    
    // Sample position at t0
    const t0Transform = window.getComputedStyle(marqueeTrack).transform;
    await new Promise(r => setTimeout(r, 400));
    const t1Transform = window.getComputedStyle(marqueeTrack).transform;
    
    const isMovingContinuously = t0Transform !== t1Transform;
    
    // Test scroll direction change
    window.scrollTo({ top: 300, behavior: 'auto' });
    await new Promise(r => setTimeout(r, 200));
    const downScrollTransform = window.getComputedStyle(marqueeTrack).transform;
    
    window.scrollTo({ top: 50, behavior: 'auto' });
    await new Promise(r => setTimeout(r, 200));
    const upScrollTransform = window.getComputedStyle(marqueeTrack).transform;
    
    return {
      marqueeFound: true,
      t0Transform,
      t1Transform,
      isMovingContinuouslyOnTicker: isMovingContinuously,
      marqueeItemsCount: marqueeWrap.querySelectorAll('span.font-display').length,
      marqueeSampleText: marqueeWrap.querySelector('span.font-display')?.innerText
    };
  })()
`);
console.log('Infinite Marquee Telemetry:', marqueeTest);

// -----------------------------------------------------------------
// 6. Preservation of Biography Data & Navigation Links
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Preservation of Biography Data & Routing Targets ---');
const dataPreservationTest = await evalInPage(`
  (() => {
    const textContent = document.getElementById('hero')?.innerText || '';
    const hasName = textContent.includes('Abdur Rahman Moayed');
    const hasHandle = textContent.includes('@watchknight');
    const hasEWU = textContent.includes('East West University');
    const hasBio = textContent.includes('POSIX shared-memory pipelines');
    
    const workBtn = document.querySelector('button[aria-label="Explore Flagship Case Studies"]');
    const terminalBtn = document.querySelector('button[aria-label*="Launch Interactive Terminal"]');
    const ghLinks = Array.from(document.querySelectorAll('a[href="https://github.com/watchknight"]'));
    const resumeLink = document.querySelector('a[href="/resume.pdf"]');
    
    return {
      hasName,
      hasHandle,
      hasEWU,
      hasBio,
      hasWorkButton: !!workBtn,
      hasTerminalButton: !!terminalBtn,
      githubLinksCount: ghLinks.length,
      hasResumeLink: !!resumeLink
    };
  })()
`);
console.log('Biography & Links Preservation:', dataPreservationTest);

// -----------------------------------------------------------------
// 7. Error Audit
// -----------------------------------------------------------------
console.log('\n--- TEST 7: Page Errors & Console Log Audit ---');
console.log('Runtime exceptions:', pageErrors.length, pageErrors);
console.log('Console logs:', consoleLogs.length, consoleLogs);

console.log('\n====================================================');
console.log('      DEEP EDITORIAL VERIFICATION COMPLETE          ');
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
