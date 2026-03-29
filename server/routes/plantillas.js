const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateBody, validateParams } = require('../middleware/validate');
const { crearPlantillaSchema, actualizarPlantillaSchema, idPlantillaParamSchema } = require('../validators/plantillas');
const logger = require('../config/logger');

const router = express.Router();

router.use(requireAuth);

// ── GET /api/plantillas ─────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM plantillas WHERE id_usuario = $1 ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json({ plantillas: result.rows });
    } catch (err) {
        logger.error('Error en GET /plantillas: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── GET /api/plantillas/:id ─────────────────────────────────
router.get('/:id', validateParams(idPlantillaParamSchema), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM plantillas WHERE id_plantilla = $1 AND id_usuario = $2',
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        res.json({ plantilla: result.rows[0] });
    } catch (err) {
        logger.error('Error en GET /plantillas/:id: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── POST /api/plantillas ────────────────────────────────────
router.post('/', validateBody(crearPlantillaSchema), async (req, res) => {
    const { nombre_plantilla, estructura_bloques } = req.body;

    try {
        // B2: Validación de límite de plantillas con COUNT real
        const LIMITES = {
            'Gratuito': { plantillas: 2 },
            'Pro': { plantillas: Infinity },
            'Empresa': { plantillas: Infinity },
        };

        const userResult = await pool.query(
            'SELECT plan_actual FROM usuarios WHERE id_usuario = $1',
            [req.session.userId]
        );
        const user = userResult.rows[0];

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM plantillas WHERE id_usuario = $1',
            [req.session.userId]
        );
        const total = parseInt(countResult.rows[0].count);
        const limite = LIMITES[user.plan_actual]?.plantillas ?? 2;

        if (total >= limite) {
            return res.status(403).json({
                error: 'limite_plantillas_alcanzado',
                mensaje: `Tu plan permite hasta ${limite} plantillas.`,
                accion: 'upgrade',
                upgrade: true,
            });
        }

        const result = await pool.query(
            `INSERT INTO plantillas (id_usuario, nombre_plantilla, estructura_bloques)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [req.session.userId, nombre_plantilla, JSON.stringify(estructura_bloques || [])]
        );

        // Incrementar contador
        await pool.query(
            'UPDATE usuarios SET plantillas_creadas = plantillas_creadas + 1 WHERE id_usuario = $1',
            [req.session.userId]
        );

        res.status(201).json({ plantilla: result.rows[0] });
    } catch (err) {
        logger.error('Error en POST /plantillas: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── PUT /api/plantillas/:id ─────────────────────────────────
router.put('/:id', validateParams(idPlantillaParamSchema), validateBody(actualizarPlantillaSchema), async (req, res) => {
    const { nombre_plantilla, estructura_bloques } = req.body;

    try {
        const result = await pool.query(
            `UPDATE plantillas SET
        nombre_plantilla = COALESCE($1, nombre_plantilla),
        estructura_bloques = COALESCE($2, estructura_bloques)
       WHERE id_plantilla = $3 AND id_usuario = $4
       RETURNING *`,
            [nombre_plantilla, estructura_bloques ? JSON.stringify(estructura_bloques) : null, req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        res.json({ plantilla: result.rows[0] });
    } catch (err) {
        logger.error('Error en PUT /plantillas/:id: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ── DELETE /api/plantillas/:id ──────────────────────────────
router.delete('/:id', validateParams(idPlantillaParamSchema), async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM plantillas WHERE id_plantilla = $1 AND id_usuario = $2 RETURNING id_plantilla',
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        // Decrementar contador
        await pool.query(
            'UPDATE usuarios SET plantillas_creadas = GREATEST(plantillas_creadas - 1, 0) WHERE id_usuario = $1',
            [req.session.userId]
        );

        res.json({ message: 'Plantilla eliminada exitosamente.' });
    } catch (err) {
        logger.error('Error en DELETE /plantillas/:id: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
