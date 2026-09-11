/** Test unitario de componente: Stars muestra el promedio y emite la puntuación elegida (output property). */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Stars } from "./index";

describe("Stars", () => {
  it("muestra el valor y la cantidad", () => {
    render(<Stars value={4.5} count={12} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(12)")).toBeInTheDocument();
    expect(screen.getByLabelText("4.5 de 5")).toBeInTheDocument();
  });

  it("indica cuando no hay valoraciones", () => {
    render(<Stars value={null} />);
    expect(screen.getByLabelText("Sin valoraciones")).toBeInTheDocument();
  });

  it("en modo editable emite la puntuación al hacer click", () => {
    const onChange = vi.fn();
    render(<Stars value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "4 estrellas" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
