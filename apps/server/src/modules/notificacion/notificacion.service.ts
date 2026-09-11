import type { AuthUser } from "../../core/auth/types.js";
import { toPage, toSkipTake } from "../../core/http/pagination.js";
import { notificacionRepo } from "./notificacion.repository.js";
import type { NotificacionQuery } from "./notificacion.schema.js";

export const notificacionService = {
  /** Siempre las del usuario autenticado: no hay forma de pedir las de otro. */
  list: async (user: AuthUser, q: NotificacionQuery) => {
    const { skip, take } = toSkipTake(q);
    const { items, total, no_leidas } = await notificacionRepo.list(user.id_user, q.no_leidas === true, skip, take);
    return { ...toPage(items, total, q), no_leidas };
  },

  contarNoLeidas: async (user: AuthUser) => ({ no_leidas: await notificacionRepo.contarNoLeidas(user.id_user) }),

  /**
   * Marcar como leída es idempotente. Si el aviso no existe, no es del usuario o
   * ya estaba leído, la respuesta es la misma: así no se revela la existencia de
   * avisos ajenos. Devuelve el contador para que el front actualice la campana.
   */
  marcarLeida: async (user: AuthUser, id: bigint) => {
    await notificacionRepo.marcarLeida(user.id_user, id);
    return { ok: true, no_leidas: await notificacionRepo.contarNoLeidas(user.id_user) };
  },

  marcarTodasLeidas: async (user: AuthUser) => {
    const { count } = await notificacionRepo.marcarTodasLeidas(user.id_user);
    return { ok: true, marcadas: count, no_leidas: 0 };
  },
};
