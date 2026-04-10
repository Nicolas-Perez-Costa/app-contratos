// =============================================
// Validación de Variables de Entorno
// =============================================
// Verifica al arranque que las variables de entorno
// críticas estén presentes. Si alguna falta, el proceso
// termina inmediatamente con un mensaje claro.
// =============================================

/**
 * Variables críticas: sin ellas el servidor no puede funcionar.
 * Si alguna falta, el proceso se detiene con process.exit(1).
 */
const CRITICAL_VARS = [
    { name: 'DATABASE_URL', service: 'Base de datos / Neon' },
    { name: 'SESSION_SECRET', service: 'Sesiones del servidor' },
];

/**
 * Variables de advertencia: servicios opcionales que podrían
 * degradar funcionalidad parcial si no están configurados.
 * El servidor arranca igual, pero se imprime un aviso.
 */
const WARNING_GROUPS = [
    {
        service: 'Email / Resend',
        vars: ['RESEND_API_KEY', 'EMAIL_FROM'],
        note: 'El servidor usará Ethereal (email de prueba) como fallback.',
    },
    {
        service: 'Pagos / MercadoPago',
        vars: ['MP_ACCESS_TOKEN'],
        note: 'El sistema de suscripciones no estará disponible.',
    },
    {
        service: 'WhatsApp / Twilio',
        vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'],
        note: 'El envío de contratos por WhatsApp no estará disponible.',
    },
    {
        service: 'Almacenamiento / Cloudflare R2',
        vars: ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'],
        note: 'Solo estará disponible el almacenamiento local de archivos.',
    },
];

/**
 * Valida que las variables de entorno requeridas estén definidas.
 * - Variables críticas ausentes → imprime error y termina el proceso.
 * - Variables de advertencia ausentes → imprime warning y continúa.
 */
function validateEnv() {
    const missingCritical = [];

    // ── Verificar variables críticas ────────────────────────
    for (const { name, service } of CRITICAL_VARS) {
        const value = process.env[name];
        if (!value || value.trim() === '') {
            missingCritical.push({ name, service });
            console.error(
                `FATAL: Variable de entorno faltante: ${name} (servicio: ${service})`
            );
        }
    }

    if (missingCritical.length > 0) {
        console.error(
            `\n✖ ${missingCritical.length} variable(s) crítica(s) faltante(s). El servidor no puede arrancar.\n`
        );
        process.exit(1);
    }

    // ── Verificar variables de advertencia (por grupo) ──────
    for (const group of WARNING_GROUPS) {
        const missing = group.vars.filter((varName) => {
            const value = process.env[varName];
            return !value || value.trim() === '';
        });

        if (missing.length > 0) {
            console.warn(
                `⚠ ADVERTENCIA: Variable(s) faltante(s) para ${group.service}: ${missing.join(', ')}. ${group.note}`
            );
        }
    }
}

module.exports = { validateEnv };
