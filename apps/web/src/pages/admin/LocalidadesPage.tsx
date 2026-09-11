import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { getApiErrorMessage, localidades as localidadesApi, provincias as provinciasApi } from "../../api";
import type { Localidad } from "../../api/types";
import { useFeedback } from "../../components/feedback";
import { AnimatedPage } from "../../components/layout/AppShell";
import { Alert, Button, Card, EmptyState, Field, Input, PageHeader, Select, Skeleton, Td, Th } from "../../components/ui";
import { Dialog } from "../../components/ui/Dialog";
import { useQuery } from "../../lib/useQuery";

/** CRUD dependiente: Localidad → Provincia. */
export default function LocalidadesPage() {
  const { toast, confirm } = useFeedback();
  const provincias = useQuery(() => provinciasApi.list(), []);
  const [filtro, setFiltro] = useState("");
  const lista = useQuery(() => localidadesApi.list({ id_provincia: filtro ? Number(filtro) : undefined }), [filtro]);
  const [editing, setEditing] = useState<Localidad | null | undefined>(undefined);
  const [form, setForm] = useState({ id_provincia: "", nombre: "", codigo_postal: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (l: Localidad | null) => {
    setEditing(l);
    setError(null);
    setForm({ id_provincia: l ? String(l.id_provincia) : filtro, nombre: l?.nombre ?? "", codigo_postal: l?.codigo_postal ?? "" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editing) await localidadesApi.update(editing.id_localidad, { nombre: form.nombre.trim(), codigo_postal: form.codigo_postal.trim() || null });
      else await localidadesApi.create({ id_provincia: Number(form.id_provincia), nombre: form.nombre.trim(), codigo_postal: form.codigo_postal.trim() || null });
      toast.success(editing ? "Localidad actualizada" : "Localidad creada");
      setEditing(undefined);
      lista.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const del = async (l: Localidad) => {
    if (!(await confirm({ title: "Eliminar localidad", message: `¿Eliminar "${l.nombre}"? Solo es posible si no la usan usuarios ni campos.`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await localidadesApi.remove(l.id_localidad);
      toast.success("Localidad eliminada");
      lista.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AnimatedPage>
      <PageHeader eyebrow="Administración" title="Localidades" subtitle="Cada localidad pertenece a una provincia; la provincia no se cambia una vez creada." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => open(null)}>Nueva localidad</Button>} />
      <Card padded={false}>
        <div className="p-4">
          <Select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="max-w-xs">
            <option value="">Todas las provincias</option>
            {provincias.data?.map((p) => <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>)}
          </Select>
        </div>
        {lista.error && <div className="px-4 pb-4"><Alert kind="error">{lista.error}</Alert></div>}
        {lista.loading ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !lista.data?.length ? (
          <div className="p-4"><EmptyState icon={<MapPin className="h-6 w-6" />} title="Sin localidades" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr><Th>Localidad</Th><Th>Provincia</Th><Th>CP</Th><Th className="text-right">Acciones</Th></tr></thead>
              <tbody>
                {lista.data.map((l) => (
                  <tr key={l.id_localidad} className="transition hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <Td className="font-medium">{l.nombre}</Td>
                    <Td>{l.provincia?.nombre}</Td>
                    <Td>{l.codigo_postal || "—"}</Td>
                    <Td className="text-right"><span className="inline-flex gap-1"><Button variant="ghost" size="sm" onClick={() => open(l)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => del(l)} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button></span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing !== undefined && (
        <Dialog open onClose={() => setEditing(undefined)} title={editing ? "Editar localidad" : "Nueva localidad"} size="sm" footer={<><Button variant="ghost" onClick={() => setEditing(undefined)}>Cancelar</Button><Button form="loc-form" type="submit" loading={saving}>Guardar</Button></>}>
          <form id="loc-form" onSubmit={submit} className="space-y-4">
            <Field label="Provincia" required>
              <Select value={form.id_provincia} onChange={(e) => setForm((p) => ({ ...p, id_provincia: e.target.value }))} required disabled={!!editing}>
                <option value="">Elegir…</option>
                {provincias.data?.map((p) => <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Nombre" required><Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} required /></Field>
            <Field label="Código postal"><Input value={form.codigo_postal} onChange={(e) => setForm((p) => ({ ...p, codigo_postal: e.target.value }))} maxLength={16} /></Field>
            {error && <Alert kind="error">{error}</Alert>}
          </form>
        </Dialog>
      )}
    </AnimatedPage>
  );
}
