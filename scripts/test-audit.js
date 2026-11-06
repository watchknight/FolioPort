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

const PORT = 4175;
const DEBUG_PORT = 9555;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const tempUserDataDir = path.join(os.tmpdir(), `chrome-test-${Date.now()}`);
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

await new Promise((r) => setTimeout(r, 1800));

console.log('====================================================');
console.log('     COMPREHENSIVE MULTI-AGENT BROWSER QA AUDIT    ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// AUDIT 1: Responsive Viewport Overflow & Layout (375px, 768px, 1440px)
// -----------------------------------------------------------------
console.log('--- TEST 1: Viewport Responsiveness & Layout Overflow ---');
const viewports = [
  { name: 'Mobile', width: 375, height: 812, mobile: true },
  { name: 'Tablet', width: 768, height: 1024, mobile: false },
  { name: 'Desktop', width: 1440, height: 900, mobile: false },
];

for (const vp of viewports) {
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 2,
    mobile: vp.mobile,
  });
  await new Promise((r) => setTimeout(r, 300));

  const overflow = await evalInPage(`
    ({
      windowWidth: window.innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
    })
  `);
  console.log(`[Viewport: ${vp.name} (${vp.width}x${vp.height})] Overflow check:`, overflow);
}

// -----------------------------------------------------------------
// AUDIT 2: Kinetic Callout, High-Conversion CTA & Email Copy
// -----------------------------------------------------------------
console.log('\n--- TEST 2: ContactFooter Kinetic Callout & One-Click Copy Email ---');
const calloutTest = await evalInPage(`
  (() => {
    const heading = document.querySelector('#contact h2');
    const headingText = heading?.innerText || '';
    const hasCallout = headingText.toLowerCase().includes('ready to build something') &&
                       headingText.toLowerCase().includes('unforgettable');
    const copyBtn = document.querySelector('button[aria-label*="Copy email"]');
    const resumeLink = document.querySelector('a[href="/resume.pdf"]');
    const credBtn = document.querySelector('button[aria-label="View interactive credentials modal"]');
    const ghLink = document.querySelector('a[href="https://github.com/watchknight"]');
    const liLink = document.querySelector('a[href*="linkedin.com"]');
    
    return {
      headingText: headingText.replace(/\\n/g, ' '),
      hasCallout,
      hasCopyBtn: !!copyBtn,
      hasResumeLink: !!resumeLink,
      hasCredentialsBtn: !!credBtn,
      hasGhLink: !!ghLink,
      hasLiLink: !!liLink
    };
  })()
`);
console.log('Callout & Primary CTAs:', calloutTest);

// Click copy button and observe toast
const copyToastTest = await evalInPage(`
  (async () => {
    const copyBtn = document.querySelector('button[aria-label*="Copy email"]');
    const toastBefore = document.querySelector('[role="status"]');
    const initialClasses = toastBefore?.className || '';
    
    copyBtn.click();
    
    // Poll up to 1 second
    let visible = false;
    let toastContent = '';
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 60));
      const toast = document.querySelector('[role="status"]');
      if (toast && !toast.className.includes('opacity-0')) {
        visible = true;
        toastContent = toast.innerText.replace(/\\n/g, ' ');
        break;
      }
    }
    
    // Measure bounding box on mobile
    const toastBox = document.querySelector('[role="status"] > div');
    const rect = toastBox?.getBoundingClientRect();
    
    return {
      clicked: true,
      toastVisible: visible,
      toastContent,
      rect: rect ? { left: rect.left, right: rect.right, width: rect.width } : null
    };
  })()
`);
console.log('One-Click Email Copy & Toast Status:', copyToastTest);

// -----------------------------------------------------------------
// AUDIT 3: Local Dhaka Time Clock (UTC+6) in JetBrains Mono
// -----------------------------------------------------------------
console.log('\n--- TEST 3: Local Dhaka Time Clock (UTC+6) in JetBrains Mono ---');
const clockTest = await evalInPage(`
  (async () => {
    // Specifically target the clock element inside the telemetry widget in #contact
    const timeEl = document.getElementById('dhaka-clock');
    const time1 = timeEl?.innerText || '';
    
    // Check computed font family
    const computedFont = timeEl ? window.getComputedStyle(timeEl).fontFamily : '';
    
    await new Promise(r => setTimeout(r, 1100));
    const time2 = timeEl?.innerText || '';
    
    return {
      clockTimeInitial: time1,
      clockTimeNextSecond: time2,
      isTicking: time1 !== '' && time2 !== '' && time1 !== time2,
      fontFamily: computedFont
    };
  })()
`);
console.log('Dhaka Clock Telemetry:', clockTest);

// -----------------------------------------------------------------
// AUDIT 4: Form Validation & Prefill Trigger (`sudo hire moayed`)
// -----------------------------------------------------------------
console.log('\n--- TEST 4: Direct Dispatch Form & sudo hire moayed Event Flow ---');

// Test submitting with invalid/empty fields
const formValidationTest = await evalInPage(`
  (async () => {
    const submitBtn = document.querySelector('#contact form button[type="submit"]');
    const emailInput = document.querySelector('#dispatch-email');
    const msgInput = document.querySelector('#dispatch-message');
    
    // Submit empty
    submitBtn?.click();
    await new Promise(r => setTimeout(r, 150));
    
    const emailError = document.getElementById('dispatch-email-error')?.innerText;
    const msgError = document.getElementById('dispatch-message-error')?.innerText;
    
    return {
      emailError,
      msgError,
      emailAriaInvalid: emailInput?.getAttribute('aria-invalid'),
      msgAriaInvalid: msgInput?.getAttribute('aria-invalid'),
    };
  })()
`);
console.log('Form Validation Guard:', formValidationTest);

// Execute 'sudo hire moayed' via Terminal chip
const sudoHireTest = await evalInPage(`
  (async () => {
    const chip = document.querySelector('button[aria-label*="sudo hire moayed"]');
    if (!chip) return { error: 'sudo hire moayed chip not found' };
    
    chip.click();
    
    // Wait for event to propagate and prefill textarea
    await new Promise(r => setTimeout(r, 900));
    
    const textarea = document.querySelector('#dispatch-message');
    const emailInput = document.querySelector('#dispatch-email');
    const isPrefilled = textarea?.value?.includes('sudo hire moayed');
    const hasGlow = textarea?.className?.includes('border-cyan-mint');
    
    return {
      chipClicked: true,
      textareaLength: textarea?.value?.length,
      isPrefilled,
      hasPrefillGlow: hasGlow,
      focusedElement: document.activeElement?.id
    };
  })()
`);
console.log('Terminal sudo hire moayed Execution & Prefill Flow:', sudoHireTest);

// -----------------------------------------------------------------
// AUDIT 5: Credentials Modal Accessibility, Scroll-Lock & Focus Trap
// -----------------------------------------------------------------
console.log('\n--- TEST 5: Credentials Modal Accessibility & Tab Focus Trap ---');
const modalTest = await evalInPage(`
  (async () => {
    const credBtn = document.querySelector('button[aria-label="View interactive credentials modal"]');
    if (!credBtn) return { error: 'Credentials button not found' };
    
    credBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
    await new Promise(r => setTimeout(r, 300));
    credBtn.focus();

    // Click to open
    credBtn.click();
    await new Promise(r => setTimeout(r, 200));
    
    const modal = document.querySelector('[role="dialog"]');
    const bodyOverflow = document.body.style.overflow;
    const activeElOnOpen = document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText;
    
    // Test Escape key dismissal
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    
    const modalAfterEsc = document.querySelector('[role="dialog"]');
    const bodyOverflowAfter = document.body.style.overflow;
    const activeElAfterClose = document.activeElement?.getAttribute('aria-label');
    return {
      modalOpened: !!modal,
      bodyScrollLockedOnOpen: bodyOverflow === 'hidden',
      focusedOnOpen: activeElOnOpen,
      closedOnEsc: !modalAfterEsc,
      bodyScrollRestored: bodyOverflowAfter === '',
      focusRestoredToTrigger: activeElAfterClose === 'View interactive credentials modal'
    };
  })()
`);
console.log('Modal Accessibility & Trap:', modalTest);

// -----------------------------------------------------------------
// AUDIT 6: Site-wide Button Accessibility (`aria-label` coverage)
// -----------------------------------------------------------------
console.log('\n--- TEST 6: Site-Wide Button Accessibility (aria-label coverage) ---');
const buttonAudit = await evalInPage(`
  (() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const missing = allButtons.filter(b => {
      const aria = b.getAttribute('aria-label') || b.getAttribute('aria-labelledby');
      const text = b.innerText.trim();
      return !aria && (!text || text.length > 25);
    });
    
    return {
      totalButtons: allButtons.length,
      buttonsMissingAccessibleName: missing.length,
      missingSample: missing.map(b => b.outerHTML.slice(0, 70))
    };
  })()
`);
console.log('Button Accessibility Coverage:', buttonAudit);

// -----------------------------------------------------------------
// AUDIT 7: Prefers-Reduced-Motion Media Query Emulation
// -----------------------------------------------------------------
console.log('\n--- TEST 7: prefers-reduced-motion Emulation ---');
await sendCommand('Emulation.setEmulatedMedia', {
  media: 'screen',
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await new Promise((r) => setTimeout(r, 400));

const reducedMotionCheck = await evalInPage(`
  (() => {
    const cursor = document.querySelector('.custom-cursor-container');
    const cursorDisplay = cursor ? window.getComputedStyle(cursor).display : 'none';
    const bodyClasses = document.body.className;
    
    return {
      prefersReducedMotionMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      customCursorHidden: cursorDisplay === 'none',
      bodyCursorActive: bodyClasses.includes('cursor-active')
    };
  })()
`);
console.log('Reduced Motion Verification:', reducedMotionCheck);

// -----------------------------------------------------------------
// AUDIT 8: Console Errors, Network, and Runtime Exceptions
// -----------------------------------------------------------------
console.log('\n--- TEST 8: Console Errors & Runtime Exceptions Audit ---');
console.log('Runtime exceptions count:', pageErrors.length, pageErrors);
console.log('Console logs count:', consoleLogs.length, consoleLogs);

console.log('\n====================================================');
console.log('               AUDIT SUITE COMPLETE                 ');
console.log('====================================================');

ws.close();
chromeProcess.kill();
server.close();
setTimeout(() => {
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
}, 300);
