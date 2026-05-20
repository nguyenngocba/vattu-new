import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const BASE_URL_REACT = 'http://172.168.53.114:5179';
const API_BASE = 'http://localhost:3001';
let testId = `TEST_${Date.now()}`;

async function testAPI() {
  console.log('\n📡 TESTING API...');
  const res = await fetch(`${API_BASE}/api/data`);
  const json = await res.json();
  if (json.success && Array.isArray(json.data?.materials)) {
    console.log('✅ API /api/data OK, materials:', json.data.materials.length);
  } else throw new Error('API invalid');
}

async function testCRUD() {
  console.log('\n🔄 TESTING CRUD...');
  const newMat = { id: testId, name: 'Test Material', cat: 'Test', unit: 'cái', qty: 10, cost: 100000, low: 5, note: 'Auto test' };
  let res = await fetch(`${API_BASE}/api/materials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMat) });
  let data = await res.json();
  if (!data.success) throw new Error('Create failed');
  console.log('✅ Create');

  res = await fetch(`${API_BASE}/api/data`);
  const json = await res.json();
  const found = json.data.materials.find(m => m.id === testId);
  if (!found) throw new Error('Not found');
  console.log('✅ Read');

  found.name = 'Updated';
  res = await fetch(`${API_BASE}/api/materials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(found) });
  data = await res.json();
  if (!data.success) throw new Error('Update failed');
  console.log('✅ Update');

  res = await fetch(`${API_BASE}/api/materials/${testId}`, { method: 'DELETE' });
  data = await res.json();
  if (!data.success) throw new Error('Delete failed');
  console.log('✅ Delete');
}

async function testUI() {
  console.log('\n🌐 TESTING UI LOAD...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(BASE_URL_REACT);
  await page.waitForSelector('.inventory-workbench', { timeout: 5000 });
  const title = await page.title();
  console.log('Page title:', title);
  await browser.close();
  console.log('✅ React UI loaded');
}

async function run() {
  console.log('🧪 STARTING FUNCTIONAL TESTS');
  await testAPI();
  await testCRUD();
  await testUI();
  console.log('\n✅ ALL TESTS PASSED');
}

run().catch(err => { console.error('❌ FAILED:', err); process.exit(1); });