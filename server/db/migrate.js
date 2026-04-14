const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');
const logger = require('../config/logger');

async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id          SERIAL PRIMARY KEY,
            filename    VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

async function getExecutedMigrations() {
    const result = await pool.query(
        'SELECT filename FROM migrations ORDER BY filename ASC'
    );
    return result.rows.map(r => r.filename);
}

function getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) return [];
    return fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
}

async function runMigrations() {
    try {
        await ensureMigrationsTable();
        const executed = await getExecutedMigrations();
        const files = getMigrationFiles();
        const pending = files.filter(f => !executed.includes(f));

        if (pending.length === 0) {
            logger.info('[migrations] No hay migraciones pendientes.');
            return;
        }

        logger.info(`[migrations] ${pending.length} migración(es) pendiente(s): ${pending.join(', ')}`);

        for (const filename of pending) {
            const filepath = path.join(__dirname, '..', 'migrations', filename);
            const sql = fs.readFileSync(filepath, 'utf8');
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query(
                    'INSERT INTO migrations (filename) VALUES ($1)',
                    [filename]
                );
                await client.query('COMMIT');
                logger.info(`[migrations] ✅ Ejecutada: ${filename}`);
            } catch (err) {
                await client.query('ROLLBACK');
                logger.error(`[migrations] ❌ Error en ${filename}: ${err.message}`, { error: err });
                throw err;
            } finally {
                client.release();
            }
        }

        logger.info('[migrations] ✅ Todas las migraciones ejecutadas correctamente.');
    } catch (err) {
        logger.error('[migrations] Error crítico: ' + err.message, { error: err });
        throw err;
    }
}

module.exports = { runMigrations };
