import { AnimatedPage } from "../components/layout/AppShell";
import { LinkButton } from "../components/ui";

export default function NotFoundPage() {
  return (
    <AnimatedPage className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-stone-200 dark:text-stone-800">404</p>
      <h1 className="mt-2 text-2xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-sm text-stone-500">Puede que el link esté mal o que la página se haya movido.</p>
      <div className="mt-6"><LinkButton to="/">Volver al inicio</LinkButton></div>
    </AnimatedPage>
  );
}
