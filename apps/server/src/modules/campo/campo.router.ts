import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import * as c from "./campo.controller.js";

const r = Router();

// Los campos son privados del cliente (o visibles para ADMIN).
r.use(requireAuth, requireRole("CLIENTE", "ADMIN"));

r.get("/", c.list);
r.get("/:id", c.getById);
r.post("/", c.create);
r.put("/:id", c.update);
r.delete("/:id", c.remove);

export default r;
