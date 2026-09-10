import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../../api/base";
import { useFeedback } from "../../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, Table, Td, Th } from "../../components/ui";
import { useQuery } from "../../lib/useQuery";

type Item = { id: number; nombre: string; descripcion?: string | null };

type Props<T> = {
  title: string;
  subtitle?: string;
  /** Nombre en singular para mensajes: "categoría", "insumo", "provincia" */
  singular: string;
  withDescripcion?: boolean;
  list: (q?: string) => Promise<T[]>;
  toItem: (row: T) => Item;
  create: (data: { nombre: string; descripcion?: string | null }) => Promise<unknown>;
  update: (id: number, data: { nombre: string; descripcion?: string | null }) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
};

/**
 * CRUD simple genérico (nombre + descripción opcional) para catálogos administrados por ADMIN:
 * categorías, insumos y provincias.
 */
export default function CatalogoSimplePage<T>({ title, subtitle, singular, withDescripcion = true, list, toItem, create, update, remove }: Props<T>) {
  const { toast, confirm } = useFeedback();
  const [q, setQ] = useState("");
  const rows = useQuery(() => list(q || undefined), [q]);

  const [editing, setEditing] = useState<Item | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setNombre("");
    setDescripcion("");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    const payload = { nombre: nombre.trim(), ...(withDescripcion ? { descripcion: descripcion.trim() || null } : {}) };
    try {
      if (editing) {
        await update(editing.id, payload);
        toast.success(`${capitalize(singular)} actualizada`);
      } else {
        await create(payload);
        toast.success(`${capitalize(singular)} creada`);
      }
      reset();
      rows.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (item: Item) => {
    if (!(await confirm({ title: `Eliminar ${singular}`, message: `¿Eliminar "${item.nombre}"?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await remove(item.id);
      toast.success(`${capitalize(singular)} eliminada`);
      rows.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const items = rows.data?.map(toItem) ?? [];

  return (
    <div className="space-y-6">
      <PageTitle title={title} subtitle={subtitle} />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title={editing ? `Editar ${singular}` : `Nueva ${singular}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>
            {withDescripcion && (
              <Field label="Descripción (opcional)">
                <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={255} />
              </Field>
            )}
            {error && <Alert kind="error">{error}</Alert>}
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={reset}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card title="Listado">
          <div className="mb-4">
            <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {rows.loading ? (
            <PageSpinner />
          ) : rows.error ? (
            <Alert kind="error">{rows.error}</Alert>
          ) : items.length === 0 ? (
            <EmptyState>Sin resultados.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  {withDescripcion && <Th>Descripción</Th>}
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-800/40">
                    <Td className="font-medium">{it.nombre}</Td>
                    {withDescripcion && <Td className="text-slate-400">{it.descripcion || "-"}</Td>}
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(it); setNombre(it.nombre); setDescripcion(it.descripcion ?? ""); setError(null); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(it)}>
                          Eliminar
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
