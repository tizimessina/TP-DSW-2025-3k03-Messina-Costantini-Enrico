/**
 * Test unitario: reglas de negocio de Solicitud (repositorios mockeados).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./solicitud.repository.js", () => ({
  solicitudRepo: { create: vi.fn(), getById: vi.fn(), updateEstado: vi.fn(), list: vi.fn(), delete: vi.fn() },
}));
vi.mock("../servicio/servicio.repository.js", () => ({ servicioRepo: { getById: vi.fn() } }));
vi.mock("../campo/campo.repository.js", () => ({ campoRepo: { getById: vi.fn() } }));
vi.mock("../precio/precio.repository.js", () => ({ precioRepo: { findVigente: vi.fn() } }));
vi.mock("../insumo/insumo.repository.js", () => ({ insumoRepo: { getManyByIds: vi.fn() } }));

import { solicitudRepo } from "./solicitud.repository.js";
import { servicioRepo } from "../servicio/servicio.repository.js";
import { campoRepo } from "../campo/campo.repository.js";
import { precioRepo } from "../precio/precio.repository.js";
import { insumoRepo } from "../insumo/insumo.repository.js";
import { calcularImportes, puedeTransicionar, solicitudService } from "./solicitud.service.js";
import type { AuthUser } from "../../core/auth/types.js";

const productor: AuthUser = { id_user: 2n, email: "productor@agroapp.dev", roles: ["PRODUCTOR"] };
const contratista: AuthUser = { id_user: 3n, email: "contratista@agroapp.dev", roles: ["CONTRATISTA"] };
const admin: AuthUser = { id_user: 1n, email: "admin@agroapp.dev", roles: ["ADMIN"] };

describe("calcularImportes", () => {
  it("servicio = precio × hectáreas; solo suman los insumos que aporta el contratista", () => {
    const r = calcularImportes(45000, 10, [
      { cantidad: 2, precio_referencia: 100, proveedor: "CONTRATISTA" },
      { cantidad: 300, precio_referencia: 1250, proveedor: "PRODUCTOR" }, // no se cobra
    ]);
    expect(r.precio_servicio).toBe(450000);
    expect(r.costo_insumos).toBe(200);
    expect(r.precio_total).toBe(450200);
    expect(r.lineas[1].precio_unit).toBe(0);
  });

  it("redondea a dos decimales", () => {
    expect(calcularImportes(10.005, 3, []).precio_servicio).toBe(30.02);
  });
});

describe("puedeTransicionar (ciclo de vida por rol)", () => {
  it("el contratista acepta, rechaza y completa", () => {
    expect(puedeTransicionar("pendiente", "aceptada", "CONTRATISTA")).toBe(true);
    expect(puedeTransicionar("pendiente", "rechazada", "CONTRATISTA")).toBe(true);
    expect(puedeTransicionar("aceptada", "completada", "CONTRATISTA")).toBe(true);
  });
  it("el productor cancela pendientes y aceptadas, pero no acepta ni completa", () => {
    expect(puedeTransicionar("pendiente", "cancelada", "PRODUCTOR")).toBe(true);
    expect(puedeTransicionar("aceptada", "cancelada", "PRODUCTOR")).toBe(true);
    expect(puedeTransicionar("pendiente", "aceptada", "PRODUCTOR")).toBe(false);
    expect(puedeTransicionar("aceptada", "completada", "PRODUCTOR")).toBe(false);
  });
  it("los estados finales no cambian, ni para admin", () => {
    for (const final of ["rechazada", "cancelada", "completada"] as const) {
      expect(puedeTransicionar(final, "aceptada", "ADMIN")).toBe(false);
    }
  });
});

describe("solicitudService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(servicioRepo.getById).mockResolvedValue({ id_servicio: 1n, id_contratista: 3n, activo: true } as any);
    vi.mocked(campoRepo.getById).mockResolvedValue({ id_campo: 1n, id_productor: 2n, hectareas: 120.5 } as any);
    vi.mocked(precioRepo.findVigente).mockResolvedValue({ valor: 45000 } as any);
    vi.mocked(insumoRepo.getManyByIds).mockResolvedValue([{ id_insumo: 1n, precio_referencia: 38000 }] as any);
    vi.mocked(solicitudRepo.create).mockImplementation(async (d) => ({ id_solicitud: 99n, ...d }) as any);
  });

  it("toma el productor del token, el contratista del servicio y el precio del catálogo", async () => {
    const result = await solicitudService.create(productor, {
      id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 10,
      insumos: [{ id_insumo: 1n, cantidad: 2, proveedor: "CONTRATISTA" }],
    });
    expect(solicitudRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id_productor: 2n, id_contratista: 3n, precio_hectarea: 45000, precio_servicio: 450000, costo_insumos: 76000, precio_total: 526000 }),
    );
    expect(result.id_solicitud).toBe(99n);
  });

  it("no cobra los insumos que aporta el productor", async () => {
    await solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [{ id_insumo: 1n, cantidad: 5, proveedor: "PRODUCTOR" }] });
    expect(solicitudRepo.create).toHaveBeenCalledWith(expect.objectContaining({ costo_insumos: 0, precio_total: 45000 }));
  });

  it("rechaza si el campo no pertenece al productor", async () => {
    vi.mocked(campoRepo.getById).mockResolvedValue({ id_campo: 1n, id_productor: 77n, hectareas: 100 } as any);
    await expect(solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] })).rejects.toMatchObject({ status: 403 });
  });

  it("rechaza si las hectáreas superan las del campo", async () => {
    await expect(solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 500, insumos: [] })).rejects.toMatchObject({ code: "HECTAREAS_EXCEDIDAS" });
  });

  it("rechaza si el servicio no tiene precio vigente o está inactivo", async () => {
    vi.mocked(precioRepo.findVigente).mockResolvedValue(null);
    await expect(solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] })).rejects.toMatchObject({ code: "NO_PRICE" });
    vi.mocked(servicioRepo.getById).mockResolvedValue({ id_servicio: 1n, id_contratista: 3n, activo: false } as any);
    await expect(solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] })).rejects.toMatchObject({ status: 404 });
  });

  it("rechaza si un insumo no existe en el catálogo", async () => {
    await expect(
      solicitudService.create(productor, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [{ id_insumo: 42n, cantidad: 1, proveedor: "CONTRATISTA" }] }),
    ).rejects.toMatchObject({ code: "FK_INVALID" });
  });

  it("rechaza si quien solicita no es productor", async () => {
    await expect(solicitudService.create(contratista, { id_servicio: 1n, id_campo: 1n, hectareas_trabajadas: 1, insumos: [] })).rejects.toMatchObject({ status: 403 });
  });
});

describe("solicitudService.updateEstado", () => {
  const base = { id_solicitud: 5n, id_productor: 2n, id_contratista: 3n, estado: "pendiente", fecha_inicio: null, fecha_fin: null };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(solicitudRepo.getById).mockResolvedValue({ ...base } as any);
    vi.mocked(solicitudRepo.updateEstado).mockImplementation(async (id, d) => ({ ...base, id_solicitud: id, ...d }) as any);
  });

  it("al aceptar, el contratista fija la fecha de inicio (hoy si no había)", async () => {
    const r = await solicitudService.updateEstado(contratista, 5n, { estado: "aceptada" });
    expect(r.estado).toBe("aceptada");
    expect(r.fecha_inicio).toBeInstanceOf(Date);
  });

  it("el productor cancela con motivo", async () => {
    const r = await solicitudService.updateEstado(productor, 5n, { estado: "cancelada", motivo: "Cambio de planes" });
    expect(r.estado).toBe("cancelada");
    expect(r.motivo).toBe("Cambio de planes");
  });

  it("el productor no puede aceptar ni completar", async () => {
    await expect(solicitudService.updateEstado(productor, 5n, { estado: "aceptada" })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("no permite salir de un estado final", async () => {
    vi.mocked(solicitudRepo.getById).mockResolvedValue({ ...base, estado: "rechazada" } as any);
    await expect(solicitudService.updateEstado(admin, 5n, { estado: "aceptada" })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("al completar fija fecha_fin y valida coherencia de fechas", async () => {
    vi.mocked(solicitudRepo.getById).mockResolvedValue({ ...base, estado: "aceptada", fecha_inicio: new Date("2030-01-01T00:00:00Z") } as any);
    await expect(solicitudService.updateEstado(contratista, 5n, { estado: "completada" })).rejects.toMatchObject({ code: "FECHAS_INVALIDAS" });
  });

  it("un tercero no puede ver ni tocar la solicitud", async () => {
    const otro: AuthUser = { id_user: 9n, email: "x@x.dev", roles: ["PRODUCTOR"] };
    await expect(solicitudService.updateEstado(otro, 5n, { estado: "cancelada", motivo: "x" })).rejects.toMatchObject({ status: 403 });
  });
});
