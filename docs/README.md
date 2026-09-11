# Documentación — AgroApp (TP DSW 2025, 3k03)

Punto de entrada de la documentación exigida por la cátedra ([docs.md](https://github.com/) de la consigna). Todo en Markdown dentro de este directorio.

## Grupo
* 53112 - Costantini, Jeremías
* 52911 - Messina, Tiziano Leonel

## Índice

| Contenido | Dónde |
|:-|:-|
| Propuesta actualizada (tema, modelo, alcance) | [../proposal.md](../proposal.md) |
| Modelo de datos (DER) | [img/MODELODEDATOS.png](img/MODELODEDATOS.png) |
| Links a los PR | [pull-requests.md](pull-requests.md) |
| Instrucciones de instalación y ejecución | [instalacion.md](instalacion.md) |
| Minutas de reunión y avance | [minutas/](minutas/) |
| Tracking de features, bugs e issues | [tracking.md](tracking.md) |
| Documentación de la API (OpenAPI + Swagger UI) | [api/README.md](api/README.md) |
| Evidencia de ejecución de tests automáticos | [tests/evidencia.md](tests/evidencia.md) |
| Deploy, URLs y credenciales de demo | [deploy.md](deploy.md) |
| Video de demo | [video.md](video.md) |
| Guion del video | [video-guion.md](video-guion.md) |

## Resumen técnico

- **Arquitectura**: monorepo pnpm + Turborepo. Backend y frontend agnósticos, comunicados por una API REST con JSON.
- **Backend** (`apps/server`): Node 22 + Express 5 + TypeScript. Capas por módulo: `router → controller → service → repository`. Validación con Zod; errores uniformes `{ code, message, details }`. Persistencia con **Prisma** sobre **MySQL** (Aiven en producción, Docker Percona en local). Autenticación **JWT** propia con tres niveles de acceso (`ADMIN`, `CLIENTE`, `PRESTAMISTA`) y middlewares `requireAuth` / `requireRole`. Ambientes vía `.env`.
- **Frontend** (`apps/web`): React 18 + Vite + TypeScript + **Tailwind** (mobile-first, 3 breakpoints). React Router con `ProtectedRoute` por rol, contexto de auth, capa de servicios en `src/api/*` con tipos del dominio, componentes con input/output properties, manejo de errores con toasts.
- **Tests**: Vitest en back (unitarios + integración con Supertest sobre la DB) y front (componentes con Testing Library); **Playwright** para el e2e del caso de uso principal.

## Alcance implementado

| Req | Detalle |
|:-|:-|
| CRUD simple | Categoría de servicio, Insumo, Provincia, Usuario (con roles) |
| CRUD dependiente | Localidad → Provincia; Servicio → Categoría + Prestamista; Precio → Servicio; Campo → Cliente; Solicitud → Servicio + Campo + Cliente + Prestamista (+ insumos) |
| Listado + detalle | Servicios filtrados por categoría y texto → detalle con categoría, prestamista e historial de precios. Prestamistas filtrados por provincia/localidad → detalle con sus servicios. Campos del cliente → detalle con sus solicitudes. Solicitudes filtradas por estado → detalle con las 5 clases involucradas |
| CUU | 1. **Publicar un servicio** (prestamista, con precio inicial). 2. **Solicitar un servicio** (cliente: elige campo propio, hectáreas e insumos; el sistema calcula precio vigente × hectáreas + insumos). 3. **Gestionar la solicitud** (prestamista acepta / rechaza / completa; transiciones validadas). Los tres se encadenan: la salida de uno es la entrada del siguiente |
| Adicional | Valoración del servicio por parte del cliente (ver [tracking.md](tracking.md)) |
