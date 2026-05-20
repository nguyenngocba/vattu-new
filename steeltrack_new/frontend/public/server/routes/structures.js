const express = require('express');
const structuresBasicRoutes = require('./structures-basic');
const structureProductionRoutes = require('./structure-production');
const structureExportReturnRoutes = require('./structure-export-return');
const structureWarehouseRoutes = require('./structure-warehouse');

module.exports = function structuresRoutes(context) {
  const router = express.Router();

  router.use(structuresBasicRoutes(context));
  router.use(structureProductionRoutes(context));
  router.use(structureExportReturnRoutes(context));
  router.use(structureWarehouseRoutes(context));

  return router;
};
