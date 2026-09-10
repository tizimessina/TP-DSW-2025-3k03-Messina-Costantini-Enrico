// Carga apps/server/.env (y como fallback packages/database/.env) ANTES de que se
// instancie el cliente de Prisma, para que los tests usen la base local y no otra.
import "../src/core/config/env.js";
