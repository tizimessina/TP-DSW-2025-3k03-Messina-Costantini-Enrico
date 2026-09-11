import { ClipboardList, Sprout } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { solicitudes as solicitudesApi } from "../api";
import { ESTADOS, ESTADO_LABELS, type SolicitudEstado } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { AnimatedPage } from "../components/layout/AppShell";
import { Alert, EmptyState, EstadoBadge, LinkButton, PageHeader, Pagination, Skeleton, Stars } from "../components/ui";
import { cn } from "../lib/cn";
import { fmtDate, fmtHa, fmtMoney, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Historial de solicitudes con filtro por estado. */
export default function SolicitudesPage() {
  const { isProductor, isContratista, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const estado = (params.get("estado") ?? "") as SolicitudEstado | "";
  const page = Number(params.get("page") ?? 1);
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const lista = useQuery(() => solicitudesApi.list({ estado: estado || undefined, page, pageSize: 10 }), [estado, page]);
  const contraparte = isContratista && !isProductor ? "Productor" : "Contratista";

  return (
    <AnimatedPage>
      <PageHeader
        title={isAdmin && !isProductor && !isContratista ? "Solicitudes" : isContratista ? "Solicitudes recibidas" : "Mis solicitudes"}
        subtitle="Cada solicitud fija el precio del momento y avanza por estados: pendiente, aceptada, completada."
        actions={isProductor ? <LinkButton to="/servicios" icon={<Sprout className="h-4 w-4" />}>Nueva solicitud</LinkButton> : undefined}
      />

      <div className="scrollbar-thin mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["", ...ESTADOS] as const).map((e) => (
          <button key={e} type="button" onClick={() => setParam("estado", e)} className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition", estado === e ? "bg-brand-600 text-white shadow-sm" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700 dark:hover:bg-stone-800")}>
            {e ? ESTADO_LABELS[e] : "Todas"}
          </button>
        ))}
      </div>

      {lista.error && <Alert kind="error" className="mb-4">{lista.error}</Alert>}
      {lista.loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : !lista.data?.items.length ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No hay solicitudes para mostrar">{estado ? "Probá con otro estado." : isProductor ? "Elegí un servicio del catálogo para hacer tu primera solicitud." : "Cuando un productor solicite uno de tus servicios, va a aparecer acá."}</EmptyState>
      ) : (
        <>
          <ul className="space-y-3">
            {lista.data.items.map((s) => (
              <li key={s.id_solicitud}>
                <Link to={`/solicitudes/${s.id_solicitud}`} className="surface surface-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-stone-400">#{s.id_solicitud}</span>
                      <EstadoBadge estado={s.estado} />
                      {s.valoracion && <Stars value={s.valoracion.puntaje} />}
                    </div>
                    <p className="mt-1 truncate text-lg font-bold">{s.servicio?.nombre}</p>
                    <p className="truncate text-sm text-stone-500">
                      {contraparte}: {fullName(isContratista && !isProductor ? s.productor_profile?.users : s.contratista_profile?.users)} · {s.campo?.nombre} ({s.campo?.localidad?.nombre}) · {fmtHa(s.hectareas_trabajadas)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-0.5">
                    <span className="text-lg font-extrabold text-stone-900 dark:text-white">{fmtMoney(s.precio_total)}</span>
                    <span className="text-xs text-stone-500">{s.fecha_inicio ? `inicio ${fmtDate(s.fecha_inicio)}` : `pedida ${fmtDate(s.fecha_solicitud)}`}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={lista.data.page} totalPages={lista.data.totalPages} total={lista.data.total} onChange={(p) => setParam("page", String(p))} />
        </>
      )}
    </AnimatedPage>
  );
}
