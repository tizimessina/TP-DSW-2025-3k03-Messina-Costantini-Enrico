import type { NextFunction, Request, Response } from "express";
import {
  PrecioCreateSchema,
  PrecioIdSchema,
  PrecioUpdateSchema,
} from "./precio.schema.js";
import { precioService } from "./precio.service.js";

export const PrecioController = {
  // GET /precios?id_servicio=123
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id_servicio } = req.query;
      if (!id_servicio) return res.json([]);
      let servicioId: bigint;
      try {
        servicioId = BigInt(String(id_servicio));
      } catch {
        return next({ status: 400, code: "VALIDATION_ERROR", message: "id_servicio inválido" });
      }
      res.json(await precioService.listByServicio(servicioId));
    } catch (e) {
      next(e);
    }
  },

  // GET /precios/servicio/:id_servicio
  listByServicio: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await precioService.listByServicio(BigInt(req.params.id_servicio as string)));
    } catch (e) {
      next(e);
    }
  },

  // GET /precios/servicio/:id_servicio/vigente
  vigente: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await precioService.getVigente(BigInt(req.params.id_servicio as string)));
    } catch (e) {
      next(e);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      res.json(await precioService.getById(id));
    } catch (e) {
      next(e);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = PrecioCreateSchema.parse(req.body);
      res.status(201).json(await precioService.create(req.user!, dto));
    } catch (e) {
      next(e);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      const dto = PrecioUpdateSchema.parse(req.body);
      res.json(await precioService.update(req.user!, id, dto));
    } catch (e) {
      next(e);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = PrecioIdSchema.parse(req.params);
      res.json(await precioService.remove(req.user!, id));
    } catch (e) {
      next(e);
    }
  },
};
