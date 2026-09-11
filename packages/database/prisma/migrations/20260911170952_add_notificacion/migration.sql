-- CreateTable
CREATE TABLE `notificacion` (
    `id_notificacion` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user` BIGINT UNSIGNED NOT NULL,
    `id_solicitud` BIGINT UNSIGNED NULL,
    `titulo` VARCHAR(160) NOT NULL,
    `cuerpo` VARCHAR(300) NOT NULL,
    `leida_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_notif_user`(`id_user`, `leida_at`, `id_notificacion`),
    PRIMARY KEY (`id_notificacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacion` ADD CONSTRAINT `fk_notif_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud`(`id_solicitud`) ON DELETE CASCADE ON UPDATE CASCADE;
