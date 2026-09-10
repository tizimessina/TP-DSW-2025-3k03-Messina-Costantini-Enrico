import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { ServicioController } from "./servicio.controller.js";

export const servicioRouter = Router();
const prestamistaOrAdmin = [requireAuth, requireRole("PRESTAMISTA", "ADMIN")];

servicioRouter.get("/", ServicioController.list);
servicioRouter.get("/:id", ServicioController.get);
servicioRouter.post("/", prestamistaOrAdmin, ServicioController.create);
servicioRouter.put("/:id", prestamistaOrAdmin, ServicioController.update);
servicioRouter.delete("/:id", prestamistaOrAdmin, ServicioController.remove);
