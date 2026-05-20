const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || '/var/www/steeltrack/uploads';

module.exports = function uploadsRoutes() {
  const router = express.Router();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, 'temp');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, req.params.id + '_' + Date.now() + path.extname(file.originalname))
  });

  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  function cleanupOldTempFiles(maxAgeMs = 24 * 60 * 60 * 1000) {
    const tempDir = path.join(UPLOAD_ROOT, 'temp');

    if (!fs.existsSync(tempDir)) return;

    const now = Date.now();

    fs.readdir(tempDir, function(err, files) {
      if (err) return;

      files.forEach(function(file) {
        const filePath = path.join(tempDir, file);

        fs.stat(filePath, function(statErr, stat) {
          if (statErr || !stat.isFile()) return;

          if (now - stat.mtimeMs > maxAgeMs) {
            fs.unlink(filePath, function() {});
          }
        });
      });
    });
  }

  cleanupOldTempFiles();
  setInterval(cleanupOldTempFiles, 60 * 60 * 1000);

  router.post('/api/upload/:type/:id', upload.single('file'), (req, res) => {
    if (!req.file) return res.json({ success: false });
    res.json({ success: true, filename: req.file.filename, path: '/uploads/temp/' + req.file.filename });
  });

  router.post('/api/move-file', (req, res) => {
    const { path: tempPath, type } = req.body;
    const filename = path.basename(tempPath);
    const newType = type || 'purchase';
    const oldPath = path.join(UPLOAD_ROOT, tempPath.replace(/^\/uploads\//, ''));
    const newDir = path.join(UPLOAD_ROOT, newType);
    const newPath = path.join(newDir, filename);

    fs.mkdirSync(newDir, { recursive: true });
    fs.rename(oldPath, newPath, (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true, path: '/uploads/' + newType + '/' + filename });
    });
  });

  router.delete('/api/upload/temp', (req, res) => {
    try {
      const relPath = String(req.body?.path || '');

      if (!relPath || !relPath.startsWith('/uploads/temp/')) {
        return res.status(400).json({ success: false, error: 'Invalid temp path' });
      }

      const filePath = path.join(UPLOAD_ROOT, relPath.replace(/^\/uploads\//, ''));
      const tempRoot = path.join(UPLOAD_ROOT, 'temp');

      if (!filePath.startsWith(tempRoot)) {
        return res.status(400).json({ success: false, error: 'Invalid temp path' });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return { router, uploadRoot: UPLOAD_ROOT };
};
