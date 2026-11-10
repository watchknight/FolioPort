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

const PORT = 4195;
const DEBUG_PORT = 9575;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-keys-${Date.now()}`);
fs.mkdirSync(tempUserDataDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempUserDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
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
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    consoleLogs.push({ type: msg.params.type, text });
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

// Wait for boot sequence and page ready
await new Promise((r) => setTimeout(r, 2500));

// Skip boot sequence if still visible
await evalInPage(`
  const skipBtn = document.querySelector('[data-testid="crt-boot-skip-btn"]');
  if (skipBtn) skipBtn.click();
`);
await new Promise((r) => setTimeout(r, 600));

async function pressKey(key, code) {
  await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', key, code });
  await sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
  await new Promise((r) => setTimeout(r, 120));
}

console.log('--- TEST 1: Initial State & Tab Navigation ---');
const initialFocus = await evalInPage(`document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName`);
console.log('Initial active element:', initialFocus);

// Press Tab
await pressKey('Tab', 'Tab');
const tabFocus1 = await evalInPage(`
  (() => {
    const el = document.activeElement;
    const style = el ? window.getComputedStyle(el) : null;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.slice(0, 30),
      outlineStyle: style?.outlineStyle,
      outlineWidth: style?.outlineWidth,
      outlineColor: style?.outlineColor
    };
  })()
`);
console.log('After Tab 1:', tabFocus1);

console.log('\n--- TEST 2: ArrowDown Roving Focus in Overview Mode ---');
await pressKey('ArrowDown', 'ArrowDown');
const arrowDownResult = await evalInPage(`
  (() => {
    const el = document.activeElement;
    const style = el ? window.getComputedStyle(el) : null;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.slice(0, 30),
      outlineStyle: style?.outlineStyle,
      outlineWidth: style?.outlineWidth,
      outlineColor: style?.outlineColor
    };
  })()
`);
console.log('After ArrowDown 1:', arrowDownResult);

await pressKey('ArrowDown', 'ArrowDown');
const arrowDownResult2 = await evalInPage(`
  (() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.slice(0, 30)
    };
  })()
`);
console.log('After ArrowDown 2:', arrowDownResult2);

console.log('\n--- TEST 3: Key 2 to open Projects, Key 3 to open Resume, Key 1 to open About ---');
await pressKey('2', 'Digit2');
const key2Result = await evalInPage(`
  (() => {
    const isExpanded = !!document.querySelector('[data-testid="retro-window-expanded-mode"]');
    const activeContent = document.querySelector('[data-testid="retro-content-projects"]') ? 'projects' : 'unknown';
    const activeEl = document.activeElement;
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      isExpanded,
      activeContent,
      activeElTag: activeEl?.tagName,
      activeElTestId: activeEl?.getAttribute('data-testid'),
      ariaLiveText: liveRegion?.textContent?.trim(),
      ariaLiveRole: liveRegion?.getAttribute('role'),
      ariaLivePolite: liveRegion?.getAttribute('aria-live'),
    };
  })()
`);
console.log('After Key 2 (Projects):', key2Result);

await pressKey('3', 'Digit3');
const key3Result = await evalInPage(`
  (() => {
    const activeContent = document.querySelector('[data-testid="retro-content-resume"]') ? 'resume' : 'unknown';
    const activeEl = document.activeElement;
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      activeContent,
      activeElTag: activeEl?.tagName,
      activeElTestId: activeEl?.getAttribute('data-testid'),
      ariaLiveText: liveRegion?.textContent?.trim(),
    };
  })()
`);
console.log('After Key 3 (Resume):', key3Result);

await pressKey('1', 'Digit1');
const key1Result = await evalInPage(`
  (() => {
    const activeContent = document.querySelector('[data-testid="retro-content-about"]') ? 'about' : 'unknown';
    const activeEl = document.activeElement;
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      activeContent,
      activeElTag: activeEl?.tagName,
      activeElTestId: activeEl?.getAttribute('data-testid'),
      ariaLiveText: liveRegion?.textContent?.trim(),
    };
  })()
`);
console.log('After Key 1 (About):', key1Result);

console.log('\n--- TEST 4: Escape key to collapse window ---');
await pressKey('Escape', 'Escape');
const escapeResult = await evalInPage(`
  (() => {
    const isExpanded = !!document.querySelector('[data-testid="retro-window-expanded-mode"]');
    const activeEl = document.activeElement;
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      isExpanded,
      activeElTag: activeEl?.tagName,
      activeElTestId: activeEl?.getAttribute('data-testid'),
      ariaLiveText: liveRegion?.textContent?.trim(),
    };
  })()
`);
console.log('After Escape:', escapeResult);

console.log('\n--- TEST 4b: ArrowDown and ArrowUp roving in overview after collapse ---');
await pressKey('ArrowDown', 'ArrowDown');
const postCollapseDown = await evalInPage(`
  (() => {
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      ariaLiveText: liveRegion?.textContent?.trim(),
      activeTestId: document.activeElement?.getAttribute('data-testid')
    };
  })()
`);
console.log('After ArrowDown in overview post-collapse:', postCollapseDown);

await pressKey('ArrowUp', 'ArrowUp');
const postCollapseUp = await evalInPage(`
  (() => {
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      ariaLiveText: liveRegion?.textContent?.trim(),
      activeTestId: document.activeElement?.getAttribute('data-testid')
    };
  })()
`);
console.log('After ArrowUp in overview post-collapse:', postCollapseUp);

console.log('\n--- TEST 5: Enter key to expand window from overview ---');
await pressKey('Enter', 'Enter');
const enterResult = await evalInPage(`
  (() => {
    const isExpanded = !!document.querySelector('[data-testid="retro-window-expanded-mode"]');
    const liveRegion = document.querySelector('[data-testid="retro-window-aria-live"]');
    return {
      isExpanded,
      ariaLiveText: liveRegion?.textContent?.trim(),
    };
  })()
`);
console.log('After Enter:', enterResult);

console.log('\n--- TEST 6: ArrowRight and ArrowLeft Roving Focus on Expanded Tabs ---');
await pressKey('ArrowRight', 'ArrowRight');
const rightResult = await evalInPage(`
  (() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.trim(),
      outline: window.getComputedStyle(el).outline
    };
  })()
`);
console.log('After ArrowRight:', rightResult);

await pressKey('ArrowRight', 'ArrowRight');
const rightResult2 = await evalInPage(`
  (() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.trim()
    };
  })()
`);
console.log('After ArrowRight 2:', rightResult2);

await pressKey('ArrowLeft', 'ArrowLeft');
const leftResult = await evalInPage(`
  (() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      testid: el?.getAttribute('data-testid'),
      text: el?.textContent?.trim()
    };
  })()
`);
console.log('After ArrowLeft:', leftResult);

console.log('\n--- TEST 7: Verify All GitHub Repository Links (@watchknight) ---');
const githubLinksTest = await evalInPage(`
  (() => {
    const allLinks = Array.from(document.querySelectorAll('a[href*="github.com"]'));
    return allLinks.map(a => ({
      href: a.href,
      text: a.textContent?.trim()?.slice(0, 40),
      testid: a.getAttribute('data-testid')
    }));
  })()
`);
console.log(`Found ${githubLinksTest.length} GitHub links currently in DOM:`);
githubLinksTest.forEach(l => console.log(`  - [${l.testid || 'link'}] ${l.text} -> ${l.href}`));

// Switch to projects view and test links there
await pressKey('2', 'Digit2');
const projectsLinks = await evalInPage(`
  (() => {
    const allLinks = Array.from(document.querySelectorAll('[data-testid="retro-content-projects"] a[href*="github.com"]'));
    return allLinks.map(a => ({
      href: a.href,
      text: a.textContent?.trim()?.slice(0, 40),
      testid: a.getAttribute('data-testid')
    }));
  })()
`);
console.log(`Found ${projectsLinks.length} GitHub links inside [2] MY PROJECTS:`);
projectsLinks.slice(0, 5).forEach(l => console.log(`  - [${l.testid || 'link'}] ${l.text} -> ${l.href}`));

// Switch to resume view and test links there
await pressKey('3', 'Digit3');
const resumeLinks = await evalInPage(`
  (() => {
    const allLinks = Array.from(document.querySelectorAll('[data-testid="retro-content-resume"] a[href*="github.com"]'));
    return allLinks.map(a => ({
      href: a.href,
      text: a.textContent?.trim()?.slice(0, 40),
      testid: a.getAttribute('data-testid')
    }));
  })()
`);
console.log(`Found ${resumeLinks.length} GitHub links inside [3] RESUME:`);
resumeLinks.forEach(l => console.log(`  - [${l.testid || 'link'}] ${l.text} -> ${l.href}`));

console.log('\n--- TEST 8: Scanline Overlay Opacity & Pointer-Events ---');
const scanlineAudit = await evalInPage(`
  (() => {
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    if (!screen) return { error: 'Screen not found' };
    const afterStyle = window.getComputedStyle(screen, '::after');
    return {
      opacity: afterStyle.opacity,
      pointerEvents: afterStyle.pointerEvents,
      zIndex: afterStyle.zIndex
    };
  })()
`);
console.log('CRT Scanline Overlay (::after):', scanlineAudit);

console.log('\n--- TEST 9: Console Logs & Page Errors ---');
console.log('Console logs count:', consoleLogs.length);
console.log('Page errors count:', pageErrors.length);
if (pageErrors.length > 0) {
  console.log('Errors:', pageErrors);
}
if (consoleLogs.length > 0) {
  console.log('Logs:', consoleLogs);
}

// Clean up
try {
  ws.close();
  chromeProcess.kill();
  server.close();
} catch (e) {}

process.exit(0);
