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


/**
 * Estadísticas de una lista de precios. Devuelve null si no hay ninguno, para
 * distinguir "no hay con qué comparar" de "el promedio es cero".
 */
export function estadisticasPrecio(valores: number[]) {
  if (valores.length === 0) return null;
  const suma = valores.reduce((a, b) => a + b, 0);
  return {
    promedio: Math.round((suma / valores.length) * 100) / 100,
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
    cantidad: valores.length,
  };
}

/** Cuánto se aparta un precio del promedio, en porcentaje. */
export function desvioPorcentual(propio: number, promedio: number) {
  if (promedio === 0) return null;
  return Math.round(((propio - promedio) / promedio) * 1000) / 10;
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

  /**
   * Precio de referencia del mercado para la categoría del servicio, calculado con
   * los precios vigentes que ya tiene el propio sistema. Empieza por la provincia
   * del contratista y, si no hay con qué comparar, amplía a todo el país.
   */
  referenciaPrecio: async (id: bigint) => {
    const s = await servicioRepo.getById(id);
    if (!s) throw notFound("Servicio no encontrado");

    const hoy = new Date();
    const propio = s.precio.find((p) => p.fecha_desde <= hoy);
    const id_provincia = s.contratista_profile?.users?.localidad?.id_provincia;

    const valoresDe = (rows: { id_servicio: bigint; precio: { valor: unknown }[] }[]) =>
      rows.filter((r) => r.id_servicio !== id && r.precio.length > 0).map((r) => Number(r.precio[0].valor));

    let alcance: "provincia" | "pais" = id_provincia ? "provincia" : "pais";
    let valores = valoresDe(await servicioRepo.comparablesDeCategoria(s.id_categoria, id_provincia ?? undefined));
    if (valores.length === 0 && id_provincia) {
      alcance = "pais";
      valores = valoresDe(await servicioRepo.comparablesDeCategoria(s.id_categoria));
    }

    const stats = estadisticasPrecio(valores);
    const valorPropio = propio ? Number(propio.valor) : null;
    return {
      id_servicio: s.id_servicio,
      categoria: s.categoria.nombre,
      alcance,
      propio: valorPropio,
      mercado: stats,
      desvio_pct: stats && valorPropio !== null ? desvioPorcentual(valorPropio, stats.promedio) : null,
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
