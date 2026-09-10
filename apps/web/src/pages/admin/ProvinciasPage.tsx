import { createProvincia, deleteProvincia, getProvincias, updateProvincia } from "../../api/provincias";
import CatalogoSimplePage from "./CatalogoSimplePage";

/** CRUD simple: Provincia (ADMIN). */
export default function ProvinciasPage() {
  return (
    <CatalogoSimplePage
      title="Provincias"
      singular="provincia"
      withDescripcion={false}
      list={getProvincias}
      toItem={(p) => ({ id: p.id_provincia, nombre: p.nombre })}
      create={(d) => createProvincia(d.nombre)}
      update={(id, d) => updateProvincia(id, d.nombre)}
      remove={deleteProvincia}
    />
  );
}
