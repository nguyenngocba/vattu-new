const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  database: process.env.PGDATABASE || 'steeltrack',
  user: process.env.PGUSER || 'postgres',
  port: Number(process.env.PGPORT || 5432)
});

async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
