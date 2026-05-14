const express = require('express');
const { transactionId } = require('../utils/ids');

module.exports = function structureProductionRoutes({ withTransaction, clearCache }) {
  const router = express.Router();

  router.post('/api/produce-structure', async (req, res) => {
    const { structureId, quantity, datetime, note, attachment } = req.body;
    const produceQty = Number(quantity);

    if (!structureId || !Number.isFinite(produceQty) || produceQty <= 0) {
      return res.json({ success: false, error: 'Số lượng sản xuất không hợp lệ!' });
    }

    try {
      await withTransaction(async (client) => {
        const bom = await client.query(
          'SELECT * FROM structure_materials WHERE structure_id=$1',
          [structureId]
        );

        if (bom.rows.length === 0) {
          throw new Error('Cấu kiện chưa có BOM vật tư, không thể sản xuất!');
        }

        for (const item of bom.rows) {
          const bomQty = Number(item.quantity);

          if (!Number.isFinite(bomQty) || bomQty <= 0) {
            throw new Error('BOM không hợp lệ cho vật tư: ' + (item.material_name || item.material_id));
          }

          const need = bomQty * produceQty;

          const swStock = await client.query(
            'SELECT qty FROM structure_warehouse WHERE material_id=$1 FOR UPDATE',
            [item.material_id]
          );

          const currentQty = Number(swStock.rows[0]?.qty || 0);

if (!swStock.rows[0] || currentQty < need) {
  throw new Error(
    'Không đủ ' +
    item.material_name +
    ' trong kho cấu kiện! Cần ' +
    need +
    ', hiện có ' +
    currentQty
  );
}

          const updated = await client.query(
  'UPDATE structure_warehouse SET qty = qty - $1 WHERE material_id=$2 AND qty >= $1',
  [need, item.material_id]
);

if (updated.rowCount !== 1) {
  throw new Error('Không đủ ' + item.material_name + ' trong kho cấu kiện!');
}
        }

        await client.query(
          'UPDATE structures SET qty = qty + $1 WHERE id=$2',
          [produceQty, structureId]
        );

        const dt = datetime || new Date().toISOString();

        await client.query(
          `INSERT INTO transactions (id, mid, type, qty, total_amount, note, date, datetime, attachment)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            transactionId(),
            structureId,
            'produce',
            produceQty,
            0,
            note || 'Sản xuất cấu kiện',
            dt.split('T')[0],
            dt,
            attachment || '[]'
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
