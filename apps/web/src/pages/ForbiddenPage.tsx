import { LinkButton } from "../components/ui";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-black text-slate-700">403</p>
      <h1 className="mt-2 text-xl font-semibold text-white">No tenés permisos para ver esta página</h1>
      <p className="mt-2 text-sm text-slate-400">Tu usuario no tiene el rol necesario para acceder a esta sección.</p>
      <div className="mt-6">
        <LinkButton to="/">Volver al inicio</LinkButton>
      </div>
    </div>
  );
}
