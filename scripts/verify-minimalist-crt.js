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

const PORT = 4199;
const DEBUG_PORT = 9579;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-minimalist-${Date.now()}`);
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

await sendCommand('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false });

// Wait for initial render and skip boot sequence
await new Promise((r) => setTimeout(r, 1200));
await evalInPage(`
  (() => {
    const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
    if (skipBtn) skipBtn.click();
  })()
`);
await new Promise((r) => setTimeout(r, 600));

console.log('====================================================');
console.log('   MINIMALIST CRT VIEWPORT & HYBRID TYPOGRAPHY AUDIT');
console.log('====================================================\n');

// 1. Audit Level 1 Stage Container & CRT Monitor Architecture
console.log('--- TEST 1: Level 1 CRT Monitor & Stage Architecture ---');
const viewportTest = await evalInPage(`
  (() => {
    const room = document.querySelector('[data-testid="crt-monitor-room"]');
    const stage = document.querySelector('[data-testid="crt-diorama-stage"]');
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const commandMenu = document.querySelector('[data-testid="retro-command-menu"]');
    const previewWindow = document.querySelector('[data-testid="retro-os-window"]');
    const mainContent = document.querySelector('#main-content');
    
    // Attempt window scrolling
    window.scrollTo(0, 500);
    const scrollYAfterScroll = window.scrollY;
    
    return {
      hasRoom: !!room,
      hasStage: !!stage,
      hasDeskLine: !!deskLine,
      hasCommandMenu: !!commandMenu,
      hasPreviewWindow: !!previewWindow,
      hasCyberdeckBar: !!document.querySelector('.retro-command-bar'),
      hasShutterSectionStack: !!document.querySelector('.shutter-section-stack'),
      mainStyle: mainContent ? mainContent.getAttribute('style') : '',
      scrollYAfterScroll,
      isNonScrolling: scrollYAfterScroll === 0
    };
  })()
`);
console.log('Stage & Shell Elements:', viewportTest);

// 2. Audit Home State Negative Space & Phosphor Palette
console.log('\n--- TEST 2: Phosphor Palette & Home State Negative Space ---');
const paletteTest = await evalInPage(`
  (() => {
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    const greeting = document.querySelector('[data-testid="crt-typewriter-greeting"]');
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const screenRect = screen.getBoundingClientRect();
    const deskLineRect = deskLine.getBoundingClientRect();
    
    const voidHeight = deskLineRect.top - screenRect.top;
    const voidPercentage = (voidHeight / screenRect.height) * 100;
    
    return {
      screenBg: window.getComputedStyle(screen).backgroundColor,
      greetingColor: window.getComputedStyle(greeting).color,
      deskLineBg: window.getComputedStyle(deskLine).backgroundColor,
      screenHeight: screenRect.height,
      voidHeight,
      voidPercentage: Math.round(voidPercentage),
      hasAmpleNegativeSpace: voidPercentage >= 45 && voidPercentage <= 65
    };
  })()
`);
console.log('Palette & Negative Space:', paletteTest);

// 3. Audit Hybrid Typography in About, Projects, and Resume Views
console.log('\n--- TEST 3: Hybrid Typography (Press Start 2P, JetBrains Mono, Plus Jakarta Sans) ---');
// Skip boot sequence if present
await evalInPage(`
  const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
  if (skipBtn) skipBtn.click();
`);
await new Promise((r) => setTimeout(r, 600));

// Open About view
await evalInPage(`
  const aboutBtn = document.querySelector('[data-testid="retro-command-item-about"]');
  if (aboutBtn) aboutBtn.click();
`);
await new Promise((r) => setTimeout(r, 500));

const aboutTypography = await evalInPage(`
  (() => {
    const bioHeading = document.querySelector('[data-testid="retro-content-about"] .font-pixel');
    const bioParagraph = document.querySelector('[data-testid="retro-content-about"] .font-body');
    const metadataTag = document.querySelector('[data-testid="retro-content-about"] .font-mono');
    
    return {
      headingFont: bioHeading ? window.getComputedStyle(bioHeading).fontFamily : '',
      paragraphFont: bioParagraph ? window.getComputedStyle(bioParagraph).fontFamily : '',
      paragraphFontSize: bioParagraph ? window.getComputedStyle(bioParagraph).fontSize : '',
      paragraphLineHeight: bioParagraph ? window.getComputedStyle(bioParagraph).lineHeight : '',
      metadataFont: metadataTag ? window.getComputedStyle(metadataTag).fontFamily : ''
    };
  })()
`);
console.log('About View Typography:', aboutTypography);

// Open Projects view
await evalInPage(`
  const projectsBtn = document.querySelector('[data-testid="retro-window-tab-projects"]') || document.querySelector('[data-testid="retro-command-item-projects"]');
  if (projectsBtn) projectsBtn.click();
`);
await new Promise((r) => setTimeout(r, 500));

const projectsTypography = await evalInPage(`
  (() => {
    const caseStudyDesc = document.querySelector('[data-testid="retro-content-projects"] .font-body');
    const readBtn = document.querySelector('[data-testid^="retro-btn-read-case-study"]');
    
    return {
      caseStudyFont: caseStudyDesc ? window.getComputedStyle(caseStudyDesc).fontFamily : '',
      caseStudyFontSize: caseStudyDesc ? window.getComputedStyle(caseStudyDesc).fontSize : '',
      caseStudyLineHeight: caseStudyDesc ? window.getComputedStyle(caseStudyDesc).lineHeight : '',
      buttonFont: readBtn ? window.getComputedStyle(readBtn).fontFamily : ''
    };
  })()
`);
console.log('Projects View Typography:', projectsTypography);

// 4. Audit 1-Click Compact Mac Sprite Phosphor Toggle & Clean Hardware Bezel Controls
console.log('\n--- TEST 4: 1-Click Compact Mac Phosphor Mode Toggle & Bezel Buttons ---');
const bezelButtons = await evalInPage(`
  (() => {
    const buttons = Array.from(document.querySelectorAll('aside button')).map(b => b.innerText.trim().toUpperCase());
    return buttons;
  })()
`);
console.log('Bezel buttons:', bezelButtons);

// Click Compact Mac sprite to switch to Amber
await evalInPage(`
  (() => {
    const macSprite = document.querySelector('[data-testid="compact-mac-sprite"]');
    macSprite?.click();
  })()
`);
await new Promise((r) => setTimeout(r, 200));

const amberColors = await evalInPage(`
  (() => {
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const greeting = document.querySelector('[data-testid="crt-typewriter-greeting"]');
    return {
      deskLineColor: deskLine ? window.getComputedStyle(deskLine).backgroundColor : '',
      greetingColor: greeting ? window.getComputedStyle(greeting).color : ''
    };
  })()
`);

// Click Compact Mac sprite to switch back to Sage
await evalInPage(`
  (() => {
    const macSprite = document.querySelector('[data-testid="compact-mac-sprite"]');
    macSprite?.click();
  })()
`);
await new Promise((r) => setTimeout(r, 200));

const sageColors = await evalInPage(`
  (() => {
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const greeting = document.querySelector('[data-testid="crt-typewriter-greeting"]');
    return {
      deskLineColor: deskLine ? window.getComputedStyle(deskLine).backgroundColor : '',
      greetingColor: greeting ? window.getComputedStyle(greeting).color : ''
    };
  })()
`);

const macToggleTest = {
  bezelButtons,
  isCleanBezel: bezelButtons.includes('SOUND') && bezelButtons.includes('POWER') && bezelButtons.length === 2,
  amberColors,
  sageColors,
};
console.log('Compact Mac Phosphor Toggle & Bezel Test:', macToggleTest);

const passed = (
  viewportTest.hasRoom &&
  viewportTest.hasStage &&
  viewportTest.hasDeskLine &&
  viewportTest.hasCommandMenu &&
  viewportTest.hasPreviewWindow &&
  viewportTest.isNonScrolling &&
  paletteTest.hasAmpleNegativeSpace &&
  aboutTypography.paragraphFont.includes('Plus Jakarta Sans') &&
  (aboutTypography.paragraphFontSize === '14.5px' || aboutTypography.paragraphFontSize === '15.5px') &&
  projectsTypography.caseStudyFont.includes('Plus Jakarta Sans') &&
  Boolean(projectsTypography.caseStudyFontSize) &&
  macToggleTest.isCleanBezel &&
  macToggleTest.amberColors.deskLineColor === 'rgb(140, 104, 48)' &&
  macToggleTest.amberColors.greetingColor === 'rgb(212, 163, 89)' &&
  pageErrors.length === 0
);

console.log('\n====================================================');
console.log(`FINAL VERIFICATION RESULT: ${passed ? 'ALL CHECKS PASSED (100%)' : 'SOME CHECKS FAILED'}`);
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
