import type { NextFunction, Request, Response } from 'express';
import { UsuarioCreateSchema, UsuarioParamsSchema, UsuarioQuerySchema, UsuarioUpdateSchema } from './usuario.schema.js';
import { usuarioService } from './usuario.service.js';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await usuarioService.list(UsuarioQuerySchema.parse(req.query)));
  } catch (e) { next(e); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UsuarioParamsSchema.parse(req.params);
    res.json(await usuarioService.get(id));
  } catch (e) { next(e); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await usuarioService.create(UsuarioCreateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UsuarioParamsSchema.parse(req.params);
    res.json(await usuarioService.update(id, UsuarioUpdateSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = UsuarioParamsSchema.parse(req.params);
    await usuarioService.remove(id);
    res.status(204).send();
  } catch (e) { next(e); }
};
