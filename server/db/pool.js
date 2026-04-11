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

const IGNORABLE = ['already exists', 'duplicate_object', 'duplicate column'];

async function initDB() {
  const sqlPath = path.join(__dirname, 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const statements = [];
  let current = '';
  let inDollarBlock = false;
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.includes('$$')) inDollarBlock = !inDollarBlock;
    current += line + '\n';
    if (!inDollarBlock && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  for (const stmt of statements) {
    if (!stmt || stmt.startsWith('--')) continue;
    try {
      await pool.query(stmt);
    } catch (err) {
      const isIgnorable = IGNORABLE.some(msg => err.message.includes(msg));
      if (isIgnorable) {
        logger.warn('Init SQL ignorado (ya existe): ' + err.message.split('\n')[0]);
      } else {
        logger.error('Error al inicializar la base de datos: ' + err.message, { error: err });
        throw err;
      }
    }
  }
  logger.info('Base de datos inicializada correctamente.');
}

module.exports = { pool, initDB };
