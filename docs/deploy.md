# Deploy

| Componente | Proveedor | URL |
|:-|:-|:-|
| Frontend (React + Vite) | Vercel | https://agroapp.dev |
| Backend (Express + Prisma) | Render (web service, plan free) | https://api.agroapp.dev |
| Base de datos (MySQL 8) | Aiven (plan free) | `mysql-agroapp-agroapp.h.aivencloud.com:12600`, base `defaultdb`, SSL requerido |
| Dominio | Name.com | `agroapp.dev` |
| Docs de la API | Swagger UI servido por el backend | https://api.agroapp.dev/docs |

## Credenciales de demo

| Rol | Email | Contraseña |
|:-|:-|:-|
| ADMIN | admin@agroapp.dev | Admin123! |
| CLIENTE | cliente@agroapp.dev | Cliente123! |
| PRESTAMISTA | prestamista@agroapp.dev | Prestamista123! |

Las crea el seed (`packages/database/prisma/seed.ts`). Si se borran, volver a correr el seed contra producción (ver abajo).

## 1. Base de datos (Aiven)

1. Crear el servicio MySQL en Aiven y copiar la **Service URI** (`mysql://avnadmin:...@host:port/defaultdb?ssl-mode=REQUIRED`).
2. Aplicar migraciones y seed desde una máquina local, pasando la URL solo para ese comando (así el `.env` local sigue apuntando a Docker):

```bash
DATABASE_URL="mysql://avnadmin:...@...aivencloud.com:12600/defaultdb?ssl-mode=REQUIRED" pnpm db:deploy
DATABASE_URL="mysql://avnadmin:...@...aivencloud.com:12600/defaultdb?ssl-mode=REQUIRED" pnpm db:seed
```

En PowerShell:

```powershell
$env:DATABASE_URL="mysql://avnadmin:...?ssl-mode=REQUIRED"; pnpm db:deploy; pnpm db:seed; Remove-Item Env:DATABASE_URL
```

Estado: migraciones `20251013205137_agro_dsw` y `20260902011929_init_agro_schema` aplicadas y seed cargado el 2026-09-10.

> Importante: `packages/database/.env` lo lee Prisma CLI **y** el backend en desarrollo. Dejarlo apuntando a la base local de Docker; la URL de Aiven va solo en Render.

## 2. Backend (Render)

Opción A, con blueprint: **New → Blueprint**, elegir el repo; Render lee `render.yaml` de la raíz y crea el servicio `agroapp-api`. Luego cargar a mano `DATABASE_URL` (marcada `sync: false`).

Opción B, a mano (**New → Web Service**):

| Campo | Valor |
|:-|:-|
| Root directory | *(vacío, raíz del monorepo)* |
| Runtime | Node |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/db build && pnpm --filter server build` |
| Start command | `node apps/server/dist/index.js` |
| Health check path | `/health` |

Variables de entorno:

| Variable | Valor |
|:-|:-|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | URI de Aiven con `?ssl-mode=REQUIRED` |
| `JWT_SECRET` | cadena aleatoria larga (Render → *Generate*) |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | `https://agroapp.dev,https://www.agroapp.dev` |

`PORT` la define Render; el backend la lee de `process.env.PORT`.

Dominio: **Settings → Custom domains → Add** `api.agroapp.dev`. Render muestra el CNAME a configurar (ver DNS).

Verificación: `https://api.agroapp.dev/health` responde `{"ok":true}` y `https://api.agroapp.dev/servicios` devuelve los servicios del seed.

> Plan free: el servicio se duerme tras 15 minutos sin tráfico y la primera request tarda ~30 s. Abrir `/health` antes de la defensa.

## 3. Frontend (Vercel)

| Campo | Valor |
|:-|:-|
| Framework preset | Vite |
| Root directory | `apps/web` |
| Build command | `pnpm build` (por defecto) |
| Output directory | `dist` |
| Install command | `pnpm install --frozen-lockfile` (Vercel detecta pnpm por `packageManager` en el root) |

Variable de entorno (Production y Preview): `VITE_API_URL=https://api.agroapp.dev`.

`apps/web/vercel.json` ya tiene el rewrite `/(.*) → /` para que React Router maneje las rutas al refrescar.

Dominios: **Settings → Domains** agregar `agroapp.dev` y `www.agroapp.dev` (redirigir `www` al apex).

## 4. DNS (Name.com)

| Host | Tipo | Valor | Para |
|:-|:-|:-|:-|
| `@` | A | `76.76.21.21` | Vercel |
| `www` | CNAME | `cname.vercel-dns.com` | Vercel |
| `api` | CNAME | `<nombre>.onrender.com` (lo muestra Render al agregar el dominio) | Render |

Propagación: minutos a algunas horas. Ambos proveedores emiten el certificado HTTPS solos cuando el DNS resuelve.

## 5. Smoke test de producción

```bash
curl https://api.agroapp.dev/health
curl -X POST https://api.agroapp.dev/auth/login -H "Content-Type: application/json" \
  -d '{"email":"cliente@agroapp.dev","password":"Cliente123!"}'
```

Y desde el navegador: entrar a https://agroapp.dev, iniciar sesión como cliente, abrir un servicio y solicitarlo; entrar como prestamista y aceptarlo.

## Actualizar producción

- Backend: cada push a `main` redeploya en Render (auto-deploy). Si hay una migración nueva, correr `pnpm db:deploy` contra Aiven **antes** del push.
- Frontend: cada push a `main` redeploya en Vercel.
