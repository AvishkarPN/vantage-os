// scripts/capture-screenshots.mjs
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const evidenceDir = path.resolve(process.cwd(), 'Evidence');

if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

async function run() {
  console.log('[Puppeteer] Launching Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  // 1. Tactical NOC Dashboard
  console.log('[Puppeteer] Navigating to Tactical NOC Dashboard...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Click "Master Operator" to authenticate
  console.log('[Puppeteer] Authenticating as Master Operator...');
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Master Operator')) {
        await btn.click();
        break;
      }
    }
  } catch (e) {
    console.log('[Puppeteer] Auth click fallback:', e.message);
  }

  // Wait for NOC view and 2D floor map to render
  await new Promise(r => setTimeout(r, 2500));
  console.log('[Puppeteer] Capturing Tactical NOC Dashboard.png...');
  await page.screenshot({ path: path.join(evidenceDir, 'Tactical NOC Dashboard.png'), fullPage: false });

  // 2. Trigger AI Mitigation Surge and capture recommendation drawer
  console.log('[Puppeteer] Triggering critical surge for AI recommendation...');
  try {
    // Wait for auto-trigger or click the surge button if present
    await new Promise(r => setTimeout(r, 9000)); // wait for crisis timer (10s) to advance to RECOMMENDING
  } catch (e) {
    console.log('[Puppeteer] Surge wait error:', e.message);
  }
  console.log('[Puppeteer] Capturing Autonomous AI Mitigation.png...');
  await page.screenshot({ path: path.join(evidenceDir, 'Autonomous AI Mitigation.png'), fullPage: false });

  // 3. Staff Allocation
  console.log('[Puppeteer] Capturing Staff Allocation...');
  await page.goto('http://localhost:3000/staff', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(evidenceDir, 'Staff Allocation.png'), fullPage: false });

  // 4. Resource Planning
  console.log('[Puppeteer] Capturing Resource Planning...');
  await page.goto('http://localhost:3000/resources', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(evidenceDir, 'Resource Planning.png'), fullPage: false });

  // 5. Audit Reports
  console.log('[Puppeteer] Capturing Audit Reports...');
  await page.goto('http://localhost:3000/reports', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(evidenceDir, 'Audit Reports.png'), fullPage: false });

  console.log('[Puppeteer] All 5 primary screenshots refreshed in Evidence/ directory!');
  await browser.close();
}

run().catch(err => {
  console.error('[Puppeteer Error]', err);
  process.exit(1);
});
