import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { InsumoController } from "./insumo.controller.js";

export const insumoRouter = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];

insumoRouter.get("/", InsumoController.list);
insumoRouter.get("/:id", InsumoController.get);
insumoRouter.post("/", adminOnly, InsumoController.create);
insumoRouter.put("/:id", adminOnly, InsumoController.update);
insumoRouter.delete("/:id", adminOnly, InsumoController.remove);
