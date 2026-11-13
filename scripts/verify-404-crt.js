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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
  }
});
await new Promise((r) => server.listen(4196, '127.0.0.1', r));

const DEBUG_PORT = 9576;
const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--no-first-run',
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
  } catch {}
}

const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:4196/`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let msgId = 1;
const pending = new Map();
function send(method, params = {}) {
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

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

// Navigate to #404
await send('Page.navigate', { url: 'http://127.0.0.1:4196/#404' });
await new Promise((r) => setTimeout(r, 2500));

const debugInfo = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    url: window.location.href,
    rootHtml: document.getElementById('root')?.innerHTML.slice(0, 500) || 'EMPTY',
  })`,
  returnByValue: true,
});
console.log('Debug Info:', debugInfo.result?.value);
console.log('Console Logs:', consoleLogs);

const audit = await send('Runtime.evaluate', {
  expression: `(() => {
    const room = document.querySelector('[data-testid="crt-monitor-room"]');
    const screen = document.querySelector('[data-testid="crt-glass-screen"]');
    const screen404 = document.querySelector('[data-testid="retro-404-screen"]');
    const grid = document.querySelector('[role="grid"]');
    const heading = document.querySelector('h1');
    const returnBtn = document.querySelector('header button');
    
    window.scrollTo(0, 500);
    const scrollYAfterScroll = window.scrollY;

    return {
      hasRoom: Boolean(room),
      hasScreen: Boolean(screen),
      has404Screen: Boolean(screen404),
      hasChessboardGrid: Boolean(grid),
      headingText: heading ? heading.innerText.trim() : '',
      headingFont: heading ? window.getComputedStyle(heading).fontFamily : '',
      buttonFont: returnBtn ? window.getComputedStyle(returnBtn).fontFamily : '',
      scrollYAfterScroll,
      isNonScrolling: scrollYAfterScroll === 0,
      roomBg: room ? window.getComputedStyle(room).backgroundColor : '',
      screenBg: screen ? window.getComputedStyle(screen).backgroundColor : '',
    };
  })()`,
  returnByValue: true,
});

console.log('404 In CRT Audit Result:', audit.result?.value);
console.log('Page Errors:', pageErrors);

// Click Return Home button
await send('Runtime.evaluate', {
  expression: `(() => {
    const returnBtn = document.querySelector('header button');
    if (returnBtn) returnBtn.click();
  })()`,
});
await new Promise((r) => setTimeout(r, 600));

const homeCheck = await send('Runtime.evaluate', {
  expression: `(() => {
    const stage = document.querySelector('[data-testid="crt-diorama-stage"]');
    const commandMenu = document.querySelector('[data-testid="retro-command-menu"]');
    return {
      hasStage: Boolean(stage),
      hasCommandMenu: Boolean(commandMenu),
      url: window.location.href,
    };
  })()`,
  returnByValue: true,
});
console.log('Home After Return Check:', homeCheck.result?.value);

const passed = (
  audit.result?.value?.hasRoom &&
  audit.result?.value?.hasScreen &&
  audit.result?.value?.has404Screen &&
  audit.result?.value?.hasChessboardGrid &&
  audit.result?.value?.isNonScrolling &&
  audit.result?.value?.headingFont.includes('Press Start 2P') &&
  audit.result?.value?.buttonFont.includes('JetBrains Mono') &&
  homeCheck.result?.value?.hasStage &&
  homeCheck.result?.value?.hasCommandMenu &&
  pageErrors.length === 0
);

console.log(`TEST RESULT: ${passed ? 'PASSED' : 'FAILED'}`);

ws.close();
chromeProcess.kill();
server.close();
process.exit(passed ? 0 : 1);
