import { Router } from "express";
import { requireAuth, requireRole } from "../../core/auth/middleware.js";
import * as c from "./valoracion.controller.js";

const r = Router();
r.get("/", c.list);
r.post("/", requireAuth, requireRole("PRODUCTOR"), c.create);
export default r;
