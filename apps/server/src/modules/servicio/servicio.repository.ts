import { prisma, type Prisma } from '@repo/db';
import { publicUserSelect } from '../../core/db/selects.js';
import { todayCivil } from '../../core/util/dates.js';

/** Solo el precio vigente (mayor fecha_desde <= hoy). */
const precioVigente = () => ({ where: { fecha_desde: { lte: todayCivil() } }, orderBy: { fecha_desde: 'desc' as const }, take: 1 });

const listInclude = () => ({
  categoria: true,
  contratista_profile: { include: { users: { select: publicUserSelect } } },
  precio: precioVigente(),
  _count: { select: { solicitud: { where: { estado: 'completada' as const } } } },
});

export const servicioRepo = {
  /**
   * Servicios activos de una categoría con su precio vigente, para poder comparar.
   * Se puede acotar a una provincia mirando la localidad del contratista.
   */
  comparablesDeCategoria: (id_categoria: bigint, id_provincia?: bigint) =>
    prisma.servicio.findMany({
      where: {
        activo: true,
        id_categoria,
        ...(id_provincia ? { contratista_profile: { users: { localidad: { id_provincia } } } } : {}),
      },
      select: { id_servicio: true, precio: precioVigente() },
    }),

  list: async (where: Prisma.servicioWhereInput, skip: number, take: number) => {
    const [items, total] = await Promise.all([
      prisma.servicio.findMany({ where, skip, take, orderBy: [{ nombre: 'asc' }], include: listInclude() }),
      prisma.servicio.count({ where }),
    ]);
    return { items, total };
  },

  getById: (id: bigint) =>
    prisma.servicio.findUnique({
      where: { id_servicio: id },
      include: {
        categoria: true,
        contratista_profile: { include: { users: { select: publicUserSelect } } },
        precio: { orderBy: { fecha_desde: 'desc' } }, // historial completo en el detalle
        _count: { select: { solicitud: { where: { estado: 'completada' } } } },
      },
    }),

  create: (data: { nombre: string; descripcion?: string | null; id_categoria: bigint; id_contratista: bigint; precio_inicial?: number }) =>
    prisma.servicio.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        id_categoria: data.id_categoria,
        id_contratista: data.id_contratista,
        ...(data.precio_inicial ? { precio: { create: { fecha_desde: todayCivil(), valor: data.precio_inicial } } } : {}),
      },
      include: listInclude(),
    }),

  update: (id: bigint, data: { nombre?: string; descripcion?: string | null; id_categoria?: bigint; activo?: boolean }) =>
    prisma.servicio.update({ where: { id_servicio: id }, data, include: listInclude() }),
};
