# Pendientes y próximos pasos

Estado al 2026-09-11. Lo que falta para cerrar la entrega, en orden.

## Para la defensa (obligatorio)

- [ ] **Minutas** en `docs/minutas/` (una por reunión: fecha, presentes, temas, decisiones, próximos pasos) y **`docs/tracking.md`** con el link al tablero de GitHub Projects y la metodología. Reconstruir los hitos pasados desde `git log --date=short --format='%ad %an %s'`: 2025-04 propuesta, 2025-10/11 primer desarrollo, 2026-09 rediseño completo.
- [ ] **Video** siguiendo [video-guion.md](video-guion.md); link en [video.md](video.md).
- [ ] Completar los números de PR en [pull-requests.md](pull-requests.md) a medida que se abren.
- [ ] Enviar el formulario de la cátedra con: repo, `docs/README.md`, video, links de deploy, credenciales y contacto.

## Después de la defensa

- [ ] Cambiar la contraseña del usuario admin de producción (las credenciales demo son públicas en el repo).
- [ ] Cargar coordenadas al resto de las localidades: el seed cubre las 13 de demostración, las que se den de alta después las carga el administrador.
- [ ] Mover el cálculo de distancia a la base (`ST_Distance_Sphere` con índice espacial) si el volumen de contratistas lo justifica.
- [ ] Decidir si los perfiles públicos de contratistas deben requerir sesión.

## Ideas fuera de alcance (documentadas en [modelo.md](modelo.md))

- Notificaciones por email al cambiar el estado de una solicitud.
- Calendario de disponibilidad del contratista y control de superposición.
- Servicios cotizados por hora o por viaje.
