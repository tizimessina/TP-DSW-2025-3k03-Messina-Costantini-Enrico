import { Map } from "lucide-react";
import { provincias } from "../../api";
import type { Provincia } from "../../api/types";
import CatalogoSimplePage from "./CatalogoSimplePage";

export default function ProvinciasPage() {
  return (
    <CatalogoSimplePage<Provincia>
      title="Provincias"
      noun={["la", "provincia"]}
      icon={<Map className="h-6 w-6" />}
      fields={[{ name: "nombre", label: "Nombre", required: true }]}
      columns={[{ key: "nombre", label: "Nombre" }, { key: "localidades", label: "Localidades", render: (p) => p._count?.localidad ?? 0 }]}
      list={provincias.list}
      toRow={(p) => ({ id: p.id_provincia, nombre: p.nombre })}
      create={(d) => provincias.create(String(d.nombre))}
      update={(id, d) => provincias.update(id, String(d.nombre))}
      remove={provincias.remove}
    />
  );
}
