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

const PORT = 4220;
const DEBUG_PORT = 9600;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-boost-${Date.now()}`);
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

await sendCommand('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });

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
console.log('    LEVEL 1 CRT HOME STAGE /boost AUDIT (HEADLESS)  ');
console.log('====================================================\n');

// TEST 1: Top Greeting, Positioning Line, Dhaka Live Clock
console.log('--- TEST 1: Top Greeting, 15px Positioning Line & Dhaka Clock ---');
const headerTest = await evalInPage(`
  (() => {
    const header = document.querySelector('header');
    const greeting = document.querySelector('[data-testid="crt-typewriter-greeting"]');
    const cursor = document.querySelector('[data-testid="crt-blinking-cursor"]');
    const posLine = document.querySelector('[data-testid="crt-positioning-line"]');
    const clock = document.querySelector('[data-testid="crt-telemetry-readout"]');

    const headerStyle = header ? window.getComputedStyle(header) : null;
    const posStyle = posLine ? window.getComputedStyle(posLine) : null;
    const greetingStyle = greeting ? window.getComputedStyle(greeting) : null;

    return {
      hasHeader: !!header,
      padding: headerStyle ? headerStyle.padding : '',
      greetingText: greeting ? greeting.innerText.trim() : '',
      hasCursor: !!cursor,
      cursorText: cursor ? cursor.innerText : '',
      greetingFont: greetingStyle ? greetingStyle.fontFamily : '',
      posText: posLine ? posLine.innerText.trim() : '',
      posFont: posStyle ? posStyle.fontFamily : '',
      posFontSize: posStyle ? posStyle.fontSize : '',
      posColor: posStyle ? posStyle.color : '',
      clockText: clock ? clock.innerText.trim() : '',
      noCommandPromptSubheader: !document.body.innerText.includes('COMMAND PROMPT // INITIALIZING'),
      noSys96Subheader: !header.innerText.includes('SYS.96')
    };
  })()
`);
console.log('Header & Positioning Line Audit:', headerTest);

// TEST 2: Center Stage Unboxing, 2px Desk Line & Negative Space
console.log('\n--- TEST 2: Unboxed Sprites, 2px Desk Line & 50% Negative Space ---');
const stageTest = await evalInPage(`
  (() => {
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    const deskLine = document.querySelector('[data-testid="crt-horizontal-desk-line"]');
    const avatar = document.querySelector('[data-testid="developer-avatar-sprite"]');
    const mac = document.querySelector('[data-testid="compact-mac-sprite"]');
    const ibm = document.querySelector('[data-testid="ibm-workstation-sprite"]');

    const screenRect = screen ? screen.getBoundingClientRect() : { top: 0, height: 1 };
    const deskLineRect = deskLine ? deskLine.getBoundingClientRect() : { top: 0, height: 2 };

    const voidHeight = deskLineRect.top - screenRect.top;
    const voidPercentage = Math.round((voidHeight / screenRect.height) * 100);

    const deskLineStyle = deskLine ? window.getComputedStyle(deskLine) : null;

    // Check SVG shape-rendering attribute
    const svgElements = [
      avatar?.querySelector('svg')?.getAttribute('shape-rendering'),
      mac?.querySelector('svg')?.getAttribute('shape-rendering'),
      ibm?.querySelector('svg')?.getAttribute('shape-rendering')
    ];

    // Check corner brackets elements
    const avatarBrackets = document.querySelector('[data-testid="avatar-corner-brackets"]');
    const macBrackets = document.querySelector('[data-testid="mac-corner-brackets"]');
    const ibmBrackets = document.querySelector('[data-testid="ibm-corner-brackets"]');

    return {
      voidPercentage,
      has50PercentNegativeSpace: voidPercentage >= 50,
      deskLineHeight: deskLineRect.height,
      deskLineBg: deskLineStyle ? deskLineStyle.backgroundColor : '',
      allCrispEdges: svgElements.every(sr => sr === 'crispEdges'),
      hasAvatarBrackets: !!avatarBrackets,
      hasMacBrackets: !!macBrackets,
      hasIbmBrackets: !!ibmBrackets
    };
  })()
`);
console.log('Center Stage Unboxing & Desk Line Audit:', stageTest);

// TEST 3: Sprite Interactive Hover Tooltips & Click Actions
console.log('\n--- TEST 3: Sprite Hover Tooltips & Click Affordances ---');
const spriteInteractions = await evalInPage(`
  (async () => {
    // 1. Check Tooltip texts
    const avatarTooltip = document.querySelector('[data-testid="avatar-hover-tooltip"]')?.innerText.trim();
    const macTooltip = document.querySelector('[data-testid="mac-hover-tooltip"]')?.innerText.trim();
    const ibmTooltip = document.querySelector('[data-testid="ibm-hover-tooltip"]')?.innerText.trim();

    // 2. Click Avatar -> Should render wave frame
    const avatarBtn = document.querySelector('[data-testid="developer-avatar-sprite"]');
    avatarBtn.click();
    await new Promise(r => setTimeout(r, 100));
    const waveFrame = document.querySelector('[data-testid="avatar-wave-frame"]');

    // 3. Click Mac -> Should switch phosphor mode
    const deskLineBefore = window.getComputedStyle(document.querySelector('[data-testid="crt-horizontal-desk-line"]')).backgroundColor;
    const macBtn = document.querySelector('[data-testid="compact-mac-sprite"]');
    macBtn.click();
    await new Promise(r => setTimeout(r, 200));
    const deskLineAfter = window.getComputedStyle(document.querySelector('[data-testid="crt-horizontal-desk-line"]')).backgroundColor;

    // Click Mac again to revert
    macBtn.click();
    await new Promise(r => setTimeout(r, 200));

    return {
      avatarTooltip,
      macTooltip,
      ibmTooltip,
      avatarWavedOnClick: !!waveFrame,
      macToggledPhosphor: deskLineBefore !== deskLineAfter,
      sageColor: deskLineBefore,
      amberColor: deskLineAfter
    };
  })()
`);
console.log('Sprite Interactions Audit:', spriteInteractions);

// TEST 4: Self-Sufficient Level 1 Console: Selector & Quick Preview Window
console.log('\n--- TEST 4: Level 1 Split Console, Quick Preview & 1-Click CTAs ---');
const splitConsoleTest = await evalInPage(`
  (async () => {
    try {
      // Window Titlebar
      const titlebar = document.querySelector('[data-testid="retro-window-titlebar"]');
      const titleText = document.querySelector('[data-testid="retro-window-title-text"]')?.innerText.trim();
      const minBtn = document.querySelector('[data-testid="retro-window-btn-minimize"]');
      const maxBtn = document.querySelector('[data-testid="retro-window-btn-maximize"]');
      const closeBtn = document.querySelector('[data-testid="retro-window-btn-close"]');
      const scrollbar = document.querySelector('[data-testid="retro-pixel-scrollbar"]');

      // Command menu items
      const item1 = document.querySelector('[data-testid="retro-command-item-projects"]');
      const item2 = document.querySelector('[data-testid="retro-command-item-about"]');
      const item3 = document.querySelector('[data-testid="retro-command-item-resume"]');

      // 1. Test Item 1 Preview: Selected Work
      if (item1) {
        item1.focus();
        item1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 200));
      const projectsView = document.querySelector('[data-testid="quick-view-projects"]');
      const projectNames = Array.from(document.querySelectorAll('[data-testid^="quick-view-project-"] .font-pixel')).map(el => el.innerText.trim());
      const inspectPrompt = document.querySelector('[data-testid="quick-view-inspect-prompt"]')?.innerText.trim();

      // 2. Test Item 2 Preview: About & Skills
      if (item2) {
        item2.focus();
        item2.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 200));
      const aboutView = document.querySelector('[data-testid="quick-view-about"]');
      const aboutBio = aboutView?.querySelector('p')?.innerText.trim();
      const coreBadges = Array.from(aboutView?.querySelectorAll('.flex-wrap span') || []).map(el => el.innerText.trim());

      // 3. Test Item 3 Preview: Resume & Contact
      if (item3) {
        item3.focus();
        item3.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 200));
      const copyEmailBtn = document.querySelector('[data-testid="btn-copy-email"]');
      const linkedInLink = document.querySelector('[data-testid="btn-linkedin-link"]');
      const gitHubLink = document.querySelector('[data-testid="btn-github-link"]');
      const downloadResumeLink = document.querySelector('[data-testid="btn-download-cv"]');

      // Test Copy Email 1-click interaction
      const copyInitialText = copyEmailBtn?.innerText.trim();
      if (copyEmailBtn) copyEmailBtn.click();
      await new Promise(r => setTimeout(r, 100));
      const copyAfterText = copyEmailBtn?.innerText.trim();

      return {
        windowTitle: titleText,
        hasControls: !!(minBtn && maxBtn && closeBtn),
        hasScrollbar: !!scrollbar,
        menuItems: [item1?.innerText.trim(), item2?.innerText.trim(), item3?.innerText.trim()],
        item1Preview: {
          visible: !!projectsView,
          projectNames,
          inspectPrompt
        },
        item2Preview: {
          visible: !!aboutView,
          bio: aboutBio,
          coreBadges
        },
        item3Preview: {
          hasCopyEmail: !!copyEmailBtn,
          hasLinkedIn: !!linkedInLink,
          linkedInHref: linkedInLink?.href,
          hasGitHub: !!gitHubLink,
          gitHubHref: gitHubLink?.href,
          hasDownloadResume: !!downloadResumeLink,
          downloadResumeHref: downloadResumeLink?.href,
          copyInitialText,
          copyAfterText
        }
      };
    } catch (err) {
      return { error: err.message, stack: err.stack };
    }
  })()
`);
console.log('Split Console Audit:', JSON.stringify(splitConsoleTest, null, 2));

// Check assertions
const checks = [
  headerTest.greetingText.includes("WELCOME TO MOAYED'S") && headerTest.greetingText.includes('PORTFOLIO'),
  headerTest.posText === 'Full-Stack Product & Web Engineer • CSE at East West University, Dhaka',
  parseFloat(headerTest.posFontSize) >= 15 && parseFloat(headerTest.posFontSize) <= 20,
  headerTest.posColor === 'rgb(110, 125, 98)',
  headerTest.clockText.toLowerCase().includes('dhaka •') && headerTest.clockText.includes('UTC+6'),
  headerTest.noCommandPromptSubheader,
  headerTest.noSys96Subheader,
  stageTest.has50PercentNegativeSpace,
  stageTest.allCrispEdges,
  stageTest.hasAvatarBrackets && stageTest.hasMacBrackets && stageTest.hasIbmBrackets,
  spriteInteractions.avatarTooltip.toLowerCase() === 'hi! press 1, 2, or 3 below',
  spriteInteractions.macTooltip.toLowerCase() === 'click: switch green / amber screen',
  spriteInteractions.ibmTooltip.toLowerCase() === 'click: open selected work',
  spriteInteractions.avatarWavedOnClick,
  spriteInteractions.macToggledPhosphor,
  splitConsoleTest.windowTitle.toLowerCase() === 'quick preview',
  splitConsoleTest.hasControls,
  splitConsoleTest.hasScrollbar,
  splitConsoleTest.menuItems[0].includes('1. Selected Work'),
  splitConsoleTest.menuItems[1].includes('2. About & Skills'),
  splitConsoleTest.menuItems[2].includes('3. Resume & Contact'),
  splitConsoleTest.item1Preview.projectNames.some(p => p.includes('01 BitForge')),
  splitConsoleTest.item1Preview.projectNames.some(p => p.includes('02 FocusLab')),
  splitConsoleTest.item1Preview.projectNames.some(p => p.includes('03 Rannabanna')),
  splitConsoleTest.item1Preview.projectNames.some(p => p.includes('04 DocLensBD')),
  splitConsoleTest.item1Preview.inspectPrompt.includes('Press Enter to inspect'),
  splitConsoleTest.item2Preview.bio.includes('East West University, Dhaka'),
  splitConsoleTest.item2Preview.coreBadges.includes('TypeScript') && splitConsoleTest.item2Preview.coreBadges.includes('Cloud Firestore'),
  splitConsoleTest.item3Preview.hasCopyEmail && splitConsoleTest.item3Preview.hasLinkedIn && splitConsoleTest.item3Preview.hasGitHub && splitConsoleTest.item3Preview.hasDownloadResume,
  splitConsoleTest.item3Preview.copyAfterText === 'Copied!',
  pageErrors.length === 0
];

const allPassed = checks.every(Boolean);

console.log('\n====================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL /boost CHECKS PASSED (100%)' : 'SOME CHECKS FAILED'}`);
console.log('Failed check indices:', checks.map((c, i) => !c ? i + 1 : null).filter(Boolean));
console.log('Page Errors:', pageErrors);
console.log('====================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(allPassed ? 0 : 1);
}, 300);
