const express = require('express');
const MaterialController = require('../controllers/materialController');

module.exports = function inventoryRoutes({ pool, clearCache, notifyAll }) {
  const router = express.Router();
  const context = { pool, clearCache, notifyAll };

  router.post('/api/materials', (req, res) => MaterialController.upsert(req, res, context));
  router.delete('/api/materials/:id', (req, res) => MaterialController.delete(req, res, context));

  return router;
};
