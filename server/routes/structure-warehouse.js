const express = require('express');
const { transactionId } = require('../utils/ids');

module.exports = function structureWarehouseRoutes({ pool, withTransaction, clearCache }) {
  const router = express.Router();

  router.post('/api/transfer-to-structure-warehouse', async (req, res) => {
    const { items, note, datetime } = req.body;

    try {
      await withTransaction(async (client) => {
        for (const item of items || []) {
          const qty = parseFloat(item.qty);

          const stock = await client.query(
            'SELECT qty FROM materials WHERE id=$1 FOR UPDATE',
            [item.mid]
          );

          if (!stock.rows[0] || parseFloat(stock.rows[0].qty) < qty) {
            throw new Error('Không đủ ' + item.name + ' trong kho chính!');
          }

          const cleanName = String(item.name || '').replace(/ *\(Ton:.*\)/, '');
          const now = datetime || new Date().toISOString();

          await client.query(
            'UPDATE materials SET qty = qty - $1 WHERE id=$2',
            [qty, item.mid]
          );

          await client.query(
  `INSERT INTO sw_logs (material_id, material_name, qty, unit, cost, note, attachment, type, created_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
  [
    item.mid,
    cleanName,
    qty,
    item.unit,
    item.cost || 0,
    note || 'Chuyển sang kho CK',
    req.body.attachment || '[]',
    'transfer_to_sw',
    now
  ]
);


          await client.query(
            `INSERT INTO structure_warehouse (material_id, material_name, unit, qty, cost)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (material_id) DO UPDATE SET qty = structure_warehouse.qty + $4`,
            [item.mid, cleanName, item.unit, qty, item.cost || 0]
          );

          await client.query(
            `INSERT INTO transactions (id, mid, type, qty, total_amount, note, date, datetime)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              transactionId(),
              item.mid,
              'transfer_sw',
              qty,
              0,
              note || 'Chuyển sang kho cấu kiện',
              now.split('T')[0],
              now
            ]
          );
        }
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.get('/api/structure-warehouse', async (req, res) => {
    try {
      const items = await pool.query('SELECT * FROM structure_warehouse ORDER BY material_name');
      res.json({ success: true, data: items.rows });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.get('/api/sw-options', async (req, res) => {
    try {
      const items = await pool.query('SELECT * FROM structure_warehouse ORDER BY material_name');
      if (items.rows.length === 0) return res.send('<option value="">Kho CK trống!</option>');

      const html = items.rows.map((m) =>
        '<option value="' + m.material_id + '" data-unit="' + m.unit + '">' +
        m.material_name +
        ' (CK: ' +
        Number(m.qty).toLocaleString('vi-VN') +
        ' ' +
        m.unit +
        ')</option>'
      ).join('');

      res.send(html);
    } catch (e) {
      res.send('<option value="">Lỗi!</option>');
    }
  });

  router.get('/api/sw-logs/:mid', async (req, res) => {
    try {
      const logs = await pool.query(
        'SELECT * FROM sw_logs WHERE material_id=$1 ORDER BY created_at DESC',
        [req.params.mid]
      );
      res.json({ success: true, data: logs.rows });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/return-from-sw', async (req, res) => {
    const { material_id, qty, note, datetime } = req.body;

    try {
      await withTransaction(async (client) => {
        const returnQty = parseFloat(qty);
        const dt = datetime || new Date().toISOString();
        const sw = await client.query(
          'SELECT * FROM structure_warehouse WHERE material_id=$1 FOR UPDATE',
          [material_id]
        );

        if (!sw.rows[0] || parseFloat(sw.rows[0].qty) < returnQty) {
          throw new Error('Không đủ số lượng trong kho CK!');
        }

        const material = await client.query(
          'SELECT name, unit, cost FROM materials WHERE id=$1 FOR UPDATE',
          [material_id]
        );

        const materialName = material.rows[0]?.name || 'N/A';
        const unit = material.rows[0]?.unit || 'cái';
        const cost = Number(material.rows[0]?.cost || 0);

        await client.query(
          'UPDATE structure_warehouse SET qty = qty - $1 WHERE material_id=$2',
          [returnQty, material_id]
        );

        await client.query(
          'UPDATE materials SET qty = qty + $1 WHERE id=$2',
          [returnQty, material_id]
        );

        await client.query(
          `INSERT INTO transactions (id, mid, type, qty, unit_price, total_amount, note, date, datetime, attachment)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
  transactionId(),
  material_id,
  'return_from_sw',
  returnQty,
  cost,
  returnQty * cost,
  note || 'Trả lại từ kho CK về kho chính',
  dt.split('T')[0],
  dt,
  '[]'
]

        );

        await client.query(
          `INSERT INTO sw_logs (material_id, material_name, qty, unit, cost, note, type, created_at)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
  material_id,
  materialName,
  -returnQty,
  unit,
  cost,
  note || 'Trả lại kho chính',
  'return_to_main',
  dt
]

        );
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
