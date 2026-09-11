# Evidencia de ejecución de tests automáticos

Ejecutados el 2026-09-10 en Windows 11, Node 24, contra la base local (Docker Percona 8) con el seed cargado.
Además, cada push y PR corre la misma suite en GitHub Actions ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)); ver la pestaña *Actions* del repo.

## Resumen

| Suite | Herramienta | Archivos | Tests | Resultado |
|:-|:-|:-|:-|:-|
| Backend unitarios | Vitest | `apps/server/src/core/auth/auth.test.ts` (Jeremías), `apps/server/src/modules/solicitud/solicitud.service.test.ts` (Tiziano) | 21 | ✅ 21/21 |
| Backend integración | Vitest + Supertest sobre `createApp()` y la DB | `apps/server/test/api.integration.test.ts` | 11 | ✅ 11/11 |
| Frontend componentes | Vitest + Testing Library (jsdom) | `apps/web/src/auth/ProtectedRoute.test.tsx`, `apps/web/src/pages/AuthPage.test.tsx` | 7 | ✅ 7/7 |
| Frontend end-to-end | Playwright (Chromium) | `apps/web/e2e/solicitud.spec.ts` | 4 | ✅ 4/4 |

## Backend: `pnpm --filter server test`

```
 ✓ src/core/auth/auth.test.ts > jwt > firma y verifica un token conservando id, email y roles
 ✓ src/core/auth/auth.test.ts > jwt > rechaza un token manipulado
 ✓ src/core/auth/auth.test.ts > requireAuth > responde 401 sin header Authorization
 ✓ src/core/auth/auth.test.ts > requireAuth > carga req.user con un token válido
 ✓ src/core/auth/auth.test.ts > requireAuth > responde 401 con un token inválido
 ✓ src/core/auth/auth.test.ts > requireRole > deja pasar si el usuario tiene alguno de los roles
 ✓ src/core/auth/auth.test.ts > requireRole > responde 403 si no tiene el rol
 ✓ src/core/auth/auth.test.ts > assertOwnerOrAdmin > permite al dueño y al admin
 ✓ src/core/auth/auth.test.ts > assertOwnerOrAdmin > lanza 403 a un tercero
 ✓ src/modules/solicitud/solicitud.service.test.ts > calcularImportes > multiplica precio por hectárea y suma insumos
 ✓ src/modules/solicitud/solicitud.service.test.ts > calcularImportes > redondea a dos decimales
 ✓ src/modules/solicitud/solicitud.service.test.ts > puedeTransicionar > permite pendiente -> aceptada/rechazada y aceptada -> completada
 ✓ src/modules/solicitud/solicitud.service.test.ts > puedeTransicionar > rechaza transiciones inválidas
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > toma el cliente del token, el prestamista del servicio y calcula el precio vigente × hectáreas
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si el campo no pertenece al cliente
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si las hectáreas superan las del campo
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si el servicio no tiene precio vigente
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si quien solicita no es cliente
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > el prestamista puede aceptar una solicitud pendiente
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > el cliente no puede cambiar el estado
 ✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > no permite una transición inválida
 ✓ test/api.integration.test.ts > autenticación > rechaza credenciales inválidas con 401
 ✓ test/api.integration.test.ts > autenticación > valida el body con 400 y detalles
 ✓ test/api.integration.test.ts > autenticación > GET /auth/me devuelve el usuario del token sin password_hash
 ✓ test/api.integration.test.ts > protección de rutas por rol > bloquea rutas privadas sin token
 ✓ test/api.integration.test.ts > protección de rutas por rol > un CLIENTE no puede escribir catálogos (403)
 ✓ test/api.integration.test.ts > protección de rutas por rol > un ADMIN sí puede listar usuarios
 ✓ test/api.integration.test.ts > caso de uso: solicitar un servicio y aceptarlo > el cliente crea un campo propio
 ✓ test/api.integration.test.ts > caso de uso: solicitar un servicio y aceptarlo > el cliente solicita el servicio y el precio se calcula con el precio vigente
 ✓ test/api.integration.test.ts > caso de uso: solicitar un servicio y aceptarlo > el cliente no puede aceptar su propia solicitud
 ✓ test/api.integration.test.ts > caso de uso: solicitar un servicio y aceptarlo > el prestamista la acepta y luego no puede rechazarla
 ✓ test/api.integration.test.ts > caso de uso: solicitar un servicio y aceptarlo > el detalle incluye servicio, categoría, campo, cliente y prestamista

 Test Files  3 passed (3)
      Tests  32 passed (32)
   Duration  2.68s
```

## Frontend componentes: `pnpm --filter web test`

```
 ✓ src/auth/ProtectedRoute.test.tsx > ProtectedRoute > redirige a /auth cuando no hay sesión
 ✓ src/auth/ProtectedRoute.test.tsx > ProtectedRoute > muestra 403 cuando el usuario no tiene el rol requerido
 ✓ src/auth/ProtectedRoute.test.tsx > ProtectedRoute > renderiza el contenido cuando el usuario tiene el rol
 ✓ src/auth/ProtectedRoute.test.tsx > ProtectedRoute > muestra el spinner mientras valida la sesión
 ✓ src/pages/AuthPage.test.tsx > AuthPage > envía email y contraseña al iniciar sesión y notifica al padre (output property)
 ✓ src/pages/AuthPage.test.tsx > AuthPage > muestra el mensaje de error devuelto por la API
 ✓ src/pages/AuthPage.test.tsx > AuthPage > cambia a modo registro y muestra los campos adicionales (reactividad ante estado)

 Test Files  2 passed (2)
      Tests  7 passed (7)
   Duration  2.31s
```

## Frontend end-to-end: `pnpm --filter web test:e2e`

```
Running 4 tests using 1 worker

  ok 1 [chromium] › e2e\solicitud.spec.ts:37:3 › Publicar, solicitar y aceptar un servicio › el prestamista publica un servicio con precio inicial (1.4s)
  ok 2 [chromium] › e2e\solicitud.spec.ts:53:3 › Publicar, solicitar y aceptar un servicio › el cliente registra un campo y solicita el servicio (1.7s)
  ok 3 [chromium] › e2e\solicitud.spec.ts:84:3 › Publicar, solicitar y aceptar un servicio › el prestamista acepta la solicitud (1.2s)
  ok 4 [chromium] › e2e\solicitud.spec.ts:100:3 › Publicar, solicitar y aceptar un servicio › el cliente no puede cambiar el estado ni ver páginas de admin (941ms)

  4 passed (13.0s)
```

## Cómo reproducir

```bash
pnpm db:migrate && pnpm db:seed
pnpm test                       # backend + componentes
pnpm --filter web test:e2e      # e2e (levanta server y web solo)
pnpm --filter web test:e2e:report   # reporte HTML de Playwright
```
