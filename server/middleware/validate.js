// =============================================
// Middleware genérico de validación con Zod
// =============================================

/**
 * Middleware que valida req.body contra un esquema Zod.
 * Si la validación falla, responde con 400 y detalles de los errores.
 * Si pasa, asigna los datos parseados/transformados a req.body y llama next().
 * @param {import('zod').ZodSchema} schema - Esquema Zod a validar
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Datos inválidos.',
                detalles: result.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message,
                })),
            });
        }
        req.body = result.data;
        next();
    };
}

/**
 * Middleware que valida req.query contra un esquema Zod.
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                error: 'Datos inválidos.',
                detalles: result.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message,
                })),
            });
        }
        req.query = result.data;
        next();
    };
}

/**
 * Middleware que valida req.params contra un esquema Zod.
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                error: 'Datos inválidos.',
                detalles: result.error.issues.map(i => ({
                    campo: i.path.join('.'),
                    mensaje: i.message,
                })),
            });
        }
        req.params = result.data;
        next();
    };
}

module.exports = { validateBody, validateQuery, validateParams };
