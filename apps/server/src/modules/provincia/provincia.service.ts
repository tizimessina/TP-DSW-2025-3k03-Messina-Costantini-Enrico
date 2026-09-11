import { conflict, notFound, translatePrisma } from '../../core/errors/errors.js';
import type { ProvinciaCreateDto, ProvinciaUpdateDto } from './provincia.schema.js';
import { provinciaRepo } from './provincia.repository.js';

const DUP = conflict('DUPLICATE', 'Ya existe una provincia con ese nombre');

export const provinciaService = {
  list: (q?: string) => provinciaRepo.list(q),

  get: async (id: bigint) => {
    const found = await provinciaRepo.getById(id);
    if (!found) throw notFound('Provincia no encontrada');
    return found;
  },

  create: (dto: ProvinciaCreateDto) => provinciaRepo.create(dto).catch((e) => translatePrisma(e, { P2002: DUP })),

  update: async (id: bigint, dto: ProvinciaUpdateDto) => {
    await provinciaService.get(id);
    return provinciaRepo.update(id, dto).catch((e) => translatePrisma(e, { P2002: DUP }));
  },

  remove: async (id: bigint) => {
    await provinciaService.get(id);
    const n = await provinciaRepo.countLocalidades(id);
    if (n > 0) throw conflict('IN_USE', `No se puede eliminar: tiene ${n} localidad(es) asociada(s)`);
    return provinciaRepo.remove(id);
  },
};
