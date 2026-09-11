# Guion del video de demo (6 a 8 minutos)

Grabar pantalla + voz sobre https://agroapp.dev con los usuarios demo ([deploy.md](deploy.md)). Antes de grabar, abrir https://api.agroapp.dev/health para despertar el backend (plan free de Render).

## 0. Presentación (30 s)
- Quiénes somos, materia, comisión. Qué resuelve AgroApp: conecta productores con contratistas rurales, con precio por hectárea y seguimiento del trabajo.
- Stack en una frase: React + Vite + Tailwind; Express + Prisma + MySQL; JWT con 3 roles; deploy en Vercel, Render y Aiven.

## 1. Sitio público (1 min)
- Landing: recorrer hero, "cómo funciona", categorías y contratistas destacados.
- **Servicios**: filtrar por categoría "Siembra" y por provincia. Entrar al detalle: contratista, historial de precios con el vigente marcado, valoraciones. *(Listado con filtro + detalle con varias clases)*
- **Contratistas**: filtrar por provincia; abrir un perfil con servicios y opiniones. Mostrar que sin sesión no se ven email ni teléfono.
- Cambiar a modo oscuro y volver.

## 2. Contratista publica un servicio (1 min)
- Ingresar como `contratista@agroapp.dev`. Mostrar el dashboard: pendientes, en curso, reputación.
- **Mis servicios → Publicar servicio**: "Fertilización con urea", categoría Fertilización, precio 15000. *(CUU 1)*
- **Precios** del servicio: cargar un precio nuevo con fecha de hoy y otro programado a futuro; ver el "vigente". *(CRUD dependiente Precio)*
- Desactivar un servicio y mostrar que desaparece del catálogo. Cerrar sesión.

## 3. Productor solicita (2 min)
- Ingresar como `productor@agroapp.dev`.
- **Mis campos → Nuevo campo**: nombre, provincia, localidad, hectáreas y click en el mapa para ubicarlo. *(CRUD dependiente Campo)*
- **Contratistas** con "Cerca de mi campo": mostrar el aviso de ampliación a provincia si aplica.
- **Servicios → Fertilización con urea → Solicitar este servicio**: wizard de 3 pasos: campo y 20 hectáreas; insumo Urea 2 toneladas aportado por el contratista y Gasoil aportado por el productor; resumen con total estimado (solo se cobra la urea). Confirmar. *(CUU 2)*
- Se abre el detalle: timeline, importes, contacto del contratista. Intentar solicitar más hectáreas que las del campo para mostrar la validación.
- Cerrar sesión.

## 4. Contratista gestiona (1 min 30 s)
- Ingresar como contratista → **Solicitudes** filtradas por *pendiente* → abrir la nueva → **Aceptar** eligiendo fecha de inicio. Mostrar "Próximos trabajos" en el dashboard.
- Volver a la solicitud → **Marcar completada**. Rechazar otra pendiente con motivo. *(CUU 3)*
- En Swagger (https://api.agroapp.dev/docs): Authorize con el token, ejecutar `PATCH /solicitudes/{id}/estado` con una transición inválida y mostrar el 409 `INVALID_TRANSITION`.

## 5. Productor valora (45 s)
- Ingresar como productor → solicitud completada → 5 estrellas y comentario. *(CUU 4)*
- Abrir el perfil público del contratista: el promedio y la opinión aparecen.
- Cancelar otra solicitud pendiente con motivo.

## 6. Administración y seguridad (45 s)
- Ingresar como `admin@agroapp.dev`: **Usuarios** (crear uno, mostrar que productor y contratista son excluyentes y que no se puede quitar el último admin), **Insumos** con precio de referencia, **Localidades** dependientes de provincia.
- Mostrar que el productor recibe 403 en `/admin/usuarios` y que sin sesión `/campos` redirige al login.

## 7. Cierre (30 s)
- Achicar a móvil: barra inferior, tarjetas en una columna.
- Mostrar `pnpm test` y el reporte de Playwright (o [tests/evidencia.md](tests/evidencia.md)).
- Repo, docs, gracias.
