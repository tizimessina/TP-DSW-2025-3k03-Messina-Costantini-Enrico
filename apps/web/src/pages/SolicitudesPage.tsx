import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { deleteSolicitud, ESTADOS, getSolicitudes, updateSolicitudEstado, type Solicitud, type SolicitudEstado } from "../api/solicitudes";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, EmptyState, EstadoBadge, Field, LinkButton, PageSpinner, PageTitle, Select, Table, Td, Th } from "../components/ui";
import { fmtDate, fmtMoney, fmtNumber, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Listado de solicitudes (historial) filtrado por estado, con acciones según el rol. */
export default function SolicitudesPage() {
  const { user, isAdmin, isCliente, isPrestamista } = useAuth();
  const { toast, confirm } = useFeedback();
  const [estado, setEstado] = useState<SolicitudEstado | "">("");
  const [vista, setVista] = useState<"cliente" | "prestamista">(isPrestamista && !isCliente ? "prestamista" : "cliente");

  const solicitudes = useQuery(
    () =>
      getSolicitudes({
        estado: estado || undefined,
        ...(isCliente && isPrestamista && vista === "prestamista" ? { id_prestamista: user!.id_user } : {}),
      }),
    [estado, vista],
  );

  const cambiarEstado = async (s: Solicitud, nuevo: SolicitudEstado) => {
    const label = { aceptada: "aceptar", rechazada: "rechazar", completada: "marcar como completada", pendiente: "" }[nuevo];
    if (!(await confirm({ title: "Cambiar estado", message: `¿Querés ${label} la solicitud #${s.id_solicitud}?`, danger: nuevo === "rechazada" }))) return;
    try {
      await updateSolicitudEstado(s.id_solicitud, { estado: nuevo });
      toast.success(`Solicitud ${nuevo}`);
      solicitudes.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const cancelar = async (s: Solicitud) => {
    if (!(await confirm({ title: "Cancelar solicitud", message: `¿Cancelar la solicitud #${s.id_solicitud}?`, danger: true, confirmLabel: "Cancelar solicitud", cancelLabel: "Volver" }))) return;
    try {
      await deleteSolicitud(s.id_solicitud);
      toast.success("Solicitud cancelada");
      solicitudes.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const puedeGestionar = (s: Solicitud) => isAdmin || (isPrestamista && s.id_prestamista === user!.id_user);
  const puedeCancelar = (s: Solicitud) => isAdmin || (isCliente && s.id_cliente === user!.id_user && s.estado === "pendiente");

  const title = isAdmin ? "Solicitudes" : isPrestamista && !isCliente ? "Solicitudes recibidas" : "Mis solicitudes";

  return (
    <div className="space-y-6">
      <PageTitle
        title={title}
        subtitle="Seguí el estado de cada pedido. Tocá una fila para ver el detalle completo."
        actions={isCliente ? <LinkButton to="/servicios">Nueva solicitud</LinkButton> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <Field label="Estado">
          <Select value={estado} onChange={(e) => setEstado(e.target.value as SolicitudEstado | "")}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">
                {e}
              </option>
            ))}
          </Select>
        </Field>
        {isCliente && isPrestamista && (
          <Field label="Ver como">
            <Select value={vista} onChange={(e) => setVista(e.target.value as "cliente" | "prestamista")}>
              <option value="cliente">Cliente (las que pedí)</option>
              <option value="prestamista">Prestamista (las que recibí)</option>
            </Select>
          </Field>
        )}
      </div>

      {solicitudes.loading ? (
        <PageSpinner />
      ) : solicitudes.error ? (
        <Alert kind="error">{solicitudes.error}</Alert>
      ) : !solicitudes.data?.length ? (
        <EmptyState>No hay solicitudes para mostrar.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Fecha</Th>
              <Th>Servicio</Th>
              <Th>{isPrestamista && !isCliente ? "Cliente" : "Prestamista"}</Th>
              <Th>Campo</Th>
              <Th>Ha</Th>
              <Th>Estado</Th>
              <Th>Total</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {solicitudes.data.map((s) => (
              <tr key={s.id_solicitud} className="hover:bg-slate-800/40">
                <Td>
                  <Link to={`/solicitudes/${s.id_solicitud}`} className="font-semibold text-emerald-200 hover:underline">
                    #{s.id_solicitud}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">{fmtDate(s.fecha_solicitud)}</Td>
                <Td>
                  {s.servicio?.nombre}
                  <span className="block text-xs text-slate-500">{s.servicio?.categoria?.nombre}</span>
                </Td>
                <Td>{isPrestamista && !isCliente ? fullName(s.cliente_profile?.users) : fullName(s.prestamista_profile?.users)}</Td>
                <Td className="text-xs">{s.campo?.coordenadas}</Td>
                <Td>{fmtNumber(s.hectareas_trabajadas)}</Td>
                <Td>
                  <EstadoBadge estado={s.estado} />
                </Td>
                <Td className="whitespace-nowrap">{fmtMoney(s.precio_total)}</Td>
                <Td className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    {puedeGestionar(s) && s.estado === "pendiente" && (
                      <>
                        <Button size="sm" onClick={() => cambiarEstado(s, "aceptada")}>
                          Aceptar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => cambiarEstado(s, "rechazada")}>
                          Rechazar
                        </Button>
                      </>
                    )}
                    {puedeGestionar(s) && s.estado === "aceptada" && (
                      <Button size="sm" onClick={() => cambiarEstado(s, "completada")}>
                        Completar
                      </Button>
                    )}
                    {puedeCancelar(s) && (
                      <Button size="sm" variant="ghost" onClick={() => cancelar(s)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
