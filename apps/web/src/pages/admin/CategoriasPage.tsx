import { Layers } from "lucide-react";
import { categorias } from "../../api";
import type { Categoria } from "../../api/types";
import CatalogoSimplePage from "./CatalogoSimplePage";

export default function CategoriasPage() {
  return (
    <CatalogoSimplePage<Categoria>
      title="Categorías de servicio"
      subtitle="Agrupan los servicios que publican los contratistas."
      noun={["la", "categoría"]}
      icon={<Layers className="h-6 w-6" />}
      fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "descripcion", label: "Descripción" }]}
      columns={[{ key: "nombre", label: "Nombre" }, { key: "descripcion", label: "Descripción" }, { key: "servicios", label: "Servicios activos", render: (c) => c._count?.servicio ?? 0 }]}
      list={categorias.list}
      toRow={(c) => ({ id: c.id_categoria, nombre: c.nombre, descripcion: c.descripcion })}
      create={(d) => categorias.create(d as { nombre: string; descripcion?: string | null })}
      update={(id, d) => categorias.update(id, d as { nombre?: string; descripcion?: string | null })}
      remove={categorias.remove}
    />
  );
}
