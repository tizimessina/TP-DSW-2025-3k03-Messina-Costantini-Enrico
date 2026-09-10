import { env } from './core/config/env.js';
import { createApp } from './core/http/expressApp.js';

// Esto lo usamos para evitar el error de BigInt cant be serialized
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

createApp().listen(env.PORT, () =>
  console.log(`API is listening on: http://localhost:${env.PORT} (${env.NODE_ENV})`),
);
