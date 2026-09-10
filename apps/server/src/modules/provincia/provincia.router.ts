import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/auth/middleware.js';
import * as c from './provincia.controller.js';

const r = Router();
const adminOnly = [requireAuth, requireRole('ADMIN')];

r.get('/', c.list);
r.get('/:id', c.getById);
r.post('/', adminOnly, c.create);
r.put('/:id', adminOnly, c.update);
r.delete('/:id', adminOnly, c.remove);

export default r;
