/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/index.js"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    // `any` puntual en bordes no tipables (Prisma tx, augmentación de Express,
    // mocks de tests): se avisa pero no rompe el build.
    "@typescript-eslint/no-explicit-any": "warn",
    // Convención del repo: prefijo _ = argumento/variable intencionalmente sin usar.
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    // `declare global { namespace Express }` es la única forma de augmentar Request.
    "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
  },
};
