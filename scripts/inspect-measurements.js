import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const DIST_DIR = path.resolve('dist');
const MIME_TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
  }
});
await new Promise((r) => server.listen(4298, '127.0.0.1', r));

const DEBUG_PORT = 9698;
const tempDir = path.join(os.tmpdir(), `chrome-meas-${Date.now()}`);
const proc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${tempDir}`,
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

const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?http://127.0.0.1:4298`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 1;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id).resolve(msg.result);
    pending.delete(msg.id);
  }
};
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Runtime.enable');

const viewports = [
  { w: 320, h: 568, name: 'Small Mobile 320x568', mobile: true },
  { w: 375, h: 812, name: 'Mobile 375x812', mobile: true },
  { w: 390, h: 844, name: 'Mobile iPhone 12/13/14 390x844', mobile: true },
  { w: 414, h: 896, name: 'Mobile iPhone XR 414x896', mobile: true },
  { w: 768, h: 1024, name: 'Tablet Portrait 768x1024', mobile: true },
  { w: 1024, h: 768, name: 'Tablet Landscape / Small Laptop 1024x768', mobile: false },
  { w: 1280, h: 720, name: '13-inch Laptop 1280x720', mobile: false },
  { w: 1366, h: 768, name: '13-inch Laptop 1366x768', mobile: false },
  { w: 1440, h: 900, name: 'Laptop Widescreen 1440x900', mobile: false },
  { w: 1920, h: 1080, name: 'Large Desktop 1920x1080', mobile: false },
  { w: 2560, h: 1440, name: 'Large Desktop 2560x1440', mobile: false },
];

for (const vp of viewports) {
  await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 2, mobile: vp.mobile });
  await send('Page.navigate', { url: 'http://127.0.0.1:4298/' });
  await new Promise((r) => setTimeout(r, 600));
  await send('Runtime.evaluate', { expression: `document.querySelector('[data-testid="crt-boot-skip-btn"]')?.click()` });
  await new Promise((r) => setTimeout(r, 400));

  const homeMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const openCaseStudyBtn = document.querySelector('[data-testid^="preview-btn-case-study-"]');
      const liveAppBtn = document.querySelector('[data-testid^="preview-btn-live-app-"]');
      const casing = document.querySelector('[data-testid="crt-monitor-casing"]');
      const screenScroll = document.querySelector('.crt-screen-scroll');
      const title = document.querySelector('[data-testid="crt-typewriter-greeting"]');
      const badge = document.querySelector('[data-testid="crt-status-badge"]');
      const avatar = document.querySelector('[data-testid="developer-avatar-sprite"]');
      const mug = document.querySelector('[data-testid="crt-desk-coffee-mug"]');
      const mac = document.querySelector('[data-testid="compact-mac-sprite"]');
      const ibm = document.querySelector('[data-testid="ibm-workstation-sprite"]');

      const titleRect = title ? title.getBoundingClientRect() : null;
      const badgeRect = badge ? badge.getBoundingClientRect() : null;
      const hasHeaderCollision = (titleRect && badgeRect) ? (
        titleRect.bottom > badgeRect.top &&
        titleRect.top < badgeRect.bottom &&
        titleRect.right > badgeRect.left &&
        titleRect.left < badgeRect.right
      ) : false;

      const openCaseStudyRect = openCaseStudyBtn ? openCaseStudyBtn.getBoundingClientRect() : null;
      const liveAppRect = liveAppBtn ? liveAppBtn.getBoundingClientRect() : null;

      const isClippedInViewport = openCaseStudyRect ? (openCaseStudyRect.bottom > window.innerHeight) : false;
      const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

      return {
        hasHeaderCollision,
        hasHorizontalScroll,
        isClippedInViewport,
        openCaseStudyBottom: openCaseStudyRect ? Math.round(openCaseStudyRect.bottom) : null,
        windowHeight: window.innerHeight,
        screenScrollHeight: screenScroll ? screenScroll.scrollHeight : null,
        screenClientHeight: screenScroll ? screenScroll.clientHeight : null,
        spritesWidth: (avatar?.clientWidth || 0) + (mug?.clientWidth || 0) + (mac?.clientWidth || 0) + (ibm?.clientWidth || 0)
      };
    })()`,
    returnByValue: true,
  });

  // Open Selected Work to test Expanded Window
  await send('Runtime.evaluate', { expression: `window.dispatchEvent(new CustomEvent('retro-os-open', { detail: 'projects' }));` });
  await new Promise((r) => setTimeout(r, 600));

  const expandedMetrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const windowEl = document.querySelector('.retro-window-expanded-wipe');
      const content = windowEl ? windowEl.querySelector('[data-testid="retro-window-content-viewport"]') : null;
      const card1 = document.querySelector('[data-testid="flagship-card-01"]');
      const card2 = document.querySelector('[data-testid="flagship-card-02"]');
      const card1Rect = card1 ? card1.getBoundingClientRect() : null;
      const card2Rect = card2 ? card2.getBoundingClientRect() : null;
      const is2ColGrid = card1Rect && card2Rect ? card2Rect.left > card1Rect.right - 15 : false;

      // Inside card 1: check if photo is stacked above text or side-by-side
      const photo1 = card1 ? card1.querySelector('[data-testid="crt-photo-frame"]') : null;
      const photo1Rect = photo1 ? photo1.getBoundingClientRect() : null;
      const textBtn = card1 ? card1.querySelector('[data-testid^="retro-btn-read-case-study-"]') : null;
      const textBtnRect = textBtn ? textBtn.getBoundingClientRect() : null;
      const isPhotoStackedAbove = (photo1Rect && textBtnRect) ? (textBtnRect.top > photo1Rect.bottom - 5) : false;

      // Check all primary buttons for 44px min height
      const buttons = Array.from(document.querySelectorAll('button, a[href]')).filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && window.getComputedStyle(b).display !== 'none';
      });
      const undersizedButtons = buttons.filter(b => {
        const r = b.getBoundingClientRect();
        return r.height < 43.5 && !b.classList.contains('crt-block-cursor');
      }).map(b => ({
        tag: b.tagName,
        testId: b.getAttribute('data-testid') || b.className.slice(0, 30),
        text: b.innerText.slice(0, 20),
        height: Math.round(b.getBoundingClientRect().height)
      }));

      const hasHorizontalOverflow = content ? content.scrollWidth > content.clientWidth + 1 : false;

      return {
        isWindowExpanded: Boolean(windowEl),
        is2ColGrid,
        isPhotoStackedAbove,
        hasHorizontalOverflow,
        undersizedButtonsCount: undersizedButtons.length,
        undersizedButtonsSample: undersizedButtons.slice(0, 5)
      };
    })()`,
    returnByValue: true,
  });

  console.log(`\n=== ${vp.name} ===`);
  console.log('Home:', homeMetrics.result.value);
  console.log('Expanded:', expandedMetrics.result.value);
}

await ws.close();
proc.kill();
server.close();
