/** Test unitario de componente: el historial se arma con los eventos y cae al resumen de pasos si no hay ninguno. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Solicitud, SolicitudEvento } from "../api/types";
import { SolicitudTimeline } from "./SolicitudTimeline";

const evento = (e: Partial<SolicitudEvento>): SolicitudEvento => ({
  id_evento: 1,
  id_solicitud: 5,
  tipo: "transicion",
  estado_desde: null,
  estado_hasta: null,
  id_actor: 2,
  actor_rol: "PRODUCTOR",
  actor_nombre: "Carlos Ferreyra",
  detalle: null,
  created_at: "2026-09-01T12:00:00.000Z",
  ...e,
});

const solicitud = (eventos?: SolicitudEvento[]): Solicitud =>
  ({ id_solicitud: 5, estado: "completada", solicitud_evento: eventos }) as Solicitud;

describe("SolicitudTimeline", () => {
  it("lista cada evento con su autor y su motivo", () => {
    render(
      <SolicitudTimeline
        s={solicitud([
          evento({ id_evento: 1, tipo: "creada", estado_hasta: "pendiente" }),
          evento({ id_evento: 2, estado_desde: "pendiente", estado_hasta: "rechazada", actor_rol: "CONTRATISTA", actor_nombre: "Pedro Molina", detalle: "No llego con la máquina" }),
        ])}
      />,
    );
    expect(screen.getByText("Solicitud creada")).toBeInTheDocument();
    expect(screen.getByText("Solicitud rechazada")).toBeInTheDocument();
    expect(screen.getByText("Pedro Molina")).toBeInTheDocument();
    expect(screen.getByText("No llego con la máquina")).toBeInTheDocument();
  });

  it("marca como aproximados los eventos reconstruidos por el backfill", () => {
    render(<SolicitudTimeline s={solicitud([evento({ tipo: "creada", estado_hasta: "pendiente", actor_rol: "SISTEMA", actor_nombre: null, id_actor: null })])} />);
    expect(screen.getByText("fecha aproximada")).toBeInTheDocument();
    expect(screen.getByText("Por el sistema")).toBeInTheDocument();
  });

  it("sin eventos muestra solo el resumen de pasos", () => {
    render(<SolicitudTimeline s={solicitud(undefined)} />);
    expect(screen.queryByText("Historial")).not.toBeInTheDocument();
    expect(screen.getByText("Solicitada")).toBeInTheDocument();
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });
});
