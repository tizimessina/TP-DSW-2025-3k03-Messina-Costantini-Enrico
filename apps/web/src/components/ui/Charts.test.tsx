/** Test unitario de componente: el gráfico de barras y su versión accesible. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "./Charts";

const datos = [
  { label: "jul 26", value: 0 },
  { label: "ago 26", value: 1000 },
  { label: "sept 26", value: 2000 },
];

describe("BarChart", () => {
  it("dibuja una columna por período con su etiqueta", () => {
    render(<BarChart data={datos} />);
    // Cada período aparece dos veces: en la columna y en la tabla accesible.
    for (const d of datos) expect(screen.getAllByText(d.label)).toHaveLength(2);
  });

  it("expone los valores en una tabla para lectores de pantalla", () => {
    render(<BarChart data={datos} formatValue={(n) => `$ ${n}`} />);
    const tabla = screen.getByRole("table", { name: "Valores por período" });
    expect(tabla).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "ago 26" })).toBeInTheDocument();
  });

  it("sin datos muestra el mensaje de vacío en vez de un gráfico en blanco", () => {
    render(<BarChart data={[]} emptyLabel="Nada por ahora" />);
    expect(screen.getByText("Nada por ahora")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("con todos los valores en cero también muestra el vacío", () => {
    render(<BarChart data={[{ label: "jul 26", value: 0 }]} emptyLabel="Nada por ahora" />);
    expect(screen.getByText("Nada por ahora")).toBeInTheDocument();
  });
});
