const express = require('express');

module.exports = function dataRoutes({ pool, getCache, setCache }) {
  const router = express.Router();

  router.get('/api/data', async (req, res) => {
    try {
      const cached = await getCache('api_data');
      if (cached) return res.json(JSON.parse(cached));
      const m = await pool.query('SELECT * FROM materials');
      const t = await pool.query('SELECT * FROM transactions');
      const p = await pool.query('SELECT * FROM projects');
      const s = await pool.query('SELECT * FROM suppliers');
      const u = await pool.query('SELECT id, name, username, role, permissions FROM users_table');
      const l = await pool.query('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 200');
      const c = await pool.query('SELECT name FROM categories ORDER BY name');
      const un = await pool.query('SELECT name FROM units ORDER BY name');
      const ps = await pool.query('SELECT * FROM project_schedules');
      const pmu = await pool.query('SELECT * FROM project_material_usage');
      const st = await pool.query('SELECT * FROM structures');
      const stm = await pool.query('SELECT * FROM structure_materials');

      const result = {
        success: true,
        data: {
          materials: m.rows,
          transactions: t.rows,
          projects: p.rows,
          suppliers: s.rows,
          users: u.rows,
          logs: l.rows,
          categories: c.rows.map((r) => r.name),
          units: un.rows.map((r) => r.name),
          projectSchedules: ps.rows,
          projectMaterialUsage: pmu.rows,
          structures: st.rows,
          structureMaterials: stm.rows
        }
      };

      await setCache('api_data', JSON.stringify(result), 30);
      res.json(result);
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  });

  return router;
};
