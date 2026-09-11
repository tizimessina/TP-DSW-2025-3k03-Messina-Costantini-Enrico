/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/index.js", "plugin:react-hooks/recommended"],
  ignorePatterns: ["dist", "node_modules", "e2e"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    // Convención del repo: prefijo _ = argumento/variable intencionalmente sin usar.
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
  },
};
