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

const PORT = 4192;
const DEBUG_PORT = 9572;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-motion-audio-test-${Date.now()}`);
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

// Set desktop viewport
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
await new Promise((r) => setTimeout(r, 3800));

console.log('================================================================');
console.log('    VERIFICATION SUITE: MOTION HOOK, MAGNETIC, AUDIO & CRT PONG  ');
console.log('================================================================\n');

// -----------------------------------------------------------------
// AUDIT 1: Declarative Scroll-Reveal Attributes Verification
// -----------------------------------------------------------------
console.log('--- TEST 1: Declarative Scroll-Reveal Data Attributes (useReveal) ---');
const revealAttributesAudit = await evalInPage(`
  (() => {
    const animElements = document.querySelectorAll('[data-anim]');
    const maskElements = document.querySelectorAll('[data-mask]');
    const staggerContainers = document.querySelectorAll('[data-stagger]');
    const drawElements = document.querySelectorAll('[data-draw]');
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    const counterElements = document.querySelectorAll('[data-counter]');

    return {
      totalDataAnim: animElements.length,
      totalDataMask: maskElements.length,
      totalDataStagger: staggerContainers.length,
      totalDataDraw: drawElements.length,
      totalDataParallax: parallaxElements.length,
      totalDataCounter: counterElements.length,
      sampleCounters: Array.from(counterElements).map(c => ({
        target: c.getAttribute('data-counter'),
        currentText: c.textContent?.trim()
      }))
    };
  })()
`);
console.log('Scroll-Reveal Attributes Check:', revealAttributesAudit);

// -----------------------------------------------------------------
// AUDIT 2: About Section Editorial Ledger Audit
// -----------------------------------------------------------------
console.log('\n--- TEST 2: Editorial Ledger About Section & Stat Counters ---');
const aboutSectionAudit = await evalInPage(`
  (() => {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return { error: 'About section (#about) not found' };

    const drawnRules = aboutSection.querySelectorAll('[data-draw]');
    const counters = aboutSection.querySelectorAll('[data-counter]');
    const capabilityPillars = aboutSection.querySelectorAll('[data-stagger] > div');
    const easterEggBtn = aboutSection.querySelector('button[aria-label="Open retro CRT channel surfing Easter egg"]');

    return {
      hasAboutSection: true,
      drawnRulesCount: drawnRules.length,
      countersCount: counters.length,
      capabilityPillarsCount: capabilityPillars.length,
      hasEasterEggTrigger: !!easterEggBtn,
      easterEggBtnText: easterEggBtn?.textContent?.trim()
    };
  })()
`);
console.log('About Editorial Ledger Check:', aboutSectionAudit);

// -----------------------------------------------------------------
// AUDIT 3: Experience Chronological Timeline Audit
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Experience Chronological Timeline ---');
const experienceSectionAudit = await evalInPage(`
  (() => {
    const expSection = document.getElementById('experience');
    if (!expSection) return { error: 'Experience section (#experience) not found' };

    const timelineContainer = expSection.querySelector('[data-stagger]');
    const timelineItems = timelineContainer ? timelineContainer.children.length : 0;
    const drawnRules = expSection.querySelectorAll('[data-draw]');

    return {
      hasExperienceSection: true,
      timelineItemsCount: timelineItems,
      drawnRulesCount: drawnRules.length
    };
  })()
`);
console.log('Experience Timeline Check:', experienceSectionAudit);

// -----------------------------------------------------------------
// AUDIT 4: Magnetic Vector Physics Micro-Interactions
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Magnetic Vector Physics Components (<Magnetic />) ---');
const magneticPhysicsAudit = await evalInPage(`
  (() => {
    // Find magnetic elements
    const navButtons = document.querySelectorAll('nav button');
    const connectBtn = document.querySelector('nav button[aria-label="Connect and jump to contact section"]');
    
    // Test mousemove dispatch on connectBtn
    if (connectBtn) {
      const rect = connectBtn.getBoundingClientRect();
      const pointerEvent = new MouseEvent('mousemove', {
        clientX: rect.left + rect.width / 2 + 20,
        clientY: rect.top + rect.height / 2 + 10,
        bubbles: true
      });
      connectBtn.dispatchEvent(pointerEvent);
    }

    return {
      totalNavButtons: navButtons.length,
      hasConnectBtn: !!connectBtn,
      connectBtnHasTransformClass: connectBtn?.classList.contains('will-change-transform')
    };
  })()
`);
console.log('Magnetic Micro-Interactions Check:', magneticPhysicsAudit);

// -----------------------------------------------------------------
// AUDIT 5: Zero-Dependency Procedural Web Audio API Synthesizer
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Procedural Web Audio Synthesizer & Header Toggle ---');
const audioSynthesizerAudit = await evalInPage(`
  (async () => {
    const audioToggleBtn = document.querySelector('button[aria-label*="procedural Web Audio"]');
    const initialText = audioToggleBtn?.textContent?.trim();
    const initialAria = audioToggleBtn?.getAttribute('aria-label');

    // Click to enable sound (testing opt-in toggle)
    audioToggleBtn?.click();
    await new Promise(r => setTimeout(r, 120));
    const activeText = audioToggleBtn?.textContent?.trim();
    const activeAria = audioToggleBtn?.getAttribute('aria-label');

    // Click to mute back
    audioToggleBtn?.click();
    await new Promise(r => setTimeout(r, 120));
    const mutedText = audioToggleBtn?.textContent?.trim();
    const mutedAria = audioToggleBtn?.getAttribute('aria-label');

    return {
      hasHeaderAudioToggle: !!audioToggleBtn,
      initialState: initialText,
      initialAria,
      activeStateAfterClick: activeText,
      activeAria,
      toggledBackMutedState: mutedText,
      mutedAria
    };
  })()
`);
console.log('Procedural Web Audio Header Toggle Check:', audioSynthesizerAudit);

// -----------------------------------------------------------------
// AUDIT 6: Retro CRT Channel Surfing & Minimalist Pong Easter Egg Modal
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Retro CRT Channel Surfing & Pong Mini-Game Easter Egg ---');
const easterEggAudit = await evalInPage(`
  (async () => {
    const triggerBtn = document.querySelector('button[aria-label="Open retro CRT channel surfing Easter egg"]');
    if (!triggerBtn) return { error: 'Easter egg trigger button not found' };

    // Scroll trigger button into view so ScrollTrigger reveals it
    triggerBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 500));

    // Explicitly focus trigger before opening, matching real user keyboard/click interaction
    triggerBtn.focus();

    // 1. Open Easter egg modal
    triggerBtn.click();
    await new Promise(r => setTimeout(r, 200));

    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    const canvas = modal ? modal.querySelector('canvas') : null;
    const channel1Btn = modal ? modal.querySelector('button[aria-label*="Channel 1"]') : null;
    const channel2Btn = modal ? modal.querySelector('button[aria-label*="Channel 2"]') : null;
    const channel3Btn = modal ? modal.querySelector('button[aria-label*="Channel 3"]') : null;
    const bodyScrollLocked = document.body.style.overflow === 'hidden';

    // 2. Test switching to Channel 2 (Developer Notes)
    channel2Btn?.click();
    await new Promise(r => setTimeout(r, 100));
    const hasNotesTitle = !!modal?.querySelector('#easter-egg-title');

    // 3. Test Escape key dismissal & focus restoration
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));

    const modalAfterEsc = document.querySelector('[role="dialog"][aria-modal="true"]');
    const bodyScrollRestored = document.body.style.overflow === '';
    const activeEl = document.activeElement;
    const focusRestored = activeEl === triggerBtn;

    return {
      modalOpenedOnTrigger: !!modal,
      canvasPongGamePresent: !!canvas,
      allThreeChannelsPresent: !!(channel1Btn && channel2Btn && channel3Btn),
      bodyScrollLockedOnOpen: bodyScrollLocked,
      channelSwitchSuccessful: hasNotesTitle,
      closedOnEscapeKey: !modalAfterEsc,
      bodyScrollRestored,
      activeElementTag: activeEl?.tagName,
      activeElementAria: activeEl?.getAttribute('aria-label'),
      focusRestoredToTrigger: focusRestored
    };
  })()
`);
console.log('Retro CRT Channel Surfing & Pong Mini-Game Check:', easterEggAudit);

// -----------------------------------------------------------------
// AUDIT 7: Console Errors & Runtime Exceptions Audit
// -----------------------------------------------------------------
console.log('\n--- TEST 7: Page Errors & Console Log Audit ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length, consoleLogs);

console.log('\n================================================================');
console.log('      VERIFICATION AUDIT OF NEW MOTION & AUDIO SUITE COMPLETED   ');
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
