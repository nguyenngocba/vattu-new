const express = require('express');

module.exports = function suppliersRoutes({ pool, clearCache, notifyAll }) {
  const router = express.Router();

  router.post('/api/suppliers', async (req, res) => {
    const s = req.body;
    await pool.query(
      `INSERT INTO suppliers (id, name, phone, email, address)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET name=$2, phone=$3, email=$4, address=$5`,
      [s.id, s.name, s.phone, s.email, s.address]
    );
    await clearCache();
    notifyAll('dataChanged', {});
    res.json({ success: true });
  });

  router.delete('/api/suppliers/:id', async (req, res) => {
    await pool.query('DELETE FROM suppliers WHERE id=$1', [req.params.id]);
    await clearCache();
    notifyAll('dataChanged', {});
    res.json({ success: true });
  });

  return router;
};
