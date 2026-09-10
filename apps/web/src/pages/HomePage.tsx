import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LinkButton } from "../components/ui";

export default function HomePage() {
  const { user, isCliente, isPrestamista, isAdmin } = useAuth();

  return (
    <div className="flex flex-col gap-12 py-6 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
      <section className="w-full space-y-6 lg:w-1/2">
        <p className="inline-flex items-center rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-500/40">
          AgroApp · Servicios agrícolas
        </p>

        <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
          Conectá productores y contratistas
          <span className="block text-emerald-400">de forma simple y ordenada.</span>
        </h1>

        <p className="text-sm text-slate-300 sm:text-base">
          Los prestamistas publican sus servicios de siembra, cosecha o fumigación con precio por hectárea.
          Los clientes registran sus campos, comparan y solicitan el servicio que necesitan. Todo el
          seguimiento de la solicitud, en un solo lugar.
        </p>

        <div className="flex flex-wrap gap-3">
          <LinkButton to="/servicios">Ver servicios</LinkButton>
          <LinkButton to="/prestamistas" variant="ghost">
            Buscar prestamistas
          </LinkButton>
          {!user && (
            <LinkButton to="/auth" variant="secondary">
              Crear cuenta
            </LinkButton>
          )}
        </div>
      </section>

      <section className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-6 shadow-xl lg:w-1/2">
        {user ? (
          <>
            <h2 className="text-lg font-semibold text-emerald-100">Hola, {user.nombre} 👋</h2>
            <p className="mt-1 text-sm text-slate-400">¿Qué querés hacer hoy?</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {isCliente && (
                <>
                  <QuickLink to="/campos" title="Mis campos" text="Registrá tus lotes con coordenadas y hectáreas." />
                  <QuickLink to="/servicios" title="Solicitar un servicio" text="Elegí un servicio y pedilo para uno de tus campos." />
                  <QuickLink to="/solicitudes" title="Mis solicitudes" text="Seguí el estado de cada pedido." />
                </>
              )}
              {isPrestamista && (
                <>
                  <QuickLink to="/mis-servicios" title="Mis servicios" text="Publicá y editá los servicios que ofrecés." />
                  <QuickLink to="/precios" title="Precios" text="Mantené el historial de precios por hectárea." />
                  <QuickLink to="/solicitudes" title="Solicitudes recibidas" text="Aceptá, rechazá o completá trabajos." />
                </>
              )}
              {isAdmin && (
                <>
                  <QuickLink to="/admin/usuarios" title="Usuarios" text="Alta, roles y datos de los usuarios." />
                  <QuickLink to="/admin/categorias" title="Catálogos" text="Categorías, insumos, provincias y localidades." />
                </>
              )}
              <QuickLink to="/perfil" title="Mi perfil" text="Actualizá tus datos de contacto y localidad." />
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-emerald-100">¿Cómo funciona?</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400">1.</span>
                El <b>prestamista</b> publica un servicio dentro de una categoría y le pone precio por hectárea.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400">2.</span>
                El <b>cliente</b> registra sus campos y solicita el servicio indicando cuántas hectáreas trabajar.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-emerald-400">3.</span>
                El prestamista <b>acepta</b> la solicitud, realiza el trabajo y la marca como <b>completada</b>.
              </li>
            </ol>
            <p className="mt-5 text-xs text-slate-400">
              <Link to="/auth" className="text-emerald-300 underline-offset-2 hover:underline">
                Ingresá o creá una cuenta
              </Link>{" "}
              como cliente o prestamista para empezar.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function QuickLink({ to, title, text }: { to: string; title: string; text: string }) {
  return (
    <li>
      <Link
        to={to}
        className="block h-full rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition hover:border-emerald-500/50 hover:bg-slate-900"
      >
        <span className="block text-sm font-semibold text-emerald-200">{title}</span>
        <span className="mt-1 block text-xs text-slate-400">{text}</span>
      </Link>
    </li>
  );
}
