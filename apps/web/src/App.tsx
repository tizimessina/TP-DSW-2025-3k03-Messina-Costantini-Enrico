import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AppLayout, PublicShell } from "./components/layout/AppShell";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ServiciosPage from "./pages/ServiciosPage";
import ServicioDetailPage from "./pages/ServicioDetailPage";
import ContratistasPage from "./pages/ContratistasPage";
import ContratistaDetailPage from "./pages/ContratistaDetailPage";
import DashboardPage from "./pages/DashboardPage";
import PerfilPage from "./pages/PerfilPage";
import CamposPage from "./pages/CamposPage";
import CampoDetailPage from "./pages/CampoDetailPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import SolicitudDetailPage from "./pages/SolicitudDetailPage";
import MisServiciosPage from "./pages/MisServiciosPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import ProvinciasPage from "./pages/admin/ProvinciasPage";
import LocalidadesPage from "./pages/admin/LocalidadesPage";
import CategoriasPage from "./pages/admin/CategoriasPage";
import InsumosPage from "./pages/admin/InsumosPage";
import NotFoundPage from "./pages/NotFoundPage";

const P = ProtectedRoute;

// Las transiciones de entrada las hace <AnimatedPage> en cada página; no usamos AnimatePresence
// a nivel de rutas para que una ruta protegida en salida no dispare redirects al cerrar sesión.
export default function App() {
  return (
    <Routes>
      {/* Sitio público */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ingresar" element={<AuthPage mode="login" />} />
        <Route path="/registro" element={<AuthPage mode="register" />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/servicios/:id" element={<ServicioDetailPage />} />
        <Route path="/contratistas" element={<ContratistasPage />} />
        <Route path="/contratistas/:id" element={<ContratistaDetailPage />} />
      </Route>

      {/* Aplicación (requiere sesión) */}
      <Route element={<P><AppLayout /></P>}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/solicitudes/:id" element={<SolicitudDetailPage />} />
        <Route path="/campos" element={<P roles={["PRODUCTOR", "ADMIN"]}><CamposPage /></P>} />
        <Route path="/campos/:id" element={<CampoDetailPage />} />
        <Route path="/mis-servicios" element={<P roles={["CONTRATISTA"]}><MisServiciosPage /></P>} />
        <Route path="/admin/usuarios" element={<P roles={["ADMIN"]}><UsuariosPage /></P>} />
        <Route path="/admin/provincias" element={<P roles={["ADMIN"]}><ProvinciasPage /></P>} />
        <Route path="/admin/localidades" element={<P roles={["ADMIN"]}><LocalidadesPage /></P>} />
        <Route path="/admin/categorias" element={<P roles={["ADMIN"]}><CategoriasPage /></P>} />
        <Route path="/admin/insumos" element={<P roles={["ADMIN"]}><InsumosPage /></P>} />
      </Route>

      <Route element={<PublicShell />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
