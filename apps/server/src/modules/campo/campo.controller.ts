import type { NextFunction, Request, Response } from "express";
import {
  CampoIdSchema,
  CampoQuerySchema,
  CampoCreateSchema,
  CampoUpdateSchema,
} from "./campo.schema.js";
import { campoService } from "./campo.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, id_cliente, page, pageSize } = CampoQuerySchema.parse(req.query);
    res.json(await campoService.list(req.user!, q, id_cliente, page, pageSize));
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CampoIdSchema.parse(req.params);
    res.json(await campoService.get(req.user!, id));
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CampoCreateSchema.parse(req.body);
    res.status(201).json(await campoService.create(req.user!, dto));
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CampoIdSchema.parse(req.params);
    const dto = CampoUpdateSchema.parse(req.body);
    res.json(await campoService.update(req.user!, id, dto));
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CampoIdSchema.parse(req.params);
    await campoService.remove(req.user!, id);
    res.status(204).send();
  } catch (e) { next(e); }
};
