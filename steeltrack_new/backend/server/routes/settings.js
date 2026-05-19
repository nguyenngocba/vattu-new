const express = require('express');

module.exports = function settingsRoutes({ pool, withTransaction, clearCache }) {
  const router = express.Router();

  router.post('/api/users-table', async (req, res) => {
    const u = req.body;

    try {
      await pool.query(
        `INSERT INTO users_table (id, name, username, password, role, permissions)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name=$2, username=$3, password=$4, role=$5, permissions=$6`,
        [u.id, u.name, u.username, u.password, u.role, u.permissions]
      );

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/users-table/delete', async (req, res) => {
    try {
      await pool.query('DELETE FROM users_table WHERE id=$1', [req.body.id]);
      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/categories', async (req, res) => {
    try {
      await withTransaction(async (client) => {
        await client.query('DELETE FROM categories');

        for (const c of req.body.categories || []) {
          await client.query('INSERT INTO categories (name) VALUES ($1)', [c]);
        }
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/units', async (req, res) => {
    try {
      await withTransaction(async (client) => {
        await client.query('DELETE FROM units');

        for (const u of req.body.units || []) {
          await client.query('INSERT INTO units (name) VALUES ($1)', [u]);
        }
      });

      await clearCache();
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  router.post('/api/logs', async (req, res) => {
    const l = req.body;

    try {
      await pool.query(
        `INSERT INTO logs (id,user_id,user_name,action,details)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO UPDATE SET user_id=$2,user_name=$3,action=$4,details=$5`,
        [l.id, l.userId, l.userName, l.action, l.details]
      );

      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
