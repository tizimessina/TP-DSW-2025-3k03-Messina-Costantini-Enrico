/**
 * Selects reutilizables para no filtrar `password_hash` ni datos sensibles
 * cuando se incluyen usuarios dentro de otras entidades.
 */
export const publicUserSelect = {
  id_user: true,
  email: true,
  nombre: true,
  apellido: true,
  domicilio: true,
  id_localidad: true,
  localidad: { include: { provincia: true } },
} as const;
