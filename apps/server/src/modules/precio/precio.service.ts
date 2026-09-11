import { assertOwnerOrAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { conflict, notFound, translatePrisma } from "../../core/errors/errors.js";
import { toCivil, todayCivil } from "../../core/util/dates.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { precioRepo } from "./precio.repository.js";
import type { PrecioCreateDTO, PrecioUpdateDTO } from "./precio.schema.js";

const NOT_OWNER = "Solo el contratista dueño del servicio puede gestionar sus precios";
const DUP = conflict("DUPLICATE", "Ya existe un precio para ese servicio y fecha");

async function assertServicioOwner(user: AuthUser, id_servicio: bigint) {
  const servicio = await servicioRepo.getById(id_servicio);
  if (!servicio) throw notFound("Servicio no encontrado");
  assertOwnerOrAdmin(user, servicio.id_contratista, NOT_OWNER);
  return servicio;
}

export const precioService = {
  listByServicio: (id_servicio: bigint) => precioRepo.listByServicio(id_servicio),

  getVigente: async (id_servicio: bigint) => {
    const p = await precioRepo.findVigente(id_servicio);
    if (!p) throw notFound("El servicio no tiene un precio vigente");
    return p;
  },

  getById: async (id: bigint) => {
    const p = await precioRepo.getById(id);
    if (!p) throw notFound("Precio no encontrado");
    return p;
  },

  create: async (user: AuthUser, dto: PrecioCreateDTO) => {
    await assertServicioOwner(user, dto.id_servicio);
    return precioRepo.create({ ...dto, fecha_desde: toCivil(dto.fecha_desde) }).catch((e) => translatePrisma(e, { P2002: DUP }));
  },

  update: async (user: AuthUser, id: bigint, dto: PrecioUpdateDTO) => {
    const precio = await precioService.getById(id);
    assertOwnerOrAdmin(user, precio.servicio.id_contratista, NOT_OWNER);
    return precioRepo
      .update(id, { ...dto, ...(dto.fecha_desde ? { fecha_desde: toCivil(dto.fecha_desde) } : {}) })
      .catch((e) => translatePrisma(e, { P2002: DUP }));
  },

  /** No se puede borrar el único precio vigente de un servicio activo: quedaría insolicitable. */
  remove: async (user: AuthUser, id: bigint) => {
    const precio = await precioService.getById(id);
    assertOwnerOrAdmin(user, precio.servicio.id_contratista, NOT_OWNER);
    if (precio.servicio.activo && precio.fecha_desde <= todayCivil() && (await precioRepo.countVigentes(precio.id_servicio)) <= 1) {
      throw conflict("LAST_PRICE", "Es el único precio vigente del servicio: cargá otro o desactivá el servicio antes de borrarlo");
    }
    await precioRepo.remove(id);
    return { ok: true };
  },
};
