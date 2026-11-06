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

const PORT = 4188;
const DEBUG_PORT = 9566;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-scrolly-test-${Date.now()}`);
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

await new Promise((r) => setTimeout(r, 2200));

console.log('================================================================');
console.log('    TEST SUITE: PINNED HORIZONTAL SHOWCASE & 3D SHADER INSPECTOR ');
console.log('================================================================\n');

// -----------------------------------------------------------------
// AUDIT A: Interactive 3D Shader & Render-Pass Inspector
// -----------------------------------------------------------------
console.log('--- TEST A: 3D Shader and Render-Pass Inspector ---');
const shaderTest = await evalInPage(`
  (async () => {
    const section = document.getElementById('shader-inspector');
    const canvas = section?.querySelector('canvas');
    const pills = Array.from(section?.querySelectorAll('button[role="tab"]') || []);
    const pillIds = pills.map(p => p.id.replace('tab-', ''));
    
    // Check initial active pass
    const activePill = pills.find(p => p.getAttribute('aria-selected') === 'true');
    const initialActive = activePill?.id.replace('tab-', '');
    
    // Test clicking each of the 6 pills
    const clickResults = {};
    for (const pill of pills) {
      const passId = pill.id.replace('tab-', '');
      pill.click();
      await new Promise(r => setTimeout(r, 120));
      const isSelected = pill.getAttribute('aria-selected') === 'true';
      clickResults[passId] = isSelected;
    }
    
    // Test keyboard hotkeys [1 - 6]
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    await new Promise(r => setTimeout(r, 100));
    const tab2Selected = document.getElementById('tab-wireframe')?.getAttribute('aria-selected') === 'true';
    
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' }));
    await new Promise(r => setTimeout(r, 100));
    const tab4Selected = document.getElementById('tab-transmission')?.getAttribute('aria-selected') === 'true';
    
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    await new Promise(r => setTimeout(r, 100));
    const tab1Selected = document.getElementById('tab-beauty')?.getAttribute('aria-selected') === 'true';
    
    // Check canvas pointer interaction
    const container = canvas?.parentElement;
    const rect = container?.getBoundingClientRect();
    if (container && rect) {
      container.dispatchEvent(new PointerEvent('pointermove', {
        clientX: rect.left + rect.width * 0.7,
        clientY: rect.top + rect.height * 0.3,
        bubbles: true
      }));
      container.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: rect.left + rect.width * 0.7,
        clientY: rect.top + rect.height * 0.3,
        bubbles: true
      }));
      container.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    }

    // Check corner HUD toolbar positioning
    const hudToolbar = section?.querySelector('[role="tablist"]')?.closest('.absolute');
    const hudClasses = hudToolbar?.className || '';
    const isCornerHud = hudClasses.includes('right-') || hudClasses.includes('bottom-');
    
    return {
      hasSection: !!section,
      hasCanvas: !!canvas,
      canvasDimensions: canvas ? { width: canvas.width, height: canvas.height } : null,
      totalPills: pills.length,
      pillIds,
      initialActive,
      isCornerHud,
      clickResults,
      hotkeyWireframePass: tab2Selected,
      hotkeyTransmissionPass: tab4Selected,
      hotkeyBeautyPass: tab1Selected,
    };
  })()
`);
console.log('Shader Inspector Audit Results:', shaderTest);

// -----------------------------------------------------------------
// AUDIT B: Pinned Horizontal Scrollytelling Reel with Internal Parallax
// -----------------------------------------------------------------
console.log('\n--- TEST B: Pinned Horizontal Scrollytelling Reel ---');
const horizontalTest = await evalInPage(`
  (async () => {
    const section = document.getElementById('work');
    const track = section?.querySelector('.horizontal-track');
    const items = Array.from(section?.querySelectorAll('.showcase-item') || []);
    
    // Check presence of inner visual layers and media layers
    const mediaLayers = Array.from(section?.querySelectorAll('.showcase-media-layer') || []);
    const innerVisuals = Array.from(section?.querySelectorAll('.showcase-inner-visual') || []);
    const previewBoxes = Array.from(section?.querySelectorAll('.showcase-preview-box') || []);
    
    // Check ScrollTrigger master tween
    const trackScrollWidth = track?.scrollWidth || 0;
    const windowWidth = window.innerWidth;
    const expectedScrollDistance = trackScrollWidth - windowWidth;
    
    // Check cards content
    const projectCards = items.filter(it => it.getAttribute('aria-label')?.includes('Case Study:'));
    const titles = projectCards.map(c => c.querySelector('h3')?.innerText || '');

    // Check media layer bleed (width larger than card width or negative insets)
    const firstMedia = mediaLayers[0];
    const firstCard = items[0];
    const mediaBleedActive = firstMedia && firstCard && (
      firstMedia.getBoundingClientRect().width >= firstCard.getBoundingClientRect().width
    );
    
    // Simulate scroll down to trigger horizontal progression
    window.scrollTo({ top: (section?.offsetTop || 800) + 500, behavior: 'instant' });
    if (window.__lenis) {
      window.__lenis.scrollTo((section?.offsetTop || 800) + 500, { immediate: true });
    }
    await new Promise(r => setTimeout(r, 600));
    
    // Check track transform and skew
    const trackTransform = track ? window.getComputedStyle(track).transform : '';
    
    return {
      hasSection: !!section,
      hasTrack: !!track,
      totalItems: items.length,
      totalCaseStudies: projectCards.length,
      caseStudyTitles: titles,
      totalMediaLayers: mediaLayers.length,
      totalInnerVisuals: innerVisuals.length,
      totalPreviewBoxes: previewBoxes.length,
      mediaBleedActive,
      trackScrollWidth,
      windowWidth,
      expectedScrollDistance,
      trackHasTransformOnScroll: trackTransform !== 'none' && trackTransform !== '',
    };
  })()
`);
console.log('Horizontal Showcase Audit Results:', horizontalTest);

// -----------------------------------------------------------------
// AUDIT C: Console Errors & Exceptions Audit
// -----------------------------------------------------------------
console.log('\n--- TEST C: Runtime Exceptions & Console Logs ---');
console.log('Runtime exceptions:', pageErrors.length, pageErrors);
console.log('Console logs:', consoleLogs.length, consoleLogs);

console.log('\n================================================================');
console.log('               VERIFICATION AUDIT COMPLETE                      ');
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
