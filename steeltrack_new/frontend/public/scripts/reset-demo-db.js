#!/usr/bin/env node

const { Pool } = require('pg');
const redis = require('redis');

const CONFIRM = process.argv.includes('--yes');
const TODAY = new Date('2026-05-16T12:00:00+07:00');

if (!CONFIRM) {
  console.error('Refusing to reset database without --yes.');
  console.error('Run: node scripts/reset-demo-db.js --yes');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  database: process.env.PGDATABASE || 'steeltrack',
  user: process.env.PGUSER || 'postgres',
  port: Number(process.env.PGPORT || 5432)
});

const categories = [
  'Thép hình',
  'Thép tấm',
  'Thép hộp',
  'Ống thép',
  'Bu lông - Ốc vít',
  'Vật tư hàn cắt',
  'Sơn - Chống gỉ',
  'Vật tư phụ'
];

const units = ['tấn', 'kg', 'cái', 'mét', 'tấm', 'thùng', 'bộ'];

const materials = [
  ['M001', 'Thép hình H200x200x8x12', 'Thép hình', 'tấn', 23800000, 18],
  ['M002', 'Thép hình H300x300x10x15', 'Thép hình', 'tấn', 24600000, 15],
  ['M003', 'Thép I250x125x6x9', 'Thép hình', 'tấn', 23200000, 20],
  ['M004', 'Thép U200x75x8.5', 'Thép hình', 'tấn', 22600000, 20],
  ['M005', 'Thép tấm SS400 dày 6mm', 'Thép tấm', 'tấn', 21800000, 25],
  ['M006', 'Thép tấm SS400 dày 10mm', 'Thép tấm', 'tấn', 22400000, 22],
  ['M007', 'Thép tấm SS400 dày 16mm', 'Thép tấm', 'tấn', 23100000, 18],
  ['M008', 'Thép hộp 100x100x4', 'Thép hộp', 'tấn', 24800000, 12],
  ['M009', 'Thép hộp 150x150x5', 'Thép hộp', 'tấn', 25500000, 10],
  ['M010', 'Ống thép D90x3.2', 'Ống thép', 'tấn', 24200000, 10],
  ['M011', 'Ống thép D114x4.0', 'Ống thép', 'tấn', 24900000, 10],
  ['M012', 'Bu lông neo M24x700', 'Bu lông - Ốc vít', 'cái', 68000, 120],
  ['M013', 'Bu lông cường độ cao M20x70', 'Bu lông - Ốc vít', 'cái', 18500, 500],
  ['M014', 'Bu lông cường độ cao M22x80', 'Bu lông - Ốc vít', 'cái', 24000, 400],
  ['M015', 'Que hàn E7018 phi 4.0', 'Vật tư hàn cắt', 'kg', 42000, 800],
  ['M016', 'Dây hàn lõi thuốc E71T-1', 'Vật tư hàn cắt', 'kg', 52000, 600],
  ['M017', 'Đá cắt inox 355mm', 'Vật tư hàn cắt', 'cái', 38000, 150],
  ['M018', 'Sơn chống gỉ epoxy xám', 'Sơn - Chống gỉ', 'thùng', 1480000, 20],
  ['M019', 'Sơn phủ polyurethane xanh', 'Sơn - Chống gỉ', 'thùng', 1720000, 18],
  ['M020', 'Xà gồ C150x50x20x2.0', 'Thép hộp', 'mét', 118000, 800]
].map(([id, name, cat, unit, cost, low]) => ({ id, name, cat, unit, cost, low, qty: 0 }));

const supplierNames = [
  'Công ty Thép Hòa Phát Miền Nam',
  'Công ty CP Thép Nam Kim',
  'Công ty TNHH Thép Pomina',
  'Công ty Thép Việt Nhật',
  'Công ty TNHH Vật Tư Xây Dựng An Phát',
  'Công ty Thép Đại Thiên Lộc',
  'Công ty TNHH Thép Á Châu',
  'Công ty CP Kim Khí Sài Gòn',
  'Công ty TNHH Bulong Ốc Vít Thành Công',
  'Công ty TNHH Vật Tư Hàn Việt Đức',
  'Công ty Sơn Công Nghiệp KCC Việt Nam',
  'Công ty Sơn Jotun Việt Nam',
  'Công ty TNHH Thép Minh Phát',
  'Công ty TNHH Cơ Khí Vật Tư Tân Thành',
  'Công ty CP Thép Miền Tây',
  'Công ty TNHH Thương Mại Thép Đức Thành',
  'Công ty TNHH Thép Bình Dương',
  'Công ty TNHH Kim Khí Đông Á',
  'Công ty TNHH Vật Tư Cơ Khí Phú Gia',
  'Công ty CP Thép Việt Úc',
  'Công ty TNHH Sơn Hải Phòng CN Miền Nam',
  'Công ty TNHH Thiết Bị Hàn Nam Việt',
  'Công ty TNHH Vật Tư Công Nghiệp Hưng Thịnh',
  'Công ty TNHH Thép Hoàng Gia',
  'Công ty TNHH Kim Khí An Bình',
  'Công ty CP Cơ Điện Vật Tư Long Thành',
  'Công ty TNHH Thép Trường Phát',
  'Công ty TNHH Bulong Đại Nam',
  'Công ty TNHH Vật Tư Kết Cấu Việt',
  'Công ty TNHH Thép Gia Phát'
];

const projectNames = [
  'Nhà xưởng Sunrise Long An',
  'Kho lạnh Mekong Logistics',
  'Nhà máy bao bì Tân Phú',
  'Xưởng cơ khí Bình Dương',
  'Trung tâm phân phối An Sương',
  'Nhà máy thực phẩm GreenFarm',
  'Kho thép Phú Mỹ',
  'Nhà xưởng may Phước Đông',
  'Nhà máy nhựa Nam Việt',
  'Khu bảo trì xe buýt Củ Chi',
  'Nhà máy gỗ Đức Hòa',
  'Kho tổng hợp Sóng Thần',
  'Nhà xưởng điện tử VSIP',
  'Nhà máy thức ăn chăn nuôi Đồng Nai',
  'Kho hàng cảng Cát Lái',
  'Xưởng sản xuất nội thất Hóc Môn',
  'Nhà máy dược phẩm Tân Uyên',
  'Trạm logistics Nhơn Trạch',
  'Nhà xưởng cơ điện Quận 12',
  'Kho nguyên liệu Bến Lức',
  'Nhà máy giấy Mỹ Phước',
  'Xưởng lắp ráp xe điện',
  'Nhà máy nước giải khát Tây Ninh',
  'Kho phân phối Bình Chánh',
  'Nhà máy sơn Long Thành',
  'Xưởng bao bì carton Cần Giuộc',
  'Nhà máy cơ khí chính xác Biên Hòa',
  'Kho lạnh thủy sản Vũng Tàu',
  'Nhà xưởng phụ trợ Dĩ An',
  'Trung tâm vận hành Đức Trọng',
  'Nhà máy phân bón Long An',
  'Kho vật tư công nghiệp Tân Tạo',
  'Nhà xưởng sản xuất pallet',
  'Nhà máy nông sản Cái Bè',
  'Xưởng gia công thép Thủ Đức',
  'Kho ngoại quan Hiệp Phước',
  'Nhà máy điện mặt trời phụ trợ',
  'Trung tâm bảo trì thiết bị',
  'Nhà máy chế biến gạo Sa Đéc',
  'Xưởng sản xuất container module'
];

const structureNames = [
  'Cột biên CB-01', 'Cột giữa CG-02', 'Kèo chính KC-01', 'Kèo phụ KP-02', 'Dầm cầu trục DCT-01',
  'Xà gồ mái XGM-01', 'Xà gồ vách XGV-01', 'Giằng mái GM-01', 'Giằng cột GC-01', 'Dầm sàn DS-01',
  'Bản mã chân cột BMC-01', 'Bản mã liên kết BMLK-01', 'Lan can thép LC-01', 'Cầu thang thép CT-01', 'Khung cửa trời KCT-01',
  'Mái canopy MCP-01', 'Khung đỡ thiết bị KDTB-01', 'Sàn thao tác STT-01', 'Dầm phụ DP-01', 'Kèo đầu hồi KDH-01',
  'Cột hồi CH-01', 'Giằng xà gồ GXG-01', 'Thanh chống TC-01', 'Bệ đỡ máy BDM-01', 'Khung vách KV-01',
  'Máng xối thép MX-01', 'Khung mái phụ KMP-01', 'Dầm treo DT-01', 'Bậc thang BT-01', 'Thanh neo TN-01'
];

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function id(prefix, n) {
  return `${prefix}${String(n).padStart(4, '0')}`;
}

function dateAt(year, monthIndex, day, hour = 9) {
  return new Date(Date.UTC(year, monthIndex, day, hour - 7, 0, 0));
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function allowedMonths(year) {
  if (year < TODAY.getFullYear()) return 12;
  return TODAY.getMonth() + 1;
}

function annualUsageTarget(year) {
  if (year < TODAY.getFullYear()) return 30000000000;
  return Math.round(30000000000 * (allowedMonths(year) / 12));
}

function pickMaterial(index) {
  return materials[index % materials.length];
}

let seed = 20260516;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function randBetween(min, max) {
  return min + rand() * (max - min);
}

function randInt(min, max) {
  return Math.floor(randBetween(min, max + 1));
}

function shuffle(list) {
  return [...list].sort(() => rand() - 0.5);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function materialDigits(mat) {
  return ['tấn'].includes(mat.unit) ? 3 : 0;
}

function roundQty(mat, qty) {
  return Math.max(0, round(qty, materialDigits(mat)));
}

async function clearRedisCache() {
  const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  client.on('error', () => {});
  try {
    await client.connect();
    await client.del('api_data');
  } catch (e) {
    // Redis is optional for this script.
  } finally {
    try {
      await client.quit();
    } catch (e) {}
  }
}

async function main() {
  const client = await pool.connect();
  const suppliers = supplierNames.map((name, index) => ({
    id: id('S', index + 1),
    name,
    phone: `09${String(10000000 + index * 217391).slice(0, 8)}`,
    email: `ncc${String(index + 1).padStart(2, '0')}@steeltrack.test`,
    address: `${12 + index} Đường công nghiệp ${index + 1}, TP.HCM`
  }));
  const projects = projectNames.map((name, index) => ({
    id: id('P', index + 1),
    name,
    budget: 3200000000 + (index % 8) * 450000000,
    spent: 0
  }));
  const structures = structureNames.map((name, index) => ({
    id: id('K', index + 1),
    name,
    unit: 'cái',
    qty: 12 + (index % 9) * 3,
    cost: 8500000 + (index % 10) * 1250000,
    note: 'Dữ liệu mẫu cấu kiện nhà thép'
  }));

  const transactions = [];
  const projectUsage = new Map();
  let txNo = 1;

  function addTxn(txn) {
    transactions.push({ id: id('T', txNo++), ...txn });
  }

  const longGapMaterials = new Set(['M002', 'M007', 'M011', 'M014', 'M019']);
  const stockoutMonths = new Set(['2023-08', '2024-03', '2024-11', '2025-06', '2026-02']);

  for (const year of [2023, 2024, 2025, 2026]) {
    const months = allowedMonths(year);
    const usageTarget = annualUsageTarget(year);
    const rawMonthWeights = Array.from({ length: months }, (_, month) => {
      const seasonal = [0.72, 0.86, 1.18, 1.32, 0.96, 1.48, 0.88, 1.08, 1.36, 1.12, 0.78, 1.24][month];
      return seasonal * randBetween(0.72, 1.34);
    });
    const totalMonthWeight = rawMonthWeights.reduce((sum, value) => sum + value, 0);

    for (let month = 0; month < months; month += 1) {
      const monthKeyText = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthlyUsage = usageTarget * rawMonthWeights[month] / totalMonthWeight;
      const activeMaterials = shuffle(materials).slice(0, randInt(8, 14));
      const monthDays = daysInMonth(year, month);
      const weekStarts = [2, 9, 16, 23].filter(day => day <= monthDays);

      activeMaterials.forEach((mat, index) => {
        const cadence = longGapMaterials.has(mat.id) ? randInt(4, 7) : randInt(1, 3);
        const shouldPlannedBuy = month === 0 || ((month + year + index) % cadence === 0 && rand() > 0.22);
        if (!shouldPlannedBuy) return;

        const supplier = suppliers[(year + month * 7 + index * 3) % suppliers.length];
        const targetStockValue = monthlyUsage * randBetween(0.08, 0.22);
        const qty = roundQty(mat, targetStockValue / mat.cost);
        if (qty <= 0) return;

        const price = Math.round(mat.cost * randBetween(0.94, 1.08));
        const subtotal = qty * price;
        const vatRate = rand() > 0.25 ? 10 : 8;
        const vatAmount = subtotal * vatRate / 100;
        const date = dateAt(year, month, randInt(1, Math.min(8, monthDays)), randInt(8, 15));

        mat.qty += qty;
        mat.cost = Math.round((mat.cost * 0.75) + (price * 0.25));
        addTxn({
          mid: mat.id,
          supplier_id: supplier.id,
          project_id: '',
          date: isoDate(date),
          datetime: date,
          type: 'purchase',
          qty,
          unit_price: price,
          vat_rate: vatRate,
          subtotal,
          vat_amount: vatAmount,
          total_amount: subtotal + vatAmount,
          note: longGapMaterials.has(mat.id)
            ? `Nhập theo chu kỳ dài ${mat.name} tháng ${month + 1}/${year}`
            : `Nhập kế hoạch tuần đầu tháng ${month + 1}/${year}`,
          attachment: '[]',
          invoice_image: ''
        });
      });

      const rawWeekWeights = weekStarts.map((_, weekIndex) => randBetween(0.58, 1.45) * (weekIndex === 2 ? 1.18 : 1));
      const totalWeekWeight = rawWeekWeights.reduce((sum, value) => sum + value, 0);

      weekStarts.forEach((startDay, weekIndex) => {
        const weeklyUsage = monthlyUsage * rawWeekWeights[weekIndex] / totalWeekWeight;
        const events = randInt(3, 6);
        for (let i = 0; i < events; i += 1) {
          const mat = activeMaterials[(weekIndex * 5 + i + randInt(0, activeMaterials.length - 1)) % activeMaterials.length];
          const project = projects[(year + month * 5 + weekIndex * 3 + i) % projects.length];
          const amount = weeklyUsage * randBetween(0.12, 0.32);
          let qty = roundQty(mat, amount / mat.cost);
          if (qty <= 0) qty = roundQty(mat, mat.low * randBetween(0.25, 0.9));
          if (stockoutMonths.has(monthKeyText) && i === events - 1) {
            qty = roundQty(mat, Math.max(qty, mat.qty + mat.low * randBetween(0.35, 0.9)));
          }

          let exportQty = Math.min(qty, mat.qty);
          const usageDay = Math.min(monthDays, startDay + randInt(0, 5));
          let date = dateAt(year, month, usageDay, randInt(9, 17));

          if (exportQty > 0) {
            exportQty = roundQty(mat, exportQty);
            const subtotal = exportQty * mat.cost;
            mat.qty = roundQty(mat, mat.qty - exportQty);
            project.spent += subtotal;
            projectUsage.set(`${project.id}:${mat.id}`, (projectUsage.get(`${project.id}:${mat.id}`) || 0) + exportQty);
            addTxn({
              mid: mat.id,
              supplier_id: '',
              project_id: project.id,
              date: isoDate(date),
              datetime: date,
              type: 'usage',
              qty: exportQty,
              unit_price: mat.cost,
              vat_rate: 0,
              subtotal,
              vat_amount: 0,
              total_amount: subtotal,
              note: `Xuất tuần ${weekIndex + 1} cho ${project.name}`,
              attachment: '[]',
              invoice_image: ''
            });
          }

          if (exportQty < qty) {
            const shortage = roundQty(mat, qty - exportQty);
            const supplier = suppliers[(year + month * 11 + weekIndex * 5 + i) % suppliers.length];
            const restockQty = roundQty(mat, shortage * randBetween(1.25, 2.8) + mat.low * randBetween(0.15, 0.8));
            const price = Math.round(mat.cost * randBetween(0.96, 1.12));
            const subtotal = restockQty * price;
            const vatRate = 10;
            const restockDay = Math.min(monthDays, usageDay + randInt(2, 9));
            const restockDate = dateAt(year, month, restockDay, randInt(8, 14));

            mat.qty += restockQty;
            mat.cost = Math.round((mat.cost * 0.7) + (price * 0.3));
            addTxn({
              mid: mat.id,
              supplier_id: supplier.id,
              project_id: '',
              date: isoDate(restockDate),
              datetime: restockDate,
              type: 'purchase',
              qty: restockQty,
              unit_price: price,
              vat_rate: vatRate,
              subtotal,
              vat_amount: subtotal * vatRate / 100,
              total_amount: subtotal * (1 + vatRate / 100),
              note: `Nhập bù sau khi gần cạn tồn ${mat.name}`,
              attachment: '[]',
              invoice_image: ''
            });

            const remainingQty = roundQty(mat, shortage * randBetween(0.65, 1));
            if (remainingQty > 0 && mat.qty >= remainingQty) {
              const followDate = dateAt(year, month, Math.min(monthDays, restockDay + randInt(1, 3)), randInt(9, 17));
              const followTotal = remainingQty * mat.cost;
              mat.qty = roundQty(mat, mat.qty - remainingQty);
              project.spent += followTotal;
              projectUsage.set(`${project.id}:${mat.id}`, (projectUsage.get(`${project.id}:${mat.id}`) || 0) + remainingQty);
              addTxn({
                mid: mat.id,
                supplier_id: '',
                project_id: project.id,
                date: isoDate(followDate),
                datetime: followDate,
                type: 'usage',
                qty: remainingQty,
                unit_price: mat.cost,
                vat_rate: 0,
                subtotal: followTotal,
                vat_amount: 0,
                total_amount: followTotal,
                note: `Xuất tiếp sau nhập bù cho ${project.name}`,
                attachment: '[]',
                invoice_image: ''
              });
            }
          }
        }
      });

      if (rand() > 0.48) {
        const mat = activeMaterials[randInt(0, activeMaterials.length - 1)];
        const project = projects[(month * 5 + year) % projects.length];
        const qty = roundQty(mat, Math.min(mat.low * randBetween(0.15, 0.55), Math.max(mat.qty * 0.2, 0)));
        if (qty > 0) {
          const subtotal = qty * mat.cost;
          const date = dateAt(year, month, Math.min(monthDays, randInt(22, monthDays)), 15);
          mat.qty += qty;
          project.spent = Math.max(0, project.spent - subtotal);
          projectUsage.set(`${project.id}:${mat.id}`, Math.max(0, (projectUsage.get(`${project.id}:${mat.id}`) || 0) - qty));
          addTxn({
            mid: mat.id,
            supplier_id: '',
            project_id: project.id,
            date: isoDate(date),
            datetime: date,
            type: 'return',
            qty,
            unit_price: mat.cost,
            vat_rate: 0,
            subtotal,
            vat_amount: 0,
            total_amount: subtotal,
            note: `Trả vật tư dư cuối tháng từ ${project.name}`,
            attachment: '[]',
            invoice_image: ''
          });
        }
      }
    }
  }

  structures.forEach((structure, index) => {
    const project = projects[index % projects.length];
    const qty = 2 + (index % 5);
    const total = qty * structure.cost;
    const produceQty = structure.qty + qty;
    const produceDate = dateAt(2025, index % 12, 5, 8);
    const date = dateAt(2025, index % 12, 12, 9);

    addTxn({
      mid: structure.id,
      supplier_id: '',
      project_id: '',
      date: isoDate(produceDate),
      datetime: produceDate,
      type: 'produce',
      qty: produceQty,
      unit_price: 0,
      vat_rate: 0,
      subtotal: 0,
      vat_amount: 0,
      total_amount: 0,
      note: `Sản xuất cấu kiện ${structure.name}`,
      attachment: '[]',
      invoice_image: ''
    });

    addTxn({
      mid: structure.id,
      supplier_id: '',
      project_id: project.id,
      date: isoDate(date),
      datetime: date,
      type: 'structure_export',
      qty,
      unit_price: structure.cost,
      vat_rate: 0,
      subtotal: total,
      vat_amount: 0,
      total_amount: total,
      note: `Xuất cấu kiện ${structure.name}`,
      attachment: '[]',
      invoice_image: ''
    });
    project.spent += total;
    structure.qty = Math.max(0, structure.qty - qty);
  });

  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE
        transactions,
        materials,
        suppliers,
        projects,
        structures,
        structure_materials,
        structure_warehouse,
        sw_logs,
        project_material_usage,
        project_schedules,
        logs,
        categories,
        units,
        users_table
      RESTART IDENTITY CASCADE
    `);

    for (const category of categories) {
      await client.query('INSERT INTO categories (name) VALUES ($1)', [category]);
    }

    for (const unit of units) {
      await client.query('INSERT INTO units (name) VALUES ($1)', [unit]);
    }

    const adminPerms = {
      canCreateMaterial: true,
      canDeleteMaterial: true,
      canEditMaterial: true,
      canImport: true,
      canExport: true,
      canDeleteProject: true,
      canAccessSettings: true,
      canManageSupplier: true
    };
    await client.query(
      'INSERT INTO users_table (id, name, username, password, role, permissions) VALUES ($1,$2,$3,$4,$5,$6)',
      ['u1', 'Admin', 'admin', 'admin123', 'admin', adminPerms]
    );
    await client.query(
      'INSERT INTO users_table (id, name, username, password, role, permissions) VALUES ($1,$2,$3,$4,$5,$6)',
      ['u2', 'Nhân viên kho', 'staff', 'staff123', 'user', { canImport: true, canExport: true }]
    );

    for (const supplier of suppliers) {
      await client.query(
        'INSERT INTO suppliers (id, name, phone, email, address) VALUES ($1,$2,$3,$4,$5)',
        [supplier.id, supplier.name, supplier.phone, supplier.email, supplier.address]
      );
    }

    for (const project of projects) {
      await client.query(
        'INSERT INTO projects (id, name, budget, spent) VALUES ($1,$2,$3,$4)',
        [project.id, project.name, project.budget, project.spent]
      );
    }

    for (const mat of materials) {
      await client.query(
        'INSERT INTO materials (id, name, cat, unit, qty, cost, low, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [mat.id, mat.name, mat.cat, mat.unit, Math.max(0, round(mat.qty, mat.unit === 'tấn' ? 3 : 0)), mat.cost, mat.low, 'Dữ liệu mẫu sạch 2023-2026']
      );
    }

    for (const structure of structures) {
      await client.query(
        'INSERT INTO structures (id, name, unit, qty, cost, note) VALUES ($1,$2,$3,$4,$5,$6)',
        [structure.id, structure.name, structure.unit, structure.qty, structure.cost, structure.note]
      );

      for (let i = 0; i < 3; i += 1) {
        const mat = materials[(structureNames.indexOf(structure.name) * 3 + i) % materials.length];
        await client.query(
          'INSERT INTO structure_materials (structure_id, material_id, material_name, unit, quantity) VALUES ($1,$2,$3,$4,$5)',
          [structure.id, mat.id, mat.name, mat.unit, round(0.15 + i * 0.08, 3)]
        );
      }
    }

    for (const [key, usedQty] of projectUsage.entries()) {
      const [projectId, materialId] = key.split(':');
      if (usedQty <= 0) continue;
      await client.query(
        'INSERT INTO project_material_usage (project_id, material_id, used_qty) VALUES ($1,$2,$3)',
        [projectId, materialId, round(usedQty, 3)]
      );
    }

    for (const txn of transactions) {
      await client.query(
        `INSERT INTO transactions
         (id, mid, supplier_id, project_id, date, datetime, type, qty, unit_price, vat_rate, subtotal, vat_amount, total_amount, note, attachment, invoice_image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          txn.id,
          txn.mid,
          txn.supplier_id,
          txn.project_id,
          txn.date,
          txn.datetime,
          txn.type,
          txn.qty,
          txn.unit_price,
          txn.vat_rate,
          txn.subtotal,
          txn.vat_amount,
          txn.total_amount,
          txn.note,
          txn.attachment,
          txn.invoice_image
        ]
      );
    }

    await client.query(
      'INSERT INTO logs (id, user_id, user_name, action, details) VALUES ($1,$2,$3,$4,$5)',
      ['LOG-DEMO-SEED', 'system', 'System', 'Reset dữ liệu mẫu', 'Seed dữ liệu sạch từ 2023 đến 16/05/2026']
    );

    await client.query('COMMIT');
    await clearRedisCache();

    const usageByYear = {};
    transactions.filter(t => t.type === 'usage').forEach(t => {
      const year = new Date(t.datetime).getUTCFullYear();
      usageByYear[year] = (usageByYear[year] || 0) + Number(t.total_amount || 0);
    });

    console.log('Demo database reset complete.');
    console.log(JSON.stringify({
      materials: materials.length,
      suppliers: suppliers.length,
      projects: projects.length,
      structures: structures.length,
      transactions: transactions.length,
      usageByYear
    }, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
