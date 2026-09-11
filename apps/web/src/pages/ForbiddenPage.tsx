import { ShieldAlert } from "lucide-react";
import { LinkButton } from "../components/ui";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-harvest-500" />
      <h1 className="mt-4 text-2xl font-bold">No tenés permisos para ver esta página</h1>
      <p className="mt-2 text-sm text-stone-500">Tu usuario no tiene el rol necesario para acceder a esta sección.</p>
      <div className="mt-6"><LinkButton to="/app">Ir a mi panel</LinkButton></div>
    </div>
  );
}
