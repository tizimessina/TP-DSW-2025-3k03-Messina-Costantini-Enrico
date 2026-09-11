import { cn } from "../../lib/cn";

export type Punto = { label: string; value: number; hint?: string };

/**
 * Gráfico de barras simple, hecho con la grilla de CSS en vez de una librería:
 * son pocos datos, se adapta solo al ancho disponible y hereda el tema claro y
 * oscuro sin configuración. La tabla oculta es la versión accesible.
 */
export function BarChart({
  data,
  formatValue = (n) => String(n),
  className,
  emptyLabel = "Todavía no hay datos para mostrar.",
}: {
  data: Punto[];
  formatValue?: (n: number) => string;
  className?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const hayDatos = data.some((d) => d.value > 0);

  if (data.length === 0 || !hayDatos) {
    return <p className={cn("py-8 text-center text-sm text-stone-500", className)}>{emptyLabel}</p>;
  }

  return (
    <div className={className}>
      <div className="flex h-44 gap-1.5 sm:gap-2" role="presentation">
        {data.map((d) => {
          // Altura mínima visible para que un mes con poco movimiento no desaparezca.
          const alto = max > 0 ? Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0) : 0;
          return (
            <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="h-4 text-[10px] font-semibold text-stone-500 tabular-nums">{d.value > 0 ? formatValue(d.value) : ""}</span>
              {/* El contenedor relativo da el alto de referencia para el porcentaje de la barra. */}
              <div className="relative w-full flex-1">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-[height] duration-500 dark:from-brand-700 dark:to-brand-500"
                  style={{ height: `${alto}%` }}
                  title={d.hint ?? `${d.label}: ${formatValue(d.value)}`}
                />
              </div>
              <span className="w-full truncate text-center text-[11px] text-stone-500">{d.label}</span>
            </div>
          );
        })}
      </div>

      {/* Misma información en texto, para lectores de pantalla. */}
      <table className="sr-only">
        <caption>Valores por período</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
