-- CreateTable
CREATE TABLE `solicitud_evento` (
    `id_evento` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_solicitud` BIGINT UNSIGNED NOT NULL,
    `tipo` ENUM('creada', 'transicion', 'valoracion') NOT NULL,
    `estado_desde` ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada', 'completada') NULL,
    `estado_hasta` ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada', 'completada') NULL,
    `id_actor` BIGINT UNSIGNED NULL,
    `actor_rol` ENUM('PRODUCTOR', 'CONTRATISTA', 'ADMIN', 'SISTEMA') NOT NULL,
    `actor_nombre` VARCHAR(201) NULL,
    `detalle` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_ev_solicitud`(`id_solicitud`, `id_evento`),
    INDEX `idx_ev_actor`(`id_actor`),
    PRIMARY KEY (`id_evento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitud_evento` ADD CONSTRAINT `fk_ev_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud`(`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitud_evento` ADD CONSTRAINT `fk_ev_actor` FOREIGN KEY (`id_actor`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;
