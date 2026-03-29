const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const logger = require('../config/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Inicializa la base de datos ejecutando el script SQL de esquema.
 */
async function initDB() {
  const sqlPath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    await pool.query(sql);
    logger.info('✅ Base de datos inicializada correctamente.');
  } catch (err) {
    logger.error('❌ Error al inicializar la base de datos: ' + err.message, { error: err });
    throw err;
  }
}

module.exports = { pool, initDB };
