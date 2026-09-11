import type { Prisma } from "@repo/db";
import { assertOwnerOrAdmin, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { badRequest, notFound, translatePrisma } from "../../core/errors/errors.js";
import { toPage, toSkipTake } from "../../core/http/pagination.js";
import { servicioRepo } from "./servicio.repository.js";
import type { ServicioCreateDTO, ServicioQuery, ServicioUpdateDTO } from "./servicio.schema.js";

const NOT_OWNER = "Solo el contratista dueño del servicio puede modificarlo";
const FK = badRequest("FK_INVALID", "La categoría no existe");

/** Normaliza la salida: `precio_vigente` explícito en vez del array `precio`. */
function withVigente<T extends { precio: { valor: unknown; fecha_desde: Date }[]; _count?: { solicitud: number } }>(s: T) {
  const { precio, _count, ...rest } = s;
  return { ...rest, precio_vigente: precio[0] ?? null, trabajos_completados: _count?.solicitud ?? 0 };
}

export const servicioService = {
  list: async (q: ServicioQuery, user?: AuthUser) => {
    const esDuenio = !!user && q.id_contratista === user.id_user;
    const verInactivos = q.incluir_inactivos && (esDuenio || isAdmin(user));
    const where: Prisma.servicioWhereInput = {
      ...(verInactivos ? {} : { activo: true }),
      ...(q.q ? { OR: [{ nombre: { contains: q.q } }, { descripcion: { contains: q.q } }] } : {}),
      ...(q.id_categoria ? { id_categoria: q.id_categoria } : {}),
      ...(q.id_contratista ? { id_contratista: q.id_contratista } : {}),
      ...(q.id_localidad
        ? { contratista_profile: { users: { id_localidad: q.id_localidad } } }
        : q.id_provincia
          ? { contratista_profile: { users: { localidad: { id_provincia: q.id_provincia } } } }
          : {}),
    };
    const { skip, take } = toSkipTake(q);
    const { items, total } = await servicioRepo.list(where, skip, take);
    return toPage(items.map(withVigente), total, q);
  },

  getById: async (id: bigint, user?: AuthUser) => {
    const s = await servicioRepo.getById(id);
    if (!s) throw notFound("Servicio no encontrado");
    if (!s.activo && !(user && (isAdmin(user) || user.id_user === s.id_contratista))) throw notFound("Servicio no encontrado");
    const { precio, _count, ...rest } = s;
    const hoy = new Date();
    return {
      ...rest,
      precios: precio,
      precio_vigente: precio.find((p) => p.fecha_desde <= hoy) ?? null,
      trabajos_completados: _count.solicitud,
    };
  },

  /** El servicio siempre pertenece al contratista autenticado. */
  create: async (user: AuthUser, dto: ServicioCreateDTO) => {
    const row = await servicioRepo.create({ ...dto, id_contratista: user.id_user }).catch((e) => translatePrisma(e, { P2003: FK }));
    return withVigente(row);
  },

  update: async (user: AuthUser, id: bigint, dto: ServicioUpdateDTO) => {
    const existing = await servicioRepo.getById(id);
    if (!existing) throw notFound("Servicio no encontrado");
    assertOwnerOrAdmin(user, existing.id_contratista, NOT_OWNER);
    const row = await servicioRepo.update(id, dto).catch((e) => translatePrisma(e, { P2003: FK }));
    return withVigente(row);
  },

  /** Baja lógica: el servicio deja de aparecer en el catálogo pero conserva su historial. */
  desactivar: (user: AuthUser, id: bigint) => servicioService.update(user, id, { activo: false }),
};
