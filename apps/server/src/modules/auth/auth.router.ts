import { Router } from "express";
import { requireAuth } from "../../core/auth/middleware.js";
import * as c from "./auth.controller.js";

const r = Router();

r.post("/login", c.login);
r.post("/register", c.register);
r.get("/me", requireAuth, c.me);
r.put("/me", requireAuth, c.updateMe);

export default r;
