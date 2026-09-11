import { Package } from "lucide-react";
import { insumos } from "../../api";
import type { Insumo } from "../../api/types";
import { fmtMoneyExact } from "../../lib/format";
import CatalogoSimplePage from "./CatalogoSimplePage";

export default function InsumosPage() {
  return (
    <CatalogoSimplePage<Insumo>
      title="Insumos"
      subtitle="Semillas, agroquímicos y combustible con su precio de referencia. Ese precio se snapshotea en cada solicitud."
      noun={["el", "insumo"]}
      icon={<Package className="h-6 w-6" />}
      fields={[
        { name: "nombre", label: "Nombre", required: true },
        { name: "descripcion", label: "Descripción" },
        { name: "unidad", label: "Unidad", required: true, hint: "bolsa, litro, tonelada, bidón…" },
        { name: "precio_referencia", label: "Precio de referencia", type: "number", step: "0.01", required: true },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "unidad", label: "Unidad" },
        { key: "precio_referencia", label: "Precio de referencia", render: (i) => fmtMoneyExact(i.precio_referencia) },
        { key: "descripcion", label: "Descripción" },
      ]}
      list={insumos.list}
      toRow={(i) => ({ id: i.id_insumo, nombre: i.nombre, descripcion: i.descripcion, unidad: i.unidad, precio_referencia: i.precio_referencia })}
      create={(d) => insumos.create(d as never)}
      update={(id, d) => insumos.update(id, d as never)}
      remove={insumos.remove}
    />
  );
}
