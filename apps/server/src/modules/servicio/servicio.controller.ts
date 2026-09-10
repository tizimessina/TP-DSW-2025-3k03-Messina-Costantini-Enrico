import type { NextFunction, Request, Response } from "express";
import {
  ServicioCreateSchema,
  ServicioIdSchema,
  ServicioQuerySchema,
  ServicioUpdateSchema,
} from "./servicio.schema.js";
import { servicioService } from "./servicio.service.js";

export const ServicioController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, id_categoria, id_prestamista } = ServicioQuerySchema.parse(req.query);
      res.json(await servicioService.list(q, id_categoria, id_prestamista));
    } catch (e) {
      next(e);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.getById(id));
    } catch (e) {
      next(e);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = ServicioCreateSchema.parse(req.body);
      res.status(201).json(await servicioService.create(req.user!, dto));
    } catch (e) {
      next(e);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      const dto = ServicioUpdateSchema.parse(req.body);
      res.json(await servicioService.update(req.user!, id, dto));
    } catch (e) {
      next(e);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.remove(req.user!, id));
    } catch (e) {
      next(e);
    }
  },
};
