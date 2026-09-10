const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

/** Los DECIMAL de Prisma llegan como string; acepta ambos. */
export const fmtMoney = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === "" ? "-" : money.format(Number(v));

export const fmtNumber = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === "" ? "-" : number.format(Number(v));

/** Las columnas DATE de MySQL llegan como medianoche UTC: se formatean en UTC para no restar un día en Argentina. */
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const dateOnly = /T00:00:00(\.000)?Z$/.test(iso);
  return new Date(iso).toLocaleDateString("es-AR", dateOnly ? { timeZone: "UTC" } : undefined);
};

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";

export const fullName = (u?: { nombre: string; apellido: string } | null) =>
  u ? `${u.nombre} ${u.apellido}` : "-";

/** Convierte `YYYY-MM-DD` de un `<input type="date">` a ISO (medianoche local). */
export const dateInputToIso = (value: string) => (value ? new Date(`${value}T00:00:00`).toISOString() : undefined);

/** Convierte un ISO a `YYYY-MM-DD` para un `<input type="date">`. */
export const isoToDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
