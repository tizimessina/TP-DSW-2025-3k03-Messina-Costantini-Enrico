const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const moneyExact = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

type Num = number | string | null | undefined;
const isEmpty = (v: Num) => v === null || v === undefined || v === "";

/** Importes: sin decimales en listados (`$ 45.000`). */
export const fmtMoney = (v: Num) => (isEmpty(v) ? "-" : money.format(Number(v)));
/** Importes exactos con centavos (`$ 45.000,00`). */
export const fmtMoneyExact = (v: Num) => (isEmpty(v) ? "-" : moneyExact.format(Number(v)));
export const fmtNumber = (v: Num) => (isEmpty(v) ? "-" : number.format(Number(v)));
export const fmtHa = (v: Num) => (isEmpty(v) ? "-" : `${number.format(Number(v))} ha`);

/** Las columnas DATE llegan como medianoche UTC: se formatean en UTC para no restar un día en Argentina. */
export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const dateOnly = /T00:00:00(\.000)?Z$/.test(iso);
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", ...(dateOnly ? { timeZone: "UTC" } : {}) });
};

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const fmtRelative = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const diff = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
  if (Math.abs(diff) < 1) return "hoy";
  if (Math.abs(diff) < 30) return rtf.format(Math.round(diff), "day");
  return fmtDate(iso);
};

export const fullName = (u?: { nombre: string; apellido: string } | null) => (u ? `${u.nombre} ${u.apellido}` : "-");
export const initials = (u?: { nombre: string; apellido: string } | null) => (u ? `${u.nombre[0] ?? ""}${u.apellido[0] ?? ""}`.toUpperCase() : "?");

export const ubicacion = (l?: { nombre: string; provincia?: { nombre: string } | null } | null) =>
  l ? `${l.nombre}${l.provincia ? `, ${l.provincia.nombre}` : ""}` : "Sin localidad";

/** `YYYY-MM-DD` de un input date → ISO a medianoche UTC (como guarda la API las fechas civiles). */
export const dateInputToIso = (value: string) => (value ? `${value}T00:00:00.000Z` : undefined);
export const isoToDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
export const todayInput = () => new Date().toISOString().slice(0, 10);

export const pluralize = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
