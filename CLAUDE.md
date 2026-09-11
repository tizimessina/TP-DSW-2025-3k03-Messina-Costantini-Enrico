# AgroApp — guía para Claude Code

TP de Desarrollo de Software (UTN FRRo, 3k03, 2025). Grupo: Tiziano Messina (52911) y Jeremías Costantini (53112).
Conecta **productores** (dueños de campos) con **contratistas** rurales: el contratista publica servicios con precio por hectárea; el productor registra campos y solicita servicios con insumos; el contratista acepta/rechaza/completa; el productor valora.

Los requisitos de la cátedra están en `../docs-for-agroapp/`. Instancia objetivo: **Aprobación en Examen**. El modelo de dominio, el glosario, las reglas y las limitaciones están en `docs/modelo.md`: leerlo antes de tocar lógica de negocio.

## Stack

- Monorepo **pnpm 8 + Turborepo 2**. Workspaces: `apps/*`, `packages/*`.
- `apps/server`: Node + **Express 5** + TypeScript (ESM, `NodeNext`), **Zod 4**, `helmet`, `express-rate-limit`, `morgan`, `cors`, `bcrypt`, `jsonwebtoken`. Puerto 3000.
- `apps/web`: **React 18 + Vite 5 + Tailwind 3** (tema claro/oscuro, tokens `brand`/`sand`/`harvest`), `react-router-dom` 7, `axios`, **Framer Motion**, **Headless UI**, `lucide-react`, `react-leaflet` 4. Tests con Vitest + Testing Library; e2e con Playwright.
- `packages/database` (`@repo/db`): **Prisma 6** + **MySQL**. Una sola migración `0001_init` (con CHECK constraints). Exporta `prisma` y los tipos.
- Deploy: front en Vercel, back en Render, DB en Aiven MySQL, dominio `agroapp.dev`.

## Comandos

```bash
pnpm install
pnpm dev                     # server + web
pnpm build
pnpm test                    # server (unit + integración) y web (componentes)
pnpm db:migrate              # prisma migrate dev (local)
pnpm db:deploy               # prisma migrate deploy (prod)
pnpm db:seed                 # roles, ubicación, catálogos, usuarios demo, campos, servicios, solicitudes, valoraciones
pnpm --filter web test:e2e   # Playwright (levanta server y web solo)
pnpm --filter server docs:export   # regenera docs/api/openapi.json
```

DB local: contenedor Docker Percona en `localhost:3307`, base `agro-dsw`. `apps/server/.env` (gitignored) apunta a la local y tiene prioridad para el backend y los tests; `packages/database/.env` lo usa Prisma CLI. **Nunca** correr tests ni el seed con la URL de Aiven. Después de tocar `schema.prisma`: `pnpm --filter @repo/db build`.

## Backend

Cada módulo en `apps/server/src/modules/<nombre>/`: `schema.ts` (Zod + DTOs), `repository.ts` (único que toca `prisma`), `service.ts` (reglas; errores con los helpers de `core/errors/errors.ts`: `notFound`, `badRequest`, `conflict`, `forbidden`, `translatePrisma`), `controller.ts` (parsea con Zod, `next(err)`), `router.ts` (middlewares y rutas; se monta en `core/http/expressApp.ts`).

Transversal en `src/core/`: `auth/` (JWT solo con `sub`; `requireAuth` revalida roles en DB; `requireRole`, `assertOwnerOrAdmin`, `optionalAuth`), `db/selects.ts` (`publicUserSelect` sin contacto, `contactUserSelect` para las partes de una solicitud), `http/pagination.ts` (`{ items, total, page, pageSize, totalPages }`), `util/dates.ts` (fechas civiles sin desfase UTC: `todayCivil`, `toCivil`), `docs/openapi.ts` (registrar toda ruta nueva con `route()` o `crud()`).

Convenciones: IDs `BigInt` (se serializan como number en `createApp`); imports relativos con `.js`; todo query/param validado con Zod; errores `{ status, code, message }`; nunca devolver `password_hash`.

## Roles y permisos

`ADMIN`, `PRODUCTOR`, `CONTRATISTA`. Productor y contratista son **excluyentes**; ADMIN se suma a cualquiera. Perfiles 1:1 `productor_profile` / `contratista_profile` sincronizados con los roles en una transacción (`usuario.repository.save`).

- Catálogos (provincias, localidades, categorías, insumos): lectura pública, escritura ADMIN. Usuarios: ADMIN.
- Contratistas: lectura pública (sin contacto). Servicios y precios: dueño CONTRATISTA o ADMIN; servicio con baja lógica (`activo`).
- Campos: dueño PRODUCTOR o ADMIN; el contratista de una solicitud puede leer el campo.
- Solicitudes: crea PRODUCTOR; `pendiente → aceptada | rechazada` (contratista) `| cancelada` (productor); `aceptada → completada` (contratista) `| cancelada` (ambos, con motivo). Importes snapshot: precio vigente × ha + insumos del contratista al precio de referencia. Borrado físico solo ADMIN.
- Valoraciones: PRODUCTOR de una solicitud completada, una vez.

## Frontend

- `src/api/types.ts` (modelos) e `index.ts` (funciones por endpoint, agrupadas por recurso). `src/auth/` (`AuthProvider`, `useAuth`, `ProtectedRoute`). `src/components/ui` (design system), `components/feedback.tsx` (`useFeedback().toast/confirm`), `components/layout/AppShell.tsx` (`PublicShell`, `AppLayout`, `AnimatedPage`), `components/MapView.tsx`, `components/SolicitarWizard.tsx`. `src/lib/format.ts` (dinero, fechas civiles en UTC, `pluralize`).
- Rutas públicas bajo `PublicShell` (`/`, `/ingresar`, `/registro`, `/servicios`, `/contratistas`); aplicación bajo `AppLayout` protegido (`/app`, `/perfil`, `/solicitudes`, `/campos`, `/mis-servicios`, `/admin/*`).
- Estilos solo con Tailwind, mobile-first; nada de `alert()`/`confirm()`. El logout navega y limpia sesión dentro de `startTransition` (React Router v7 navega en transición; si no, la ruta protegida redirige a `/ingresar`).
- Los DECIMAL de la API llegan como string: usar `fmtMoney`/`fmtHa`/`Number()`.

## Git

- Rama por feature (`feat/`, `fix/`, `refactor/`, `docs/`, `test/`), PR a `main`. Commits en inglés, imperativo, prefijo convencional.
- Documentación de entrega en `docs/` (índice en `docs/README.md`). Al cambiar rutas o schemas: regenerar OpenAPI, actualizar `docs/modelo.md` y la evidencia de tests.
