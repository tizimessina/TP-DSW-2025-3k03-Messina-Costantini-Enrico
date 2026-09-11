import type { NextFunction, Request, Response } from "express";
import { CampoCreateSchema, CampoIdSchema, CampoQuerySchema, CampoUpdateSchema } from "./campo.schema.js";
import { campoService } from "./campo.service.js";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await campoService.list(req.user!, CampoQuerySchema.parse(req.query)));
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
    res.status(201).json(await campoService.create(req.user!, CampoCreateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CampoIdSchema.parse(req.params);
    res.json(await campoService.update(req.user!, id, CampoUpdateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = CampoIdSchema.parse(req.params);
    await campoService.remove(req.user!, id);
    res.status(204).send();
  } catch (e) { next(e); }
};
