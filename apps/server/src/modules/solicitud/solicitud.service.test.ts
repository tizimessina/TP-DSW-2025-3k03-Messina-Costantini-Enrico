/**
 * Test unitario (Tiziano Messina): reglas de negocio de Solicitud
 * sin tocar la base de datos (repositorios mockeados).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./solicitud.repository.js", () => ({
  solicitudRepo: { create: vi.fn(), getById: vi.fn(), updateEstado: vi.fn(), list: vi.fn(), delete: vi.fn() },
}));
vi.mock("../servicio/servicio.repository.js", () => ({ servicioRepo: { getById: vi.fn() } }));
vi.mock("../campo/campo.repository.js", () => ({ campoRepo: { getById: vi.fn() } }));
vi.mock("../precio/precio.repository.js", () => ({ precioRepo: { findVigente: vi.fn() } }));

import { solicitudRepo } from "./solicitud.repository.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { campoRepo } from "../campo/campo.repository.js";
import { precioRepo } from "../precio/precio.repository.js";
import { calcularImportes, puedeTransicionar, solicitudService } from "./solicitud.service.js";
import type { AuthUser } from "../../core/auth/types.js";

const cliente: AuthUser = { id_user: 2n, email: "cliente@agroapp.dev", roles: ["CLIENTE"] };
const prestamista: AuthUser = { id_user: 3n, email: "prestamista@agroapp.dev", roles: ["PRESTAMISTA"] };

describe("calcularImportes", () => {
  it("multiplica precio por hectárea y suma insumos", () => {
    const r = calcularImportes(45000, 10, [{ cantidad: 2, precio_unit: 100 }]);
    expect(r).toEqual({ precio_servicio: 450000, costo_insumos: 200, precio_total: 450200 });
  });

  it("redondea a dos decimales", () => {
    const r = calcularImportes(10.005, 3, []);
    expect(r.precio_servicio).toBe(30.02);
    expect(r.precio_total).toBe(30.02);
  });
});

describe("puedeTransicionar", () => {
  it("permite pendiente -> aceptada/rechazada y aceptada -> completada", () => {
    expect(puedeTransicionar("pendiente", "aceptada")).toBe(true);
    expect(puedeTransicionar("pendiente", "rechazada")).toBe(true);
    expect(puedeTransicionar("aceptada", "completada")).toBe(true);
  });

  it("rechaza transiciones inválidas", () => {
    expect(puedeTransicionar("aceptada", "rechazada")).toBe(false);
    expect(puedeTransicionar("completada", "pendiente")).toBe(false);
    expect(puedeTransicionar("rechazada", "aceptada")).toBe(false);
  });
});

describe("solicitudService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(servicioRepo.getById).mockResolvedValue({ id_servicio: 1n, id_prestamista: 3n } as any);
    vi.mocked(campoRepo.getById).mockResolvedValue({ id_campo: 1n, id_cliente: 2n, hectareas: 120.5 } as any);
    vi.mocked(precioRepo.findVigente).mockResolvedValue({ valor: 45000 } as any);
    vi.mocked(solicitudRepo.create).mockImplementation(async (d) => ({ id_solicitud: 99n, ...d }) as any);
  });

  it("toma el cliente del token, el prestamista del servicio y calcula el precio vigente × hectáreas", async () => {
    const result = await solicitudService.create(cliente, {
      id_servicio: 1n,
      id_campo: 1n,
      hectareas_trabajadas: 10,
      insumos: [{ id_insumo: 1n, cantidad: 2, precio_unit: 100, proveedor: "CLIENTE" }],
    });

    expect(solicitudRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id_cliente: 2n,
        id_prestamista: 3n,
        precio_servicio: 450000,
        costo_insumos: 200,
        precio_total: 450200,
      }),
    );
    expect(result.id_solicitud).toBe(99n);
  });

  it("rechaza si el campo no pertenece al cliente", async () => {
    vi.mocked(campoRepo.getById).mockResolvedValue({ id_campo: 1n, id_cliente: 77n, hectareas: 100 } as any);
    await expect(
      solicitudService.create(cliente, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] }),
    ).rejects.toMatchObject({ status: 403 });
    expect(solicitudRepo.create).not.toHaveBeenCalled();
  });

  it("rechaza si las hectáreas superan las del campo", async () => {
    await expect(
      solicitudService.create(cliente, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 500, insumos: [] }),
    ).rejects.toMatchObject({ code: "HECTAREAS_EXCEDIDAS" });
  });

  it("rechaza si el servicio no tiene precio vigente", async () => {
    vi.mocked(precioRepo.findVigente).mockResolvedValue(null);
    await expect(
      solicitudService.create(cliente, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] }),
    ).rejects.toMatchObject({ code: "NO_PRICE" });
  });

  it("rechaza si quien solicita no es cliente", async () => {
    await expect(
      solicitudService.create(prestamista, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("solicitudService.updateEstado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(solicitudRepo.getById).mockResolvedValue({
      id_solicitud: 5n,
      id_cliente: 2n,
      id_prestamista: 3n,
      estado: "pendiente",
    } as any);
    vi.mocked(solicitudRepo.updateEstado).mockImplementation(async (id, d) => ({ id_solicitud: id, ...d }) as any);
  });

  it("el prestamista puede aceptar una solicitud pendiente", async () => {
    const r = await solicitudService.updateEstado(prestamista, 5n, { estado: "aceptada" });
    expect(r.estado).toBe("aceptada");
  });

  it("el cliente no puede cambiar el estado", async () => {
    await expect(solicitudService.updateEstado(cliente, 5n, { estado: "aceptada" })).rejects.toMatchObject({
      status: 403,
    });
  });

  it("no permite una transición inválida", async () => {
    vi.mocked(solicitudRepo.getById).mockResolvedValue({ id_solicitud: 5n, id_cliente: 2n, id_prestamista: 3n, estado: "rechazada" } as any);
    await expect(solicitudService.updateEstado(prestamista, 5n, { estado: "completada" })).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });
});
