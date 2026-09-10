import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import * as c from "./admin.controller.js";

const r = Router();
r.use(requireAuth, requireRole("ADMIN"));

r.get("/", c.list);
r.get("/:id", c.getById);
r.post("/", c.create);
r.put("/:id", c.update);
r.delete("/:id", c.remove);

export default r;
