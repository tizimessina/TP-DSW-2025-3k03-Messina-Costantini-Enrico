import type { NextFunction, Request, Response } from "express";
import { PrecioCreateSchema, PrecioIdSchema, PrecioServicioParamsSchema, PrecioUpdateSchema } from "./precio.schema.js";
import { precioService } from "./precio.service.js";

export const PrecioController = {
  listByServicio: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id_servicio } = PrecioServicioParamsSchema.parse(req.params);
      res.json(await precioService.listByServicio(id_servicio));
    } catch (e) { next(e); }
  },
  vigente: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id_servicio } = PrecioServicioParamsSchema.parse(req.params);
      res.json(await precioService.getVigente(id_servicio));
    } catch (e) { next(e); }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      res.json(await precioService.getById(id));
    } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await precioService.create(req.user!, PrecioCreateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      res.json(await precioService.update(req.user!, id, PrecioUpdateSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      res.json(await precioService.remove(req.user!, id));
    } catch (e) { next(e); }
  },
};
