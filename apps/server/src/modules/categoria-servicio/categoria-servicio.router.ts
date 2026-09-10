import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { CategoriaServicioController } from "./categoria-servicio.controller.js";

export const categoriaServicioRouter = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];

categoriaServicioRouter.get("/", CategoriaServicioController.list);
categoriaServicioRouter.get("/:id", CategoriaServicioController.get);
categoriaServicioRouter.post("/", adminOnly, CategoriaServicioController.create);
categoriaServicioRouter.put("/:id", adminOnly, CategoriaServicioController.update);
categoriaServicioRouter.delete("/:id", adminOnly, CategoriaServicioController.remove);
