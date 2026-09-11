import { ArrowLeft, ExternalLink, Pencil, Sprout } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { campos as camposApi } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AnimatedPage } from "../components/layout/AppShell";
import { MapView } from "../components/MapView";
import { Alert, Button, Card, DetailItem, EmptyState, EstadoBadge, LinkButton, PageHeader, PageSpinner, Table, Td, Th } from "../components/ui";
import { fmtDate, fmtHa, fmtMoney, fullName, ubicacion } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { CampoFormDialog } from "./CamposPage";

export default function CampoDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const q = useQuery(() => camposApi.get(Number(id)), [id]);
  const [editing, setEditing] = useState(false);

  if (q.loading) return <PageSpinner />;
  if (q.error || !q.data) return <Alert kind="error">{q.error ?? "Campo no encontrado"}</Alert>;
  const c = q.data;
  const point = c.latitud && c.longitud ? { lat: Number(c.latitud), lng: Number(c.longitud) } : null;
  const esDuenio = user?.id_user === c.id_productor || isAdmin;

  return (
    <AnimatedPage>
      <Link to="/campos" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"><ArrowLeft className="h-4 w-4" /> Mis campos</Link>
      <PageHeader
        title={c.nombre}
        subtitle={`${ubicacion(c.localidad)} · ${fmtHa(c.hectareas)}`}
        actions={
          esDuenio ? (
            <>
              <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>Editar</Button>
              <LinkButton to={`/contratistas?campo=${c.id_campo}`} icon={<Sprout className="h-4 w-4" />}>Buscar contratistas cerca</LinkButton>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {point ? <MapView point={point} height="h-72" /> : <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-stone-300 text-sm text-stone-500 dark:border-stone-700">Este campo no tiene ubicación cargada.</div>}

          <Card title="Solicitudes sobre este campo">
            {!c.solicitud?.length ? (
              <EmptyState title="Todavía no se solicitaron servicios para este campo" action={esDuenio ? <LinkButton to="/servicios" size="sm">Buscar un servicio</LinkButton> : undefined} />
            ) : (
              <Table>
                <thead><tr><Th>Fecha</Th><Th>Servicio</Th><Th>Contratista</Th><Th>Ha</Th><Th>Estado</Th><Th className="text-right">Total</Th></tr></thead>
                <tbody>
                  {c.solicitud.map((s) => (
                    <tr key={s.id_solicitud} className="transition hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      <Td className="whitespace-nowrap">{fmtDate(s.fecha_solicitud)}</Td>
                      <Td><Link to={`/solicitudes/${s.id_solicitud}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">{s.servicio?.nombre}</Link><span className="block text-xs text-stone-500">{s.servicio?.categoria?.nombre}</span></Td>
                      <Td>{fullName(s.contratista_profile?.users)}</Td>
                      <Td>{fmtHa(s.hectareas_trabajadas)}</Td>
                      <Td><EstadoBadge estado={s.estado} /></Td>
                      <Td className="text-right font-semibold">{fmtMoney(s.precio_total)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card title="Datos">
          <dl className="space-y-4">
            <DetailItem label="Productor">{fullName(c.productor_profile?.users)}{c.productor_profile?.razon_social && <span className="block text-xs text-stone-500">{c.productor_profile.razon_social}</span>}</DetailItem>
            <DetailItem label="Ubicación">{ubicacion(c.localidad)}</DetailItem>
            <DetailItem label="Superficie">{fmtHa(c.hectareas)}</DetailItem>
            <DetailItem label="Coordenadas">
              {point ? <a className="inline-flex items-center gap-1 text-brand-700 hover:underline dark:text-brand-300" href={`https://www.google.com/maps?q=${point.lat},${point.lng}`} target="_blank" rel="noreferrer">{point.lat}, {point.lng} <ExternalLink className="h-3 w-3" /></a> : "Sin cargar"}
            </DetailItem>
          </dl>
        </Card>
      </div>

      {editing && <CampoFormDialog open onClose={() => setEditing(false)} campo={c} onSaved={q.reload} />}
    </AnimatedPage>
  );
}
