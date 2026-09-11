import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

/** El token solo identifica al usuario; los roles se leen de la DB en cada request. */
export type JwtPayload = { sub: string };

export function signToken(id_user: bigint): string {
  const payload: JwtPayload = { sub: id_user.toString() };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function verifyToken(token: string): bigint {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  if (!decoded?.sub || !/^\d+$/.test(decoded.sub)) throw new Error("Token sin subject válido");
  return BigInt(decoded.sub);
}
