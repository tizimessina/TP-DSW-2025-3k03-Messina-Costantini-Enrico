# Evidencia de ejecución de tests automáticos

Ejecutados el 2026-09-11 en Windows 11, Node 24, contra la base local (Docker Percona 8) con el seed cargado.
Además, cada push y PR corre las suites de backend y frontend en GitHub Actions ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)); ver la pestaña *Actions* del repo.

## Resumen

| Suite | Herramienta | Archivos | Tests | Resultado |
|:-|:-|:-|:-|:-|
| Backend unitarios | Vitest | `apps/server/src/core/auth/auth.test.ts` (Jeremías), `apps/server/src/modules/solicitud/solicitud.service.test.ts` (Tiziano), `apps/server/src/modules/usuario/usuario.service.test.ts` | 34 | ✅ 34/34 |
| Backend integración | Vitest + Supertest sobre `createApp()` y la DB | `apps/server/test/api.integration.test.ts` | 20 | ✅ 20/20 |
| Frontend componentes | Vitest + Testing Library (jsdom) | `apps/web/src/auth/ProtectedRoute.test.tsx`, `apps/web/src/pages/AuthPage.test.tsx`, `apps/web/src/components/ui/Stars.test.tsx` | 10 | ✅ 10/10 |
| Frontend end-to-end | Playwright (Chromium) | `apps/web/e2e/flujo.spec.ts` | 4 | ✅ 4/4 |

## Backend: `pnpm --filter server test`

```
✓ test/api.integration.test.ts > autenticación y errores > rechaza credenciales inválidas con 401 y el mismo mensaje
✓ test/api.integration.test.ts > autenticación y errores > valida el body con 400 y detalles
✓ test/api.integration.test.ts > autenticación y errores > rutas desconocidas devuelven 404 JSON
✓ test/api.integration.test.ts > autenticación y errores > GET /auth/me devuelve roles y perfil del subtipo sin password_hash
✓ test/api.integration.test.ts > autenticación y errores > el registro no permite ser productor y contratista a la vez ni ADMIN
✓ test/api.integration.test.ts > permisos y privacidad > un PRODUCTOR no puede escribir catálogos ni listar usuarios
✓ test/api.integration.test.ts > permisos y privacidad > el listado público de contratistas no expone email ni domicilio
✓ test/api.integration.test.ts > permisos y privacidad > el admin no puede quitarse el rol ADMIN siendo el único
✓ test/api.integration.test.ts > cercanía > con id_campo filtra por la localidad del campo y cae a provincia si no hay nadie
✓ test/api.integration.test.ts > caso de uso completo > el contratista publica un servicio con precio inicial (vigente desde hoy)
✓ test/api.integration.test.ts > caso de uso completo > el productor registra un campo con localidad y coordenadas
✓ test/api.integration.test.ts > caso de uso completo > solicita con insumos: solo se cobran los del contratista y el precio sale del catálogo
✓ test/api.integration.test.ts > caso de uso completo > no acepta más hectáreas que las del campo ni insumos repetidos
✓ test/api.integration.test.ts > caso de uso completo > el contratista puede ver el campo de la solicitud; otro contratista no
✓ test/api.integration.test.ts > caso de uso completo > el productor no puede aceptar; el contratista acepta y se fija fecha_inicio
✓ test/api.integration.test.ts > caso de uso completo > no se puede reducir el campo por debajo de las hectáreas comprometidas
✓ test/api.integration.test.ts > caso de uso completo > no se puede valorar antes de completar; después sí, y una sola vez
✓ test/api.integration.test.ts > caso de uso completo > el productor cancela una pendiente con motivo (obligatorio)
✓ test/api.integration.test.ts > caso de uso completo > desactivar el servicio lo saca del catálogo pero conserva el detalle para el dueño
✓ test/api.integration.test.ts > caso de uso completo > el resumen del dashboard cuenta por estado
✓ src/core/auth/auth.test.ts > jwt > firma y verifica un token con el id del usuario
✓ src/core/auth/auth.test.ts > jwt > rechaza un token manipulado
✓ src/core/auth/auth.test.ts > requireAuth > responde 401 sin header Authorization
✓ src/core/auth/auth.test.ts > requireAuth > carga req.user con los roles actuales de la DB
✓ src/core/auth/auth.test.ts > requireAuth > responde 401 si el usuario del token ya no existe
✓ src/core/auth/auth.test.ts > requireAuth > responde 401 con un token inválido
✓ src/core/auth/auth.test.ts > requireRole > deja pasar si el usuario tiene alguno de los roles
✓ src/core/auth/auth.test.ts > requireRole > responde 403 si no tiene el rol
✓ src/core/auth/auth.test.ts > assertOwnerOrAdmin > permite al dueño y al admin
✓ src/core/auth/auth.test.ts > assertOwnerOrAdmin > lanza 403 a un tercero
✓ src/modules/solicitud/solicitud.service.test.ts > calcularImportes > servicio = precio × hectáreas; solo suman los insumos que aporta el contratista
✓ src/modules/solicitud/solicitud.service.test.ts > calcularImportes > redondea a dos decimales
✓ src/modules/solicitud/solicitud.service.test.ts > puedeTransicionar (ciclo de vida por rol) > el contratista acepta, rechaza y completa
✓ src/modules/solicitud/solicitud.service.test.ts > puedeTransicionar (ciclo de vida por rol) > el productor cancela pendientes y aceptadas, pero no acepta ni completa
✓ src/modules/solicitud/solicitud.service.test.ts > puedeTransicionar (ciclo de vida por rol) > los estados finales no cambian, ni para admin
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > toma el productor del token, el contratista del servicio y el precio del catálogo
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > no cobra los insumos que aporta el productor
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si el campo no pertenece al productor
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si las hectáreas superan las del campo
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si el servicio no tiene precio vigente o está inactivo
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si un insumo no existe en el catálogo
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.create > rechaza si quien solicita no es productor
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > al aceptar, el contratista fija la fecha de inicio (hoy si no había)
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > el productor cancela con motivo
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > el productor no puede aceptar ni completar
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > no permite salir de un estado final
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > al completar fija fecha_fin y valida coherencia de fechas
✓ src/modules/solicitud/solicitud.service.test.ts > solicitudService.updateEstado > un tercero no puede ver ni tocar la solicitud
✓ src/modules/usuario/usuario.service.test.ts > assertRolesValidos > permite ADMIN con un rol de negocio
✓ src/modules/usuario/usuario.service.test.ts > assertRolesValidos > rechaza productor + contratista
✓ src/modules/usuario/usuario.service.test.ts > usuarioService guards > no deja quitar el rol ADMIN al único admin
✓ src/modules/usuario/usuario.service.test.ts > usuarioService guards > no deja eliminar al único admin
✓ src/modules/usuario/usuario.service.test.ts > usuarioService guards > no deja quitar PRODUCTOR si tiene campos
✓ src/modules/usuario/usuario.service.test.ts > usuarioService guards > el usuario público nunca incluye password_hash y aplana los roles

Test Files  4 passed (4)
     Tests  54 passed (54)
  Duration  5.06s
```

## Frontend componentes: `pnpm --filter web test`

```
✓ src/auth/ProtectedRoute.test.tsx (4 tests)
    redirige a /ingresar cuando no hay sesión
    muestra 403 cuando el usuario no tiene el rol requerido
    renderiza el contenido cuando el usuario tiene el rol
    muestra el spinner mientras valida la sesión
✓ src/components/ui/Stars.test.tsx (3 tests)
    muestra el valor y la cantidad
    indica cuando no hay valoraciones
    en modo editable emite la puntuación al hacer click
✓ src/pages/AuthPage.test.tsx (3 tests)
    envía email y contraseña al iniciar sesión y notifica al padre
    muestra el mensaje de error devuelto por la API
    en modo registro permite elegir el rol y envía el rol elegido

Test Files  3 passed (3)
     Tests  10 passed (10)
  Duration  4.04s
```

## Frontend end-to-end: `pnpm --filter web test:e2e`

```
Running 4 tests using 1 worker

  ok 1 [chromium] › e2e\flujo.spec.ts › Publicar → solicitar → aceptar → completar → valorar › el contratista publica un servicio con precio (3.1s)
  ok 2 [chromium] › e2e\flujo.spec.ts › Publicar → solicitar → aceptar → completar → valorar › el productor registra un campo y solicita el servicio con un insumo (6.7s)
  ok 3 [chromium] › e2e\flujo.spec.ts › Publicar → solicitar → aceptar → completar → valorar › el contratista acepta y completa el trabajo (4.0s)
  ok 4 [chromium] › e2e\flujo.spec.ts › Publicar → solicitar → aceptar → completar → valorar › el productor valora y el promedio se refleja en el perfil del contratista (4.2s)

  4 passed (19.4s)
```

## Cómo reproducir

```bash
pnpm db:migrate && pnpm db:seed
pnpm test                          # backend + componentes
pnpm --filter web test:e2e         # e2e (levanta server y web solo)
pnpm --filter web test:e2e:report  # reporte HTML de Playwright
```
