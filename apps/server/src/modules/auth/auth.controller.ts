import type { NextFunction, Request, Response } from "express";
import { LoginSchema, RegisterSchema, UpdateMeSchema } from "./auth.schema.js";
import { authService } from "./auth.service.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = LoginSchema.parse(req.body);
    res.json(await authService.login(dto));
  } catch (e) {
    next(e);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = RegisterSchema.parse(req.body);
    res.status(201).json(await authService.register(dto));
  } catch (e) {
    next(e);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.me(req.user!));
  } catch (e) {
    next(e);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = UpdateMeSchema.parse(req.body);
    res.json(await authService.updateMe(req.user!, dto));
  } catch (e) {
    next(e);
  }
};
