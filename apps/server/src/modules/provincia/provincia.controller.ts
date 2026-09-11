import type { NextFunction, Request, Response } from 'express';
import { ProvinciaCreateSchema, ProvinciaParamsSchema, ProvinciaQuerySchema, ProvinciaUpdateSchema } from './provincia.schema.js';
import { provinciaService } from './provincia.service.js';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = ProvinciaQuerySchema.parse(req.query);
    res.json(await provinciaService.list(q));
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ProvinciaParamsSchema.parse(req.params);
    res.json(await provinciaService.get(id));
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await provinciaService.create(ProvinciaCreateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ProvinciaParamsSchema.parse(req.params);
    res.json(await provinciaService.update(id, ProvinciaUpdateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = ProvinciaParamsSchema.parse(req.params);
    await provinciaService.remove(id);
    res.status(204).send();
  } catch (e) { next(e); }
};
