/**
 * Test de integración: levanta la app Express completa contra la base de datos
 * local (requiere `pnpm db:migrate && pnpm db:seed`) y recorre el caso de uso
 * principal: login → cliente crea campo → solicita servicio → prestamista acepta.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@repo/db";
import { createApp } from "../src/core/http/expressApp.js";

// Serialización de BigInt igual que en src/index.ts
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

let clienteToken: string;
let prestamistaToken: string;
let adminToken: string;
let campoId: number;
let solicitudId: number;
let servicioId: number;

beforeAll(async () => {
  clienteToken = await login("cliente@agroapp.dev", "Cliente123!");
  prestamistaToken = await login("prestamista@agroapp.dev", "Prestamista123!");
  adminToken = await login("admin@agroapp.dev", "Admin123!");
  const servicios = await request(app).get("/servicios").query({ q: "Siembra directa" });
  servicioId = servicios.body[0].id_servicio;
});

afterAll(async () => {
  // Limpieza de lo creado por el test
  if (solicitudId) await prisma.solicitud.deleteMany({ where: { id_solicitud: BigInt(solicitudId) } });
  if (campoId) await prisma.campo.deleteMany({ where: { id_campo: BigInt(campoId) } });
  await prisma.$disconnect();
});

describe("autenticación", () => {
  it("rechaza credenciales inválidas con 401", async () => {
    const res = await request(app).post("/auth/login").send({ email: "cliente@agroapp.dev", password: "mal" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("valida el body con 400 y detalles", async () => {
    const res = await request(app).post("/auth/login").send({ email: "no-es-email" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("GET /auth/me devuelve el usuario del token sin password_hash", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${clienteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("cliente@agroapp.dev");
    expect(res.body.roles).toContain("CLIENTE");
    expect(res.body.password_hash).toBeUndefined();
  });
});

describe("protección de rutas por rol", () => {
  it("bloquea rutas privadas sin token", async () => {
    const res = await request(app).get("/campos");
    expect(res.status).toBe(401);
  });

  it("un CLIENTE no puede escribir catálogos (403)", async () => {
    const res = await request(app)
      .post("/provincias")
      .set("Authorization", `Bearer ${clienteToken}`)
      .send({ nombre: "Prohibida" });
    expect(res.status).toBe(403);
  });

  it("un ADMIN sí puede listar usuarios", async () => {
    const res = await request(app).get("/usuarios").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("caso de uso: solicitar un servicio y aceptarlo", () => {
  it("el cliente crea un campo propio", async () => {
    const res = await request(app)
      .post("/campos")
      .set("Authorization", `Bearer ${clienteToken}`)
      .send({ coordenadas: "-33.0, -60.0", hectareas: 80 });
    expect(res.status).toBe(201);
    campoId = res.body.id_campo;
    expect(res.body.cliente_profile.users.email).toBe("cliente@agroapp.dev");
  });

  it("el cliente solicita el servicio y el precio se calcula con el precio vigente", async () => {
    const res = await request(app)
      .post("/solicitudes")
      .set("Authorization", `Bearer ${clienteToken}`)
      .send({ id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 10, insumos: [] });
    expect(res.status).toBe(201);
    solicitudId = res.body.id_solicitud;
    expect(res.body.estado).toBe("pendiente");
    expect(Number(res.body.precio_servicio)).toBe(45000 * 10);
    expect(Number(res.body.precio_total)).toBe(45000 * 10);
    expect(res.body.prestamista_profile.users.email).toBe("prestamista@agroapp.dev");
  });

  it("el cliente no puede aceptar su propia solicitud", async () => {
    const res = await request(app)
      .patch(`/solicitudes/${solicitudId}/estado`)
      .set("Authorization", `Bearer ${clienteToken}`)
      .send({ estado: "aceptada" });
    expect(res.status).toBe(403);
  });

  it("el prestamista la acepta y luego no puede rechazarla", async () => {
    const ok = await request(app)
      .patch(`/solicitudes/${solicitudId}/estado`)
      .set("Authorization", `Bearer ${prestamistaToken}`)
      .send({ estado: "aceptada" });
    expect(ok.status).toBe(200);
    expect(ok.body.estado).toBe("aceptada");

    const bad = await request(app)
      .patch(`/solicitudes/${solicitudId}/estado`)
      .set("Authorization", `Bearer ${prestamistaToken}`)
      .send({ estado: "rechazada" });
    expect(bad.status).toBe(409);
    expect(bad.body.code).toBe("INVALID_TRANSITION");
  });

  it("el detalle incluye servicio, categoría, campo, cliente y prestamista", async () => {
    const res = await request(app)
      .get(`/solicitudes/${solicitudId}`)
      .set("Authorization", `Bearer ${clienteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.servicio.categoria.nombre).toBe("Siembra");
    expect(res.body.campo.id_campo).toBe(campoId);
    expect(res.body.cliente_profile.users.nombre).toBeDefined();
  });
});
