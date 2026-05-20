const { pool } = require('../../../../server/db');
class MaterialRepository {
  static async upsert(material) {
    const { id, name, cat, unit, qty, cost, low, note } = material;
    await pool.query(
      `INSERT INTO materials (id, name, cat, unit, qty, cost, low, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, cat=$3, unit=$4, qty=$5, cost=$6, low=$7, note=$8`,
      [id, name, cat, unit, qty, cost, low, note || '']
    );
  }

  static async deleteById(id) {
    await pool.query('DELETE FROM materials WHERE id=$1', [id]);
  }
}

module.exports = MaterialRepository;
