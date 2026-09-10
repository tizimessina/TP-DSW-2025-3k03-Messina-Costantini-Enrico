import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../api/base";
import { createPrecio, deletePrecio, getPrecios, updatePrecio, type Precio } from "../api/precios";
import { getServicios } from "../api/servicios";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Card, EmptyState, Field, Input, PageSpinner, PageTitle, Select, Table, Td, Th } from "../components/ui";
import { fmtDate, fmtMoney, isoToDateInput } from "../lib/format";
import { useQuery } from "../lib/useQuery";

const today = () => new Date().toISOString().slice(0, 10);

/** CRUD dependiente Precio: historial de precios por servicio del prestamista logueado (o de todos, si es ADMIN). */
export default function PreciosPage() {
  const { user, isAdmin } = useAuth();
  const { toast, confirm } = useFeedback();
  const servicios = useQuery(() => getServicios(isAdmin ? undefined : { id_prestamista: user!.id_user }), [user?.id_user]);

  const [idServicio, setIdServicio] = useState("");
  useEffect(() => {
    if (!idServicio && servicios.data?.length) setIdServicio(String(servicios.data[0].id_servicio));
  }, [servicios.data, idServicio]);

  const precios = useQuery(() => (idServicio ? getPrecios(Number(idServicio)) : Promise.resolve([] as Precio[])), [idServicio]);

  const [valor, setValor] = useState("");
  const [fechaDesde, setFechaDesde] = useState(today());
  const [editing, setEditing] = useState<Precio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setValor("");
    setFechaDesde(today());
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idServicio) return setError("Seleccioná un servicio.");
    if (!(Number(valor) > 0)) return setError("El valor debe ser mayor a 0.");
    try {
      if (editing) {
        await updatePrecio(editing.id_precio, { valor: Number(valor), fecha_desde: fechaDesde });
        toast.success("Precio actualizado");
      } else {
        await createPrecio(Number(idServicio), Number(valor), fechaDesde);
        toast.success("Precio cargado");
      }
      reset();
      precios.reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (p: Precio) => {
    if (!(await confirm({ title: "Eliminar precio", message: `¿Eliminar el precio vigente desde ${fmtDate(p.fecha_desde)}?`, danger: true, confirmLabel: "Eliminar" }))) return;
    try {
      await deletePrecio(p.id_precio);
      toast.success("Precio eliminado");
      precios.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Precios" subtitle="El precio vigente es el de fecha más reciente no futura. Cargá uno nuevo para actualizarlo sin perder el historial." />

      <Card>
        <Field label="Servicio">
          <Select value={idServicio} onChange={(e) => { setIdServicio(e.target.value); reset(); }}>
            <option value="">Seleccionar…</option>
            {servicios.data?.map((s) => (
              <option key={s.id_servicio} value={s.id_servicio}>
                {s.nombre}
                {isAdmin && s.prestamista_profile ? ` — ${s.prestamista_profile.users.apellido}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        {servicios.data && servicios.data.length === 0 && (
          <p className="mt-3 text-sm text-slate-400">Primero publicá un servicio en “Mis servicios”.</p>
        )}
      </Card>

      {idServicio && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card title={editing ? "Editar precio" : "Nuevo precio"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Valor por hectárea">
                <Input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
              </Field>
              <Field label="Vigente desde">
                <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} required />
              </Field>
              {error && <Alert kind="error">{error}</Alert>}
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Guardar" : "Cargar precio"}</Button>
                {editing && (
                  <Button type="button" variant="ghost" onClick={reset}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card title="Historial">
            {precios.loading ? (
              <PageSpinner />
            ) : !precios.data?.length ? (
              <EmptyState>Este servicio todavía no tiene precios cargados.</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Desde</Th>
                    <Th>Valor / ha</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {precios.data.map((p, i) => (
                    <tr key={p.id_precio} className={i === 0 ? "bg-emerald-500/5" : ""}>
                      <Td>
                        {fmtDate(p.fecha_desde)} {i === 0 && <span className="ml-1 text-xs text-emerald-300">(actual)</span>}
                      </Td>
                      <Td>{fmtMoney(p.valor)}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => { setEditing(p); setValor(String(p.valor)); setFechaDesde(isoToDateInput(p.fecha_desde)); }}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
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
      )}
    </div>
  );
}
