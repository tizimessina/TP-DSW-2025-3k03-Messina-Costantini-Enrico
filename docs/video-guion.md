# Guion del video de demo (6 a 8 minutos)

Grabar pantalla + voz sobre https://agroapp.dev con los usuarios demo. Antes de grabar abrir https://api.agroapp.dev/health para despertar el backend (plan free de Render).

## 0. Presentación (30 s)
- Quiénes somos, materia, comisión. Qué resuelve AgroApp: conecta productores (clientes) con contratistas rurales (prestamistas).
- Stack en una frase: React + Vite + Tailwind; Express + Prisma + MySQL; JWT con 3 roles; deploy en Vercel, Render y Aiven.

## 1. Home y catálogo público (45 s)
- Home sin sesión: explicar el flujo en 3 pasos.
- **Servicios**: filtrar por categoría "Siembra" y por texto. Entrar al detalle: categoría, prestamista, historial de precios. *(Listado con filtro + detalle con más de 2 clases de negocio)*
- **Prestamistas**: filtrar por provincia Santa Fe y localidad Venado Tuerto → detalle con sus servicios y precios.

## 2. Prestamista publica un servicio (1 min)
- Login `prestamista@agroapp.dev`. Mostrar que el menú cambia según el rol.
- **Mis servicios**: publicar "Fertilización con urea", categoría Fertilización, precio inicial 15000. Aparece en la tabla.
- **Precios**: cargar un precio nuevo con fecha de hoy y mostrar que el historial se mantiene y el vigente es el más reciente. *(CRUD dependiente Precio)*
- Cerrar sesión.

## 3. Cliente solicita el servicio (1 min 30 s)
- Login `cliente@agroapp.dev`.
- **Mis campos**: registrar un campo (coordenadas, hectáreas). Entrar al detalle del campo (link a Google Maps, solicitudes del campo). *(CRUD dependiente Campo)*
- **Servicios** → detalle de "Fertilización con urea" → formulario **Solicitar este servicio**: elegir campo, 20 hectáreas, agregar un insumo (Urea, 2 toneladas, precio). Mostrar el total estimado calculándose en vivo. Enviar.
- Se abre el detalle de la solicitud: estado *pendiente*, importes (precio vigente × hectáreas + insumos), cliente, prestamista, campo, insumos. *(CUU con valor de negocio, usa datos de los CUU anteriores)*
- Mostrar una validación: intentar solicitar más hectáreas que las del campo → mensaje de error amigable.
- Cerrar sesión.

## 4. Prestamista gestiona la solicitud (1 min)
- Login prestamista → **Solicitudes recibidas**: filtrar por estado *pendiente* → **Aceptar** (diálogo de confirmación) → estado *aceptada* → **Marcar completada**.
- Intentar (desde la API o explicando) una transición inválida: la API responde 409 `INVALID_TRANSITION`.
- Si está implementada la valoración: login cliente → solicitud completada → puntuar con estrellas y comentar → ver el promedio en el detalle del servicio.

## 5. Administración y seguridad (1 min)
- Login `admin@agroapp.dev`: **Usuarios** (crear un usuario con dos roles), **Categorías**, **Localidades** (dependiente de Provincia).
- Mostrar que un cliente entrando a `/admin/usuarios` recibe 403, y que sin sesión `/campos` redirige al login.
- Swagger UI en https://api.agroapp.dev/docs: botón Authorize con el token, ejecutar `GET /solicitudes`.

## 6. Responsive y cierre (45 s)
- Achicar la ventana a móvil: menú hamburguesa, tarjetas en una columna, tablas con scroll horizontal.
- Mostrar `pnpm test` y el reporte de Playwright (o la captura en `docs/tests/`).
- Cierre: repo, docs, gracias.
