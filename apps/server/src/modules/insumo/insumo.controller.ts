import type { NextFunction, Request, Response } from "express";
import { InsumoCreateSchema, InsumoIdSchema, InsumoQuerySchema, InsumoUpdateSchema } from "./insumo.schema.js";
import { insumoService } from "./insumo.service.js";

export const InsumoController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = InsumoQuerySchema.parse(req.query);
      res.json(await insumoService.list(q));
    } catch (e) { next(e); }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = InsumoIdSchema.parse(req.params);
      res.json(await insumoService.getById(id));
    } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await insumoService.create(InsumoCreateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = InsumoIdSchema.parse(req.params);
      res.json(await insumoService.update(id, InsumoUpdateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = InsumoIdSchema.parse(req.params);
      res.json(await insumoService.remove(id));
    } catch (e) { next(e); }
  },
};
