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

  router.post('/api/delete-temp', (req, res) => {
    const tempPath = path.join(UPLOAD_ROOT, String(req.body.path || '').replace(/^\/uploads\//, ''));
    fs.unlink(tempPath, () => {});
    res.json({ success: true });
  });

  return { router, uploadRoot: UPLOAD_ROOT };
};
