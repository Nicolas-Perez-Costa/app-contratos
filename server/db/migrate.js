const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');
const logger = require('../config/logger');

/**
 * Crea la tabla de control de migraciones si no existe.
 */
async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id          SERIAL PRIMARY KEY,
            filename    VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

/**
 * Obtiene la lista de migraciones ya ejecutadas.
 */
async function getExecutedMigrations() {
    const result = await pool.query(
        'SELECT filename FROM migrations ORDER BY filename ASC'
    );
    return result.rows.map(r => r.filename);
}

/**
 * Obtiene los archivos .sql de server/migrations/ ordenados alfabéticamente.
 */
function getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
        return [];
    }

    return fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // orden alfabético = orden numérico con prefijo 001_, 002_, etc.
}

/**
 * Corre todas las migraciones SQL pendientes en orden.
 * Registra cada una en la tabla migrations para no repetirlas.
 */
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
                throw err; // detener el arranque del servidor si falla una migración
            } finally {
                client.release();
            }
        }

        logger.info('[migrations] ✅ Todas las migraciones ejecutadas correctamente.');
    } catch (err) {
        logger.error('[migrations] Error crítico en el sistema de migraciones: ' + err.message, { error: err });
        throw err;
    }
}

module.exports = { runMigrations };
