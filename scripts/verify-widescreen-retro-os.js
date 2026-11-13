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

const PORT = 4226;
const DEBUG_PORT = 9606;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-widescreen-${Date.now()}`);
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

const pageErrors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }

  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(msg.params.exceptionDetails);
  }
};

await new Promise((resolve) => {
  ws.onopen = resolve;
});

await sendCommand('Runtime.enable');
await sendCommand('Page.enable');
await sendCommand('DOM.enable');

async function evaluate(expression) {
  const res = await sendCommand('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.text || 'Eval error');
  }
  return res.result.value;
}

async function setViewport(width, height) {
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await new Promise((r) => setTimeout(r, 400));
}

console.log('Testing Widescreen Layout in Real Headless Chrome...');

// Wait for app load
await evaluate(`
  new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  })
`);
await new Promise((r) => setTimeout(r, 500));

// ============================================================================
// TEST 1: 1920x1080 (FULL WIDESCREEN DESKTOP)
// ============================================================================
console.log('\n--- VIEWPORT 1920x1080 ---');
await setViewport(1920, 1080);

// Open RetroOS Window expanded into Projects
await evaluate(`
  (() => {
    window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'projects' }));
    return true;
  })()
`);
await new Promise((r) => setTimeout(r, 500));

const windowMetrics1920 = await evaluate(`
  (() => {
    const win = document.querySelector('[data-testid="retro-os-window"]');
    const glass = document.querySelector('.crt-glass-screen');
    const viewport = document.querySelector('[data-testid="retro-window-content-viewport"]');
    const grid = document.querySelector('[data-testid="flagship-projects-grid"]');
    const cards = document.querySelectorAll('[data-testid^="flagship-card-"]');
    
    if (!win || !glass || !viewport) return { error: 'Window or glass not found' };

    const winRect = win.getBoundingClientRect();
    const glassRect = glass.getBoundingClientRect();
    const viewportStyle = window.getComputedStyle(viewport);
    const winStyle = window.getComputedStyle(win);

    const firstCard = cards[0];
    let cardSplit = null;
    let cardTagline = null;
    if (firstCard) {
      const leftCol = firstCard.children[0];
      const rightCol = firstCard.children[1];
      const cardRect = firstCard.getBoundingClientRect();
      const leftRect = leftCol.getBoundingClientRect();
      const rightRect = rightCol.getBoundingClientRect();
      cardSplit = {
        cardWidth: cardRect.width,
        leftWidth: leftRect.width,
        rightWidth: rightRect.width,
        leftRatio: Math.round((leftRect.width / cardRect.width) * 100),
        rightRatio: Math.round((rightRect.width / cardRect.width) * 100),
      };
      const taglineEl = rightCol.querySelector('.font-mono.font-semibold');
      cardTagline = taglineEl ? taglineEl.textContent.trim() : null;
    }

    return {
      glass: { width: glassRect.width, height: glassRect.height },
      window: {
        width: winRect.width,
        height: winRect.height,
        left: winRect.left - glassRect.left,
        top: winRect.top - glassRect.top,
        right: glassRect.right - winRect.right,
        bottom: glassRect.bottom - winRect.bottom,
        position: winStyle.position,
        display: winStyle.display,
        flexDirection: winStyle.flexDirection,
      },
      viewport: {
        paddingTop: viewportStyle.paddingTop,
        paddingBottom: viewportStyle.paddingBottom,
        paddingLeft: viewportStyle.paddingLeft,
        paddingRight: viewportStyle.paddingRight,
        clientWidth: viewport.clientWidth,
        scrollWidth: viewport.scrollWidth,
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
      },
      flagshipCardCount: cards.length,
      cardTagline,
      cardSplit,
    };
  })()
`);
console.log('1920x1080 Window & Projects Grid Metrics:', JSON.stringify(windowMetrics1920, null, 2));

// Test Case Study Detail View at 1920x1080 (BitForge)
await evaluate(`
  (() => {
    const btn = document.querySelector('[data-testid="retro-btn-read-case-study-01"]');
    if (btn) btn.click();
  })()
`);
await new Promise((r) => setTimeout(r, 400));

const detailMetrics1920 = await evaluate(`
  (() => {
    const dashboard = document.querySelector('[data-testid="case-study-widescreen-dashboard"]');
    if (!dashboard) return { error: 'Dashboard not found' };

    const style = window.getComputedStyle(dashboard);
    const leftCol = dashboard.children[0];
    const rightCol = dashboard.children[1];
    const leftRect = leftCol.getBoundingClientRect();
    const rightRect = rightCol.getBoundingClientRect();

    const problemP = leftCol.querySelector('p');
    const problemStyle = problemP ? window.getComputedStyle(problemP) : null;

    const sandbox = dashboard.querySelector('[data-testid="interactive-demo-sandbox"]');
    const autoSortBtn = sandbox ? sandbox.querySelector('[data-testid="btn-auto-sort"]') : null;

    return {
      gridCols: style.gridTemplateColumns,
      gap: style.gap,
      leftWidth: leftRect.width,
      rightWidth: rightRect.width,
      problemFont: problemStyle ? problemStyle.fontFamily : null,
      problemFontSize: problemStyle ? problemStyle.fontSize : null,
      hasMicroSandbox: !!sandbox,
      hasAutoSortBtn: !!autoSortBtn,
    };
  })()
`);
console.log('1920x1080 Case Study Detail View Metrics:', JSON.stringify(detailMetrics1920, null, 2));

// Test Micro-sandbox interaction: Trigger sort
await evaluate(`
  (() => {
    const btn = document.querySelector('[data-testid="btn-auto-sort"]');
    if (btn) btn.click();
  })()
`);
await new Promise((r) => setTimeout(r, 500));

// Test rapid maximize / restore toggle while sandbox is running
await evaluate(`
  (() => {
    const maxBtn = document.querySelector('[data-testid="retro-window-btn-max"]');
    if (maxBtn) {
      maxBtn.click(); // restore
      setTimeout(() => {
        const expandAgain = document.querySelector('[data-testid="retro-btn-read-case-study-01"]');
        if (expandAgain) expandAgain.click();
      }, 100);
    }
  })()
`);
await new Promise((r) => setTimeout(r, 400));

// Switch to About Tab at 1920x1080
await evaluate(`
  (() => {
    const aboutTab = document.querySelector('[data-testid="retro-window-tab-about"]');
    if (aboutTab) aboutTab.click();
  })()
`);
await new Promise((r) => setTimeout(r, 400));

const aboutMetrics1920 = await evaluate(`
  (() => {
    const dashboard = document.querySelector('[data-testid="about-widescreen-dashboard"]');
    const viewport = document.querySelector('[data-testid="retro-window-content-viewport"]');
    if (!dashboard || !viewport) return { error: 'About dashboard or viewport not found' };

    const leftCol = dashboard.children[0];
    const rightCol = dashboard.children[1];
    const leftRect = leftCol.getBoundingClientRect();
    const rightRect = rightCol.getBoundingClientRect();

    const capabilityGrid = dashboard.querySelector('[data-testid="skills-capability-grid"]');
    const capColumns = capabilityGrid ? capabilityGrid.querySelectorAll('[data-testid^="capability-column-"]') : [];

    return {
      leftWidth: leftRect.width,
      rightWidth: rightRect.width,
      widthRatio: Math.round((leftRect.width / (leftRect.width + rightRect.width)) * 100) + ' / ' + Math.round((rightRect.width / (leftRect.width + rightRect.width)) * 100),
      capColumnsCount: capColumns.length,
      viewportClientHeight: viewport.clientHeight,
      viewportScrollHeight: viewport.scrollHeight,
      hasVerticalScroll: viewport.scrollHeight > viewport.clientHeight,
    };
  })()
`);
console.log('1920x1080 About View Metrics:', JSON.stringify(aboutMetrics1920, null, 2));

// Switch to Resume Tab at 1920x1080
await evaluate(`
  (() => {
    const resumeTab = document.querySelector('[data-testid="retro-window-tab-resume"]');
    if (resumeTab) resumeTab.click();
  })()
`);
await new Promise((r) => setTimeout(r, 400));

const resumeMetrics1920 = await evaluate(`
  (() => {
    const actionBar = document.querySelector('[data-testid="retro-resume-action-bar"]');
    const dashboard = document.querySelector('[data-testid="resume-widescreen-dashboard"]');
    if (!actionBar || !dashboard) return { error: 'Resume action bar or dashboard not found' };

    const actionBtns = actionBar.querySelectorAll('button, a');
    const leftCol = dashboard.children[0];
    const rightCol = dashboard.children[1];
    const leftRect = leftCol.getBoundingClientRect();
    const rightRect = rightCol.getBoundingClientRect();

    return {
      actionButtonCount: actionBtns.length,
      buttons: Array.from(actionBtns).map(b => b.textContent.trim()),
      leftWidth: leftRect.width,
      rightWidth: rightRect.width,
    };
  })()
`);
console.log('1920x1080 Resume View Metrics:', JSON.stringify(resumeMetrics1920, null, 2));

// Test Interactive Terminal in Resume Tab: Open terminal and execute command
const terminalTest = await evaluate(`
  (() => {
    const toggleBtn = document.querySelector('[data-testid="btn-toggle-linux-cli"]');
    if (toggleBtn) toggleBtn.click();
    return true;
  })()
`);
await new Promise((r) => setTimeout(r, 200));

await evaluate(`
  (() => {
    const whoamiChip = document.querySelector('[data-testid="cli-chip-whoami"]');
    if (whoamiChip) whoamiChip.click();
  })()
`);
await new Promise((r) => setTimeout(r, 200));

const cliExecution = await evaluate(`
  (() => {
    const cli = document.querySelector('[data-testid="interactive-linux-cli"]');
    return {
      isOpen: !!cli,
      text: cli ? cli.textContent : '',
    };
  })()
`);
console.log('Interactive Terminal Execution:', { isOpen: cliExecution.isOpen, hasWhoamiOutput: cliExecution.text.includes('Abdur Rahman Moayed') });

// ============================================================================
// TEST 2: 1440x900 (STANDARD WIDESCREEN LAPTOP)
// ============================================================================
console.log('\n--- VIEWPORT 1440x900 ---');
await setViewport(1440, 900);
await new Promise((r) => setTimeout(r, 500));

const metrics1440 = await evaluate(`
  (() => {
    const win = document.querySelector('[data-testid="retro-os-window"]');
    const glass = document.querySelector('.crt-glass-screen');
    const viewport = document.querySelector('[data-testid="retro-window-content-viewport"]');
    
    const winRect = win.getBoundingClientRect();
    const glassRect = glass.getBoundingClientRect();

    return {
      glass: { width: glassRect.width, height: glassRect.height },
      window: {
        width: winRect.width,
        height: winRect.height,
        left: winRect.left - glassRect.left,
        top: winRect.top - glassRect.top,
        right: glassRect.right - winRect.right,
        bottom: glassRect.bottom - winRect.bottom,
      },
      viewport: {
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
        hasVerticalScroll: viewport.scrollHeight > viewport.clientHeight,
      }
    };
  })()
`);
console.log('1440x900 Metrics:', JSON.stringify(metrics1440, null, 2));

// ============================================================================
// TEST 3: 375x812 (MOBILE VIEWPORT)
// ============================================================================
console.log('\n--- VIEWPORT 375x812 (MOBILE) ---');
await setViewport(375, 812);
await new Promise((r) => setTimeout(r, 500));

// Switch to Projects tab on mobile
await evaluate(`
  (() => {
    const projectsTab = document.querySelector('[data-testid="retro-window-tab-projects"]');
    if (projectsTab) projectsTab.click();
  })()
`);
await new Promise((r) => setTimeout(r, 400));

const metrics375 = await evaluate(`
  (() => {
    const docWidth = document.documentElement.offsetWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const hasHorizontalOverflow = bodyScrollWidth > docWidth;
    
    const win = document.querySelector('[data-testid="retro-os-window"]');
    const winRect = win ? win.getBoundingClientRect() : null;

    const cards = document.querySelectorAll('[data-testid^="flagship-card-"]');
    let firstCardStacked = false;
    if (cards[0]) {
      const leftCol = cards[0].children[0];
      const rightCol = cards[0].children[1];
      const leftRect = leftCol.getBoundingClientRect();
      const rightRect = rightCol.getBoundingClientRect();
      firstCardStacked = rightRect.top >= leftRect.bottom;
    }

    return {
      docWidth,
      bodyScrollWidth,
      hasHorizontalOverflow,
      firstCardStacked,
      winRect: winRect ? { width: winRect.width, height: winRect.height } : null,
    };
  })()
`);
console.log('375x812 Mobile Metrics:', JSON.stringify(metrics375, null, 2));

console.log('\nPage Errors:', pageErrors);
const success = pageErrors.length === 0;

ws.close();
chromeProcess.kill();
server.close();
process.exit(success ? 0 : 1);
