import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../../core/auth/middleware.js";
import { ServicioController } from "./servicio.controller.js";

export const servicioRouter = Router();
const contratistaOrAdmin = [requireAuth, requireRole("CONTRATISTA", "ADMIN")];

servicioRouter.get("/", optionalAuth, ServicioController.list);
servicioRouter.get("/:id", optionalAuth, ServicioController.get);
servicioRouter.get("/:id/referencia-precio", ServicioController.referenciaPrecio);
servicioRouter.post("/", requireAuth, requireRole("CONTRATISTA"), ServicioController.create);
servicioRouter.put("/:id", contratistaOrAdmin, ServicioController.update);
servicioRouter.delete("/:id", contratistaOrAdmin, ServicioController.remove);
