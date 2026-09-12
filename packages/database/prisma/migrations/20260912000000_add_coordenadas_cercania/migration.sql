-- AlterTable: centro de la localidad, respaldo para medir distancias.
ALTER TABLE `localidad` ADD COLUMN `latitud` DECIMAL(9, 6) NULL,
    ADD COLUMN `longitud` DECIMAL(9, 6) NULL;

-- AlterTable: base de operaciones declarada por el contratista.
ALTER TABLE `contratista_profile` ADD COLUMN `latitud` DECIMAL(9, 6) NULL,
    ADD COLUMN `longitud` DECIMAL(9, 6) NULL;

-- Reglas de integridad que Prisma no modela (CHECK constraints)
ALTER TABLE `localidad` ADD CONSTRAINT `chk_localidad_lat` CHECK (`latitud` IS NULL OR (`latitud` BETWEEN -90 AND 90));
ALTER TABLE `localidad` ADD CONSTRAINT `chk_localidad_lng` CHECK (`longitud` IS NULL OR (`longitud` BETWEEN -180 AND 180));
ALTER TABLE `contratista_profile` ADD CONSTRAINT `chk_contratista_lat` CHECK (`latitud` IS NULL OR (`latitud` BETWEEN -90 AND 90));
ALTER TABLE `contratista_profile` ADD CONSTRAINT `chk_contratista_lng` CHECK (`longitud` IS NULL OR (`longitud` BETWEEN -180 AND 180));
