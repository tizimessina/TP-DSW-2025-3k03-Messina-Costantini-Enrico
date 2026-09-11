import bcrypt from "bcrypt";
import { prisma } from "@repo/db";
import { signToken } from "../../core/auth/jwt.js";
import type { AuthUser } from "../../core/auth/types.js";
import { badRequest } from "../../core/errors/errors.js";
import { usuarioRepo } from "../usuario/usuario.repository.js";
import { toPublicUser, usuarioService, type PublicUser } from "../usuario/usuario.service.js";
import type { ChangePasswordDto, LoginDto, RegisterDto, UpdateMeDto } from "./auth.schema.js";

export type AuthResponse = { token: string; user: PublicUser };

const INVALID = { status: 401, code: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" };

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await usuarioRepo.getByEmail(dto.email);
    if (!user) throw INVALID;
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw INVALID;
    return { token: signToken(user.id_user), user: toPublicUser(user) };
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { rol, ...rest } = dto;
    const user = await usuarioService.create({ ...rest, roles: [rol] });
    return { token: signToken(user.id_user), user };
  },

  me: (user: AuthUser) => usuarioService.get(user.id_user),

  updateMe: (user: AuthUser, dto: UpdateMeDto) => usuarioService.update(user.id_user, dto),

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    const row = await usuarioRepo.getById(user.id_user);
    if (!row) throw INVALID;
    const ok = await bcrypt.compare(dto.password_actual, row.password_hash);
    if (!ok) throw badRequest("PASSWORD_INCORRECTA", "La contraseña actual no es correcta");
    if (dto.password_actual === dto.password_nueva) throw badRequest("PASSWORD_IGUAL", "La contraseña nueva debe ser distinta");
    await usuarioService.update(user.id_user, { password: dto.password_nueva });
    return { ok: true };
  },

  /** Resumen para el dashboard según el rol. */
  async resumen(user: AuthUser) {
    const esProductor = user.roles.includes("PRODUCTOR");
    const esContratista = user.roles.includes("CONTRATISTA");
    const esAdmin = user.roles.includes("ADMIN");

    const whereSol = esAdmin ? {} : esProductor ? { id_productor: user.id_user } : { id_contratista: user.id_user };
    const porEstado = await prisma.solicitud.groupBy({ by: ["estado"], where: whereSol, _count: { _all: true }, _sum: { precio_total: true } });
    const solicitudes = Object.fromEntries(porEstado.map((r) => [r.estado, { cantidad: r._count._all, total: r._sum.precio_total ?? 0 }]));

    const proximas = await prisma.solicitud.findMany({
      where: { ...whereSol, estado: "aceptada" },
      orderBy: [{ fecha_inicio: "asc" }, { fecha_solicitud: "asc" }],
      take: 5,
      include: { servicio: { select: { id_servicio: true, nombre: true } }, campo: { select: { id_campo: true, nombre: true } } },
    });

    const [campos, servicios, valoracion, usuarios] = await Promise.all([
      esProductor ? prisma.campo.count({ where: { id_productor: user.id_user } }) : Promise.resolve(null),
      esContratista ? prisma.servicio.count({ where: { id_contratista: user.id_user, activo: true } }) : Promise.resolve(null),
      esContratista
        ? prisma.valoracion.aggregate({ where: { solicitud: { id_contratista: user.id_user } }, _avg: { puntaje: true }, _count: { _all: true } })
        : Promise.resolve(null),
      esAdmin ? prisma.users.count() : Promise.resolve(null),
    ]);

    return {
      solicitudes,
      proximas,
      campos,
      servicios,
      valoracion: valoracion ? { promedio: valoracion._avg.puntaje, cantidad: valoracion._count._all } : null,
      usuarios,
    };
  },
};
