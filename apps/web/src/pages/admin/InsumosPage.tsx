import { createInsumo, deleteInsumo, getInsumos, updateInsumo } from "../../api/insumos";
import CatalogoSimplePage from "./CatalogoSimplePage";

/** CRUD simple: Insumo (ADMIN). */
export default function InsumosPage() {
  return (
    <CatalogoSimplePage
      title="Insumos"
      subtitle="Semillas, agroquímicos, combustible… que pueden sumarse a una solicitud."
      singular="insumo"
      list={getInsumos}
      toItem={(i) => ({ id: i.id_insumo, nombre: i.nombre, descripcion: i.descripcion })}
      create={(d) => createInsumo(d.nombre, d.descripcion)}
      update={(id, d) => updateInsumo(id, d)}
      remove={deleteInsumo}
    />
  );
}
