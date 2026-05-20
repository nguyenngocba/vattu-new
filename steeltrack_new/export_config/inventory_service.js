const MaterialRepository = require('../repositories/materialRepository');

class MaterialService {
  static async upsertMaterial(material, { clearCache, notifyAll }) {
    await MaterialRepository.upsert(material);
    if (clearCache) await clearCache();
    if (notifyAll) notifyAll('dataChanged', { type: 'material', id: material.id });
    return { success: true };
  }

  static async deleteMaterial(id, { clearCache, notifyAll }) {
    await MaterialRepository.deleteById(id);
    if (clearCache) await clearCache();
    if (notifyAll) notifyAll('dataChanged', { type: 'material_deleted' });
    return { success: true };
  }
}

module.exports = MaterialService;
