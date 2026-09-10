import bcrypt from "bcrypt";
import { signToken } from "../../core/auth/jwt.js";
import type { AuthUser, RoleName } from "../../core/auth/types.js";
import { usuarioRepo } from "../usuario/usuario.repository.js";
import { usuarioService, toPublicUser, type PublicUser } from "../usuario/usuario.service.js";
import type { LoginDto, RegisterDto, UpdateMeDto } from "./auth.schema.js";

export type AuthResponse = { token: string; user: PublicUser };

function buildAuthResponse(user: PublicUser): AuthResponse {
  const authUser: AuthUser = {
    id_user: BigInt(user.id_user),
    email: user.email,
    roles: user.roles as RoleName[],
  };
  return { token: signToken(authUser), user };
}

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await usuarioRepo.getByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Credenciales inválidas" };
    }
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) {
      throw { status: 401, code: "INVALID_CREDENTIALS", message: "Credenciales inválidas" };
    }
    return buildAuthResponse(toPublicUser(user));
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const created = await usuarioService.create({
      email: dto.email,
      password: dto.password,
      nombre: dto.nombre,
      apellido: dto.apellido,
      id_localidad: dto.id_localidad ?? null,
      roles: [dto.rol],
    });
    return buildAuthResponse(created);
  },

  me(user: AuthUser): Promise<PublicUser> {
    return usuarioService.get(user.id_user);
  },

  updateMe(user: AuthUser, dto: UpdateMeDto): Promise<PublicUser> {
    return usuarioService.update(user.id_user, { ...dto, roles: undefined });
  },
};
