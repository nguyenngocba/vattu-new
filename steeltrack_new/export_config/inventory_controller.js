const MaterialService = require('../services/materialService');

class MaterialController {
  static async upsert(req, res, context) {
    try {
      const result = await MaterialService.upsertMaterial(req.body, context);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req, res, context) {
    try {
      const result = await MaterialService.deleteMaterial(req.params.id, context);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = MaterialController;
