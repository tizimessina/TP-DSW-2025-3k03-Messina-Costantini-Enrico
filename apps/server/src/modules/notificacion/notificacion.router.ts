import { Router } from "express";
import { requireAuth } from "../../core/auth/middleware.js";
import { notificacionController } from "./notificacion.controller.js";

const r = Router();

// Todas operan sobre los avisos del usuario autenticado.
r.use(requireAuth);

r.get("/", notificacionController.list);
r.get("/no-leidas", notificacionController.noLeidas);
r.post("/leer-todas", notificacionController.leerTodas);
r.post("/:id/leer", notificacionController.leer);

export default r;
