/**
 * Reconstruye el historial de las solicitudes anteriores al registro de eventos.
 *
 * Por cada solicitud sin eventos escribe el alta y, si ya no está pendiente, la
 * transición hasta su estado actual. Las fechas salen de `fecha_solicitud` y
 * `updated_at`, y no se sabe quién hizo el cambio, así que quedan marcadas con
 * `actor_rol = SISTEMA` para poder distinguirlas en la interfaz.
 *
 * Es idempotente: solo toca solicitudes que no tienen ningún evento.
 *
 * Uso: pnpm --filter server db:backfill-eventos
 */
import "../src/core/config/env.js";
import { prisma, type Prisma } from "@repo/db";

const NOTA = "Registro reconstruido: es anterior al historial de eventos";

async function main() {
  const sinHistorial = await prisma.solicitud.findMany({
    where: { solicitud_evento: { none: {} } },
    select: { id_solicitud: true, estado: true, fecha_solicitud: true, updated_at: true, motivo: true },
    orderBy: { id_solicitud: "asc" },
  });

  if (sinHistorial.length === 0) {
    console.log("No hay solicitudes sin historial. Nada que hacer.");
    return;
  }

  const filas: Prisma.solicitud_eventoCreateManyInput[] = [];

  for (const s of sinHistorial) {
    filas.push({
      id_solicitud: s.id_solicitud,
      tipo: "creada",
      estado_hasta: "pendiente",
      id_actor: null,
      actor_rol: "SISTEMA",
      actor_nombre: null,
      detalle: NOTA,
      created_at: s.fecha_solicitud,
    });

    if (s.estado !== "pendiente") {
      filas.push({
        id_solicitud: s.id_solicitud,
        tipo: "transicion",
        estado_desde: "pendiente",
        estado_hasta: s.estado,
        id_actor: null,
        actor_rol: "SISTEMA",
        actor_nombre: null,
        detalle: s.motivo ?? NOTA,
        // `updated_at` nunca puede quedar antes del alta.
        created_at: s.updated_at > s.fecha_solicitud ? s.updated_at : s.fecha_solicitud,
      });
    }
  }

  await prisma.solicitud_evento.createMany({ data: filas });
  console.log(`Historial reconstruido: ${filas.length} eventos en ${sinHistorial.length} solicitudes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
