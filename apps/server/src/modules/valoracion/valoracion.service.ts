import type { AuthUser } from "../../core/auth/types.js";
import { actorDe, nombreActor, type EventoNuevo } from "../../core/events/eventos.js";
import { recortar, type NotificacionNueva } from "../../core/notify/notificaciones.js";
import { conflict, forbidden, notFound, translatePrisma } from "../../core/errors/errors.js";
import { solicitudRepo } from "../solicitud/solicitud.repository.js";
import { valoracionRepo } from "./valoracion.repository.js";
import type { ValoracionCreateDTO, ValoracionQuery } from "./valoracion.schema.js";

/** Entrada del historial cuando el productor valora el trabajo. */
export function buildEventoValoracion(user: AuthUser, puntaje: number): EventoNuevo {
  return {
    tipo: "valoracion",
    detalle: `Calificó el trabajo con ${puntaje} de 5`,
    ...actorDe(user, "PRODUCTOR"),
  };
}

/** Aviso al contratista de que lo calificaron. */
export function buildNotificacionValoracion(user: AuthUser, id_contratista: bigint, servicio: string, puntaje: number): NotificacionNueva[] {
  return [
    {
      id_user: id_contratista,
      titulo: "Recibiste una valoración",
      cuerpo: recortar(`${nombreActor(user)} calificó ${servicio} con ${puntaje} de 5.`),
    },
  ];
}

export const valoracionService = {
  list: (q: ValoracionQuery) =>
    q.id_contratista ? valoracionRepo.listByContratista(q.id_contratista) : valoracionRepo.listByServicio(q.id_servicio!),

  /** Solo el productor de una solicitud completada, una única vez. */
  create: async (user: AuthUser, dto: ValoracionCreateDTO) => {
    const s = await solicitudRepo.getById(dto.id_solicitud);
    if (!s) throw notFound("Solicitud no encontrada");
    if (s.id_productor !== user.id_user) throw forbidden("Solo el productor de la solicitud puede valorarla");
    if (s.estado !== "completada") throw conflict("NOT_COMPLETED", "Solo se pueden valorar solicitudes completadas");
    if (s.valoracion) throw conflict("ALREADY_RATED", "Esta solicitud ya fue valorada");
    return valoracionRepo
      .create(
        { id_solicitud: dto.id_solicitud, puntaje: dto.puntaje, comentario: dto.comentario ?? null },
        buildEventoValoracion(user, dto.puntaje),
        buildNotificacionValoracion(user, s.id_contratista, s.servicio?.nombre ?? "el servicio", dto.puntaje),
      )
      .catch((e) => translatePrisma(e, { P2002: conflict("ALREADY_RATED", "Esta solicitud ya fue valorada") }));
  },
};
