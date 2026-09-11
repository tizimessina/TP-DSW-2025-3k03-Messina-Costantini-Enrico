import type { Prisma } from "@repo/db";
import { notFound } from "../../core/errors/errors.js";
import { toPage, toSkipTake } from "../../core/http/pagination.js";
import { valoracionRepo } from "../valoracion/valoracion.repository.js";
import { contratistaRepo } from "./contratista.repository.js";
import type { ContratistaQuery } from "./contratista.schema.js";

export const contratistaService = {
  /**
   * Listado público. Cercanía: si viene `id_campo`, filtra por la localidad del campo y, si no hay
   * contratistas ahí, por su provincia (se informa en `alcance`).
   */
  list: async (q: ContratistaQuery) => {
    let id_localidad = q.id_localidad;
    let id_provincia = q.id_provincia;
    let alcance: "localidad" | "provincia" | "todos" = id_localidad ? "localidad" : id_provincia ? "provincia" : "todos";

    if (q.id_campo) {
      const campo = await contratistaRepo.campoUbicacion(q.id_campo);
      if (!campo) throw notFound("Campo no encontrado");
      id_localidad = campo.id_localidad;
      id_provincia = campo.localidad.id_provincia;
      alcance = "localidad";
    }

    const build = (loc?: bigint, prov?: bigint): Prisma.contratista_profileWhereInput => ({
      users: {
        ...(loc ? { id_localidad: loc } : prov ? { localidad: { id_provincia: prov } } : {}),
        ...(q.q ? { OR: [{ nombre: { contains: q.q } }, { apellido: { contains: q.q } }] } : {}),
      },
      ...(q.id_categoria ? { servicio: { some: { activo: true, id_categoria: q.id_categoria } } } : {}),
      ...(q.verificado ? { verificado: true } : {}),
    });

    let result = await contratistaRepo.list(build(id_localidad, id_provincia), ...Object.values(toSkipTake(q)) as [number, number]);
    if (q.id_campo && result.total === 0 && id_provincia) {
      alcance = "provincia";
      result = await contratistaRepo.list(build(undefined, id_provincia), ...Object.values(toSkipTake(q)) as [number, number]);
    }

    const stats = await contratistaRepo.valoracionStats(result.items.map((c) => c.id_user));
    const items = result.items.map((c) => ({
      ...c,
      trabajos_completados: c._count.solicitud,
      valoracion: stats.get(c.id_user) ?? { promedio: null, cantidad: 0 },
    }));
    return { ...toPage(items, result.total, q), alcance };
  },

  /** Solo la administración otorga o quita la insignia. */
  setVerificado: async (id: bigint, verificado: boolean) => {
    const existe = await contratistaRepo.getById(id);
    if (!existe) throw notFound("Contratista no encontrado");
    return contratistaRepo.setVerificado(id, verificado);
  },

  get: async (id: bigint) => {
    const c = await contratistaRepo.getById(id);
    if (!c) throw notFound("Contratista no encontrado");
    const [stats, valoraciones] = await Promise.all([contratistaRepo.valoracionStats([id]), valoracionRepo.listByContratista(id)]);
    return { ...c, trabajos_completados: c._count.solicitud, valoracion: stats.get(id) ?? { promedio: null, cantidad: 0 }, valoraciones };
  },
};
