const authRoutes = require('./auth');
const dataRoutes = require('./data');
const transactionsRoutes = require('./transactions');
const projectsRoutes = require('./projects');
const suppliersRoutes = require('./suppliers');
const settingsRoutes = require('./settings');
const structuresRoutes = require('./structures');
const forecastRoutes = require('./forecast');

function registerRoutes(app, context) {
  app.use(authRoutes(context));
  app.use(dataRoutes(context));
  app.use(transactionsRoutes(context));
  app.use(projectsRoutes(context));
  app.use(suppliersRoutes(context));
  app.use(settingsRoutes(context));
  app.use(structuresRoutes(context));
  app.use(forecastRoutes(context));
}

module.exports = { registerRoutes };
