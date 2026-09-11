/**
 * Test unitario: cálculo del precio de referencia de mercado (funciones puras).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./servicio.repository.js", () => ({ servicioRepo: { getById: vi.fn(), comparablesDeCategoria: vi.fn() } }));
vi.mock("../precio/precio.repository.js", () => ({ precioRepo: { findVigente: vi.fn() } }));

import { desvioPorcentual, estadisticasPrecio } from "./servicio.service.js";

describe("estadisticasPrecio", () => {
  it("calcula promedio, mínimo y máximo", () => {
    expect(estadisticasPrecio([10000, 20000, 30000])).toEqual({ promedio: 20000, minimo: 10000, maximo: 30000, cantidad: 3 });
  });

  it("redondea el promedio a dos decimales", () => {
    expect(estadisticasPrecio([10, 20, 25])?.promedio).toBe(18.33);
  });

  it("sin comparables devuelve null, que es distinto de un promedio cero", () => {
    expect(estadisticasPrecio([])).toBeNull();
  });
});

describe("desvioPorcentual", () => {
  it("un precio por encima del promedio da positivo", () => {
    expect(desvioPorcentual(12000, 10000)).toBe(20);
  });

  it("un precio por debajo da negativo", () => {
    expect(desvioPorcentual(9000, 10000)).toBe(-10);
  });

  it("redondea a un decimal", () => {
    expect(desvioPorcentual(10123, 10000)).toBe(1.2);
  });

  it("con promedio cero no divide por cero", () => {
    expect(desvioPorcentual(5000, 0)).toBeNull();
  });
});
