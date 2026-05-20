import puppeteer from 'puppeteer';

const REACT_URL = 'http://172.168.53.114:5179';
const OLD_UI_URL = 'http://172.168.53.114:5178/app.html';

const EXPECTED_FEATURES = [
  // KPI
  { name: 'Tổng giá trị tồn kho', selector: '.inventory-kpi-strip .inventory-kpi-card:first-child strong', reactOnly: false },
  { name: 'Tổng số vật tư', selector: '.inventory-kpi-strip .inventory-kpi-card:nth-child(2) strong', reactOnly: false },
  { name: 'Sắp hết hàng', selector: '.inventory-kpi-strip .inventory-kpi-card:nth-child(3) strong', reactOnly: false },
  { name: 'Chậm luân chuyển', selector: '.inventory-kpi-strip .inventory-kpi-card:nth-child(4) strong', reactOnly: false },
  // Filter
  { name: 'Ô tìm kiếm', selector: '.inventory-filter-card input[placeholder*="Tên"]', reactOnly: false },
  { name: 'Dropdown danh mục', selector: '.inventory-filter-card select', reactOnly: false },
  { name: 'Bộ lọc trạng thái (Tất cả, Sắp hết, Hết hàng, Chậm)', selector: '.inventory-status-filter button', reactOnly: false },
  // Table
  { name: 'Bảng danh sách', selector: '.inventory-table-card table', reactOnly: false },
  { name: 'Cột Thao tác (Sửa, Xóa)', selector: '.inventory-table-card button.sm, .inventory-table-card button.danger-btn', reactOnly: false },
  // Drawer (khi click)
  { name: 'Drawer chi tiết', selector: '.material-detail-drawer', reactOnly: true, dynamic: true },
  { name: 'Tab Transactions trong Drawer', selector: '.material-drawer-tabs button:contains("Transactions")', reactOnly: true, dynamic: true },
  { name: 'Tab Analytics', selector: '.material-drawer-tabs button:contains("Analytics")', reactOnly: true, dynamic: true },
  { name: 'Tab Suppliers', selector: '.material-drawer-tabs button:contains("Suppliers")', reactOnly: true, dynamic: true },
  { name: 'Tab Files', selector: '.material-drawer-tabs button:contains("Files")', reactOnly: true, dynamic: true },
  // Modal thêm/sửa
{ name: 'Nút Thêm vật tư', selector: '#add-material-btn', reactOnly: false },  // Chậm luân chuyển (slow moving) – kiểm tra filter active
  { name: 'Filter "Chậm luân chuyển" hoạt động', selector: '.inventory-status-filter button[data-status="slow"].active', reactOnly: true, dynamic: true },
  // Export Excel
  { name: 'Nút Xuất Excel', selector: 'button:contains("Xuất")', reactOnly: true },
  // Biểu đồ
  { name: 'Biểu đồ tồn kho (Canvas)', selector: 'canvas', reactOnly: true },
];

async function checkPage(url, isReact = true) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']  // <-- THÊM DÒNG NÀY
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Nếu là React, cố gắng click vào dòng đầu tiên để mở drawer nếu cần
  if (isReact) {
    try {
      await page.waitForSelector('.inventory-table-card tbody tr', { timeout: 5000 });
      await page.click('.inventory-table-card tbody tr:first-child');
      await page.waitForTimeout(1000);
    } catch (e) { console.log('Không thể mở drawer tự động'); }
  }
  
  const results = [];
  for (const feature of EXPECTED_FEATURES) {
    if (feature.reactOnly && !isReact) continue;
    let found = false;
    let selector = feature.selector;
    try {
      if (feature.dynamic) {
        await page.waitForTimeout(500);
      }
      const element = await page.$(selector);
      if (element) found = true;
      else {
        if (selector.includes(':contains')) {
          const text = selector.match(/:(contains\("(.+?)"\))/)?.[2];
          if (text) {
            const foundEl = await page.evaluateHandle((t) => {
              const elements = Array.from(document.querySelectorAll('button, a, .btn'));
              return elements.find(el => el.textContent.includes(t));
            }, text);
            if (foundEl && await foundEl.asElement()) found = true;
          }
        }
      }
    } catch (err) {}
    results.push({ name: feature.name, found, selector: feature.selector });
  }
  await browser.close();
  return results;
}

async function runCheck() {
  console.log('🔍 Kiểm tra React Inventory Workspace...');
  const reactResults = await checkPage(REACT_URL, true);
  console.log('\n📋 Kết quả React:');
  const reactFound = reactResults.filter(r => r.found).length;
  const reactTotal = reactResults.length;
  reactResults.forEach(r => console.log(`${r.found ? '✅' : '❌'} ${r.name}`));
  console.log(`\n📊 Độ hoàn thiện React: ${reactFound}/${reactTotal} (${Math.round(reactFound/reactTotal*100)}%)`);
  
  console.log('\n🔍 Kiểm tra UI cũ (tham chiếu)...');
  const oldResults = await checkPage(OLD_UI_URL, false);
  const oldFound = oldResults.filter(r => r.found).length;
  const oldTotal = oldResults.filter(r => !r.reactOnly).length;
  console.log(`\n📋 UI cũ có ${oldFound}/${oldTotal} các thành phần cơ bản.`);
  console.log('\n💡 Gợi ý cần bổ sung cho React:');
  const missing = reactResults.filter(r => !r.found && !(r.reactOnly && r.dynamic));
  missing.forEach(m => console.log(` - ${m.name}`));
}

runCheck().catch(console.error);
