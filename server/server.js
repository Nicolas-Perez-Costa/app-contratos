const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const logger = require('./config/logger');
const morgan = require('morgan');

const { pool, initDB } = require('./db/pool');
const authRoutes = require('./routes/auth');
const contratosRoutes = require('./routes/contratos');
const plantillasRoutes = require('./routes/plantillas');
const uploadsRoutes = require('./routes/uploads');
const suscripcionesRoutes = require('./routes/suscripciones');
const adminRoutes = require('./routes/admin');
const { apiLimiter } = require('./middleware/rateLimiter');

const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csrfMiddleware = (req, res, next) => next();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Orígenes permitidos para CORS ───────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

// ── Configurar Email Transporter ────────────────────────────
async function setupEmailTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Usar credenciales SMTP reales si están configuradas
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        logger.info('📧 Email configurado con SMTP real: ' + process.env.SMTP_USER);
        return transporter;
    } else {
        // Auto-crear cuenta Ethereal para desarrollo
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        logger.info('📧 Email configurado con Ethereal (desarrollo)');
        logger.info(`   Usuario: ${testAccount.user}`);
        logger.info(`   Los emails de preview se mostrarán en consola.\n`);
        return transporter;
    }
}

// ── Middlewares ──────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["blob:"],
            frameAncestors: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    next();
});

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: logger.stream,
    skip: (req, res) => res.statusCode === 429
}));

// ── Health check (antes de auth/session para acceso sin token) ──
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(csrfMiddleware);

app.use('/api', apiLimiter);

// ── Sesiones con PostgreSQL ─────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: false, // la tabla se crea en init.sql
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    },
}));

// ── Rutas API ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/plantillas', plantillasRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/suscripciones', suscripcionesRoutes);
app.use('/api/admin', adminRoutes);



// ── Servir archivos subidos (local storage) ─────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Manejador de errores global ─────────────────────────────
app.use((err, req, res, next) => {
    logger.error('Error no controlado en la aplicación', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id || null,
        fullError: err
    });

    // Si la respuesta ya fue enviada, delegar al siguiente manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Iniciar servidor ────────────────────────────────────────
async function start() {
    try {
        await initDB();
        app.locals.emailTransporter = await setupEmailTransporter();
        require('./jobs/verificarTrials');
        app.listen(PORT, () => {
            logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            logger.info(`   API disponible en http://localhost:${PORT}/api\n`);
        });
    } catch (err) {
        logger.error('Error al iniciar el servidor', err);
        process.exit(1);
    }
}

start();
