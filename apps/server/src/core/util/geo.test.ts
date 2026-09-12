/**
 * Test unitario: distancia por Haversine y conversión de coordenadas.
 * Las distancias de referencia son verificables en cualquier mapa.
 */
import { describe, expect, it } from "vitest";
import { haversineKm, puntoDe, redondearKm, type Punto } from "./geo.js";

const ROSARIO: Punto = { lat: -32.9468, lng: -60.6393 };
const CORDOBA: Punto = { lat: -31.4201, lng: -64.1888 };
const BUENOS_AIRES: Punto = { lat: -34.6037, lng: -58.3816 };

describe("haversineKm", () => {
  it("el mismo punto está a cero", () => {
    expect(haversineKm(ROSARIO, ROSARIO)).toBe(0);
  });

  it("Rosario a Córdoba son unos 375 km en línea recta", () => {
    expect(haversineKm(ROSARIO, CORDOBA)).toBeGreaterThan(370);
    expect(haversineKm(ROSARIO, CORDOBA)).toBeLessThan(380);
  });

  it("Rosario a Buenos Aires son unos 278 km", () => {
    expect(haversineKm(ROSARIO, BUENOS_AIRES)).toBeGreaterThan(272);
    expect(haversineKm(ROSARIO, BUENOS_AIRES)).toBeLessThan(284);
  });

  it("es simétrica", () => {
    expect(haversineKm(ROSARIO, CORDOBA)).toBeCloseTo(haversineKm(CORDOBA, ROSARIO), 9);
  });

  it("un grado de latitud son unos 111 km, en cualquier longitud", () => {
    const d = haversineKm({ lat: -33, lng: -60 }, { lat: -34, lng: -60 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("mide bien cruzando el ecuador y el meridiano", () => {
    const d = haversineKm({ lat: -1, lng: -1 }, { lat: 1, lng: 1 });
    // Dos grados de latitud y dos de longitud cerca del cruce: unos 314 km.
    expect(d).toBeGreaterThan(310);
    expect(d).toBeLessThan(318);
  });
});

describe("puntoDe", () => {
  it("convierte los Decimal de Prisma en números", () => {
    expect(puntoDe("-33.891200", "-60.573100")).toEqual({ lat: -33.8912, lng: -60.5731 });
  });

  it("sin alguna de las dos coordenadas no hay punto", () => {
    expect(puntoDe(null, -60)).toBeNull();
    expect(puntoDe(-33, null)).toBeNull();
    expect(puntoDe(undefined, undefined)).toBeNull();
  });

  it("un valor no numérico devuelve null, nunca NaN", () => {
    expect(puntoDe("ahí nomás", -60)).toBeNull();
  });

  it("el cero es una coordenada válida", () => {
    expect(puntoDe(0, 0)).toEqual({ lat: 0, lng: 0 });
  });
});

describe("redondearKm", () => {
  it("deja un decimal", () => {
    expect(redondearKm(130.4567)).toBe(130.5);
    expect(redondearKm(0.234)).toBe(0.2);
  });
});
