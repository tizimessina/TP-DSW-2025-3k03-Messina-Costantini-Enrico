/**
 * Test unitario de componente: AuthPage maneja eventos del usuario (input, submit),
 * llama a login y muestra el error de la API de forma amigable.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ user: null, login: mocks.login, register: mocks.register }),
}));
vi.mock("../components/feedback", () => ({
  useFeedback: () => ({ toast: mocks.toast, confirm: vi.fn() }),
}));
vi.mock("../api/localidades", () => ({ getLocalidades: vi.fn().mockResolvedValue([]) }));

function renderPage(onAuthenticated?: (email: string) => void) {
  return render(
    <MemoryRouter>
      <AuthPage onAuthenticated={onAuthenticated} />
    </MemoryRouter>,
  );
}

describe("AuthPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía email y contraseña al iniciar sesión y notifica al padre (output property)", async () => {
    mocks.login.mockResolvedValue({ id_user: 1, email: "cliente@agroapp.dev", nombre: "Carlos", apellido: "P", roles: ["CLIENTE"] });
    const onAuthenticated = vi.fn();
    renderPage(onAuthenticated);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "cliente@agroapp.dev" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Cliente123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith("cliente@agroapp.dev", "Cliente123!"));
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith("cliente@agroapp.dev"));
    expect(mocks.toast.success).toHaveBeenCalled();
  });

  it("muestra el mensaje de error devuelto por la API", async () => {
    mocks.login.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { code: "INVALID_CREDENTIALS", message: "Credenciales inválidas" } },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "x@x.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "mal" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
  });

  it("cambia a modo registro y muestra los campos adicionales (reactividad ante estado)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Crear una" }));
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText(/Quiero registrarme como/)).toBeInTheDocument();
  });
});
