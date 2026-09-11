# Tareas para Jeremías

Brief para trabajar con Claude Code en tu máquina. Cada tarea es una rama + PR a `main`. Antes de empezar leé `CLAUDE.md` (stack, comandos, patrón de módulos y matriz de roles) y `docs/instalacion.md`.

Podés pegarle a Claude Code el bloque de cada tarea tal cual como primer mensaje.

---

## Tarea A — Feature "Valoración de servicio" (rama `feat/valoracion`)

> Implementá el caso de uso "Valorar un servicio" siguiendo el patrón de módulos de `apps/server/src/modules/solicitud/`. Reglas: solo el CLIENTE dueño de una solicitud en estado `completada` puede valorarla, una sola vez. Pasos:
>
> 1. **Prisma** (`packages/database/prisma/schema.prisma`): modelo `valoracion` con `id_valoracion` (BigInt autoincrement), `id_solicitud` (BigInt, `@unique`, FK a `solicitud` con `onDelete: Cascade`), `puntaje` (Int 1–5), `comentario` (String? VarChar 500), `fecha` (DateTime default now). Agregar la relación inversa `valoracion valoracion?` en `solicitud`. Correr `pnpm db:migrate --name valoracion` y `pnpm --filter @repo/db build`.
> 2. **Backend** módulo `apps/server/src/modules/valoracion/` con `valoracion.schema.ts` (Zod: `id_solicitud`, `puntaje` int 1–5, `comentario` opcional), `valoracion.repository.ts`, `valoracion.service.ts` (validar dueño + estado `completada` + no valorada; errores `{ status, code, message }`), `valoracion.controller.ts`, `valoracion.router.ts`. Rutas: `POST /valoraciones` (requireAuth + requireRole("CLIENTE")), `GET /valoraciones?id_servicio=` y `GET /valoraciones?id_prestamista=` (públicas, devuelven lista + `promedio` y `cantidad`). Montar el router en `core/http/expressApp.ts`.
> 3. **Frontend**: `apps/web/src/api/valoraciones.ts` (tipos + funciones). En `SolicitudDetailPage.tsx`, si la solicitud está `completada` y el usuario es el cliente, mostrar un formulario de estrellas (1–5) + comentario, o la valoración ya hecha. En `ServicioDetailPage.tsx` y `PrestamistaDetailPage.tsx` mostrar promedio (★ 4,5 · 12 valoraciones) y la lista de comentarios. Usar los componentes de `components/ui.tsx` y `useFeedback()` para toasts; nada de `alert()`.
> 4. **Test unitario** `valoracion.service.test.ts` con el repo mockeado, igual que `solicitud.service.test.ts`: crea OK, rechaza si no es el dueño, rechaza si no está completada, rechaza si ya fue valorada.
> 5. Verificá con `pnpm --filter server exec tsc --noEmit`, `pnpm --filter web exec tsc --noEmit` y `pnpm test`. Commits con prefijo `feat:`; abrí el PR contra `main`.

---

## Tarea B — Gestión del proyecto (rama `docs/gestion`)

1. **GitHub Projects**: crear un proyecto tipo tablero (Backlog / En curso / En revisión / Hecho) en el repo. Crear un issue por cada tarea pendiente de `docs/README.md` (deploy, API docs, e2e, valoración, minutas, video…) y asignarlos. Cerrar issues desde los PRs con `Closes #N`.
2. **`docs/tracking.md`**: link al proyecto, metodología (Scrum liviano: sprints semanales hasta la defensa, daily por WhatsApp, revisión de PR cruzada), y convención de ramas/commits.
3. **`docs/minutas/`**: un archivo `YYYY-MM-DD.md` por reunión con: fecha, presentes, temas, decisiones, próximos pasos. Reconstruir los hitos pasados desde `git log --date=short`: 2025-04-24 (propuesta), 2025-10-11 a 2025-11-19 (desarrollo de CRUDs, auth básica y deploy), 2026-09-10 (relevamiento contra la cátedra, decisión de auth JWT, Aiven, reparto). De acá en adelante, una minuta real por reunión.

> Podés pedirle a Claude Code: "Leé `git log --date=short --format='%ad %an %s'` y escribí las minutas en `docs/minutas/` con el formato de `docs/tracking.md`."

---

## Tarea C — Video de la demo

Cuando el deploy esté arriba (ver `docs/deploy.md`), grabar la demo siguiendo `docs/video-guion.md` (5 a 8 minutos, pantalla + voz). Subirlo a YouTube como "no listado" y poner el link en `docs/README.md`.
