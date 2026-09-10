import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLocalidades } from "../api/localidades";
import { getPrestamistas } from "../api/prestamistas";
import { getProvincias } from "../api/provincias";
import { useAuth } from "../auth/AuthContext";
import { Alert, EmptyState, Field, Input, PageSpinner, PageTitle, Select } from "../components/ui";
import { fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Listado de prestamistas filtrado por provincia / localidad (cercanía al cliente). */
export default function PrestamistasPage() {
  const { user } = useAuth();
  const [idProvincia, setIdProvincia] = useState("");
  const [idLocalidad, setIdLocalidad] = useState("");
  const [q, setQ] = useState("");

  // Por defecto, filtrar por la provincia del usuario logueado.
  useEffect(() => {
    const prov = user?.localidad?.provincia?.id_provincia;
    if (prov && !idProvincia) setIdProvincia(String(prov));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.localidad?.provincia?.id_provincia]);

  const provincias = useQuery(() => getProvincias(), []);
  const localidades = useQuery(() => getLocalidades(undefined, idProvincia ? Number(idProvincia) : undefined), [idProvincia]);
  const prestamistas = useQuery(
    () =>
      getPrestamistas({
        q: q || undefined,
        id_provincia: idProvincia ? Number(idProvincia) : undefined,
        id_localidad: idLocalidad ? Number(idLocalidad) : undefined,
      }),
    [q, idProvincia, idLocalidad],
  );

  return (
    <div>
      <PageTitle title="Prestamistas" subtitle="Encontrá contratistas cerca de tu campo filtrando por provincia y localidad." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Field label="Provincia">
          <Select value={idProvincia} onChange={(e) => { setIdProvincia(e.target.value); setIdLocalidad(""); }}>
            <option value="">Todas</option>
            {provincias.data?.map((p) => (
              <option key={p.id_provincia} value={p.id_provincia}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Localidad">
          <Select value={idLocalidad} onChange={(e) => setIdLocalidad(e.target.value)} disabled={!idProvincia}>
            <option value="">Todas</option>
            {localidades.data?.map((l) => (
              <option key={l.id_localidad} value={l.id_localidad}>
                {l.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nombre">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre" />
        </Field>
      </div>

      {prestamistas.error && <Alert kind="error">{prestamistas.error}</Alert>}
      {prestamistas.loading ? (
        <PageSpinner />
      ) : !prestamistas.data?.length ? (
        <EmptyState>No hay prestamistas en la zona seleccionada. Probá ampliando el filtro.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prestamistas.data.map((p) => (
            <li key={p.id_user}>
              <Link
                to={`/prestamistas/${p.id_user}`}
                className="block h-full rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
              >
                <span className="block text-lg font-semibold text-white">{fullName(p.users)}</span>
                <span className="block text-sm text-slate-400">
                  {p.users.localidad ? `${p.users.localidad.nombre}, ${p.users.localidad.provincia?.nombre ?? ""}` : "Sin localidad"}
                  {p.users.domicilio ? ` · ${p.users.domicilio}` : ""}
                </span>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.servicio?.length ? (
                    p.servicio.map((s) => (
                      <span key={s.id_servicio} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200 ring-1 ring-emerald-500/30">
                        {s.categoria?.nombre ?? s.nombre}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Sin servicios publicados</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
