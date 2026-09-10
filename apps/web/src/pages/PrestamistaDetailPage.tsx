import { Link, useParams } from "react-router-dom";
import { getPrestamista } from "../api/prestamistas";
import { Alert, Card, DetailItem, EmptyState, LinkButton, PageSpinner, PageTitle, Table, Td, Th } from "../components/ui";
import { fmtMoney, fullName } from "../lib/format";
import { useQuery } from "../lib/useQuery";

/** Detalle de un prestamista: datos de contacto, ubicación y servicios con su precio actual. */
export default function PrestamistaDetailPage() {
  const { id } = useParams();
  const q = useQuery(() => getPrestamista(Number(id)), [id]);

  if (q.loading) return <PageSpinner />;
  if (q.error || !q.data) return <Alert kind="error">{q.error ?? "Prestamista no encontrado"}</Alert>;
  const p = q.data;
  const u = p.users;

  return (
    <div className="space-y-6">
      <PageTitle
        title={fullName(u)}
        subtitle="Prestamista"
        actions={
          <LinkButton to="/prestamistas" variant="ghost">
            ← Volver
          </LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Contacto">
          <dl className="space-y-3">
            <DetailItem label="Email">{u.email}</DetailItem>
            <DetailItem label="CUIT">{p.cuit || "-"}</DetailItem>
            <DetailItem label="Domicilio">{u.domicilio || "-"}</DetailItem>
            <DetailItem label="Localidad">
              {u.localidad ? `${u.localidad.nombre}${u.localidad.provincia ? `, ${u.localidad.provincia.nombre}` : ""}` : "-"}
            </DetailItem>
          </dl>
        </Card>

        <Card title="Servicios ofrecidos" className="lg:col-span-2">
          {!p.servicio?.length ? (
            <EmptyState>Este prestamista todavía no publicó servicios.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Servicio</Th>
                  <Th>Categoría</Th>
                  <Th>Precio actual</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {p.servicio.map((s) => (
                  <tr key={s.id_servicio} className="hover:bg-slate-800/40">
                    <Td>
                      <Link to={`/servicios/${s.id_servicio}`} className="font-medium text-emerald-200 hover:underline">
                        {s.nombre}
                      </Link>
                    </Td>
                    <Td>{s.categoria?.nombre ?? "-"}</Td>
                    <Td>{s.precio?.[0] ? `${fmtMoney(s.precio[0].valor)} / ha` : "Sin precio"}</Td>
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
