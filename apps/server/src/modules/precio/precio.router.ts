import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { PrecioController } from "./precio.controller.js";

export const precioRouter = Router();
const contratistaOrAdmin = [requireAuth, requireRole("CONTRATISTA", "ADMIN")];

precioRouter.get("/servicio/:id_servicio/vigente", PrecioController.vigente);
precioRouter.get("/servicio/:id_servicio", PrecioController.listByServicio);
precioRouter.get("/:id", PrecioController.get);
precioRouter.post("/", contratistaOrAdmin, PrecioController.create);
precioRouter.put("/:id", contratistaOrAdmin, PrecioController.update);
precioRouter.delete("/:id", contratistaOrAdmin, PrecioController.remove);
