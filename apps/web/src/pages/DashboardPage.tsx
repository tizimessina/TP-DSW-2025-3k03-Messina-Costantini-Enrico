import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Clock, MapPin, Sprout, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { auth as authApi, solicitudes as solicitudesApi } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AnimatedPage } from "../components/layout/AppShell";
import { Alert, Card, EmptyState, EstadoBadge, LinkButton, PageHeader, Skeleton, Stat, Stars } from "../components/ui";
import { fmtDate, fmtHa, fmtMoney, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

export default function DashboardPage() {
  const { user, isProductor, isContratista, isAdmin } = useAuth();
  const resumen = useQuery(() => authApi.resumen(), []);
  const recientes = useQuery(() => solicitudesApi.list({ pageSize: 5 }), []);
  const r = resumen.data;
  const s = r?.solicitudes ?? {};
  const n = (k: keyof typeof s) => s[k]?.cantidad ?? 0;

  return (
    <AnimatedPage>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        title={`Hola, ${user?.nombre}`}
        subtitle={isProductor ? "Esto es lo que está pasando con tus campos y solicitudes." : isContratista ? "Estas son tus solicitudes recibidas y próximos trabajos." : "Resumen general de la plataforma."}
        actions={
          isProductor ? <LinkButton to="/servicios" icon={<Sprout className="h-4 w-4" />}>Solicitar un servicio</LinkButton>
          : isContratista ? <LinkButton to="/mis-servicios" icon={<Sprout className="h-4 w-4" />}>Publicar servicio</LinkButton>
          : <LinkButton to="/admin/usuarios" icon={<Users className="h-4 w-4" />}>Usuarios</LinkButton>
        }
      />

      {resumen.error && <Alert kind="error" className="mb-6">{resumen.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resumen.loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="surface p-4"><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-3 h-7 w-1/3" /></div>)
        ) : (
          <>
            <Stat label="Pendientes" value={n("pendiente")} icon={<Clock className="h-5 w-5" />} tone="amber" hint={isContratista ? "esperan tu respuesta" : "esperan respuesta"} />
            <Stat label="En curso" value={n("aceptada")} icon={<CalendarDays className="h-5 w-5" />} tone="sky" hint="aceptadas" />
            <Stat label="Completadas" value={n("completada")} icon={<CheckCircle2 className="h-5 w-5" />} hint={s.completada ? fmtMoney(s.completada.total) : undefined} />
            {isProductor && <Stat label="Mis campos" value={r?.campos ?? 0} icon={<MapPin className="h-5 w-5" />} tone="neutral" />}
            {isContratista && <Stat label="Valoración" value={r?.valoracion?.promedio != null ? r.valoracion.promedio.toFixed(1) : "—"} icon={<Star className="h-5 w-5" />} tone="amber" hint={`${r?.valoracion?.cantidad ?? 0} opiniones · ${r?.servicios ?? 0} servicios activos`} />}
            {isAdmin && !isProductor && !isContratista && <Stat label="Usuarios" value={r?.usuarios ?? 0} icon={<Users className="h-5 w-5" />} tone="neutral" />}
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Últimas solicitudes" actions={<Link to="/solicitudes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">Ver todas <ArrowRight className="h-4 w-4" /></Link>}>
          {recientes.loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !recientes.data?.items.length ? (
            <EmptyState icon={<ClipboardList className="h-6 w-6" />} title={isProductor ? "Todavía no solicitaste servicios" : "Todavía no recibiste solicitudes"} action={isProductor ? <LinkButton to="/servicios" size="sm">Explorar servicios</LinkButton> : undefined} />
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {recientes.data.items.map((x) => (
                <li key={x.id_solicitud}>
                  <Link to={`/solicitudes/${x.id_solicitud}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-stone-100 dark:hover:bg-stone-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{x.servicio?.nombre}</p>
                      <p className="truncate text-xs text-stone-500">{isContratista ? fullName(x.productor_profile?.users) : fullName(x.contratista_profile?.users)} · {x.campo?.nombre} · {fmtHa(x.hectareas_trabajadas)}</p>
                    </div>
                    <span className="hidden text-sm font-semibold sm:block">{fmtMoney(x.precio_total)}</span>
                    <EstadoBadge estado={x.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Próximos trabajos" subtitle="Solicitudes aceptadas por fecha de inicio">
            {r?.proximas?.length ? (
              <ul className="space-y-2">
                {r.proximas.map((p) => (
                  <li key={p.id_solicitud}>
                    <Link to={`/solicitudes/${p.id_solicitud}`} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 transition hover:border-brand-300 dark:border-stone-700">
                      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
                        <span className="text-[10px] font-semibold uppercase leading-none">{p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" }) : "—"}</span>
                        <span className="text-base font-extrabold leading-tight">{p.fecha_inicio ? new Date(p.fecha_inicio).getUTCDate() : ""}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{p.servicio.nombre}</span>
                        <span className="block truncate text-xs text-stone-500">{p.campo.nombre} · {fmtHa(p.hectareas_trabajadas)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">{resumen.loading ? "Cargando…" : "Nada agendado por ahora."}</p>
            )}
          </Card>

          {isContratista && r?.valoracion && (
            <Card title="Tu reputación">
              <Stars value={r.valoracion.promedio} count={r.valoracion.cantidad} size="lg" />
              <p className="mt-2 text-sm text-stone-500">Las valoraciones las dejan los productores al completar cada trabajo y se muestran en tu perfil público.</p>
              <Link to={`/contratistas/${user?.id_user}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">Ver mi perfil público</Link>
            </Card>
          )}
          {isProductor && (
            <Card title="Atajos">
              <div className="grid gap-2">
                <Link to="/campos" className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-medium transition hover:border-brand-300 dark:border-stone-700"><MapPin className="h-4 w-4 text-brand-600" />Administrar mis campos</Link>
                <Link to="/contratistas" className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-medium transition hover:border-brand-300 dark:border-stone-700"><Users className="h-4 w-4 text-brand-600" />Contratistas cerca de mis campos</Link>
              </div>
            </Card>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-stone-400">{fmtDate(new Date().toISOString())}</p>
    </AnimatedPage>
  );
}
