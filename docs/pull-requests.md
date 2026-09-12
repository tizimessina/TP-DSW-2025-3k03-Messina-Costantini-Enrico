# Pull requests

Repositorio (monorepo fullstack): https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico

| # | Rama | Contenido | Autor |
|:-|:-|:-|:-|
| [#1](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/1) | `patch-1` | Propuesta inicial del TP | Tiziano |
| [#2](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/2) | `patch-2` | Ajustes a la propuesta | Tiziano |
| [#3](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/3) | `chore/base-setup` | Migración Prisma, seed, `.env.example`, `CLAUDE.md`, README, limpieza del monorepo | Tiziano |
| [#4](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/4) | `feat/auth-jwt-back` | Auth JWT, protección de rutas por rol, reglas de solicitud, tests unitarios e integración | Tiziano |
| [#5](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/5) | `feat/auth-front` | Contexto de auth, rutas protegidas, layout responsive, vistas de detalle, CUU, admin, tests de componente | Tiziano |
| [#6](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/6) | `feat/api-docs` | OpenAPI desde Zod + Swagger UI en `/docs` | Tiziano |
| [#7](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/7) | `test/e2e` | Playwright: publicar → solicitar → aceptar | Tiziano |
| [#8](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/8) | `docs/entrega` | Documentación de entrega, CI, proposal, blueprint de Render y guía de deploy | Tiziano |
| [#9](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/9) | `fix/render-build` | Build de Render con devDependencies | Tiziano |
| [#10](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/10) | `fix/hardening` | helmet, rate limit de login, 500 genéricos, dependencias parcheadas | Tiziano |
| [#11](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/11) | `refactor/dominio` | Modelo productor/contratista, migración única con CHECKs, reglas de negocio coherentes, valoraciones, paginación, 54 tests | Tiziano |
| [#12](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/12) | `feat/ui-v2` | UI nueva: design system, dashboard por rol, wizard de solicitud, mapas, admin, e2e | Tiziano |
| [#13](https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico/pull/13) | `docs/coherencia` | Modelo en Mermaid, glosario, limitaciones, proposal, evidencia, guion | Tiziano |
| pendiente | `fix/responsive-movil` | Grillas que desbordaban la pantalla en teléfonos | Tiziano |
| pendiente | `fix/ci-pnpm` | Versión de pnpm duplicada en la integración continua | Tiziano |
| pendiente | `chore/lint-auditoria` | Lint del backend, modo estricto completo y documento de auditoría | Tiziano |
| pendiente | `chore/docker-compose` | Todo el stack con un comando: base, migraciones, datos de demo, API y frontend | Tiziano |
| pendiente | `feat/historial-eventos` | Registro de transiciones de la solicitud y línea de tiempo real | Tiziano |
| pendiente | `feat/notificaciones` | Avisos dentro de la aplicación, con campana y contador | Tiziano |
| pendiente | `feat/mejoras-demo` | Insignia de verificado, ficha histórica del campo, precio de mercado y gráfico del panel | Tiziano |
| pendiente | `feat/cercania-distancia` | Cercanía por distancia real entre el campo y el contratista | Tiziano |
| pendiente | `docs/gestion` | Registro de coordinación por hito y seguimiento de las 35 tareas | Tiziano |

Los números de los PR marcados como pendientes se completan al abrirlos. El orden de merge de los últimos es: `fix/responsive-movil`, `fix/ci-pnpm`, `chore/lint-auditoria`, `chore/docker-compose`, `feat/historial-eventos`, `feat/notificaciones` y `feat/mejoras-demo`, que van apilados en ese orden. El desarrollo previo (octubre y noviembre de 2025) se hizo con commits directos a `main` de ambos integrantes; ver `git log`.
