import { ArrowLeft, Award, BriefcaseBusiness, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { contratistas as contratistasApi } from "../api";
import { AnimatedPage } from "../components/layout/AppShell";
import { Alert, Avatar, Card, EmptyState, PageSpinner, Stars } from "../components/ui";
import { fmtDate, fmtMoney, fullName, pluralize, ubicacion } from "../lib/format";
import { useQuery } from "../lib/useQuery";

export default function ContratistaDetailPage() {
  const { id } = useParams();
  const q = useQuery(() => contratistasApi.get(Number(id)), [id]);

  if (q.loading) return <PageSpinner />;
  if (q.error || !q.data) return <div className="mx-auto max-w-3xl p-6"><Alert kind="error">{q.error ?? "Contratista no encontrado"}</Alert></div>;
  const c = q.data;

  return (
    <AnimatedPage className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/contratistas" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"><ArrowLeft className="h-4 w-4" /> Contratistas</Link>

      <div className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-600 to-brand-400" />
        <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar name={fullName(c.users)} size="lg" className="ring-4 ring-white dark:ring-stone-900" />
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white">{fullName(c.users)}</h1>
            <p className="flex items-center gap-1.5 text-sm text-stone-500"><MapPin className="h-4 w-4" />{ubicacion(c.users.localidad)}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div><Stars value={c.valoracion.promedio} count={c.valoracion.cantidad} size="md" /></div>
            <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300"><BriefcaseBusiness className="h-4 w-4" />{pluralize(c.trabajos_completados, "trabajo", "trabajos")}</div>
            {c.anios_experiencia != null && <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300"><Award className="h-4 w-4" />{c.anios_experiencia} años</div>}
          </div>
        </div>
        {c.descripcion && <p className="relative mt-5 max-w-3xl text-stone-600 dark:text-stone-300">{c.descripcion}</p>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card title="Servicios que ofrece" subtitle="Precio vigente por hectárea">
          {c.servicio.length === 0 ? (
            <EmptyState title="Todavía no publicó servicios" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.servicio.map((s) => (
                <li key={s.id_servicio}>
                  <Link to={`/servicios/${s.id_servicio}`} className="surface-hover block rounded-xl border border-stone-200 p-4 dark:border-stone-700">
                    <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{s.categoria?.nombre}</p>
                    <p className="mt-1 font-bold">{s.nombre}</p>
                    <p className="mt-2 text-lg font-extrabold">{s.precio?.[0] ? <>{fmtMoney(s.precio[0].valor)} <span className="text-xs font-medium text-stone-500">/ ha</span></> : <span className="text-sm text-stone-500">Sin precio</span>}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Opiniones" subtitle={c.valoracion.cantidad ? `${c.valoracion.cantidad} valoraciones` : "Sin valoraciones todavía"}>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {c.valoraciones?.items.map((v) => (
              <li key={v.id_valoracion} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{fullName(v.solicitud?.productor_profile.users)}</span>
                  <Stars value={v.puntaje} />
                </div>
                <p className="text-xs text-stone-500">{v.solicitud?.servicio.nombre} · {fmtDate(v.fecha)}</p>
                {v.comentario && <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{v.comentario}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AnimatedPage>
  );
}
