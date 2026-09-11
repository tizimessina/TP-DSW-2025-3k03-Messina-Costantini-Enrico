-- CreateTable
CREATE TABLE `provincia` (
    `id_provincia` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `uk_provincia_nombre`(`nombre`),
    PRIMARY KEY (`id_provincia`)
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
CREATE TABLE `roles` (
    `id_role` TINYINT UNSIGNED NOT NULL,
    `name` VARCHAR(32) NOT NULL,

    UNIQUE INDEX `uk_role_name`(`name`),
    PRIMARY KEY (`id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id_user` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `cuil_cuit` VARCHAR(13) NULL,
    `telefono` VARCHAR(30) NULL,
    `fecha_nac` DATE NULL,
    `domicilio` VARCHAR(255) NULL,
    `id_localidad` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_user_email`(`email`),
    UNIQUE INDEX `uk_user_cuit`(`cuil_cuit`),
    INDEX `idx_user_localidad`(`id_localidad`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `id_role` TINYINT UNSIGNED NOT NULL,

    INDEX `idx_ur_role`(`id_role`),
    PRIMARY KEY (`id_user`, `id_role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productor_profile` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `razon_social` VARCHAR(150) NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratista_profile` (
    `id_user` BIGINT UNSIGNED NOT NULL,
    `descripcion` VARCHAR(600) NULL,
    `anios_experiencia` SMALLINT UNSIGNED NULL,

    PRIMARY KEY (`id_user`)
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
CREATE TABLE `insumo` (
    `id_insumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `unidad` VARCHAR(20) NOT NULL DEFAULT 'unidad',
    `precio_referencia` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,

    UNIQUE INDEX `uk_insumo_nombre`(`nombre`),
    PRIMARY KEY (`id_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicio` (
    `id_servicio` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `id_categoria` BIGINT UNSIGNED NOT NULL,
    `id_contratista` BIGINT UNSIGNED NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_servicio_cat`(`id_categoria`),
    INDEX `idx_servicio_owner`(`id_contratista`),
    INDEX `idx_servicio_activo`(`activo`),
    PRIMARY KEY (`id_servicio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `precio` (
    `id_precio` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_servicio` BIGINT UNSIGNED NOT NULL,
    `fecha_desde` DATE NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,

    UNIQUE INDEX `uk_precio_vigencia`(`id_servicio`, `fecha_desde`),
    PRIMARY KEY (`id_precio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campo` (
    `id_campo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_productor` BIGINT UNSIGNED NOT NULL,
    `id_localidad` BIGINT UNSIGNED NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `hectareas` DECIMAL(10, 2) NOT NULL,
    `latitud` DECIMAL(9, 6) NULL,
    `longitud` DECIMAL(9, 6) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_campo_productor`(`id_productor`),
    INDEX `idx_campo_localidad`(`id_localidad`),
    PRIMARY KEY (`id_campo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud` (
    `id_solicitud` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_servicio` BIGINT UNSIGNED NOT NULL,
    `id_productor` BIGINT UNSIGNED NOT NULL,
    `id_contratista` BIGINT UNSIGNED NOT NULL,
    `id_campo` BIGINT UNSIGNED NOT NULL,
    `estado` ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada', 'completada') NOT NULL DEFAULT 'pendiente',
    `fecha_solicitud` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_inicio` DATE NULL,
    `fecha_fin` DATE NULL,
    `hectareas_trabajadas` DECIMAL(10, 2) NOT NULL,
    `precio_hectarea` DECIMAL(12, 2) NOT NULL,
    `precio_servicio` DECIMAL(14, 2) NOT NULL,
    `costo_insumos` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `precio_total` DECIMAL(14, 2) NOT NULL,
    `observaciones` VARCHAR(500) NULL,
    `motivo` VARCHAR(500) NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_sol_campo`(`id_campo`),
    INDEX `idx_sol_servicio`(`id_servicio`),
    INDEX `idx_sol_productor`(`id_productor`, `estado`),
    INDEX `idx_sol_contratista`(`id_contratista`, `estado`),
    PRIMARY KEY (`id_solicitud`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitud_insumo` (
    `id_solicitud_insumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_solicitud` BIGINT UNSIGNED NOT NULL,
    `id_insumo` BIGINT UNSIGNED NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_unit` DECIMAL(12, 2) NOT NULL,
    `proveedor` ENUM('PRODUCTOR', 'CONTRATISTA') NOT NULL,

    INDEX `idx_si_insumo`(`id_insumo`),
    UNIQUE INDEX `uk_si_solicitud_insumo`(`id_solicitud`, `id_insumo`),
    PRIMARY KEY (`id_solicitud_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `valoracion` (
    `id_valoracion` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_solicitud` BIGINT UNSIGNED NOT NULL,
    `puntaje` TINYINT UNSIGNED NOT NULL,
    `comentario` VARCHAR(500) NULL,
    `fecha` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_valoracion_solicitud`(`id_solicitud`),
    PRIMARY KEY (`id_valoracion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `localidad` ADD CONSTRAINT `fk_localidad_provincia` FOREIGN KEY (`id_provincia`) REFERENCES `provincia`(`id_provincia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_localidad` FOREIGN KEY (`id_localidad`) REFERENCES `localidad`(`id_localidad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_ur_role` FOREIGN KEY (`id_role`) REFERENCES `roles`(`id_role`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `fk_ur_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productor_profile` ADD CONSTRAINT `fk_productor_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratista_profile` ADD CONSTRAINT `fk_contratista_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio` ADD CONSTRAINT `fk_servicio_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio` ADD CONSTRAINT `fk_servicio_contratista` FOREIGN KEY (`id_contratista`) REFERENCES `contratista_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `precio` ADD CONSTRAINT `fk_precio_serv` FOREIGN KEY (`id_servicio`) REFERENCES `servicio`(`id_servicio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campo` ADD CONSTRAINT `fk_campo_productor` FOREIGN KEY (`id_productor`) REFERENCES `productor_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campo` ADD CONSTRAINT `fk_campo_localidad` FOREIGN KEY (`id_localidad`) REFERENCES `localidad`(`id_localidad`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_campo` FOREIGN KEY (`id_campo`) REFERENCES `campo`(`id_campo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_productor` FOREIGN KEY (`id_productor`) REFERENCES `productor_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_contratista` FOREIGN KEY (`id_contratista`) REFERENCES `contratista_profile`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud` ADD CONSTRAINT `fk_sol_servicio` FOREIGN KEY (`id_servicio`) REFERENCES `servicio`(`id_servicio`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_insumo` ADD CONSTRAINT `fk_si_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_insumo` ADD CONSTRAINT `fk_si_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud`(`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `valoracion` ADD CONSTRAINT `fk_val_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud`(`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Reglas de integridad que Prisma no modela (CHECK constraints)
ALTER TABLE `campo` ADD CONSTRAINT `chk_campo_hectareas` CHECK (`hectareas` > 0);
ALTER TABLE `campo` ADD CONSTRAINT `chk_campo_lat` CHECK (`latitud` IS NULL OR (`latitud` BETWEEN -90 AND 90));
ALTER TABLE `campo` ADD CONSTRAINT `chk_campo_lng` CHECK (`longitud` IS NULL OR (`longitud` BETWEEN -180 AND 180));
ALTER TABLE `precio` ADD CONSTRAINT `chk_precio_valor` CHECK (`valor` > 0);
ALTER TABLE `insumo` ADD CONSTRAINT `chk_insumo_precio` CHECK (`precio_referencia` >= 0);
ALTER TABLE `solicitud` ADD CONSTRAINT `chk_sol_hectareas` CHECK (`hectareas_trabajadas` > 0);
ALTER TABLE `solicitud` ADD CONSTRAINT `chk_sol_fechas` CHECK (`fecha_inicio` IS NULL OR `fecha_fin` IS NULL OR `fecha_fin` >= `fecha_inicio`);
ALTER TABLE `solicitud_insumo` ADD CONSTRAINT `chk_si_cantidad` CHECK (`cantidad` > 0);
ALTER TABLE `valoracion` ADD CONSTRAINT `chk_val_puntaje` CHECK (`puntaje` BETWEEN 1 AND 5);
