const cron = require('node-cron');
const { pool } = require('../db/pool');
const logger = require('../config/logger');

// ── Verificar trials vencidos cada hora ─────────────────────
// Baja a plan Gratuito a usuarios cuyo trial venció
// y que no tienen suscripción activa de MercadoPago
cron.schedule('0 * * * *', async () => {
    try {
        const result = await pool.query(`
            UPDATE usuarios
            SET plan_actual = 'Gratuito',
                plan_estado = 'activo',
                trial_hasta = NULL
            WHERE trial_hasta < NOW()
              AND (suscripcion_mp_id IS NULL OR plan_estado != 'activo')
              AND plan_actual != 'Gratuito'
            RETURNING id_usuario, email
        `);

        if (result.rows.length > 0) {
            logger.info(`[CRON] Trials vencidos: ${result.rows.length} usuario(s) bajados a Gratuito:`);
            result.rows.forEach(u => logger.info(`   - ${u.email} (${u.id_usuario})`));
        }
    } catch (err) {
        logger.error('[CRON] Error al verificar trials vencidos: ' + err.message, { error: err });
    }
});

logger.info('⏰ Cron de verificación de trials activo (cada hora)');
