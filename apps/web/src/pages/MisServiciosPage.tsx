import { BadgeDollarSign, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { categorias as categoriasApi, getApiErrorMessage, precios as preciosApi, servicios as serviciosApi } from "../api";
import type { Precio, Servicio } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { AnimatedPage } from "../components/layout/AppShell";
import { Alert, Badge, Button, EmptyState, Field, Input, PageHeader, Select, SkeletonCard, Textarea } from "../components/ui";
import { Dialog } from "../components/ui/Dialog";
import { cn } from "../lib/cn";
import { fmtDate, fmtMoney, fmtMoneyExact, pluralize, todayInput } from "../lib/format";
import { useQuery } from "../lib/useQuery";

type Form = { nombre: string; descripcion: string; id_categoria: string; precio_inicial: string };

function ServicioFormDialog({ open, onClose, servicio, onSaved }: { open: boolean; onClose: () => void; servicio?: Servicio | null; onSaved: () => void }) {
  const { toast } = useFeedback();
  const categorias = useQuery(() => categoriasApi.list(), []);
  const [form, setForm] = useState<Form>({ nombre: servicio?.nombre ?? "", descripcion: servicio?.descripcion ?? "", id_categoria: servicio ? String(servicio.id_categoria) : "", precio_inicial: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (servicio) await serviciosApi.update(servicio.id_servicio, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, id_categoria: Number(form.id_categoria) });
      else await serviciosApi.create({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null, id_categoria: Number(form.id_categoria), precio_inicial: form.precio_inicial ? Number(form.precio_inicial) : undefined });
      toast.success(servicio ? "Servicio actualizado" : "Servicio publicado");
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={servicio ? "Editar servicio" : "Publicar un servicio"} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button form="servicio-form" type="submit" loading={saving}>{servicio ? "Guardar" : "Publicar"}</Button></>}>
      <form id="servicio-form" onSubmit={submit} className="space-y-4">
        <Field label="Nombre" required><Input value={form.nombre} onChange={set("nombre")} required minLength={2} placeholder="Ej: Siembra directa de soja" /></Field>
        <Field label="Categoría" required>
          <Select value={form.id_categoria} onChange={set("id_categoria")} required>
            <option value="">Elegir…</option>
            {categorias.data?.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Descripción" hint="Equipos, qué incluye, condiciones."><Textarea value={form.descripcion} onChange={set("descripcion")} maxLength={500} /></Field>
        {!servicio && <Field label="Precio por hectárea" hint="Podés cargarlo o cambiarlo después. Sin precio, el servicio no se puede solicitar."><Input type="number" min="1" step="0.01" value={form.precio_inicial} onChange={set("precio_inicial")} placeholder="45000" /></Field>}
        {error && <Alert kind="error">{error}</Alert>}
      </form>
    </Dialog>
  );
}

function PreciosDialog({ servicio, onClose, onChanged }: { servicio: Servicio; onClose: () => void; onChanged: () => void }) {
  const { toast, confirm } = useFeedback();
  const precios = useQuery(() => preciosApi.listByServicio(servicio.id_servicio), [servicio.id_servicio]);
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState(todayInput());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hoy = todayInput();

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await preciosApi.create(servicio.id_servicio, Number(valor), fecha);
      toast.success("Precio cargado");
      setValor("");
      precios.reload();
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (p: Precio) => {
    if (!(await confirm({ title: "Eliminar precio", message: `¿Eliminar el precio desde ${fmtDate(p.fecha_desde)}?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await preciosApi.remove(p.id_precio);
      toast.success("Precio eliminado");
      precios.reload();
      onChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const vigenteId = precios.data?.find((p) => p.fecha_desde.slice(0, 10) <= hoy)?.id_precio;

  return (
    <Dialog open onClose={onClose} title={`Precios · ${servicio.nombre}`} description="El vigente es el de fecha más reciente no futura. Cargá uno nuevo para actualizar sin perder el historial.">
      <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Precio por hectárea" required><Input type="number" min="1" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required /></Field>
        <Field label="Vigente desde" required><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></Field>
        <Button type="submit" loading={saving} icon={<Plus className="h-4 w-4" />}>Cargar</Button>
      </form>
      {error && <Alert kind="error" className="mt-3">{error}</Alert>}
      <ul className="mt-5 divide-y divide-stone-100 dark:divide-stone-800">
        {precios.data?.map((p) => (
          <li key={p.id_precio} className={cn("flex items-center justify-between gap-3 py-2.5", p.id_precio === vigenteId && "font-semibold")}>
            <span className="text-sm">{fmtDate(p.fecha_desde)} {p.id_precio === vigenteId && <Badge tone="brand" className="ml-2">vigente</Badge>}{p.fecha_desde.slice(0, 10) > hoy && <Badge tone="amber" className="ml-2">programado</Badge>}</span>
            <span className="flex items-center gap-2 text-sm">{fmtMoneyExact(p.valor)}<Button variant="ghost" size="sm" onClick={() => remove(p)} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button></span>
          </li>
        ))}
        {precios.data?.length === 0 && <li className="py-3 text-sm text-stone-500">Sin precios cargados.</li>}
      </ul>
    </Dialog>
  );
}

/** CUU "Publicar un servicio": el contratista gestiona sus servicios y precios. */
export default function MisServiciosPage() {
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const lista = useQuery(() => serviciosApi.list({ id_contratista: user!.id_user, incluir_inactivos: true, pageSize: 100 }), [user?.id_user]);
  const [editing, setEditing] = useState<Servicio | null | undefined>(undefined);
  const [precios, setPrecios] = useState<Servicio | null>(null);

  const toggle = async (s: Servicio) => {
    if (s.activo && !(await confirm({ title: "Desactivar servicio", message: "Deja de aparecer en el catálogo; las solicitudes existentes se conservan. Podés reactivarlo cuando quieras." }))) return;
    try {
      await serviciosApi.update(s.id_servicio, { activo: !s.activo });
      toast.success(s.activo ? "Servicio desactivado" : "Servicio reactivado");
      lista.reload();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <AnimatedPage>
      <PageHeader title="Mis servicios" subtitle="Publicá lo que ofrecés, mantené tus precios al día y desactivá lo que no estés haciendo." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Publicar servicio</Button>} />
      {lista.error && <Alert kind="error" className="mb-4">{lista.error}</Alert>}
      {lista.loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !lista.data?.items.length ? (
        <EmptyState icon={<BadgeDollarSign className="h-6 w-6" />} title="Todavía no publicaste servicios" action={<Button size="sm" onClick={() => setEditing(null)}>Publicar el primero</Button>}>Elegí una categoría, describí el trabajo y fijá tu precio por hectárea.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lista.data.items.map((s) => (
            <div key={s.id_servicio} className={cn("surface flex flex-col p-5", !s.activo && "opacity-70")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">{s.categoria?.nombre}</p>
                  <Link to={`/servicios/${s.id_servicio}`} className="block truncate text-lg font-bold hover:underline">{s.nombre}</Link>
                </div>
                {s.activo ? <Badge tone="brand">Activo</Badge> : <Badge>Inactivo</Badge>}
              </div>
              {s.descripcion && <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">{s.descripcion}</p>}
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-extrabold">{s.precio_vigente ? <>{fmtMoney(s.precio_vigente.valor)} <span className="text-xs font-medium text-stone-500">/ ha</span></> : <span className="text-sm font-semibold text-harvest-700">Sin precio vigente</span>}</p>
                <span className="text-xs text-stone-500">{pluralize(s.trabajos_completados ?? 0, "trabajo", "trabajos")}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
                <Button size="sm" variant="secondary" icon={<BadgeDollarSign className="h-4 w-4" />} onClick={() => setPrecios(s)}>Precios</Button>
                <Button size="sm" variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(s)}>Editar</Button>
                <Button size="sm" variant="ghost" icon={s.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} onClick={() => toggle(s)}>{s.activo ? "Desactivar" : "Reactivar"}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing !== undefined && <ServicioFormDialog key={editing?.id_servicio ?? "new"} open onClose={() => setEditing(undefined)} servicio={editing} onSaved={lista.reload} />}
      {precios && <PreciosDialog servicio={precios} onClose={() => setPrecios(null)} onChanged={lista.reload} />}
    </AnimatedPage>
  );
}
