import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { Bell, CheckCheck } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificaciones as notificacionesApi } from "../api";
import type { Notificacion } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/cn";
import { fmtDateTime } from "../lib/format";

/** Cada cuánto se vuelve a preguntar por avisos nuevos mientras la pestaña está visible. */
const INTERVALO_MS = 60_000;

export function NotificacionesMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    try {
      const r = await notificacionesApi.list({ pageSize: 10 });
      setItems(r.items);
      setNoLeidas(r.no_leidas);
    } catch {
      // Un fallo puntual del sondeo no debe romper el encabezado; se reintenta al próximo ciclo.
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setNoLeidas(0);
      return;
    }
    cargar();
    // Mientras la pestaña está oculta no tiene sentido sondear.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, INTERVALO_MS);
    const alVolver = () => {
      if (document.visibilityState === "visible") cargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [user, cargar]);

  if (!user) return null;

  const abrir = async (n: Notificacion) => {
    if (!n.leida_at) {
      // Optimista: la campana reacciona al instante y el servidor confirma después.
      setItems((prev) => prev.map((x) => (x.id_notificacion === n.id_notificacion ? { ...x, leida_at: new Date().toISOString() } : x)));
      setNoLeidas((c) => Math.max(0, c - 1));
      notificacionesApi.leer(n.id_notificacion).then((r) => setNoLeidas(r.no_leidas)).catch(() => cargar());
    }
    if (n.id_solicitud) navigate(`/solicitudes/${n.id_solicitud}`);
  };

  const leerTodas = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, leida_at: x.leida_at ?? new Date().toISOString() })));
    setNoLeidas(0);
    await notificacionesApi.leerTodas().catch(() => cargar());
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        className="relative rounded-xl p-2 text-stone-600 transition hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
        onClick={() => cargar()}
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 -translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems anchor="bottom end" className="z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-1.5 shadow-card-hover focus:outline-none dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold">Notificaciones</p>
            {noLeidas > 0 && (
              <button type="button" onClick={leerTodas} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </button>
            )}
          </div>
          <div className="my-1 h-px bg-stone-200 dark:bg-stone-800" />

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-stone-500">{cargando ? "Cargando…" : "No tenés avisos todavía."}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <MenuItem key={n.id_notificacion} as="li">
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={cn(
                      "flex w-full gap-2.5 rounded-lg px-3 py-2.5 text-left transition data-[focus]:bg-stone-100 dark:data-[focus]:bg-stone-800",
                      !n.leida_at && "bg-brand-50/60 dark:bg-brand-900/20",
                    )}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.leida_at ? "bg-transparent" : "bg-brand-600")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{n.titulo}</span>
                      <span className="mt-0.5 block text-xs text-stone-600 dark:text-stone-400">{n.cuerpo}</span>
                      <time dateTime={n.created_at} className="mt-1 block text-[11px] text-stone-400">{fmtDateTime(n.created_at)}</time>
                    </span>
                  </button>
                </MenuItem>
              ))}
            </ul>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
