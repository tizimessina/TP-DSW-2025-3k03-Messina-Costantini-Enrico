import type { Prisma } from "@repo/db";
import { hasRole, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { badRequest, conflict, forbidden, notFound, translatePrisma } from "../../core/errors/errors.js";
import { campoRepo } from "./campo.repository.js";
import type { CampoCreateDTO, CampoQuery, CampoUpdateDTO } from "./campo.schema.js";

const FK_LOC = badRequest("FK_INVALID", "La localidad no existe");

export const campoService = {
  /** PRODUCTOR ve solo sus campos; ADMIN todos (o filtra por productor). */
  list: (user: AuthUser, q: CampoQuery) => {
    const where: Prisma.campoWhereInput = {
      ...(isAdmin(user) ? (q.id_productor ? { id_productor: q.id_productor } : {}) : { id_productor: user.id_user }),
      ...(q.q ? { nombre: { contains: q.q } } : {}),
    };
    return campoRepo.list(where);
  },

  /** Lo ve el dueño, ADMIN, o un contratista que tenga una solicitud sobre ese campo. */
  get: async (user: AuthUser, id: bigint) => {
    const row = await campoRepo.getById(id);
    if (!row) throw notFound("Campo no encontrado");
    const esDuenio = row.id_productor === user.id_user;
    const esContratistaDelCampo = row.solicitud.some((s) => s.id_contratista === user.id_user);
    if (!isAdmin(user) && !esDuenio && !esContratistaDelCampo) throw forbidden("No podés ver campos de otro productor");
    // Un contratista solo ve las solicitudes que le corresponden
    if (!isAdmin(user) && !esDuenio) row.solicitud = row.solicitud.filter((s) => s.id_contratista === user.id_user);
    return row;
  },

  create: async (user: AuthUser, dto: CampoCreateDTO) => {
    let id_productor: bigint;
    if (isAdmin(user) && dto.id_productor) id_productor = dto.id_productor;
    else if (hasRole(user, "PRODUCTOR")) id_productor = user.id_user;
    else throw badRequest("PRODUCTOR_REQUIRED", "Indicá el productor dueño del campo");

    const { id_productor: _ignored, ...data } = dto;
    return campoRepo
      .create({ ...data, id_productor })
      .catch((e) => translatePrisma(e, { P2003: badRequest("FK_INVALID", "La localidad o el productor no existen") }));
  },

  update: async (user: AuthUser, id: bigint, dto: CampoUpdateDTO) => {
    const row = await campoRepo.getById(id);
    if (!row) throw notFound("Campo no encontrado");
    if (!isAdmin(user) && row.id_productor !== user.id_user) throw forbidden("Solo el productor dueño del campo puede editarlo");

    if (dto.hectareas !== undefined) {
      const comprometidas = await campoRepo.maxHectareasComprometidas(id);
      if (dto.hectareas < comprometidas) {
        throw conflict("HECTAREAS_COMPROMETIDAS", `Hay solicitudes activas por ${comprometidas} ha; no podés reducir el campo por debajo de eso`);
      }
    }
    return campoRepo.update(id, dto).catch((e) => translatePrisma(e, { P2003: FK_LOC }));
  },

  remove: async (user: AuthUser, id: bigint) => {
    const row = await campoRepo.getById(id);
    if (!row) throw notFound("Campo no encontrado");
    if (!isAdmin(user) && row.id_productor !== user.id_user) throw forbidden("Solo el productor dueño del campo puede eliminarlo");
    if (row._count.solicitud > 0) throw conflict("IN_USE", "No se puede eliminar: el campo tiene solicitudes asociadas");
    await campoRepo.remove(id);
  },
};
