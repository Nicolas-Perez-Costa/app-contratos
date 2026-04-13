const { pool } = require('../db/pool');

async function migrate() {
    try {
        await pool.query(`
CREATE TABLE IF NOT EXISTS contrato_logs (
    id SERIAL PRIMARY KEY,
    id_contrato INT,
    id_usuario UUID,
    accion VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contrato_logs_contrato ON contrato_logs(id_contrato);
CREATE INDEX IF NOT EXISTS idx_contrato_logs_usuario ON contrato_logs(id_usuario);
        `);
        console.log("Migration successful");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
migrate();
