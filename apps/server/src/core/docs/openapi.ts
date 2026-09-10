/**
 * Documento OpenAPI 3 generado desde los schemas Zod de cada módulo.
 * Se sirve en GET /docs (Swagger UI) y GET /docs/openapi.json, y se exporta a docs/api/openapi.json.
 */
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi, type RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Habilita .openapi() en los schemas Zod (necesario para registry.register)
extendZodWithOpenApi(z);

import { LoginSchema, RegisterSchema, UpdateMeSchema } from "../../modules/auth/auth.schema.js";
import { UsuarioCreateSchema, UsuarioUpdateSchema } from "../../modules/usuario/usuario.schema.js";
import { ProvinciaCreateSchema, ProvinciaUpdateSchema } from "../../modules/provincia/provincia.schema.js";
import { LocalidadCreateSchema, LocalidadUpdateSchema } from "../../modules/localidad/localidad.schema.js";
import { CategoriaServicioCreateSchema, CategoriaServicioUpdateSchema } from "../../modules/categoria-servicio/categoria-servicio.schema.js";
import { InsumoCreateSchema, InsumoUpdateSchema } from "../../modules/insumo/insumo.schema.js";
import { ClienteCreateSchema, ClienteUpdateSchema } from "../../modules/cliente/cliente.schema.js";
import { PrestamistaCreateSchema, PrestamistaQuerySchema, PrestamistaUpdateSchema } from "../../modules/prestamista/prestamista.schema.js";
import { AdminCreateSchema, AdminUpdateSchema } from "../../modules/admin/admin.schema.js";
import { ServicioCreateSchema, ServicioQuerySchema, ServicioUpdateSchema } from "../../modules/servicio/servicio.schema.js";
import { PrecioCreateSchema, PrecioUpdateSchema } from "../../modules/precio/precio.schema.js";
import { CampoCreateSchema, CampoQuerySchema, CampoUpdateSchema } from "../../modules/campo/campo.schema.js";
import { CreateSolicitudInputSchema, SolicitudQuerySchema, UpdateSolicitudEstadoSchema } from "../../modules/solicitud/solicitud.schema.js";

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Token devuelto por POST /auth/login. Enviar como `Authorization: Bearer <token>`.",
});

/* ---------- Schemas comunes ---------- */

const ErrorSchema = registry.register(
  "Error",
  z.object({
    code: z.string().describe("Código de error estable (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, DUPLICATE, ...)"),
    message: z.string(),
    details: z.any().optional().describe("Detalle adicional; en errores de validación, lista de { path, message }"),
  }),
);

const IdParam = z.object({ id: z.coerce.number().int().positive().describe("Identificador numérico") });
const SearchQuery = z.object({ q: z.string().optional().describe("Búsqueda por texto") });

const PublicUserSchema = registry.register(
  "Usuario",
  z.object({
    id_user: z.number(),
    email: z.string(),
    nombre: z.string(),
    apellido: z.string(),
    cuil_cuit: z.string().nullable(),
    fecha_nac: z.string().nullable(),
    domicilio: z.string().nullable(),
    id_localidad: z.number().nullable(),
    roles: z.array(z.enum(["ADMIN", "CLIENTE", "PRESTAMISTA"])),
  }),
);

const AuthResponseSchema = registry.register("AuthResponse", z.object({ token: z.string(), user: PublicUserSchema }));

/* ---------- Helpers ---------- */

type Role = "ADMIN" | "CLIENTE" | "PRESTAMISTA";

const json = (schema: z.ZodTypeAny, description: string) => ({ description, content: { "application/json": { schema } } });
const errors = (...codes: number[]) =>
  Object.fromEntries(
    codes.map((c) => [
      c,
      json(ErrorSchema, { 400: "Datos inválidos", 401: "Sin token o token inválido", 403: "Sin permisos", 404: "No encontrado", 409: "Conflicto" }[c] ?? "Error"),
    ]),
  );

function route(cfg: Omit<RouteConfig, "responses"> & { roles?: Role[]; responses: RouteConfig["responses"] }) {
  const { roles, ...rest } = cfg;
  const desc = roles ? `${rest.description ?? ""}\n\nRequiere rol: ${roles.join(" o ")}.`.trim() : rest.description;
  registry.registerPath({
    ...rest,
    description: desc,
    ...(roles ? { security: [{ bearerAuth: [] }] } : {}),
    responses: { ...rest.responses, ...(roles ? errors(401, 403) : {}) },
  });
}

/** Registra un CRUD estándar: GET /, GET /:id, POST /, PUT /:id, DELETE /:id. */
function crud(opts: {
  tag: string;
  base: string;
  entity: string;
  create: z.ZodTypeAny;
  update: z.ZodTypeAny;
  query?: z.ZodObject<any>;
  readRoles?: Role[];
  writeRoles: Role[];
}) {
  const { tag, base, entity, create, update, query = SearchQuery, readRoles, writeRoles } = opts;
  const any = z.object({}).passthrough();
  route({ tags: [tag], method: "get", path: base, summary: `Listar ${entity}`, roles: readRoles, request: { query }, responses: { 200: json(z.array(any), "Listado") } });
  route({ tags: [tag], method: "get", path: `${base}/{id}`, summary: `Detalle de ${entity}`, roles: readRoles, request: { params: IdParam }, responses: { 200: json(any, "Encontrado"), ...errors(404) } });
  route({ tags: [tag], method: "post", path: base, summary: `Crear ${entity}`, roles: writeRoles, request: { body: json(create, "Datos") }, responses: { 201: json(any, "Creado"), ...errors(400, 409) } });
  route({ tags: [tag], method: "put", path: `${base}/{id}`, summary: `Actualizar ${entity}`, roles: writeRoles, request: { params: IdParam, body: json(update, "Datos") }, responses: { 200: json(any, "Actualizado"), ...errors(400, 404, 409) } });
  route({ tags: [tag], method: "delete", path: `${base}/{id}`, summary: `Eliminar ${entity}`, roles: writeRoles, request: { params: IdParam }, responses: { 204: { description: "Eliminado" }, ...errors(404, 409) } });
}

/* ---------- Rutas ---------- */

route({ tags: ["Sistema"], method: "get", path: "/health", summary: "Health check", responses: { 200: json(z.object({ ok: z.boolean() }), "OK") } });

route({ tags: ["Auth"], method: "post", path: "/auth/login", summary: "Iniciar sesión", request: { body: json(LoginSchema, "Credenciales") }, responses: { 200: json(AuthResponseSchema, "Token JWT y usuario"), ...errors(400, 401) } });
route({ tags: ["Auth"], method: "post", path: "/auth/register", summary: "Registro público como CLIENTE o PRESTAMISTA", request: { body: json(RegisterSchema, "Datos") }, responses: { 201: json(AuthResponseSchema, "Usuario creado y logueado"), ...errors(400, 409) } });
route({ tags: ["Auth"], method: "get", path: "/auth/me", summary: "Usuario autenticado", roles: ["ADMIN", "CLIENTE", "PRESTAMISTA"], responses: { 200: json(PublicUserSchema, "Perfil") } });
route({ tags: ["Auth"], method: "put", path: "/auth/me", summary: "Editar el propio perfil (sin roles)", roles: ["ADMIN", "CLIENTE", "PRESTAMISTA"], request: { body: json(UpdateMeSchema, "Datos") }, responses: { 200: json(PublicUserSchema, "Perfil actualizado"), ...errors(400) } });

crud({ tag: "Usuarios", base: "/usuarios", entity: "usuario", create: UsuarioCreateSchema, update: UsuarioUpdateSchema, query: z.object({ q: z.string().optional(), role: z.enum(["ADMIN", "CLIENTE", "PRESTAMISTA"]).optional(), id_localidad: z.coerce.number().optional() }), readRoles: ["ADMIN"], writeRoles: ["ADMIN"] });
crud({ tag: "Provincias", base: "/provincias", entity: "provincia", create: ProvinciaCreateSchema, update: ProvinciaUpdateSchema, writeRoles: ["ADMIN"] });
crud({ tag: "Localidades", base: "/localidades", entity: "localidad", create: LocalidadCreateSchema, update: LocalidadUpdateSchema, query: z.object({ q: z.string().optional(), id_provincia: z.coerce.number().optional() }), writeRoles: ["ADMIN"] });
crud({ tag: "Categorías", base: "/categorias-servicio", entity: "categoría de servicio", create: CategoriaServicioCreateSchema, update: CategoriaServicioUpdateSchema, writeRoles: ["ADMIN"] });
crud({ tag: "Insumos", base: "/insumos", entity: "insumo", create: InsumoCreateSchema, update: InsumoUpdateSchema, writeRoles: ["ADMIN"] });
crud({ tag: "Clientes", base: "/clientes", entity: "perfil de cliente", create: ClienteCreateSchema, update: ClienteUpdateSchema, readRoles: ["ADMIN"], writeRoles: ["ADMIN"] });
crud({ tag: "Prestamistas", base: "/prestamistas", entity: "perfil de prestamista", create: PrestamistaCreateSchema, update: PrestamistaUpdateSchema, query: PrestamistaQuerySchema, writeRoles: ["ADMIN"] });
crud({ tag: "Admins", base: "/admins", entity: "perfil de administrador", create: AdminCreateSchema, update: AdminUpdateSchema, readRoles: ["ADMIN"], writeRoles: ["ADMIN"] });
crud({ tag: "Servicios", base: "/servicios", entity: "servicio", create: ServicioCreateSchema, update: ServicioUpdateSchema, query: ServicioQuerySchema, writeRoles: ["PRESTAMISTA", "ADMIN"] });
crud({ tag: "Campos", base: "/campos", entity: "campo", create: CampoCreateSchema, update: CampoUpdateSchema, query: CampoQuerySchema, readRoles: ["CLIENTE", "ADMIN"], writeRoles: ["CLIENTE", "ADMIN"] });

// Precios: rutas extra por servicio
const anyObj = z.object({}).passthrough();
route({ tags: ["Precios"], method: "get", path: "/precios", summary: "Listar precios de un servicio", request: { query: z.object({ id_servicio: z.coerce.number().optional() }) }, responses: { 200: json(z.array(anyObj), "Historial (vacío si no se indica id_servicio)") } });
route({ tags: ["Precios"], method: "get", path: "/precios/servicio/{id_servicio}", summary: "Historial de precios del servicio", request: { params: z.object({ id_servicio: z.coerce.number() }) }, responses: { 200: json(z.array(anyObj), "Historial ordenado por fecha desc") } });
route({ tags: ["Precios"], method: "get", path: "/precios/servicio/{id_servicio}/vigente", summary: "Precio vigente del servicio", request: { params: z.object({ id_servicio: z.coerce.number() }) }, responses: { 200: json(anyObj, "Precio vigente"), ...errors(404) } });
route({ tags: ["Precios"], method: "get", path: "/precios/{id}", summary: "Detalle de precio", request: { params: IdParam }, responses: { 200: json(anyObj, "Precio"), ...errors(404) } });
route({ tags: ["Precios"], method: "post", path: "/precios", summary: "Cargar precio (dueño del servicio)", roles: ["PRESTAMISTA", "ADMIN"], request: { body: json(PrecioCreateSchema, "Datos") }, responses: { 201: json(anyObj, "Creado"), ...errors(400, 404, 409) } });
route({ tags: ["Precios"], method: "put", path: "/precios/{id}", summary: "Actualizar precio", roles: ["PRESTAMISTA", "ADMIN"], request: { params: IdParam, body: json(PrecioUpdateSchema, "Datos") }, responses: { 200: json(anyObj, "Actualizado"), ...errors(400, 404, 409) } });
route({ tags: ["Precios"], method: "delete", path: "/precios/{id}", summary: "Eliminar precio", roles: ["PRESTAMISTA", "ADMIN"], request: { params: IdParam }, responses: { 200: json(z.object({ ok: z.boolean() }), "Eliminado"), ...errors(404) } });

// Solicitudes (caso de uso principal)
const allRoles: Role[] = ["ADMIN", "CLIENTE", "PRESTAMISTA"];
route({ tags: ["Solicitudes"], method: "get", path: "/solicitudes", summary: "Listar solicitudes (el cliente ve las suyas, el prestamista las recibidas, el admin todas)", roles: allRoles, request: { query: SolicitudQuerySchema }, responses: { 200: json(z.array(anyObj), "Listado con servicio, campo, cliente y prestamista") } });
route({ tags: ["Solicitudes"], method: "get", path: "/solicitudes/{id}", summary: "Detalle completo de una solicitud", roles: allRoles, request: { params: IdParam }, responses: { 200: json(anyObj, "Solicitud con servicio, categoría, campo, cliente, prestamista e insumos"), ...errors(404) } });
route({ tags: ["Solicitudes"], method: "post", path: "/solicitudes", summary: "Solicitar un servicio", description: "El cliente se toma del token y el prestamista del servicio. precio_servicio = precio vigente × hectáreas; precio_total suma los insumos.", roles: ["CLIENTE"], request: { body: json(CreateSolicitudInputSchema, "Datos") }, responses: { 201: json(anyObj, "Solicitud creada en estado pendiente"), ...errors(400, 404, 409) } });
route({ tags: ["Solicitudes"], method: "patch", path: "/solicitudes/{id}/estado", summary: "Cambiar estado", description: "Transiciones válidas: pendiente → aceptada | rechazada; aceptada → completada. Solo el prestamista de la solicitud (o ADMIN).", roles: ["PRESTAMISTA", "ADMIN"], request: { params: IdParam, body: json(UpdateSolicitudEstadoSchema, "Nuevo estado") }, responses: { 200: json(anyObj, "Solicitud actualizada"), ...errors(400, 404, 409) } });
route({ tags: ["Solicitudes"], method: "delete", path: "/solicitudes/{id}", summary: "Cancelar solicitud (cliente, solo si está pendiente)", roles: ["CLIENTE", "ADMIN"], request: { params: IdParam }, responses: { 204: { description: "Cancelada" }, ...errors(404, 409) } });

/* ---------- Documento ---------- */

export function generateOpenApiDocument(serverUrl = "http://localhost:3000") {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "AgroApp API",
      version: "1.0.0",
      description:
        "API REST de AgroApp (TP Desarrollo de Software 2025, UTN FRRo). Conecta clientes (productores) con prestamistas (contratistas rurales).\n\n" +
        "Autenticación con JWT: obtener el token en `POST /auth/login` y usar el botón **Authorize**. Roles: ADMIN, CLIENTE, PRESTAMISTA.",
    },
    servers: [
      { url: serverUrl, description: "Servidor actual" },
      { url: "https://api.agroapp.dev", description: "Producción" },
    ],
    tags: [
      { name: "Auth" }, { name: "Usuarios" }, { name: "Provincias" }, { name: "Localidades" }, { name: "Categorías" },
      { name: "Insumos" }, { name: "Clientes" }, { name: "Prestamistas" }, { name: "Admins" }, { name: "Servicios" },
      { name: "Precios" }, { name: "Campos" }, { name: "Solicitudes" }, { name: "Sistema" },
    ],
  });
}
