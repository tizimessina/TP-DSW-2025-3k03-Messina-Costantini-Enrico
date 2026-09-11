import type { NextFunction, Request, Response } from "express";
import { ChangePasswordSchema, LoginSchema, RegisterSchema, UpdateMeSchema } from "./auth.schema.js";
import { authService } from "./auth.service.js";

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.login(LoginSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await authService.register(RegisterSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.me(req.user!));
  } catch (e) { next(e); }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.updateMe(req.user!, UpdateMeSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.changePassword(req.user!, ChangePasswordSchema.parse(req.body)));
  } catch (e) { next(e); }
};

export const resumen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await authService.resumen(req.user!));
  } catch (e) { next(e); }
};
