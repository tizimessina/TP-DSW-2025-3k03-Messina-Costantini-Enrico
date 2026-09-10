import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ServiciosPage from "./pages/ServiciosPage";
import ServicioDetailPage from "./pages/ServicioDetailPage";
import PrestamistasPage from "./pages/PrestamistasPage";
import PrestamistaDetailPage from "./pages/PrestamistaDetailPage";
import CamposPage from "./pages/CamposPage";
import CampoDetailPage from "./pages/CampoDetailPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import SolicitudDetailPage from "./pages/SolicitudDetailPage";
import MisServiciosPage from "./pages/MisServiciosPage";
import PreciosPage from "./pages/PreciosPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import ProvinciasPage from "./pages/admin/ProvinciasPage";
import LocalidadesPage from "./pages/admin/LocalidadesPage";
import CategoriasPage from "./pages/admin/CategoriasPage";
import InsumosPage from "./pages/admin/InsumosPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/servicios/:id" element={<ServicioDetailPage />} />
        <Route path="/prestamistas" element={<PrestamistasPage />} />
        <Route path="/prestamistas/:id" element={<PrestamistaDetailPage />} />

        {/* Cualquier usuario autenticado */}
        <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/solicitudes" element={<ProtectedRoute><SolicitudesPage /></ProtectedRoute>} />
        <Route path="/solicitudes/:id" element={<ProtectedRoute><SolicitudDetailPage /></ProtectedRoute>} />

        {/* Cliente */}
        <Route path="/campos" element={<ProtectedRoute roles={["CLIENTE", "ADMIN"]}><CamposPage /></ProtectedRoute>} />
        <Route path="/campos/:id" element={<ProtectedRoute roles={["CLIENTE", "ADMIN"]}><CampoDetailPage /></ProtectedRoute>} />

        {/* Prestamista */}
        <Route path="/mis-servicios" element={<ProtectedRoute roles={["PRESTAMISTA"]}><MisServiciosPage /></ProtectedRoute>} />
        <Route path="/precios" element={<ProtectedRoute roles={["PRESTAMISTA", "ADMIN"]}><PreciosPage /></ProtectedRoute>} />

        {/* Administración */}
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={["ADMIN"]}><UsuariosPage /></ProtectedRoute>} />
        <Route path="/admin/provincias" element={<ProtectedRoute roles={["ADMIN"]}><ProvinciasPage /></ProtectedRoute>} />
        <Route path="/admin/localidades" element={<ProtectedRoute roles={["ADMIN"]}><LocalidadesPage /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute roles={["ADMIN"]}><CategoriasPage /></ProtectedRoute>} />
        <Route path="/admin/insumos" element={<ProtectedRoute roles={["ADMIN"]}><InsumosPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
