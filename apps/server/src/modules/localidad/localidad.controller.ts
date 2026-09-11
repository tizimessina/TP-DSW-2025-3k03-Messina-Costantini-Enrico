import type { NextFunction, Request, Response } from 'express';
import { LocalidadCreateSchema, LocalidadParamsSchema, LocalidadQuerySchema, LocalidadUpdateSchema } from './localidad.schema.js';
import { localidadService } from './localidad.service.js';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, id_provincia } = LocalidadQuerySchema.parse(req.query);
    res.json(await localidadService.list(q, id_provincia));
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = LocalidadParamsSchema.parse(req.params);
    res.json(await localidadService.get(id));
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await localidadService.create(LocalidadCreateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = LocalidadParamsSchema.parse(req.params);
    res.json(await localidadService.update(id, LocalidadUpdateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = LocalidadParamsSchema.parse(req.params);
    await localidadService.remove(id);
    res.status(204).send();
  } catch (e) { next(e); }
};
