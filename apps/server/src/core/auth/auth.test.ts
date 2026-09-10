/**
 * Test unitario (Jeremías Costantini): JWT y middlewares de autorización,
 * sin base de datos.
 */
import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { signToken, verifyToken } from "./jwt.js";
import { assertOwnerOrAdmin, requireAuth, requireRole } from "./middleware.js";
import type { AuthUser } from "./types.js";

const admin: AuthUser = { id_user: 1n, email: "admin@agroapp.dev", roles: ["ADMIN"] };
const cliente: AuthUser = { id_user: 2n, email: "cliente@agroapp.dev", roles: ["CLIENTE"] };

function mockReq(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as unknown as Request;
}
const res = {} as Response;

describe("jwt", () => {
  it("firma y verifica un token conservando id, email y roles", () => {
    const token = signToken(cliente);
    expect(verifyToken(token)).toEqual(cliente);
  });

  it("rechaza un token manipulado", () => {
    const token = signToken(cliente) + "x";
    expect(() => verifyToken(token)).toThrow();
  });
});

describe("requireAuth", () => {
  it("responde 401 sin header Authorization", () => {
    const next = vi.fn() as NextFunction;
    requireAuth(mockReq(), res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("carga req.user con un token válido", () => {
    const req = mockReq(`Bearer ${signToken(cliente)}`);
    const next = vi.fn() as NextFunction;
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(cliente);
  });

  it("responde 401 con un token inválido", () => {
    const next = vi.fn() as NextFunction;
    requireAuth(mockReq("Bearer basura"), res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: "TOKEN_INVALID" }));
  });
});

describe("requireRole", () => {
  it("deja pasar si el usuario tiene alguno de los roles", () => {
    const req = mockReq();
    req.user = cliente;
    const next = vi.fn() as NextFunction;
    requireRole("ADMIN", "CLIENTE")(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("responde 403 si no tiene el rol", () => {
    const req = mockReq();
    req.user = cliente;
    const next = vi.fn() as NextFunction;
    requireRole("ADMIN")(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });
});

describe("assertOwnerOrAdmin", () => {
  it("permite al dueño y al admin", () => {
    expect(() => assertOwnerOrAdmin(cliente, 2n)).not.toThrow();
    expect(() => assertOwnerOrAdmin(admin, 2n)).not.toThrow();
  });

  it("lanza 403 a un tercero", () => {
    expect(() => assertOwnerOrAdmin(cliente, 3n)).toThrow(expect.objectContaining({ status: 403 }));
  });
});
