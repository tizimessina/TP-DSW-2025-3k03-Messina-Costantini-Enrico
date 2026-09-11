import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { campos as camposApi, getApiErrorMessage, localidades as localidadesApi, provincias as provinciasApi } from "../api";
import type { Campo } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { AnimatedPage } from "../components/layout/AppShell";
import { MapView } from "../components/MapView";
import { Alert, Button, EmptyState, Field, Input, PageHeader, Select, SkeletonCard } from "../components/ui";
import { Dialog } from "../components/ui/Dialog";
import { fmtHa, pluralize, ubicacion } from "../lib/format";
import { useQuery } from "../lib/useQuery";

type Form = { nombre: string; id_provincia: string; id_localidad: string; hectareas: string; lat: string; lng: string };
const empty: Form = { nombre: "", id_provincia: "", id_localidad: "", hectareas: "", lat: "", lng: "" };

/** Formulario de alta/edición de campo con selector de ubicación en el mapa. */
export function CampoFormDialog({ open, onClose, campo, onSaved }: { open: boolean; onClose: () => void; campo?: Campo | null; onSaved: () => void }) {
  const { toast } = useFeedback();
  const provincias = useQuery(() => provinciasApi.list(), []);
  const [form, setForm] = useState<Form>(() =>
    campo
      ? { nombre: campo.nombre, id_provincia: String(campo.localidad?.id_provincia ?? ""), id_localidad: String(campo.id_localidad), hectareas: String(campo.hectareas), lat: campo.latitud ? String(campo.latitud) : "", lng: campo.longitud ? String(campo.longitud) : "" }
      : empty,
  );
  const localidades = useQuery(() => (form.id_provincia ? localidadesApi.list({ id_provincia: Number(form.id_provincia) }) : Promise.resolve([])), [form.id_provincia]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value, ...(k === "id_provincia" ? { id_localidad: "" } : {}) }));
  const point = form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = { nombre: form.nombre.trim(), id_localidad: Number(form.id_localidad), hectareas: Number(form.hectareas), latitud: point?.lat ?? null, longitud: point?.lng ?? null };
    try {
      if (campo) await camposApi.update(campo.id_campo, payload);
      else await camposApi.create(payload);
      toast.success(campo ? "Campo actualizado" : "Campo registrado");
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={campo ? `Editar ${campo.nombre}` : "Nuevo campo"} size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button form="campo-form" type="submit" loading={saving}>{campo ? "Guardar" : "Registrar campo"}</Button></>}>
      <form id="campo-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del campo o lote" required className="sm:col-span-2"><Input value={form.nombre} onChange={set("nombre")} required placeholder="Ej: La Esperanza – Lote 1" /></Field>
          <Field label="Provincia" required>
            <Select value={form.id_provincia} onChange={set("id_provincia")} required>
              <option value="">Elegir…</option>
              {provincias.data?.map((p) => <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Localidad" required>
            <Select value={form.id_localidad} onChange={set("id_localidad")} required disabled={!form.id_provincia}>
              <option value="">Elegir…</option>
              {localidades.data?.map((l) => <option key={l.id_localidad} value={l.id_localidad}>{l.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Hectáreas" required><Input type="number" min="0.01" step="0.01" value={form.hectareas} onChange={set("hectareas")} required /></Field>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300">Ubicación (opcional) <span className="font-normal text-stone-500">· hacé click en el mapa para marcar el campo</span></p>
          <MapView point={point} onPick={(p) => setForm((f) => ({ ...f, lat: String(p.lat), lng: String(p.lng) }))} height="h-64" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input type="number" step="0.000001" placeholder="Latitud" value={form.lat} onChange={set("lat")} />
            <Input type="number" step="0.000001" placeholder="Longitud" value={form.lng} onChange={set("lng")} />
          </div>
        </div>
        {error && <Alert kind="error">{error}</Alert>}
      </form>
    </Dialog>
  );
}

export default function CamposPage() {
  const { isAdmin } = useAuth();
  const { toast, confirm } = useFeedback();
  const campos = useQuery(() => camposApi.list(), []);
  const [editing, setEditing] = useState<Campo | null | undefined>(undefined); // undefined = cerrado, null = nuevo

  const remove = async (c: Campo) => {
    if (!(await confirm({ title: "Eliminar campo", message: `¿Eliminar "${c.nombre}"? Solo es posible si no tiene solicitudes.`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await camposApi.remove(c.id_campo);
      toast.success("Campo eliminado");
      campos.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <AnimatedPage>
      <PageHeader title={isAdmin ? "Campos" : "Mis campos"} subtitle="Registrá tus lotes con ubicación para que los contratistas cercanos te encuentren." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Nuevo campo</Button>} />

      {campos.error && <Alert kind="error" className="mb-4">{campos.error}</Alert>}
      {campos.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !campos.data?.length ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title="Todavía no registraste campos" action={<Button size="sm" onClick={() => setEditing(null)}>Registrar el primero</Button>}>Necesitás al menos un campo para solicitar servicios.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campos.data.map((c) => (
            <div key={c.id_campo} className="surface surface-hover flex flex-col overflow-hidden">
              <Link to={`/campos/${c.id_campo}`} className="block">
                {c.latitud && c.longitud ? (
                  <MapView point={{ lat: Number(c.latitud), lng: Number(c.longitud) }} height="h-36" className="rounded-none border-0" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-sand-200 text-stone-400 dark:bg-stone-800"><MapPin className="h-8 w-8" /></div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link to={`/campos/${c.id_campo}`} className="font-bold hover:underline">{c.nombre}</Link>
                <p className="text-sm text-stone-500">{ubicacion(c.localidad)}</p>
                <p className="mt-1 text-lg font-extrabold text-brand-700 dark:text-brand-300">{fmtHa(c.hectareas)}</p>
                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-stone-500">
                  <span>{pluralize(c._count?.solicitud ?? 0, "solicitud", "solicitudes")}</span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c)} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && <CampoFormDialog key={editing?.id_campo ?? "new"} open onClose={() => setEditing(undefined)} campo={editing} onSaved={campos.reload} />}
    </AnimatedPage>
  );
}
