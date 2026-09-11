# Documentación de la API

La API REST se documenta con **OpenAPI 3.0**, generada automáticamente desde los mismos schemas Zod que validan cada request (`apps/server/src/modules/*/*.schema.ts`), así la documentación no se desactualiza respecto del código.

| Recurso | URL |
|:-|:-|
| Swagger UI (interactivo) | https://api.agroapp.dev/docs · local: http://localhost:3000/docs |
| Documento OpenAPI (JSON) | https://api.agroapp.dev/docs/openapi.json |
| Copia versionada en el repo | [openapi.json](openapi.json) |

Regenerar la copia del repo: `pnpm --filter server docs:export`.

## Cómo probar endpoints protegidos

1. `POST /auth/login` con un usuario demo (ver [../deploy.md](../deploy.md)).
2. Copiar el `token` de la respuesta.
3. En Swagger UI, botón **Authorize** → pegar el token. Todas las llamadas siguientes llevan `Authorization: Bearer <token>`.

## Convenciones

- Respuestas JSON. IDs numéricos. Los importes (`DECIMAL`) viajan como string para no perder precisión.
- Errores siempre con la forma `{ "code": "...", "message": "...", "details": ... }`:

| HTTP | code | Cuándo |
|:-|:-|:-|
| 400 | `VALIDATION_ERROR` | body/query/params inválidos (`details` lista `{ path, message }`) |
| 400 | `FK_INVALID` | referencia a un registro inexistente |
| 401 | `UNAUTHORIZED` / `TOKEN_INVALID` | sin token, token vencido o inválido |
| 401 | `INVALID_CREDENTIALS` | login incorrecto |
| 403 | `FORBIDDEN` | sin el rol requerido o recurso de otro usuario |
| 404 | `NOT_FOUND` / `NO_PRICE` | recurso inexistente / servicio sin precio vigente |
| 409 | `DUPLICATE` / `INVALID_TRANSITION` / `IN_USE` / `NOT_PENDING` | conflicto de negocio |

## Matriz de permisos

| Recurso | Lectura | Escritura |
|:-|:-|:-|
| provincias, localidades, categorías, insumos | pública | ADMIN |
| usuarios, clientes, admins | ADMIN | ADMIN |
| prestamistas | pública (filtro por provincia/localidad) | ADMIN |
| servicios | pública | PRESTAMISTA dueño o ADMIN |
| precios | pública | PRESTAMISTA dueño del servicio o ADMIN |
| campos | CLIENTE dueño o ADMIN | CLIENTE dueño o ADMIN |
| solicitudes | cliente (propias), prestamista (recibidas), ADMIN (todas) | crear: CLIENTE · cambiar estado: PRESTAMISTA de la solicitud o ADMIN · cancelar: CLIENTE (pendiente) o ADMIN |
| /auth/me | el propio usuario | el propio usuario (sin roles) |
