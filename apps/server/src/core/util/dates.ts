/**
 * Utilidades para columnas DATE (fecha civil sin hora).
 * Prisma guarda `@db.Date` como medianoche UTC: para no desfasar un día en Argentina,
 * construimos siempre la fecha civil local y la convertimos a medianoche UTC.
 */

/** Hoy en fecha civil local (Argentina, UTC-3) como medianoche UTC. */
export function todayCivil(): Date {
  const now = new Date();
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000); // UTC-3 fijo (sin DST en Argentina)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Normaliza cualquier Date a su fecha civil (descarta la hora) como medianoche UTC. */
export function toCivil(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}
