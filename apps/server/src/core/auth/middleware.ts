import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";
import type { AuthUser, RoleName } from "./types.js";

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** Exige un JWT válido; deja el usuario en `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    return next({ status: 401, code: "UNAUTHORIZED", message: "Token requerido" });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next({ status: 401, code: "TOKEN_INVALID", message: "Token inválido o expirado" });
  }
}

/** Si viene un JWT válido lo carga en `req.user`; si no, sigue como anónimo. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      /* anónimo */
    }
  }
  next();
}

/** Exige que el usuario autenticado tenga al menos uno de los roles indicados. Usar después de `requireAuth`. */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next({ status: 401, code: "UNAUTHORIZED", message: "Token requerido" });
    }
    if (!req.user.roles.some((r) => roles.includes(r))) {
      return next({
        status: 403,
        code: "FORBIDDEN",
        message: "No tenés permisos para realizar esta acción",
      });
    }
    next();
  };
}

export const hasRole = (user: AuthUser | undefined, role: RoleName) =>
  !!user && user.roles.includes(role);

export const isAdmin = (user: AuthUser | undefined) => hasRole(user, "ADMIN");

/** Lanza 403 salvo que el usuario sea ADMIN o el dueño (`ownerId`). */
export function assertOwnerOrAdmin(user: AuthUser, ownerId: bigint, message = "No podés operar sobre recursos de otro usuario") {
  if (isAdmin(user) || user.id_user === ownerId) return;
  throw { status: 403, code: "FORBIDDEN", message };
}
