-- =============================================
-- Migración: Añadir verificación de email a usuarios
-- =============================================

-- Columna: email_verificado (BOOLEAN, default FALSE, NOT NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'email_verificado'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Columna: codigo_verificacion (VARCHAR(6), default NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'codigo_verificacion'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN codigo_verificacion VARCHAR(6) DEFAULT NULL;
    END IF;
END $$;

-- Columna: codigo_verificacion_expira (TIMESTAMP, default NULL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'codigo_verificacion_expira'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN codigo_verificacion_expira TIMESTAMP DEFAULT NULL;
    END IF;
END $$;
