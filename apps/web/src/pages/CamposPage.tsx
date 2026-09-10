import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { createCampo, deleteCampo, listCampos, updateCampo, type Campo } from "../api/campo";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, Table, Td, Th } from "../components/ui";
import { fmtNumber, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** CRUD dependiente Campo: el cliente administra sus propios campos. */
export default function CamposPage() {
  const { isAdmin } = useAuth();
  const { toast, confirm } = useFeedback();
  const [q, setQ] = useState("");
  const campos = useQuery(() => listCampos(q ? { q } : undefined), [q]);

  const [editing, setEditing] = useState<Campo | null>(null);
  const [coordenadas, setCoordenadas] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setCoordenadas("");
    setHectareas("");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!coordenadas.trim()) return setError("Ingresá las coordenadas del campo.");
    if (!(Number(hectareas) > 0)) return setError("Las hectáreas deben ser mayores a 0.");
    try {
      if (editing) {
        await updateCampo(editing.id_campo, { coordenadas: coordenadas.trim(), hectareas: Number(hectareas) });
        toast.success("Campo actualizado");
      } else {
        await createCampo({ coordenadas: coordenadas.trim(), hectareas: Number(hectareas) });
        toast.success("Campo registrado");
      }
      reset();
      campos.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (c: Campo) => {
    if (!(await confirm({ title: "Eliminar campo", message: `¿Eliminar el campo en ${c.coordenadas}?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await deleteCampo(c.id_campo);
      toast.success("Campo eliminado");
      campos.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title={isAdmin ? "Campos" : "Mis campos"} subtitle="Registrá tus lotes para poder solicitar servicios sobre ellos." />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card title={editing ? "Editar campo" : "Nuevo campo"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Coordenadas" hint="Latitud, longitud. Ej: -33.89, -60.57">
              <Input value={coordenadas} onChange={(e) => setCoordenadas(e.target.value)} required placeholder="-33.89, -60.57" />
            </Field>
            <Field label="Hectáreas">
              <Input type="number" min="0.01" step="0.01" value={hectareas} onChange={(e) => setHectareas(e.target.value)} required />
            </Field>
            {error && <Alert kind="error">{error}</Alert>}
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Guardar" : "Registrar campo"}</Button>
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
            <Input placeholder="Buscar por coordenadas" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {campos.loading ? (
            <PageSpinner />
          ) : campos.error ? (
            <Alert kind="error">{campos.error}</Alert>
          ) : !campos.data?.length ? (
            <EmptyState>No hay campos registrados.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Coordenadas</Th>
                  <Th>Hectáreas</Th>
                  {isAdmin && <Th>Cliente</Th>}
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {campos.data.map((c) => (
                  <tr key={c.id_campo} className="hover:bg-slate-800/40">
                    <Td>
                      <Link to={`/campos/${c.id_campo}`} className="font-medium text-emerald-200 hover:underline">
                        {c.coordenadas}
                      </Link>
                    </Td>
                    <Td>{fmtNumber(c.hectareas)} ha</Td>
                    {isAdmin && <Td>{fullName(c.cliente_profile?.users)}</Td>}
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setCoordenadas(c.coordenadas); setHectareas(String(c.hectareas)); setError(null); }}>
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>
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
