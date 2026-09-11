/**
 * Test unitario de componente: la campana muestra el contador de no leídas,
 * lista los avisos y al abrir uno lo marca leído y navega a la solicitud.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Notificacion, Usuario } from "../api/types";
import { NotificacionesMenu } from "./NotificacionesMenu";

const mockAuth = vi.hoisted(() => ({ user: null as Usuario | null }));
vi.mock("../auth/AuthContext", () => ({ useAuth: () => mockAuth }));

const api = vi.hoisted(() => ({
  list: vi.fn(),
  leer: vi.fn(),
  leerTodas: vi.fn(),
  noLeidas: vi.fn(),
}));
vi.mock("../api", () => ({ notificaciones: api }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

const productor = { id_user: 2, nombre: "Carlos", apellido: "Ferreyra", roles: ["PRODUCTOR"] } as Usuario;

const aviso = (e: Partial<Notificacion> = {}): Notificacion => ({
  id_notificacion: 1,
  id_solicitud: 7,
  titulo: "Solicitud aceptada",
  cuerpo: "Pedro Molina aceptó Siembra directa en La Esperanza.",
  leida_at: null,
  created_at: "2026-09-11T12:00:00.000Z",
  ...e,
});

const abrirMenu = () => fireEvent.click(screen.getByRole("button", { name: /Notificaciones/ }));

describe("NotificacionesMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.user = productor;
    api.list.mockResolvedValue({ items: [aviso()], total: 1, page: 1, pageSize: 10, totalPages: 1, no_leidas: 1 });
    api.leer.mockResolvedValue({ ok: true, no_leidas: 0 });
    api.leerTodas.mockResolvedValue({ ok: true, marcadas: 1, no_leidas: 0 });
  });

  it("sin sesión no se muestra ni consulta la API", () => {
    mockAuth.user = null;
    const { container } = render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
    expect(api.list).not.toHaveBeenCalled();
  });

  it("muestra el contador de avisos sin leer", async () => {
    render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Notificaciones, 1 sin leer" })).toBeInTheDocument();
  });

  it("lista el aviso al abrir el menú", async () => {
    render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    await screen.findByRole("button", { name: /sin leer/ });
    abrirMenu();
    expect(await screen.findByText("Solicitud aceptada")).toBeInTheDocument();
    expect(screen.getByText(/Pedro Molina aceptó/)).toBeInTheDocument();
  });

  it("al abrir un aviso lo marca leído y navega a la solicitud", async () => {
    render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    await screen.findByRole("button", { name: /sin leer/ });
    abrirMenu();
    fireEvent.click(await screen.findByText("Solicitud aceptada"));
    await waitFor(() => expect(api.leer).toHaveBeenCalledWith(1));
    expect(navigate).toHaveBeenCalledWith("/solicitudes/7");
  });

  it("un aviso ya leído no se vuelve a marcar", async () => {
    api.list.mockResolvedValue({ items: [aviso({ leida_at: "2026-09-11T13:00:00.000Z" })], total: 1, page: 1, pageSize: 10, totalPages: 1, no_leidas: 0 });
    render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    await waitFor(() => expect(api.list).toHaveBeenCalled());
    abrirMenu();
    fireEvent.click(await screen.findByText("Solicitud aceptada"));
    expect(api.leer).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/solicitudes/7");
  });

  it("si la API falla no rompe el encabezado", async () => {
    api.list.mockRejectedValue(new Error("sin red"));
    render(<MemoryRouter><NotificacionesMenu /></MemoryRouter>);
    const boton = await screen.findByRole("button", { name: "Notificaciones" });
    expect(boton).toBeInTheDocument();
  });
});
