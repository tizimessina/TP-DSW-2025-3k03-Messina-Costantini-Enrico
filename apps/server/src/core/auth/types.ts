export const ROLE_NAMES = ["ADMIN", "CLIENTE", "PRESTAMISTA"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

/** Usuario autenticado que viaja en `req.user` una vez validado el JWT. */
export type AuthUser = {
  id_user: bigint;
  email: string;
  roles: RoleName[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
