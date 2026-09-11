import { Router } from "express";
import * as c from "./contratista.controller.js";

// Perfil público de contratistas (solo lectura; el contratista edita su bio en PUT /auth/me).
const r = Router();
r.get("/", c.list);
r.get("/:id", c.getById);
export default r;
