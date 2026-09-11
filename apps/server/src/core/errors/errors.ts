/** Errores de negocio con la forma `{ status, code, message, details? }` que entiende `errorMiddleware`. */
export type ApiError = { status: number; code: string; message: string; details?: unknown };

export const notFound = (message: string): ApiError => ({ status: 404, code: "NOT_FOUND", message });
export const badRequest = (code: string, message: string): ApiError => ({ status: 400, code, message });
export const forbidden = (message = "No tenés permisos para realizar esta acción"): ApiError => ({ status: 403, code: "FORBIDDEN", message });
export const conflict = (code: string, message: string): ApiError => ({ status: 409, code, message });

/** Traduce errores conocidos de Prisma a errores de negocio; si no aplica, relanza. */
export function translatePrisma(e: any, map: Partial<Record<"P2002" | "P2003" | "P2025", ApiError>>): never {
  const mapped = map[e?.code as keyof typeof map];
  if (mapped) throw mapped;
  throw e;
}
