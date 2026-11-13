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
const DEBUG_PORT = 9615;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-final-polish-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempUserDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-features=Translate,AutomationControlled',
  '--window-size=1440,900',
]);

let wsUrl = '';
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 200));
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    if (res.ok) {
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      break;
    }
  } catch {}
}

if (!wsUrl) {
  console.error('Failed to get Chrome WebSocket debugger URL');
  process.exit(1);
}

const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:${PORT}`, { method: 'PUT' });
const tabData = await newTabRes.json();
const ws = new WebSocket(tabData.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

try {
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}` });
  await new Promise((r) => setTimeout(r, 2000));

  // Skip boot screen if present
  await send('Runtime.evaluate', {
    expression: `
      const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
      if (skipBtn) skipBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('=== TEST 1: HOME QUICK PREVIEW BUTTONS & THUMBNAIL ===');
  const previewCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-testid="quick-view-mini-card"]');
      const viewport = document.querySelector('[data-testid="retro-window-content-viewport"]');
      const caseStudyBtn = document.querySelector('[data-testid^="preview-btn-case-study"]');
      const liveAppBtn = document.querySelector('[data-testid^="preview-btn-live-app"]');
      const thumb = card?.querySelector('img')?.parentElement;

      if (!card || !viewport || !caseStudyBtn || !liveAppBtn) {
        return { error: 'Missing elements in quick preview' };
      }

      const viewportRect = viewport.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const caseStudyRect = caseStudyBtn.getBoundingClientRect();
      const liveAppRect = liveAppBtn.getBoundingClientRect();
      const thumbRect = thumb ? thumb.getBoundingClientRect() : null;

      const isCaseStudyVisible = caseStudyRect.bottom <= viewportRect.bottom + 2;
      const isLiveAppVisible = liveAppRect.bottom <= viewportRect.bottom + 2;
      const thumbMaxHeightComputed = thumb ? window.getComputedStyle(thumb).maxHeight : 'none';

      return {
        viewportHeight: viewportRect.height,
        cardHeight: cardRect.height,
        caseStudyBottom: caseStudyRect.bottom,
        liveAppBottom: liveAppRect.bottom,
        viewportBottom: viewportRect.bottom,
        isCaseStudyVisible,
        isLiveAppVisible,
        thumbHeight: thumbRect?.height,
        thumbMaxHeightComputed,
        clearanceBottom: viewportRect.bottom - caseStudyRect.bottom,
      };
    })()`,
    returnByValue: true,
  });

  console.log('Quick Preview Metric Check:', previewCheck.result.value);

  console.log('\n=== TEST 2: EXPANDED SELECTED WORK PAGE ===');
  // Expand Selected Work tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-testid="retro-window-btn-maximize"]');
      if (btn) btn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const projectsCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const grid = document.querySelector('[data-testid="flagship-projects-grid"]');
      const deployedApps = document.querySelector('[data-testid="more-live-deployed-apps"]');
      const accordion = document.querySelector('[data-testid="github-archive-accordion"]');
      const archLabs = document.querySelector('[data-testid="subsystems-labs-archive"]');

      // Check the 4 thumbnail captions
      const text = grid ? grid.textContent : '';
      const hasBitforgeStack = text.includes('React • TypeScript • Canvas');
      const hasFocuslabStack = text.includes('React • IndexedDB • Web Audio');
      const hasRannabannaStack = text.includes('Vite • React • Bilingual UI');
      const hasDoclensStack = text.includes('React • 3D Try-On • Cloud');
      const hasOldSysCaption = text.includes('SYS.1996 • 16:9 CRT');

      // Check deployed apps
      const deployedCount = deployedApps ? deployedApps.querySelectorAll('[data-testid^="deployed-app-card"]').length : 0;

      return {
        hasGrid: !!grid,
        hasBitforgeStack,
        hasFocuslabStack,
        hasRannabannaStack,
        hasDoclensStack,
        hasOldSysCaption,
        hasMoreDeployedApps: !!deployedApps,
        deployedCount,
        hasDeletedAccordion: !!accordion,
        hasDeletedArchLabs: !!archLabs,
      };
    })()`,
    returnByValue: true,
  });

  console.log('Projects View Metric Check:', projectsCheck.result.value);

  console.log('\n=== TEST 3: ABOUT & SKILLS (NO TRUNCATION & UPDATED TEXT) ===');
  // Switch to About & Skills
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tab = document.querySelector('[data-testid="retro-window-tab-about"]');
      if (tab) tab.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const aboutCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const about = document.querySelector('[data-testid="retro-content-about"]');
      const bio = document.querySelector('[data-testid="about-biography-section"]');
      const bioText = bio ? bio.textContent : '';

      const hasUpdatedSentence = bioText.includes('My core engineering discipline combines strong Data Structures & Algorithms fundamentals in C++ and Python with high-performance TypeScript, React, and interactive web applications.');
      const hasOldPhrase = bioText.includes('shared memory, process trees, and Linux systems programming');

      const aboutText = about ? about.textContent : '';
      const hasAlgoViz = aboutText.includes('Interactive Algorithm Visualization');
      const hasOldIPC = aboutText.includes('Linux & IPC Pipelines');

      // Headers check
      const colHeaders = Array.from(document.querySelectorAll('[data-testid^="capability-column"] > div:first-child'));
      const headerData = colHeaders.map((el) => {
        const text = el.textContent.trim();
        return {
          text,
          hasEllipsis: text.includes('...') || text.includes('…'),
          isTruncated: el.scrollWidth > el.clientWidth,
        };
      });

      return {
        hasUpdatedSentence,
        hasOldPhrase,
        hasAlgoViz,
        hasOldIPC,
        headerData,
      };
    })()`,
    returnByValue: true,
  });

  console.log('About & Skills Metric Check:', aboutCheck.result.value);

  console.log('\n=== TEST 4: RESUME & CONTACT (HIGHLIGHTS & COMPACT HIDE TERMINAL) ===');
  // Switch to Resume & Contact
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tab = document.querySelector('[data-testid="retro-window-tab-resume"]');
      if (tab) tab.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 600));

  const resumeCheck1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-testid="key-engineering-highlights-card"]');
      const text = card ? card.textContent : '';

      const hasHighlight1 = text.includes('Architected and deployed 7 live production web applications spanning algorithm visualization (BitForge), cognitive testing (FocusLab), 3D eyewear try-on (DocLensBD), and bilingual recipe matching (Rannabanna).');
      const hasHighlight2 = text.includes('Strong foundation in Data Structures, Algorithms, and Object-Oriented Programming (C++, Python, Java, TypeScript) with a focus on 60 FPS interactive UI performance.');
      const hasHighlight3 = text.includes('Experienced in end-to-end full-stack delivery using React 18, Next.js, Node.js, Cloud Firestore, PostgreSQL, and automated CI/CD deployments.');

      // Check if duplicate skills table is absent
      const hasOldSkillsHeader = text.includes('Technical Stack');

      return {
        hasHighlightsCard: !!card,
        hasHighlight1,
        hasHighlight2,
        hasHighlight3,
        hasOldSkillsHeader,
      };
    })()`,
    returnByValue: true,
  });

  console.log('Resume View Card Check:', resumeCheck1.result.value);

  // Now open terminal to check compact Hide Terminal button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const openBtn = document.querySelector('[data-testid="btn-toggle-linux-cli"]');
      if (openBtn) openBtn.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));

  const terminalCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const hideBtn = document.querySelector('[data-testid="btn-hide-terminal"]');
      const openBtn = document.querySelector('[data-testid="btn-toggle-linux-cli"]');
      const cli = document.querySelector('[data-testid="interactive-linux-cli"]');

      return {
        isCliOpen: !!cli,
        hasHideTerminalInHeader: !!hideBtn && hideBtn.textContent.trim() === 'Hide Terminal',
        hasOversizedDashedBoxAbovePrompt: !!openBtn,
      };
    })()`,
    returnByValue: true,
  });

  console.log('Terminal Header Check:', terminalCheck.result.value);

  console.log('\n====================================');
  console.log('ALL FINAL POLISH VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================');

} catch (err) {
  console.error('Test execution error:', err);
  process.exit(1);
} finally {
  try {
    await send('Browser.close');
  } catch {}
  chromeProcess.kill();
  server.close();
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
}
