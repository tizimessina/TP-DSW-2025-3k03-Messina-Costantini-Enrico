import bcrypt from 'bcrypt';
import { BUSINESS_ROLES, type RoleName } from '../../core/auth/types.js';
import { badRequest, conflict, notFound, translatePrisma } from '../../core/errors/errors.js';
import { toPage } from '../../core/http/pagination.js';
import type { UsuarioCreateDto, UsuarioQuery, UsuarioUpdateDto } from './usuario.schema.js';
import { usuarioRepo, type UserRow } from './usuario.repository.js';

/** Usuario tal como sale por la API: sin `password_hash`, roles aplanados y perfiles embebidos. */
export type PublicUser = ReturnType<typeof toPublicUser>;

export function toPublicUser(u: UserRow) {
  const { password_hash: _omit, user_roles, productor_profile, contratista_profile, ...rest } = u;
  return {
    ...rest,
    roles: user_roles.map((ur) => ur.roles.name as RoleName),
    productor: productor_profile ? { razon_social: productor_profile.razon_social } : null,
    // Las coordenadas viajan acá porque este payload es el del propio usuario (o
    // el del admin), nunca el listado público de contratistas.
    contratista: contratista_profile
      ? {
          descripcion: contratista_profile.descripcion,
          anios_experiencia: contratista_profile.anios_experiencia,
          latitud: contratista_profile.latitud,
          longitud: contratista_profile.longitud,
        }
      : null,
  };
}

const DUP_EMAIL = conflict('DUPLICATE', 'Ya existe un usuario con ese email o CUIT');
const FK_LOC = badRequest('FK_INVALID', 'La localidad no existe');

/** Un usuario es productor o contratista, nunca ambos. */
export function assertRolesValidos(roles: RoleName[]) {
  const business = roles.filter((r) => BUSINESS_ROLES.includes(r));
  if (business.length > 1) {
    throw badRequest('ROLES_EXCLUYENTES', 'Un usuario no puede ser productor y contratista a la vez');
  }
}

async function resolveRoles(names: RoleName[]) {
  assertRolesValidos(names);
  const map = await usuarioRepo.roleIdsByNames(names);
  const missing = names.filter((n) => !map.has(n));
  if (missing.length) throw badRequest('ROLE_INVALID', `Roles inválidos: ${missing.join(', ')}`);
  return { names, ids: names.map((n) => map.get(n)!) };
}

export const usuarioService = {
  list: async (q: UsuarioQuery) => {
    const { items, total } = await usuarioRepo.list(q);
    return toPage(items.map(toPublicUser), total, q);
  },

  get: async (id: bigint) => {
    const u = await usuarioRepo.getById(id);
    if (!u) throw notFound('Usuario no encontrado');
    return toPublicUser(u);
  },

  create: async (dto: UsuarioCreateDto) => {
    const roles = await resolveRoles(dto.roles);
    const password_hash = await bcrypt.hash(dto.password, 10);
    const { email, password: _p, roles: _r, razon_social, descripcion, anios_experiencia, latitud, longitud, ...persona } = dto;
    const row = await usuarioRepo
      .save(null, { ...persona, email, password_hash }, roles, { razon_social, descripcion, anios_experiencia, latitud, longitud })
      .catch((e) => translatePrisma(e, { P2002: DUP_EMAIL, P2003: FK_LOC }));
    return toPublicUser(row);
  },

  update: async (id: bigint, dto: UsuarioUpdateDto) => {
    const current = await usuarioRepo.getById(id);
    if (!current) throw notFound('Usuario no encontrado');
    const currentRoles = current.user_roles.map((r) => r.roles.name as RoleName);

    let roles: Awaited<ReturnType<typeof resolveRoles>> | undefined;
    if (dto.roles) {
      roles = await resolveRoles(dto.roles);
      // Guard de último admin
      if (currentRoles.includes('ADMIN') && !dto.roles.includes('ADMIN') && (await usuarioRepo.countAdmins()) <= 1) {
        throw conflict('LAST_ADMIN', 'No se puede quitar el rol ADMIN al único administrador');
      }
      // No se puede quitar un rol de negocio con datos asociados
      const deps = await usuarioRepo.countDependencies(id);
      if (currentRoles.includes('PRODUCTOR') && !dto.roles.includes('PRODUCTOR') && deps.campos + deps.solicitudes > 0) {
        throw conflict('IN_USE', 'No se puede quitar el rol PRODUCTOR: tiene campos o solicitudes');
      }
      if (currentRoles.includes('CONTRATISTA') && !dto.roles.includes('CONTRATISTA') && deps.servicios + deps.solicitudes > 0) {
        throw conflict('IN_USE', 'No se puede quitar el rol CONTRATISTA: tiene servicios o solicitudes');
      }
    }

    const password_hash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;
    const { email, password: _p, roles: _r, razon_social, descripcion, anios_experiencia, latitud, longitud, ...persona } = dto;
    const row = await usuarioRepo
      .save(id, { ...persona, email, password_hash }, roles, { razon_social, descripcion, anios_experiencia, latitud, longitud })
      .catch((e) => translatePrisma(e, { P2002: DUP_EMAIL, P2003: FK_LOC }));
    return toPublicUser(row);
  },

  remove: async (id: bigint) => {
    const u = await usuarioRepo.getById(id);
    if (!u) throw notFound('Usuario no encontrado');
    if (u.user_roles.some((r) => r.roles.name === 'ADMIN') && (await usuarioRepo.countAdmins()) <= 1) {
      throw conflict('LAST_ADMIN', 'No se puede eliminar al único administrador');
    }
    const deps = await usuarioRepo.countDependencies(id);
    if (deps.campos + deps.servicios + deps.solicitudes > 0) {
      throw conflict('IN_USE', 'No se puede eliminar: el usuario tiene campos, servicios o solicitudes asociadas');
    }
    await usuarioRepo.remove(id);
  },
};
