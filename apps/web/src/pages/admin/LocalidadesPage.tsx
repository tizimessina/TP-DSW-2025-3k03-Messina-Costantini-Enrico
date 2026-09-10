import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../../api/base";
import { createLocalidad, deleteLocalidad, getLocalidades, updateLocalidad, type Localidad } from "../../api/localidades";
import { getProvincias } from "../../api/provincias";
import { useFeedback } from "../../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, Select, Table, Td, Th } from "../../components/ui";
import { useQuery } from "../../lib/useQuery";

/** CRUD dependiente: Localidad (depende de Provincia). Solo ADMIN. */
export default function LocalidadesPage() {
  const { toast, confirm } = useFeedback();
  const provincias = useQuery(() => getProvincias(), []);
  const [filtroProvincia, setFiltroProvincia] = useState("");
  const localidades = useQuery(() => getLocalidades(undefined, filtroProvincia ? Number(filtroProvincia) : undefined), [filtroProvincia]);

  const [editing, setEditing] = useState<Localidad | null>(null);
  const [idProvincia, setIdProvincia] = useState("");
  const [nombre, setNombre] = useState("");
  const [cp, setCp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setIdProvincia("");
    setNombre("");
    setCp("");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idProvincia) return setError("Elegí una provincia.");
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    const payload = { id_provincia: Number(idProvincia), nombre: nombre.trim(), codigo_postal: cp.trim() || undefined };
    try {
      if (editing) {
        await updateLocalidad(editing.id_localidad, payload);
        toast.success("Localidad actualizada");
      } else {
        await createLocalidad(payload);
        toast.success("Localidad creada");
      }
      reset();
      localidades.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (l: Localidad) => {
    if (!(await confirm({ title: "Eliminar localidad", message: `¿Eliminar "${l.nombre}"?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await deleteLocalidad(l.id_localidad);
      toast.success("Localidad eliminada");
      localidades.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const provinciaNombre = (id: number) => provincias.data?.find((p) => p.id_provincia === id)?.nombre ?? `#${id}`;

  return (
    <div className="space-y-6">
      <PageTitle title="Localidades" subtitle="Cada localidad pertenece a una provincia." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title={editing ? "Editar localidad" : "Nueva localidad"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Provincia">
              <Select value={idProvincia} onChange={(e) => setIdProvincia(e.target.value)} required>
                <option value="">Seleccionar…</option>
                {provincias.data?.map((p) => (
                  <option key={p.id_provincia} value={p.id_provincia}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>
            <Field label="Código postal (opcional)">
              <Input value={cp} onChange={(e) => setCp(e.target.value)} maxLength={16} />
            </Field>
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
          <div className="mb-4 max-w-xs">
            <Field label="Filtrar por provincia">
              <Select value={filtroProvincia} onChange={(e) => setFiltroProvincia(e.target.value)}>
                <option value="">Todas</option>
                {provincias.data?.map((p) => (
                  <option key={p.id_provincia} value={p.id_provincia}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {localidades.loading ? (
            <PageSpinner />
          ) : localidades.error ? (
            <Alert kind="error">{localidades.error}</Alert>
          ) : !localidades.data?.length ? (
            <EmptyState>No hay localidades para la selección actual.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Provincia</Th>
                  <Th>CP</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {localidades.data.map((l) => (
                  <tr key={l.id_localidad} className="hover:bg-slate-800/40">
                    <Td className="font-medium">{l.nombre}</Td>
                    <Td>{l.provincia?.nombre ?? provinciaNombre(l.id_provincia)}</Td>
                    <Td>{l.codigo_postal || "-"}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(l); setIdProvincia(String(l.id_provincia)); setNombre(l.nombre); setCp(l.codigo_postal ?? ""); setError(null); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(l)}>
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
