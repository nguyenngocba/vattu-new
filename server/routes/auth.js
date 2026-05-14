const express = require('express');

module.exports = function authRoutes({ pool }) {
  const router = express.Router();

  router.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};

    try {
      const result = await pool.query(
        `SELECT id, name, username, role, permissions
         FROM users_table
         WHERE username = $1 AND password = $2
         LIMIT 1`,
        [username, password]
      );

      if (!result.rows[0]) {
        return res.json({ success: false, error: 'Sai tài khoản hoặc mật khẩu' });
      }

      res.json({ success: true, user: result.rows[0] });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  });

  return router;
};
