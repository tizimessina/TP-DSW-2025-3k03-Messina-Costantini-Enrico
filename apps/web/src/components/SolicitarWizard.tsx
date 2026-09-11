import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin, Package, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { campos as camposApi, getApiErrorMessage, insumos as insumosApi, solicitudes as solicitudesApi } from "../api";
import type { InsumoProveedor, Servicio } from "../api/types";
import { cn } from "../lib/cn";
import { dateInputToIso, fmtHa, fmtMoney, fmtMoneyExact, fmtNumber } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { useFeedback } from "./feedback";
import { Alert, Button, Field, Input, Select, Textarea } from "./ui";
import { Dialog } from "./ui/Dialog";

type Row = { id_insumo: string; cantidad: string; proveedor: InsumoProveedor };
const STEPS = ["Campo y hectáreas", "Insumos", "Confirmar"];

/** CUU "Solicitar un servicio" en tres pasos. */
export function SolicitarWizard({ open, onClose, servicio }: { open: boolean; onClose: () => void; servicio: Servicio }) {
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const campos = useQuery(() => camposApi.list(), []);
  const insumos = useQuery(() => insumosApi.list(), []);
  const precioHa = Number(servicio.precio_vigente?.valor ?? 0);

  const [step, setStep] = useState(0);
  const [idCampo, setIdCampo] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const campo = campos.data?.find((c) => String(c.id_campo) === idCampo);
  const ha = Number(hectareas) || 0;

  const totales = useMemo(() => {
    const servicioTotal = precioHa * ha;
    const lineas = rows
      .filter((r) => r.id_insumo)
      .map((r) => {
        const ins = insumos.data?.find((i) => String(i.id_insumo) === r.id_insumo);
        const cant = Number(r.cantidad) || 0;
        const unit = r.proveedor === "CONTRATISTA" ? Number(ins?.precio_referencia ?? 0) : 0;
        return { ins, cant, unit, subtotal: cant * unit, proveedor: r.proveedor };
      });
    const insumosTotal = lineas.reduce((a, l) => a + l.subtotal, 0);
    return { servicioTotal, insumosTotal, total: servicioTotal + insumosTotal, lineas };
  }, [precioHa, ha, rows, insumos.data]);

  const validStep0 = !!idCampo && ha > 0 && (!campo || ha <= Number(campo.hectareas)) && (!fechaInicio || !fechaFin || fechaFin >= fechaInicio);
  const validStep1 = rows.every((r) => r.id_insumo && Number(r.cantidad) > 0) && new Set(rows.map((r) => r.id_insumo)).size === rows.length;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const created = await solicitudesApi.create({
        id_servicio: servicio.id_servicio,
        id_campo: Number(idCampo),
        hectareas_trabajadas: ha,
        fecha_inicio: dateInputToIso(fechaInicio) ?? null,
        fecha_fin: dateInputToIso(fechaFin) ?? null,
        observaciones: observaciones.trim() || null,
        insumos: rows.map((r) => ({ id_insumo: Number(r.id_insumo), cantidad: Number(r.cantidad), proveedor: r.proveedor })),
      });
      toast.success("Solicitud enviada. El contratista la va a revisar.");
      onClose();
      navigate(`/solicitudes/${created.id_solicitud}`);
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo crear la solicitud"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Solicitar: ${servicio.nombre}`}
      description={`${fmtMoney(precioHa)} por hectárea`}
      size="lg"
      footer={
        <>
          {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Atrás</Button>}
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !validStep0 : !validStep1}>Continuar</Button>
          ) : (
            <Button onClick={submit} loading={submitting} icon={<Check className="h-4 w-4" />}>Confirmar solicitud</Button>
          )}
        </>
      }
    >
      <ol className="mb-5 flex items-center gap-2 text-xs font-semibold">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500 dark:bg-brand-900/40 dark:text-brand-100" : "bg-stone-200 text-stone-500 dark:bg-stone-800")}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={cn("hidden sm:inline", i === step ? "text-stone-900 dark:text-white" : "text-stone-500")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-stone-300 dark:bg-stone-700" />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
          {step === 0 && (
            <>
              {campos.data && campos.data.length === 0 && (
                <Alert kind="warning">Todavía no registraste ningún campo. <Link to="/campos" className="font-semibold underline">Cargá tu primer campo</Link> para poder solicitar.</Alert>
              )}
              <Field label="Campo" required>
                <Select value={idCampo} onChange={(e) => setIdCampo(e.target.value)}>
                  <option value="">Elegir campo…</option>
                  {campos.data?.map((c) => <option key={c.id_campo} value={c.id_campo}>{c.nombre} · {fmtHa(c.hectareas)} · {c.localidad?.nombre}</option>)}
                </Select>
              </Field>
              {campo && <p className="flex items-center gap-1.5 text-xs text-stone-500"><MapPin className="h-3.5 w-3.5" />{campo.localidad?.nombre}, {campo.localidad?.provincia?.nombre} · {fmtHa(campo.hectareas)} totales</p>}
              <Field label="Hectáreas a trabajar" required error={campo && ha > Number(campo.hectareas) ? `El campo tiene ${fmtHa(campo.hectareas)}` : null}>
                <Input type="number" min="0.1" step="0.1" value={hectareas} onChange={(e) => setHectareas(e.target.value)} placeholder={campo ? String(campo.hectareas) : "0"} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fecha de inicio deseada"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></Field>
                <Field label="Fecha de fin deseada" error={fechaInicio && fechaFin && fechaFin < fechaInicio ? "Debe ser posterior al inicio" : null}><Input type="date" value={fechaFin} min={fechaInicio || undefined} onChange={(e) => setFechaFin(e.target.value)} /></Field>
              </div>
              <Field label="Observaciones para el contratista"><Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={500} placeholder="Acceso al lote, cultivo anterior, horarios…" /></Field>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-stone-600 dark:text-stone-400">Indicá qué insumos necesita el trabajo y quién los aporta. Solo se cobran los que provee el contratista, al precio de referencia del catálogo.</p>
              <div className="space-y-2">
                {rows.map((r, i) => {
                  const ins = insumos.data?.find((x) => String(x.id_insumo) === r.id_insumo);
                  return (
                    <div key={i} className="grid gap-2 rounded-xl border border-stone-200 p-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end dark:border-stone-700">
                      <Field label="Insumo">
                        <Select value={r.id_insumo} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, id_insumo: e.target.value } : x)))}>
                          <option value="">Elegir…</option>
                          {insumos.data?.map((x) => <option key={x.id_insumo} value={x.id_insumo}>{x.nombre} ({fmtMoney(x.precio_referencia)}/{x.unidad})</option>)}
                        </Select>
                      </Field>
                      <Field label={`Cantidad${ins ? ` (${ins.unidad})` : ""}`}><Input type="number" min="0.01" step="0.01" value={r.cantidad} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))} /></Field>
                      <Field label="Lo aporta">
                        <Select value={r.proveedor} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, proveedor: e.target.value as InsumoProveedor } : x)))}>
                          <option value="CONTRATISTA">Contratista</option>
                          <option value="PRODUCTOR">Yo (productor)</option>
                        </Select>
                      </Field>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setRows((p) => p.filter((_, j) => j !== i))} aria-label="Quitar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  );
                })}
              </div>
              <Button type="button" variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setRows((p) => [...p, { id_insumo: "", cantidad: "1", proveedor: "CONTRATISTA" }])} disabled={rows.length >= 20}>Agregar insumo</Button>
              {rows.length === 0 && <p className="flex items-center gap-2 text-xs text-stone-500"><Package className="h-4 w-4" />Podés continuar sin insumos.</p>}
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-xl bg-sand-100 p-4 text-sm dark:bg-stone-800/60">
                <p className="font-semibold">{campo?.nombre} · {fmtHa(ha)}</p>
                <p className="text-stone-500">{campo?.localidad?.nombre}, {campo?.localidad?.provincia?.nombre}{fechaInicio ? ` · desde ${fechaInicio}` : ""}{fechaFin ? ` hasta ${fechaFin}` : ""}</p>
                {observaciones && <p className="mt-2 text-stone-600 dark:text-stone-300">“{observaciones}”</p>}
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-stone-600 dark:text-stone-400">Servicio ({fmtMoney(precioHa)} × {fmtNumber(ha)} ha)</dt><dd className="font-semibold">{fmtMoneyExact(totales.servicioTotal)}</dd></div>
                {totales.lineas.map((l, i) => (
                  <div key={i} className="flex justify-between"><dt className="text-stone-600 dark:text-stone-400">{l.ins?.nombre} × {fmtNumber(l.cant)} {l.ins?.unidad} <span className="text-xs">({l.proveedor === "PRODUCTOR" ? "lo aportás vos" : "lo aporta el contratista"})</span></dt><dd className="font-semibold">{l.proveedor === "PRODUCTOR" ? "—" : fmtMoneyExact(l.subtotal)}</dd></div>
                ))}
                <div className="flex justify-between border-t border-stone-200 pt-2 text-base dark:border-stone-700"><dt className="font-bold">Total estimado</dt><dd className="text-xl font-extrabold text-brand-700 dark:text-brand-300">{fmtMoneyExact(totales.total)}</dd></div>
              </dl>
              <p className="text-xs text-stone-500">El importe queda fijado con el precio vigente de hoy. El contratista puede aceptar o rechazar la solicitud.</p>
              {error && <Alert kind="error">{error}</Alert>}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Dialog>
  );
}
