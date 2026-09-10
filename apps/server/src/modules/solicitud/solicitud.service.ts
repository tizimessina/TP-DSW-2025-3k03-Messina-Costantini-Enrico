import { assertOwnerOrAdmin, hasRole, isAdmin } from "../../core/auth/middleware.js";
import type { AuthUser } from "../../core/auth/types.js";
import { campoRepo } from "../campo/campo.repository.js";
import { precioRepo } from "../precio/precio.repository.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { solicitudRepo } from "./solicitud.repository.js";
import type {
  CreateSolicitudInput,
  SolicitudEstado,
  SolicitudQuery,
  UpdateSolicitudEstadoInput,
} from "./solicitud.schema.js";

/** Transiciones válidas del ciclo de vida de una solicitud. */
export const TRANSICIONES: Record<SolicitudEstado, SolicitudEstado[]> = {
  pendiente: ["aceptada", "rechazada"],
  aceptada: ["completada"],
  rechazada: [],
  completada: [],
};

export function puedeTransicionar(desde: SolicitudEstado, hacia: SolicitudEstado) {
  return TRANSICIONES[desde].includes(hacia);
}

/** Cálculo de importes: precio vigente × hectáreas + Σ(cantidad × precio unitario de insumos). */
export function calcularImportes(
  precioPorHectarea: number,
  hectareas: number,
  insumos: { cantidad: number; precio_unit: number }[],
) {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const precio_servicio = round2(precioPorHectarea * hectareas);
  const costo_insumos = round2(insumos.reduce((acc, i) => acc + i.cantidad * i.precio_unit, 0));
  return { precio_servicio, costo_insumos, precio_total: round2(precio_servicio + costo_insumos) };
}

export const solicitudService = {
  /** CLIENTE ve sus solicitudes; PRESTAMISTA las que le hicieron; ADMIN todas (con filtros). */
  list(user: AuthUser, query: SolicitudQuery) {
    if (isAdmin(user)) return solicitudRepo.list(query);
    if (hasRole(user, "CLIENTE") && !hasRole(user, "PRESTAMISTA")) {
      return solicitudRepo.list({ estado: query.estado, id_cliente: user.id_user });
    }
    if (hasRole(user, "PRESTAMISTA") && !hasRole(user, "CLIENTE")) {
      return solicitudRepo.list({ estado: query.estado, id_prestamista: user.id_user });
    }
    // Usuario con ambos roles: elige con el query, por defecto como cliente.
    return solicitudRepo.list({
      estado: query.estado,
      ...(query.id_prestamista ? { id_prestamista: user.id_user } : { id_cliente: user.id_user }),
    });
  },

  async getById(user: AuthUser, id: bigint) {
    const s = await solicitudRepo.getById(id);
    if (!s) throw { status: 404, code: "NOT_FOUND", message: "Solicitud no encontrada" };
    if (!isAdmin(user) && s.id_cliente !== user.id_user && s.id_prestamista !== user.id_user) {
      throw { status: 403, code: "FORBIDDEN", message: "No podés ver solicitudes de otros usuarios" };
    }
    return s;
  },

  async create(user: AuthUser, data: CreateSolicitudInput) {
    if (!hasRole(user, "CLIENTE")) {
      throw { status: 403, code: "FORBIDDEN", message: "Solo un cliente puede solicitar servicios" };
    }

    const servicio = await servicioRepo.getById(data.id_servicio);
    if (!servicio) throw { status: 404, code: "NOT_FOUND", message: "Servicio no encontrado" };
    if (servicio.id_prestamista === user.id_user) {
      throw { status: 400, code: "SELF_REQUEST", message: "No podés solicitar tu propio servicio" };
    }

    const campo = await campoRepo.getById(data.id_campo);
    if (!campo) throw { status: 404, code: "NOT_FOUND", message: "Campo no encontrado" };
    assertOwnerOrAdmin(user, campo.id_cliente, "El campo no pertenece al cliente");

    if (data.hectareas_trabajadas > Number(campo.hectareas)) {
      throw {
        status: 400,
        code: "HECTAREAS_EXCEDIDAS",
        message: `Las hectáreas a trabajar (${data.hectareas_trabajadas}) superan las del campo (${campo.hectareas})`,
      };
    }

    const precio = await precioRepo.findVigente(servicio.id_servicio);
    if (!precio) {
      throw { status: 409, code: "NO_PRICE", message: "El servicio no tiene un precio vigente" };
    }

    const importes = calcularImportes(Number(precio.valor), data.hectareas_trabajadas, data.insumos);

    return solicitudRepo.create({
      id_servicio: servicio.id_servicio,
      id_cliente: user.id_user,
      id_prestamista: servicio.id_prestamista,
      id_campo: campo.id_campo,
      hectareas_trabajadas: data.hectareas_trabajadas,
      ...importes,
      fecha_inicio: data.fecha_inicio ?? null,
      fecha_fin: data.fecha_fin ?? null,
      insumos: data.insumos,
    });
  },

  /** Solo el prestamista de la solicitud (o ADMIN) cambia el estado, respetando las transiciones. */
  async updateEstado(user: AuthUser, id: bigint, data: UpdateSolicitudEstadoInput) {
    const s = await solicitudService.getById(user, id);
    assertOwnerOrAdmin(user, s.id_prestamista, "Solo el prestamista puede cambiar el estado de la solicitud");

    if (!puedeTransicionar(s.estado, data.estado)) {
      throw {
        status: 409,
        code: "INVALID_TRANSITION",
        message: `No se puede pasar de "${s.estado}" a "${data.estado}"`,
      };
    }

    return solicitudRepo.updateEstado(id, {
      estado: data.estado,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.estado === "completada" && data.fecha_fin === undefined ? new Date() : data.fecha_fin,
    });
  },

  /** El cliente puede cancelar (borrar) mientras esté pendiente; ADMIN siempre. */
  async delete(user: AuthUser, id: bigint) {
    const s = await solicitudService.getById(user, id);
    if (!isAdmin(user)) {
      if (s.id_cliente !== user.id_user) {
        throw { status: 403, code: "FORBIDDEN", message: "Solo el cliente puede cancelar la solicitud" };
      }
      if (s.estado !== "pendiente") {
        throw { status: 409, code: "NOT_PENDING", message: "Solo se pueden cancelar solicitudes pendientes" };
      }
    }
    return solicitudRepo.delete(id);
  },
};
