import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Registro público: solo se puede elegir CLIENTE o PRESTAMISTA (ADMIN lo asigna otro admin). */
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  rol: z.enum(["CLIENTE", "PRESTAMISTA"]),
  id_localidad: z.coerce.bigint().positive().optional().nullable(),
});

/** Edición del propio perfil: sin roles ni email (eso lo maneja ADMIN). */
export const UpdateMeSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellido: z.string().min(1).max(100).optional(),
  password: z.string().min(6).optional(),
  cuil_cuit: z.string().max(20).optional().nullable(),
  fecha_nac: z.coerce.date().optional().nullable(),
  domicilio: z.string().max(255).optional().nullable(),
  id_localidad: z.coerce.bigint().positive().optional().nullable(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type UpdateMeDto = z.infer<typeof UpdateMeSchema>;
