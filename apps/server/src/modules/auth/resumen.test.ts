/**
 * Test unitario: la serie mensual del panel (función pura).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/db", () => ({ prisma: {} }));

import { serieMensual } from "./auth.service.js";

const hasta = new Date(Date.UTC(2026, 8, 15)); // 15 de septiembre de 2026
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("serieMensual", () => {
  it("devuelve siempre los seis meses, incluidos los vacíos", () => {
    const serie = serieMensual([], hasta);
    expect(serie.map((p) => p.periodo)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(serie.every((p) => p.cantidad === 0 && p.total === 0)).toBe(true);
  });

  it("acumula cantidad e importe en el mes que corresponde", () => {
    const serie = serieMensual(
      [
        { fecha: d("2026-09-02"), total: 1000 },
        { fecha: d("2026-09-20"), total: 500.5 },
        { fecha: d("2026-07-10"), total: 250 },
      ],
      hasta,
    );
    expect(serie.at(-1)).toEqual({ periodo: "2026-09", cantidad: 2, total: 1500.5 });
    expect(serie.find((p) => p.periodo === "2026-07")).toEqual({ periodo: "2026-07", cantidad: 1, total: 250 });
  });

  it("ignora lo que cae fuera de la ventana y lo que no tiene fecha", () => {
    const serie = serieMensual([{ fecha: d("2025-01-05"), total: 999 }, { fecha: null, total: 100 }], hasta);
    expect(serie.every((p) => p.cantidad === 0)).toBe(true);
  });

  it("cruza bien el cambio de año", () => {
    const serie = serieMensual([], new Date(Date.UTC(2026, 1, 10)));
    expect(serie.map((p) => p.periodo)).toEqual(["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});
