import { useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriasServicio } from "../api/categoriasServicio";
import { getServicios, precioActual } from "../api/servicios";
import { Alert, EmptyState, Field, Input, PageSpinner, PageTitle, Select } from "../components/ui";
import { fmtMoney, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Listado público de servicios con filtro por categoría y texto. */
export default function ServiciosPage() {
  const [q, setQ] = useState("");
  const [idCategoria, setIdCategoria] = useState("");

  const categorias = useQuery(() => getCategoriasServicio(), []);
  const servicios = useQuery(
    () => getServicios({ q: q || undefined, id_categoria: idCategoria ? Number(idCategoria) : undefined }),
    [q, idCategoria],
  );

  return (
    <div>
      <PageTitle title="Servicios" subtitle="Explorá los servicios publicados por los prestamistas." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Categoría">
          <Select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.data?.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Buscar">
          <Input placeholder="Nombre o descripción" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
      </div>

      {servicios.error && <Alert kind="error">{servicios.error}</Alert>}
      {servicios.loading ? (
        <PageSpinner />
      ) : !servicios.data?.length ? (
        <EmptyState>No hay servicios para los filtros elegidos.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.data.map((s) => {
            const precio = precioActual(s);
            return (
              <li key={s.id_servicio}>
                <Link
                  to={`/servicios/${s.id_servicio}`}
                  className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                    {s.categoria?.nombre ?? "Sin categoría"}
                  </span>
                  <span className="mt-1 text-lg font-semibold text-white">{s.nombre}</span>
                  {s.descripcion && <span className="mt-1 line-clamp-2 text-sm text-slate-400">{s.descripcion}</span>}
                  <span className="mt-auto pt-4 text-sm text-slate-300">
                    {fullName(s.prestamista_profile?.users)}
                    {s.prestamista_profile?.users.localidad && (
                      <span className="text-slate-500"> · {s.prestamista_profile.users.localidad.nombre}</span>
                    )}
                  </span>
                  <span className="mt-1 text-base font-bold text-emerald-200">
                    {precio ? `${fmtMoney(precio.valor)} / ha` : "Sin precio publicado"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
