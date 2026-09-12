/**
 * Test unitario: reglas de cercanía por distancia real (funciones puras).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./contratista.repository.js", () => ({
  contratistaRepo: {
    list: vi.fn(),
    listCandidatosUbicacion: vi.fn(),
    listByIds: vi.fn(),
    getById: vi.fn(),
    valoracionStats: vi.fn(),
    setVerificado: vi.fn(),
    campoUbicacion: vi.fn(),
  },
}));
vi.mock("../valoracion/valoracion.repository.js", () => ({ valoracionRepo: { listByContratista: vi.fn() } }));

import {
  conDistancia,
  escaleraDeRadios,
  filtrarPorRadio,
  ordenarPorDistancia,
  paginarEnMemoria,
  puntoDeContratista,
  type CandidatoUbicado,
} from "./contratista.service.js";

/** Campo de demostración en Pergamino. */
const PERGAMINO = { lat: -33.8912, lng: -60.5731 };

const candidato = (id: number, apellido: string, propio?: [number, number] | null, localidad?: [number, number] | null) => ({
  id_user: BigInt(id),
  latitud: propio ? propio[0] : null,
  longitud: propio ? propio[1] : null,
  users: { apellido, localidad: localidad ? { latitud: localidad[0], longitud: localidad[1] } : null },
});

const ubicado = (id: number, apellido: string, distancia_km: number | null): CandidatoUbicado => ({
  id_user: BigInt(id),
  apellido,
  punto: distancia_km === null ? null : { lat: 0, lng: 0 },
  punto_fuente: distancia_km === null ? null : "localidad",
  distancia_km,
});

describe("puntoDeContratista", () => {
  it("el punto propio le gana al centro de la localidad", () => {
    const r = puntoDeContratista(candidato(1, "Molina", [-33.71, -61.9], [-33.7458, -61.9689]));
    expect(r.fuente).toBe("propio");
    expect(r.punto).toEqual({ lat: -33.71, lng: -61.9 });
  });

  it("sin punto propio usa el centro de su localidad", () => {
    const r = puntoDeContratista(candidato(2, "Sosa", null, [-33.8894, -60.5739]));
    expect(r.fuente).toBe("localidad");
    expect(r.punto).toEqual({ lat: -33.8894, lng: -60.5739 });
  });

  it("sin ninguno de los dos no hay punto", () => {
    const r = puntoDeContratista(candidato(3, "Pérez", null, null));
    expect(r.punto).toBeNull();
    expect(r.fuente).toBeNull();
  });
});

describe("conDistancia", () => {
  it("mide desde el origen y conserva de dónde salió cada punto", () => {
    const items = conDistancia(
      [
        candidato(1, "Sosa", null, [-33.8894, -60.5739]), // misma ciudad que el campo
        candidato(2, "Molina", [-33.71, -61.9], [-33.7458, -61.9689]),
        candidato(3, "Pérez", null, null),
      ],
      PERGAMINO,
    );
    expect(items[0].distancia_km).toBeLessThan(1);
    expect(items[0].punto_fuente).toBe("localidad");
    expect(items[1].distancia_km).toBeGreaterThan(100);
    expect(items[1].punto_fuente).toBe("propio");
    expect(items[2].distancia_km).toBeNull();
  });
});

describe("filtrarPorRadio", () => {
  const items = [ubicado(1, "Sosa", 0.2), ubicado(2, "Molina", 130), ubicado(3, "Giménez", 360), ubicado(4, "Pérez", null)];

  it("deja afuera a los que superan el radio", () => {
    const { dentro } = filtrarPorRadio(items, 200);
    expect(dentro.map((d) => d.apellido)).toEqual(["Sosa", "Molina"]);
  });

  it("el borde exacto entra", () => {
    expect(filtrarPorRadio(items, 130).dentro.map((d) => d.apellido)).toContain("Molina");
  });

  it("quien no tiene ubicación queda afuera, pero se cuenta", () => {
    const { dentro, sin_ubicacion } = filtrarPorRadio(items, 500);
    expect(dentro.map((d) => d.apellido)).not.toContain("Pérez");
    expect(sin_ubicacion).toBe(1);
  });
});

describe("ordenarPorDistancia", () => {
  it("de más cerca a más lejos", () => {
    const r = ordenarPorDistancia([ubicado(1, "C", 360), ubicado(2, "A", 0.2), ubicado(3, "B", 130)]);
    expect(r.map((x) => x.apellido)).toEqual(["A", "B", "C"]);
  });

  it("los que no tienen distancia van al final", () => {
    const r = ordenarPorDistancia([ubicado(1, "SinPunto", null), ubicado(2, "Cerca", 5)]);
    expect(r.map((x) => x.apellido)).toEqual(["Cerca", "SinPunto"]);
  });

  it("a igual distancia desempata por apellido", () => {
    const r = ordenarPorDistancia([ubicado(1, "Zabala", 10), ubicado(2, "Acosta", 10)]);
    expect(r.map((x) => x.apellido)).toEqual(["Acosta", "Zabala"]);
  });
});

describe("paginarEnMemoria", () => {
  const cinco = [1, 2, 3, 4, 5];

  it("corta la página pedida y conserva el total", () => {
    const { pagina, total } = paginarEnMemoria(cinco, 2, 2);
    expect(pagina).toEqual([3, 4]);
    expect(total).toBe(5);
  });

  it("la última página puede venir incompleta", () => {
    expect(paginarEnMemoria(cinco, 3, 2).pagina).toEqual([5]);
  });

  it("una página fuera de rango devuelve vacío sin romper", () => {
    expect(paginarEnMemoria(cinco, 9, 2).pagina).toEqual([]);
  });
});

describe("escaleraDeRadios", () => {
  it("prueba el pedido, el doble y el cuádruple", () => {
    expect(escaleraDeRadios(50)).toEqual([50, 100, 200]);
  });

  it("no se pasa del máximo ni repite valores", () => {
    expect(escaleraDeRadios(300)).toEqual([300, 500]);
    expect(escaleraDeRadios(500)).toEqual([500]);
  });
});
