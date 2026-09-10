import type { NextFunction, Request, Response } from "express";
import { solicitudService } from "./solicitud.service.js";
import {
  CreateSolicitudInputSchema,
  SolicitudIdSchema,
  SolicitudQuerySchema,
  UpdateSolicitudEstadoSchema,
} from "./solicitud.schema.js";

export const solicitudController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = SolicitudQuerySchema.parse(req.query);
      res.json(await solicitudService.list(req.user!, query));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      res.json(await solicitudService.getById(req.user!, id));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateSolicitudInputSchema.parse(req.body);
      res.status(201).json(await solicitudService.create(req.user!, parsed));
    } catch (err) {
      next(err);
    }
  },

  async updateEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      const parsed = UpdateSolicitudEstadoSchema.parse(req.body);
      res.json(await solicitudService.updateEstado(req.user!, id, parsed));
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      await solicitudService.delete(req.user!, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
