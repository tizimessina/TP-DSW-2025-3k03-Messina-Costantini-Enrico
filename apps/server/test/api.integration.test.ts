/**
 * Test de integración: app Express completa contra la base local con el seed cargado.
 * Recorre el negocio de punta a punta: publicar → solicitar (con insumos) → aceptar → completar → valorar,
 * más cancelación, permisos y visibilidad de contacto.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "@repo/db";
import { createApp } from "../src/core/http/expressApp.js";

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token as string;
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

let productor: string, contratista: string, admin: string;
let campoId: number, servicioId: number, solicitudId: number, solicitud2Id: number;
const created: { servicios: number[]; campos: number[]; solicitudes: number[] } = { servicios: [], campos: [], solicitudes: [] };

beforeAll(async () => {
  productor = await login("productor@agroapp.dev", "Productor123!");
  contratista = await login("contratista@agroapp.dev", "Contratista123!");
  admin = await login("admin@agroapp.dev", "Admin123!");
});

afterAll(async () => {
  await prisma.solicitud.deleteMany({ where: { id_solicitud: { in: created.solicitudes.map(BigInt) } } });
  await prisma.campo.deleteMany({ where: { id_campo: { in: created.campos.map(BigInt) } } });
  await prisma.servicio.deleteMany({ where: { id_servicio: { in: created.servicios.map(BigInt) } } });
  await prisma.$disconnect();
});

describe("autenticación y errores", () => {
  it("rechaza credenciales inválidas con 401 y el mismo mensaje", async () => {
    const res = await request(app).post("/auth/login").send({ email: "productor@agroapp.dev", password: "mal" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
  it("valida el body con 400 y detalles", async () => {
    const res = await request(app).post("/auth/login").send({ email: "no-es-email" });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
  it("rutas desconocidas devuelven 404 JSON", async () => {
    const res = await request(app).get("/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
  it("GET /auth/me devuelve roles y perfil del subtipo sin password_hash", async () => {
    const res = await request(app).get("/auth/me").set(auth(contratista));
    expect(res.body.roles).toEqual(["CONTRATISTA"]);
    expect(res.body.contratista.anios_experiencia).toBe(15);
    expect(res.body.password_hash).toBeUndefined();
  });
  it("el registro no permite ser productor y contratista a la vez ni ADMIN", async () => {
    const res = await request(app).post("/auth/register").send({ email: "x@x.dev", password: "Password1!", nombre: "X", apellido: "Y", rol: "ADMIN" });
    expect(res.status).toBe(400);
  });
});

describe("permisos y privacidad", () => {
  it("un PRODUCTOR no puede escribir catálogos ni listar usuarios", async () => {
    expect((await request(app).post("/provincias").set(auth(productor)).send({ nombre: "X" })).status).toBe(403);
    expect((await request(app).get("/usuarios").set(auth(productor))).status).toBe(403);
  });
  it("el listado público de contratistas no expone email ni domicilio", async () => {
    const res = await request(app).get("/contratistas");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    const u = res.body.items[0].users;
    expect(u.nombre).toBeDefined();
    expect(u.email).toBeUndefined();
    expect(u.domicilio).toBeUndefined();
  });
  it("el admin no puede quitarse el rol ADMIN siendo el único", async () => {
    const me = await request(app).get("/auth/me").set(auth(admin));
    const res = await request(app).put(`/usuarios/${me.body.id_user}`).set(auth(admin)).send({ roles: ["PRODUCTOR"] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("LAST_ADMIN");
  });
});

describe("cercanía", () => {
  it("con id_campo filtra por la localidad del campo y cae a provincia si no hay nadie", async () => {
    const campos = await request(app).get("/campos").set(auth(productor));
    const campo = campos.body.find((c: any) => c.nombre.includes("Lote 1"));
    const res = await request(app).get("/contratistas").query({ id_campo: campo.id_campo });
    expect(res.status).toBe(200);
    expect(["localidad", "provincia"]).toContain(res.body.alcance);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});

describe("caso de uso completo", () => {
  it("el contratista publica un servicio con precio inicial (vigente desde hoy)", async () => {
    const cat = await request(app).get("/categorias-servicio");
    const res = await request(app).post("/servicios").set(auth(contratista)).send({ nombre: "Test integración", id_categoria: cat.body[0].id_categoria, precio_inicial: 1000 });
    expect(res.status).toBe(201);
    servicioId = res.body.id_servicio;
    created.servicios.push(servicioId);
    expect(Number(res.body.precio_vigente.valor)).toBe(1000);
  });

  it("el productor registra un campo con localidad y coordenadas", async () => {
    const locs = await request(app).get("/localidades");
    const res = await request(app).post("/campos").set(auth(productor)).send({ nombre: "Lote test", id_localidad: locs.body[0].id_localidad, hectareas: 80, latitud: -33.1, longitud: -60.2 });
    expect(res.status).toBe(201);
    campoId = res.body.id_campo;
    created.campos.push(campoId);
  });

  it("solicita con insumos: solo se cobran los del contratista y el precio sale del catálogo", async () => {
    const insumos = await request(app).get("/insumos");
    const gasoil = insumos.body.find((i: any) => i.nombre === "Gasoil");
    const semilla = insumos.body.find((i: any) => i.nombre === "Semilla de soja");
    const res = await request(app).post("/solicitudes").set(auth(productor)).send({
      id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 10,
      insumos: [
        { id_insumo: semilla.id_insumo, cantidad: 2, proveedor: "CONTRATISTA" },
        { id_insumo: gasoil.id_insumo, cantidad: 100, proveedor: "PRODUCTOR" },
      ],
    });
    expect(res.status).toBe(201);
    solicitudId = res.body.id_solicitud;
    created.solicitudes.push(solicitudId);
    expect(Number(res.body.precio_servicio)).toBe(10000);
    expect(Number(res.body.costo_insumos)).toBe(2 * Number(semilla.precio_referencia));
    expect(res.body.contratista_profile.users.email).toBe("contratista@agroapp.dev"); // contacto visible para la contraparte
  });

  it("no acepta más hectáreas que las del campo ni insumos repetidos", async () => {
    const r1 = await request(app).post("/solicitudes").set(auth(productor)).send({ id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 999 });
    expect(r1.body.code).toBe("HECTAREAS_EXCEDIDAS");
    const r2 = await request(app).post("/solicitudes").set(auth(productor)).send({ id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 1, insumos: [{ id_insumo: 1, cantidad: 1, proveedor: "PRODUCTOR" }, { id_insumo: 1, cantidad: 2, proveedor: "PRODUCTOR" }] });
    expect(r2.status).toBe(400);
  });

  it("el contratista puede ver el campo de la solicitud; otro contratista no", async () => {
    expect((await request(app).get(`/campos/${campoId}`).set(auth(contratista))).status).toBe(200);
    const otro = await login("contratista2@agroapp.dev", "Contratista123!");
    expect((await request(app).get(`/campos/${campoId}`).set(auth(otro))).status).toBe(403);
  });

  it("el productor no puede aceptar; el contratista acepta y se fija fecha_inicio", async () => {
    expect((await request(app).patch(`/solicitudes/${solicitudId}/estado`).set(auth(productor)).send({ estado: "aceptada" })).status).toBe(409);
    const ok = await request(app).patch(`/solicitudes/${solicitudId}/estado`).set(auth(contratista)).send({ estado: "aceptada" });
    expect(ok.status).toBe(200);
    expect(ok.body.fecha_inicio).not.toBeNull();
  });

  it("no se puede reducir el campo por debajo de las hectáreas comprometidas", async () => {
    const res = await request(app).put(`/campos/${campoId}`).set(auth(productor)).send({ hectareas: 5 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("HECTAREAS_COMPROMETIDAS");
  });

  it("no se puede valorar antes de completar; después sí, y una sola vez", async () => {
    expect((await request(app).post("/valoraciones").set(auth(productor)).send({ id_solicitud: solicitudId, puntaje: 5 })).body.code).toBe("NOT_COMPLETED");
    const done = await request(app).patch(`/solicitudes/${solicitudId}/estado`).set(auth(contratista)).send({ estado: "completada" });
    expect(done.status).toBe(200);
    expect(done.body.fecha_fin).not.toBeNull();
    const v = await request(app).post("/valoraciones").set(auth(productor)).send({ id_solicitud: solicitudId, puntaje: 4, comentario: "Bien" });
    expect(v.status).toBe(201);
    expect((await request(app).post("/valoraciones").set(auth(productor)).send({ id_solicitud: solicitudId, puntaje: 1 })).body.code).toBe("ALREADY_RATED");
    const lista = await request(app).get("/valoraciones").query({ id_servicio: servicioId });
    expect(lista.body.cantidad).toBe(1);
    expect(lista.body.promedio).toBe(4);
  });

  it("el historial registra alta, aceptación, completado y valoración con su actor", async () => {
    const res = await request(app).get(`/solicitudes/${solicitudId}`).set(auth(productor));
    expect(res.status).toBe(200);
    const eventos = res.body.solicitud_evento as {
      tipo: string;
      estado_desde: string | null;
      estado_hasta: string | null;
      actor_rol: string;
      actor_nombre: string | null;
      detalle: string | null;
    }[];

    expect(eventos.map((e) => [e.tipo, e.estado_desde, e.estado_hasta])).toEqual([
      ["creada", null, "pendiente"],
      ["transicion", "pendiente", "aceptada"],
      ["transicion", "aceptada", "completada"],
      ["valoracion", null, null],
    ]);
    expect(eventos[0].actor_rol).toBe("PRODUCTOR");
    expect(eventos[1].actor_rol).toBe("CONTRATISTA");
    expect(eventos[1].actor_nombre).toBeTruthy();
    expect(eventos[3].detalle).toContain("4");
  });

  it("el motivo de la cancelación queda en el historial", async () => {
    const s = await request(app).post("/solicitudes").set(auth(productor)).send({ id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 1 });
    created.solicitudes.push(s.body.id_solicitud);
    await request(app).patch(`/solicitudes/${s.body.id_solicitud}/estado`).set(auth(productor)).send({ estado: "cancelada", motivo: "Se pasó la ventana de siembra" });
    const res = await request(app).get(`/solicitudes/${s.body.id_solicitud}`).set(auth(productor));
    const ultimo = res.body.solicitud_evento.at(-1);
    expect(ultimo).toMatchObject({ tipo: "transicion", estado_hasta: "cancelada", actor_rol: "PRODUCTOR", detalle: "Se pasó la ventana de siembra" });
  });

  it("el productor cancela una pendiente con motivo (obligatorio)", async () => {
    const s = await request(app).post("/solicitudes").set(auth(productor)).send({ id_servicio: servicioId, id_campo: campoId, hectareas_trabajadas: 1 });
    solicitud2Id = s.body.id_solicitud;
    created.solicitudes.push(solicitud2Id);
    expect((await request(app).patch(`/solicitudes/${solicitud2Id}/estado`).set(auth(productor)).send({ estado: "cancelada" })).status).toBe(400);
    const ok = await request(app).patch(`/solicitudes/${solicitud2Id}/estado`).set(auth(productor)).send({ estado: "cancelada", motivo: "Ya no lo necesito" });
    expect(ok.body.estado).toBe("cancelada");
    expect((await request(app).delete(`/solicitudes/${solicitud2Id}`).set(auth(productor))).status).toBe(403);
  });

  it("desactivar el servicio lo saca del catálogo pero conserva el detalle para el dueño", async () => {
    expect((await request(app).delete(`/servicios/${servicioId}`).set(auth(contratista))).body.activo).toBe(false);
    const publico = await request(app).get(`/servicios/${servicioId}`);
    expect(publico.status).toBe(404);
    expect((await request(app).get(`/servicios/${servicioId}`).set(auth(contratista))).status).toBe(200);
  });

  it("el resumen del dashboard cuenta por estado", async () => {
    const res = await request(app).get("/auth/me/resumen").set(auth(contratista));
    expect(res.status).toBe(200);
    expect(res.body.solicitudes.completada.cantidad).toBeGreaterThanOrEqual(1);
    expect(res.body.valoracion.cantidad).toBeGreaterThanOrEqual(1);
  });
});
