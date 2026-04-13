const { pool } = require('../db/pool');
const logger = require('../config/logger');

/**
 * Registra una acción sobre un contrato en la tabla contrato_logs.
 * @param {number} id_contrato
 * @param {string|null} id_usuario - UUID del usuario autenticado
 * @param {string} accion - Ej: 'creado', 'editado', 'firmado', 'eliminado'
 * @param {object} metadata - Datos adicionales en formato JSON
 */
async function logAccion(id_contrato, id_usuario, accion, metadata = {}) {
    try {
        await pool.query(
            `INSERT INTO contrato_logs (id_contrato, id_usuario, accion, metadata)
             VALUES ($1, $2, $3, $4)`,
            [id_contrato, id_usuario || null, accion, JSON.stringify(metadata)]
        );
    } catch (err) {
        // No interrumpir el flujo principal si el log falla
        logger.error('[logAccion] Error al guardar log de contrato:', { error: err });
    }
}

module.exports = logAccion;
