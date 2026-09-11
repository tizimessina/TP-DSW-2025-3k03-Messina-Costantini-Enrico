import { badRequest, conflict, notFound, translatePrisma } from '../../core/errors/errors.js';
import type { LocalidadCreateDto, LocalidadUpdateDto } from './localidad.schema.js';
import { localidadRepo } from './localidad.repository.js';

const DUP = conflict('DUPLICATE', 'Ya existe una localidad con ese nombre en esa provincia');

export const localidadService = {
  list: (q?: string, id_provincia?: bigint) => localidadRepo.list(q, id_provincia),

  get: async (id: bigint) => {
    const found = await localidadRepo.getById(id);
    if (!found) throw notFound('Localidad no encontrada');
    return found;
  },

  create: (dto: LocalidadCreateDto) =>
    localidadRepo
      .create({ id_provincia: dto.id_provincia, nombre: dto.nombre, codigo_postal: dto.codigo_postal || null })
      .catch((e) => translatePrisma(e, { P2003: badRequest('FK_INVALID', 'La provincia no existe'), P2002: DUP })),

  update: async (id: bigint, dto: LocalidadUpdateDto) => {
    await localidadService.get(id);
    return localidadRepo
      .update(id, {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        // `null` o "" limpian el código postal; undefined lo deja como está
        ...(dto.codigo_postal !== undefined ? { codigo_postal: dto.codigo_postal || null } : {}),
      })
      .catch((e) => translatePrisma(e, { P2002: DUP }));
  },

  remove: async (id: bigint) => {
    await localidadService.get(id);
    const { users, campos } = await localidadRepo.countUsage(id);
    if (users + campos > 0) {
      throw conflict('IN_USE', `No se puede eliminar: la usan ${users} usuario(s) y ${campos} campo(s)`);
    }
    return localidadRepo.remove(id);
  },
};
