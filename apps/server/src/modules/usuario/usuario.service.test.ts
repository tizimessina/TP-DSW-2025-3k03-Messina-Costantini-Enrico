/**
 * Test unitario: reglas de usuarios y roles (repositorio mockeado).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./usuario.repository.js", () => ({
  usuarioRepo: { getById: vi.fn(), countAdmins: vi.fn(), countDependencies: vi.fn(), roleIdsByNames: vi.fn(), save: vi.fn(), remove: vi.fn() },
}));
import { usuarioRepo } from "./usuario.repository.js";
import { assertRolesValidos, usuarioService } from "./usuario.service.js";

const row = (roles: string[]) => ({
  id_user: 1n, email: "a@a.dev", password_hash: "x", nombre: "A", apellido: "B", cuil_cuit: null, telefono: null, fecha_nac: null,
  domicilio: null, id_localidad: null, created_at: new Date(), updated_at: new Date(), localidad: null,
  user_roles: roles.map((name) => ({ roles: { name } })), productor_profile: null, contratista_profile: null,
});

describe("assertRolesValidos", () => {
  it("permite ADMIN con un rol de negocio", () => {
    expect(() => assertRolesValidos(["ADMIN", "PRODUCTOR"])).not.toThrow();
  });
  it("rechaza productor + contratista", () => {
    expect(() => assertRolesValidos(["PRODUCTOR", "CONTRATISTA"])).toThrow(expect.objectContaining({ code: "ROLES_EXCLUYENTES" }));
  });
});

describe("usuarioService guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usuarioRepo.roleIdsByNames).mockResolvedValue(new Map([["ADMIN", 1], ["PRODUCTOR", 2], ["CONTRATISTA", 3]]) as any);
    vi.mocked(usuarioRepo.countDependencies).mockResolvedValue({ campos: 0, servicios: 0, solicitudes: 0 });
    vi.mocked(usuarioRepo.save).mockImplementation(async () => row(["PRODUCTOR"]) as any);
  });

  it("no deja quitar el rol ADMIN al único admin", async () => {
    vi.mocked(usuarioRepo.getById).mockResolvedValue(row(["ADMIN"]) as any);
    vi.mocked(usuarioRepo.countAdmins).mockResolvedValue(1);
    await expect(usuarioService.update(1n, { roles: ["PRODUCTOR"] })).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("no deja eliminar al único admin", async () => {
    vi.mocked(usuarioRepo.getById).mockResolvedValue(row(["ADMIN"]) as any);
    vi.mocked(usuarioRepo.countAdmins).mockResolvedValue(1);
    await expect(usuarioService.remove(1n)).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("no deja quitar PRODUCTOR si tiene campos", async () => {
    vi.mocked(usuarioRepo.getById).mockResolvedValue(row(["PRODUCTOR"]) as any);
    vi.mocked(usuarioRepo.countDependencies).mockResolvedValue({ campos: 2, servicios: 0, solicitudes: 0 });
    await expect(usuarioService.update(1n, { roles: ["CONTRATISTA"] })).rejects.toMatchObject({ code: "IN_USE" });
  });

  it("el usuario público nunca incluye password_hash y aplana los roles", async () => {
    vi.mocked(usuarioRepo.getById).mockResolvedValue(row(["ADMIN", "PRODUCTOR"]) as any);
    const u = await usuarioService.get(1n);
    expect((u as any).password_hash).toBeUndefined();
    expect(u.roles).toEqual(["ADMIN", "PRODUCTOR"]);
  });
});
