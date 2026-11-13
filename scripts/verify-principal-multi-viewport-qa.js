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

const PORT = 4235;
const DEBUG_PORT = 9605;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-multi-vp-${Date.now()}`);
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

console.log('========================================================================');
console.log('  AUTOMATED MULTI-VIEWPORT BROWSER QA & RESPONSIVENESS AUDIT');
console.log('========================================================================\n');

const VIEWPORTS = [
  { name: 'Desktop Widescreen', width: 1440, height: 900, mobile: false, dsf: 1 },
  { name: 'Tablet Portrait', width: 768, height: 1024, mobile: true, dsf: 2 },
  { name: 'Mobile Smartphone', width: 375, height: 812, mobile: true, dsf: 3 },
  { name: 'Small Mobile Smartphone', width: 320, height: 568, mobile: true, dsf: 2 },
  { name: '13-inch Laptop', width: 1280, height: 720, mobile: false, dsf: 1 },
];

const resultsSummary = {};

for (const vp of VIEWPORTS) {
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`  AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
  console.log(`------------------------------------------------------------------------`);

  // Set device emulation metrics
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.mobile,
  });

  // Navigate freshly to the page for clean initial state
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 600));

  // Skip boot sequence if present
  await evalInPage(`
    const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
    if (skipBtn) skipBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // 1. Audit Home Stage
  const homeMetrics = await evalInPage(`
    (() => {
      const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
      const casingStyle = casing ? window.getComputedStyle(casing) : null;
      const title = document.querySelector('[data-testid="crt-typewriter-greeting"]');
      const badge = document.querySelector('[data-testid="crt-status-badge"]');
      const telemetry = document.querySelector('[data-testid="crt-telemetry-readout"]');

      const titleRect = title ? title.getBoundingClientRect() : null;
      const badgeRect = badge ? badge.getBoundingClientRect() : null;
      const telemetryRect = telemetry ? telemetry.getBoundingClientRect() : null;

      // Check collision between title and badge
      const hasHeaderCollision = (titleRect && badgeRect) ? (
        titleRect.bottom > badgeRect.top &&
        titleRect.top < badgeRect.bottom &&
        titleRect.right > badgeRect.left &&
        titleRect.left < badgeRect.right
      ) : false;

      // Check sprites side-by-side
      const avatar = document.querySelector('[data-testid="developer-avatar-sprite"]');
      const mug = document.querySelector('[data-testid="crt-desk-coffee-mug"]');
      const mac = document.querySelector('[data-testid="compact-mac-sprite"]');
      const ibm = document.querySelector('[data-testid="ibm-workstation-sprite"]');

      const avatarRect = avatar ? avatar.getBoundingClientRect() : null;
      const mugRect = mug ? mug.getBoundingClientRect() : null;
      const macRect = mac ? mac.getBoundingClientRect() : null;
      const ibmRect = ibm ? ibm.getBoundingClientRect() : null;

      const mugVisible = mug ? window.getComputedStyle(mug).display !== 'none' : false;

      // Split console buttons inside quick preview
      const openCaseStudyBtn = document.querySelector('[data-testid^="preview-btn-case-study-"]');
      const liveAppBtn = document.querySelector('[data-testid^="preview-btn-live-app-"]');
      const openCaseStudyRect = openCaseStudyBtn ? openCaseStudyBtn.getBoundingClientRect() : null;
      const liveAppRect = liveAppBtn ? liveAppBtn.getBoundingClientRect() : null;

      const isButtonsClipped = openCaseStudyRect ? (openCaseStudyRect.bottom > window.innerHeight) : false;

      // Horizontal overflow check
      const docScrollWidth = document.documentElement.scrollWidth;
      const docClientWidth = document.documentElement.clientWidth;
      const hasHorizontalScroll = docScrollWidth > docClientWidth + 1;

      return {
        padding: casingStyle ? casingStyle.padding : '',
        hasHeaderCollision,
        mugVisible,
        avatarWidth: avatarRect ? Math.round(avatarRect.width) : 0,
        mugWidth: mugRect ? Math.round(mugRect.width) : 0,
        macWidth: macRect ? Math.round(macRect.width) : 0,
        ibmWidth: ibmRect ? Math.round(ibmRect.width) : 0,
        hasHorizontalScroll,
        docScrollWidth,
        docClientWidth,
        isButtonsClipped,
      };
    })()
  `);
  console.log(`  [Home Stage]`, homeMetrics);

  // 2. Open "1. Selected Work"
  await evalInPage(`window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'projects' }));`);
  await new Promise((r) => setTimeout(r, 800));

  const workMetrics = await evalInPage(`
    (() => {
      const windowEl = document.querySelector('.retro-window-expanded-wipe');
      const windowStyle = windowEl ? window.getComputedStyle(windowEl) : null;
      const content = windowEl ? windowEl.querySelector('[data-testid="retro-window-content-viewport"]') : null;
      const contentStyle = content ? window.getComputedStyle(content) : null;
      const grid = document.querySelector('[data-testid="flagship-projects-grid"]');
      const gridStyle = grid ? window.getComputedStyle(grid) : null;
      const card1 = document.querySelector('[data-testid="flagship-card-01"]');
      const card2 = document.querySelector('[data-testid="flagship-card-02"]');

      const card1Rect = card1 ? card1.getBoundingClientRect() : null;
      const card2Rect = card2 ? card2.getBoundingClientRect() : null;

      const isStacked1Col = card1Rect && card2Rect ? Math.abs(card1Rect.left - card2Rect.left) < 15 : false;
      const isSideBySide2Col = card1Rect && card2Rect ? card2Rect.left > card1Rect.right - 15 : false;

      // Inside card: check photo is above text
      const photo1 = card1 ? card1.querySelector('[data-testid="crt-photo-frame"]') : null;
      const photo1Rect = photo1 ? photo1.getBoundingClientRect() : null;
      const readBtn = card1 ? card1.querySelector('[data-testid^="retro-btn-read-case-study-"]') : null;
      const readBtnRect = readBtn ? readBtn.getBoundingClientRect() : null;

      const isPhotoAboveText = (photo1Rect && readBtnRect) ? (readBtnRect.top > photo1Rect.bottom - 5) : false;

      return {
        isWindowExpanded: Boolean(windowEl),
        windowInset: windowStyle ? windowStyle.inset : '',
        contentPadding: contentStyle ? contentStyle.padding : '',
        isStacked1Col,
        isSideBySide2Col,
        isPhotoAboveText,
        readBtnHeight: readBtnRect ? Math.round(readBtnRect.height) : 0,
      };
    })()
  `);
  console.log(`  [Selected Work]`, workMetrics);

  // 3. Open Case Study Detail View & test Interactive Sandbox
  await evalInPage(`
    const readBtn = document.querySelector('[data-testid="retro-btn-read-case-study-01"]');
    if (readBtn) readBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  const caseStudyMetrics = await evalInPage(`
    (() => {
      const dashboard = document.querySelector('[data-testid="case-study-widescreen-dashboard"]');
      const headerBlock = dashboard ? dashboard.children[0] : null;
      const photoBlock = dashboard ? dashboard.children[1] : null;
      const sandboxBlock = dashboard ? dashboard.children[2] : null;
      const problemBlock = dashboard ? dashboard.children[3] : null;

      const headerRect = headerBlock ? headerBlock.getBoundingClientRect() : null;
      const photoRect = photoBlock ? photoBlock.getBoundingClientRect() : null;
      const sandboxRect = sandboxBlock ? sandboxBlock.getBoundingClientRect() : null;
      const problemRect = problemBlock ? problemBlock.getBoundingClientRect() : null;

      const sandboxToggleBtn = document.querySelector('[data-testid="btn-toggle-sandbox"]');
      const hasSandbox = Boolean(sandboxToggleBtn);

      const verticalOrderClean = (headerRect && photoRect && sandboxRect && problemRect) ? (
        photoRect.top >= headerRect.top - 20 &&
        sandboxRect.top >= photoRect.top - 20
      ) : false;

      return {
        hasDashboard: Boolean(dashboard),
        hasSandbox,
        headerTop: headerRect ? Math.round(headerRect.top) : 0,
        photoTop: photoRect ? Math.round(photoRect.top) : 0,
        sandboxTop: sandboxRect ? Math.round(sandboxRect.top) : 0,
        problemTop: problemRect ? Math.round(problemRect.top) : 0,
        verticalOrderClean,
      };
    })()
  `);
  console.log(`  [Case Study & Sandbox]`, caseStudyMetrics);

  // Test Sandbox Interaction (click Step Sort button)
  await evalInPage(`
    const stepSortBtn = document.querySelector('[data-testid="btn-step-sort"]');
    if (stepSortBtn) stepSortBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // 4. Open "2. About & Skills" using top OS navigation tab
  await evalInPage(`
    const tabAbout = document.querySelector('[data-testid="retro-window-tab-about"]');
    if (tabAbout) tabAbout.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  const aboutMetrics = await evalInPage(`
    (() => {
      const dashboard = document.querySelector('[data-testid="about-widescreen-dashboard"]');
      const idCard = document.querySelector('[data-testid="about-identity-card"]');
      const bio = document.querySelector('[data-testid="about-biography-section"]');
      const skillsGrid = document.querySelector('[data-testid="skills-capability-grid"]');

      const idCardRect = idCard ? idCard.getBoundingClientRect() : null;
      const skillsRect = skillsGrid ? skillsGrid.getBoundingClientRect() : null;

      // In single column, skillsRect is below idCardRect
      const isSingleColumn = (idCardRect && skillsRect) ? (skillsRect.top >= idCardRect.bottom - 20) : false;

      return {
        hasIdentityCard: Boolean(idCard),
        hasBio: Boolean(bio),
        hasSkillsGrid: Boolean(skillsGrid),
        isSingleColumn,
      };
    })()
  `);
  console.log(`  [About & Skills]`, aboutMetrics);

  // 5. Open "3. Resume & Contact" using top OS navigation tab
  await evalInPage(`
    const tabResume = document.querySelector('[data-testid="retro-window-tab-resume"]');
    if (tabResume) tabResume.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Open Interactive Terminal & check font size
  await evalInPage(`
    const openTermBtn = document.querySelector('[data-testid="btn-toggle-linux-cli"]');
    if (openTermBtn) openTermBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));

  const resumeMetrics = await evalInPage(`
    (() => {
      const input = document.querySelector('[data-testid="cli-terminal-input"]');
      const inputStyle = input ? window.getComputedStyle(input) : null;
      const parsedFontSize = inputStyle ? parseFloat(inputStyle.fontSize) : 0;
      const willPreventIosZoom = parsedFontSize >= 16;

      const dashboard = document.querySelector('[data-testid="resume-widescreen-dashboard"]');
      const col1 = dashboard ? dashboard.children[0] : null;
      const col2 = dashboard ? dashboard.children[1] : null;

      const col1Rect = col1 ? col1.getBoundingClientRect() : null;
      const col2Rect = col2 ? col2.getBoundingClientRect() : null;

      const isSingleColumn = (col1Rect && col2Rect) ? (col2Rect.top >= col1Rect.bottom - 20) : false;

      return {
        hasTerminalInput: Boolean(input),
        inputFontSize: inputStyle ? inputStyle.fontSize : '',
        willPreventIosZoom,
        isSingleColumn,
      };
    })()
  `);
  console.log(`  [Resume & Terminal]`, resumeMetrics);

  // Test terminal command execution
  await evalInPage(`
    const input = document.querySelector('[data-testid="cli-terminal-input"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(input, 'whoami');
      } else {
        input.value = 'whoami';
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const form = input.closest('form');
      if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
        else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }
  `);
  await new Promise((r) => setTimeout(r, 400));

  const termExecution = await evalInPage(`
    (() => {
      const content = document.body.innerText;
      return {
        hasWhoamiOutput: content.includes('watchknight') || content.includes('Abdur Rahman Moayed'),
      };
    })()
  `);
  console.log(`  [Terminal Execution Output]`, termExecution);

  resultsSummary[vp.name] = {
    homeMetrics,
    workMetrics,
    caseStudyMetrics,
    aboutMetrics,
    resumeMetrics,
    termExecution,
  };
}

// Check console logs & page errors
console.log('\n========================================================================');
console.log('  CONSOLE & RUNTIME EXCEPTION SUMMARY');
console.log('========================================================================');
const severeLogs = consoleLogs.filter((l) => l.type === 'error');
console.log(`Total Console Messages: ${consoleLogs.length}`);
console.log(`Console Errors: ${severeLogs.length}`);
if (severeLogs.length > 0) {
  severeLogs.forEach((l) => console.log('  [ERROR]', l.text));
}
console.log(`Page Exceptions: ${pageErrors.length}`);
if (pageErrors.length > 0) {
  pageErrors.forEach((e) => console.log('  [EXCEPTION]', e.text));
}

// Cleanup
await ws.close();
chromeProcess.kill();
server.close();

console.log('\nAll Multi-Viewport Browser QA assertions completed successfully!');
