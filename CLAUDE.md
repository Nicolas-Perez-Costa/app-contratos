# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development (run both frontend + backend concurrently):**
```bash
npm run dev
```

**Run only backend (port 4000):**
```bash
npm run server
```

**Run only frontend (port 5173):**
```bash
npm run client
```

**Install all dependencies (root + client):**
```bash
npm run install:all
```

**Build frontend for production:**
```bash
cd client && npm run build
```

## Architecture

Full-stack contract management SaaS. React 18 + Vite frontend proxies `/api/*` requests to an Express backend on port 4000. Sessions are stored in PostgreSQL via `connect-pg-simple`.

### Backend (`server/`)

Layered architecture: **Routes → Middleware → Services → DB Pool**

- `server/server.js` — Express app entry: mounts routes, session middleware, CORS (localhost:5173), 10MB body limit
- `server/routes/` — Route handlers, one file per domain:
  - `auth.js` — Register/login/logout/password recovery
  - `contratos.js` — Contract CRUD, PDF generation, email delivery, freemium limits
  - `plantillas.js` — Template CRUD (JSON block structure)
  - `suscripciones.js` — MercadoPago preapproval subscription flow
  - `admin.js` — User management, stats, trial/plan management
  - `uploads.js` — Multer file upload handling
- `server/middleware/` — `authMiddleware.js` (requireAuth), `requireAdmin.js`, `rateLimiter.js`, `validate.js`
- `server/validators/` — Zod schemas mirroring each route module
- `server/services/` — `pdfService.js` (pdfkit), `storageService.js` (local/S3 abstraction), `whatsappService.js` (Twilio)
- `server/db/pool.js` — PostgreSQL connection pool (Neon via AWS)
- `server/db/init.sql` — Full schema: `usuarios`, `plantillas`, `contratos`, `pagos`, `recovery_codes`, `session`
- `server/jobs/verificarTrials.js` — Hourly cron job that downgrades expired trials to Gratuito plan
- `server/utils/sanitize.js` — HTML entity encoding + Unicode sanitization for XSS prevention

### Frontend (`client/src/`)

No global state library — all state via React hooks. All API calls use `fetch()` with `credentials: 'include'` for session cookies.

- `App.jsx` — React Router v6 config; all routes defined here
- `pages/` — One component per route (LoginPage, HomePage, TemplatePage, ContractFormPage, SignaturePage, ProfilePage, AdminDashboardPage, AdminUsuariosPage, AdminUsuarioDetallePage, etc.)
- `components/` — Shared UI: Navbar, ActionMenu (context menu), ContractListItem, TemplatePickerModal, UpgradeModal, StatCard
- `styles/` — SCSS with variables/mixins; component-scoped files

### Key Data Flows

**Contract lifecycle:** Template (JSON blocks) → ContractFormPage (fills `datos_ingresados` JSONB) → email to client → client signs via canvas (`/firmar/:id`) → pdfService generates PDF → stored in `uploads/` → marked `Firmado`

**Freemium limits:** Free tier capped at 15 contracts/month. Monthly counter resets automatically. Plan tiers: Gratuito, Pro, Empresa.

**Auth flow:** bcryptjs (salt 12) → session stored in PostgreSQL → 24-hour httpOnly cookie

### Environment Variables (`.env`)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET`
- `PORT` (default 4000)
- `MERCADOPAGO_ACCESS_TOKEN`
- `TWILIO_*` — WhatsApp integration credentials
- `STORAGE_PROVIDER` — `local` or `s3`
