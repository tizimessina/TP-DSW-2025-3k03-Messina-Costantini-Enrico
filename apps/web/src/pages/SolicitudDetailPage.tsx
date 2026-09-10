import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { deleteSolicitud, getSolicitud, updateSolicitudEstado, type SolicitudEstado } from "../api/solicitudes";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Card, DetailItem, EmptyState, EstadoBadge, LinkButton, PageSpinner, PageTitle, Table, Td, Th } from "../components/ui";
import { fmtDate, fmtDateTime, fmtMoney, fmtNumber, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Detalle completo de una solicitud: servicio, categoría, campo, cliente, prestamista, insumos e importes. */
export default function SolicitudDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isCliente, isPrestamista } = useAuth();
  const { toast, confirm } = useFeedback();
  const q = useQuery(() => getSolicitud(Number(id)), [id]);

  if (q.loading) return <PageSpinner />;
  if (q.error || !q.data) return <Alert kind="error">{q.error ?? "Solicitud no encontrada"}</Alert>;
  const s = q.data;

  const puedeGestionar = isAdmin || (isPrestamista && s.id_prestamista === user!.id_user);
  const puedeCancelar = isAdmin || (isCliente && s.id_cliente === user!.id_user && s.estado === "pendiente");

  const cambiarEstado = async (nuevo: SolicitudEstado) => {
    if (!(await confirm({ title: "Cambiar estado", message: `¿Pasar la solicitud a "${nuevo}"?`, danger: nuevo === "rechazada" }))) return;
    try {
      const updated = await updateSolicitudEstado(s.id_solicitud, { estado: nuevo });
      q.setData(updated);
      toast.success(`Solicitud ${nuevo}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const cancelar = async () => {
    if (!(await confirm({ title: "Cancelar solicitud", message: "¿Cancelar esta solicitud? No se puede deshacer.", danger: true, confirmLabel: "Cancelar solicitud", cancelLabel: "Volver" }))) return;
    try {
      await deleteSolicitud(s.id_solicitud);
      toast.success("Solicitud cancelada");
      navigate("/solicitudes");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Solicitud #${s.id_solicitud}`}
        subtitle={`Creada el ${fmtDateTime(s.fecha_solicitud)}`}
        actions={
          <>
            <LinkButton to="/solicitudes" variant="ghost">
              ← Volver
            </LinkButton>
            {puedeGestionar && s.estado === "pendiente" && (
              <>
                <Button onClick={() => cambiarEstado("aceptada")}>Aceptar</Button>
                <Button variant="danger" onClick={() => cambiarEstado("rechazada")}>
                  Rechazar
                </Button>
              </>
            )}
            {puedeGestionar && s.estado === "aceptada" && <Button onClick={() => cambiarEstado("completada")}>Marcar completada</Button>}
            {puedeCancelar && (
              <Button variant="ghost" onClick={cancelar}>
                Cancelar solicitud
              </Button>
            )}
          </>
        }
      />

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Estado:</span>
        <EstadoBadge estado={s.estado} />
        <span className="text-xs text-slate-500">
          {s.estado === "pendiente" && "Esperando respuesta del prestamista"}
          {s.estado === "aceptada" && "El prestamista aceptó el trabajo"}
          {s.estado === "rechazada" && "El prestamista rechazó la solicitud"}
          {s.estado === "completada" && "Trabajo finalizado"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Servicio">
          <dl className="space-y-3">
            <DetailItem label="Servicio">
              <Link to={`/servicios/${s.id_servicio}`} className="text-emerald-300 hover:underline">
                {s.servicio?.nombre}
              </Link>
            </DetailItem>
            <DetailItem label="Categoría">{s.servicio?.categoria?.nombre ?? "-"}</DetailItem>
            <DetailItem label="Hectáreas a trabajar">{fmtNumber(s.hectareas_trabajadas)} ha</DetailItem>
            <DetailItem label="Fecha de inicio">{fmtDate(s.fecha_inicio)}</DetailItem>
            <DetailItem label="Fecha de fin">{fmtDate(s.fecha_fin)}</DetailItem>
          </dl>
        </Card>

        <Card title="Campo y cliente">
          <dl className="space-y-3">
            <DetailItem label="Campo">
              <Link to={`/campos/${s.id_campo}`} className="text-emerald-300 hover:underline">
                {s.campo?.coordenadas}
              </Link>
              <span className="text-slate-400"> · {fmtNumber(s.campo?.hectareas)} ha totales</span>
            </DetailItem>
            <DetailItem label="Cliente">{fullName(s.cliente_profile?.users)}</DetailItem>
            <DetailItem label="Contacto">{s.cliente_profile?.users.email ?? "-"}</DetailItem>
            <DetailItem label="Localidad">{s.cliente_profile?.users.localidad?.nombre ?? "-"}</DetailItem>
          </dl>
        </Card>

        <Card title="Prestamista">
          <dl className="space-y-3">
            <DetailItem label="Nombre">
              <Link to={`/prestamistas/${s.id_prestamista}`} className="text-emerald-300 hover:underline">
                {fullName(s.prestamista_profile?.users)}
              </Link>
            </DetailItem>
            <DetailItem label="Contacto">{s.prestamista_profile?.users.email ?? "-"}</DetailItem>
            <DetailItem label="Localidad">{s.prestamista_profile?.users.localidad?.nombre ?? "-"}</DetailItem>
          </dl>
        </Card>

        <Card title="Insumos" className="lg:col-span-2">
          {!s.solicitud_insumo?.length ? (
            <EmptyState>Sin insumos asociados.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Insumo</Th>
                  <Th>Cantidad</Th>
                  <Th>Precio unit.</Th>
                  <Th>Lo provee</Th>
                  <Th>Subtotal</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {s.solicitud_insumo.map((i) => (
                  <tr key={i.id_solicitud_insumo ?? i.id_insumo}>
                    <Td>{i.insumo?.nombre ?? `Insumo #${i.id_insumo}`}</Td>
                    <Td>{fmtNumber(i.cantidad)}</Td>
                    <Td>{fmtMoney(i.precio_unit)}</Td>
                    <Td className="capitalize">{i.proveedor.toLowerCase()}</Td>
                    <Td>{fmtMoney(Number(i.cantidad) * Number(i.precio_unit))}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title="Importes">
          <dl className="space-y-3">
            <DetailItem label="Servicio">{fmtMoney(s.precio_servicio)}</DetailItem>
            <DetailItem label="Insumos">{fmtMoney(s.costo_insumos)}</DetailItem>
            <DetailItem label="Total">
              <span className="text-xl font-bold text-emerald-200">{fmtMoney(s.precio_total)}</span>
            </DetailItem>
          </dl>
        </Card>
      </div>
    </div>
  );
}
