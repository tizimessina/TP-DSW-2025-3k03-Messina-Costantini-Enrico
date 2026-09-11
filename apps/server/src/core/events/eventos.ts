import type { AuthUser } from "../auth/types.js";

export type EventoTipo = "creada" | "transicion" | "valoracion";
export type EventoActor = "PRODUCTOR" | "CONTRATISTA" | "ADMIN" | "SISTEMA";

/**
 * Fila del historial de una solicitud, tal como la escribe el repositorio.
 * Se arma en el service (función pura, testeable) y se persiste dentro de la
 * misma transacción que el cambio que la origina.
 */
export type EventoNuevo = {
  tipo: EventoTipo;
  estado_desde?: "pendiente" | "aceptada" | "rechazada" | "cancelada" | "completada" | null;
  estado_hasta?: "pendiente" | "aceptada" | "rechazada" | "cancelada" | "completada" | null;
  id_actor: bigint | null;
  actor_rol: EventoActor;
  actor_nombre: string | null;
  detalle?: string | null;
};

/** Nombre del actor congelado en el evento, para que el historial no dependa del usuario. */
export function nombreActor(user: AuthUser): string {
  return `${user.nombre} ${user.apellido}`.trim();
}

/** Datos del actor a partir del usuario autenticado y del rol que ocupa en la solicitud. */
export function actorDe(user: AuthUser, rol: EventoActor) {
  return { id_actor: user.id_user, actor_rol: rol, actor_nombre: nombreActor(user) };
}
