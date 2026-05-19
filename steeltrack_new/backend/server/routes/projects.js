const express = require('express');

module.exports = function projectsRoutes({ pool, clearCache, notifyAll }) {
  const router = express.Router();

  router.post('/api/projects', async (req, res) => {
    const p = req.body;
    await pool.query(
      `INSERT INTO projects (id, name, budget, spent)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET name=$2, budget=$3, spent=$4`,
      [p.id, p.name, p.budget, p.spent]
    );
    await clearCache();
    notifyAll('dataChanged', {});
    res.json({ success: true });
  });

  router.delete('/api/projects/:id', async (req, res) => {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    await clearCache();
    notifyAll('dataChanged', {});
    res.json({ success: true });
  });

  router.post('/api/project-schedules', async (req, res) => {
    const s = req.body;
    await pool.query(
      `INSERT INTO project_schedules (project_id, data)
       VALUES ($1, $2)
       ON CONFLICT (project_id) DO UPDATE SET data=$2`,
      [s.projectId, JSON.stringify(s)]
    );
    res.json({ success: true });
  });

  router.post('/api/project-material-usage', async (req, res) => {
    const u = req.body;
    await pool.query(
      `INSERT INTO project_material_usage (project_id, material_id, used_qty)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, material_id) DO UPDATE SET used_qty=$3`,
      [u.projectId, u.materialId, u.usedQty]
    );
    res.json({ success: true });
  });

  return router;
};
