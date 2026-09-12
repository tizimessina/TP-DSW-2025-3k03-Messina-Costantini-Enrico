import { z } from 'zod';
import { coordenadasCoherentes, CoordenadasSchema } from '../../core/util/geo.js';

export const LocalidadCreateSchema = z
  .object({
    id_provincia: z.coerce.bigint().positive(),
    nombre: z.string().trim().min(2).max(120),
    codigo_postal: z.string().trim().max(16).optional().nullable(),
    /** Centro de la localidad: se usa para calcular distancias. */
    ...CoordenadasSchema,
  })
  .refine(coordenadasCoherentes, { message: 'Latitud y longitud van juntas', path: ['longitud'] });

/** La provincia de una localidad no se cambia (cambiaría la ubicación de todos sus usuarios y campos). */
export const LocalidadUpdateSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    codigo_postal: z.string().trim().max(16).optional().nullable(),
    ...CoordenadasSchema,
  })
  .refine(coordenadasCoherentes, { message: 'Latitud y longitud van juntas', path: ['longitud'] });

export const LocalidadParamsSchema = z.object({ id: z.coerce.bigint().positive() });
export const LocalidadQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  id_provincia: z.coerce.bigint().positive().optional(),
});

export type LocalidadCreateDto = z.infer<typeof LocalidadCreateSchema>;
export type LocalidadUpdateDto = z.infer<typeof LocalidadUpdateSchema>;
