/**
 * Test unitario de componente: ProtectedRoute redirige sin sesión,
 * muestra 403 sin el rol requerido y renderiza el contenido con el rol correcto.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Usuario } from "../api/types";
import ProtectedRoute from "./ProtectedRoute";

const mockAuth = vi.hoisted(() => ({
  user: null as Usuario | null,
  loading: false as boolean,
  hasRole: ((..._roles: string[]) => false) as (...roles: string[]) => boolean,
}));
vi.mock("./AuthContext", () => ({ useAuth: () => mockAuth }));

const productor = { id_user: 2, email: "productor@agroapp.dev", nombre: "Carlos", apellido: "Ferreyra", roles: ["PRODUCTOR"], productor: null, contratista: null } as Usuario;

function renderAt(path: string, roles?: Usuario["roles"]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/ingresar" element={<p>Pantalla de login</p>} />
        <Route path="/privada" element={<ProtectedRoute roles={roles}><p>Contenido privado</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirige a /ingresar cuando no hay sesión", () => {
    mockAuth.user = null;
    renderAt("/privada");
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("muestra 403 cuando el usuario no tiene el rol requerido", () => {
    mockAuth.user = productor;
    mockAuth.hasRole = (...roles) => roles.some((r) => productor.roles.includes(r as Usuario["roles"][number]));
    renderAt("/privada", ["ADMIN"]);
    expect(screen.getByText(/no tenés permisos/i)).toBeInTheDocument();
  });

  it("renderiza el contenido cuando el usuario tiene el rol", () => {
    mockAuth.user = productor;
    renderAt("/privada", ["PRODUCTOR"]);
    expect(screen.getByText("Contenido privado")).toBeInTheDocument();
  });

  it("muestra el spinner mientras valida la sesión", () => {
    mockAuth.user = null;
    mockAuth.loading = true;
    renderAt("/privada");
    expect(screen.getByLabelText("Cargando")).toBeInTheDocument();
    mockAuth.loading = false;
  });
});
