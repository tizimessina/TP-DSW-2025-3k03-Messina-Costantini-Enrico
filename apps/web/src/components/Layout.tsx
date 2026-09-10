import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useFeedback } from "./feedback";

type NavItem = { to: string; label: string };

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition md:py-1.5 ${
    isActive ? "bg-emerald-600/20 text-emerald-200" : "text-slate-200 hover:bg-slate-800 hover:text-white"
  }`;

export default function Layout() {
  const { user, isAdmin, isCliente, isPrestamista, logout } = useAuth();
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar el menú móvil al navegar
  useEffect(() => setOpen(false), [location.pathname]);

  const publicItems: NavItem[] = [
    { to: "/servicios", label: "Servicios" },
    { to: "/prestamistas", label: "Prestamistas" },
  ];
  const clienteItems: NavItem[] = isCliente
    ? [
        { to: "/campos", label: "Mis campos" },
        { to: "/solicitudes", label: "Mis solicitudes" },
      ]
    : [];
  const prestamistaItems: NavItem[] = isPrestamista
    ? [
        { to: "/mis-servicios", label: "Mis servicios" },
        { to: "/precios", label: "Precios" },
        { to: "/solicitudes", label: "Solicitudes recibidas" },
      ]
    : [];
  const adminItems: NavItem[] = isAdmin
    ? [
        { to: "/admin/usuarios", label: "Usuarios" },
        { to: "/admin/provincias", label: "Provincias" },
        { to: "/admin/localidades", label: "Localidades" },
        { to: "/admin/categorias", label: "Categorías" },
        { to: "/admin/insumos", label: "Insumos" },
        { to: "/solicitudes", label: "Solicitudes" },
      ]
    : [];

  // Evitar duplicados (p. ej. usuario con dos roles)
  const seen = new Set<string>();
  const items = [...publicItems, ...clienteItems, ...prestamistaItems, ...adminItems].filter((i) => {
    if (seen.has(i.to)) return false;
    seen.add(i.to);
    return true;
  });

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada");
    navigate("/");
  };

  const userMenu = user ? (
    <>
      <NavLink to="/perfil" className={linkClass}>
        {user.nombre}
      </NavLink>
      <button
        type="button"
        onClick={handleLogout}
        className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-300 transition hover:bg-slate-800 md:w-auto md:py-1.5"
      >
        Salir
      </button>
    </>
  ) : (
    <NavLink
      to="/auth"
      className="block rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-500 md:py-1.5"
    >
      Ingresar
    </NavLink>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-white">
            AgroApp <span aria-hidden>🌾</span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} className={linkClass}>
                {i.label}
              </NavLink>
            ))}
            <span className="mx-2 h-5 w-px bg-slate-800" />
            {userMenu}
          </nav>

          {/* Botón hamburguesa */}
          <button
            type="button"
            className="rounded-md p-2 text-slate-200 hover:bg-slate-800 md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Navegación móvil */}
        {open && (
          <nav className="border-t border-slate-800 px-4 py-3 md:hidden" aria-label="Principal móvil">
            <div className="flex flex-col gap-1">
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} className={linkClass}>
                  {i.label}
                </NavLink>
              ))}
              <div className="my-2 h-px bg-slate-800" />
              {userMenu}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        AgroApp · TP Desarrollo de Software 2025 · Messina &amp; Costantini
      </footer>
    </div>
  );
}
