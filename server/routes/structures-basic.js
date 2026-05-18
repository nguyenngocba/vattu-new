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
          `INSERT INTO structures (
             id, name, unit, qty, cost, note,
             type, zone, position_x, position_y, layer, rotation,
             length, width, height, weight, project_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             unit = EXCLUDED.unit,
             qty = EXCLUDED.qty,
             cost = EXCLUDED.cost,
             note = EXCLUDED.note,
             type = EXCLUDED.type,
             zone = EXCLUDED.zone,
             position_x = EXCLUDED.position_x,
             position_y = EXCLUDED.position_y,
             layer = EXCLUDED.layer,
             rotation = EXCLUDED.rotation,
             length = EXCLUDED.length,
             width = EXCLUDED.width,
             height = EXCLUDED.height,
             weight = EXCLUDED.weight,
             project_id = EXCLUDED.project_id`,
          [
            s.id,
            s.name,
            s.unit,
            s.qty || 0,
            s.cost || 0,
            s.note || '',
            s.type || '',
            s.zone || '',
            s.position_x ?? s.positionX ?? 0,
            s.position_y ?? s.positionY ?? 0,
            s.layer || 1,
            s.rotation || 0,
            s.length || s.length_m || 6,
            s.width || s.width_m || 1.2,
            s.height || s.height_m || 0.8,
            s.weight || 1200,
            s.project_id || s.projectId || null
          ]
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
