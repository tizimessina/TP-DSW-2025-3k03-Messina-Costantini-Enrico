import { assertOwnerOrAdmin, hasRole, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { servicioRepo } from "./servicio.repository.js";
import type { ServicioCreateDTO, ServicioUpdateDTO } from "./servicio.schema.js";

const NOT_OWNER = "Solo el prestamista dueño del servicio puede modificarlo";

export const servicioService = {
  list: (q?: string, id_categoria?: bigint, id_prestamista?: bigint) =>
    servicioRepo.list(q, id_categoria, id_prestamista),

  getById: async (id: bigint) => {
    const s = await servicioRepo.getById(id);
    if (!s) throw { status: 404, code: "NOT_FOUND", message: "Servicio no encontrado" };
    return s;
  },

  create: async (user: AuthUser, dto: ServicioCreateDTO) => {
    // Un PRESTAMISTA solo publica servicios propios; un ADMIN puede indicar el dueño.
    let id_prestamista: bigint;
    if (isAdmin(user) && dto.id_prestamista) {
      id_prestamista = dto.id_prestamista;
    } else if (hasRole(user, "PRESTAMISTA")) {
      id_prestamista = user.id_user;
    } else {
      throw { status: 400, code: "PRESTAMISTA_REQUIRED", message: "Indicá el prestamista dueño del servicio" };
    }

    try {
      return await servicioRepo.create({ ...dto, id_prestamista });
    } catch (e: any) {
      if (e?.code === "P2003") {
        throw { status: 400, code: "FK_INVALID", message: "Verificá la categoría y el prestamista" };
      }
      throw e;
    }
  },

  update: async (user: AuthUser, id: bigint, dto: ServicioUpdateDTO) => {
    const existing = await servicioService.getById(id);
    assertOwnerOrAdmin(user, existing.id_prestamista, NOT_OWNER);
    // Solo ADMIN puede transferir el servicio a otro prestamista
    const data = isAdmin(user) ? dto : { ...dto, id_prestamista: undefined };
    try {
      return await servicioRepo.update(id, data);
    } catch (e: any) {
      if (e?.code === "P2003") {
        throw { status: 400, code: "FK_INVALID", message: "Verificá la categoría y el prestamista" };
      }
      throw e;
    }
  },

  remove: async (user: AuthUser, id: bigint) => {
    const existing = await servicioService.getById(id);
    assertOwnerOrAdmin(user, existing.id_prestamista, NOT_OWNER);
    try {
      await servicioRepo.remove(id);
      return { ok: true };
    } catch (e: any) {
      if (e?.code === "P2003") {
        throw {
          status: 409,
          code: "IN_USE",
          message: "No se puede eliminar: existen solicitudes asociadas a este servicio",
        };
      }
      throw e;
    }
  },
};
