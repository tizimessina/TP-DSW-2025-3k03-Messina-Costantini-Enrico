import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { solicitudController } from "./solicitud.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/", solicitudController.list);
r.get("/:id", solicitudController.getById);
r.post("/", requireRole("PRODUCTOR"), solicitudController.create);
r.patch("/:id/estado", requireRole("PRODUCTOR", "CONTRATISTA", "ADMIN"), solicitudController.updateEstado);
r.delete("/:id", requireRole("ADMIN"), solicitudController.delete);

export default r;
