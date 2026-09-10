import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import { solicitudController } from "./solicitud.controller.js";

const solicitudRouter = Router();

solicitudRouter.use(requireAuth);

solicitudRouter.get("/", solicitudController.list);
solicitudRouter.get("/:id", solicitudController.getById);
solicitudRouter.post("/", requireRole("CLIENTE"), solicitudController.create);
solicitudRouter.patch("/:id/estado", requireRole("PRESTAMISTA", "ADMIN"), solicitudController.updateEstado);
solicitudRouter.delete("/:id", requireRole("CLIENTE", "ADMIN"), solicitudController.delete);

export default solicitudRouter;
