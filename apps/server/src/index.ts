import { env } from './core/config/env.js';
import { createApp } from './core/http/expressApp.js';

createApp().listen(env.PORT, () =>
  console.log(`API is listening on: http://localhost:${env.PORT} (${env.NODE_ENV})`),
);
