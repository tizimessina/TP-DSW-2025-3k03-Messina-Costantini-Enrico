import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import * as c from "./campo.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/", requireRole("PRODUCTOR", "ADMIN"), c.list);
// El detalle también lo puede ver el contratista que tiene una solicitud sobre el campo (se valida en el service)
r.get("/:id", c.getById);
r.post("/", requireRole("PRODUCTOR", "ADMIN"), c.create);
r.put("/:id", requireRole("PRODUCTOR", "ADMIN"), c.update);
r.delete("/:id", requireRole("PRODUCTOR", "ADMIN"), c.remove);

export default r;
