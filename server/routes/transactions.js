const express = require('express');

module.exports = function transactionsRoutes({ withTransaction, clearCache, notifyAll }) {
  const router = express.Router();

  router.post('/api/transactions', async (req, res) => {
    const t = req.body;

    try {
      await withTransaction(async (client) => {
        if (t.type === 'usage') {
          const stock = await client.query(
            'SELECT qty FROM materials WHERE id=$1 FOR UPDATE',
            [t.mid]
          );

          if (stock.rows[0] && parseFloat(stock.rows[0].qty) < parseFloat(t.qty)) {
            throw new Error('Không đủ tồn kho!');
          }
        }

        await client.query(
          `INSERT INTO transactions
           (id, mid, supplier_id, project_id, date, datetime, type, qty, unit_price, vat_rate, subtotal, vat_amount, total_amount, note, attachment, invoice_image)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            t.id,
            t.mid,
            t.supplierId || '',
            t.projectId || '',
            t.date,
            t.datetime,
            t.type,
            t.qty,
            t.unitPrice,
            t.vatRate,
            t.subtotal,
            t.vatAmount,
            t.totalAmount,
            t.note,
            t.attachment,
            t.invoiceImage
          ]
        );

        if (t.type === 'purchase') {
          await client.query('UPDATE materials SET qty=qty+$1 WHERE id=$2', [t.qty, t.mid]);
        } else if (t.type === 'usage') {
          await client.query('UPDATE materials SET qty=qty-$1 WHERE id=$2', [t.qty, t.mid]);
        } else if (t.type === 'return') {
          await client.query('UPDATE materials SET qty=qty+$1 WHERE id=$2', [t.qty, t.mid]);
        }
      });

      await clearCache();
      notifyAll('dataChanged', { type: 'transaction', id: t.id });
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  });

  return router;
};
