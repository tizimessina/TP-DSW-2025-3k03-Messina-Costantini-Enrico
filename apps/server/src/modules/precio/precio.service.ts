import { assertOwnerOrAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { precioRepo } from "./precio.repository.js";
import type { PrecioCreateDTO, PrecioUpdateDTO } from "./precio.schema.js";

const NOT_OWNER = "Solo el prestamista dueño del servicio puede gestionar sus precios";

async function assertServicioOwner(user: AuthUser, id_servicio: bigint) {
  const servicio = await servicioRepo.getById(id_servicio);
  if (!servicio) throw { status: 404, code: "NOT_FOUND", message: "Servicio no encontrado" };
  assertOwnerOrAdmin(user, servicio.id_prestamista, NOT_OWNER);
  return servicio;
}

export const precioService = {
  listByServicio: (id_servicio: bigint) => precioRepo.listByServicio(id_servicio),

  getVigente: async (id_servicio: bigint) => {
    const p = await precioRepo.findVigente(id_servicio);
    if (!p) throw { status: 404, code: "NO_PRICE", message: "El servicio no tiene un precio vigente" };
    return p;
  },

  getById: async (id: bigint) => {
    const p = await precioRepo.getById(id);
    if (!p) throw { status: 404, code: "NOT_FOUND", message: "Precio no encontrado" };
    return p;
  },

  create: async (user: AuthUser, dto: PrecioCreateDTO) => {
    await assertServicioOwner(user, dto.id_servicio);
    try {
      return await precioRepo.create(dto);
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw { status: 409, code: "DUPLICATE", message: "Ya existe un precio para ese servicio y fecha" };
      }
      throw e;
    }
  },

  update: async (user: AuthUser, id: bigint, dto: PrecioUpdateDTO) => {
    const precio = await precioService.getById(id);
    assertOwnerOrAdmin(user, precio.servicio.id_prestamista, NOT_OWNER);
    try {
      return await precioRepo.update(id, dto);
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw { status: 409, code: "DUPLICATE", message: "Ya existe un precio con esa fecha" };
      }
      throw e;
    }
  },

  remove: async (user: AuthUser, id: bigint) => {
    const precio = await precioService.getById(id);
    assertOwnerOrAdmin(user, precio.servicio.id_prestamista, NOT_OWNER);
    await precioRepo.remove(id);
    return { ok: true };
  },
};
