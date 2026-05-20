import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'visual-diffs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const urls = [
  { name: 'ui-old', url: 'http://172.168.53.114:5178/' },
  { name: 'react', url: 'http://172.168.53.114:5179/' }
];

async function captureScreenshot(page, url, selector = 'body') {
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForSelector(selector, { timeout: 5000 }).catch(() => console.log(`Selector ${selector} not found on ${url}`));
  // Đảm bảo scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  const element = await page.$(selector);
  if (element) {
    return await element.screenshot();
  } else {
    return await page.screenshot();
  }
}

async function compare() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const screenshots = {};
  for (const { name, url } of urls) {
    console.log(`Capturing ${name}...`);
    const screenshot = await captureScreenshot(page, url, '#root, .inventory-workbench, body');
    const filepath = path.join(outputDir, `${name}.png`);
    fs.writeFileSync(filepath, screenshot);
    screenshots[name] = filepath;
  }

  // Compare images
  const oldImg = PNG.sync.read(fs.readFileSync(screenshots['ui-old']));
  const newImg = PNG.sync.read(fs.readFileSync(screenshots['react']));
  const { width, height } = oldImg;
  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(oldImg.data, newImg.data, diff.data, width, height, { threshold: 0.1 });
  const diffPath = path.join(outputDir, 'diff.png');
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  console.log(`\n📊 Visual regression result:`);
  console.log(`- Total pixels: ${width * height}`);
  console.log(`- Different pixels: ${numDiffPixels} (${((numDiffPixels / (width * height)) * 100).toFixed(2)}%)`);
  if (numDiffPixels === 0) {
    console.log('✅ UI hoàn toàn giống nhau!');
  } else if (numDiffPixels < (width * height) * 0.05) {
    console.log('⚠️ Có khác biệt nhỏ (dưới 5%). Xem ảnh diff.png để biết chi tiết.');
  } else {
    console.log('❌ UI khác biệt lớn. Xem ảnh diff.png.');
  }
  console.log(`Diff image saved at: ${diffPath}`);

  await browser.close();
}

compare().catch(console.error);