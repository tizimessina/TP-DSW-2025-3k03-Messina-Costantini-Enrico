# AgroApp — guía para Claude Code

TP de Desarrollo de Software (UTN FRRo, 3k03, 2025). Grupo: Tiziano Messina (52911) y Jeremías Costantini (53112).
Conecta **clientes** (productores agropecuarios) con **prestamistas** (contratistas rurales): el prestamista publica servicios con precio por hectárea; el cliente registra campos y solicita servicios; el prestamista acepta/rechaza/completa la solicitud.

Los requisitos de la cátedra están en `../docs-for-agroapp/` (README.md, FAQ.md, docs.md, proposal.md, MODELODEDATOS.png). Instancia objetivo: **Aprobación en Examen**. Toda decisión se toma en función de esa checklist.

## Stack

- Monorepo **pnpm 8 + Turborepo 2**. Workspaces: `apps/*`, `packages/*`.
- `apps/server`: Node + **Express 5** + TypeScript (ESM, `NodeNext`), validación **Zod 4**, `morgan`, `cors`, `bcrypt`. Puerto 3000.
- `apps/web`: **React 18 + Vite 5 + Tailwind 3** + `react-router-dom` 7 + `axios`. Tests con Vitest + Testing Library.
- `packages/database` (`@repo/db`): **Prisma 6** + **MySQL**. Exporta `prisma` (singleton) y los tipos del cliente.
- `packages/typescript-config`, `packages/eslint-config`: configs compartidas.
- Deploy: front en Vercel, back en Render, DB en Aiven MySQL, dominio `agroapp.dev`.

## Comandos

```bash
pnpm install                 # instala todo el monorepo
pnpm dev                     # server + web en paralelo (turbo)
pnpm build                   # build de todos los paquetes
pnpm test                    # tests de todos los paquetes
pnpm --filter @repo/db db:migrate   # prisma migrate dev (local)
pnpm --filter @repo/db db:deploy    # prisma migrate deploy (prod)
pnpm --filter @repo/db db:seed      # carga roles, catálogos y usuarios demo
pnpm --filter server dev     # solo backend (tsx watch)
pnpm --filter web dev        # solo frontend
pnpm --filter web test:e2e   # Playwright (levanta server y web solo)
pnpm --filter server docs:export   # regenera docs/api/openapi.json desde los schemas Zod
```

Tests: `apps/server/test/setup.ts` carga `apps/server/.env` antes de que Prisma se conecte, así los tests de integración usan la DB local aunque `packages/database/.env` apunte a producción. Nunca correr tests ni el seed con `DATABASE_URL` de Aiven.

Docs de la API: cada ruta nueva se registra en `apps/server/src/core/docs/openapi.ts` (helper `crud()` o `route()`); Swagger UI en `/docs`.

DB local: contenedor Docker Percona en `localhost:3307`, base `agro-dsw`, usuario `agro-dsw` (ver `packages/database/.env`).
Importante: `@repo/db` se consume compilado (`dist/`), así que después de tocar `schema.prisma` hay que correr `pnpm --filter @repo/db build`.

## Estructura del backend

Cada módulo vive en `apps/server/src/modules/<nombre>/` con exactamente estos archivos:

- `<nombre>.schema.ts` — schemas Zod + tipos DTO inferidos.
- `<nombre>.repository.ts` — único lugar que toca `prisma`.
- `<nombre>.service.ts` — reglas de negocio; traduce errores Prisma (`P2002`, `P2003`, `P2025`) a `{ status, code, message }`.
- `<nombre>.controller.ts` — parsea request con los schemas, llama al service, responde; todo error va a `next(err)`.
- `<nombre>.router.ts` — define rutas y middlewares; se monta en `src/core/http/expressApp.ts`.

Transversal en `src/core/`: `http/expressApp.ts` (factory `createApp()`), `errors/errorMiddleware.ts`, `auth/` (JWT, `requireAuth`, `requireRole`).

Convenciones:
- IDs son `BigInt` en Prisma; `index.ts` parchea `BigInt.prototype.toJSON` para serializar como number.
- Imports relativos con extensión `.js` (ESM + NodeNext), aunque el archivo sea `.ts`.
- Errores de negocio: `throw { status: 404, code: 'NOT_FOUND', message: '...' }`. El middleware los serializa como `{ code, message, details }`.
- Nunca devolver `password_hash`.

## Estructura del frontend

- `src/api/base.ts` — instancia axios (`VITE_API_URL`) con interceptor de token.
- `src/api/<entidad>.ts` — tipos del modelo + funciones que llaman a la API (la "capa servicio").
- `src/auth/` — `AuthContext`, `useAuth`, `ProtectedRoute`.
- `src/pages/` — una página por ruta; `src/components/` — componentes compartidos (layout, tabla, formularios, toasts).
- Estilos solo con Tailwind, **mobile-first**: escribir la versión chica primero y agregar `md:`/`lg:`.
- No usar `alert()`/`confirm()`: usar los componentes de feedback compartidos.

## Roles y permisos

Roles en DB: `ADMIN`, `CLIENTE`, `PRESTAMISTA` (un usuario puede tener varios). Perfiles 1:1 en `cliente_profile` / `prestamista_profile` / `admin_profile`.

- Lectura de catálogos (provincias, localidades, categorías, insumos, servicios): pública.
- Escritura de catálogos y CRUD de usuarios: `ADMIN`.
- Servicios y precios: `PRESTAMISTA` dueño (o `ADMIN`).
- Campos y crear solicitud: `CLIENTE` dueño.
- Aceptar / rechazar / completar solicitud: `PRESTAMISTA` de esa solicitud.
- Perfil: el propio usuario; no puede cambiarse los roles.

## Git

- Rama por feature: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `test/...`. PR a `main`, nunca push directo.
- Commits en inglés, imperativo, prefijo convencional (`feat:`, `fix:`, `docs:`...).
- Repartir PRs entre ambos integrantes: la cátedra evalúa la participación de cada uno.
- Documentación de entrega en `docs/` (índice en `docs/README.md`), en Markdown.
