import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Routers
import provinciaRouter from '../../modules/provincia/provincia.router.js';
import localidadRouter from '../../modules/localidad/localidad.router.js';
import usuarioRouter from '../../modules/usuario/usuario.router.js';
import authRouter from "../../modules/auth/auth.router.js";
import clienteRouter from "../../modules/cliente/cliente.router.js";
import prestamistaRouter from "../../modules/prestamista/prestamista.router.js";
import adminRouter from "../../modules/admin/admin.router.js";
import { categoriaServicioRouter } from "../../modules/categoria-servicio/categoria-servicio.router.js";
import { insumoRouter } from "../../modules/insumo/insumo.router.js";
import { servicioRouter } from "../../modules/servicio/servicio.router.js";
import { precioRouter } from "../../modules/precio/precio.router.js";
import campoRouter from "../../modules/campo/campo.router.js";
import solicitudRouter from "../../modules/solicitud/solicitud.router.js";

// Middlewares
import { errorMiddleware } from '../errors/errorMiddleware.js';
import { env } from '../config/env.js';
import docsRouter from '../docs/docs.router.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Detrás del proxy de Render: necesario para que rate-limit vea la IP real y req.protocol sea https
  app.set('trust proxy', 1);
  // Headers de seguridad (CSP relajada solo para que Swagger UI cargue sus assets)
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.includes('*') ? true : env.CORS_ORIGIN,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Límite de intentos de login/registro por IP para frenar fuerza bruta
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'test' ? 1000 : 20,
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
  app.use("/auth", authRouter);
  app.use("/clientes", clienteRouter);
  app.use("/prestamistas", prestamistaRouter);
  app.use("/admins", adminRouter);
  app.use("/categorias-servicio", categoriaServicioRouter);
  app.use("/insumos", insumoRouter);
  app.use("/servicios", servicioRouter);
  app.use("/precios", precioRouter);
  app.use("/campos", campoRouter);
  app.use("/solicitudes", solicitudRouter);
  app.use(errorMiddleware);
  return app;
}