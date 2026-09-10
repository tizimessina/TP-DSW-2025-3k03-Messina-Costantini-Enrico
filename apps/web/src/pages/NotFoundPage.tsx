import { LinkButton } from "../components/ui";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-black text-slate-700">404</p>
      <h1 className="mt-2 text-xl font-semibold text-white">Página no encontrada</h1>
      <div className="mt-6">
        <LinkButton to="/">Volver al inicio</LinkButton>
      </div>
    </div>
  );
}
