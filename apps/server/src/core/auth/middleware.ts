import type { NextFunction, Request, Response } from "express";
import { prisma } from "@repo/db";
import { verifyToken } from "./jwt.js";
import type { AuthUser, RoleName } from "./types.js";

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** Carga el usuario y sus roles actuales desde la DB (null si no existe). */
export async function loadAuthUser(id_user: bigint): Promise<AuthUser | null> {
  const u = await prisma.users.findUnique({
    where: { id_user },
    select: { id_user: true, email: true, nombre: true, apellido: true, user_roles: { select: { roles: { select: { name: true } } } } },
  });
  if (!u) return null;
  return {
    id_user: u.id_user,
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    roles: u.user_roles.map((r) => r.roles.name as RoleName),
  };
}

/** Exige un JWT válido y un usuario existente; deja el usuario (con roles vigentes) en `req.user`. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) return next({ status: 401, code: "UNAUTHORIZED", message: "Token requerido" });
  let id_user: bigint;
  try {
    id_user = verifyToken(token);
  } catch {
    return next({ status: 401, code: "TOKEN_INVALID", message: "Token inválido o expirado" });
  }
  try {
    const user = await loadAuthUser(id_user);
    if (!user) return next({ status: 401, code: "TOKEN_INVALID", message: "El usuario ya no existe" });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Si viene un JWT válido carga `req.user`; si no, sigue como anónimo. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) return next();
  try {
    const user = await loadAuthUser(verifyToken(token));
    if (user) req.user = user;
  } catch {
    /* anónimo */
  }
  next();
}

/** Exige al menos uno de los roles indicados. Usar después de `requireAuth`. */
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next({ status: 401, code: "UNAUTHORIZED", message: "Token requerido" });
    if (!req.user.roles.some((r) => roles.includes(r))) {
      return next({ status: 403, code: "FORBIDDEN", message: "No tenés permisos para realizar esta acción" });
    }
    next();
  };
}

export const hasRole = (user: AuthUser | undefined, role: RoleName) => !!user && user.roles.includes(role);
export const isAdmin = (user: AuthUser | undefined) => hasRole(user, "ADMIN");

/** Lanza 403 salvo que el usuario sea ADMIN o el dueño (`ownerId`). */
export function assertOwnerOrAdmin(user: AuthUser, ownerId: bigint, message = "No podés operar sobre recursos de otro usuario") {
  if (isAdmin(user) || user.id_user === ownerId) return;
  throw { status: 403, code: "FORBIDDEN", message };
}
