import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Routers
import provinciaRouter from '../../modules/provincia/provincia.router.js';
import localidadRouter from '../../modules/localidad/localidad.router.js';
import usuarioRouter from '../../modules/usuario/usuario.router.js';
import authRouter from '../../modules/auth/auth.router.js';
import contratistaRouter from '../../modules/contratista/contratista.router.js';
import { categoriaServicioRouter } from '../../modules/categoria-servicio/categoria-servicio.router.js';
import { insumoRouter } from '../../modules/insumo/insumo.router.js';
import { servicioRouter } from '../../modules/servicio/servicio.router.js';
import { precioRouter } from '../../modules/precio/precio.router.js';
import campoRouter from '../../modules/campo/campo.router.js';
import solicitudRouter from '../../modules/solicitud/solicitud.router.js';
import valoracionRouter from '../../modules/valoracion/valoracion.router.js';

// Middlewares
import { errorMiddleware } from '../errors/errorMiddleware.js';
import { env } from '../config/env.js';
import docsRouter from '../docs/docs.router.js';

// Los IDs son BigInt en Prisma: se serializan como number en JSON.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.CORS_ORIGIN.includes('*') ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Rate limiting solo en producción (en dev/test, los e2e y las pruebas manuales superan el límite enseguida)
  const limiterMessage = { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas solicitudes, probá de nuevo más tarde' };
  const isProd = env.NODE_ENV === 'production';
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: isProd ? 600 : 100000, standardHeaders: 'draft-7', legacyHeaders: false, message: limiterMessage }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProd ? 20 : 100000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos, probá de nuevo en 15 minutos' },
  });
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', authLimiter);

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/docs', docsRouter);
  app.use('/provincias', provinciaRouter);
  app.use('/localidades', localidadRouter);
  app.use('/usuarios', usuarioRouter);
  app.use('/auth', authRouter);
  app.use('/contratistas', contratistaRouter);
  app.use('/categorias-servicio', categoriaServicioRouter);
  app.use('/insumos', insumoRouter);
  app.use('/servicios', servicioRouter);
  app.use('/precios', precioRouter);
  app.use('/campos', campoRouter);
  app.use('/solicitudes', solicitudRouter);
  app.use('/valoraciones', valoracionRouter);

  // 404 en JSON para cualquier ruta desconocida
  app.use((req, res) => res.status(404).json({ code: 'NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.path}` }));
  app.use(errorMiddleware);
  return app;
}
