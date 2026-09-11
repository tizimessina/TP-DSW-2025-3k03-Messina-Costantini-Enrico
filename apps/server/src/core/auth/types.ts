export const ROLE_NAMES = ["ADMIN", "PRODUCTOR", "CONTRATISTA"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

/** Roles de negocio mutuamente excluyentes (un usuario es productor o contratista, no ambos). */
export const BUSINESS_ROLES: RoleName[] = ["PRODUCTOR", "CONTRATISTA"];

/** Usuario autenticado que viaja en `req.user` (roles revalidados contra la DB en cada request). */
export type AuthUser = {
  id_user: bigint;
  email: string;
  nombre: string;
  apellido: string;
  roles: RoleName[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
