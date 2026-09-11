import type { NextFunction, Request, Response } from "express";
import { ServicioCreateSchema, ServicioIdSchema, ServicioQuerySchema, ServicioUpdateSchema } from "./servicio.schema.js";
import { servicioService } from "./servicio.service.js";

export const ServicioController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await servicioService.list(ServicioQuerySchema.parse(req.query), req.user));
    } catch (e) { next(e); }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.getById(id, req.user));
    } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await servicioService.create(req.user!, ServicioCreateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.update(req.user!, id, ServicioUpdateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.desactivar(req.user!, id));
    } catch (e) { next(e); }
  },
  referenciaPrecio: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = ServicioIdSchema.parse(req.params);
      res.json(await servicioService.referenciaPrecio(id));
    } catch (e) { next(e); }
  },
};
