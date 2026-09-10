import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/auth/middleware.js';
import * as c from './usuario.controller.js';

const r = Router();

// Gestión de usuarios: solo ADMIN. El registro público vive en POST /auth/register
// y la edición del propio perfil en PUT /auth/me.
r.use(requireAuth, requireRole('ADMIN'));

r.get('/', c.list);
r.get('/:id', c.getById);
r.post('/', c.create);
r.put('/:id', c.update);
r.delete('/:id', c.remove);

export default r;
