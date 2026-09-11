/**
 * Aviso a un usuario dentro de la aplicación.
 *
 * Se arma en el service con funciones puras y el repositorio lo escribe en la
 * misma transacción que el cambio que lo origina, de modo que no puede existir
 * un cambio de estado sin su aviso ni un aviso de algo que no ocurrió.
 * `id_solicitud` lo completa el repositorio.
 */
export type NotificacionNueva = {
  id_user: bigint;
  titulo: string;
  cuerpo: string;
};

/** Recorta a lo que entra en la columna, sin cortar a mitad de palabra si se puede. */
export function recortar(texto: string, max = 300): string {
  if (texto.length <= max) return texto;
  const corte = texto.lastIndexOf(" ", max - 1);
  return `${texto.slice(0, corte > max * 0.6 ? corte : max - 1)}…`;
}
