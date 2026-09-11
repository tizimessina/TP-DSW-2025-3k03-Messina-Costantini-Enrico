import { z } from 'zod';
import { ROLE_NAMES } from '../../core/auth/types.js';
import { PaginationQuerySchema } from '../../core/http/pagination.js';

export const CuitSchema = z.string().trim().regex(/^\d{2}-\d{8}-\d$/, 'Formato de CUIT/CUIL: 20-12345678-9');
export const TelefonoSchema = z.string().trim().min(6).max(30);
export const PasswordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72);

/** Datos personales editables (compartidos por el CRUD de admin y el propio perfil). */
export const PersonaSchema = z.object({
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  cuil_cuit: CuitSchema.optional().nullable(),
  telefono: TelefonoSchema.optional().nullable(),
  fecha_nac: z.coerce.date().optional().nullable(),
  domicilio: z.string().trim().max(255).optional().nullable(),
  id_localidad: z.coerce.bigint().positive().optional().nullable(),
  // Atributos del subtipo
  razon_social: z.string().trim().max(150).optional().nullable(),
  descripcion: z.string().trim().max(600).optional().nullable(),
  anios_experiencia: z.coerce.number().int().min(0).max(80).optional().nullable(),
});

export const UsuarioCreateSchema = PersonaSchema.extend({
  email: z.string().trim().toLowerCase().email(),
  password: PasswordSchema,
  roles: z.array(z.enum(ROLE_NAMES)).min(1, 'Asigná al menos un rol'),
});

export const UsuarioUpdateSchema = PersonaSchema.partial().extend({
  email: z.string().trim().toLowerCase().email().optional(),
  password: PasswordSchema.optional(),
  roles: z.array(z.enum(ROLE_NAMES)).min(1).optional(),
});

export const UsuarioParamsSchema = z.object({ id: z.coerce.bigint().positive() });

export const UsuarioQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  role: z.enum(ROLE_NAMES).optional(),
  id_localidad: z.coerce.bigint().positive().optional(),
});

export type UsuarioCreateDto = z.infer<typeof UsuarioCreateSchema>;
export type UsuarioUpdateDto = z.infer<typeof UsuarioUpdateSchema>;
export type UsuarioQuery = z.infer<typeof UsuarioQuerySchema>;
