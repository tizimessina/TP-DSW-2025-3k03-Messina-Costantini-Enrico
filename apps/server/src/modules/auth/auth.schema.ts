import { z } from "zod";
import { PasswordSchema, PersonaSchema } from "../usuario/usuario.schema.js";

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Registro público: solo PRODUCTOR o CONTRATISTA (ADMIN lo asigna otro admin). */
export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: PasswordSchema,
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  rol: z.enum(["PRODUCTOR", "CONTRATISTA"]),
  id_localidad: z.coerce.bigint().positive().optional().nullable(),
  telefono: z.string().trim().min(6).max(30).optional().nullable(),
});

/** Edición del propio perfil: sin roles ni email. */
export const UpdateMeSchema = PersonaSchema.partial();

export const ChangePasswordSchema = z.object({
  password_actual: z.string().min(1),
  password_nueva: PasswordSchema,
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type UpdateMeDto = z.infer<typeof UpdateMeSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
