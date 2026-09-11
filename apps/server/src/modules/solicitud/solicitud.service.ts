import type { Prisma } from "@repo/db";
import { hasRole, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { actorDe, type EventoActor, type EventoNuevo } from "../../core/events/eventos.js";
import { badRequest, conflict, forbidden, notFound } from "../../core/errors/errors.js";
import { toPage, toSkipTake } from "../../core/http/pagination.js";
import { toCivil, todayCivil } from "../../core/util/dates.js";
import { campoRepo } from "../campo/campo.repository.js";
import { insumoRepo } from "../insumo/insumo.repository.js";
import { precioRepo } from "../precio/precio.repository.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { solicitudRepo } from "./solicitud.repository.js";
import type { CreateSolicitudInput, SolicitudEstado, SolicitudQuery, UpdateSolicitudEstadoInput } from "./solicitud.schema.js";

/** Ciclo de vida: quién puede llevar la solicitud de un estado a otro. */
export const TRANSICIONES: Record<SolicitudEstado, Partial<Record<SolicitudEstado, ("PRODUCTOR" | "CONTRATISTA")[]>>> = {
  pendiente: { aceptada: ["CONTRATISTA"], rechazada: ["CONTRATISTA"], cancelada: ["PRODUCTOR"] },
  aceptada: { completada: ["CONTRATISTA"], cancelada: ["PRODUCTOR", "CONTRATISTA"] },
  rechazada: {},
  cancelada: {},
  completada: {},
};

export const ESTADOS_FINALES: SolicitudEstado[] = ["rechazada", "cancelada", "completada"];

export function puedeTransicionar(desde: SolicitudEstado, hacia: SolicitudEstado, rol: "PRODUCTOR" | "CONTRATISTA" | "ADMIN") {
  const permitidos = TRANSICIONES[desde][hacia];
  if (!permitidos) return false;
  return rol === "ADMIN" || permitidos.includes(rol);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Importes de una solicitud:
 *  - servicio = precio vigente por hectárea × hectáreas
 *  - insumos  = Σ cantidad × precio de referencia, SOLO los que aporta el contratista
 *    (los que pone el productor no se cobran: precio_unit = 0)
 */
export function calcularImportes<T extends { cantidad: number; precio_referencia: number; proveedor: "PRODUCTOR" | "CONTRATISTA" }>(
  precioPorHectarea: number,
  hectareas: number,
  insumos: T[],
) {
  const precio_servicio = round2(precioPorHectarea * hectareas);
  const lineas = insumos.map((i) => ({
    ...i,
    precio_unit: i.proveedor === "CONTRATISTA" ? i.precio_referencia : 0,
  }));
  const costo_insumos = round2(lineas.reduce((acc, i) => acc + i.cantidad * i.precio_unit, 0));
  return { precio_servicio, costo_insumos, precio_total: round2(precio_servicio + costo_insumos), lineas };
}

/** Evento de alta de la solicitud. Función pura: se testea sin tocar la base. */
export function buildEventoAlta(user: AuthUser): EventoNuevo {
  return {
    tipo: "creada",
    estado_hasta: "pendiente",
    ...actorDe(user, "PRODUCTOR"),
  };
}

/** Evento de un cambio de estado, con el motivo cuando corresponde. */
export function buildEventoTransicion(
  user: AuthUser,
  rol: EventoActor,
  desde: SolicitudEstado,
  hasta: SolicitudEstado,
  motivo?: string | null,
): EventoNuevo {
  return {
    tipo: "transicion",
    estado_desde: desde,
    estado_hasta: hasta,
    detalle: motivo ?? null,
    ...actorDe(user, rol),
  };
}

function rolEn(user: AuthUser, s: { id_productor: bigint; id_contratista: bigint }): "PRODUCTOR" | "CONTRATISTA" | "ADMIN" | null {
  if (isAdmin(user)) return "ADMIN";
  if (s.id_productor === user.id_user) return "PRODUCTOR";
  if (s.id_contratista === user.id_user) return "CONTRATISTA";
  return null;
}

export const solicitudService = {
  /** PRODUCTOR ve las suyas; CONTRATISTA las recibidas; ADMIN todas (con filtros). */
  list: async (user: AuthUser, q: SolicitudQuery) => {
    const where: Prisma.solicitudWhereInput = {
      ...(q.estado ? { estado: q.estado } : {}),
      ...(q.id_campo ? { id_campo: q.id_campo } : {}),
    };
    if (isAdmin(user)) {
      if (q.id_productor) where.id_productor = q.id_productor;
      if (q.id_contratista) where.id_contratista = q.id_contratista;
    } else if (hasRole(user, "PRODUCTOR")) {
      where.id_productor = user.id_user;
    } else if (hasRole(user, "CONTRATISTA")) {
      where.id_contratista = user.id_user;
    } else {
      throw forbidden();
    }
    const { skip, take } = toSkipTake(q);
    const { items, total } = await solicitudRepo.list(where, skip, take);
    return toPage(items, total, q);
  },

  getById: async (user: AuthUser, id: bigint) => {
    const s = await solicitudRepo.getById(id);
    if (!s) throw notFound("Solicitud no encontrada");
    if (!rolEn(user, s)) throw forbidden("No podés ver solicitudes de otros usuarios");
    return s;
  },

  create: async (user: AuthUser, data: CreateSolicitudInput) => {
    if (!hasRole(user, "PRODUCTOR")) throw forbidden("Solo un productor puede solicitar servicios");

    const servicio = await servicioRepo.getById(data.id_servicio);
    if (!servicio || !servicio.activo) throw notFound("Servicio no encontrado o no disponible");

    const campo = await campoRepo.getById(data.id_campo);
    if (!campo) throw notFound("Campo no encontrado");
    if (campo.id_productor !== user.id_user) throw forbidden("El campo no te pertenece");

    if (data.hectareas_trabajadas > Number(campo.hectareas)) {
      throw badRequest("HECTAREAS_EXCEDIDAS", `Las hectáreas a trabajar (${data.hectareas_trabajadas}) superan las del campo (${campo.hectareas})`);
    }

    const precio = await precioRepo.findVigente(servicio.id_servicio);
    if (!precio) throw conflict("NO_PRICE", "El servicio no tiene un precio vigente");

    // Precio de cada insumo desde el catálogo (nunca desde el cliente)
    const catalogo = await insumoRepo.getManyByIds(data.insumos.map((i) => i.id_insumo));
    const insumos = data.insumos.map((i) => {
      const ref = catalogo.find((c) => c.id_insumo === i.id_insumo);
      if (!ref) throw badRequest("FK_INVALID", `El insumo ${i.id_insumo} no existe`);
      return { id_insumo: i.id_insumo, cantidad: i.cantidad, proveedor: i.proveedor, precio_referencia: Number(ref.precio_referencia) };
    });

    const { lineas, ...importes } = calcularImportes(Number(precio.valor), data.hectareas_trabajadas, insumos);

    return solicitudRepo.create(
      {
      id_servicio: servicio.id_servicio,
      id_productor: user.id_user,
      id_contratista: servicio.id_contratista,
      id_campo: campo.id_campo,
      hectareas_trabajadas: data.hectareas_trabajadas,
      precio_hectarea: Number(precio.valor),
      ...importes,
      fecha_inicio: data.fecha_inicio ? toCivil(data.fecha_inicio) : null,
      fecha_fin: data.fecha_fin ? toCivil(data.fecha_fin) : null,
      observaciones: data.observaciones ?? null,
      insumos: lineas.map((l) => ({ id_insumo: l.id_insumo, cantidad: l.cantidad, precio_unit: l.precio_unit, proveedor: l.proveedor })),
      },
      buildEventoAlta(user),
    );
  },

  /** Cambio de estado según el ciclo de vida y el rol de quien lo pide. */
  updateEstado: async (user: AuthUser, id: bigint, data: UpdateSolicitudEstadoInput) => {
    const s = await solicitudService.getById(user, id);
    const rol = rolEn(user, s)!;
    if (!puedeTransicionar(s.estado, data.estado, rol)) {
      throw conflict("INVALID_TRANSITION", `Un ${rol.toLowerCase()} no puede pasar la solicitud de "${s.estado}" a "${data.estado}"`);
    }

    const hoy = todayCivil();
    const patch: { estado: SolicitudEstado; fecha_inicio?: Date | null; fecha_fin?: Date | null; motivo?: string | null } = { estado: data.estado };
    if (data.estado === "aceptada") {
      // Al aceptar se fija la fecha de inicio (la propuesta del contratista o la pedida por el productor o hoy)
      patch.fecha_inicio = data.fecha_inicio ? toCivil(data.fecha_inicio) : (s.fecha_inicio ?? hoy);
      if (data.fecha_fin) patch.fecha_fin = toCivil(data.fecha_fin);
    }
    if (data.estado === "completada") {
      patch.fecha_fin = data.fecha_fin ? toCivil(data.fecha_fin) : hoy;
      if (!s.fecha_inicio) patch.fecha_inicio = patch.fecha_fin;
    }
    if (data.estado === "rechazada" || data.estado === "cancelada") patch.motivo = data.motivo ?? null;

    const inicio = patch.fecha_inicio ?? s.fecha_inicio;
    const fin = patch.fecha_fin ?? s.fecha_fin;
    if (inicio && fin && fin < inicio) throw badRequest("FECHAS_INVALIDAS", "La fecha de fin es anterior a la de inicio");

    return solicitudRepo.updateEstado(id, patch, buildEventoTransicion(user, rol, s.estado, data.estado, patch.motivo));
  },

  /** Borrado físico solo para ADMIN (el productor cancela, no borra). */
  delete: async (user: AuthUser, id: bigint) => {
    if (!isAdmin(user)) throw forbidden("Solo un administrador puede eliminar solicitudes");
    const s = await solicitudRepo.getById(id);
    if (!s) throw notFound("Solicitud no encontrada");
    await solicitudRepo.delete(id);
  },
};
