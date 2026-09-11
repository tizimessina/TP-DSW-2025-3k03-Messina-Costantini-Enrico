-- AlterTable
ALTER TABLE `contratista_profile` ADD COLUMN `verificado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verificado_at` DATETIME(3) NULL;
