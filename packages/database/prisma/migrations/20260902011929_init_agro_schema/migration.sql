/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_authorId_fkey`;

-- DropTable
DROP TABLE `Post`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `admin_profile` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `area_responsable` VARCHAR(100) NULL DEFAULT 'General',
    `observaciones` TEXT NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campo` (
    `id_campo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_cliente` BIGINT UNSIGNED NOT NULL,
    `coordenadas` VARCHAR(100) NOT NULL,
    `hectareas` DECIMAL(10, 2) NOT NULL,

    INDEX `idx_campo_cliente`(`id_cliente`),
    PRIMARY KEY (`id_campo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria` (
    `id_categoria` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_categoria_nombre`(`nombre`),
    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cliente_profile` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `cuit` VARCHAR(20) NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumo` (
    `id_insumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NULL,

    UNIQUE INDEX `uk_insumo_nombre`(`nombre`),
    PRIMARY KEY (`id_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `localidad` (
    `id_localidad` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_provincia` BIGINT UNSIGNED NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `codigo_postal` VARCHAR(16) NULL,

    UNIQUE INDEX `uk_localidad_prov_nombre`(`id_provincia`, `nombre`),
    PRIMARY KEY (`id_localidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `precio` (
    `id_precio` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_servicio` BIGINT UNSIGNED NOT NULL,
    `fecha_desde` DATE NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,

    INDEX `idx_precio_servicio`(`id_servicio`, `fecha_desde`),
    UNIQUE INDEX `uk_precio_vigencia`(`id_servicio`, `fecha_desde`),
    PRIMARY KEY (`id_precio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestamista_profile` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `cuit` VARCHAR(20) NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provincia` (
    `id_provincia` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `uk_provincia_nombre`(`nombre`),
    PRIMARY KEY (`id_provincia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id_role` TINYINT UNSIGNED NOT NULL,
    `name` VARCHAR(32) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicio` (
    `id_servicio` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `id_categoria` BIGINT UNSIGNED NOT NULL,
    `id_prestamista` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_servicio_cat`(`id_categoria`),
    INDEX `idx_servicio_owner`(`id_prestamista`),
    PRIMARY KEY (`id_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud` (
    `id_solicitud` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_servicio` BIGINT UNSIGNED NOT NULL,
    `id_cliente` BIGINT UNSIGNED NOT NULL,
    `id_prestamista` BIGINT UNSIGNED NOT NULL,
    `id_campo` BIGINT UNSIGNED NOT NULL,
    `estado` ENUM('pendiente', 'aceptada', 'rechazada', 'completada') NOT NULL DEFAULT 'pendiente',
    `fecha_solicitud` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_inicio` DATETIME(0) NULL,
    `fecha_fin` DATETIME(0) NULL,
    `hectareas_trabajadas` DECIMAL(10, 2) NOT NULL,
    `precio_servicio` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `costo_insumos` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `precio_total` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,

    INDEX `fk_sol_campo`(`id_campo`),
    INDEX `fk_sol_servicio`(`id_servicio`),
    INDEX `idx_sol_cliente`(`id_cliente`, `estado`),
    INDEX `idx_sol_estado`(`estado`),
    INDEX `idx_sol_prestamista`(`id_prestamista`, `estado`),
    PRIMARY KEY (`id_solicitud`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_insumo` (
    `id_solicitud_insumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_solicitud` BIGINT UNSIGNED NOT NULL,
    `id_insumo` BIGINT UNSIGNED NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_unit` DECIMAL(12, 2) NOT NULL,
    `proveedor` ENUM('CLIENTE', 'PRESTAMISTA') NOT NULL,

    INDEX `fk_si_insumo`(`id_insumo`),
    INDEX `fk_si_solicitud`(`id_solicitud`),
    PRIMARY KEY (`id_solicitud_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `id_role` TINYINT UNSIGNED NOT NULL,

    INDEX `fk_ur_role`(`id_role`),
    PRIMARY KEY (`id_user`, `id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id_user` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `cuil_cuit` VARCHAR(20) NULL,
    `fecha_nac` DATE NULL,
    `domicilio` VARCHAR(255) NULL,
    `id_localidad` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    INDEX `idx_user_localidad`(`id_localidad`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin_profile` ADD CONSTRAINT `fk_admin_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campo` ADD CONSTRAINT `fk_campo_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cliente_profile` ADD CONSTRAINT `fk_cliente_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `localidad` ADD CONSTRAINT `fk_localidad_provincia` FOREIGN KEY (`id_provincia`) REFERENCES `provincia`(`id_provincia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `precio` ADD CONSTRAINT `fk_precio_serv` FOREIGN KEY (`id_servicio`) REFERENCES `servicio`(`id_servicio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestamista_profile` ADD CONSTRAINT `fk_prestamista_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio` ADD CONSTRAINT `fk_servicio_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio` ADD CONSTRAINT `fk_servicio_prestamista` FOREIGN KEY (`id_prestamista`) REFERENCES `prestamista_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_campo` FOREIGN KEY (`id_campo`) REFERENCES `campo`(`id_campo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_prestamista` FOREIGN KEY (`id_prestamista`) REFERENCES `prestamista_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicio`(`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_insumo` ADD CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_insumo` ADD CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud`(`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_ur_role` FOREIGN KEY (`id_role`) REFERENCES `roles`(`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_ur_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_localidad` FOREIGN KEY (`id_localidad`) REFERENCES `localidad`(`id_localidad`) ON DELETE SET NULL ON UPDATE CASCADE;
