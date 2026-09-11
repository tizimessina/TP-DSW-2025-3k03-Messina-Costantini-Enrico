import type { NextFunction, Request, Response } from "express";
import {
  CategoriaServicioCreateSchema,
  CategoriaServicioIdSchema,
  CategoriaServicioQuerySchema,
  CategoriaServicioUpdateSchema,
} from "./categoria-servicio.schema.js";
import { categoriaServicioService } from "./categoria-servicio.service.js";

export const CategoriaServicioController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = CategoriaServicioQuerySchema.parse(req.query);
      res.json(await categoriaServicioService.list(q));
    } catch (e) { next(e); }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CategoriaServicioIdSchema.parse(req.params);
      res.json(await categoriaServicioService.getById(id));
    } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await categoriaServicioService.create(CategoriaServicioCreateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CategoriaServicioIdSchema.parse(req.params);
      res.json(await categoriaServicioService.update(id, CategoriaServicioUpdateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = CategoriaServicioIdSchema.parse(req.params);
      res.json(await categoriaServicioService.remove(id));
    } catch (e) { next(e); }
  },
};
