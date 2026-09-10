import bcrypt from 'bcrypt';
import type { UsuarioCreateDto, UsuarioUpdateDto } from './usuario.schema.js';
import { usuarioRepo } from './usuario.repository.js';
import { prisma } from '@repo/db';

/** Usuario tal como sale por la API: sin `password_hash` y con los roles aplanados a nombres. */
export type PublicUser = {
  id_user: bigint;
  email: string;
  nombre: string;
  apellido: string;
  cuil_cuit: string | null;
  fecha_nac: Date | null;
  domicilio: string | null;
  id_localidad: bigint | null;
  localidad: unknown | null;
  roles: string[];
  created_at?: Date;
};

export function toPublicUser(u: any): PublicUser {
  const { password_hash: _omit, user_roles, ...rest } = u;
  return {
    ...rest,
    roles: (user_roles ?? []).map((ur: any) => ur.roles?.name).filter(Boolean),
  };
}

async function rolesByNames(names: string[]): Promise<number[]> {
  if (!names.length) return [];
  const rows = await prisma.roles.findMany({ where: { name: { in: names } } });
  const missing = names.filter(n => !rows.some(r => r.name === n));
  if (missing.length) {
    throw { status: 400, code: 'ROLE_INVALID', message: `Roles inválidos: ${missing.join(', ')}` };
  }
  return rows.map(r => Number(r.id_role));
}

/** Crea o elimina los perfiles 1:1 (cliente/prestamista/admin) según los roles del usuario. */
async function syncProfiles(id_user: bigint, roleNames: string[]) {
  const ops: Array<[string, any]> = [
    ['CLIENTE', prisma.cliente_profile],
    ['PRESTAMISTA', prisma.prestamista_profile],
    ['ADMIN', prisma.admin_profile],
  ];
  for (const [role, model] of ops) {
    if (roleNames.includes(role)) {
      await model.upsert({ where: { id_user }, update: {}, create: { id_user } });
    } else {
      await model.deleteMany({ where: { id_user } });
    }
  }
}

export const usuarioService = {
  list: async (q?: string, id_localidad?: bigint, roleName?: string): Promise<PublicUser[]> =>
    (await usuarioRepo.list(q, id_localidad, roleName)).map(toPublicUser),

  get: async (id: bigint): Promise<PublicUser> => {
    const u = await usuarioRepo.getById(id);
    if (!u) throw { status: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' };
    return toPublicUser(u);
  },

  create: async (dto: UsuarioCreateDto): Promise<PublicUser> => {
    try {
      const password_hash = await bcrypt.hash(dto.password, 10);
      const roleNames = dto.roles ?? [];
      const roleIds = await rolesByNames(roleNames);

      const createdUser = await usuarioRepo.create({
        email: dto.email.toLowerCase().trim(),
        password_hash,
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        cuil_cuit: dto.cuil_cuit?.trim() ?? null,
        fecha_nac: dto.fecha_nac ? new Date(dto.fecha_nac) : null,
        domicilio: dto.domicilio?.trim() ?? null,
        id_localidad: dto.id_localidad ?? null,
        roleIds,
      });

      await syncProfiles(createdUser.id_user, roleNames);
      return toPublicUser(createdUser);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw { status: 409, code: 'DUPLICATE', message: 'Email ya registrado' };
      }
      if (e.code === 'P2003') {
        throw { status: 400, code: 'FK_INVALID', message: 'Localidad inexistente' };
      }
      throw e;
    }
  },

  update: async (id: bigint, dto: UsuarioUpdateDto): Promise<PublicUser> => {
    await usuarioService.get(id); // asegura 404 si no existe

    try {
      const password_hash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
      const replaceRoleIds = dto.roles ? await rolesByNames(dto.roles) : undefined;

      const updated = await usuarioRepo.update(id, {
        email: dto.email?.toLowerCase().trim(),
        password_hash,
        nombre: dto.nombre?.trim(),
        apellido: dto.apellido?.trim(),
        cuil_cuit: dto.cuil_cuit?.trim() ?? (dto.cuil_cuit === null ? null : undefined),
        fecha_nac: dto.fecha_nac ? new Date(dto.fecha_nac) : (dto.fecha_nac === null ? null : undefined),
        domicilio: dto.domicilio?.trim() ?? (dto.domicilio === null ? null : undefined),
        id_localidad: dto.id_localidad ?? (dto.id_localidad === null ? null : undefined),
        replaceRoleIds,
      });

      if (dto.roles) await syncProfiles(id, dto.roles);
      return toPublicUser(updated);
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw { status: 409, code: 'DUPLICATE', message: 'Email ya registrado' };
      }
      if (e.code === 'P2003') {
        throw { status: 400, code: 'FK_INVALID', message: 'Localidad inexistente' };
      }
      throw e;
    }
  },

  remove: async (id: bigint) => {
    await usuarioService.get(id);
    try {
      return await usuarioRepo.remove(id);
    } catch (e: any) {
      if (e.code === 'P2003') {
        throw {
          status: 409,
          code: 'IN_USE',
          message: 'No se puede eliminar: el usuario tiene servicios, campos o solicitudes asociadas',
        };
      }
      throw e;
    }
  },
};
