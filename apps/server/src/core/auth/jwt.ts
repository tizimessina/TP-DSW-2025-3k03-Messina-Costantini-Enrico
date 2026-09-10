import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser, RoleName } from "./types.js";

export type JwtPayload = {
  sub: string; // id_user como string (BigInt no es serializable en JSON)
  email: string;
  roles: RoleName[];
};

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id_user.toString(),
    email: user.email,
    roles: user.roles,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  return {
    id_user: BigInt(decoded.sub),
    email: decoded.email,
    roles: decoded.roles ?? [],
  };
}
