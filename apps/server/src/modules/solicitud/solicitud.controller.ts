import type { NextFunction, Request, Response } from "express";
import { CreateSolicitudInputSchema, SolicitudIdSchema, SolicitudQuerySchema, UpdateSolicitudEstadoSchema } from "./solicitud.schema.js";
import { solicitudService } from "./solicitud.service.js";

export const solicitudController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await solicitudService.list(req.user!, SolicitudQuerySchema.parse(req.query)));
    } catch (e) { next(e); }
  },
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      res.json(await solicitudService.getById(req.user!, id));
    } catch (e) { next(e); }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await solicitudService.create(req.user!, CreateSolicitudInputSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  updateEstado: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      res.json(await solicitudService.updateEstado(req.user!, id, UpdateSolicitudEstadoSchema.parse(req.body)));
    } catch (e) { next(e); }
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = SolicitudIdSchema.parse(req.params);
      await solicitudService.delete(req.user!, id);
      res.status(204).send();
    } catch (e) { next(e); }
  },
};
