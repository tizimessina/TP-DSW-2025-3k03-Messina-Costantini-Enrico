import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/base";
import { listCampos } from "../api/campo";
import { getInsumos } from "../api/insumos";
import { getServicio, precioActual, type Servicio } from "../api/servicios";
import { createSolicitud, type SolicitudInsumoProveedor } from "../api/solicitudes";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "../components/feedback";
import { Alert, Button, Card, DetailItem, Field, Input, LinkButton, PageSpinner, PageTitle, Select, Table, Td, Th } from "../components/ui";
import { dateInputToIso, fmtDate, fmtMoney, fmtNumber, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Detalle de un servicio: datos, categoría, prestamista, historial de precios y formulario para solicitarlo. */
export default function ServicioDetailPage() {
  const { id } = useParams();
  const { isCliente, user } = useAuth();
  const servicio = useQuery(() => getServicio(Number(id)), [id]);

  if (servicio.loading) return <PageSpinner />;
  if (servicio.error || !servicio.data) return <Alert kind="error">{servicio.error ?? "Servicio no encontrado"}</Alert>;

  const s = servicio.data;
  const precio = precioActual(s);
  const prestamista = s.prestamista_profile?.users;
  const esPropio = user?.id_user === s.id_prestamista;

  return (
    <div className="space-y-6">
      <PageTitle
        title={s.nombre}
        subtitle={s.categoria?.nombre}
        actions={
          <>
            <LinkButton to="/servicios" variant="ghost">
              ← Volver
            </LinkButton>
            {esPropio && <LinkButton to="/mis-servicios" variant="secondary">Editar en Mis servicios</LinkButton>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Servicio" className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Descripción">{s.descripcion || "-"}</DetailItem>
            <DetailItem label="Categoría">{s.categoria?.nombre ?? "-"}</DetailItem>
            <DetailItem label="Precio vigente">
              <span className="text-lg font-bold text-emerald-200">
                {precio ? `${fmtMoney(precio.valor)} / ha` : "Sin precio publicado"}
              </span>
            </DetailItem>
            <DetailItem label="Publicado">{fmtDate(s.created_at)}</DetailItem>
          </dl>

          {s.precio && s.precio.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">Historial de precios</h3>
              <Table>
                <thead>
                  <tr>
                    <Th>Desde</Th>
                    <Th>Valor por hectárea</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {s.precio.map((p) => (
                    <tr key={p.id_precio}>
                      <Td>{fmtDate(p.fecha_desde)}</Td>
                      <Td>{fmtMoney(p.valor)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        <Card title="Prestamista">
          {prestamista ? (
            <dl className="space-y-3">
              <DetailItem label="Nombre">
                <Link to={`/prestamistas/${s.id_prestamista}`} className="text-emerald-300 hover:underline">
                  {fullName(prestamista)}
                </Link>
              </DetailItem>
              <DetailItem label="Localidad">
                {prestamista.localidad
                  ? `${prestamista.localidad.nombre}${prestamista.localidad.provincia ? `, ${prestamista.localidad.provincia.nombre}` : ""}`
                  : "-"}
              </DetailItem>
              <DetailItem label="Domicilio">{prestamista.domicilio || "-"}</DetailItem>
              <DetailItem label="Contacto">{prestamista.email}</DetailItem>
            </dl>
          ) : (
            <p className="text-sm text-slate-400">Sin datos del prestamista.</p>
          )}
        </Card>
      </div>

      {isCliente && !esPropio ? (
        precio ? (
          <SolicitarForm servicio={s} precioPorHa={Number(precio.valor)} />
        ) : (
          <Alert kind="info">Este servicio todavía no tiene un precio publicado, no se puede solicitar.</Alert>
        )
      ) : !user ? (
        <Alert kind="info">
          <Link to="/auth" className="font-semibold text-emerald-300 hover:underline">
            Ingresá como cliente
          </Link>{" "}
          para solicitar este servicio.
        </Alert>
      ) : null}
    </div>
  );
}

/* ---------- Formulario "Solicitar servicio" (CUU principal) ---------- */

type InsumoRow = { id_insumo: string; cantidad: string; precio_unit: string; proveedor: SolicitudInsumoProveedor };

function SolicitarForm({ servicio, precioPorHa }: { servicio: Servicio; precioPorHa: number }) {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const campos = useQuery(() => listCampos(), []);
  const insumos = useQuery(() => getInsumos(), []);

  const [idCampo, setIdCampo] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [rows, setRows] = useState<InsumoRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const campo = campos.data?.find((c) => String(c.id_campo) === idCampo);
  const ha = Number(hectareas) || 0;

  const estimado = useMemo(() => {
    const servicioTotal = precioPorHa * ha;
    const insumosTotal = rows.reduce((acc, r) => acc + (Number(r.cantidad) || 0) * (Number(r.precio_unit) || 0), 0);
    return { servicioTotal, insumosTotal, total: servicioTotal + insumosTotal };
  }, [precioPorHa, ha, rows]);

  const updateRow = (i: number, patch: Partial<InsumoRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idCampo) return setError("Elegí el campo donde se hará el trabajo.");
    if (ha <= 0) return setError("Indicá cuántas hectáreas se van a trabajar.");
    if (campo && ha > Number(campo.hectareas)) return setError(`El campo tiene ${fmtNumber(campo.hectareas)} ha; no podés trabajar más que eso.`);
    const insumosPayload = rows
      .filter((r) => r.id_insumo)
      .map((r) => ({
        id_insumo: Number(r.id_insumo),
        cantidad: Number(r.cantidad),
        precio_unit: Number(r.precio_unit),
        proveedor: r.proveedor,
      }));
    if (insumosPayload.some((r) => !(r.cantidad > 0) || r.precio_unit < 0)) {
      return setError("Revisá las cantidades y precios de los insumos.");
    }

    setSubmitting(true);
    try {
      const created = await createSolicitud({
        id_servicio: servicio.id_servicio,
        id_campo: Number(idCampo),
        hectareas_trabajadas: ha,
        fecha_inicio: dateInputToIso(fechaInicio),
        fecha_fin: dateInputToIso(fechaFin),
        insumos: insumosPayload,
      });
      toast.success("Solicitud enviada al prestamista");
      navigate(`/solicitudes/${created.id_solicitud}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo crear la solicitud"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Solicitar este servicio">
      {campos.data && campos.data.length === 0 && (
        <Alert kind="info">
          Todavía no registraste ningún campo.{" "}
          <Link to="/campos" className="font-semibold text-emerald-300 hover:underline">
            Cargá tu primer campo
          </Link>{" "}
          para poder solicitar servicios.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campo">
            <Select value={idCampo} onChange={(e) => setIdCampo(e.target.value)} required>
              <option value="">Seleccionar campo</option>
              {campos.data?.map((c) => (
                <option key={c.id_campo} value={c.id_campo}>
                  {c.coordenadas} · {fmtNumber(c.hectareas)} ha
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hectáreas a trabajar" hint={campo ? `Máximo ${fmtNumber(campo.hectareas)} ha` : undefined}>
            <Input type="number" min="0.1" step="0.1" value={hectareas} onChange={(e) => setHectareas(e.target.value)} required />
          </Field>
          <Field label="Fecha de inicio deseada (opcional)">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </Field>
          <Field label="Fecha de fin deseada (opcional)">
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio || undefined} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Insumos (opcional)</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRows((r) => [...r, { id_insumo: "", cantidad: "1", precio_unit: "0", proveedor: "PRESTAMISTA" }])}
            >
              + Agregar insumo
            </Button>
          </div>
          {rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-slate-800 p-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
                  <Field label="Insumo">
                    <Select value={r.id_insumo} onChange={(e) => updateRow(i, { id_insumo: e.target.value })}>
                      <option value="">Elegir…</option>
                      {insumos.data?.map((x) => (
                        <option key={x.id_insumo} value={x.id_insumo}>
                          {x.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Cantidad">
                    <Input type="number" min="0.01" step="0.01" value={r.cantidad} onChange={(e) => updateRow(i, { cantidad: e.target.value })} />
                  </Field>
                  <Field label="Precio unit.">
                    <Input type="number" min="0" step="0.01" value={r.precio_unit} onChange={(e) => updateRow(i, { precio_unit: e.target.value })} />
                  </Field>
                  <Field label="Lo provee">
                    <Select value={r.proveedor} onChange={(e) => updateRow(i, { proveedor: e.target.value as SolicitudInsumoProveedor })}>
                      <option value="PRESTAMISTA">Prestamista</option>
                      <option value="CLIENTE">Cliente</option>
                    </Select>
                  </Field>
                  <Button type="button" variant="danger" size="sm" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-slate-950/70 p-4 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Servicio ({fmtMoney(precioPorHa)} × {fmtNumber(ha)} ha)</span>
            <span>{fmtMoney(estimado.servicioTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Insumos</span>
            <span>{fmtMoney(estimado.insumosTotal)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-emerald-200">
            <span>Total estimado</span>
            <span>{fmtMoney(estimado.total)}</span>
          </div>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <Button type="submit" disabled={submitting || !campos.data?.length} className="w-full sm:w-auto">
          {submitting ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
    </Card>
  );
}
