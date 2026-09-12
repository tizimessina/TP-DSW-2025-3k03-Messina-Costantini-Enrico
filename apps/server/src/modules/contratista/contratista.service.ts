import type { Prisma } from "@repo/db";
import { notFound } from "../../core/errors/errors.js";
import { toPage, toSkipTake } from "../../core/http/pagination.js";
import { haversineKm, puntoDe, redondearKm, type Punto } from "../../core/util/geo.js";
import { valoracionRepo } from "../valoracion/valoracion.repository.js";
import { contratistaRepo } from "./contratista.repository.js";
import type { ContratistaQuery } from "./contratista.schema.js";

/**
 * Tope de candidatos que se traen para calcular distancias. La distancia se
 * resuelve en la aplicación, no en la base, así que el universo a ordenar tiene
 * que estar acotado. Con el volumen real del sistema nunca se alcanza; si se
 * alcanzara, la respuesta lo informa en `truncado`.
 */
const CAP_CANDIDATOS = 500;

export type PuntoFuente = "propio" | "localidad";

/** De dónde salió el origen de la búsqueda. */
export type OrigenFuente = "campo" | "localidad_campo";

type Candidato = {
  id_user: bigint;
  latitud: unknown;
  longitud: unknown;
  users: { apellido: string; localidad: { latitud: unknown; longitud: unknown } | null };
};

export type CandidatoUbicado = {
  id_user: bigint;
  apellido: string;
  punto: Punto | null;
  punto_fuente: PuntoFuente | null;
  distancia_km: number | null;
};

/**
 * Punto del contratista, con prioridad al que declaró él mismo sobre el centro de
 * su localidad. Devuelve también de dónde salió, para poder decirlo en la UI.
 */
export function puntoDeContratista(c: Candidato): { punto: Punto | null; fuente: PuntoFuente | null } {
  const propio = puntoDe(c.latitud, c.longitud);
  if (propio) return { punto: propio, fuente: "propio" };
  const deLocalidad = puntoDe(c.users.localidad?.latitud, c.users.localidad?.longitud);
  if (deLocalidad) return { punto: deLocalidad, fuente: "localidad" };
  return { punto: null, fuente: null };
}

/** Anota cada candidato con su punto y su distancia al origen. */
export function conDistancia(candidatos: Candidato[], origen: Punto): CandidatoUbicado[] {
  return candidatos.map((c) => {
    const { punto, fuente } = puntoDeContratista(c);
    return {
      id_user: c.id_user,
      apellido: c.users.apellido,
      punto,
      punto_fuente: fuente,
      distancia_km: punto ? redondearKm(haversineKm(origen, punto)) : null,
    };
  });
}

/**
 * Deja solo a los que están dentro del radio. Quien no tiene punto conocido queda
 * afuera: no se puede afirmar que esté cerca. Se informa cuántos fueron.
 */
export function filtrarPorRadio(items: CandidatoUbicado[], radioKm: number) {
  const dentro = items.filter((i) => i.distancia_km !== null && i.distancia_km <= radioKm);
  const sin_ubicacion = items.filter((i) => i.distancia_km === null).length;
  return { dentro, sin_ubicacion };
}

/** De más cerca a más lejos; los que no tienen distancia van al final, por apellido. */
export function ordenarPorDistancia(items: CandidatoUbicado[]): CandidatoUbicado[] {
  return [...items].sort((a, b) => {
    if (a.distancia_km === null && b.distancia_km === null) return a.apellido.localeCompare(b.apellido);
    if (a.distancia_km === null) return 1;
    if (b.distancia_km === null) return -1;
    if (a.distancia_km !== b.distancia_km) return a.distancia_km - b.distancia_km;
    return a.apellido.localeCompare(b.apellido);
  });
}

/** Corta la página pedida sobre una lista ya ordenada. */
export function paginarEnMemoria<T>(items: T[], page: number, pageSize: number) {
  const inicio = (page - 1) * pageSize;
  return { pagina: items.slice(inicio, inicio + pageSize), total: items.length };
}

/**
 * Radios a probar cuando el pedido no devuelve a nadie: el pedido, el doble y el
 * cuádruple, sin pasarse del máximo admitido ni repetir valores.
 */
export function escaleraDeRadios(radioKm: number, maximo = 500): number[] {
  const escalones = [radioKm, radioKm * 2, radioKm * 4]
    .map((r) => Math.min(r, maximo))
    .filter((r, i, arr) => arr.indexOf(r) === i);
  return escalones;
}

/** Quita del payload público el punto declarado por el contratista. */
function sinPuntoPrivado<T extends { latitud?: unknown; longitud?: unknown }>(c: T) {
  const { latitud: _lat, longitud: _lng, ...publico } = c;
  return publico;
}

export const contratistaService = {
  /**
   * Listado público de contratistas.
   *
   * Sin `radio_km` ni `orden=distancia` funciona como siempre: filtra por la
   * localidad del campo y amplía a la provincia si no hay nadie, paginando en la
   * base. Si además se puede resolver un origen, agrega la distancia a los ítems
   * de esa página, que es información gratis.
   *
   * Con radio u orden por distancia, y con origen resoluble, el filtro geográfico
   * pasa a ser la distancia: se traen los candidatos, se ordenan y se pagina en
   * memoria, y recién después se hidrata la página elegida.
   */
  list: async (q: ContratistaQuery) => {
    let id_localidad = q.id_localidad;
    let id_provincia = q.id_provincia;
    let alcance: "localidad" | "provincia" | "todos" | "radio" = id_localidad ? "localidad" : id_provincia ? "provincia" : "todos";

    let origen: Punto | null = null;
    let origen_fuente: OrigenFuente | null = null;

    if (q.id_campo) {
      const campo = await contratistaRepo.campoUbicacion(q.id_campo);
      if (!campo) throw notFound("Campo no encontrado");
      id_localidad = campo.id_localidad;
      id_provincia = campo.localidad.id_provincia;
      alcance = "localidad";
      const propio = puntoDe(campo.latitud, campo.longitud);
      if (propio) {
        origen = propio;
        origen_fuente = "campo";
      } else {
        const deLocalidad = puntoDe(campo.localidad.latitud, campo.localidad.longitud);
        if (deLocalidad) {
          origen = deLocalidad;
          origen_fuente = "localidad_campo";
        }
      }
    }

    /** Filtros que no dependen de la geografía. */
    const filtrosComunes: Prisma.contratista_profileWhereInput = {
      ...(q.id_categoria ? { servicio: { some: { activo: true, id_categoria: q.id_categoria } } } : {}),
      ...(q.verificado ? { verificado: true } : {}),
    };
    const build = (loc?: bigint, prov?: bigint): Prisma.contratista_profileWhereInput => ({
      users: {
        ...(loc ? { id_localidad: loc } : prov ? { localidad: { id_provincia: prov } } : {}),
        ...(q.q ? { OR: [{ nombre: { contains: q.q } }, { apellido: { contains: q.q } }] } : {}),
      },
      ...filtrosComunes,
    });

    const quiereDistancia = q.radio_km !== undefined || q.orden === "distancia";

    // ── Modo por distancia ────────────────────────────────────────────────────
    if (quiereDistancia && origen) {
      const where: Prisma.contratista_profileWhereInput = {
        users: { ...(q.q ? { OR: [{ nombre: { contains: q.q } }, { apellido: { contains: q.q } }] } : {}) },
        ...filtrosComunes,
      };
      const candidatos = await contratistaRepo.listCandidatosUbicacion(where, CAP_CANDIDATOS);
      const ubicados = conDistancia(candidatos.items as Candidato[], origen);

      let seleccionados = ordenarPorDistancia(ubicados);
      let sin_ubicacion = 0;
      let radio_aplicado_km: number | null = null;
      let ampliado = false;

      if (q.radio_km !== undefined) {
        for (const radio of escaleraDeRadios(q.radio_km)) {
          const r = filtrarPorRadio(ubicados, radio);
          sin_ubicacion = r.sin_ubicacion;
          radio_aplicado_km = radio;
          ampliado = radio !== q.radio_km;
          if (r.dentro.length > 0) {
            seleccionados = ordenarPorDistancia(r.dentro);
            break;
          }
          seleccionados = [];
        }
      }

      const { pagina, total } = paginarEnMemoria(seleccionados, q.page, q.pageSize);
      const filas = await contratistaRepo.listByIds(pagina.map((p) => p.id_user));
      const porId = new Map(filas.map((f) => [f.id_user, f]));

      const stats = await contratistaRepo.valoracionStats(pagina.map((p) => p.id_user));
      const items = pagina
        .map((p) => {
          const fila = porId.get(p.id_user);
          if (!fila) return null;
          return {
            ...sinPuntoPrivado(fila),
            trabajos_completados: fila._count.solicitud,
            valoracion: stats.get(p.id_user) ?? { promedio: null, cantidad: 0 },
            distancia_km: p.distancia_km,
            punto_fuente: p.punto_fuente,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      return {
        ...toPage(items, total, q),
        alcance: "radio" as const,
        cercania: {
          origen: { lat: origen.lat, lng: origen.lng, fuente: origen_fuente },
          radio_km: q.radio_km ?? null,
          radio_aplicado_km,
          ampliado,
          sin_ubicacion,
          truncado: candidatos.total > CAP_CANDIDATOS,
          motivo: null,
        },
      };
    }

    // ── Modo por localidad, el de siempre ─────────────────────────────────────
    let result = await contratistaRepo.list(build(id_localidad, id_provincia), ...(Object.values(toSkipTake(q)) as [number, number]));
    if (q.id_campo && result.total === 0 && id_provincia) {
      alcance = "provincia";
      result = await contratistaRepo.list(build(undefined, id_provincia), ...(Object.values(toSkipTake(q)) as [number, number]));
    }

    const stats = await contratistaRepo.valoracionStats(result.items.map((c) => c.id_user));
    const items = result.items.map((c) => {
      const { punto, fuente } = puntoDeContratista(c as unknown as Candidato);
      return {
        ...sinPuntoPrivado(c),
        trabajos_completados: c._count.solicitud,
        valoracion: stats.get(c.id_user) ?? { promedio: null, cantidad: 0 },
        distancia_km: origen && punto ? redondearKm(haversineKm(origen, punto)) : null,
        punto_fuente: origen && punto ? fuente : null,
      };
    });

    return {
      ...toPage(items, result.total, q),
      alcance,
      ...(q.id_campo
        ? {
            cercania: {
              origen: origen ? { lat: origen.lat, lng: origen.lng, fuente: origen_fuente } : null,
              radio_km: q.radio_km ?? null,
              radio_aplicado_km: null,
              ampliado: false,
              sin_ubicacion: 0,
              truncado: false,
              // Se pidió cercanía por radio pero no había desde dónde medir.
              motivo: quiereDistancia && !origen ? ("campo_sin_coordenadas" as const) : null,
            },
          }
        : {}),
    };
  },

  get: async (id: bigint) => {
    const c = await contratistaRepo.getById(id);
    if (!c) throw notFound("Contratista no encontrado");
    const [stats, valoraciones] = await Promise.all([contratistaRepo.valoracionStats([id]), valoracionRepo.listByContratista(id)]);
    return {
      ...sinPuntoPrivado(c),
      trabajos_completados: c._count.solicitud,
      valoracion: stats.get(id) ?? { promedio: null, cantidad: 0 },
      valoraciones,
    };
  },

  /** Solo la administración otorga o quita la insignia. */
  setVerificado: async (id: bigint, verificado: boolean) => {
    const existe = await contratistaRepo.getById(id);
    if (!existe) throw notFound("Contratista no encontrado");
    const row = await contratistaRepo.setVerificado(id, verificado);
    return sinPuntoPrivado(row);
  },
};
