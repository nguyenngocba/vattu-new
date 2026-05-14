const express = require('express');

module.exports = function structuresBasicRoutes({ pool, withTransaction, clearCache }) {
  const router = express.Router();

  router.get('/api/structures', async (req, res) => {
    try {
      const s = await pool.query('SELECT * FROM structures ORDER BY name');
      const m = await pool.query('SELECT * FROM structure_materials');
      res.json({ success: true, structures: s.rows, materials: m.rows });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/structures', async (req, res) => {
    const s = req.body;

    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO structures (id, name, unit, qty, cost, note)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             unit = EXCLUDED.unit,
             qty = EXCLUDED.qty,
             cost = EXCLUDED.cost,
             note = EXCLUDED.note`,
          [s.id, s.name, s.unit, s.qty || 0, s.cost || 0, s.note || '']
        );

        await client.query('DELETE FROM structure_materials WHERE structure_id = $1', [s.id]);

        if (Array.isArray(s.materials)) {
          for (const m of s.materials) {
            if (m.materialId && m.quantity) {
              await client.query(
                `INSERT INTO structure_materials (structure_id, material_id, material_name, unit, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [s.id, m.materialId, m.materialName || '', m.unit || '', m.quantity]
              );
            }
          }
        }
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      console.error('Save structure error:', e);
      res.json({ success: false, error: e.message });
    }
  });

  router.delete('/api/structures/:id', async (req, res) => {
    try {
      await withTransaction(async (client) => {
        await client.query('DELETE FROM structures WHERE id=$1', [req.params.id]);
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
