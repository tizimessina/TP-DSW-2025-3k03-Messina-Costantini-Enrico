import type { NextFunction, Request, Response } from "express";
import { NotificacionIdSchema, NotificacionQuerySchema } from "./notificacion.schema.js";
import { notificacionService } from "./notificacion.service.js";

export const notificacionController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await notificacionService.list(req.user!, NotificacionQuerySchema.parse(req.query)));
    } catch (e) { next(e); }
  },
  noLeidas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await notificacionService.contarNoLeidas(req.user!));
    } catch (e) { next(e); }
  },
  leer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = NotificacionIdSchema.parse(req.params);
      res.json(await notificacionService.marcarLeida(req.user!, id));
    } catch (e) { next(e); }
  },
  leerTodas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await notificacionService.marcarTodasLeidas(req.user!));
    } catch (e) { next(e); }
  },
};
