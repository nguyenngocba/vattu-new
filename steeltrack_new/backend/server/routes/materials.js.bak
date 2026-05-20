const express = require('express');

module.exports = function materialsRoutes({ pool, clearCache, notifyAll }) {
  const router = express.Router();

  router.post('/api/materials', async (req, res) => {
    const m = req.body;
    await pool.query(
      `INSERT INTO materials (id, name, cat, unit, qty, cost, low, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, cat=$3, unit=$4, qty=$5, cost=$6, low=$7, note=$8`,
      [m.id, m.name, m.cat, m.unit, m.qty, m.cost, m.low, m.note || '']
    );
    await clearCache();
    notifyAll('dataChanged', { type: 'material', id: m.id });
    res.json({ success: true });
  });

  router.delete('/api/materials/:id', async (req, res) => {
    await pool.query('DELETE FROM materials WHERE id=$1', [req.params.id]);
    await clearCache();
    notifyAll('dataChanged', { type: 'material_deleted' });
    res.json({ success: true });
  });

  return router;
};
