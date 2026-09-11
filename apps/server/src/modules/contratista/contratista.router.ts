import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import * as c from "./contratista.controller.js";

// Perfil público de contratistas (solo lectura; el contratista edita su bio en PUT /auth/me).
const r = Router();
r.get("/", c.list);
r.get("/:id", c.getById);
r.put("/:id/verificado", requireAuth, requireRole("ADMIN"), c.verificar);
export default r;
