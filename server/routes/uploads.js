const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/authMiddleware');
const storageService = require('../services/storageService');
const logger = require('../config/logger');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max (compressed images should be ~500KB)
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen.'));
        }
    },
});

router.use(requireAuth);

// ── POST /api/uploads/image ─────────────────────────────────
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ninguna imagen.' });
        }

        const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
        const key = `imagenes/${req.session.userId}_${Date.now()}.${ext}`;

        const url = await storageService.uploadFile(req.file.buffer, key);

        res.json({ url });
    } catch (err) {
        logger.error('Error en POST /uploads/image: ' + err.message, { error: err });
        res.status(500).json({ error: 'Error al subir la imagen.' });
    }
});

// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'La imagen es demasiado grande. Máximo 2MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

module.exports = router;
