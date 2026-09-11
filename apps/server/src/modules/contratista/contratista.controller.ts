import type { NextFunction, Request, Response } from "express";
import { ContratistaParamsSchema, ContratistaQuerySchema, VerificarSchema } from "./contratista.schema.js";
import { contratistaService } from "./contratista.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await contratistaService.list(ContratistaQuerySchema.parse(req.query)));
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ContratistaParamsSchema.parse(req.params);
    res.json(await contratistaService.get(id));
  } catch (e) { next(e); }
};

export const verificar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ContratistaParamsSchema.parse(req.params);
    const { verificado } = VerificarSchema.parse(req.body);
    res.json(await contratistaService.setVerificado(id, verificado));
  } catch (e) { next(e); }
};
