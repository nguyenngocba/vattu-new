const express = require('express');
const { transactionId } = require('../utils/ids');

module.exports = function structureExportReturnRoutes({ withTransaction, clearCache }) {
  const router = express.Router();

  router.post('/api/export-structure', async (req, res) => {
    const { structureId, projectId, quantity, note, datetime, attachment } = req.body;

    try {
      await withTransaction(async (client) => {
        const qty = parseFloat(quantity);

        const stock = await client.query(
          'SELECT qty, cost FROM structures WHERE id=$1 FOR UPDATE',
          [structureId]
        );

        if (!stock.rows[0] || parseFloat(stock.rows[0].qty) < qty) {
          throw new Error('Không đủ cấu kiện trong kho!');
        }

        const cost = Number(stock.rows[0].cost || 0);
        const totalCost = cost * qty;
        const dt = datetime || new Date().toISOString();

        await client.query(
          'UPDATE structures SET qty = qty - $1 WHERE id=$2',
          [qty, structureId]
        );

        await client.query(
          `INSERT INTO transactions (id, mid, project_id, type, qty, unit_price, total_amount, note, date, datetime, attachment)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            transactionId(),
            structureId,
            projectId,
            'structure_export',
            qty,
            cost,
            totalCost,
            note || 'Xuất cấu kiện ra công trình',
            dt.split('T')[0],
            dt,
            attachment || '[]'
          ]
        );

        await client.query(
          'UPDATE projects SET spent = spent + $1 WHERE id=$2',
          [totalCost, projectId]
        );
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/return-structure', async (req, res) => {
    const { structureId, projectId, qty, note, datetime, attachment } = req.body;

    try {
      await withTransaction(async (client) => {
        const returnQty = parseFloat(qty);

        const exported = await client.query(
          "SELECT COALESCE(SUM(qty),0) as total FROM transactions WHERE mid=$1 AND project_id=$2 AND type='structure_export'",
          [structureId, projectId]
        );

        const returned = await client.query(
          "SELECT COALESCE(SUM(qty),0) as total FROM transactions WHERE mid=$1 AND project_id=$2 AND type='structure_return'",
          [structureId, projectId]
        );

        const exportedQty = Number(exported.rows[0].total);
        const returnedQty = Number(returned.rows[0].total);
        const avail = exportedQty - returnedQty;

        if (avail < returnQty) {
          throw new Error(
            'Không đủ để trả! Đã xuất: ' + exportedQty + ', đã trả: ' + returnedQty
          );
        }

        const structure = await client.query(
          'SELECT cost FROM structures WHERE id=$1 FOR UPDATE',
          [structureId]
        );

        const cost = Number(structure.rows[0]?.cost || 0);
        const totalCost = cost * returnQty;
        const dt = datetime || new Date().toISOString();

        await client.query(
          'UPDATE structures SET qty = qty + $1 WHERE id=$2',
          [returnQty, structureId]
        );

        await client.query(
          `INSERT INTO transactions (id, mid, project_id, type, qty, unit_price, total_amount, note, date, datetime, attachment)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            transactionId(),
            structureId,
            projectId,
            'structure_return',
            returnQty,
            cost,
            totalCost,
            note || 'Trả cấu kiện về kho',
            dt.split('T')[0],
            dt,
            attachment || '[]'
          ]
        );

        await client.query(
          'UPDATE projects SET spent = spent - $1 WHERE id=$2',
          [totalCost, projectId]
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
