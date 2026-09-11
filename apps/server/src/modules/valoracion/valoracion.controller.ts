import type { NextFunction, Request, Response } from "express";
import { ValoracionCreateSchema, ValoracionQuerySchema } from "./valoracion.schema.js";
import { valoracionService } from "./valoracion.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await valoracionService.list(ValoracionQuerySchema.parse(req.query)));
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await valoracionService.create(req.user!, ValoracionCreateSchema.parse(req.body)));
  } catch (e) { next(e); }
};
