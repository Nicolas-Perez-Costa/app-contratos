const { pool } = require('../db/pool');
const logger = require('../config/logger');

/**
 * Middleware de validación de plan.
 * Verifica que el usuario autenticado tenga un plan incluido en los planes permitidos.
 *
 * @param {string[]} planesPermitidos - Array de planes que tienen acceso (ej: ['Pro', 'Empresa'])
 * @returns {Function} Middleware de Express (req, res, next)
 */
function requirePlan(planesPermitidos) {
    return async (req, res, next) => {
        try {
            // Verificar sesión
            if (!req.session || !req.session.userId) {
                return res.status(401).json({ error: 'Acceso denegado. Debes iniciar sesión.' });
            }

            // Consultar plan del usuario
            const result = await pool.query(
                'SELECT plan_actual FROM usuarios WHERE id_usuario = $1',
                [req.session.userId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'Usuario no encontrado.' });
            }

            const { plan_actual } = result.rows[0];

            if (!planesPermitidos.includes(plan_actual)) {
                return res.status(403).json({
                    error: 'Tu plan actual no incluye acceso a esta funcionalidad.',
                    plan_requerido: planesPermitidos,
                });
            }

            next();
        } catch (err) {
            logger.error('Error en requirePlan middleware: ' + err.message, { error: err });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    };
}

module.exports = { requirePlan };
