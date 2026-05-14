const express = require('express');
const path = require('path');
const http = require('http');

const { pool, withTransaction } = require('./server/db');
const { getCache, setCache, clearCache } = require('./server/cache');
const { createRealtime } = require('./server/realtime');
const { registerRoutes } = require('./server/routes');
const uploadsRoutes = require('./server/routes/uploads');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 3000);

const { notifyAll } = createRealtime(server);
const uploads = uploadsRoutes();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploads.uploadRoot));
app.use(uploads.router);
app.get('/favicon.ico', (req, res) => res.status(204).end());


registerRoutes(app, {
  pool,
  withTransaction,
  getCache,
  setCache,
  clearCache,
  notifyAll
});

server.listen(PORT, '0.0.0.0', () => console.log('OK'));

