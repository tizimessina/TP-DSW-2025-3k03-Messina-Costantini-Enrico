import { Link, useParams } from "react-router-dom";
import { getCampo } from "../api/campo";
import { Alert, Card, DetailItem, EmptyState, EstadoBadge, LinkButton, PageSpinner, PageTitle, Table, Td, Th } from "../components/ui";
import { fmtDate, fmtMoney, fmtNumber, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Detalle de un campo: datos del campo, del cliente y las solicitudes hechas sobre él. */
export default function CampoDetailPage() {
  const { id } = useParams();
  const campo = useQuery(() => getCampo(Number(id)), [id]);

  if (campo.loading) return <PageSpinner />;
  if (campo.error || !campo.data) return <Alert kind="error">{campo.error ?? "Campo no encontrado"}</Alert>;
  const c = campo.data;
  const cliente = c.cliente_profile?.users;

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Campo ${c.coordenadas}`}
        subtitle={`${fmtNumber(c.hectareas)} hectáreas`}
        actions={
          <>
            <LinkButton to="/campos" variant="ghost">
              ← Volver
            </LinkButton>
            <LinkButton to="/servicios">Solicitar un servicio</LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Campo">
          <dl className="space-y-3">
            <DetailItem label="Coordenadas">{c.coordenadas}</DetailItem>
            <DetailItem label="Hectáreas">{fmtNumber(c.hectareas)} ha</DetailItem>
            <DetailItem label="Ver en el mapa">
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(c.coordenadas)}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:underline"
              >
                Abrir en Google Maps
              </a>
            </DetailItem>
          </dl>
        </Card>

        <Card title="Cliente">
          <dl className="space-y-3">
            <DetailItem label="Nombre">{fullName(cliente)}</DetailItem>
            <DetailItem label="Email">{cliente?.email ?? "-"}</DetailItem>
            <DetailItem label="CUIT">{c.cliente_profile?.cuit || "-"}</DetailItem>
            <DetailItem label="Localidad">{cliente?.localidad?.nombre ?? "-"}</DetailItem>
          </dl>
        </Card>

        <Card title="Solicitudes sobre este campo" className="lg:col-span-3">
          {!c.solicitud?.length ? (
            <EmptyState>Todavía no se solicitaron servicios para este campo.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Servicio</Th>
                  <Th>Hectáreas</Th>
                  <Th>Estado</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {c.solicitud.map((s) => (
                  <tr key={s.id_solicitud} className="hover:bg-slate-800/40">
                    <Td>{fmtDate(s.fecha_solicitud)}</Td>
                    <Td>
                      <Link to={`/solicitudes/${s.id_solicitud}`} className="text-emerald-200 hover:underline">
                        {s.servicio.nombre}
                      </Link>
                    </Td>
                    <Td>{fmtNumber(s.hectareas_trabajadas)} ha</Td>
                    <Td>
                      <EstadoBadge estado={s.estado} />
                    </Td>
                    <Td>{fmtMoney(s.precio_total)}</Td>
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
