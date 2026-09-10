import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

type ApiError = { status: number; code: string; message: string; details?: unknown };

/** Traduce cualquier error (Zod, Prisma, JWT o de negocio) al formato `{ code, message, details }`. */
export function normalizeError(err: any): ApiError {
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
  }

  // Errores conocidos de Prisma
  switch (err?.code) {
    case "P2002":
      return { status: 409, code: "DUPLICATE", message: "Ya existe un registro con esos datos", details: err.meta };
    case "P2003":
      return { status: 400, code: "FK_INVALID", message: "Referencia a un registro inexistente", details: err.meta };
    case "P2025":
      return { status: 404, code: "NOT_FOUND", message: "Registro no encontrado" };
  }

  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return { status: 401, code: "TOKEN_INVALID", message: "Token inválido o expirado" };
  }

  // body JSON mal formado (express.json)
  if (err?.type === "entity.parse.failed") {
    return { status: 400, code: "BAD_JSON", message: "El cuerpo de la petición no es JSON válido" };
  }

  const status = typeof err?.status === "number" ? err.status : 500;
  return {
    status,
    code: err?.code ?? (status === 500 ? "INTERNAL_ERROR" : "ERROR"),
    message: err?.message ?? "Error interno",
    details: err?.details,
  };
}

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const { status, code, message, details } = normalizeError(err);
  if (status === 500 && env.NODE_ENV !== "test") {
    console.error(err);
  }
  res.status(status).json({ code, message, details });
}
