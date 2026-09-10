import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { getCategoriasServicio } from "../api/categoriasServicio";
import { createServicio, deleteServicio, getServicios, precioActual, updateServicio, type Servicio } from "../api/servicios";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, Select, Table, Td, Textarea, Th } from "../components/ui";
import { fmtMoney } from "../lib/format";
import { useQuery } from "../lib/useQuery";

type FormState = { nombre: string; descripcion: string; id_categoria: string; precio_inicial: string };
const empty: FormState = { nombre: "", descripcion: "", id_categoria: "", precio_inicial: "" };

/** CUU "Publicar un servicio": el prestamista gestiona sus propios servicios. */
export default function MisServiciosPage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const categorias = useQuery(() => getCategoriasServicio(), []);
  const servicios = useQuery(() => getServicios({ id_prestamista: user!.id_user }), [user?.id_user]);

  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (name: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const startEdit = (s: Servicio) => {
    setEditing(s);
    setForm({ nombre: s.nombre, descripcion: s.descripcion ?? "", id_categoria: String(s.id_categoria), precio_inicial: "" });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setEditing(null);
    setForm(empty);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.id_categoria) return setError("Elegí una categoría.");
    setSaving(true);
    try {
      if (editing) {
        await updateServicio(editing.id_servicio, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          id_categoria: Number(form.id_categoria),
        });
        toast.success("Servicio actualizado");
      } else {
        await createServicio({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          id_categoria: Number(form.id_categoria),
          precio_inicial: form.precio_inicial ? Number(form.precio_inicial) : undefined,
        });
        toast.success("Servicio publicado");
      }
      reset();
      servicios.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Servicio) => {
    const ok = await confirm({ title: "Eliminar servicio", message: `¿Eliminar "${s.nombre}"? Esta acción no se puede deshacer.`, danger: true, confirmLabel: "Eliminar" });
    if (!ok) return;
    try {
      await deleteServicio(s.id_servicio);
      toast.success("Servicio eliminado");
      servicios.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Mis servicios" subtitle="Publicá los servicios que ofrecés y mantené sus precios actualizados." />

      <Card title={editing ? `Editar: ${editing.nombre}` : "Publicar un nuevo servicio"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={set("nombre")} required minLength={2} placeholder="Ej: Siembra directa de soja" />
            </Field>
            <Field label="Categoría">
              <Select value={form.id_categoria} onChange={set("id_categoria")} required>
                <option value="">Seleccionar…</option>
                {categorias.data?.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Descripción (opcional)">
            <Textarea value={form.descripcion} onChange={set("descripcion")} maxLength={255} />
          </Field>
          {!editing && (
            <Field label="Precio inicial por hectárea" hint="Podés cargarlo después desde Precios">
              <Input type="number" min="0" step="0.01" value={form.precio_inicial} onChange={set("precio_inicial")} placeholder="Ej: 45000" />
            </Field>
          )}
          {error && <Alert kind="error">{error}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Publicar servicio"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={reset}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Servicios publicados">
        {servicios.loading ? (
          <PageSpinner />
        ) : servicios.error ? (
          <Alert kind="error">{servicios.error}</Alert>
        ) : !servicios.data?.length ? (
          <EmptyState>Todavía no publicaste ningún servicio.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Servicio</Th>
                <Th>Categoría</Th>
                <Th>Precio actual</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {servicios.data.map((s) => {
                const p = precioActual(s);
                return (
                  <tr key={s.id_servicio} className="hover:bg-slate-800/40">
                    <Td>
                      <Link to={`/servicios/${s.id_servicio}`} className="font-medium text-emerald-200 hover:underline">
                        {s.nombre}
                      </Link>
                      {s.descripcion && <span className="block text-xs text-slate-500">{s.descripcion}</span>}
                    </Td>
                    <Td>{s.categoria?.nombre ?? "-"}</Td>
                    <Td>{p ? `${fmtMoney(p.valor)} / ha` : <span className="text-amber-300">Sin precio</span>}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(s)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(s)}>
                          Eliminar
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
