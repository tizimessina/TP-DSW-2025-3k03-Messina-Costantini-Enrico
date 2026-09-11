import { motion } from "framer-motion";
import { MapPin, SearchX, Tractor } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { campos as camposApi, categorias as categoriasApi, contratistas as contratistasApi, localidades as localidadesApi, provincias as provinciasApi } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AnimatedPage } from "../components/layout/AppShell";
import { Alert, Avatar, EmptyState, Field, Input, PageHeader, Pagination, Select, SkeletonCard, Stars } from "../components/ui";
import { fmtMoney, fullName, pluralize, ubicacion } from "../lib/format";
import { useDebounce } from "../lib/useDebounce";
import { useQuery } from "../lib/useQuery";

/** Listado de contratistas por cercanía (localidad del campo elegido) o por provincia/localidad. */
export default function ContratistasPage() {
  const { isProductor } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const campo = params.get("campo") ?? "";
  const provincia = params.get("provincia") ?? "";
  const localidad = params.get("localidad") ?? "";
  const categoria = params.get("categoria") ?? "";
  const page = Number(params.get("page") ?? 1);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== "page") next.delete("page");
    if (k === "campo" && v) { next.delete("provincia"); next.delete("localidad"); }
    if ((k === "provincia" || k === "localidad") && v) next.delete("campo");
    if (k === "provincia") next.delete("localidad");
    setParams(next, { replace: true });
  };

  const campos = useQuery(() => (isProductor ? camposApi.list() : Promise.resolve([])), [isProductor]);
  const provincias = useQuery(() => provinciasApi.list(), []);
  const localidades = useQuery(() => (provincia ? localidadesApi.list({ id_provincia: Number(provincia) }) : Promise.resolve([])), [provincia]);
  const categorias = useQuery(() => categoriasApi.list(), []);

  // Por defecto, un productor busca cerca de su primer campo
  useEffect(() => {
    if (isProductor && !campo && !provincia && !localidad && campos.data?.length) setParam("campo", String(campos.data[0].id_campo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campos.data]);

  const lista = useQuery(
    () => contratistasApi.list({ q: dq || undefined, id_campo: campo ? Number(campo) : undefined, id_provincia: provincia ? Number(provincia) : undefined, id_localidad: localidad ? Number(localidad) : undefined, id_categoria: categoria ? Number(categoria) : undefined, page, pageSize: 12 }),
    [dq, campo, provincia, localidad, categoria, page],
  );

  return (
    <AnimatedPage className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader eyebrow="Contratistas" title="Encontrá quién haga el trabajo" subtitle="Filtrá por cercanía a tu campo o por zona, mirá sus servicios y las valoraciones de otros productores." />

      <div className="surface mb-6 grid gap-3 p-4 md:grid-cols-4">
        {isProductor && campos.data && campos.data.length > 0 && (
          <Field label="Cerca de mi campo">
            <Select value={campo} onChange={(e) => setParam("campo", e.target.value)}>
              <option value="">— Sin usar —</option>
              {campos.data.map((c) => <option key={c.id_campo} value={c.id_campo}>{c.nombre} ({c.localidad?.nombre})</option>)}
            </Select>
          </Field>
        )}
        <Field label="Provincia">
          <Select value={provincia} onChange={(e) => setParam("provincia", e.target.value)}>
            <option value="">Todas</option>
            {provincias.data?.map((p) => <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Localidad">
          <Select value={localidad} onChange={(e) => setParam("localidad", e.target.value)} disabled={!provincia}>
            <option value="">Todas</option>
            {localidades.data?.map((l) => <option key={l.id_localidad} value={l.id_localidad}>{l.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Categoría">
          <Select value={categoria} onChange={(e) => setParam("categoria", e.target.value)}>
            <option value="">Todas</option>
            {categorias.data?.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Nombre" className="md:col-span-4"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o apellido" /></Field>
      </div>

      {lista.data?.alcance === "provincia" && campo && <Alert kind="info" className="mb-4">No hay contratistas en la localidad de tu campo: te mostramos los de la misma provincia.</Alert>}
      {lista.error && <Alert kind="error" className="mb-4">{lista.error}</Alert>}

      {lista.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !lista.data?.items.length ? (
        <EmptyState icon={<SearchX className="h-6 w-6" />} title="No hay contratistas para esos filtros">Probá ampliando la zona o quitando la categoría.</EmptyState>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lista.data.items.map((c, i) => (
              <motion.div key={c.id_user} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <Link to={`/contratistas/${c.id_user}`} className="surface surface-hover flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={fullName(c.users)} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">{fullName(c.users)}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-stone-500"><MapPin className="h-3 w-3" />{ubicacion(c.users.localidad)}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">{c.descripcion || "Sin descripción"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.servicio.slice(0, 3).map((s) => (
                      <span key={s.id_servicio} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100">
                        {s.categoria?.nombre}{s.precio?.[0] ? ` · ${fmtMoney(s.precio[0].valor)}/ha` : ""}
                      </span>
                    ))}
                    {c.servicio.length > 3 && <span className="text-xs text-stone-500">+{c.servicio.length - 3}</span>}
                    {c.servicio.length === 0 && <span className="flex items-center gap-1 text-xs text-stone-400"><Tractor className="h-3 w-3" />Sin servicios activos</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <Stars value={c.valoracion.promedio} count={c.valoracion.cantidad} />
                    <span className="text-xs text-stone-500">{pluralize(c.trabajos_completados, "trabajo", "trabajos")}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <Pagination page={lista.data.page} totalPages={lista.data.totalPages} total={lista.data.total} onChange={(p) => setParam("page", String(p))} />
        </>
      )}
    </AnimatedPage>
  );
}
