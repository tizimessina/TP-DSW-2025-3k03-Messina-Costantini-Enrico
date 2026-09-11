/**
 * Test unitario: JWT y middlewares de autorización (sin base de datos: se mockea la carga del usuario).
 */
import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

vi.mock("@repo/db", () => ({ prisma: { users: { findUnique: vi.fn() } } }));
import { prisma } from "@repo/db";
import { signToken, verifyToken } from "./jwt.js";
import { assertOwnerOrAdmin, requireAuth, requireRole } from "./middleware.js";
import type { AuthUser } from "./types.js";

const admin: AuthUser = { id_user: 1n, email: "admin@agroapp.dev", roles: ["ADMIN"] };
const productor: AuthUser = { id_user: 2n, email: "productor@agroapp.dev", roles: ["PRODUCTOR"] };

const dbUser = (u: AuthUser) => ({ id_user: u.id_user, email: u.email, user_roles: u.roles.map((name) => ({ roles: { name } })) });
const mockReq = (authorization?: string) => ({ headers: authorization ? { authorization } : {} }) as unknown as Request;
const res = {} as Response;

describe("jwt", () => {
  it("firma y verifica un token con el id del usuario", () => {
    expect(verifyToken(signToken(2n))).toBe(2n);
  });
  it("rechaza un token manipulado", () => {
    expect(() => verifyToken(signToken(2n) + "x")).toThrow();
  });
});

describe("requireAuth", () => {
  it("responde 401 sin header Authorization", async () => {
    const next = vi.fn() as NextFunction;
    await requireAuth(mockReq(), res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("carga req.user con los roles actuales de la DB", async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue(dbUser(productor) as any);
    const req = mockReq(`Bearer ${signToken(2n)}`);
    const next = vi.fn() as NextFunction;
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(productor);
  });

  it("responde 401 si el usuario del token ya no existe", async () => {
    vi.mocked(prisma.users.findUnique).mockResolvedValue(null);
    const next = vi.fn() as NextFunction;
    await requireAuth(mockReq(`Bearer ${signToken(99n)}`), res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: "TOKEN_INVALID" }));
  });

  it("responde 401 con un token inválido", async () => {
    const next = vi.fn() as NextFunction;
    await requireAuth(mockReq("Bearer basura"), res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, code: "TOKEN_INVALID" }));
  });
});

describe("requireRole", () => {
  it("deja pasar si el usuario tiene alguno de los roles", () => {
    const req = mockReq();
    req.user = productor;
    const next = vi.fn() as NextFunction;
    requireRole("ADMIN", "PRODUCTOR")(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
  it("responde 403 si no tiene el rol", () => {
    const req = mockReq();
    req.user = productor;
    const next = vi.fn() as NextFunction;
    requireRole("ADMIN")(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });
});

describe("assertOwnerOrAdmin", () => {
  it("permite al dueño y al admin", () => {
    expect(() => assertOwnerOrAdmin(productor, 2n)).not.toThrow();
    expect(() => assertOwnerOrAdmin(admin, 2n)).not.toThrow();
  });
  it("lanza 403 a un tercero", () => {
    expect(() => assertOwnerOrAdmin(productor, 3n)).toThrow(expect.objectContaining({ status: 403 }));
  });
});
