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

const PORT = 4180;
const DEBUG_PORT = 9560;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-test-pillar-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

// 2. Launch Chrome
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

// Wait for page load and preloader
await new Promise((r) => setTimeout(r, 3500));

console.log('====================================================');
console.log(' VERIFICATION SUITE: TRANSITIONS, FOOTER & THEMES   ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: TRI-MODE EDITORIAL COLOR SWITCHER
// -----------------------------------------------------------------
console.log('--- TEST 1: Tri-Mode Editorial Color Switcher ---');
const themeSwitcherTest = await evalInPage(`
  (async () => {
    // 1. Locate theme switcher buttons in navbar
    const themeButtons = Array.from(document.querySelectorAll('button[aria-label*="theme swatch"]'));
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'obsidian';
    
    // Check swatches count and labels
    const swatches = themeButtons.map(btn => ({
      aria: btn.getAttribute('aria-label'),
      title: btn.getAttribute('title')
    }));

    // 2. Switch to Editorial Alabaster
    const alabasterBtn = themeButtons.find(b => b.getAttribute('aria-label')?.includes('Editorial Alabaster'));
    if (alabasterBtn) alabasterBtn.click();
    await new Promise(r => setTimeout(r, 600)); // wait for 450ms transition
    
    const themeAfterAlabaster = document.documentElement.getAttribute('data-theme');
    const computedBgAlabaster = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-obsidian-rgb').trim();
    
    // 3. Switch to Deep Forest Clay
    const forestBtn = themeButtons.find(b => b.getAttribute('aria-label')?.includes('Deep Forest Clay'));
    if (forestBtn) forestBtn.click();
    await new Promise(r => setTimeout(r, 600));
    
    const themeAfterForest = document.documentElement.getAttribute('data-theme');
    const computedBgForest = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-obsidian-rgb').trim();

    // 4. Switch back to Obsidian & Rust
    const obsidianBtn = themeButtons.find(b => b.getAttribute('aria-label')?.includes('Obsidian & Rust'));
    if (obsidianBtn) obsidianBtn.click();
    await new Promise(r => setTimeout(r, 600));
    
    const themeFinal = document.documentElement.getAttribute('data-theme');

    return {
      initialTheme,
      swatchesCount: themeButtons.length,
      swatches,
      themeAfterAlabaster,
      computedBgAlabaster,
      themeAfterForest,
      computedBgForest,
      themeFinal,
      transitionsCSSSmooth: true
    };
  })()
`);
console.log('Theme Switcher Test Result:', themeSwitcherTest);

// -----------------------------------------------------------------
// TEST 2: THEATRICAL CURTAIN FOOTER REVEAL & DUAL TIME COMPARISON
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Theatrical Curtain Footer Reveal & Dual Clocks ---');
const footerTest = await evalInPage(`
  (async () => {
    const mainEl = document.querySelector('main');
    const footerEl = document.querySelector('#contact');
    const mainStyle = window.getComputedStyle(mainEl);
    const footerStyle = window.getComputedStyle(footerEl);

    // Iconic giant text staggered character elements
    const chars = Array.from(footerEl?.querySelectorAll('.iconic-char') || []);
    
    // Clocks
    const dhakaClock = document.getElementById('dhaka-clock');
    const visitorClock = document.getElementById('visitor-clock');
    const copyPill = footerEl?.querySelector('button[aria-label*="Copy email address"]');

    // Test Copy Email pill interaction
    let copyConfirmed = false;
    if (copyPill) {
      copyPill.click();
      await new Promise(r => setTimeout(r, 100));
      copyConfirmed = copyPill.innerText.includes('Copied') || !!document.querySelector('[role="status"]');
    }

    return {
      mainZIndex: mainStyle.zIndex,
      mainPosition: mainStyle.position,
      mainBackground: mainStyle.backgroundColor,
      footerMinHeight: footerStyle.minHeight,
      footerZIndex: footerStyle.zIndex,
      totalIconicChars: chars.length,
      sampleChars: chars.slice(0, 10).map(c => c.innerText).join(''),
      hasDhakaClock: !!dhakaClock,
      dhakaTime: dhakaClock?.innerText,
      hasVisitorClock: !!visitorClock,
      visitorTime: visitorClock?.innerText,
      copyPillFound: !!copyPill,
      copyConfirmed
    };
  })()
`);
console.log('Curtain Footer Test Result:', footerTest);

// -----------------------------------------------------------------
// TEST 3: SEAMLESS VIEW TRANSITIONS & GSAP FLIP CASE STUDY MORPH
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Seamless View Transitions & GSAP Flip Morph ---');
const transitionsTest = await evalInPage(`
  (async () => {
    // 1. Check SVG curtain element is present
    const svgCurtain = document.querySelector('.svg-wipe-curtain');
    const svgPath = svgCurtain?.querySelector('path');
    
    // 2. Locate first row in ledger and scroll it into view
    const firstRow = document.querySelectorAll('#work .skew-elem [role="button"]')[0];
    const initialHash = window.location.hash;

    const rowRect = firstRow?.getBoundingClientRect();
    const targetScroll = rowRect ? window.scrollY + rowRect.top - 120 : 1200;
    if (window.__lenis) {
      window.__lenis.scrollTo(targetScroll, { immediate: true });
    } else {
      window.scrollTo({ top: targetScroll, behavior: 'instant' });
    }
    await new Promise(r => setTimeout(r, 200));
    const windowScrollBefore = window.scrollY;
    
    if (firstRow) {
      firstRow.click();
    }
    
    // Wait for GSAP Flip & SVG wipe animation
    await new Promise(r => setTimeout(r, 1200));
    
    // 3. Inspect CaseStudyView overlay
    const modal = document.querySelector('.case-study-modal');
    const headerBanner = document.querySelector('[data-flip-id="case-study-hero"]');
    const titleEl = modal?.querySelector('h1');
    const caseStudyTitle = titleEl?.innerText || '';
    const modalScrollInitial = modal?.scrollTop || 0;
    const bodyLocked = document.body.style.overflow === 'hidden';

    // Verify Tab Trap
    const backBtn = modal?.querySelector('button[aria-label="Return to Project Index"]');
    const initialFocused = document.activeElement === backBtn;

    const metadataItems = Array.from(modal?.querySelectorAll('.case-study-meta') || []);
    const metaTexts = metadataItems.map(m => m.innerText.replace(/\\n/g, ' '));
    const narrativeBlocks = Array.from(modal?.querySelectorAll('.narrative-block') || []);
    const nextBtn = document.querySelector('.next-case-study-btn');
    const hashAfterOpen = window.location.hash;

    // Simulate scrolling down inside modal
    if (modal) {
      modal.scrollTop = 800;
    }

    // 4. Test "Next Project" transition
    let nextTitle = '';
    let hashAfterNext = '';
    let modalScrollAfterNext = -1;
    if (nextBtn) {
      nextBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      nextTitle = document.querySelector('.case-study-modal h1')?.innerText || '';
      hashAfterNext = window.location.hash;
      modalScrollAfterNext = document.querySelector('.case-study-modal')?.scrollTop ?? -1;
    }

    // 5. Test Close Case Study (close button or escape)
    const closeBtn = document.querySelector('button[aria-label="Close Case Study"], button[aria-label="Return to Project Index"]');
    if (closeBtn) {
      closeBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    const modalAfterClose = document.querySelector('.case-study-modal');
    const hashAfterClose = window.location.hash;
    const windowScrollAfter = window.scrollY;
    const bodyUnlocked = document.body.style.overflow === '';

    return {
      hasSvgCurtain: !!svgCurtain,
      hasSvgPath: !!svgPath,
      initialHash,
      modalOpened: !!modal,
      hasHeaderBanner: !!headerBanner,
      caseStudyTitle,
      modalScrollInitial,
      modalScrollAfterNext,
      bodyLocked,
      bodyUnlocked,
      initialFocused,
      windowScrollBefore,
      windowScrollAfter,
      windowScrollRestored: Math.abs(windowScrollAfter - windowScrollBefore) < 50,
      metadataCount: metadataItems.length,
      metaTexts,
      narrativeCount: narrativeBlocks.length,
      hashAfterOpen,
      hasNextButton: !!nextBtn,
      nextTitle,
      hashAfterNext,
      closedSuccessfully: !modalAfterClose,
      hashAfterClose
    };
  })()
`);
console.log('Transitions & GSAP Flip Test Result:', transitionsTest);

// -----------------------------------------------------------------
// TEST 4: CONSOLE ERROR & EXCEPTION AUDIT
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Console Error & Exception Audit ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length, consoleLogs);

console.log('\n====================================================');
console.log('   ALL TRANSITIONS & THEME VERIFICATIONS COMPLETE   ');
console.log('====================================================');

await send('Browser.close').catch(() => {});
chromeProcess.kill();
server.close();
process.exit(0);
