/**
 * Utilidades geográficas para la cercanía entre un campo y los contratistas.
 *
 * La distancia se calcula con la fórmula de Haversine sobre una esfera de radio
 * medio terrestre. Es una aproximación: la Tierra es un elipsoide, así que el
 * error es menor al 0,5 %, más que suficiente para decidir a quién llamar. Y es
 * distancia en línea recta, no por ruta: dos puntos separados por un río pueden
 * estar cerca en kilómetros y lejos en camino.
 */
import { z } from "zod";

/** Radio medio terrestre en kilómetros. */
const RADIO_TIERRA_KM = 6371;

export type Punto = { lat: number; lng: number };

const rad = (grados: number) => (grados * Math.PI) / 180;

/** Distancia en kilómetros entre dos puntos, por Haversine. */
export function haversineKm(a: Punto, b: Punto): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Convierte un par de coordenadas de Prisma (Decimal, o null) en un punto.
 * Único lugar donde se hace esta conversión: si falta alguna de las dos, o si
 * alguna no es un número válido, devuelve null en vez de un NaN que contaminaría
 * cualquier orden posterior.
 */
export function puntoDe(latitud: unknown, longitud: unknown): Punto | null {
  if (latitud === null || latitud === undefined || longitud === null || longitud === undefined) return null;
  const lat = Number(latitud);
  const lng = Number(longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Redondea a un decimal, que es toda la precisión que tiene sentido mostrar. */
export function redondearKm(km: number): number {
  return Math.round(km * 10) / 10;
}

/**
 * Coordenadas opcionales para los schemas Zod. Vive acá porque la usan campo,
 * localidad y el perfil del contratista, y es el mismo lugar donde está el resto
 * de lo geográfico.
 */
export const CoordenadasSchema = {
  latitud: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitud: z.coerce.number().min(-180).max(180).optional().nullable(),
};

/** Ambas coordenadas se cargan juntas o ninguna. */
export const coordenadasCoherentes = (c: { latitud?: number | null; longitud?: number | null }) =>
  (c.latitud === undefined && c.longitud === undefined) || (c.latitud == null) === (c.longitud == null);
