import { createCategoriaServicio, deleteCategoriaServicio, getCategoriasServicio, updateCategoriaServicio } from "../../api/categoriasServicio";
import CatalogoSimplePage from "./CatalogoSimplePage";

/** CRUD simple: Categoría de servicio (ADMIN). */
export default function CategoriasPage() {
  return (
    <CatalogoSimplePage
      title="Categorías de servicio"
      subtitle="Agrupan los servicios que publican los prestamistas (siembra, cosecha, fumigación…)."
      singular="categoría"
      list={getCategoriasServicio}
      toItem={(c) => ({ id: c.id_categoria, nombre: c.nombre, descripcion: c.descripcion })}
      create={(d) => createCategoriaServicio(d.nombre, d.descripcion)}
      update={(id, d) => updateCategoriaServicio(id, d)}
      remove={deleteCategoriaServicio}
    />
  );
}
