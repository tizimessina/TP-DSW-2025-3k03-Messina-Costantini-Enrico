# AgroApp — TP DSW 2025 (3k03)

Plataforma que conecta **productores agropecuarios (clientes)** con **contratistas rurales (prestamistas)**: los prestamistas publican servicios (siembra, cosecha, fumigación…) con precio por hectárea; los clientes registran sus campos y solicitan servicios; el prestamista acepta, rechaza o completa cada solicitud.

## Grupo
* 53112 - Costantini, Jeremías
* 52911 - Messina, Tiziano Leonel

## Links
* [Propuesta del TP](proposal.md)
* [Documentación de entrega](docs/README.md) — instalación, minutas, tracking, API, tests, deploy
* App: https://agroapp.dev · API: https://api.agroapp.dev

## Stack
Monorepo **pnpm + Turborepo**. Backend **Node + Express 5 + TypeScript + Prisma + MySQL** (`apps/server`). Frontend **React 18 + Vite + Tailwind** (`apps/web`). Schema y migraciones en `packages/database`.

## Instalación y ejecución local

### Requisitos
* Node.js 20 o superior
* pnpm 8 o superior (`npm i -g pnpm`)
* Docker (para la base MySQL) o un MySQL 8 accesible

### 1. Base de datos
```bash
docker run -d --name agroapp-mysql -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=agro-dsw \
  -e MYSQL_USER=agro-dsw -e MYSQL_PASSWORD=agro-dsw \
  percona/percona-server:8.0
```

### 2. Variables de entorno
Copiar cada `.env.example` a `.env` y completar:
```bash
cp packages/database/.env.example packages/database/.env
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Instalar, migrar y cargar datos demo
```bash
pnpm install
pnpm db:migrate     # crea las tablas
pnpm db:seed        # roles, provincias, categorías, insumos y usuarios demo
```

### 4. Levantar
```bash
pnpm dev            # backend en http://localhost:3000, frontend en http://localhost:5173
```

### 5. Tests
```bash
pnpm test
```

## Usuarios demo (creados por el seed)
| Rol | Email | Contraseña |
|:-|:-|:-|
| ADMIN | admin@agroapp.dev | Admin123! |
| CLIENTE | cliente@agroapp.dev | Cliente123! |
| PRESTAMISTA | prestamista@agroapp.dev | Prestamista123! |

## Scripts útiles
| Comando | Qué hace |
|:-|:-|
| `pnpm dev` | server + web en modo desarrollo |
| `pnpm build` | build de todos los paquetes |
| `pnpm test` | tests de todos los paquetes |
| `pnpm db:migrate` | `prisma migrate dev` (desarrollo) |
| `pnpm db:deploy` | `prisma migrate deploy` (producción) |
| `pnpm db:seed` | carga datos iniciales (idempotente) |
