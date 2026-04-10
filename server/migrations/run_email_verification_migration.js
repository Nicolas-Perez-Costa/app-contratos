const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const { pool } = require('../db/pool');

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'add_email_verification.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running email verification migration...');
        await pool.query(sql);
        console.log('Migration successful!');

        console.log('Verifying columns...');
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'usuarios'
            AND column_name IN ('email_verificado', 'codigo_verificacion', 'codigo_verificacion_expira')
        `);
        console.table(res.rows);

        if (res.rows.length === 3) {
            console.log('✅ All 3 columns verified successfully.');
        } else {
            console.error(`❌ Expected 3 columns, found ${res.rows.length}.`);
        }
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
