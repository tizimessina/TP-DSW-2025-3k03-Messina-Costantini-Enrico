import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { getApiErrorMessage } from "../../api";
import { useFeedback } from "../../components/feedback";
import { AnimatedPage } from "../../components/layout/AppShell";
import { Alert, Button, Card, EmptyState, Field, Input, PageHeader, Skeleton, Table, Td, Th } from "../../components/ui";
import { Dialog } from "../../components/ui/Dialog";
import { useDebounce } from "../../lib/useDebounce";
import { useQuery } from "../../lib/useQuery";

export type FieldDef = { name: string; label: string; type?: "text" | "number"; required?: boolean; hint?: string; step?: string };
type Row = Record<string, unknown> & { id: number };

type Props<T> = {
  title: string;
  subtitle?: string;
  /** Artículo + sustantivo en singular: ["la", "categoría"] */
  noun: [string, string];
  fields: FieldDef[];
  columns: { key: string; label: string; render?: (row: T) => ReactNode }[];
  list: (q?: string) => Promise<T[]>;
  toRow: (item: T) => Row;
  create: (data: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, data: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  icon?: ReactNode;
};

/** CRUD simple genérico para catálogos administrados por ADMIN. */
export default function CatalogoSimplePage<T>({ title, subtitle, noun, fields, columns, list, toRow, create, update, remove, icon }: Props<T>) {
  const { toast, confirm } = useFeedback();
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const rows = useQuery(() => list(dq || undefined), [dq]);
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [art, word] = noun;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const open = (row: Row | null) => {
    setEditing(row);
    setError(null);
    setForm(Object.fromEntries(fields.map((f) => [f.name, row ? String(row[f.name] ?? "") : ""])));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const data = Object.fromEntries(fields.map((f) => [f.name, f.type === "number" ? Number(form[f.name]) : form[f.name].trim() || null]));
    try {
      if (editing) await update(editing.id, data);
      else await create(data);
      toast.success(`${cap(word)} ${editing ? "actualizad" : "cread"}${art === "la" ? "a" : "o"}`);
      setEditing(undefined);
      rows.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const del = async (row: Row) => {
    if (!(await confirm({ title: `Eliminar ${word}`, message: `¿Eliminar "${String(row.nombre)}"?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await remove(row.id);
      toast.success(`${cap(word)} eliminad${art === "la" ? "a" : "o"}`);
      rows.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AnimatedPage>
      <PageHeader eyebrow="Administración" title={title} subtitle={subtitle} actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => open(null)}>Nuev{art === "la" ? "a" : "o"} {word}</Button>} />
      <Card padded={false}>
        <div className="p-4"><Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" /></div>
        {rows.error && <div className="px-4 pb-4"><Alert kind="error">{rows.error}</Alert></div>}
        {rows.loading ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !rows.data?.length ? (
          <div className="p-4"><EmptyState icon={icon} title="Sin resultados" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr>{columns.map((c) => <Th key={c.key}>{c.label}</Th>)}<Th className="text-right">Acciones</Th></tr></thead>
              <tbody>
                {rows.data.map((item) => {
                  const row = toRow(item);
                  return (
                    <tr key={row.id} className="transition hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      {columns.map((c) => <Td key={c.key}>{c.render ? c.render(item) : String(row[c.key] ?? "—")}</Td>)}
                      <Td className="text-right">
                        <span className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => open(row)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => del(row)} aria-label="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing !== undefined && (
        <Dialog open onClose={() => setEditing(undefined)} title={editing ? `Editar ${word}` : `Nuev${art === "la" ? "a" : "o"} ${word}`} size="sm" footer={<><Button variant="ghost" onClick={() => setEditing(undefined)}>Cancelar</Button><Button form="catalogo-form" type="submit" loading={saving}>Guardar</Button></>}>
          <form id="catalogo-form" onSubmit={submit} className="space-y-4">
            {fields.map((f) => (
              <Field key={f.name} label={f.label} required={f.required} hint={f.hint}>
                <Input type={f.type ?? "text"} step={f.step} value={form[f.name] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))} required={f.required} />
              </Field>
            ))}
            {error && <Alert kind="error">{error}</Alert>}
          </form>
        </Dialog>
      )}
    </AnimatedPage>
  );
}

// Re-export para que Table sea usada por otras páginas admin
export { Table };
