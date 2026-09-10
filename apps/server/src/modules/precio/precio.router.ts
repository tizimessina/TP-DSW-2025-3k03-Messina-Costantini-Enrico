import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { PrecioController } from "./precio.controller.js";

export const precioRouter = Router();
const prestamistaOrAdmin = [requireAuth, requireRole("PRESTAMISTA", "ADMIN")];

precioRouter.get("/", PrecioController.list);
precioRouter.get("/servicio/:id_servicio/vigente", PrecioController.vigente);
precioRouter.get("/servicio/:id_servicio", PrecioController.listByServicio);
precioRouter.get("/:id", PrecioController.get);
precioRouter.post("/", prestamistaOrAdmin, PrecioController.create);
precioRouter.put("/:id", prestamistaOrAdmin, PrecioController.update);
precioRouter.delete("/:id", prestamistaOrAdmin, PrecioController.remove);
