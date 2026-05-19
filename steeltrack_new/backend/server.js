const express = require('express');
const path = require('path');
const http = require('http');

const { pool, withTransaction } = require('./server/db');
const { getCache, setCache, clearCache } = require('./server/cache');
const { createRealtime } = require('./server/realtime');
const { registerRoutes } = require('./server/routes');
const uploadsRoutes = require('./server/routes/uploads');

const app = express();
const serverHttp = http.createServer(app);
const PORT = Number(process.env.PORT || 3001);

const { notifyAll } = createRealtime(serverHttp);
const uploads = uploadsRoutes();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public'))); // nếu cần static
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

serverHttp.listen(PORT, '0.0.0.0', () => console.log(`Backend running on port ${PORT}`));