import { Ban, Check, CheckCircle2, Circle, FilePlus2, Star, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Solicitud, SolicitudEstado, SolicitudEvento } from "../api/types";
import { cn } from "../lib/cn";
import { fmtDateTime } from "../lib/format";
import { Avatar, EstadoBadge } from "./ui";

const PASOS: { estado: SolicitudEstado; label: string }[] = [
  { estado: "pendiente", label: "Solicitada" },
  { estado: "aceptada", label: "Aceptada" },
  { estado: "completada", label: "Completada" },
];

/** Resumen de avance en tres pasos. Se calcula del estado actual, no del historial. */
function Pasos({ estado }: { estado: SolicitudEstado }) {
  const terminal = estado === "rechazada" || estado === "cancelada";
  const idx = terminal ? 0 : PASOS.findIndex((p) => p.estado === estado);
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold">
      {PASOS.map((p, i) => {
        const done = !terminal && i <= idx;
        return (
          <li key={p.estado} className="flex items-center gap-2">
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", done ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-500 dark:bg-stone-800")}>
              {done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
            </span>
            <span className={done ? "text-stone-900 dark:text-white" : "text-stone-400"}>{p.label}</span>
            {i < PASOS.length - 1 && <span className={cn("h-px w-8 sm:w-14", !terminal && i < idx ? "bg-brand-500" : "bg-stone-300 dark:bg-stone-700")} />}
          </li>
        );
      })}
      {terminal && (
        <li className="ml-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
            <X className="h-4 w-4" />
          </span>
          <span className="text-red-700 dark:text-red-300">{estado === "rechazada" ? "Rechazada" : "Cancelada"}</span>
        </li>
      )}
    </ol>
  );
}

const ROL_LABEL: Record<SolicitudEvento["actor_rol"], string> = {
  PRODUCTOR: "el productor",
  CONTRATISTA: "el contratista",
  ADMIN: "un administrador",
  SISTEMA: "el sistema",
};

const ACCION: Partial<Record<SolicitudEstado, string>> = {
  pendiente: "Solicitud creada",
  aceptada: "Trabajo aceptado",
  rechazada: "Solicitud rechazada",
  cancelada: "Solicitud cancelada",
  completada: "Trabajo completado",
};

function iconoDe(e: SolicitudEvento): { icon: ReactNode; tono: string } {
  if (e.tipo === "creada") return { icon: <FilePlus2 className="h-4 w-4" />, tono: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200" };
  if (e.tipo === "valoracion") return { icon: <Star className="h-4 w-4" />, tono: "bg-harvest-100 text-harvest-700 dark:bg-harvest-700/25 dark:text-harvest-300" };
  if (e.estado_hasta === "completada") return { icon: <CheckCircle2 className="h-4 w-4" />, tono: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200" };
  if (e.estado_hasta === "rechazada") return { icon: <X className="h-4 w-4" />, tono: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" };
  if (e.estado_hasta === "cancelada") return { icon: <Ban className="h-4 w-4" />, tono: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300" };
  return { icon: <Check className="h-4 w-4" />, tono: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200" };
}

function tituloDe(e: SolicitudEvento): string {
  if (e.tipo === "valoracion") return "Trabajo valorado";
  if (e.tipo === "creada") return ACCION.pendiente!;
  return (e.estado_hasta && ACCION[e.estado_hasta]) ?? "Cambio de estado";
}

function Evento({ e, ultimo }: { e: SolicitudEvento; ultimo: boolean }) {
  const { icon, tono } = iconoDe(e);
  const reconstruido = e.actor_rol === "SISTEMA" && e.id_actor === null;
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!ultimo && <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-stone-200 dark:bg-stone-800" aria-hidden />}
      <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tono)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-bold">{tituloDe(e)}</p>
          {e.estado_hasta && e.tipo === "transicion" && <EstadoBadge estado={e.estado_hasta} />}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-stone-500">
          {e.actor_nombre ? (
            <>
              <Avatar name={e.actor_nombre} size="sm" className="h-4 w-4 text-[9px]" />
              <span className="font-medium text-stone-600 dark:text-stone-300">{e.actor_nombre}</span>
            </>
          ) : (
            <span>Por {ROL_LABEL[e.actor_rol]}</span>
          )}
          <span aria-hidden>·</span>
          <time dateTime={e.created_at}>{fmtDateTime(e.created_at)}</time>
          {reconstruido && <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-stone-800">fecha aproximada</span>}
        </p>
        {e.detalle && <p className="mt-1 text-sm italic text-stone-600 dark:text-stone-400">{e.detalle}</p>}
      </div>
    </li>
  );
}

/**
 * Historial de la solicitud. Si todavía no hay eventos registrados (solicitudes
 * anteriores al historial que no pasaron por el backfill) muestra solo el resumen
 * de pasos, que es el comportamiento anterior.
 */
export function SolicitudTimeline({ s }: { s: Solicitud }) {
  const eventos = s.solicitud_evento ?? [];
  return (
    <div className="space-y-5">
      <Pasos estado={s.estado} />
      {eventos.length > 0 && (
        <div className="border-t border-stone-200 pt-4 dark:border-stone-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Historial</p>
          <ol>
            {eventos.map((e, i) => (
              <Evento key={e.id_evento} e={e} ultimo={i === eventos.length - 1} />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
